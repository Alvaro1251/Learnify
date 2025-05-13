from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Optional
from bson import ObjectId
from datetime import datetime, date

from models.UserProfile import (
    UserProfileCreate,
    UserProfileUpdate,
    UserProfileResponse,
    UserProfilePublicResponse
)
from config.database import db
from utils.auth import get_current_user
from models.User import UserResponse
from utils.serializers import serialize_mongo_doc

router = APIRouter(prefix="/profile", tags=["profile"])

@router.post("", response_model=UserProfileResponse)
async def create_profile(
    profile: UserProfileCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    # Check if profile already exists
    existing_profile = await db.user_profiles.find_one({"user_id": current_user["id"]})
    if existing_profile:
        raise HTTPException(status_code=400, detail="Profile already exists")

    profile_dict = profile.model_dump()
    profile_dict["user_id"] = current_user["id"]
    profile_dict["created_at"] = datetime.utcnow()
    
    result = await db.user_profiles.insert_one(profile_dict)
    created_profile = await db.user_profiles.find_one({"_id": result.inserted_id})
    
    return serialize_mongo_doc(created_profile)

@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(current_user: UserResponse = Depends(get_current_user)):
    profile = await db.user_profiles.find_one({"user_id": current_user["id"]})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return serialize_mongo_doc(profile)

@router.get("/{username}", response_model=UserProfilePublicResponse)
async def get_public_profile(username: str):
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    profile = await db.user_profiles.find_one({"user_id": str(user["_id"])})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return serialize_mongo_doc(profile)

@router.put("/me", response_model=UserProfileResponse)
async def update_profile(
    profile_update: UserProfileUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    profile = await db.user_profiles.find_one({"user_id": current_user["id"]})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    update_data = {
        k: v for k, v in profile_update.model_dump(exclude_unset=True).items()
        if v is not None
    }
    
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.user_profiles.update_one(
            {"user_id": current_user["id"]},
            {"$set": update_data}
        )
    
    updated_profile = await db.user_profiles.find_one({"user_id": current_user["id"]})
    return serialize_mongo_doc(updated_profile)

@router.post("/me/picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user)
):
    # Here you would implement the logic to:
    # 1. Validate the file is an image
    # 2. Upload it to a cloud storage service (like AWS S3)
    # 3. Update the profile with the new picture URL
    
    # For now, we'll return a placeholder response
    raise HTTPException(
        status_code=501,
        detail="Profile picture upload not implemented. Implement cloud storage first."
    ) 