from fastapi import APIRouter, Depends, HTTPException, status, Query, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models.note import NoteCreate, NoteResponse
from services.note_service import (
    create_note,
    get_note_by_id,
    search_notes,
    get_latest_notes,
    get_user_notes,
    delete_note,
    create_note_indexes,
    toggle_note_like,
    get_most_liked_notes,
)
from config.database import get_database
from controllers.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/notes", tags=["notes"])
security = HTTPBearer(auto_error=False)


@router.post("/create", response_model=NoteResponse)
async def create_new_note(
    note_data: NoteCreate,
    current_user=Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    try:
        await create_note_indexes(db)
        note = await create_note(db, note_data, str(current_user.id))
        return note
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


class NotesPaginatedResponse(BaseModel):
    notes: List[NoteResponse]
    total: int
    page: int
    limit: int
    total_pages: int


@router.get("/", response_model=NotesPaginatedResponse)
async def search(
    university: Optional[str] = Query(None),
    career: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    tags: Optional[List[str]] = Query(None),
    sort_by: str = Query("recent", regex="^(recent|liked|oldest)$"),
    page: int = Query(1, ge=1, description="Número de página (empezando en 1)"),
    limit: int = Query(2, ge=1, le=100, description="Cantidad de notas por página (máximo 100)"),
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Busca notas con paginación y filtros.
    
    - **page**: Número de página (empezando en 1)
    - **limit**: Cantidad de notas por página (máximo 100)
    - **university**: Filtrar por universidad
    - **career**: Filtrar por carrera
    - **subject**: Filtrar por materia
    - **tags**: Filtrar por tags (array)
    - **sort_by**: Ordenar por (recent, liked, oldest)
    """
    current_user = None
    if credentials:
        try:
            current_user = await get_current_user(credentials, db)
        except:
            pass
    
    user_id = str(current_user.id) if current_user else None
    skip = (page - 1) * limit
    result = await search_notes(
        db, 
        university=university, 
        career=career, 
        subject=subject, 
        tags=tags, 
        current_user_id=user_id,
        sort_by=sort_by,
        skip=skip,
        limit=limit,
    )
    
    # Convertir notas a NoteResponse
    notes_response = [NoteResponse(**note) for note in result["notes"]]
    
    return NotesPaginatedResponse(
        notes=notes_response,
        total=result["total"],
        page=result["page"],
        limit=result["limit"],
        total_pages=result["total_pages"],
    )


@router.get("/latest/notes", response_model=List[NoteResponse])
async def latest_notes(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    current_user = None
    if credentials:
        try:
            current_user = await get_current_user(credentials, db)
        except:
            pass
    
    user_id = str(current_user.id) if current_user else None
    notes = await get_latest_notes(db, limit=3, current_user_id=user_id)
    return [NoteResponse(**note) for note in notes]


@router.get("/most-liked", response_model=List[NoteResponse])
async def most_liked_notes(
    limit: int = Query(10, ge=1, le=50),
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get notes sorted by number of likes"""
    try:
        current_user = None
        if credentials:
            try:
                current_user = await get_current_user(credentials, db)
            except:
                pass
        
        user_id = str(current_user.id) if current_user else None
        notes = await get_most_liked_notes(db, limit=limit, current_user_id=user_id)
        print(f"most_liked_notes endpoint: Returning {len(notes)} notes")
        return [NoteResponse(**note) for note in notes]
    except Exception as e:
        print(f"Error in most_liked_notes endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting most liked notes: {str(e)}"
        )


@router.get("/my/notes", response_model=List[NoteResponse])
async def my_notes(
    current_user=Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    notes = await get_user_notes(db, str(current_user.id), str(current_user.id))
    return [NoteResponse(**note) for note in notes]


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: str,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    current_user = None
    if credentials:
        try:
            current_user = await get_current_user(credentials, db)
        except:
            pass  # If auth fails, continue without user
    
    user_id = str(current_user.id) if current_user else None
    note = await get_note_by_id(db, note_id, user_id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
        )
    return NoteResponse(**note)


@router.post("/{note_id}/like", response_model=NoteResponse)
async def toggle_like(
    note_id: str,
    current_user=Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Toggle like on a note"""
    try:
        note = await toggle_note_like(db, note_id, str(current_user.id))
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
            )
        # Ensure all required fields are present
        if "tags" not in note:
            note["tags"] = []
        if "likes" not in note:
            note["likes"] = []
        if "likes_count" not in note:
            note["likes_count"] = 0
        if "user_liked" not in note:
            note["user_liked"] = False
        return NoteResponse(**note)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in toggle_like endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating like: {str(e)}"
        )


@router.delete("/{note_id}")
async def delete_note_endpoint(
    note_id: str,
    current_user=Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    success = await delete_note(db, note_id, str(current_user.id))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found or not authorized"
        )
    return {"message": "Note deleted"}
