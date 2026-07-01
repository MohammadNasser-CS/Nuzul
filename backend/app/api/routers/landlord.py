"""
Landlord dashboard router  —  /api/v1/landlord/*

All endpoints require role = LANDLORD with a completed profile.
Ownership is enforced on every mutating operation: a landlord can only
view / edit / delete their own properties, rooms, and images.

Edit rule (Trello spec):
  If a property is APPROVED and the landlord edits it (or its rooms),
  verification_status is reset to PENDING for admin re-review.
"""

import logging
import uuid as uuid_lib
from datetime import datetime, timezone
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status

from app.core.database import get_db
from app.core.security import require_landlord
from app.core.storage import BUCKET, cleanup_entity_images
from app.models.property import ImageEntityType
from app.schemas.property import PropertyCreate, PropertyUpdate
from app.schemas.room import RoomCreate, RoomUpdate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/landlord", tags=["landlord"])

# ── Image upload constants ────────────────────────────────────────────────────
MAX_FILE_SIZE    = 5 * 1024 * 1024          # 5 MB
MAX_ROOM_IMAGES  = 5
ALLOWED_MIME     = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
STORAGE_FOLDER   = {"PROPERTY": "properties", "ROOM": "rooms"}


# ═══════════════════════════════════════════════════════════════════════════════
# Shared helpers
# ═══════════════════════════════════════════════════════════════════════════════

