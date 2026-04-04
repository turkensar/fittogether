import random
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.challenge import DailyChallenge, ChallengeCompletion
from app.models.diet_break import DietBreakEvent
from app.schemas.social import ChallengeResponse, ChallengeCompleteRequest, DietBreakResponse
from app.services.auth import get_current_user
from app.services.gamification import (
    add_score, check_and_award_badges, get_random_punishment,
    create_notification,
)
from app.routers.pairing import get_active_couple, get_partner_id

router = APIRouter(prefix="/api/challenges", tags=["challenges"])


@router.get("/daily", response_model=list[ChallengeResponse])
def get_daily_challenge(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    challenges = db.query(DailyChallenge).all()
    if not challenges:
        return []

    # Deterministic daily pick based on date
    random.seed(today.toordinal())
    picked = random.sample(challenges, min(2, len(challenges)))
    random.seed()

    result = []
    for ch in picked:
        completed = db.query(ChallengeCompletion).filter(
            ChallengeCompletion.user_id == user.id,
            ChallengeCompletion.challenge_id == ch.id,
            ChallengeCompletion.date == today,
        ).first()
        result.append(ChallengeResponse(
            id=ch.id,
            title=ch.title,
            description=ch.description,
            points=ch.points,
            emoji=ch.emoji,
            completed=completed is not None,
        ))
    return result


@router.post("/complete")
def complete_challenge(data: ChallengeCompleteRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    existing = db.query(ChallengeCompletion).filter(
        ChallengeCompletion.user_id == user.id,
        ChallengeCompletion.challenge_id == data.challenge_id,
        ChallengeCompletion.date == today,
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Already completed today")

    challenge = db.query(DailyChallenge).filter(DailyChallenge.id == data.challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    completion = ChallengeCompletion(
        user_id=user.id, challenge_id=data.challenge_id, date=today
    )
    db.add(completion)
    db.commit()

    add_score(db, user.id, "challenge_complete", challenge.points,
              f"Completed: {challenge.title}")
    check_and_award_badges(db, user.id)

    couple = get_active_couple(db, user.id)
    if couple:
        partner_id = get_partner_id(couple, user.id)
        create_notification(db, partner_id, "challenge", "Challenge completed!",
                           f"{user.name} completed: {challenge.title} 🎉")

    return {"message": "Challenge completed!", "points": challenge.points}


@router.post("/diet-break", response_model=DietBreakResponse)
def break_diet(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    punishment = get_random_punishment()
    points_lost = 15

    event = DietBreakEvent(
        user_id=user.id,
        punishment=punishment,
        points_lost=points_lost,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    add_score(db, user.id, "diet_break", -points_lost, "Broke the diet")

    couple = get_active_couple(db, user.id)
    if couple:
        partner_id = get_partner_id(couple, user.id)
        create_notification(db, partner_id, "diet_break", "Diet broken!",
                           f"{user.name} broke the diet! Punishment: {punishment}")

    return event
