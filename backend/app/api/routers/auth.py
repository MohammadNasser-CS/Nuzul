from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import UserRole
from app.schemas.user import (
    UserProfileRead,
    CompleteProfileRequest,
    CompleteStudentProfileRequest,
    StudentProfileRead,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me")
async def get_me(
    user: dict = Depends(get_current_user),
):
    """Return the currently authenticated user's profile, including student profile if applicable."""
    db = get_db()

    if user.get("role") == UserRole.STUDENT.value:
        student = db.table("student_profiles").select(
            "*").eq("user_id", user["id"]).execute()
        user["student_profile"] = student.data[0] if student.data else None

    return user


@router.post("/complete-profile", response_model=UserProfileRead)
async def complete_profile(
    data: CompleteProfileRequest,
    user: dict = Depends(get_current_user),
):
    """
    Set full_name, phone_number, and role on the user profile.

    Business rules:
    - Role cannot be changed once set.
    - full_name and phone_number are required.
    """
    db = get_db()
    user_id = user["id"]

    # Role is immutable once set
    if user.get("role") is not None and user["role"] != data.role.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role cannot be changed once set.",
        )

    result = db.table("user_profiles").update({
        "full_name": data.full_name,
        "phone_number": data.phone_number,
        "role": data.role.value,
    }).eq("id", user_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="User profile not found.")

    return result.data[0]


@router.post("/complete-student-profile", response_model=StudentProfileRead, status_code=status.HTTP_201_CREATED)
async def complete_student_profile(
    data: CompleteStudentProfileRequest,
    user: dict = Depends(get_current_user),
):
    """
    Create (or update) the student_profile for the current user.

    Business rules:
    - User must have role = STUDENT.
    - User must have completed their base profile first (role must be set).
    """
    db = get_db()
    user_id = user["id"]

    if user.get("role") != UserRole.STUDENT.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only users with role STUDENT can complete a student profile.",
        )

    payload = {
        "user_id": user_id,
        "date_of_birth": data.date_of_birth.isoformat(),
        "gender": data.gender.value,
        "university_name": data.university_name,
        "college": data.college,
        "degree": data.degree,
        "specialization": data.specialization,
        "budget_min": data.budget_min,
        "budget_max": data.budget_max,
        "preferred_room_type": data.preferred_room_type.value,
    }

    # Upsert: update if already exists, insert if not
    existing = db.table("student_profiles").select(
        "id").eq("user_id", user_id).execute()

    if existing.data:
        result = db.table("student_profiles").update(
            payload).eq("user_id", user_id).execute()
    else:
        result = db.table("student_profiles").insert(payload).execute()

    if not result.data:
        raise HTTPException(
            status_code=500, detail="Failed to save student profile.")

    return result.data[0]
