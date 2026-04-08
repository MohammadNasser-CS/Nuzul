from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.core.database import get_db
from app.core.security import get_current_user_id

router = APIRouter(prefix="/properties", tags=["properties"])


@router.get("/")
async def list_properties(
    city: str | None = Query(None),
    min_price: float | None = Query(None),
    max_price: float | None = Query(None),
    rooms: int | None = Query(None),
    available_only: bool = Query(True),
):
    """Public — list and filter properties."""
    db = get_db()
    query = db.table("properties").select("*")

    if available_only:
        query = query.eq("is_available", True)
    if city:
        query = query.eq("city", city)
    if min_price is not None:
        query = query.gte("price_per_month", min_price)
    if max_price is not None:
        query = query.lte("price_per_month", max_price)
    if rooms is not None:
        query = query.eq("rooms", rooms)

    result = query.execute()
    return result.data


@router.get("/{property_id}")
async def get_property(property_id: str):
    """Public — get a single property by ID."""
    db = get_db()
    result = db.table("properties").select("*").eq("id", property_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Property not found.")
    return result.data[0]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_property(
    data: dict,
    user_id: str = Depends(get_current_user_id),
):
    """Create a new property listing (authenticated users only)."""
    db = get_db()

    # Get our internal user record
    user = db.table("users").select("id").eq("supabase_id", user_id).execute()
    if not user.data:
        raise HTTPException(status_code=404, detail="User not found.")

    allowed = {
        "title", "description", "address", "city",
        "price_per_month", "rooms", "is_available",
        "near_university", "image_url"
    }
    property_data = {k: v for k, v in data.items() if k in allowed}
    property_data["owner_id"] = user.data[0]["id"]

    result = db.table("properties").insert(property_data).execute()
    return result.data[0]


@router.patch("/{property_id}")
async def update_property(
    property_id: str,
    data: dict,
    user_id: str = Depends(get_current_user_id),
):
    """Update a property — owner only."""
    db = get_db()

    prop = db.table("properties").select("*").eq("id", property_id).execute()
    if not prop.data:
        raise HTTPException(status_code=404, detail="Property not found.")

    user = db.table("users").select("id").eq("supabase_id", user_id).execute()
    if not user.data or prop.data[0]["owner_id"] != user.data[0]["id"]:
        raise HTTPException(status_code=403, detail="Not authorised.")

    allowed = {
        "title", "description", "address", "city",
        "price_per_month", "rooms", "is_available",
        "near_university", "image_url"
    }
    update_data = {k: v for k, v in data.items() if k in allowed}

    result = db.table("properties").update(
        update_data).eq("id", property_id).execute()
    return result.data[0]


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(
    property_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Delete a property — owner only."""
    db = get_db()

    prop = db.table("properties").select("*").eq("id", property_id).execute()
    if not prop.data:
        raise HTTPException(status_code=404, detail="Property not found.")

    user = db.table("users").select("id").eq("supabase_id", user_id).execute()
    if not user.data or prop.data[0]["owner_id"] != user.data[0]["id"]:
        raise HTTPException(status_code=403, detail="Not authorised.")

    db.table("properties").delete().eq("id", property_id).execute()
