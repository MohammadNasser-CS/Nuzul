from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import date, datetime
from typing import Optional

from app.models.user import UserRole, Gender, PreferredRoomType, UniversityName, Degree


# ── User Profile ───────────────────────────────────────────────────────────────

class UserProfileRead(BaseModel):
    id: UUID
    supabase_user_id: str
    email: str
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CompleteProfileRequest(BaseModel):
    full_name: str
    phone_number: str
    role: UserRole


# ── Student Profile ────────────────────────────────────────────────────────────

class CompleteStudentProfileRequest(BaseModel):
    date_of_birth: date
    gender: Gender
    university_name: UniversityName
    college: str
    degree: Degree
    specialization: str
    budget_min: int
    budget_max: int
    preferred_room_type: PreferredRoomType


class StudentProfileRead(BaseModel):
    id: UUID
    user_id: UUID
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    university_name: Optional[UniversityName] = None
    college: Optional[str] = None
    degree: Optional[Degree] = None
    specialization: Optional[str] = None
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    preferred_room_type: Optional[PreferredRoomType] = None
    created_at: datetime

    model_config = {"from_attributes": True}
