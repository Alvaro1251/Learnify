from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from models.user import UserRegister, UserLogin, UserInDB
from config.security import hash_password, verify_password
from pymongo.errors import DuplicateKeyError
from typing import List, Optional


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


async def get_all_users(
    db: AsyncIOMotorDatabase,
    skip: int = 0,
    limit: int = 2,
    search: str = None,
    role: str = None,
) -> dict:
    """
    Obtiene usuarios con paginación y filtros (solo para admins)
    
    Returns:
        dict con 'users' (lista de usuarios), 'total' (total de usuarios que cumplen los filtros),
        'page' (página actual), 'limit' (límite por página), 'total_pages' (total de páginas)
    """
    users_collection = db["users"]
    
    # Construir query de filtrado
    query = {}
    
    # Filtro por rol
    if role and role.strip():
        query["role"] = role.strip()
    
    # Filtro por búsqueda (nombre, apellido o email)
    if search and search.strip():
        search_term = search.strip()
        # Búsqueda case-insensitive en email, full_name y last_name
        query["$or"] = [
            {"email": {"$regex": search_term, "$options": "i"}},
            {"full_name": {"$regex": search_term, "$options": "i"}},
            {"last_name": {"$regex": search_term, "$options": "i"}},
        ]
    
    # Contar total de usuarios que cumplen los filtros
    total = await users_collection.count_documents(query)
    
    # Obtener usuarios con paginación
    cursor = users_collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
    users = await cursor.to_list(length=limit)
    
    # Procesar usuarios
    result = []
    for user in users:
        user["_id"] = str(user["_id"])
        # No exponer contraseñas
        user.pop("hashed_password", None)
        result.append(user)
    
    # Calcular total de páginas
    total_pages = (total + limit - 1) // limit if limit > 0 else 0
    current_page = (skip // limit) + 1 if limit > 0 else 1
    
    return {
        "users": result,
        "total": total,
        "page": current_page,
        "limit": limit,
        "total_pages": total_pages,
    }


async def create_user_indexes(db: AsyncIOMotorDatabase):
    """Crea índices para mejorar el rendimiento de las búsquedas"""
    users_collection = db["users"]
    # Índice único para email
    await users_collection.create_index("email", unique=True)
    # Índices para búsqueda y filtrado
    await users_collection.create_index("role")
    await users_collection.create_index("full_name")
    await users_collection.create_index("last_name")
    await users_collection.create_index("created_at")
    # Índice compuesto para búsquedas comunes
    await users_collection.create_index([("role", 1), ("created_at", -1)])
