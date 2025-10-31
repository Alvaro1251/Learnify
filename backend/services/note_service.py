from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from bson.errors import InvalidId
from models.note import NoteCreate, NoteInDB
from typing import Dict, Iterable, List, Optional, Sequence, Set


def _compose_user_display_name(user: dict) -> Optional[str]:
    """Build a trimmed display name from user document fields."""
    if not user:
        return None

    parts: List[str] = []
    for key in ("full_name", "last_name"):
        value = user.get(key)
        if isinstance(value, str):
            normalized = value.strip()
            if normalized:
                parts.append(normalized)

    if not parts:
        return None

    candidate = " ".join(parts)
    return candidate if candidate.lower() != "unknown" else None


async def _fetch_owner_display_map(
    db: AsyncIOMotorDatabase, owner_ids: Sequence[str]
) -> Dict[str, str]:
    """Return a mapping of owner ObjectId strings to their display names."""
    unique_ids: Set[str] = {oid for oid in owner_ids if isinstance(oid, str) and oid}
    if not unique_ids:
        return {}

    object_ids: List[ObjectId] = []
    for owner_id in unique_ids:
        try:
            object_ids.append(ObjectId(owner_id))
        except (InvalidId, TypeError):
            continue

    if not object_ids:
        return {}

    users_collection = db["users"]
    users = await users_collection.find(
        {"_id": {"$in": object_ids}}, {"full_name": 1, "last_name": 1}
    ).to_list(length=None)

    display_map: Dict[str, str] = {}
    for user in users:
        display_name = _compose_user_display_name(user)
        if display_name:
            display_map[str(user["_id"])] = display_name

    return display_map


async def _enrich_notes_with_owner_names(
    db: AsyncIOMotorDatabase, notes: Iterable[dict]
) -> None:
    """Mutates note dicts to ensure `_id` is a string and `owner` holds a display name."""
    notes_list = list(notes)
    if not notes_list:
        return

    owner_candidates: List[str] = []
    for note in notes_list:
        owner_value = note.get("owner")
        if isinstance(owner_value, ObjectId):
            owner_str = str(owner_value)
            owner_candidates.append(owner_str)
        elif isinstance(owner_value, str):
            owner_candidates.append(owner_value)
        elif owner_value is not None:
            owner_candidates.append(str(owner_value))

    owner_map = await _fetch_owner_display_map(db, owner_candidates)

    for note in notes_list:
        # Ensure _id is serialized as string for downstream pydantic models
        if "_id" in note and isinstance(note["_id"], ObjectId):
            note["_id"] = str(note["_id"])

        owner_value = note.get("owner")
        owner_key = None
        if isinstance(owner_value, ObjectId):
            owner_key = str(owner_value)
        elif isinstance(owner_value, str):
            owner_key = owner_value
        elif owner_value is not None:
            owner_key = str(owner_value)

        if owner_key is None:
            continue

        display_name = owner_map.get(owner_key)
        note["owner"] = display_name or owner_key


async def create_note(
    db: AsyncIOMotorDatabase, note: NoteCreate, owner_id: str
) -> NoteInDB:
    notes_collection = db["notes"]

    note_data = {
        "title": note.title,
        "description": note.description,
        "subject": note.subject,
        "university": note.university,
        "career": note.career,
        "tags": note.tags,
        "file_url": note.file_url,
        "owner": owner_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await notes_collection.insert_one(note_data)
    note_data["_id"] = result.inserted_id
    await _enrich_notes_with_owner_names(db, [note_data])
    return NoteInDB(**note_data)


async def get_note_by_id(db: AsyncIOMotorDatabase, note_id: str) -> NoteInDB:
    notes_collection = db["notes"]

    try:
        note = await notes_collection.find_one({"_id": ObjectId(note_id)})
        if note:
            await _enrich_notes_with_owner_names(db, [note])
            return NoteInDB(**note)
    except:
        pass
    return None


async def search_notes(
    db: AsyncIOMotorDatabase,
    university: Optional[str] = None,
    career: Optional[str] = None,
    subject: Optional[str] = None,
    tags: Optional[List[str]] = None,
) -> List[NoteInDB]:
    notes_collection = db["notes"]
    query = {}

    if university:
        query["university"] = {"$regex": university, "$options": "i"}
    if career:
        query["career"] = {"$regex": career, "$options": "i"}
    if subject:
        query["subject"] = {"$regex": subject, "$options": "i"}
    if tags:
        query["tags"] = {"$in": tags}

    notes = await notes_collection.find(query).to_list(length=None)
    await _enrich_notes_with_owner_names(db, notes)
    return [NoteInDB(**note) for note in notes]


async def get_latest_notes(db: AsyncIOMotorDatabase, limit: int = 3) -> List[NoteInDB]:
    notes_collection = db["notes"]

    notes = (
        await notes_collection.find({})
        .sort("created_at", -1)
        .limit(limit)
        .to_list(length=limit)
    )
    await _enrich_notes_with_owner_names(db, notes)
    return [NoteInDB(**note) for note in notes]


async def get_user_notes(
    db: AsyncIOMotorDatabase, user_id: str
) -> List[NoteInDB]:
    notes_collection = db["notes"]

    notes = await notes_collection.find({"owner": user_id}).to_list(length=None)
    await _enrich_notes_with_owner_names(db, notes)
    return [NoteInDB(**note) for note in notes]


async def delete_note(db: AsyncIOMotorDatabase, note_id: str, user_id: str) -> bool:
    notes_collection = db["notes"]

    try:
        result = await notes_collection.delete_one(
            {"_id": ObjectId(note_id), "owner": user_id}
        )
        return result.deleted_count > 0
    except:
        return False


async def create_note_indexes(db: AsyncIOMotorDatabase):
    notes_collection = db["notes"]
    await notes_collection.create_index("university")
    await notes_collection.create_index("career")
    await notes_collection.create_index("subject")
    await notes_collection.create_index("tags")
    await notes_collection.create_index("owner")
    await notes_collection.create_index("created_at")
