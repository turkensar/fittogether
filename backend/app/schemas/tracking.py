import datetime as dt
from pydantic import BaseModel


class WeightLogCreate(BaseModel):
    weight: float


class WeightLogResponse(BaseModel):
    id: str
    weight: float
    logged_at: dt.datetime

    class Config:
        from_attributes = True


class WaterLogCreate(BaseModel):
    amount_ml: int


class WaterLogResponse(BaseModel):
    id: str
    amount_ml: int
    date: dt.date
    created_at: dt.datetime

    class Config:
        from_attributes = True


class CheatDayCreate(BaseModel):
    date: dt.date | None = None


class CheatDayResponse(BaseModel):
    id: str
    user_id: str
    date: dt.date
    created_at: dt.datetime

    class Config:
        from_attributes = True