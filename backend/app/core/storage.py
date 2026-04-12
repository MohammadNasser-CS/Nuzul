"""
Supabase Storage helpers shared across routers.
Handles image cleanup (storage files + DB records) when entities are deleted.
"""
import logging

logger = logging.getLogger(__name__)

BUCKET = "nuzul-images"


def cleanup_entity_images(db, entity_ids: list[str], entity_type: str) -> None:
    """
    Delete all image records and their Supabase Storage files for a list of
    entity IDs (properties or rooms).

    Call this BEFORE deleting the parent entity, because the images table has
    no FK constraint to properties/rooms (polymorphic entity_id design).

    Args:
        db          : service-role Supabase client (from get_db())
        entity_ids  : list of UUID strings to clean up
        entity_type : "PROPERTY" | "ROOM"
    """
    if not entity_ids:
        return

    result = (
        db.table("images")
        .select("id, storage_path")
        .in_("entity_id", entity_ids)
        .eq("entity_type", entity_type)
        .execute()
    )
    if not result.data:
        return

    # ── Delete storage files (batch) ──────────────────────────────────────────
    storage_paths = [r["storage_path"] for r in result.data if r.get("storage_path")]
    if storage_paths:
        try:
            db.storage.from_(BUCKET).remove(storage_paths)
        except Exception as exc:
            # Log but continue — orphaned storage files are recoverable manually;
            # orphaned DB records are harder to track down.
            logger.warning(
                f"Storage cleanup failed for {entity_type} ids={entity_ids}: {exc}"
            )

    # ── Delete image DB records ───────────────────────────────────────────────
    image_ids = [r["id"] for r in result.data]
    db.table("images").delete().in_("id", image_ids).execute()
