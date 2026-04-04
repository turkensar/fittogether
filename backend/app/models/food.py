import uuid

from sqlalchemy import String, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Food(Base):
    __tablename__ = "foods"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    calories_per_100g: Mapped[int] = mapped_column(Integer, nullable=False)
    protein_per_100g: Mapped[float] = mapped_column(Float, default=0)
    carbs_per_100g: Mapped[float] = mapped_column(Float, default=0)
    fat_per_100g: Mapped[float] = mapped_column(Float, default=0)
    default_portion_g: Mapped[int] = mapped_column(Integer, default=100)
    category: Mapped[str] = mapped_column(String(50), default="other")
