from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from models.user import UserInDB, ProfileUpdate
from typing import Optional


async def update_user_profile(
    db: AsyncIOMotorDatabase, user_id: str, profile_data: ProfileUpdate
) -> Optional[UserInDB]:
    users_collection = db["users"]

    update_dict = {}
    if profile_data.full_name is not None:
        update_dict["full_name"] = profile_data.full_name
    if profile_data.last_name is not None:
        update_dict["last_name"] = profile_data.last_name
    if profile_data.career is not None:
        update_dict["career"] = profile_data.career
    if profile_data.university is not None:
        update_dict["university"] = profile_data.university
    if profile_data.birth_date is not None:
        update_dict["birth_date"] = profile_data.birth_date

    if not update_dict:
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if user:
            user["_id"] = str(user["_id"])
            return UserInDB(**user)
        return None

    try:
        result = await users_collection.find_one_and_update(
            {"_id": ObjectId(user_id)},
            {"$set": update_dict},
            return_document=True,
        )
        if result:
            result["_id"] = str(result["_id"])
            return UserInDB(**result)
    except:
        pass
    return None


async def get_user_profile(db: AsyncIOMotorDatabase, user_id: str) -> Optional[UserInDB]:
    users_collection = db["users"]

    try:
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if user:
            user["_id"] = str(user["_id"])
            return UserInDB(**user)
    except:
        pass
    return None


async def get_user_by_id(db: AsyncIOMotorDatabase, user_id: str) -> Optional[UserInDB]:
    users_collection = db["users"]

    try:
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if user:
            user["_id"] = str(user["_id"])
            return UserInDB(**user)
    except:
        pass
    return None
