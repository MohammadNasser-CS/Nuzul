import math
from fastapi import APIRouter, HTTPException, Query
from app.core.database import get_db
from app.models.property import GenderPreference, PropertyType, RoomType
from typing import Optional

router = APIRouter(prefix="/listings", tags=["listings"])

DEFAULT_PAGE_SIZE = 6
MAX_PAGE_SIZE = 50


def _inject_is_available(room: dict) -> dict:
    """Add derived is_available field to a room dict."""
    return {**room, "is_available": room.get("available_beds", 0) > 0}


def _fetch_images_map(db, entity_ids: list[str], entity_type: str) -> dict[str, list]:
    """
    Batch-fetch images for a list of entity IDs and return a map:
        { entity_id: [image, ...] }

    Supabase images table has no FK to properties/rooms, so we cannot use
    PostgREST's auto-join syntax (images(*)). We always query images separately.
    """
    if not entity_ids:
        return {}
    result = (
        db.table("images")
        .select("*")
        .in_("entity_id", entity_ids)
        .eq("entity_type", entity_type)
        .execute()
    )
    img_map: dict[str, list] = {}
    for img in result.data:
        img_map.setdefault(str(img["entity_id"]), []).append(img)
    return img_map


@router.get("/")
async def list_listings(
    city: Optional[str] = Query(None),
    property_type: Optional[PropertyType] = Query(None),
    gender_preference: Optional[GenderPreference] = Query(None),
    room_type: Optional[RoomType] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    limit: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE, description="Items per page"),
):
    """
    Public — list all approved + active properties that have at least one
    active, available room. Optionally filter by city, type, gender, room type,
    and price range. Supports cursor-free page/limit pagination.

    Response shape:
        {
            "items":  [...],   # properties for this page
            "total":  N,       # total matching properties (after all filters)
            "page":   N,       # current page (1-based, clamped to valid range)
            "limit":  N,       # page size used
            "pages":  N,       # total number of pages
        }
    """
    db = get_db()

    # ── 1. Fetch properties + their rooms (FK join works for rooms) ────────────
    query = (
        db.table("properties")
        .select("*, rooms(*)")
        .eq("verification_status", "APPROVED")
        .eq("is_active", True)
    )

    if city:
        query = query.ilike("city", f"%{city}%")
    if property_type:
        query = query.eq("property_type", property_type.value)
    if gender_preference:
        query = query.eq("gender_preference", gender_preference.value)

    result = query.order("created_at", desc=True).execute()
    properties = result.data

    # ── 2. Batch-fetch property images (separate query — no FK) ───────────────
    property_ids = [str(p["id"]) for p in properties]
    prop_images_map = _fetch_images_map(db, property_ids, "PROPERTY")

    # ── 3. Filter + enrich each property ──────────────────────────────────────
    output = []
    for prop in properties:
        rooms = prop.pop("rooms", []) or []

        # Keep only active + available rooms
        active_rooms = [
            r for r in rooms
            if r.get("is_active") and r.get("available_beds", 0) > 0
        ]

        # Apply room-level filters (price, room_type)
        if room_type:
            active_rooms = [r for r in active_rooms if r.get("room_type") == room_type.value]
        if min_price is not None:
            active_rooms = [r for r in active_rooms if float(r.get("price_per_bed", 0)) >= min_price]
        if max_price is not None:
            active_rooms = [r for r in active_rooms if float(r.get("price_per_bed", 0)) <= max_price]

        # Skip properties that have no matching rooms after filtering
        if not active_rooms:
            continue

        prop_images = prop_images_map.get(str(prop["id"]), [])
        primary = next((i for i in prop_images if i.get("is_primary")), None)

        output.append({
            **prop,
            "rooms": [_inject_is_available(r) for r in active_rooms],
            "images": prop_images,
            "cover_image": primary["image_url"] if primary else None,
        })

    # ── 4. Paginate ────────────────────────────────────────────────────────────
    total = len(output)
    pages = max(1, math.ceil(total / limit))
    page = min(page, pages)           # clamp: never return an empty page
    offset = (page - 1) * limit
    items = output[offset: offset + limit]

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages,
    }


@router.get("/{property_id}")
async def get_listing(property_id: str):
    """
    Public — full property detail including all rooms and images.
    Only returns APPROVED + active properties.
    Rooms include their own images.
    """
    db = get_db()

    # ── 1. Fetch property + rooms ─────────────────────────────────────────────
    result = (
        db.table("properties")
        .select("*, rooms(*)")
        .eq("id", property_id)
        .eq("verification_status", "APPROVED")
        .eq("is_active", True)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Property not found.")

    prop = result.data[0]
    rooms = prop.pop("rooms", []) or []

    # ── 2. Fetch property images ──────────────────────────────────────────────
    prop_images_result = (
        db.table("images")
        .select("*")
        .eq("entity_id", property_id)
        .eq("entity_type", "PROPERTY")
        .execute()
    )
    prop_images = prop_images_result.data

    # ── 3. Fetch room images (batch) ──────────────────────────────────────────
    active_rooms = [r for r in rooms if r.get("is_active")]
    room_ids = [str(r["id"]) for r in active_rooms]
    room_images_map = _fetch_images_map(db, room_ids, "ROOM")

    # ── 4. Attach images to rooms + inject is_available ───────────────────────
    rooms_out = []
    for room in active_rooms:
        enriched = _inject_is_available(room)
        enriched["images"] = room_images_map.get(str(room["id"]), [])
        rooms_out.append(enriched)

    return {
        **prop,
        "rooms": rooms_out,
        "images": prop_images,
        "cover_image": next(
            (i["image_url"] for i in prop_images if i.get("is_primary")), None
        ),
    }
