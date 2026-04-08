from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional


class Property(SQLModel, table=True):
    __tablename__ = "properties"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    owner_id: UUID = Field(foreign_key="users.id", index=True)

    title: str
    description: Optional[str] = None
    address: str
    city: str
    price_per_month: float
    rooms: int = Field(default=1)
    is_available: bool = Field(default=True)
    near_university: Optional[str] = None   # university name / distance tag
    image_url: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
