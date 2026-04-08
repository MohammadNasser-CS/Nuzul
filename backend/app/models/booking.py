from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional


class Booking(SQLModel, table=True):
    __tablename__ = "bookings"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    property_id: UUID = Field(foreign_key="properties.id", index=True)
    student_id: UUID = Field(foreign_key="users.id", index=True)

    status: str = Field(default="pending")   # pending | confirmed | cancelled
    move_in_date: datetime
    move_out_date: Optional[datetime] = None
    message: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
