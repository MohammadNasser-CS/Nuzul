from enum import Enum
from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from datetime import date, datetime
from typing import Optional


class UserRole(str, Enum):
    STUDENT = "STUDENT"
    LANDLORD = "LANDLORD"
    ADMIN = "ADMIN"


class Gender(str, Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"


class PreferredRoomType(str, Enum):
    SINGLE = "SINGLE"
    SHARED = "SHARED"
    STUDIO = "STUDIO"
    NO_PREFERENCE = "NO_PREFERENCE"


class UniversityName(str, Enum):
    AN_NAJAH = "An-Najah National University"
    # BIRZEIT   = "Birzeit University"
    # PPU       = "Palestine Polytechnic University"
    # AL_QUDS   = "Al-Quds University"
    # AAUP      = "Arab American University"
    # HEBRON    = "Hebron University"
    # BETHLEHEM = "Bethlehem University"
    # AL_AZHAR_GAZA = "Al-Azhar University Gaza"
    # IUG       = "Islamic University of Gaza"
    # QOU       = "Al-Quds Open University"
    # PTUK      = "Palestine Technical University - Kadoorie"


class Degree(str, Enum):
    DIPLOMA = "Diploma"
    BACHELOR = "Bachelor"
    MASTER = "Master"
    DOCTORATE = "Doctorate"


class UserProfile(SQLModel, table=True):
    __tablename__ = "user_profiles"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    supabase_user_id: str = Field(
        unique=True, index=True)  # maps to auth.users.id
    email: str = Field(unique=True, index=True)

    full_name: Optional[str] = None
    phone_number: Optional[str] = None

    role: Optional[UserRole] = None

    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class StudentProfile(SQLModel, table=True):
    __tablename__ = "student_profiles"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user_profiles.id", unique=True)

    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None

    university_name: Optional[UniversityName] = None
    college: Optional[str] = None
    degree: Optional[Degree] = None
    specialization: Optional[str] = None

    budget_min: Optional[int] = None
    budget_max: Optional[int] = None

    preferred_room_type: Optional[PreferredRoomType] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
