import random

from sqlalchemy.orm import Session

from app.models.gamification import ScoreEvent, Badge, UserBadge
from app.models.notification import Notification

PUNISHMENTS = [
    "Buy your partner a coffee tomorrow! ☕",
    "Write a sweet motivational note for your partner 💌",
    "Go for a 20-minute walk today 🚶",
    "Drink 3 extra glasses of water today 💧",
    "Send your partner 3 encouraging messages today 💬",
    "Choose a healthy dinner for both of you tomorrow 🥗",
    "Do 10 minutes of stretching 🧘",
    "Prepare a healthy snack for your partner 🍎",
    "No phone during the next meal 📵",
    "Share a healthy recipe with your partner 📖",
    "Give your partner a genuine compliment 😊",
    "Plan a healthy meal together this week 🍽️",
]


def get_random_punishment() -> str:
    return random.choice(PUNISHMENTS)


def add_score(db: Session, user_id: str, event_type: str, points: int, description: str):
    event = ScoreEvent(
        user_id=user_id,
        event_type=event_type,
        points=points,
        description=description,
    )
    db.add(event)
    db.commit()
    return event


def get_total_score(db: Session, user_id: str) -> int:
    from sqlalchemy import func
    result = db.query(func.coalesce(func.sum(ScoreEvent.points), 0)).filter(
        ScoreEvent.user_id == user_id
    ).scalar()
    return result


def create_notification(db: Session, user_id: str, type: str, title: str, message: str):
    notif = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
    )
    db.add(notif)
    db.commit()
    return notif


def check_and_award_badges(db: Session, user_id: str):
    total = get_total_score(db, user_id)
    badges = db.query(Badge).all()

    for badge in badges:
        existing = db.query(UserBadge).filter(
            UserBadge.user_id == user_id,
            UserBadge.badge_id == badge.id
        ).first()

        if not existing and total >= badge.points_required:
            user_badge = UserBadge(user_id=user_id, badge_id=badge.id)
            db.add(user_badge)

    db.commit()
