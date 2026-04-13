from pydantic import BaseModel, field_validator, model_validator
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from app.models.property import RoomType


class RoomCreate(BaseModel):
    property_id: UUID
    description: Optional[str] = None
    price_per_bed: Decimal
    available_from: Optional[date] = None
    room_type: RoomType
    number_of_beds: int = 1
    available_beds: int = 1

    has_internal_bathroom: bool = False
    has_internal_balcony: bool = False
    has_ac: bool = False
    has_office: bool = False

    @field_validator("price_per_bed")
    @classmethod
    def price_must_be_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("price_per_bed must be greater than 0.")
        return v

    @model_validator(mode="after")
    def beds_consistency(self) -> "RoomCreate":
        if self.available_beds < 0:
            raise ValueError("available_beds cannot be negative.")
        if self.available_beds > self.number_of_beds:
            raise ValueError("available_beds cannot exceed number_of_beds.")
        return self


class RoomUpdate(BaseModel):
    description: Optional[str] = None
    price_per_bed: Optional[Decimal] = None
    available_from: Optional[date] = None
    room_type: Optional[RoomType] = None
    number_of_beds: Optional[int] = None
    available_beds: Optional[int] = None

    has_internal_bathroom: Optional[bool] = None
    has_internal_balcony: Optional[bool] = None
    has_ac: Optional[bool] = None
    has_office: Optional[bool] = None

    is_active: Optional[bool] = None

    @field_validator("price_per_bed")
    @classmethod
    def price_must_be_positive(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v <= 0:
            raise ValueError("price_per_bed must be greater than 0.")
        return v


class RoomRead(BaseModel):
    id: UUID
    property_id: UUID
    description: Optional[str] = None
    price_per_bed: Decimal
    available_from: Optional[date] = None
    room_type: RoomType
    number_of_beds: int
    available_beds: int
    is_available: bool  # derived: available_beds > 0

    has_internal_bathroom: bool
    has_internal_balcony: bool
    has_ac: bool
    has_office: bool

    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
