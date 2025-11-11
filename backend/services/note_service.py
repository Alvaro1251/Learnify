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

    # Convert owner_id to ObjectId for consistency
    try:
        owner_object_id = ObjectId(owner_id)
    except (InvalidId, TypeError):
        raise ValueError(f"Invalid owner_id: {owner_id}")

    note_data = {
        "title": note.title,
        "description": note.description,
        "subject": note.subject,
        "university": note.university,
        "career": note.career,
        "tags": note.tags,
        "file_url": note.file_url,
        "file_name": note.file_name,
        "owner": owner_object_id,  # Store as ObjectId for consistency
        "likes": [],  # Initialize empty likes array
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await notes_collection.insert_one(note_data)
    note_data["_id"] = result.inserted_id
    await _enrich_notes_with_owner_names(db, [note_data])
    return NoteInDB(**note_data)


async def get_note_by_id(
    db: AsyncIOMotorDatabase, note_id: str, current_user_id: Optional[str] = None
) -> Optional[dict]:
    notes_collection = db["notes"]

    try:
        note = await notes_collection.find_one({"_id": ObjectId(note_id)})
        if note:
            await _enrich_notes_with_owner_names(db, [note])
            
            # Ensure likes array exists
            if "likes" not in note:
                note["likes"] = []
            
            # Convert likes ObjectIds to strings
            note["likes"] = [str(like_id) if isinstance(like_id, ObjectId) else like_id for like_id in note.get("likes", [])]
            
            # Add likes_count and user_liked
            note["likes_count"] = len(note["likes"])
            note["user_liked"] = current_user_id and str(current_user_id) in note["likes"]
            
            return note
    except:
        pass
    return None


def _enrich_note_with_likes(note: dict, current_user_id: Optional[str] = None) -> None:
    """Enriches a note dict with likes_count and user_liked fields."""
    # Ensure _id is string
    if "_id" in note and isinstance(note["_id"], ObjectId):
        note["_id"] = str(note["_id"])
    
    # Ensure likes array exists
    if "likes" not in note:
        note["likes"] = []
    
    # Convert likes to strings
    note["likes"] = [str(like_id) if isinstance(like_id, ObjectId) else like_id for like_id in note.get("likes", [])]
    note["likes_count"] = len(note["likes"])
    
    # Check if current user liked
    if current_user_id:
        note["user_liked"] = str(current_user_id) in [str(like) for like in note["likes"]]
    else:
        note["user_liked"] = False
    
    # Ensure tags array exists
    if "tags" not in note:
        note["tags"] = []
    
    # Ensure file_name exists (can be None)
    if "file_name" not in note:
        note["file_name"] = None


async def search_notes(
    db: AsyncIOMotorDatabase,
    university: Optional[str] = None,
    career: Optional[str] = None,
    subject: Optional[str] = None,
    tags: Optional[List[str]] = None,
    current_user_id: Optional[str] = None,
    sort_by: str = "recent",  # "recent", "liked", "oldest"
    skip: int = 0,
    limit: int = 2,
) -> dict:
    """
    Busca notas con paginación y filtros
    
    Returns:
        dict con 'notes' (lista de notas), 'total' (total de notas que cumplen los filtros),
        'page' (página actual), 'limit' (límite por página), 'total_pages' (total de páginas)
    """
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

    # Contar total antes de aplicar skip/limit
    if query:
        total = await notes_collection.count_documents(query)
    else:
        total = await notes_collection.count_documents({})

    # Apply sorting based on sort_by parameter
    if sort_by == "liked":
        # Use aggregation to sort by likes count
        pipeline = [
            {"$match": query},
            {
                "$addFields": {
                    "likes": {"$ifNull": ["$likes", []]},
                    "likes_count": {"$size": {"$ifNull": ["$likes", []]}}
                }
            },
            {"$sort": {"likes_count": -1, "created_at": -1}},
            {"$skip": skip},
            {"$limit": limit},
        ]
        notes = await notes_collection.aggregate(pipeline).to_list(length=limit)
    elif sort_by == "oldest":
        notes = await notes_collection.find(query).sort("created_at", 1).skip(skip).limit(limit).to_list(length=limit)
    else:  # "recent" (default)
        notes = await notes_collection.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    
    await _enrich_notes_with_owner_names(db, notes)
    
    # Enrich each note with likes info
    for note in notes:
        _enrich_note_with_likes(note, current_user_id)
    
    # Calcular total de páginas
    total_pages = (total + limit - 1) // limit if limit > 0 else 0
    current_page = (skip // limit) + 1 if limit > 0 else 1
    
    return {
        "notes": notes,
        "total": total,
        "page": current_page,
        "limit": limit,
        "total_pages": total_pages,
    }


async def get_latest_notes(
    db: AsyncIOMotorDatabase, 
    limit: int = 3,
    current_user_id: Optional[str] = None
) -> List[dict]:
    notes_collection = db["notes"]

    notes = (
        await notes_collection.find({})
        .sort("created_at", -1)
        .limit(limit)
        .to_list(length=limit)
    )
    await _enrich_notes_with_owner_names(db, notes)
    
    # Enrich each note with likes info
    for note in notes:
        _enrich_note_with_likes(note, current_user_id)
    
    return notes


async def get_most_liked_notes(
    db: AsyncIOMotorDatabase,
    limit: int = 10,
    current_user_id: Optional[str] = None
) -> List[dict]:
    """Get notes sorted by number of likes (most liked first)"""
    notes_collection = db["notes"]

    # Use aggregation to count likes and sort
    # Ensure likes field exists and is an array
    pipeline = [
        {
            "$addFields": {
                "likes": {"$ifNull": ["$likes", []]},
                "likes_count": {"$size": {"$ifNull": ["$likes", []]}}
            }
        },
        # Filtrar solo notas con al menos 1 like (para que "Más valoradas" tenga sentido)
        {"$match": {"likes_count": {"$gt": 0}}},
        {"$sort": {"likes_count": -1, "created_at": -1}},  # Sort by likes count, then by date
        {"$limit": limit}
    ]

    notes = await notes_collection.aggregate(pipeline).to_list(length=limit)
    
    print(f"get_most_liked_notes: Found {len(notes)} notes after filtering")
    if notes:
        for note in notes[:3]:  # Print first 3 for debugging
            note_id = str(note.get("_id", "NO ID"))
            likes_count = note.get("likes_count", 0)
            likes_array = note.get("likes", [])
            print(f"  - Note ID: {note_id}, title: {note.get('title', 'NO TITLE')}, likes_count: {likes_count}, likes array length: {len(likes_array) if isinstance(likes_array, list) else 'NOT A LIST'}")
    
    if not notes:
        print("get_most_liked_notes: No notes found, returning empty list")
        # Check if there are any notes with likes at all
        all_notes = await notes_collection.find({}).to_list(length=5)
        for note in all_notes:
            likes = note.get("likes", [])
            print(f"  Sample note '{note.get('title', 'NO TITLE')}' has likes: {likes}, type: {type(likes)}, length: {len(likes) if isinstance(likes, list) else 'NOT A LIST'}")
        return []
    
    await _enrich_notes_with_owner_names(db, notes)
    
    # Enrich each note with likes info
    for note in notes:
        _enrich_note_with_likes(note, current_user_id)
    
    print(f"get_most_liked_notes: Returning {len(notes)} enriched notes")
    return notes


async def get_user_notes(
    db: AsyncIOMotorDatabase, 
    user_id: str,
    current_user_id: Optional[str] = None
) -> List[dict]:
    notes_collection = db["notes"]

    # Find notes by owner - support both ObjectId and string for backward compatibility
    try:
        owner_object_id = ObjectId(user_id)
        # Search for both ObjectId and string format (for backward compatibility)
        notes = await notes_collection.find({
            "$or": [
                {"owner": owner_object_id},
                {"owner": user_id}
            ]
        }).to_list(length=None)
    except (InvalidId, TypeError):
        # If user_id is not a valid ObjectId, search as string only
        notes = await notes_collection.find({"owner": user_id}).to_list(length=None)
    
    await _enrich_notes_with_owner_names(db, notes)
    
    # Enrich each note with likes info
    for note in notes:
        _enrich_note_with_likes(note, current_user_id or user_id)
    
    return notes


async def delete_note(db: AsyncIOMotorDatabase, note_id: str, user_id: str) -> bool:
    notes_collection = db["notes"]

    try:
        result = await notes_collection.delete_one(
            {"_id": ObjectId(note_id), "owner": user_id}
        )
        return result.deleted_count > 0
    except:
        return False


async def toggle_note_like(
    db: AsyncIOMotorDatabase, note_id: str, user_id: str
) -> Optional[dict]:
    """Toggle like on a note. Returns updated note with likes info."""
    notes_collection = db["notes"]
    
    try:
        note = await notes_collection.find_one({"_id": ObjectId(note_id)})
        if not note:
            return None
        
        # Ensure likes array exists
        if "likes" not in note:
            note["likes"] = []
        
        # Convert existing likes to strings for comparison
        likes = [str(like_id) if isinstance(like_id, ObjectId) else like_id for like_id in note["likes"]]
        user_id_str = str(user_id)
        
        # Toggle like
        if user_id_str in likes:
            # Remove like
            likes.remove(user_id_str)
        else:
            # Add like
            likes.append(user_id_str)
        
        # Update in database - convert user_ids to ObjectIds
        likes_object_ids = []
        for like_id in likes:
            try:
                likes_object_ids.append(ObjectId(like_id))
            except (InvalidId, TypeError):
                # If it's not a valid ObjectId, skip it
                continue
        
        await notes_collection.update_one(
            {"_id": ObjectId(note_id)},
            {"$set": {"likes": likes_object_ids}}
        )
        
        # Get updated note
        updated_note = await notes_collection.find_one({"_id": ObjectId(note_id)})
        if updated_note:
            # Ensure _id is string before enriching
            if "_id" in updated_note and isinstance(updated_note["_id"], ObjectId):
                updated_note["_id"] = str(updated_note["_id"])
            
            # Enrich with owner names (this mutates updated_note)
            await _enrich_notes_with_owner_names(db, [updated_note])
            
            # Ensure owner is present (should be enriched by _enrich_notes_with_owner_names)
            if "owner" not in updated_note or not updated_note["owner"]:
                # Fallback: use owner_id if available
                owner_value = updated_note.get("owner")
                if isinstance(owner_value, ObjectId):
                    updated_note["owner"] = str(owner_value)
                elif not owner_value:
                    updated_note["owner"] = "Unknown"
            
            # Ensure likes array exists
            if "likes" not in updated_note:
                updated_note["likes"] = []
            
            # Convert likes to strings
            updated_note["likes"] = [str(like_id) if isinstance(like_id, ObjectId) else like_id for like_id in updated_note.get("likes", [])]
            updated_note["likes_count"] = len(updated_note["likes"])
            
            # Compare user_id_str with string versions of likes
            updated_note["user_liked"] = user_id_str in [str(like) for like in updated_note["likes"]]
            
            # Ensure tags array exists
            if "tags" not in updated_note:
                updated_note["tags"] = []
            
            # Ensure file_name exists (can be None)
            if "file_name" not in updated_note:
                updated_note["file_name"] = None
            
            return updated_note
    except Exception as e:
        print(f"Error toggling like: {e}")
        import traceback
        traceback.print_exc()
    return None


async def create_note_indexes(db: AsyncIOMotorDatabase):
    notes_collection = db["notes"]
    await notes_collection.create_index("university")
    await notes_collection.create_index("career")
    await notes_collection.create_index("subject")
    await notes_collection.create_index("tags")
    await notes_collection.create_index("owner")
    await notes_collection.create_index("created_at")
    await notes_collection.create_index("likes")
