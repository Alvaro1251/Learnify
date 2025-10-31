from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


class Response(BaseModel):
    owner: str
    content: str = Field(..., min_length=1)
    creation_date: datetime = Field(default_factory=datetime.utcnow)


class ResponseWithUser(BaseModel):
    owner_name: str = Field(alias="owner")
    content: str
    creation_date: datetime

    model_config = ConfigDict(populate_by_name=True)


class PostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    subject: str = Field(..., min_length=1)


class PostResponse(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str
    description: str
    subject: str
    owner_name: str = Field(alias="owner")
    creation_date: datetime
    responses_count: int

    model_config = ConfigDict(populate_by_name=True)


class PostDetailResponse(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str
    description: str
    subject: str
    owner_name: str = Field(alias="owner")
    creation_date: datetime
    responses: List[ResponseWithUser]

    model_config = ConfigDict(populate_by_name=True)


class ResponseCreate(BaseModel):
    content: str = Field(..., min_length=1)


class PostInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str
    description: str
    subject: str
    owner: str
    creation_date: datetime = Field(default_factory=datetime.utcnow)
    responses: List[Response] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)
