from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from models.Post import (
    PostCreate,
    PostUpdate,
    PostResponse,
    PostReaction,
    ReactionType,
    AttachedFile,
    FileType
)
from config.database import db
from utils.auth import get_current_user
from models.User import UserResponse
from utils.serializers import serialize_mongo_doc

router = APIRouter(prefix="/posts", tags=["posts"])

async def get_post_with_reactions(post: dict, current_user_id: str) -> dict:
    # First serialize the post to handle ObjectId
    post = serialize_mongo_doc(post)
    
    # Add reaction info
    user_reaction = await db.post_reactions.find_one({
        "post_id": post["id"],  # Now using the serialized id
        "user_id": current_user_id
    })
    post["liked_by_me"] = user_reaction["reaction_type"] == ReactionType.LIKE if user_reaction else False
    post["disliked_by_me"] = user_reaction["reaction_type"] == ReactionType.DISLIKE if user_reaction else False
    
    # Get author profile
    author = await db.users.find_one({"_id": ObjectId(post["author_id"])})
    author_profile = await db.user_profiles.find_one({"user_id": post["author_id"]})
    post["author_username"] = author["username"]
    post["author_profile"] = serialize_mongo_doc({
        "first_name": author_profile.get("first_name"),
        "last_name": author_profile.get("last_name"),
        "profile_picture_url": author_profile.get("profile_picture_url")
    } if author_profile else {})
    
    # Get comments
    comments = await db.posts.find({"parent_post_id": post["id"]}).to_list(length=None)
    post["comments"] = [await get_post_with_reactions(comment, current_user_id) for comment in comments]
    
    return post

@router.post("", response_model=PostResponse)
async def create_post(
    post: PostCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    post_dict = post.model_dump()
    post_dict["author_id"] = current_user["id"]
    post_dict["created_at"] = datetime.utcnow()
    post_dict["likes_count"] = 0
    post_dict["dislikes_count"] = 0
    
    result = await db.posts.insert_one(post_dict)
    created_post = await db.posts.find_one({"_id": result.inserted_id})
    return await get_post_with_reactions(created_post, current_user["id"])

@router.post("/{post_id}/comments", response_model=PostResponse)
async def create_comment(
    post_id: str,
    comment: PostCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    # Verify parent post exists
    parent_post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not parent_post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comment_dict = comment.model_dump()
    comment_dict["author_id"] = current_user["id"]
    comment_dict["created_at"] = datetime.utcnow()
    comment_dict["parent_post_id"] = post_id
    comment_dict["likes_count"] = 0
    comment_dict["dislikes_count"] = 0
    
    result = await db.posts.insert_one(comment_dict)
    created_comment = await db.posts.find_one({"_id": result.inserted_id})
    return await get_post_with_reactions(created_comment, current_user["id"])

@router.post("/{post_id}/reaction")
async def react_to_post(
    post_id: str,
    reaction: PostReaction,
    current_user: UserResponse = Depends(get_current_user)
):
    # Verify post exists
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Get current reaction
    current_reaction = await db.post_reactions.find_one({
        "post_id": post_id,
        "user_id": current_user["id"]
    })
    
    update_dict = {}
    if current_reaction:
        old_reaction = current_reaction["reaction_type"]
        # Remove old reaction count
        if old_reaction == ReactionType.LIKE:
            update_dict["likes_count"] = post["likes_count"] - 1
        elif old_reaction == ReactionType.DISLIKE:
            update_dict["dislikes_count"] = post["dislikes_count"] - 1
    
    # Add new reaction count
    if reaction.reaction_type == ReactionType.LIKE:
        update_dict["likes_count"] = post.get("likes_count", 0) + 1
    elif reaction.reaction_type == ReactionType.DISLIKE:
        update_dict["dislikes_count"] = post.get("dislikes_count", 0) + 1
    
    # Update post reaction counts
    if update_dict:
        await db.posts.update_one(
            {"_id": ObjectId(post_id)},
            {"$set": update_dict}
        )
    
    # Update user reaction
    if reaction.reaction_type == ReactionType.NONE:
        await db.post_reactions.delete_one({
            "post_id": post_id,
            "user_id": current_user["id"]
        })
    else:
        await db.post_reactions.update_one(
            {
                "post_id": post_id,
                "user_id": current_user["id"]
            },
            {
                "$set": {
                    "reaction_type": reaction.reaction_type,
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True
        )
    
    updated_post = await db.posts.find_one({"_id": ObjectId(post_id)})
    return await get_post_with_reactions(updated_post, current_user["id"])

@router.get("", response_model=List[PostResponse])
async def get_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user)
):
    # Get only top-level posts (no comments)
    posts = await db.posts.find(
        {"parent_post_id": None}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(length=None)
    
    return [await get_post_with_reactions(post, current_user["id"]) for post in posts]

@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return await get_post_with_reactions(post, current_user["id"])

@router.get("/user/{author_id}", response_model=List[PostResponse])
async def get_user_posts(
    author_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user)
):
    posts = await db.posts.find(
        {"author_id": author_id, "parent_post_id": None}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(length=None)
    
    return [await get_post_with_reactions(post, current_user["id"]) for post in posts]

@router.delete("/{post_id}")
async def delete_post(
    post_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    # Verify post exists and belongs to user
    post = await db.posts.find_one({
        "_id": ObjectId(post_id),
        "author_id": current_user["id"]
    })
    if not post:
        raise HTTPException(status_code=404, detail="Post not found or unauthorized")
    
    # Delete all comments recursively
    async def delete_comments(post_id: str):
        comments = await db.posts.find({"parent_post_id": post_id}).to_list(length=None)
        for comment in comments:
            await delete_comments(str(comment["_id"]))
        await db.posts.delete_many({"parent_post_id": post_id})
    
    await delete_comments(post_id)
    
    # Delete post reactions
    await db.post_reactions.delete_many({"post_id": post_id})
    
    # Delete the post itself
    await db.posts.delete_one({"_id": ObjectId(post_id)})
    
    return {"message": "Post and all its comments deleted successfully"} 