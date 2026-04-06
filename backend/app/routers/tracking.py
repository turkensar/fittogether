from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.weight_log import WeightLog
from app.models.water_log import WaterLog
from app.models.cheat_day import CheatDay
from app.schemas.tracking import (
    WeightLogCreate, WeightLogResponse,
    WaterLogCreate, WaterLogResponse,
    CheatDayCreate, CheatDayResponse,
)
from app.services.auth import get_current_user
from app.services.gamification import add_score, check_and_award_badges
from app.routers.pairing import get_active_couple, get_partner_id

router = APIRouter(prefix="/api/tracking", tags=["tracking"])


# --- Weight ---
@router.post("/weight", response_model=WeightLogResponse)
def log_weight(data: WeightLogCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log = WeightLog(user_id=user.id, weight=data.weight)
    user.current_weight = data.weight
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/weight", response_model=list[WeightLogResponse])
def get_weight_logs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(WeightLog).filter(WeightLog.user_id == user.id).order_by(WeightLog.logged_at).all()


@router.get("/weight/progress")
def weight_progress(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logs = db.query(WeightLog).filter(WeightLog.user_id == user.id).order_by(WeightLog.logged_at).all()
    start_weight = logs[0].weight if logs else user.current_weight or 0
    current = user.current_weight or start_weight
    target = user.target_weight or current

    total_to_lose = start_weight - target if start_weight > target else 0
    lost = start_weight - current if start_weight > current else 0
    pct = (lost / total_to_lose * 100) if total_to_lose > 0 else 0

    return {
        "start_weight": start_weight,
        "current_weight": current,
        "target_weight": target,
        "lost": round(lost, 1),
        "percentage": round(pct, 1),
        "logs": [{"weight": l.weight, "date": l.logged_at.isoformat()} for l in logs],
    }


@router.get("/weight/partner-progress")
def partner_weight_progress(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = get_active_couple(db, user.id)
    if not couple:
        raise HTTPException(status_code=400, detail="Not paired")

    partner_id = get_partner_id(couple, user.id)
    partner = db.query(User).filter(User.id == partner_id).first()
    logs = db.query(WeightLog).filter(WeightLog.user_id == partner_id).order_by(WeightLog.logged_at).all()

    start_weight = logs[0].weight if logs else partner.current_weight or 0
    current = partner.current_weight or start_weight
    target = partner.target_weight or current
    total_to_lose = start_weight - target if start_weight > target else 0
    lost = start_weight - current if start_weight > current else 0
    pct = (lost / total_to_lose * 100) if total_to_lose > 0 else 0

    return {
        "name": partner.name,
        "start_weight": start_weight,
        "current_weight": current,
        "target_weight": target,
        "lost": round(lost, 1),
        "percentage": round(pct, 1),
        "logs": [{"weight": l.weight, "date": l.logged_at.isoformat()} for l in logs],
    }


# --- Water ---
@router.post("/water", response_model=WaterLogResponse)
def log_water(data: WaterLogCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log = WaterLog(user_id=user.id, amount_ml=data.amount_ml, date=date.today())
    db.add(log)
    db.commit()
    db.refresh(log)

    daily_total = db.query(func.coalesce(func.sum(WaterLog.amount_ml), 0)).filter(
        WaterLog.user_id == user.id, WaterLog.date == date.today()
    ).scalar()

    if daily_total >= 2000:
        add_score(db, user.id, "water_goal", 5, "Drank 2L+ water today!")
        check_and_award_badges(db, user.id)

    return log


@router.get("/water/weekly")
def weekly_water(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    days = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        total = db.query(func.coalesce(func.sum(WaterLog.amount_ml), 0)).filter(
            WaterLog.user_id == user.id, WaterLog.date == d
        ).scalar()
        days.append({"date": d.isoformat(), "amount_ml": total})
    return days


@router.get("/water/today")
def today_water(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    my_total = db.query(func.coalesce(func.sum(WaterLog.amount_ml), 0)).filter(
        WaterLog.user_id == user.id, WaterLog.date == date.today()
    ).scalar()

    partner_total = 0
    couple = get_active_couple(db, user.id)
    if couple:
        partner_id = get_partner_id(couple, user.id)
        partner_total = db.query(func.coalesce(func.sum(WaterLog.amount_ml), 0)).filter(
            WaterLog.user_id == partner_id, WaterLog.date == date.today()
        ).scalar()

    return {"my_water_ml": my_total, "partner_water_ml": partner_total}


# --- Cheat Days ---
@router.post("/cheat-day", response_model=CheatDayResponse)
def mark_cheat_day(data: CheatDayCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    target_date = data.date or date.today()
    existing = db.query(CheatDay).filter(
        CheatDay.user_id == user.id, CheatDay.date == target_date
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already marked as cheat day")

    # Check weekly limit
    couple = get_active_couple(db, user.id)
    max_per_week = couple.max_cheat_days_per_week if couple else 2
    week_start = target_date - timedelta(days=target_date.weekday())
    week_count = db.query(CheatDay).filter(
        CheatDay.user_id == user.id,
        CheatDay.date >= week_start,
        CheatDay.date < week_start + timedelta(days=7),
    ).count()

    if week_count >= max_per_week:
        raise HTTPException(status_code=400, detail=f"Max {max_per_week} cheat days per week reached")

    cheat = CheatDay(user_id=user.id, date=target_date)
    db.add(cheat)
    db.commit()
    db.refresh(cheat)
    return cheat


@router.get("/cheat-days/weekly")
def weekly_cheat_days(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    my_count = db.query(CheatDay).filter(
        CheatDay.user_id == user.id,
        CheatDay.date >= week_start,
        CheatDay.date < week_start + timedelta(days=7),
    ).count()

    partner_count = 0
    couple = get_active_couple(db, user.id)
    max_per_week = couple.max_cheat_days_per_week if couple else 2
    if couple:
        partner_id = get_partner_id(couple, user.id)
        partner_count = db.query(CheatDay).filter(
            CheatDay.user_id == partner_id,
            CheatDay.date >= week_start,
            CheatDay.date < week_start + timedelta(days=7),
        ).count()

    return {
        "my_cheat_days": my_count,
        "partner_cheat_days": partner_count,
        "max_per_week": max_per_week,
    }
