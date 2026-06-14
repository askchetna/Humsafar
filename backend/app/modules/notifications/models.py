import uuid
from datetime import datetime

from sqlalchemy import Column, String, Boolean, DateTime, Text
from app.database.base import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String, default="info")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
