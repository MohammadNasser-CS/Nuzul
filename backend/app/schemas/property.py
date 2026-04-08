from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class PropertyBase(BaseModel):
    title: str
    description: Optional[str] = None
    address: str
    city: str
    price_per_month: float
    rooms: int = 1
    is_available: bool = True
    near_university: Optional[str] = None
    image_url: Optional[str] = None


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    price_per_month: Optional[float] = None
    rooms: Optional[int] = None
    is_available: Optional[bool] = None
    near_university: Optional[str] = None
    image_url: Optional[str] = None


class PropertyRead(PropertyBase):
    id: UUID
    owner_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
