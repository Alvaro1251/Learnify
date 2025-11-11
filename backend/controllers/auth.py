from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import timedelta
from models.user import UserRegister, UserLogin, UserResponse, Token, RoleUpdate
from services.auth_service import (
    register_user,
    authenticate_user,
    get_user_by_email,
    create_user_indexes,
    update_user_role,
    get_user_by_id,
    get_all_users,
)
from config.database import get_database
from config.security import create_access_token, decode_access_token
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    token = credentials.credentials
    email = decode_access_token(token)
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
    user = await get_user_by_email(db, email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


async def get_moderator(
    current_user=Depends(get_current_user),
):
    """Dependency que verifica que el usuario sea moderador o admin"""
    if current_user.role not in ["moderator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Moderator or admin access required",
        )
    return current_user


async def get_admin(
    current_user=Depends(get_current_user),
):
    """Dependency que verifica que el usuario sea admin"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


@router.post("/register", response_model=Token)
async def register(
    user_data: UserRegister, db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        await create_user_indexes(db)
        user = await register_user(db, user_data)
        access_token = create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.post("/login", response_model=Token)
async def login(
    user_data: UserLogin, db: AsyncIOMotorDatabase = Depends(get_database)
):
    user = await authenticate_user(db, user_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    return current_user


class UsersResponse(BaseModel):
    users: List[UserResponse]
    total: int
    page: int
    limit: int
    total_pages: int


@router.get("/users", response_model=UsersResponse)
async def list_users(
    current_admin=Depends(get_admin),
    db: AsyncIOMotorDatabase = Depends(get_database),
    page: int = Query(1, ge=1, description="Número de página (empezando en 1)"),
    limit: int = Query(2, ge=1, le=100, description="Cantidad de usuarios por página (máximo 100)"),
    search: Optional[str] = Query(None, description="Buscar por nombre, apellido o email"),
    role: Optional[str] = Query(None, description="Filtrar por rol (user, moderator, admin)"),
):
    """
    Lista usuarios con paginación y filtros. Solo admins pueden hacerlo.
    
    - **page**: Número de página (empezando en 1)
    - **limit**: Cantidad de usuarios por página (máximo 100)
    - **search**: Buscar por nombre, apellido o email
    - **role**: Filtrar por rol específico
    """
    skip = (page - 1) * limit
    result = await get_all_users(db, skip=skip, limit=limit, search=search, role=role)
    
    # Convertir usuarios a UserResponse
    users_response = [UserResponse(**user) for user in result["users"]]
    
    return UsersResponse(
        users=users_response,
        total=result["total"],
        page=result["page"],
        limit=result["limit"],
        total_pages=result["total_pages"],
    )


@router.put("/users/{user_id}/role", response_model=UserResponse)
async def update_role(
    user_id: str,
    role_data: RoleUpdate,
    current_admin=Depends(get_admin),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Actualiza el rol de un usuario. Solo admins pueden hacerlo."""
    try:
        user = await update_user_role(db, user_id, role_data.role)
        return UserResponse(**user.model_dump(exclude={"hashed_password"}))
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
