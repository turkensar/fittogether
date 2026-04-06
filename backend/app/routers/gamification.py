from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.gamification import ScoreEvent, Badge, UserBadge
from app.models.meal import Meal
from app.models.water_log import WaterLog
from app.models.weight_log import WeightLog
from app.models.challenge import ChallengeCompletion
from app.schemas.social import ScoreResponse, BadgeResponse
from app.services.auth import get_current_user
from app.services.gamification import get_total_score
from app.routers.pairing import get_active_couple, get_partner_id

router = APIRouter(prefix="/api/gamification", tags=["gamification"])


@router.get("/score")
def my_score(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total = get_total_score(db, user.id)
    events = db.query(ScoreEvent).filter(
        ScoreEvent.user_id == user.id
    ).order_by(ScoreEvent.created_at.desc()).limit(20).all()

    return {
        "total_points": total,
        "events": [
            {"type": e.event_type, "points": e.points, "description": e.description,
             "date": e.created_at.isoformat()}
            for e in events
        ],
    }


@router.get("/leaderboard")
def couple_leaderboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = get_active_couple(db, user.id)
    my_score = get_total_score(db, user.id)

    result = {"my_score": my_score, "partner_score": 0, "partner_name": ""}

    if couple:
        partner_id = get_partner_id(couple, user.id)
        partner = db.query(User).filter(User.id == partner_id).first()
        result["partner_score"] = get_total_score(db, partner_id)
        result["partner_name"] = partner.name if partner else ""

    return result


@router.get("/badges", response_model=list[BadgeResponse])
def my_badges(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    all_badges = db.query(Badge).all()
    user_badge_ids = {
        ub.badge_id: ub.earned_at
        for ub in db.query(UserBadge).filter(UserBadge.user_id == user.id).all()
    }

    return [
        BadgeResponse(
            id=b.id, name=b.name, description=b.description,
            emoji=b.emoji, earned_at=user_badge_ids.get(b.id)
        )
        for b in all_badges
    ]


@router.get("/streak")
def get_streak(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    streak = 0
    current_date = today

    while True:
        has_meal = db.query(Meal).filter(
            Meal.user_id == user.id,
            func.date(Meal.created_at) == current_date,
        ).first()

        if has_meal:
            streak += 1
            current_date -= timedelta(days=1)
        else:
            break

    # Combined couple streak
    couple_streak = streak
    couple = get_active_couple(db, user.id)
    if couple:
        partner_id = get_partner_id(couple, user.id)
        partner_streak = 0
        current_date = today
        while True:
            has_meal = db.query(Meal).filter(
                Meal.user_id == partner_id,
                func.date(Meal.created_at) == current_date,
            ).first()
            if has_meal:
                partner_streak += 1
                current_date -= timedelta(days=1)
            else:
                break
        couple_streak = min(streak, partner_streak)

    return {
        "my_streak": streak,
        "couple_streak": couple_streak,
    }


@router.get("/dashboard-summary")
def dashboard_summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()

    my_cals = db.query(func.coalesce(func.sum(Meal.total_calories), 0)).filter(
        Meal.user_id == user.id, func.date(Meal.created_at) == today
    ).scalar()

    my_score = get_total_score(db, user.id)

    result = {
        "my_calories": my_cals,
        "my_goal": user.daily_calorie_goal,
        "my_remaining": max(0, user.daily_calorie_goal - my_cals),
        "my_score": my_score,
        "partner_calories": 0,
        "partner_goal": 0,
        "partner_remaining": 0,
        "partner_score": 0,
        "partner_name": "",
        "partner_emoji": "",
        "couple_score": my_score,
    }

    couple = get_active_couple(db, user.id)
    if couple:
        partner_id = get_partner_id(couple, user.id)
        partner = db.query(User).filter(User.id == partner_id).first()

        partner_cals = db.query(func.coalesce(func.sum(Meal.total_calories), 0)).filter(
            Meal.user_id == partner_id, func.date(Meal.created_at) == today
        ).scalar()

        p_score = get_total_score(db, partner_id)

        result.update({
            "partner_calories": partner_cals,
            "partner_goal": partner.daily_calorie_goal,
            "partner_remaining": max(0, partner.daily_calorie_goal - partner_cals),
            "partner_score": p_score,
            "partner_name": partner.name,
            "partner_emoji": partner.avatar_emoji,
            "couple_score": my_score + p_score,
        })

    return result


@router.get("/weekly-report")
def weekly_report(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Weekly summary: total calories, water, weight change, challenges completed."""
    today = date.today()
    week_start = today - timedelta(days=6)

    # Total calories this week
    total_calories = db.query(func.coalesce(func.sum(Meal.total_calories), 0)).filter(
        Meal.user_id == user.id,
        func.date(Meal.created_at) >= week_start,
        func.date(Meal.created_at) <= today,
    ).scalar()

    avg_calories = round(total_calories / 7) if total_calories > 0 else 0

    # Total water this week
    total_water = db.query(func.coalesce(func.sum(WaterLog.amount_ml), 0)).filter(
        WaterLog.user_id == user.id,
        WaterLog.date >= week_start,
        WaterLog.date <= today,
    ).scalar()
    avg_water = round(total_water / 7) if total_water > 0 else 0

    # Weight change
    weight_start = db.query(WeightLog).filter(
        WeightLog.user_id == user.id,
        func.date(WeightLog.logged_at) >= week_start,
    ).order_by(WeightLog.logged_at.asc()).first()

    weight_end = db.query(WeightLog).filter(
        WeightLog.user_id == user.id,
        func.date(WeightLog.logged_at) <= today,
    ).order_by(WeightLog.logged_at.desc()).first()

    weight_change = 0.0
    if weight_start and weight_end:
        weight_change = round(weight_end.weight - weight_start.weight, 1)

    # Challenges completed this week
    challenges_completed = db.query(ChallengeCompletion).filter(
        ChallengeCompletion.user_id == user.id,
        ChallengeCompletion.date >= week_start,
        ChallengeCompletion.date <= today,
    ).count()

    # Points earned this week
    points_earned = db.query(func.coalesce(func.sum(ScoreEvent.points), 0)).filter(
        ScoreEvent.user_id == user.id,
        func.date(ScoreEvent.created_at) >= week_start,
        func.date(ScoreEvent.created_at) <= today,
    ).scalar()

    # Days with meal logs
    active_days = db.query(func.date(Meal.created_at)).filter(
        Meal.user_id == user.id,
        func.date(Meal.created_at) >= week_start,
        func.date(Meal.created_at) <= today,
    ).distinct().count()

    return {
        "week_start": week_start.isoformat(),
        "week_end": today.isoformat(),
        "total_calories": total_calories,
        "avg_calories": avg_calories,
        "total_water_ml": total_water,
        "avg_water_ml": avg_water,
        "weight_change": weight_change,
        "challenges_completed": challenges_completed,
        "points_earned": points_earned,
        "active_days": active_days,
        "calorie_goal": user.daily_calorie_goal,
    }
