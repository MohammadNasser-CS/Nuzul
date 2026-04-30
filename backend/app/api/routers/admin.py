"""
Admin dashboard router — /api/v1/admin/*

All endpoints require role = ADMIN with a completed profile.
Provides:
  • Dashboard overview stats
  • Property moderation (approve / reject / notes)
  • User management (list / deactivate / reactivate)

The inquiry endpoints (GET /admin/inquiries, PATCH /admin/inquiries/{id}/status)
live in inquiries.py and are intentionally kept there to co-locate them with
the related student endpoints.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, field_validator

from app.core.database import get_db
from app.core.security import require_admin
from app.models.inquiry import InquiryStatus
from app.models.property import VerificationStatus
from app.models.user import UserRole

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Request bodies ─────────────────────────────────────────────────────────────

class RejectBody(BaseModel):
    rejection_reason: str
    admin_notes: Optional[str] = None

    @field_validator("rejection_reason")
    @classmethod
    def reason_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("rejection_reason cannot be empty.")
        return v.strip()


class NotesBody(BaseModel):
    admin_notes: str


# ══════════════════════════════════════════════════════════════════════════════
# Helpers
# ══════════════════════════════════════════════════════════════════════════════

def _attach_property_images(db, properties: list[dict]) -> list[dict]:
    """Attach PROPERTY images to each property dict (one batch query)."""
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


def _attach_landlord_info(db, properties: list[dict]) -> list[dict]:
    """Attach landlord name / phone / email to each property dict."""
    if not properties:
        return properties
    landlord_ids = list({str(p["landlord_id"]) for p in properties})
    rows = (
        db.table("user_profiles")
        .select("id, full_name, phone_number, email")
        .in_("id", landlord_ids)
        .execute()
        .data
    )
    landlord_map = {str(r["id"]): r for r in rows}
    for prop in properties:
        info = landlord_map.get(str(prop["landlord_id"]), {})
        prop["landlord_name"]  = info.get("full_name")
        prop["landlord_phone"] = info.get("phone_number")
        prop["landlord_email"] = info.get("email")
    return properties


# ══════════════════════════════════════════════════════════════════════════════
# Dashboard
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/dashboard")
async def admin_dashboard(admin: dict = Depends(require_admin)):
    """
    Admin — high-level platform statistics.

    Response:
    {
        "total_users":          120,
        "active_users":         115,
        "total_students":        88,
        "total_landlords":       30,

        "total_properties":      45,
        "pending_properties":    10,
        "approved_properties":   30,
        "rejected_properties":    5,

        "total_rooms":          130,

        "total_inquiries":       80,
        "pending_inquiries":     15,
        "contacted_inquiries":   20,
        "booked_inquiries":      35,
        "cancelled_inquiries":   10
    }
    """
    db = get_db()

    # ── Users ──────────────────────────────────────────────────────────────────
    users = db.table("user_profiles").select("role, is_active").execute().data
    user_stats = {
        "total_users":     len(users),
        "active_users":    sum(1 for u in users if u.get("is_active")),
        "total_students":  sum(1 for u in users if u.get("role") == UserRole.STUDENT.value),
        "total_landlords": sum(1 for u in users if u.get("role") == UserRole.LANDLORD.value),
    }

    # ── Properties ─────────────────────────────────────────────────────────────
    props = db.table("properties").select("verification_status").execute().data
    prop_stats = {
        "total_properties":    len(props),
        "pending_properties":  sum(1 for p in props if p.get("verification_status") == VerificationStatus.PENDING.value),
        "approved_properties": sum(1 for p in props if p.get("verification_status") == VerificationStatus.APPROVED.value),
        "rejected_properties": sum(1 for p in props if p.get("verification_status") == VerificationStatus.REJECTED.value),
    }

    # ── Rooms (active only) ────────────────────────────────────────────────────
    rooms_res = (
        db.table("rooms")
        .select("id", count="exact")
        .eq("is_active", True)
        .execute()
    )
    total_rooms = rooms_res.count or 0

    # ── Inquiries ──────────────────────────────────────────────────────────────
    inquiries = db.table("inquiries").select("status").execute().data
    inq_stats = {
        "total_inquiries":     len(inquiries),
        "pending_inquiries":   sum(1 for i in inquiries if i.get("status") == InquiryStatus.PENDING.value),
        "contacted_inquiries": sum(1 for i in inquiries if i.get("status") == InquiryStatus.CONTACTED.value),
        "booked_inquiries":    sum(1 for i in inquiries if i.get("status") == InquiryStatus.BOOKED.value),
        "cancelled_inquiries": sum(1 for i in inquiries if i.get("status") == InquiryStatus.CANCELLED.value),
    }

    return {**user_stats, **prop_stats, "total_rooms": total_rooms, **inq_stats}


# ══════════════════════════════════════════════════════════════════════════════
# Property Moderation
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/properties")
async def admin_list_properties(
    status_filter: Optional[VerificationStatus] = Query(None, alias="status", description="Filter by verification status"),
    admin: dict = Depends(require_admin),
):
    """
    Admin — list all properties, optionally filtered by verification_status.

    Each property is enriched with:
      • images list
      • landlord_name, landlord_phone, landlord_email
      • rooms list (with all fields)

    Sorted newest first.
    """
    db = get_db()

    query = (
        db.table("properties")
        .select("*, rooms(*)")
        .order("created_at", desc=True)
    )
    if status_filter:
        query = query.eq("verification_status", status_filter.value)

    props = query.execute().data
    _attach_property_images(db, props)
    _attach_landlord_info(db, props)
    return props


@router.get("/properties/{property_id}")
async def admin_get_property(
    property_id: str,
    admin: dict = Depends(require_admin),
):
    """
    Admin — retrieve a single property with full detail.

    Includes rooms, images, and landlord contact info.
    """
    db = get_db()

    result = (
        db.table("properties")
        .select("*, rooms(*)")
        .eq("id", property_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Property not found.")

    props = result.data
    _attach_property_images(db, props)
    _attach_landlord_info(db, props)
    return props[0]


@router.patch("/properties/{property_id}/approve")
async def approve_property(
    property_id: str,
    admin: dict = Depends(require_admin),
):
    """
    Admin — approve a property, making it publicly visible in listings.

    • Sets verification_status = APPROVED
    • Records verified_by + verified_at
    • Clears any prior rejection fields
    • Idempotent: approving an already-approved property is allowed (re-approval)
    """
    db = get_db()

    if not db.table("properties").select("id").eq("id", property_id).execute().data:
        raise HTTPException(status_code=404, detail="Property not found.")

    result = db.table("properties").update({
        "verification_status": VerificationStatus.APPROVED.value,
        "verified_at":         datetime.now(timezone.utc).isoformat(),
        "verified_by":         str(admin["id"]),
        # Clear rejection fields from any prior rejection
        "rejection_reason": None,
        "rejected_at":      None,
        "rejected_by":      None,
    }).eq("id", property_id).execute()

    logger.info("Admin %s approved property %s", admin["id"], property_id)
    return result.data[0]


@router.patch("/properties/{property_id}/reject")
async def reject_property(
    property_id: str,
    body: RejectBody,
    admin: dict = Depends(require_admin),
):
    """
    Admin — reject a property with a mandatory reason.

    • rejection_reason is surfaced to the landlord on their dashboard
    • admin_notes is internal context only (not shown to landlord)
    • Sets verification_status = REJECTED
    • Records rejected_by + rejected_at
    • Clears approval fields
    """
    db = get_db()

    if not db.table("properties").select("id").eq("id", property_id).execute().data:
        raise HTTPException(status_code=404, detail="Property not found.")

    result = db.table("properties").update({
        "verification_status": VerificationStatus.REJECTED.value,
        "rejected_at":         datetime.now(timezone.utc).isoformat(),
        "rejected_by":         str(admin["id"]),
        "rejection_reason":    body.rejection_reason,
        "admin_notes":         body.admin_notes,
        # Clear approval fields
        "verified_at":  None,
        "verified_by":  None,
    }).eq("id", property_id).execute()

    logger.info(
        "Admin %s rejected property %s — reason: %s",
        admin["id"], property_id, body.rejection_reason,
    )
    return result.data[0]


@router.patch("/properties/{property_id}/notes")
async def update_property_notes(
    property_id: str,
    body: NotesBody,
    admin: dict = Depends(require_admin),
):
    """
    Admin — add or update internal notes on a property.

    Notes are admin-only and are NOT surfaced to the landlord.
    Does NOT change the verification_status — safe to call on any property.
    """
    db = get_db()

    if not db.table("properties").select("id").eq("id", property_id).execute().data:
        raise HTTPException(status_code=404, detail="Property not found.")

    result = db.table("properties").update(
        {"admin_notes": body.admin_notes}
    ).eq("id", property_id).execute()

    return result.data[0]


# ══════════════════════════════════════════════════════════════════════════════
# User Management
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/users")
async def admin_list_users(
    role: Optional[UserRole] = Query(None, description="Filter by role (STUDENT | LANDLORD | ADMIN)"),
    admin: dict = Depends(require_admin),
):
    """
    Admin — list all registered users, optionally filtered by role.

    Each user is enriched with:
      • property_count  — number of properties created (LANDLORD only, else 0)
      • inquiry_count   — number of inquiries submitted (STUDENT only, else 0)

    Sorted newest first.
    """
    db = get_db()

    query = (
        db.table("user_profiles")
        .select("*")
        .order("created_at", desc=True)
    )
    if role:
        query = query.eq("role", role.value)

    users = query.execute().data
    if not users:
        return []

    # ── Batch: property count per landlord ─────────────────────────────────────
    landlord_ids = [str(u["id"]) for u in users if u.get("role") == UserRole.LANDLORD.value]
    prop_counts: dict[str, int] = {}
    if landlord_ids:
        prop_rows = (
            db.table("properties")
            .select("landlord_id")
            .in_("landlord_id", landlord_ids)
            .execute()
            .data
        )
        for row in prop_rows:
            lid = str(row["landlord_id"])
            prop_counts[lid] = prop_counts.get(lid, 0) + 1

    # ── Batch: inquiry count per student ───────────────────────────────────────
    student_ids = [str(u["id"]) for u in users if u.get("role") == UserRole.STUDENT.value]
    inq_counts: dict[str, int] = {}
    if student_ids:
        inq_rows = (
            db.table("inquiries")
            .select("student_id")
            .in_("student_id", student_ids)
            .execute()
            .data
        )
        for row in inq_rows:
            sid = str(row["student_id"])
            inq_counts[sid] = inq_counts.get(sid, 0) + 1

    # ── Merge ──────────────────────────────────────────────────────────────────
    for user in users:
        uid = str(user["id"])
        user["property_count"] = prop_counts.get(uid, 0)
        user["inquiry_count"]  = inq_counts.get(uid, 0)

    return users


@router.get("/users/{user_id}")
async def admin_get_user(
    user_id: str,
    admin: dict = Depends(require_admin),
):
    """
    Admin — retrieve a single user's full profile.

    For LANDLORD: includes properties list.
    For STUDENT:  includes student profile + inquiries list.
    """
    db = get_db()

    result = db.table("user_profiles").select("*").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found.")

    user = result.data[0]
    user["property_count"] = 0
    user["inquiry_count"]  = 0

    role = user.get("role")

    if role == UserRole.LANDLORD.value:
        # Attach properties with rooms + images
        props = (
            db.table("properties")
            .select("*, rooms(*)")
            .eq("landlord_id", user_id)
            .order("created_at", desc=True)
            .execute()
            .data
        )
        _attach_property_images(db, props)
        user["properties"]     = props
        user["property_count"] = len(props)

    elif role == UserRole.STUDENT.value:
        # Attach student profile
        sp_result = (
            db.table("student_profiles")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )
        user["student_profile"] = sp_result.data[0] if sp_result.data else None

        # Attach inquiries
        inq_result = (
            db.table("inquiries")
            .select("*")
            .eq("student_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        user["inquiries"]     = inq_result.data
        user["inquiry_count"] = len(inq_result.data)

    return user


@router.patch("/users/{user_id}/deactivate")
async def toggle_user_activation(
    user_id: str,
    admin: dict = Depends(require_admin),
):
    """
    Admin — toggle a user's active status.

    • Active   → is_active = False  (account suspended)
    • Inactive → is_active = True   (account restored)

    Admins cannot deactivate their own account.
    Returns the updated user with a message field indicating the action taken.
    """
    db = get_db()

    # Safety guard — admin cannot lock themselves out
    if str(user_id) == str(admin["id"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account.",
        )

    result = (
        db.table("user_profiles")
        .select("id, full_name, email, role, is_active")
        .eq("id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found.")

    current = result.data[0]
    new_state = not current["is_active"]

    updated = db.table("user_profiles").update({
        "is_active": new_state,
    }).eq("id", user_id).execute()

    action = "deactivated" if not new_state else "reactivated"
    logger.info(
        "Admin %s %s user %s (%s)",
        admin["id"], action, user_id, current.get("email"),
    )

    return {
        **updated.data[0],
        "message": f"User {action} successfully.",
    }
