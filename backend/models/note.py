from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class NoteCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    subject: str = Field(..., min_length=1)
    university: str = Field(..., min_length=1)
    career: str = Field(..., min_length=1)
    tags: List[str] = Field(default=[])
    file_url: Optional[str] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject: Optional[str] = None
    university: Optional[str] = None
    career: Optional[str] = None
    tags: Optional[List[str]] = None
    file_url: Optional[str] = None


class NoteResponse(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str
    description: str
    subject: str
    university: str
    career: str
    tags: List[str]
    file_url: Optional[str]
    owner: str  # Owner display name
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


class NoteInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str
    description: str
    subject: str
    university: str
    career: str
    tags: List[str]
    file_url: Optional[str]
    owner: str  # Owner display name
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
