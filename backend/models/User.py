from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    username: str
    id: Optional[str] = None

class UserInDB(UserCreate):
    hashed_password: str 