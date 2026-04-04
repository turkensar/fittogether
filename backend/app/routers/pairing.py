from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.couple import CouplePair
from app.schemas.couple import PairRequest, CoupleResponse, CoupleSettingsUpdate, PartnerInfo
from app.services.auth import get_current_user
from app.services.gamification import create_notification

router = APIRouter(prefix="/api/pairing", tags=["pairing"])


def get_active_couple(db: Session, user_id: str) -> CouplePair | None:
    return db.query(CouplePair).filter(
        CouplePair.is_active == True,
        (CouplePair.user1_id == user_id) | (CouplePair.user2_id == user_id)
    ).first()


def get_partner_id(couple: CouplePair, user_id: str) -> str:
    return couple.user2_id if couple.user1_id == user_id else couple.user1_id


@router.get("/status")
def pairing_status(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = get_active_couple(db, user.id)
    if not couple:
        return {"paired": False, "invite_code": user.invite_code}

    partner_id = get_partner_id(couple, user.id)
    partner = db.query(User).filter(User.id == partner_id).first()

    return {
        "paired": True,
        "couple_id": couple.id,
        "invite_code": user.invite_code,
        "partner": PartnerInfo(
            id=partner.id,
            name=partner.name,
            avatar_emoji=partner.avatar_emoji,
            avatar_color=partner.avatar_color,
            daily_calorie_goal=partner.daily_calorie_goal,
            current_weight=partner.current_weight,
            target_weight=partner.target_weight,
        ),
        "max_cheat_days_per_week": couple.max_cheat_days_per_week,
    }


@router.post("/match", response_model=CoupleResponse)
def match_partner(data: PairRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = get_active_couple(db, user.id)
    if existing:
        raise HTTPException(status_code=400, detail="You are already paired with someone")

    partner = db.query(User).filter(User.invite_code == data.partner_code).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Invalid partner code")

    if partner.id == user.id:
        raise HTTPException(status_code=400, detail="You cannot pair with yourself")

    partner_existing = get_active_couple(db, partner.id)
    if partner_existing:
        raise HTTPException(status_code=400, detail="This person is already paired with someone")

    couple = CouplePair(user1_id=user.id, user2_id=partner.id)
    db.add(couple)
    db.commit()
    db.refresh(couple)

    create_notification(db, partner.id, "pairing", "New Partner!",
                       f"{user.name} has paired with you! Let's start your diet journey together! 💪")

    return CoupleResponse.model_validate(couple)


@router.post("/unmatch")
def unmatch(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = get_active_couple(db, user.id)
    if not couple:
        raise HTTPException(status_code=400, detail="You are not paired with anyone")

    partner_id = get_partner_id(couple, user.id)
    couple.is_active = False
    couple.unmatched_at = datetime.utcnow()
    db.commit()

    create_notification(db, partner_id, "pairing", "Partner Unmatched",
                       f"{user.name} has unmatched. You can find a new partner anytime!")

    return {"message": "Successfully unmatched"}


@router.put("/settings", response_model=CoupleResponse)
def update_couple_settings(data: CoupleSettingsUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = get_active_couple(db, user.id)
    if not couple:
        raise HTTPException(status_code=400, detail="You are not paired")

    couple.max_cheat_days_per_week = data.max_cheat_days_per_week
    db.commit()
    db.refresh(couple)
    return CoupleResponse.model_validate(couple)
