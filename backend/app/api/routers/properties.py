from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import require_landlord, require_admin
from app.core.storage import cleanup_entity_images
from app.schemas.property import PropertyCreate, PropertyUpdate

router = APIRouter(prefix="/properties", tags=["properties"])


# ── Inline request bodies ──────────────────────────────────────────────────────

class RejectPropertyRequest(BaseModel):
    reason: str
    admin_notes: Optional[str] = None


# ── Helpers ────────────────────────────────────────────────────────────────────

def _assert_owns(prop: dict, user: dict) -> None:
    """Raise 403 if the current user is not the property's landlord."""
    if str(prop["landlord_id"]) != str(user["id"]):
        raise HTTPException(
            status_code=403, detail="You do not own this property.")


def _fetch_with_images(db, properties: list[dict]) -> list[dict]:
    """
    Attach property images to a list of property dicts.
    Images table has no FK to properties so we query separately.
    """
    if not properties:
        return properties
    ids = [str(p["id"]) for p in properties]
    img_result = (
        db.table("images")
        .select("*")
        .in_("entity_id", ids)
        .eq("entity_type", "PROPERTY")
        .execute()
    )
    img_map: dict[str, list] = {}
    for img in img_result.data:
        img_map.setdefault(str(img["entity_id"]), []).append(img)

    for prop in properties:
        prop["images"] = img_map.get(str(prop["id"]), [])
    return properties


# ── Landlord endpoints ─────────────────────────────────────────────────────────

@router.get("/my")
async def my_properties(user: dict = Depends(require_landlord)):
    """List all properties (with rooms + images) belonging to the current landlord."""
    db = get_db()
    result = (
        db.table("properties")
        .select("*, rooms(*)")
        .eq("landlord_id", user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return _fetch_with_images(db, result.data)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_property(
    data: PropertyCreate,
    user: dict = Depends(require_landlord),
):
    """
    Landlord — create a new property listing.
    Starts as PENDING; admin must approve before it appears in public listings.
    """
    db = get_db()

    # mode="json" serialises enums to their string values
    payload = data.model_dump(mode="json")
    payload["landlord_id"] = user["id"]
    payload["verification_status"] = "PENDING"
    payload["is_active"] = True

    result = db.table("properties").insert(payload).select().execute()
    return result.data[0]


@router.put("/{property_id}")
async def update_property(
    property_id: str,
    data: PropertyUpdate,
    user: dict = Depends(require_landlord),
):
    """
    Landlord — update own property.
    Editing an APPROVED property resets it to PENDING for re-review.
    """
    db = get_db()

    prop_result = db.table("properties").select(
        "*").eq("id", property_id).execute()
    if not prop_result.data:
        raise HTTPException(status_code=404, detail="Property not found.")

    prop = prop_result.data[0]
    _assert_owns(prop, user)

    update_payload = data.model_dump(mode="json", exclude_none=True)
    if not update_payload:
        raise HTTPException(status_code=422, detail="No fields to update.")

    # Re-trigger moderation whenever an approved property is changed.
    # Preserve revision_note from the payload (landlord explanation for admin).
    if prop.get("verification_status") == "APPROVED":
        update_payload["verification_status"] = "PENDING"
        update_payload["verified_at"] = None
        update_payload["verified_by"] = None
        # revision_note is already in update_payload if the landlord supplied one;
        # if they didn't, clear any stale note from a previous cycle.
        if "revision_note" not in update_payload:
            update_payload["revision_note"] = None

    result = db.table("properties").update(
        update_payload).eq("id", property_id).select().execute()
    return result.data[0]


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(
    property_id: str,
    user: dict = Depends(require_landlord),
):
    """Landlord — delete own property (rooms + images cascade via DB)."""
    db = get_db()

    prop_result = db.table("properties").select(
        "landlord_id").eq("id", property_id).execute()
    if not prop_result.data:
        raise HTTPException(status_code=404, detail="Property not found.")

    _assert_owns(prop_result.data[0], user)

    # ── Clean up images before deletion (no FK cascade on images table) ───────
    # 1. Get all room IDs belonging to this property
    rooms_result = db.table("rooms").select("id").eq(
        "property_id", property_id).execute()
    room_ids = [str(r["id"]) for r in rooms_result.data]

    # 2. Delete room images (storage + DB records)
    cleanup_entity_images(db, room_ids, "ROOM")

    # 3. Delete property images (storage + DB records)
    cleanup_entity_images(db, [property_id], "PROPERTY")

    # 4. Delete property — rooms cascade via FK
    db.table("properties").delete().eq("id", property_id).execute()


# ── Admin endpoints ────────────────────────────────────────────────────────────

@router.get("/pending")
async def list_pending_properties(admin: dict = Depends(require_admin)):
    """Admin — list all properties awaiting moderation (with rooms + images)."""
    db = get_db()
    result = (
        db.table("properties")
        .select("*, rooms(*)")
        .eq("verification_status", "PENDING")
        .order("created_at", desc=True)
        .execute()
    )
    return _fetch_with_images(db, result.data)


@router.post("/{property_id}/approve")
async def approve_property(
    property_id: str,
    admin: dict = Depends(require_admin),
):
    """Admin — approve a pending property, making it visible in public listings."""
    db = get_db()

    prop_result = db.table("properties").select(
        "id").eq("id", property_id).execute()
    if not prop_result.data:
        raise HTTPException(status_code=404, detail="Property not found.")

    result = db.table("properties").update({
        "verification_status": "APPROVED",
        "verified_at": datetime.now(timezone.utc).isoformat(),
        "verified_by": admin["id"],
        "rejected_at": None,
        "rejected_by": None,
        "rejection_reason": None,
    }).eq("id", property_id).select().execute()

    return result.data[0]


@router.post("/{property_id}/reject")
async def reject_property(
    property_id: str,
    body: RejectPropertyRequest,
    admin: dict = Depends(require_admin),
):
    """Admin — reject a pending property with a mandatory reason."""
    db = get_db()

    prop_result = db.table("properties").select(
        "id").eq("id", property_id).execute()
    if not prop_result.data:
        raise HTTPException(status_code=404, detail="Property not found.")

    result = db.table("properties").update({
        "verification_status": "REJECTED",
        "rejected_at": datetime.now(timezone.utc).isoformat(),
        "rejected_by": admin["id"],
        "rejection_reason": body.reason,
        "admin_notes": body.admin_notes,
    }).eq("id", property_id).select().execute()

    return result.data[0]
