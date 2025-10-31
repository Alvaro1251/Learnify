from fastapi import APIRouter, Depends, HTTPException, status, Query
from models.post import (
    PostCreate,
    PostResponse,
    PostDetailResponse,
    ResponseCreate,
    ResponseWithUser,
)
from services.post_service import (
    create_post,
    get_post_by_id,
    get_latest_posts,
    add_response_to_post,
    get_user_posts,
    delete_post,
    create_post_indexes,
)
from config.database import get_database
from controllers.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List

router = APIRouter(prefix="/posts", tags=["posts"])


@router.post("/create", response_model=PostDetailResponse)
async def create_new_post(
    post_data: PostCreate,
    current_user=Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    try:
        await create_post_indexes(db)
        post = await create_post(db, post_data, str(current_user.id))
        return post
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.get("/latest", response_model=List[PostResponse])
async def latest_posts(
    limit: int = Query(10, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    posts = await get_latest_posts(db, limit=limit)
    return posts


@router.get("/{post_id}", response_model=PostDetailResponse)
async def get_post(
    post_id: str, db: AsyncIOMotorDatabase = Depends(get_database)
):
    post = await get_post_by_id(db, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Post not found"
        )
    return post


@router.post("/{post_id}/response", response_model=PostDetailResponse)
async def add_response(
    post_id: str,
    response_data: ResponseCreate,
    current_user=Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    post = await add_response_to_post(
        db, post_id, response_data, str(current_user.id)
    )
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Post not found"
        )
    return post


@router.get("/my/posts", response_model=List[PostDetailResponse])
async def my_posts(
    current_user=Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    posts = await get_user_posts(db, str(current_user.id))
    return posts


@router.delete("/{post_id}")
async def delete_post_endpoint(
    post_id: str,
    current_user=Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    success = await delete_post(db, post_id, str(current_user.id))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found or not authorized",
        )
    return {"message": "Post deleted"}
