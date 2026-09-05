from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.core.enums import UserRole


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    name: str = Field(default=None, description="Optional user display name")
    phone: Optional[str] = Field(..., max_length=10, description="Password must be at least 6 characters")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: Optional[str] = None
    role: UserRole
    phone: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SignupResponse(BaseModel):
    user: UserResponse

class LoginResponse(BaseModel):
    access_token: str
    user: UserResponse