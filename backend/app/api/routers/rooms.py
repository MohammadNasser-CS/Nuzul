from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import get_db
from app.core.security import require_landlord
from app.core.storage import cleanup_entity_images
from app.schemas.room import RoomCreate, RoomUpdate

router = APIRouter(prefix="/rooms", tags=["rooms"])


# ── Helpers ────────────────────────────────────────────────────────────────────

def _assert_room_ownership(room: dict, user: dict, db) -> dict:
    """
    Verify the landlord owns the property this room belongs to.
    Returns the parent property row.
    """
    prop_result = (
        db.table("properties")
        .select("id, landlord_id, verification_status")
        .eq("id", room["property_id"])
        .execute()
    )
    if not prop_result.data:
        raise HTTPException(
            status_code=404, detail="Parent property not found.")
    prop = prop_result.data[0]
    if str(prop["landlord_id"]) != str(user["id"]):
        raise HTTPException(
            status_code=403, detail="You do not own this property.")
    return prop


def _reset_moderation_if_approved(db, prop: dict) -> None:
    """
    If the parent property is currently APPROVED, reset it to PENDING.
    Changing rooms counts as editing the listing — re-review is required.
    """
    if prop.get("verification_status") == "APPROVED":
        db.table("properties").update({
            "verification_status": "PENDING",
            "verified_at": None,
            "verified_by": None,
        }).eq("id", prop["id"]).execute()


# ── Public ─────────────────────────────────────────────────────────────────────

@router.get("/{room_id}")
async def get_room(room_id: str):
    """
    Public — get a single room by ID with its images.
    Only returns the room if its parent property is APPROVED and active.
    """
    db = get_db()

    room_result = db.table("rooms").select("*").eq("id", room_id).execute()
    if not room_result.data:
        raise HTTPException(status_code=404, detail="Room not found.")

    room = room_result.data[0]

    # Ensure the parent property is publicly visible
    prop_result = (
        db.table("properties")
        .select("verification_status, is_active")
        .eq("id", room["property_id"])
        .execute()
    )
    if not prop_result.data:
        raise HTTPException(status_code=404, detail="Property not found.")

    prop = prop_result.data[0]
    if prop["verification_status"] != "APPROVED" or not prop["is_active"]:
        raise HTTPException(
            status_code=404, detail="Property is not approved yet or inactive.")

    room["is_available"] = room.get("available_beds", 0) > 0

    images_result = (
        db.table("images")
        .select("*")
        .eq("entity_id", room_id)
        .eq("entity_type", "ROOM")
        .execute()
    )
    room["images"] = images_result.data

    return room


# ── Landlord ───────────────────────────────────────────────────────────────────

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_room(
    data: RoomCreate,
    user: dict = Depends(require_landlord),
):
    """
    Landlord — add a room to one of their properties.
    If the property was APPROVED, adding a room resets it to PENDING for re-review.
    """
    db = get_db()

    # Verify ownership
    prop_result = (
        db.table("properties")
        .select("id, landlord_id, verification_status")
        .eq("id", str(data.property_id))
        .execute()
    )
    if not prop_result.data:
        raise HTTPException(status_code=404, detail="Property not found.")
    prop = prop_result.data[0]
    if str(prop["landlord_id"]) != str(user["id"]):
        raise HTTPException(
            status_code=403, detail="You do not own this property.")

    payload = data.model_dump(mode="json")
    payload["property_id"] = str(payload["property_id"])
    payload["is_active"] = True

    result = db.table("rooms").insert(payload).execute()
    room = result.data[0]
    room["is_available"] = room.get("available_beds", 0) > 0

    # Re-trigger moderation if property was already approved
    _reset_moderation_if_approved(db, prop)

    return room


@router.put("/{room_id}")
async def update_room(
    room_id: str,
    data: RoomUpdate,
    user: dict = Depends(require_landlord),
):
    """
    Landlord — update a room they own.
    If the parent property was APPROVED, this resets it to PENDING for re-review.
    """
    db = get_db()

    room_result = db.table("rooms").select("*").eq("id", room_id).execute()
    if not room_result.data:
        raise HTTPException(status_code=404, detail="Room not found.")

    room = room_result.data[0]
    prop = _assert_room_ownership(room, user, db)

    update_payload = data.model_dump(mode="json", exclude_none=True)
    if not update_payload:
        raise HTTPException(status_code=422, detail="No fields to update.")

    # Validate bed count consistency against merged (existing + incoming) values
    final_total = update_payload.get("number_of_beds", room["number_of_beds"])
    final_available = update_payload.get(
        "available_beds", room["available_beds"])
    if final_available < 0:
        raise HTTPException(
            status_code=422, detail="available_beds cannot be negative.")
    if final_available > final_total:
        raise HTTPException(
            status_code=422,
            detail="available_beds cannot exceed number_of_beds.",
        )

    result = db.table("rooms").update(
        update_payload).eq("id", room_id).execute()
    room = result.data[0]
    room["is_available"] = room.get("available_beds", 0) > 0

    # Re-trigger moderation if property was already approved
    _reset_moderation_if_approved(db, prop)

    return room


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(
    room_id: str,
    user: dict = Depends(require_landlord),
):
    """
    Landlord — delete a room they own.
    Note: deleting a room does NOT re-trigger moderation (it reduces the listing,
    not expands it).
    """
    db = get_db()

    room_result = db.table("rooms").select("*").eq("id", room_id).execute()
    if not room_result.data:
        raise HTTPException(status_code=404, detail="Room not found.")

    _assert_room_ownership(room_result.data[0], user, db)

    # Clean up room images (storage + DB records) before deleting the room
    cleanup_entity_images(db, [room_id], "ROOM")

    db.table("rooms").delete().eq("id", room_id).execute()
