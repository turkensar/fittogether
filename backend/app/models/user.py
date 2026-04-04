import uuid
from datetime import datetime

from sqlalchemy import String, Integer, Float, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    target_weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    daily_calorie_goal: Mapped[int] = mapped_column(Integer, default=2000)
    avatar_emoji: Mapped[str] = mapped_column(String(10), default="😊")
    avatar_color: Mapped[str] = mapped_column(String(7), default="#6C63FF")
    invite_code: Mapped[str] = mapped_column(String(8), unique=True, nullable=False)
    is_onboarded: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    meals: Mapped[list["Meal"]] = relationship("Meal", back_populates="user", cascade="all, delete-orphan")
    weight_logs: Mapped[list["WeightLog"]] = relationship("WeightLog", back_populates="user", cascade="all, delete-orphan")
    water_logs: Mapped[list["WaterLog"]] = relationship("WaterLog", back_populates="user", cascade="all, delete-orphan")
    score_events: Mapped[list["ScoreEvent"]] = relationship("ScoreEvent", back_populates="user", cascade="all, delete-orphan")
    user_badges: Mapped[list["UserBadge"]] = relationship("UserBadge", back_populates="user", cascade="all, delete-orphan")
