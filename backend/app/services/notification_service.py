from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.user import User, UserRole

class NotificationService:
    @staticmethod
    def send(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        type: str = "INFO",
        link: Optional[str] = None
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            link=link
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif

    @staticmethod
    def broadcast(
        db: Session,
        title: str,
        message: str,
        type: str = "INFO",
        link: Optional[str] = None,
        role: Optional[str] = None
    ) -> int:
        query = db.query(User).filter(User.is_active == True)
        if role:
            query = query.filter(User.role == role)
        users = query.all()

        count = 0
        for u in users:
            notif = Notification(
                user_id=u.id,
                title=title,
                message=message,
                type=type,
                link=link
            )
            db.add(notif)
            count += 1

        db.commit()
        return count
