from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.modules.notifications.models import Notification
from app.modules.notifications.schemas import (
    NotificationResponse,
    UnreadCountResponse,
    MessageResponse
)

router = APIRouter()


@router.get("/", response_model=list[NotificationResponse])
def list_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    return db.query(Notification).filter(
        Notification.user_id == current_user["user_id"]
    ).order_by(Notification.created_at.desc()).limit(50).all()


@router.get("/unread-count", response_model=UnreadCountResponse)
def unread_count(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    count = db.query(Notification).filter(
        Notification.user_id == current_user["user_id"],
        Notification.is_read == False
    ).count()

    return UnreadCountResponse(count=count)


@router.post("/{notification_id}/read", response_model=MessageResponse)
def mark_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user["user_id"]
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()

    return MessageResponse(message="Marked as read")
