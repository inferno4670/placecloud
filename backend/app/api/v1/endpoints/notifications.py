from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, get_staff_user
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationOut, NotificationBroadcast
from app.services.notification_service import NotificationService

router = APIRouter()

@router.get("/", response_model=List[NotificationOut])
def get_user_notifications(
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    return query.order_by(Notification.created_at.desc()).limit(50).all()

@router.patch("/{id}/read", response_model=NotificationOut)
def mark_notification_read(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(
        Notification.id == id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif

@router.post("/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}

@router.post("/broadcast")
def broadcast_announcement(
    payload: NotificationBroadcast,
    current_user: User = Depends(get_staff_user),
    db: Session = Depends(get_db)
):
    count = NotificationService.broadcast(
        db=db,
        title=payload.title,
        message=payload.message,
        type=payload.type or "SYSTEM",
        link=payload.link,
        role=payload.role
    )
    return {"message": f"Broadcast delivered to {count} recipient(s)"}
