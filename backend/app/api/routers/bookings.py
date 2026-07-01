from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user

router = APIRouter(prefix="/bookings", tags=["bookings"])


# ── Request bodies ─────────────────────────────────────────────────────────────

class BookingCreate(BaseModel):
    property_id: str
    move_in_date: str
    move_out_date: Optional[str] = None
    message: Optional[str] = None


class BookingUpdate(BaseModel):
    status: Optional[str] = None        # "pending" | "confirmed" | "cancelled"
    move_out_date: Optional[str] = None


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/my")
async def my_bookings(user: dict = Depends(get_current_user)):
    """Return all bookings made by the current user."""
    db = get_db()
    result = (
        db.table("bookings")
        .select("*")
        .eq("student_id", user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_booking(
    data: BookingCreate,
    user: dict = Depends(get_current_user),
):
    """User creates a booking request for a property."""
    db = get_db()

    booking_data = data.model_dump(exclude_none=True)
    booking_data["student_id"] = user["id"]
    booking_data["status"] = "pending"

    result = db.table("bookings").insert(booking_data).select().execute()
    return result.data[0]


@router.patch("/{booking_id}")
async def update_booking(
    booking_id: str,
    data: BookingUpdate,
    user: dict = Depends(get_current_user),
):
    """User can update (e.g. cancel) their own booking."""
    db = get_db()

    booking_result = db.table("bookings").select("*").eq("id", booking_id).execute()
    if not booking_result.data:
        raise HTTPException(status_code=404, detail="Booking not found.")

    booking = booking_result.data[0]
    if booking["student_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="You do not own this booking.")

    update_data = data.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=422, detail="No fields to update.")

    result = db.table("bookings").update(update_data).eq("id", booking_id).select().execute()
    return result.data[0]
