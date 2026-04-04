from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.message import Message
from app.models.notification import Notification
from app.schemas.social import MessageCreate, MessageResponse, NotificationResponse
from app.services.auth import get_current_user
from app.services.gamification import create_notification
from app.routers.pairing import get_active_couple, get_partner_id

router = APIRouter(prefix="/api/social", tags=["social"])


# --- Messages ---
@router.post("/messages", response_model=MessageResponse)
def send_message(data: MessageCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = get_active_couple(db, user.id)
    if not couple:
        raise HTTPException(status_code=400, detail="Not paired")

    msg = Message(couple_id=couple.id, sender_id=user.id, content=data.content)
    db.add(msg)
    db.commit()
    db.refresh(msg)

    partner_id = get_partner_id(couple, user.id)
    create_notification(db, partner_id, "message", "New message",
                       f"{user.name}: {data.content[:50]}")

    return msg


@router.get("/messages", response_model=list[MessageResponse])
def get_messages(
    limit: int = Query(50, le=200),
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    couple = get_active_couple(db, user.id)
    if not couple:
        raise HTTPException(status_code=400, detail="Not paired")

    messages = db.query(Message).filter(
        Message.couple_id == couple.id
    ).order_by(Message.created_at.desc()).offset(offset).limit(limit).all()

    # Mark received messages as read
    db.query(Message).filter(
        Message.couple_id == couple.id,
        Message.sender_id != user.id,
        Message.is_read == False,
    ).update({"is_read": True})
    db.commit()

    return messages


@router.get("/messages/unread-count")
def unread_count(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = get_active_couple(db, user.id)
    if not couple:
        return {"count": 0}

    count = db.query(Message).filter(
        Message.couple_id == couple.id,
        Message.sender_id != user.id,
        Message.is_read == False,
    ).count()
    return {"count": count}


# --- Notifications ---
@router.get("/notifications", response_model=list[NotificationResponse])
def get_notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Notification).filter(
        Notification.user_id == user.id
    ).order_by(Notification.created_at.desc()).limit(50).all()


@router.post("/notifications/read-all")
def mark_all_read(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(
        Notification.user_id == user.id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


@router.get("/notifications/unread-count")
def unread_notification_count(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    count = db.query(Notification).filter(
        Notification.user_id == user.id,
        Notification.is_read == False,
    ).count()
    return {"count": count}
