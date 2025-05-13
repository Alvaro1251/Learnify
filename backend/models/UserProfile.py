from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date

class UserProfileBase(BaseModel):
    first_name: str
    last_name: str
    university: str
    birthday: date
    biography: Optional[str] = None
    profile_picture_url: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    major: Optional[str] = None
    semester: Optional[int] = Field(None, ge=1, le=12)
    
class UserProfileCreate(UserProfileBase):
    pass

class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    university: Optional[str] = None
    birthday: Optional[date] = None
    biography: Optional[str] = None
    profile_picture_url: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    major: Optional[str] = None
    semester: Optional[int] = Field(None, ge=1, le=12)

class UserProfileResponse(UserProfileBase):
    id: str
    user_id: str

    class Config:
        from_attributes = True

class UserProfilePublicResponse(BaseModel):
    first_name: str
    last_name: str
    university: str
    biography: Optional[str] = None
    profile_picture_url: Optional[str] = None
    major: Optional[str] = None
    semester: Optional[int] = None 