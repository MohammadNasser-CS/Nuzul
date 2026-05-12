from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import require_student_profile, require_admin
from app.models.inquiry import InquiryStatus

router = APIRouter(tags=["inquiries"])


# ── Request bodies ─────────────────────────────────────────────────────────────

class InquiryCreate(BaseModel):
    room_id: str
    message: Optional[str] = None
    # Future-booking fields — optional.
    # Requires DB columns: ALTER TABLE inquiries ADD COLUMN move_in_date date;
    #                      ALTER TABLE inquiries ADD COLUMN move_out_date date;
    move_in_date: Optional[str] = None   # ISO date string "YYYY-MM-DD"
    move_out_date: Optional[str] = None  # ISO date string "YYYY-MM-DD"


class InquiryStatusUpdate(BaseModel):
    status: InquiryStatus


# ── Helper ─────────────────────────────────────────────────────────────────────

def _enrich(db, inquiries: list[dict]) -> list[dict]:
    """Attach room (type, price) and property (title, city) to each inquiry."""
    if not inquiries:
        return inquiries

    room_ids = list({str(i["room_id"]) for i in inquiries})
    prop_ids = list({str(i["property_id"]) for i in inquiries})

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

    for inq in inquiries:
        inq["room"] = rooms.get(str(inq["room_id"]))
        inq["property"] = props.get(str(inq["property_id"]))

    return inquiries


# ── Student endpoints ──────────────────────────────────────────────────────────

@router.post("/inquiries", status_code=status.HTTP_201_CREATED)
async def create_inquiry(
    data: InquiryCreate,
    user: dict = Depends(require_student_profile),
):
    """
    Student — submit an inquiry for a specific room.

    Validation:
    - Room must exist and be available (active + available_beds > 0)
    - Anti-spam: same student + same room within 24 hours is rejected
    """
    db = get_db()

    # 1. Fetch room ─────────────────────────────────────────────────────────────
    room_result = db.table("rooms").select(
        "*").eq("id", data.room_id).execute()
    if not room_result.data:
        raise HTTPException(status_code=404, detail="Room not found.")
    room = room_result.data[0]

    # 2. Availability check ─────────────────────────────────────────────────────
    if not room.get("is_active") or room.get("available_beds", 0) <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This room is not currently available.",
        )

    # 3. Fetch property (to get landlord_id) ────────────────────────────────────
    prop_result = (
        db.table("properties")
        .select("id, landlord_id, title, city")
        .eq("id", str(room["property_id"]))
        .execute()
    )
    if not prop_result.data:
        raise HTTPException(status_code=404, detail="Property not found.")
    prop = prop_result.data[0]

    # 4. Anti-spam (same student + same room within 24 h) ───────────────────────
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    existing = (
        db.table("inquiries")
        .select("id")
        .eq("student_id", str(user["id"]))
        .eq("room_id", data.room_id)
        .gte("created_at", cutoff)
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="You already submitted an inquiry for this room within the last 24 hours.",
        )

    # 5. Fetch landlord contact snapshot ────────────────────────────────────────
    landlord_result = (
        db.table("user_profiles")
        .select("full_name, phone_number")
        .eq("id", str(prop["landlord_id"]))
        .execute()
    )
    landlord = landlord_result.data[0] if landlord_result.data else {}

    # 6. Insert inquiry ─────────────────────────────────────────────────────────
    payload = {
        "student_id":    str(user["id"]),
        "room_id":       data.room_id,
        "property_id":   str(room["property_id"]),
        # Contact snapshots captured now so they survive future profile edits
        "student_name":  user.get("full_name") or "",
        "student_phone": user.get("phone_number") or "",
        "landlord_name": landlord.get("full_name") or "",
        "landlord_phone": landlord.get("phone_number") or "",
        "message":       data.message,
        "status":        InquiryStatus.PENDING.value,
        # Future-booking — stored as-is; None if not provided
        "move_in_date":  data.move_in_date,
        "move_out_date": data.move_out_date,
    }
    result = db.table("inquiries").insert(payload).execute()
    return _enrich(db, result.data)[0]


@router.get("/my-inquiries")
async def my_inquiries(user: dict = Depends(require_student_profile)):
    """Student — list all of their own inquiries, newest first."""
    db = get_db()
    result = (
        db.table("inquiries")
        .select("*")
        .eq("student_id", str(user["id"]))
        .order("created_at", desc=True)
        .execute()
    )
    return _enrich(db, result.data)


# ── Admin endpoints ────────────────────────────────────────────────────────────

@router.get("/admin/inquiries")
async def admin_list_inquiries(
    status_filter: Optional[InquiryStatus] = Query(None, alias="status"),
    admin: dict = Depends(require_admin),
):
    """
    Admin — list inquiries (optionally filtered by status).

    Always returns per-status counts across ALL inquiries so the frontend
    tab badges stay accurate regardless of which filter is active.

    Response shape:
        {
            "data":   [ ...inquiry objects... ],
            "counts": { "PENDING": n, "CONTACTED": n, "BOOKED": n, "CANCELLED": n }
        }
    """
    db = get_db()

    # ── 1. Counts across every status (lightweight — status column only) ───────
    all_rows = db.table("inquiries").select("status").execute().data
    counts: dict[str, int] = {s.value: 0 for s in InquiryStatus}
    for row in all_rows:
        s = row.get("status", "")
        if s in counts:
            counts[s] += 1

    # ── 2. Filtered list ───────────────────────────────────────────────────────
    query = db.table("inquiries").select("*").order("created_at", desc=True)
    if status_filter:
        query = query.eq("status", status_filter.value)
    result = query.execute()

    return {"data": _enrich(db, result.data), "counts": counts}


@router.patch("/admin/inquiries/{inquiry_id}/status")
async def update_inquiry_status(
    inquiry_id: str,
    body: InquiryStatusUpdate,
    admin: dict = Depends(require_admin),
):
    """
    Admin — advance or revert the status of an inquiry.

    Allowed transitions:
      PENDING   → CONTACTED | CANCELLED
      CONTACTED → BOOKED    | CANCELLED
      BOOKED    → (terminal — no further transitions)
      CANCELLED → PENDING   (reopen)
    """
    db = get_db()

    existing = db.table("inquiries").select(
        "id, status").eq("id", inquiry_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Inquiry not found.")

    current = existing.data[0]["status"]
    next_s = body.status.value

    ALLOWED: dict[str, set[str]] = {
        InquiryStatus.PENDING.value:   {InquiryStatus.CONTACTED.value, InquiryStatus.CANCELLED.value},
        InquiryStatus.CONTACTED.value: {InquiryStatus.BOOKED.value,    InquiryStatus.CANCELLED.value},
        InquiryStatus.BOOKED.value:    set(),  # terminal
        # reopen only
        InquiryStatus.CANCELLED.value: {InquiryStatus.PENDING.value},
    }

    if next_s not in ALLOWED.get(current, set()):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Transition from '{current}' to '{next_s}' is not allowed.",
        )

    result = (
        db.table("inquiries")
        .update({
            "status":     next_s,
            "handled_by": str(admin["id"]),
            "handled_at": datetime.now(timezone.utc).isoformat(),
        })
        .eq("id", inquiry_id)
        .execute()
    )
    if not result.data:
        # Fallback: re-fetch the row if the driver still returns nothing
        result = db.table("inquiries").select(
            "*").eq("id", inquiry_id).execute()
    return _enrich(db, result.data)[0]
