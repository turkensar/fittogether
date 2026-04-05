from pydantic import BaseModel
from datetime import datetime


class MealItemCreate(BaseModel):
    food_id: str | None = None
    custom_name: str | None = None
    quantity_g: float = 100
    calories: int | None = None
    protein: float | None = None
    carbs: float | None = None
    fat: float | None = None


class MealCreate(BaseModel):
    title: str
    meal_type: str
    description: str | None = None
    items: list[MealItemCreate] = []


class MealItemResponse(BaseModel):
    id: str
    food_id: str | None
    custom_name: str | None
    quantity_g: float
    calories: int
    protein: float
    carbs: float
    fat: float

    class Config:
        from_attributes = True


class MealResponse(BaseModel):
    id: str
    user_id: str
    title: str
    meal_type: str
    description: str | None
    total_calories: int
    items: list[MealItemResponse]
    created_at: datetime

    class Config:
        from_attributes = True


class FoodSearch(BaseModel):
    query: str


class FoodResponse(BaseModel):
    id: str
    name: str
    calories_per_100g: int
    protein_per_100g: float
    carbs_per_100g: float
    fat_per_100g: float
    default_portion_g: int
    category: str

    class Config:
        from_attributes = True
