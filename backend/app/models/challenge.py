import uuid
from datetime import datetime, date

from sqlalchemy import String, Text, DateTime, Date, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class DailyChallenge(Base):
    __tablename__ = "daily_challenges"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    points: Mapped[int] = mapped_column(default=10)
    emoji: Mapped[str] = mapped_column(String(10), default="🎯")


class ChallengeCompletion(Base):
    __tablename__ = "challenge_completions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    challenge_id: Mapped[str] = mapped_column(String(36), ForeignKey("daily_challenges.id"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, default=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
