from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.message import Message
from app.models.notification import Notification
from app.models.water_log import WaterLog
from app.models.challenge import ChallengeCompletion
from app.models.meal import Meal
from app.schemas.social import MessageCreate, MessageResponse, NotificationResponse
from app.services.auth import get_current_user
from app.services.gamification import create_notification, get_total_score
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


@router.get("/partner-comparison")
def partner_comparison(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = get_active_couple(db, user.id)
    if not couple:
        raise HTTPException(status_code=400, detail="Not paired")

    partner_id = get_partner_id(couple, user.id)
    partner = db.query(User).filter(User.id == partner_id).first()
    today = date.today()

    def day_water(uid: str) -> int:
        return db.query(func.coalesce(func.sum(WaterLog.amount_ml), 0)).filter(
            WaterLog.user_id == uid, WaterLog.date == today
        ).scalar()

    def day_calories(uid: str) -> int:
        return db.query(func.coalesce(func.sum(Meal.total_calories), 0)).filter(
            Meal.user_id == uid, func.date(Meal.created_at) == today
        ).scalar()

    def total_challenges(uid: str) -> int:
        return db.query(ChallengeCompletion).filter(ChallengeCompletion.user_id == uid).count()

    return {
        "my_name": user.name,
        "partner_name": partner.name if partner else "",
        "my_water": day_water(user.id),
        "partner_water": day_water(partner_id),
        "my_calories": day_calories(user.id),
        "partner_calories": day_calories(partner_id),
        "my_goal": user.daily_calorie_goal,
        "partner_goal": partner.daily_calorie_goal if partner else 2000,
        "my_challenges": total_challenges(user.id),
        "partner_challenges": total_challenges(partner_id),
        "my_score": get_total_score(db, user.id),
        "partner_score": get_total_score(db, partner_id),
    }


@router.get("/reminders")
def daily_reminders(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Check today's activity and return relevant reminders."""
    today = date.today()
    now = datetime.utcnow()
    hour = now.hour
    reminders = []

    # Water check
    water_total = db.query(func.coalesce(func.sum(WaterLog.amount_ml), 0)).filter(
        WaterLog.user_id == user.id, WaterLog.date == today
    ).scalar()
    if water_total < 2000:
        remaining_l = round((2000 - water_total) / 1000, 1)
        reminders.append({
            "type": "water",
            "icon": "droplets",
            "title": "Su içmeyi unutma!",
            "message": f"Bugün {remaining_l}L daha su içmen gerekiyor.",
            "priority": "medium" if water_total < 1000 else "low",
        })

    # Meal check
    meal_count = db.query(Meal).filter(
        Meal.user_id == user.id, func.date(Meal.created_at) == today
    ).count()
    total_cals = db.query(func.coalesce(func.sum(Meal.total_calories), 0)).filter(
        Meal.user_id == user.id, func.date(Meal.created_at) == today
    ).scalar()

    if meal_count == 0:
        reminders.append({
            "type": "meal",
            "icon": "utensils",
            "title": "Bugün henüz öğün eklenmedi",
            "message": "Sağlıklı bir kahvaltı ile güne başla!",
            "priority": "high",
        })
    elif meal_count < 3 and hour >= 18:
        reminders.append({
            "type": "meal",
            "icon": "utensils",
            "title": "Öğünlerini tamamla",
            "message": f"Bugün {meal_count} öğün kaydettin. Eksik öğünlerini girmeyi unutma!",
            "priority": "medium",
        })

    # Challenge check
    from app.models.challenge import DailyChallenge, ChallengeCompletion
    import random
    challenges = db.query(DailyChallenge).all()
    if challenges:
        random.seed(today.toordinal())
        picked = random.sample(challenges, min(2, len(challenges)))
        random.seed()
        completed_ids = {
            c.challenge_id for c in db.query(ChallengeCompletion).filter(
                ChallengeCompletion.user_id == user.id,
                ChallengeCompletion.date == today,
            ).all()
        }
        pending = [c for c in picked if c.id not in completed_ids]
        if pending:
            reminders.append({
                "type": "challenge",
                "icon": "target",
                "title": f"{len(pending)} challenge bekliyor",
                "message": pending[0].title + (" ve daha fazlası..." if len(pending) > 1 else ""),
                "priority": "low",
            })

    # Calorie check
    if total_cals > 0 and total_cals > user.daily_calorie_goal:
        over = total_cals - user.daily_calorie_goal
        reminders.append({
            "type": "calorie_warning",
            "icon": "flame",
            "title": "Kalori hedefini aştın!",
            "message": f"Bugün hedefinden {over} kcal fazla tükettin.",
            "priority": "high",
        })

    return reminders
