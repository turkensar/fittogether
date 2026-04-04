from pydantic import BaseModel
from datetime import datetime


class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: str
    couple_id: str
    sender_id: str
    content: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ChallengeResponse(BaseModel):
    id: str
    title: str
    description: str
    points: int
    emoji: str
    completed: bool = False

    class Config:
        from_attributes = True


class ChallengeCompleteRequest(BaseModel):
    challenge_id: str


class DietBreakResponse(BaseModel):
    id: str
    user_id: str
    punishment: str
    points_lost: int
    note: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class ScoreResponse(BaseModel):
    total_points: int
    events: list[dict]


class BadgeResponse(BaseModel):
    id: str
    name: str
    description: str
    emoji: str
    earned_at: datetime | None = None

    class Config:
        from_attributes = True
