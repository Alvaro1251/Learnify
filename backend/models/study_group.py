from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


class SharedFile(BaseModel):
    file_id: str = Field(default_factory=lambda: str(__import__('uuid').uuid4()))
    uploaded_by: str
    file_url: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)


class ChatMessage(BaseModel):
    sender: str
    sender_id: Optional[str] = None
    content: str = Field(..., min_length=1)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class StudyGroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    is_public: bool = True
    exam_date: datetime


class StudyGroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    exam_date: Optional[datetime] = None


class StudyGroupResponse(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    description: str
    owner: str
    members: List[str]  # Member names (full_name + last_name)
    member_ids: List[str]  # Actual user IDs for reference
    pending_requests: List[str]  # Pending request names
    pending_request_ids: List[str]  # Actual user IDs for pending requests
    is_public: bool
    exam_date: datetime
    created_at: datetime
    members_count: int
    files_count: int
    messages_count: int

    model_config = ConfigDict(populate_by_name=True)


class StudyGroupDetailResponse(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    description: str
    owner: str
    members: List[str]  # Member names (full_name + last_name)
    member_ids: List[str]  # Actual user IDs for reference
    pending_requests: List[str]  # Pending request names
    pending_request_ids: List[str]  # Actual user IDs for pending requests
    files: List[SharedFile]
    chat: List[ChatMessage]
    is_public: bool
    exam_date: datetime
    created_at: datetime

    model_config = ConfigDict(populate_by_name=True)


class SharedFileRequest(BaseModel):
    file_url: str


class ChatMessageRequest(BaseModel):
    content: str = Field(..., min_length=1)


class StudyGroupInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    description: str
    owner: str
    members: List[str] = Field(default_factory=list)  # Member names
    member_ids: List[str] = Field(default_factory=list)  # Actual user IDs for reference
    pending_requests: List[str] = Field(default_factory=list)  # Pending request names
    pending_request_ids: List[str] = Field(default_factory=list)  # Actual user IDs for pending requests
    files: List[SharedFile] = Field(default_factory=list)
    chat: List[ChatMessage] = Field(default_factory=list)
    is_public: bool = True
    exam_date: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True)
