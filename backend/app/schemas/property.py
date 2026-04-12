from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.property import PropertyType, GenderPreference, VerificationStatus


class PropertyCreate(BaseModel):
    title: str
    description: Optional[str] = None

    # Building
    building_name: Optional[str] = None
    building_number: Optional[str] = None
    floor_number: Optional[int] = None

    # Location
    city: str
    country: str = "Palestine"
    latitude: float
    longitude: float
    google_place_id: Optional[str] = None
    formatted_address: Optional[str] = None

    # Classification
    property_type: PropertyType

    # Preferences
    gender_preference: GenderPreference = GenderPreference.ANY

    # Amenities
    has_gas: bool = False
    has_electricity: bool = False
    has_water: bool = False
    has_internet: bool = False


class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

    building_name: Optional[str] = None
    building_number: Optional[str] = None
    floor_number: Optional[int] = None

    city: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    google_place_id: Optional[str] = None
    formatted_address: Optional[str] = None

    property_type: Optional[PropertyType] = None
    gender_preference: Optional[GenderPreference] = None

    has_gas: Optional[bool] = None
    has_electricity: Optional[bool] = None
    has_water: Optional[bool] = None
    has_internet: Optional[bool] = None

    is_active: Optional[bool] = None


class PropertyRead(BaseModel):
    id: UUID
    landlord_id: UUID

    title: str
    description: Optional[str] = None

    building_name: Optional[str] = None
    building_number: Optional[str] = None
    floor_number: Optional[int] = None

    city: str
    country: str
    latitude: float
    longitude: float
    google_place_id: Optional[str] = None
    formatted_address: Optional[str] = None

    property_type: PropertyType
    gender_preference: GenderPreference

    has_gas: bool
    has_electricity: bool
    has_water: bool
    has_internet: bool

    is_active: bool
    verification_status: VerificationStatus

    verified_at: Optional[datetime] = None
    verified_by: Optional[UUID] = None
    rejected_at: Optional[datetime] = None
    rejected_by: Optional[UUID] = None
    rejection_reason: Optional[str] = None
    admin_notes: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
