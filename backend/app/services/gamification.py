import random

from sqlalchemy.orm import Session

from app.models.gamification import ScoreEvent, Badge, UserBadge
from app.models.notification import Notification

PUNISHMENTS = [
    "Yarın partnerine bir kahve ısmarla! ☕",
    "Partnerine tatlı bir motivasyon notu yaz 💌",
    "Bugün 20 dakika yürüyüşe çık 🚶",
    "Bugün 3 bardak fazladan su iç 💧",
    "Bugün partnerine 3 cesaretlendirici mesaj gönder 💬",
    "Yarın ikinize de sağlıklı bir akşam yemeği seç 🥗",
    "10 dakika esneme hareketi yap 🧘",
    "Partnerine sağlıklı bir atıştırmalık hazırla 🍎",
    "Sonraki öğünde telefona bakma 📵",
    "Partnerinle sağlıklı bir tarif paylaş 📖",
    "Partnerine içten bir iltifat et 😊",
    "Bu hafta partnerinle birlikte sağlıklı bir öğün planla 🍽️",
    "Bugün 15 dakika meditasyon yap 🧘‍♀️",
    "Partnerine sarıl ve 'Başarırız' de 🤗",
    "Yarın kahvaltıda şekersiz ilerle 🍳",
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
