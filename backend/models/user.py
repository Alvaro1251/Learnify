from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr


class UserRegister(UserBase):
    password: str = Field(..., min_length=6)


class UserLogin(UserBase):
    password: str


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    last_name: Optional[str] = None
    career: Optional[str] = None
    university: Optional[str] = None
    birth_date: Optional[datetime] = None


class UserResponse(UserBase):
    id: Optional[str] = Field(None, alias="_id")
    full_name: Optional[str] = None
    last_name: Optional[str] = None
    career: Optional[str] = None
    university: Optional[str] = None
    birth_date: Optional[datetime] = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(populate_by_name=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None


class UserInDB(UserBase):
    id: Optional[str] = Field(None, alias="_id")
    hashed_password: str
    full_name: Optional[str] = None
    last_name: Optional[str] = None
    career: Optional[str] = None
    university: Optional[str] = None
    birth_date: Optional[datetime] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True)
