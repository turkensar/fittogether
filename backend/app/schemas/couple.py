from pydantic import BaseModel
from datetime import datetime


class PairRequest(BaseModel):
    partner_code: str


class CoupleSettingsUpdate(BaseModel):
    max_cheat_days_per_week: int = 2


class CoupleResponse(BaseModel):
    id: str
    user1_id: str
    user2_id: str
    is_active: bool
    max_cheat_days_per_week: int
    created_at: datetime

    class Config:
        from_attributes = True


class PartnerInfo(BaseModel):
    id: str
    name: str
    avatar_emoji: str
    avatar_color: str
    daily_calorie_goal: int
    current_weight: float | None
    target_weight: float | None
