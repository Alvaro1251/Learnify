from fastapi import APIRouter, Depends, HTTPException, status
from models.user import UserResponse, ProfileUpdate
from services.profile_service import update_user_profile
from config.database import get_database
from controllers.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user=Depends(get_current_user)):
    return current_user


@router.put("/update", response_model=UserResponse)
async def update_profile(
    profile_data: ProfileUpdate,
    current_user=Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    try:
        updated_user = await update_user_profile(db, str(current_user.id), profile_data)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        return updated_user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
