from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta, datetime
from models.User import UserCreate, UserResponse
from config.database import db
from utils.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from models.UserProfile import UserProfilePublicResponse
from utils.serializers import serialize_mongo_doc

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    # Check if username already exists
    if await db.users.find_one({"username": user.username}):
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )
    
    # Create new user
    user_dict = user.dict()
    user_dict["hashed_password"] = get_password_hash(user_dict["password"])
    del user_dict["password"]
    
    result = await db.users.insert_one(user_dict)
    created_user = await db.users.find_one({"_id": result.inserted_id})
    
    return serialize_mongo_doc(created_user)

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.users.find_one({"username": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )

    # Get user profile
    profile = await db.user_profiles.find_one({"user_id": str(user["_id"])})
    if profile:
        # Convert datetime to date for the birthday field
        if "birthday" in profile and isinstance(profile["birthday"], datetime):
            profile["birthday"] = profile["birthday"].date()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": serialize_mongo_doc({
            "id": user["_id"],
            "username": user["username"],
            "profile": profile
        })
    } 