def _own_property(db, property_id: str, user: dict) -> dict:
    """
    Fetch a property and assert the current user is its landlord.
    Raises 404 if missing, 403 if not the owner.
    """
    result = db.table("properties").select("*").eq("id", property_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Property not found.")
    prop = result.data[0]
    if str(prop["landlord_id"]) != str(user["id"]):
        raise HTTPException(status_code=403, detail="You do not own this property.")
    return prop


def _own_room(db, room_id: str, user: dict) -> tuple[dict, dict]:
    """
    Fetch a room and assert the current user owns its parent property.
    Returns (room, parent_property).
    """
    room_result = db.table("rooms").select("*").eq("id", room_id).execute()
    if not room_result.data:
        raise HTTPException(status_code=404, detail="Room not found.")
    room = room_result.data[0]
    prop = _own_property(db, str(room["property_id"]), user)
    return room, prop


def _reset_to_pending(db, prop: dict) -> None:
    """
    If the property is APPROVED, reset to PENDING for admin re-review.
    Called after any edit that changes the listing content.
    """
    if prop.get("verification_status") == "APPROVED":
        db.table("properties").update({
            "verification_status": "PENDING",
            "verified_at":         None,
            "verified_by":         None,
        }).eq("id", prop["id"]).execute()


def _with_property_images(db, properties: list[dict]) -> list[dict]:
    """Attach PROPERTY image records to each property dict."""
    if not properties:
        return properties
    ids = [str(p["id"]) for p in properties]
    imgs = (
        db.table("images")
        .select("*")
        .in_("entity_id", ids)
        .eq("entity_type", "PROPERTY")
        .execute()
        .data
    )
    img_map: dict[str, list] = {}
    for img in imgs:
        img_map.setdefault(str(img["entity_id"]), []).append(img)
    for prop in properties:
        prop["images"] = img_map.get(str(prop["id"]), [])
    return properties


def _with_room_images(db, rooms: list[dict]) -> list[dict]:
    """Attach ROOM image records to each room dict and compute is_available."""
    if not rooms:
        return rooms
    ids = [str(r["id"]) for r in rooms]
    imgs = (
        db.table("images")
        .select("*")
        .in_("entity_id", ids)
        .eq("entity_type", "ROOM")
        .execute()
        .data
    )
    img_map: dict[str, list] = {}
    for img in imgs:
        img_map.setdefault(str(img["entity_id"]), []).append(img)
    for room in rooms:
        room["images"]       = img_map.get(str(room["id"]), [])
        room["is_available"] = room.get("available_beds", 0) > 0
    return rooms


def _storage_path(entity_type: str, entity_id: str, filename: str) -> str:
    ext = "jpg"
    if "." in filename:
        raw = filename.rsplit(".", 1)[-1].lower()
        if raw in ("jpg", "jpeg", "png", "webp"):
            ext = raw
    folder = STORAGE_FOLDER.get(entity_type.upper(), "misc")
    return f"{folder}/{entity_id}/{uuid_lib.uuid4()}.{ext}"


def _get_landlord_property_ids(db, landlord_id: str) -> list[str]:
    """Return all property IDs owned by this landlord."""
    result = (
        db.table("properties")
        .select("id")
        .eq("landlord_id", landlord_id)
        .execute()
    )
    return [str(p["id"]) for p in result.data]


# ═══════════════════════════════════════════════════════════════════════════════
# Dashboard
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/dashboard")
async def landlord_dashboard(user: dict = Depends(require_landlord)):
    """
    Overview statistics for the landlord's dashboard.

    Response:
        {
          "total_properties": 3,
          "total_rooms":      10,
          "total_inquiries":  25
        }
    """
    db = get_db()

    property_ids = _get_landlord_property_ids(db, user["id"])
    total_properties = len(property_ids)
    total_rooms      = 0
    total_inquiries  = 0

    if property_ids:
        rooms_res = (
            db.table("rooms")
            .select("id", count="exact")
            .in_("property_id", property_ids)
            .eq("is_active", True)
            .execute()
        )
        total_rooms = rooms_res.count or 0

        inq_res = (
            db.table("inquiries")
            .select("id", count="exact")
            .in_("property_id", property_ids)
            .execute()
        )
        total_inquiries = inq_res.count or 0

    return {
        "total_properties": total_properties,
        "total_rooms":      total_rooms,
        "total_inquiries":  total_inquiries,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# Properties
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/properties")
async def list_properties(user: dict = Depends(require_landlord)):
    """
    List all properties (with rooms + images) belonging to the current landlord.
    Includes all verification statuses (PENDING / APPROVED / REJECTED).
    """
    db = get_db()
    result = (
        db.table("properties")
        .select("*, rooms(*)")
        .eq("landlord_id", user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return _with_property_images(db, result.data)


@router.post("/properties", status_code=status.HTTP_201_CREATED)
async def create_property(
    data: PropertyCreate,
    user: dict = Depends(require_landlord),
):
    """
    Create a new property listing.
    Always starts as PENDING — admin must approve before it appears publicly.
    """
    db = get_db()
    payload = data.model_dump(mode="json")
    payload["landlord_id"]           = user["id"]
    payload["verification_status"]   = "PENDING"
    payload["is_active"]             = True
    result = db.table("properties").insert(payload).select().execute()
    return result.data[0]


@router.put("/properties/{property_id}")
async def update_property(
    property_id: str,
    data: PropertyUpdate,
    user: dict = Depends(require_landlord),
):
    """
    Update an owned property.
    If the property is currently APPROVED, editing resets it to PENDING for re-review.
    """
    db = get_db()
    prop = _own_property(db, property_id, user)

    payload = data.model_dump(mode="json", exclude_none=True)
    if not payload:
        raise HTTPException(status_code=422, detail="No fields provided to update.")

    if prop.get("verification_status") == "APPROVED":
        payload["verification_status"] = "PENDING"
        payload["verified_at"]         = None
        payload["verified_by"]         = None

    result = db.table("properties").update(payload).eq("id", property_id).select().execute()
    return result.data[0]


@router.delete("/properties/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(
    property_id: str,
    user: dict = Depends(require_landlord),
):
    """
    Delete an owned property.
    Cleans up all room images and property images from storage first,
    then deletes the property row (rooms cascade via FK).
    """
    db = get_db()
    _own_property(db, property_id, user)

    rooms_result = db.table("rooms").select("id").eq("property_id", property_id).execute()
    room_ids     = [str(r["id"]) for r in rooms_result.data]

    cleanup_entity_images(db, room_ids,       "ROOM")
    cleanup_entity_images(db, [property_id],  "PROPERTY")
    db.table("properties").delete().eq("id", property_id).execute()


# ═══════════════════════════════════════════════════════════════════════════════
# Rooms
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/rooms")
async def list_rooms(
    property_id: str = Query(..., description="UUID of the parent property"),
    user: dict = Depends(require_landlord),
):
    """
    List all rooms for one of the landlord's properties (with images).
    Required query param: ?property_id=<uuid>
    """
    db = get_db()
    _own_property(db, property_id, user)   # ownership check

    result = (
        db.table("rooms")
        .select("*")
        .eq("property_id", property_id)
        .order("created_at", desc=True)
        .execute()
    )
    return _with_room_images(db, result.data)


@router.post("/rooms", status_code=status.HTTP_201_CREATED)
async def create_room(
    data: RoomCreate,
    user: dict = Depends(require_landlord),
):
    """
    Add a room to one of the landlord's properties.
    If the parent property was APPROVED, it is reset to PENDING for re-review.
    """
    db = get_db()
    prop = _own_property(db, str(data.property_id), user)

    payload = data.model_dump(mode="json")
    payload["property_id"] = str(payload["property_id"])
    payload["is_active"]   = True

    result = db.table("rooms").insert(payload).select().execute()
    room   = result.data[0]
    room["is_available"] = room.get("available_beds", 0) > 0

    _reset_to_pending(db, prop)
    return room


@router.put("/rooms/{room_id}")
async def update_room(
    room_id: str,
    data: RoomUpdate,
    user: dict = Depends(require_landlord),
):
    """
    Update a room the landlord owns.
    If the parent property was APPROVED, it is reset to PENDING for re-review.
    """
    db = get_db()
    room, prop = _own_room(db, room_id, user)

    payload = data.model_dump(mode="json", exclude_none=True)
    if not payload:
        raise HTTPException(status_code=422, detail="No fields provided to update.")

    # Validate bed counts against merged (existing + incoming) values
    final_total = payload.get("number_of_beds", room["number_of_beds"])
    final_avail = payload.get("available_beds", room["available_beds"])
    if final_avail < 0:
        raise HTTPException(status_code=422, detail="available_beds cannot be negative.")
    if final_avail > final_total:
        raise HTTPException(status_code=422, detail="available_beds cannot exceed number_of_beds.")

    result  = db.table("rooms").update(payload).eq("id", room_id).select().execute()
    updated = result.data[0]
    updated["is_available"] = updated.get("available_beds", 0) > 0

    _reset_to_pending(db, prop)
    return updated


@router.delete("/rooms/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(
    room_id: str,
    user: dict = Depends(require_landlord),
):
    """
    Delete a room the landlord owns.
    Cleans up all room images from storage first.
    Deleting a room does NOT reset moderation (it reduces, not expands, the listing).
    """
    db = get_db()
    _own_room(db, room_id, user)

    cleanup_entity_images(db, [room_id], "ROOM")
    db.table("rooms").delete().eq("id", room_id).execute()


# ═══════════════════════════════════════════════════════════════════════════════
# Images
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/images", status_code=status.HTTP_201_CREATED)
async def upload_image(
    entity_id:   Annotated[str,  Form()],
    entity_type: Annotated[str,  Form()],
    is_primary:  Annotated[bool, Form()] = False,
    file: UploadFile = File(...),
    user: dict = Depends(require_landlord),
):
    """
    Upload an image to Supabase Storage and link it to a property or room.

    Form fields:
      entity_id   — UUID of the property or room
      entity_type — "PROPERTY" | "ROOM"
      is_primary  — true/false (only meaningful for PROPERTY images)
      file        — JPEG / PNG / WebP, max 5 MB

    Rules:
      - Rooms      : max 5 images; is_primary is ignored
      - Properties : unlimited images; only 1 primary allowed at a time
    """
    db = get_db()

    try:
        et = ImageEntityType(entity_type.upper())
    except ValueError:
        raise HTTPException(status_code=422, detail="entity_type must be PROPERTY or ROOM.")

    # Ownership
    if et == ImageEntityType.PROPERTY:
        _own_property(db, entity_id, user)
    else:
        _own_room(db, entity_id, user)

    # Mime type
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type '{file.content_type}'. Allowed: JPEG, PNG, WebP.",
        )

    # Size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=422, detail="File too large. Maximum is 5 MB.")

    # Room image cap
    if et == ImageEntityType.ROOM:
        count = (
            db.table("images")
            .select("id", count="exact")
            .eq("entity_id", entity_id)
            .eq("entity_type", "ROOM")
            .execute()
            .count or 0
        )
        if count >= MAX_ROOM_IMAGES:
            raise HTTPException(
                status_code=422,
                detail=f"A room can have at most {MAX_ROOM_IMAGES} images.",
            )

    # Demote existing primary before promoting new one
    if et == ImageEntityType.PROPERTY and is_primary:
        db.table("images").update({"is_primary": False}) \
            .eq("entity_id", entity_id) \
            .eq("entity_type", "PROPERTY") \
            .eq("is_primary", True) \
            .execute()

    # Upload to storage
    path = _storage_path(et.value, entity_id, file.filename or "image")
    try:
        db.storage.from_(BUCKET).upload(
            path=path,
            file=content,
            file_options={"content-type": file.content_type},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {exc}")

    public_url = db.storage.from_(BUCKET).get_public_url(path)

    result = db.table("images").insert({
        "entity_id":    entity_id,
        "entity_type":  et.value,
        "image_url":    public_url,
        "storage_path": path,
        "is_primary":   is_primary if et == ImageEntityType.PROPERTY else False,
    }).select().execute()
    return result.data[0]


@router.delete("/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_image(
    image_id: str,
    user: dict = Depends(require_landlord),
):
    """
    Delete an image the landlord owns.
    Removes the file from Supabase Storage AND the record from the images table.
    """
    db = get_db()

    img_result = db.table("images").select("*").eq("id", image_id).execute()
    if not img_result.data:
        raise HTTPException(status_code=404, detail="Image not found.")
    img = img_result.data[0]

    et = ImageEntityType(img["entity_type"])
    if et == ImageEntityType.PROPERTY:
        _own_property(db, str(img["entity_id"]), user)
    else:
        _own_room(db, str(img["entity_id"]), user)

    storage_path = img.get("storage_path")
    if storage_path:
        try:
            db.storage.from_(BUCKET).remove([storage_path])
        except Exception as exc:
            logger.warning(f"Storage delete failed for '{storage_path}': {exc}")

    db.table("images").delete().eq("id", image_id).execute()


# ═══════════════════════════════════════════════════════════════════════════════
# Inquiries  (read-only)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/inquiries")
async def list_inquiries(user: dict = Depends(require_landlord)):
    """
    Read-only — list all inquiries for this landlord's properties.
    Sorted newest first. Enriched with room type/price and property title/city.
    """
    db = get_db()

    property_ids = _get_landlord_property_ids(db, user["id"])
    if not property_ids:
        return []

    result = (
        db.table("inquiries")
        .select("*")
        .in_("property_id", property_ids)
        .order("created_at", desc=True)
        .execute()
    )
    if not result.data:
        return []

    # Enrich with room + property snapshots (same pattern as admin inquiries)
    room_ids = list({str(i["room_id"])     for i in result.data})
    prop_ids = list({str(i["property_id"]) for i in result.data})

    rooms = {
        str(r["id"]): r
        for r in db.table("rooms")
            .select("id, room_type, price_per_bed")
            .in_("id", room_ids)
            .execute()
            .data
    }
    props = {
        str(p["id"]): p
        for p in db.table("properties")
            .select("id, title, city")
            .in_("id", prop_ids)
            .execute()
            .data
    }

    for inq in result.data:
        inq["room"]     = rooms.get(str(inq["room_id"]))
        inq["property"] = props.get(str(inq["property_id"]))

    return result.data
