from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: Optional[datetime] = None


class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]


class UnreadCountResponse(BaseModel):
    count: int


class MessageResponse(BaseModel):
    message: str
