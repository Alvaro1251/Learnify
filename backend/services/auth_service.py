from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from models.user import UserRegister, UserLogin, UserInDB
from config.security import hash_password, verify_password
from pymongo.errors import DuplicateKeyError


async def register_user(db: AsyncIOMotorDatabase, user: UserRegister) -> UserInDB:
    users_collection = db["users"]

    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise ValueError("Email already registered")

    hashed_password = hash_password(user.password)
    user_data = {
        "email": user.email,
        "hashed_password": hashed_password,
        "is_active": True,
        "created_at": datetime.utcnow(),
    }

    result = await users_collection.insert_one(user_data)

    user_data["_id"] = str(result.inserted_id)
    return UserInDB(**user_data)


async def authenticate_user(
    db: AsyncIOMotorDatabase, user: UserLogin
) -> UserInDB:
    users_collection = db["users"]

    db_user = await users_collection.find_one({"email": user.email})
    if not db_user:
        return None

    if not verify_password(user.password, db_user["hashed_password"]):
        return None

    db_user["_id"] = str(db_user["_id"])
    return UserInDB(**db_user)


async def get_user_by_email(db: AsyncIOMotorDatabase, email: str) -> UserInDB:
    users_collection = db["users"]

    db_user = await users_collection.find_one({"email": email})
    if not db_user:
        return None

    db_user["_id"] = str(db_user["_id"])
    return UserInDB(**db_user)


async def create_user_indexes(db: AsyncIOMotorDatabase):
    users_collection = db["users"]
    await users_collection.create_index("email", unique=True)
