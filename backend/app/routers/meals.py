from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.meal import Meal, MealItem
from app.models.food import Food
from app.schemas.meal import MealCreate, MealResponse, FoodResponse
from app.services.auth import get_current_user
from app.services.gamification import add_score, check_and_award_badges, create_notification
from app.routers.pairing import get_active_couple, get_partner_id

router = APIRouter(prefix="/api/meals", tags=["meals"])


@router.get("/foods", response_model=list[FoodResponse])
def search_foods(q: str = Query("", min_length=0), db: Session = Depends(get_db)):
    query = db.query(Food)
    if q:
        query = query.filter(Food.name.ilike(f"%{q}%"))
    return query.limit(20).all()


@router.post("", response_model=MealResponse)
def create_meal(data: MealCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    meal = Meal(
        user_id=user.id,
        title=data.title,
        meal_type=data.meal_type,
        description=data.description,
    )

    total = 0
    for item_data in data.items:
        cal = item_data.calories
        protein = item_data.protein or 0
        carbs = item_data.carbs or 0
        fat = item_data.fat or 0

        if item_data.food_id:
            food = db.query(Food).filter(Food.id == item_data.food_id).first()
            if food:
                ratio = item_data.quantity_g / 100
                if cal is None:
                    cal = int(food.calories_per_100g * ratio)
                if not item_data.protein:
                    protein = round(food.protein_per_100g * ratio, 1)
                if not item_data.carbs:
                    carbs = round(food.carbs_per_100g * ratio, 1)
                if not item_data.fat:
                    fat = round(food.fat_per_100g * ratio, 1)
        if cal is None:
            cal = 0

        meal_item = MealItem(
            food_id=item_data.food_id,
            custom_name=item_data.custom_name,
            quantity_g=item_data.quantity_g,
            calories=cal,
            protein=protein,
            carbs=carbs,
            fat=fat,
        )
        meal.items.append(meal_item)
        total += cal

    meal.total_calories = total
    db.add(meal)
    db.commit()
    db.refresh(meal)

    add_score(db, user.id, "meal_logged", 5, f"Logged meal: {data.title}")
    check_and_award_badges(db, user.id)

    # Notify partner
    couple = get_active_couple(db, user.id)
    if couple:
        partner_id = get_partner_id(couple, user.id)
        create_notification(db, partner_id, "meal", "Partner logged a meal",
                           f"{user.name} just logged: {data.title} ({total} cal)")

    return meal


@router.get("", response_model=list[MealResponse])
def get_meals(
    target_date: date | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Meal).filter(Meal.user_id == user.id)
    if target_date:
        query = query.filter(func.date(Meal.created_at) == target_date)
    return query.order_by(Meal.created_at.desc()).all()


@router.get("/partner", response_model=list[MealResponse])
def get_partner_meals(
    target_date: date | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    couple = get_active_couple(db, user.id)
    if not couple:
        raise HTTPException(status_code=400, detail="Not paired")

    partner_id = get_partner_id(couple, user.id)
    query = db.query(Meal).filter(Meal.user_id == partner_id)
    if target_date:
        query = query.filter(func.date(Meal.created_at) == target_date)
    return query.order_by(Meal.created_at.desc()).all()


@router.delete("/{meal_id}")
def delete_meal(meal_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    meal = db.query(Meal).filter(Meal.id == meal_id, Meal.user_id == user.id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    db.delete(meal)
    db.commit()
    return {"message": "Meal deleted"}


@router.get("/today-calories")
def today_calories(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    my_cals = db.query(func.coalesce(func.sum(Meal.total_calories), 0)).filter(
        Meal.user_id == user.id,
        func.date(Meal.created_at) == today
    ).scalar()

    partner_cals = 0
    couple = get_active_couple(db, user.id)
    if couple:
        partner_id = get_partner_id(couple, user.id)
        partner_cals = db.query(func.coalesce(func.sum(Meal.total_calories), 0)).filter(
            Meal.user_id == partner_id,
            func.date(Meal.created_at) == today
        ).scalar()

    return {
        "my_calories": my_cals,
        "my_goal": user.daily_calorie_goal,
        "my_remaining": max(0, user.daily_calorie_goal - my_cals),
        "partner_calories": partner_cals,
    }
