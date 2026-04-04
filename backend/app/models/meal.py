import uuid
from datetime import datetime

from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Meal(Base):
    __tablename__ = "meals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    meal_type: Mapped[str] = mapped_column(String(20), nullable=False)  # breakfast, lunch, dinner, snack
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_calories: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="meals")
    items: Mapped[list["MealItem"]] = relationship("MealItem", back_populates="meal", cascade="all, delete-orphan")


class MealItem(Base):
    __tablename__ = "meal_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    meal_id: Mapped[str] = mapped_column(String(36), ForeignKey("meals.id"), nullable=False)
    food_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("foods.id"), nullable=True)
    custom_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    quantity_g: Mapped[float] = mapped_column(Float, default=100)
    calories: Mapped[int] = mapped_column(Integer, nullable=False)

    meal = relationship("Meal", back_populates="items")
    food = relationship("Food")
