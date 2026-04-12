from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.property import ImageEntityType


class ImageRead(BaseModel):
    id: UUID
    entity_id: UUID
    entity_type: ImageEntityType
    image_url: str
    storage_path: Optional[str] = None
    is_primary: bool
    created_at: datetime

    model_config = {"from_attributes": True}
