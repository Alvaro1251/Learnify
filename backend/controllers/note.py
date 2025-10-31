from fastapi import APIRouter, Depends, HTTPException, status, Query
from models.note import NoteCreate, NoteResponse
from services.note_service import (
    create_note,
    get_note_by_id,
    search_notes,
    get_latest_notes,
    get_user_notes,
    delete_note,
    create_note_indexes,
)
from config.database import get_database
from controllers.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional

router = APIRouter(prefix="/notes", tags=["notes"])


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


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: str, db: AsyncIOMotorDatabase = Depends(get_database)
):
    note = await get_note_by_id(db, note_id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
        )
    return note


@router.get("/", response_model=List[NoteResponse])
async def search(
    university: Optional[str] = Query(None),
    career: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    tags: Optional[List[str]] = Query(None),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    notes = await search_notes(
        db, university=university, career=career, subject=subject, tags=tags
    )
    return notes


@router.get("/latest/notes", response_model=List[NoteResponse])
async def latest_notes(db: AsyncIOMotorDatabase = Depends(get_database)):
    notes = await get_latest_notes(db, limit=3)
    return notes


@router.get("/my/notes", response_model=List[NoteResponse])
async def my_notes(
    current_user=Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    notes = await get_user_notes(db, str(current_user.id))
    return notes


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
