from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from models.user import UserRegister, UserLogin, UserInDB
from config.security import hash_password, verify_password
from pymongo.errors import DuplicateKeyError
from typing import List


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
        "role": "user",  # Por defecto todos los usuarios son "user"
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

    # Asegurar que el usuario tenga un role (retrocompatibilidad)
    if "role" not in db_user:
        db_user["role"] = "user"
        await users_collection.update_one(
            {"_id": db_user["_id"]}, {"$set": {"role": "user"}}
        )

    db_user["_id"] = str(db_user["_id"])
    return UserInDB(**db_user)


async def get_user_by_email(db: AsyncIOMotorDatabase, email: str) -> UserInDB:
    users_collection = db["users"]

    db_user = await users_collection.find_one({"email": email})
    if not db_user:
        return None

    # Asegurar que el usuario tenga un role (retrocompatibilidad)
    if "role" not in db_user:
        db_user["role"] = "user"
        await users_collection.update_one(
            {"_id": db_user["_id"]}, {"$set": {"role": "user"}}
        )

    db_user["_id"] = str(db_user["_id"])
    return UserInDB(**db_user)


async def update_user_role(
    db: AsyncIOMotorDatabase, user_id: str, new_role: str
) -> UserInDB:
    """Actualiza el rol de un usuario"""
    users_collection = db["users"]
    
    valid_roles = ["user", "moderator", "admin"]
    if new_role not in valid_roles:
        raise ValueError(f"Invalid role. Must be one of: {valid_roles}")
    
    result = await users_collection.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": new_role}},
        return_document=True,
    )
    
    if not result:
        raise ValueError("User not found")
    
    result["_id"] = str(result["_id"])
    return UserInDB(**result)


async def get_user_by_id(db: AsyncIOMotorDatabase, user_id: str) -> UserInDB:
    """Obtiene un usuario por su ID"""
    users_collection = db["users"]
    
    db_user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not db_user:
        return None
    
    # Asegurar que el usuario tenga un role (retrocompatibilidad)
    if "role" not in db_user:
        db_user["role"] = "user"
        await users_collection.update_one(
            {"_id": db_user["_id"]}, {"$set": {"role": "user"}}
        )
    
    db_user["_id"] = str(db_user["_id"])
    return UserInDB(**db_user)


async def get_all_users(db: AsyncIOMotorDatabase) -> List[dict]:
    """Obtiene todos los usuarios (solo para admins)"""
    users_collection = db["users"]
    
    users = await users_collection.find({}).to_list(length=None)
    result = []
    for user in users:
        user["_id"] = str(user["_id"])
        # No exponer contraseñas
        user.pop("hashed_password", None)
        result.append(user)
    return result


async def create_user_indexes(db: AsyncIOMotorDatabase):
    users_collection = db["users"]
    await users_collection.create_index("email", unique=True)
