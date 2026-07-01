import logging
import uuid as uuid_lib
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.core.database import get_db
from app.core.security import require_landlord
from app.core.storage import BUCKET
from app.models.property import ImageEntityType

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/images", tags=["images"])

# ── Constants ──────────────────────────────────────────────────────────────────

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024          # 5 MB
MAX_ROOM_IMAGES = 5
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}

# Maps entity_type → storage folder prefix
STORAGE_FOLDER: dict[str, str] = {
    "PROPERTY": "properties",
    "ROOM": "rooms",
    "AVATAR": "avatars",
}


# ── Helpers ────────────────────────────────────────────────────────────────────

def _assert_entity_ownership(
    entity_id: str, entity_type: ImageEntityType, user: dict, db
) -> None:
    """Raise 403 if the requesting landlord does not own the entity."""
    if entity_type == ImageEntityType.PROPERTY:
        result = (
            db.table("properties").select(
                "landlord_id").eq("id", entity_id).execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Property not found.")
        if str(result.data[0]["landlord_id"]) != str(user["id"]):
            raise HTTPException(
                status_code=403, detail="You do not own this property.")

    elif entity_type == ImageEntityType.ROOM:
        room_result = (
            db.table("rooms").select("property_id").eq(
                "id", entity_id).execute()
        )
        if not room_result.data:
            raise HTTPException(status_code=404, detail="Room not found.")
        prop_id = room_result.data[0]["property_id"]
        prop_result = (
            db.table("properties").select(
                "landlord_id").eq("id", prop_id).execute()
        )
        if not prop_result.data or str(prop_result.data[0]["landlord_id"]) != str(user["id"]):
            raise HTTPException(
                status_code=403, detail="You do not own this room's property."
            )


def _build_storage_path(entity_type: str, entity_id: str, filename: str) -> str:
    """
    Build the Supabase Storage path for a file.
    Format: {folder}/{entity_id}/{uuid}.{ext}
    Example: properties/abc-123/f47ac10b-dead-beef.jpg
    """
    ext = "jpg"
    if "." in filename:
        raw_ext = filename.rsplit(".", 1)[-1].lower()
        if raw_ext in ("jpg", "jpeg", "png", "webp"):
            ext = raw_ext

    folder = STORAGE_FOLDER.get(entity_type.upper(), "misc")
    return f"{folder}/{entity_id}/{uuid_lib.uuid4()}.{ext}"


# ── Upload endpoint ────────────────────────────────────────────────────────────

@router.post("/", status_code=status.HTTP_201_CREATED)
async def upload_image(
    entity_id: Annotated[str, Form()],
    entity_type: Annotated[str, Form()],
    is_primary: Annotated[bool, Form()] = False,
    file: UploadFile = File(...),
    user: dict = Depends(require_landlord),
):
    """
    Landlord — upload an image to Supabase Storage and link it to a property or room.

    Form fields:
      - entity_id   : UUID of the property or room
      - entity_type : "PROPERTY" | "ROOM"
      - is_primary  : true/false (only meaningful for PROPERTY images)
      - file        : image file (JPEG / PNG / WebP, max 5 MB)

    Rules:
      - Rooms      : max 5 images, is_primary is ignored
      - Properties : any number of images, only 1 can be primary
                     (uploading a new primary auto-demotes the old one)
    """
    db = get_db()

    # ── Validate entity_type ──────────────────────────────────────────────────
    try:
        entity_type_enum = ImageEntityType(entity_type.upper())
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=f"entity_type must be one of: {[e.value for e in ImageEntityType]}",
        )

    # ── Validate ownership ────────────────────────────────────────────────────
    _assert_entity_ownership(entity_id, entity_type_enum, user, db)

    # ── Validate file type ────────────────────────────────────────────────────
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type '{file.content_type}'. "
                   f"Allowed: JPEG, PNG, WebP.",
        )

    # ── Read + validate file size ─────────────────────────────────────────────
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=422,
            detail=f"File too large ({len(content) // 1024} KB). Maximum allowed is 5 MB.",
        )

    # ── Room: enforce max image count ─────────────────────────────────────────
    if entity_type_enum == ImageEntityType.ROOM:
        count_result = (
            db.table("images")
            .select("id", count="exact")
            .eq("entity_id", entity_id)
            .eq("entity_type", "ROOM")
            .execute()
        )
        if (count_result.count or 0) >= MAX_ROOM_IMAGES:
            raise HTTPException(
                status_code=422,
                detail=f"A room can have at most {MAX_ROOM_IMAGES} images.",
            )

    # ── Property: demote existing primary before promoting new one ────────────
    if entity_type_enum == ImageEntityType.PROPERTY and is_primary:
        db.table("images").update({"is_primary": False}).eq(
            "entity_id", entity_id
        ).eq("entity_type", "PROPERTY").eq("is_primary", True).execute()

    # ── Upload to Supabase Storage ────────────────────────────────────────────
    filename = file.filename or "image"
    storage_path = _build_storage_path(
        entity_type_enum.value, entity_id, filename)

    try:
        db.storage.from_(BUCKET).upload(
            path=storage_path,
            file=content,
            file_options={"content-type": file.content_type},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Storage upload failed: {exc}",
        )

    public_url = db.storage.from_(BUCKET).get_public_url(storage_path)

    # ── Persist record in images table ────────────────────────────────────────
    payload = {
        "entity_id": entity_id,
        "entity_type": entity_type_enum.value,
        "image_url": public_url,
        "storage_path": storage_path,
        "is_primary": is_primary if entity_type_enum == ImageEntityType.PROPERTY else False,
    }

    result = db.table("images").insert(payload).execute()
    return result.data[0]


# ── Delete endpoint ────────────────────────────────────────────────────────────

@router.delete("/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_image(
    image_id: str,
    user: dict = Depends(require_landlord),
):
    """
    Landlord — delete an image they own.
    Removes the file from Supabase Storage AND the record from the images table.
    """
    db = get_db()

    img_result = db.table("images").select("*").eq("id", image_id).execute()
    if not img_result.data:
        raise HTTPException(status_code=404, detail="Image not found.")

    img = img_result.data[0]
    _assert_entity_ownership(
        str(img["entity_id"]), ImageEntityType(img["entity_type"]), user, db
    )

    # ── Delete from Supabase Storage first ────────────────────────────────────
    storage_path = img.get("storage_path")
    if storage_path:
        try:
            db.storage.from_(BUCKET).remove([storage_path])
        except Exception as exc:
            # Log but don't block DB deletion — orphaned storage files are
            # recoverable; an orphaned DB record is harder to clean up.
            logger.warning(
                f"Storage delete failed for path '{storage_path}': {exc}")

    # ── Delete DB record ──────────────────────────────────────────────────────
    db.table("images").delete().eq("id", image_id).execute()
