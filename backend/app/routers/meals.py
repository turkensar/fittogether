import json
from datetime import datetime, date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.meal import Meal, MealItem
from app.models.food import Food
from app.models.favorite_food import FavoriteFood
from app.models.meal_template import MealTemplate
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


@router.put("/{meal_id}", response_model=MealResponse)
def update_meal(meal_id: str, data: MealCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    meal = db.query(Meal).filter(Meal.id == meal_id, Meal.user_id == user.id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")

    meal.title = data.title
    meal.meal_type = data.meal_type
    meal.description = data.description

    for old in list(meal.items):
        db.delete(old)
    meal.items = []

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

        meal.items.append(MealItem(
            food_id=item_data.food_id,
            custom_name=item_data.custom_name,
            quantity_g=item_data.quantity_g,
            calories=cal,
            protein=protein,
            carbs=carbs,
            fat=fat,
        ))
        total += cal

    meal.total_calories = total
    db.commit()
    db.refresh(meal)
    return meal


@router.delete("/{meal_id}")
def delete_meal(meal_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    meal = db.query(Meal).filter(Meal.id == meal_id, Meal.user_id == user.id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    db.delete(meal)
    db.commit()
    return {"message": "Meal deleted"}


# ═══ FAVORITES ═══
@router.get("/favorites", response_model=list[FoodResponse])
def list_favorites(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(Food).join(FavoriteFood, FavoriteFood.food_id == Food.id).filter(
        FavoriteFood.user_id == user.id
    ).order_by(FavoriteFood.created_at.desc()).all()
    return rows


@router.post("/favorites/{food_id}")
def add_favorite(food_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    food = db.query(Food).filter(Food.id == food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    existing = db.query(FavoriteFood).filter(
        FavoriteFood.user_id == user.id, FavoriteFood.food_id == food_id
    ).first()
    if not existing:
        db.add(FavoriteFood(user_id=user.id, food_id=food_id))
        db.commit()
    return {"message": "ok"}


@router.delete("/favorites/{food_id}")
def remove_favorite(food_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(FavoriteFood).filter(
        FavoriteFood.user_id == user.id, FavoriteFood.food_id == food_id
    ).delete()
    db.commit()
    return {"message": "ok"}


# ═══ TEMPLATES ═══
class TemplateItem(BaseModel):
    food_id: str | None = None
    custom_name: str | None = None
    quantity_g: float = 100
    calories: int = 0
    protein: float = 0
    carbs: float = 0
    fat: float = 0


class TemplateCreate(BaseModel):
    name: str
    meal_type: str
    items: list[TemplateItem]


class TemplateResponse(BaseModel):
    id: str
    name: str
    meal_type: str
    items: list[TemplateItem]
    total_calories: int
    created_at: datetime


@router.get("/templates", response_model=list[TemplateResponse])
def list_templates(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(MealTemplate).filter(MealTemplate.user_id == user.id).order_by(
        MealTemplate.created_at.desc()
    ).all()
    result = []
    for t in rows:
        items = [TemplateItem(**i) for i in json.loads(t.items_json)]
        result.append(TemplateResponse(
            id=t.id, name=t.name, meal_type=t.meal_type, items=items,
            total_calories=sum(i.calories for i in items), created_at=t.created_at,
        ))
    return result


@router.post("/templates", response_model=TemplateResponse)
def create_template(data: TemplateCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tmpl = MealTemplate(
        user_id=user.id,
        name=data.name,
        meal_type=data.meal_type,
        items_json=json.dumps([i.dict() for i in data.items]),
    )
    db.add(tmpl)
    db.commit()
    db.refresh(tmpl)
    return TemplateResponse(
        id=tmpl.id, name=tmpl.name, meal_type=tmpl.meal_type,
        items=data.items,
        total_calories=sum(i.calories for i in data.items),
        created_at=tmpl.created_at,
    )


@router.delete("/templates/{template_id}")
def delete_template(template_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tmpl = db.query(MealTemplate).filter(
        MealTemplate.id == template_id, MealTemplate.user_id == user.id
    ).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(tmpl)
    db.commit()
    return {"message": "ok"}


@router.post("/templates/{template_id}/apply", response_model=MealResponse)
def apply_template(template_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tmpl = db.query(MealTemplate).filter(
        MealTemplate.id == template_id, MealTemplate.user_id == user.id
    ).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")

    items = json.loads(tmpl.items_json)
    meal = Meal(user_id=user.id, title=tmpl.name, meal_type=tmpl.meal_type, description=None)
    total = 0
    for i in items:
        cal = int(i.get("calories") or 0)
        meal.items.append(MealItem(
            food_id=i.get("food_id"),
            custom_name=i.get("custom_name"),
            quantity_g=i.get("quantity_g", 100),
            calories=cal,
            protein=i.get("protein", 0),
            carbs=i.get("carbs", 0),
            fat=i.get("fat", 0),
        ))
        total += cal
    meal.total_calories = total
    db.add(meal)
    db.commit()
    db.refresh(meal)

    add_score(db, user.id, "meal_logged", 5, f"Logged meal: {tmpl.name}")
    check_and_award_badges(db, user.id)
    return meal


@router.get("/meal-dates")
def meal_dates(
    start: date,
    end: date,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return list of dates that have at least one meal."""
    rows = db.query(func.date(Meal.created_at)).filter(
        Meal.user_id == user.id,
        func.date(Meal.created_at) >= start,
        func.date(Meal.created_at) <= end,
    ).distinct().all()
    return [r[0].isoformat() for r in rows]


@router.get("/weekly-calories")
def weekly_calories(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    days = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        cals = db.query(func.coalesce(func.sum(Meal.total_calories), 0)).filter(
            Meal.user_id == user.id, func.date(Meal.created_at) == d
        ).scalar()
        days.append({"date": d.isoformat(), "calories": cals})
    return days


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
