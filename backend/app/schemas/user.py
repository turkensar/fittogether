from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ProfileSetup(BaseModel):
    age: int | None = None
    height: float | None = None
    current_weight: float | None = None
    target_weight: float | None = None
    gender: str | None = None
    daily_calorie_goal: int = 2000
    avatar_emoji: str = "😊"
    avatar_color: str = "#6C63FF"


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    age: int | None
    height: float | None
    current_weight: float | None
    target_weight: float | None
    gender: str | None
    daily_calorie_goal: int
    avatar_emoji: str
    avatar_color: str
    invite_code: str
    is_onboarded: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
