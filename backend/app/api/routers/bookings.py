from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import get_db
from app.core.security import get_current_user_id

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.get("/my")
async def my_bookings(
    user_id: str = Depends(get_current_user_id),
):
    """Return all bookings made by the current student."""
    db = get_db()

    user = db.table("user_profiles").select("id").eq("supabase_user_id", user_id).execute()
    if not user.data:
        raise HTTPException(status_code=404, detail="User not found.")

    result = db.table("bookings").select(
        "*").eq("student_id", user.data[0]["id"]).execute()
    return result.data


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_booking(
    data: dict,
    user_id: str = Depends(get_current_user_id),
):
    """Student creates a booking request for a property."""
    db = get_db()

    user = db.table("user_profiles").select("id").eq("supabase_user_id", user_id).execute()
    if not user.data:
        raise HTTPException(status_code=404, detail="User not found.")

    allowed = {"property_id", "move_in_date", "move_out_date", "message"}
    booking_data = {k: v for k, v in data.items() if k in allowed}
    booking_data["student_id"] = user.data[0]["id"]
    booking_data["status"] = "pending"

    result = db.table("bookings").insert(booking_data).execute()
    return result.data[0]


@router.patch("/{booking_id}")
async def update_booking(
    booking_id: str,
    data: dict,
    user_id: str = Depends(get_current_user_id),
):
    """Student can update or cancel their own booking."""
    db = get_db()

    booking = db.table("bookings").select("*").eq("id", booking_id).execute()
    if not booking.data:
        raise HTTPException(status_code=404, detail="Booking not found.")

    user = db.table("user_profiles").select("id").eq("supabase_user_id", user_id).execute()
    if not user.data:
        raise HTTPException(status_code=404, detail="User not found.")

    if booking.data[0]["student_id"] != user.data[0]["id"]:
        raise HTTPException(status_code=403, detail="Not authorised.")

    allowed = {"status", "move_out_date"}
    update_data = {k: v for k, v in data.items() if k in allowed}

    result = db.table("bookings").update(
        update_data).eq("id", booking_id).execute()
    return result.data[0]
