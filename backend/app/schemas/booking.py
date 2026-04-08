from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class BookingBase(BaseModel):
    property_id: UUID
    move_in_date: datetime
    move_out_date: Optional[datetime] = None
    message: Optional[str] = None


class BookingCreate(BookingBase):
    pass


class BookingUpdate(BaseModel):
    status: Optional[str] = None
    move_out_date: Optional[datetime] = None


class BookingRead(BookingBase):
    id: UUID
    student_id: UUID
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
