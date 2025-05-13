from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Union
from datetime import datetime
from enum import Enum

class FileType(str, Enum):
    IMAGE = "image"
    DOCUMENT = "document"
    PDF = "pdf"
    OTHER = "other"

class AttachedFile(BaseModel):
    url: str
    file_type: FileType
    filename: str

class PostBase(BaseModel):
    content: str
    attached_files: Optional[List[AttachedFile]] = []
    external_links: Optional[List[HttpUrl]] = []
    
class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    content: Optional[str] = None
    attached_files: Optional[List[AttachedFile]] = None
    external_links: Optional[List[HttpUrl]] = None

class PostResponse(PostBase):
    id: str
    author_id: str
    author_username: str
    author_profile: dict  # Will contain basic profile info
    created_at: datetime
    updated_at: Optional[datetime] = None
    likes_count: int = 0
    dislikes_count: int = 0
    liked_by_me: Optional[bool] = None
    disliked_by_me: Optional[bool] = None
    comments: List['PostResponse'] = []  # Recursive for nested comments
    parent_post_id: Optional[str] = None  # For comments, reference to parent post/comment
    
    class Config:
        from_attributes = True

# Create a reference to handle the recursive nature of PostResponse
PostResponse.model_rebuild()

class ReactionType(str, Enum):
    LIKE = "like"
    DISLIKE = "dislike"
    NONE = "none"

class PostReaction(BaseModel):
    post_id: str
    reaction_type: ReactionType
