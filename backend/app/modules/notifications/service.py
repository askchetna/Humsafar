import uuid

from sqlalchemy.orm import Session

from app.modules.notifications.models import Notification


def create_notification(
    db: Session,
    user_id: str,
    title: str,
    message: str,
    notification_type: str = "info"
):

    notification = Notification(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification
