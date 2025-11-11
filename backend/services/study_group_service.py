from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from bson.errors import InvalidId
from models.study_group import (
    StudyGroupCreate,
    StudyGroupInDB,
    SharedFile,
    ChatMessage,
)
from typing import Any, List, Optional


def _name_concat_expression(var_name: str, default: str = "Unknown") -> dict:
    """Builds a MongoDB aggregation expression that turns a user's first and last name into a single string safely."""
    full_name_path = f"$${var_name}.full_name"
    last_name_path = f"$${var_name}.last_name"

    return {
        "$let": {
            "vars": {
                "first": {
                    "$cond": [
                        {"$eq": [{"$type": full_name_path}, "string"]},
                        full_name_path,
                        None,
                    ]
                },
                "last": {
                    "$cond": [
                        {"$eq": [{"$type": last_name_path}, "string"]},
                        last_name_path,
                        None,
                    ]
                },
            },
            "in": {
                "$trim": {
                    "input": {
                        "$concat": [
                            {"$ifNull": ["$$first", default]},
                            " ",
                            {"$ifNull": ["$$last", ""]},
                        ]
                    }
                }
            },
        }
    }


def _safe_string_id_expression(value_expr: Any) -> dict:
    """Ensures any ObjectId or string value is coerced into a string, otherwise returns None."""
    return {
        "$let": {
            "vars": {"value": value_expr},
            "in": {
                "$switch": {
                    "branches": [
                        {
                            "case": {"$eq": [{"$type": "$$value"}, "objectId"]},
                            "then": {"$toString": "$$value"},
                        },
                        {
                            "case": {"$eq": [{"$type": "$$value"}, "string"]},
                            "then": "$$value",
                        },
                    ],
                    "default": None,
                }
            },
        }
    }


def _assign_owner_name(group: dict) -> None:
    """Replace the owner field with the user's display name when possible."""
    if not group:
        return

    owner_value = group.get("owner")
    if owner_value is None:
        return

    owner_id = str(owner_value)
    member_ids = group.get("member_ids") or []
    members = group.get("members") or []
    owner_name: Optional[str] = None

    try:
        idx = member_ids.index(owner_id)
    except ValueError:
        idx = None

    if isinstance(idx, int) and 0 <= idx < len(members):
        candidate = members[idx]
        if isinstance(candidate, str):
            normalized = candidate.strip()
            if normalized and normalized.lower() != "unknown":
                owner_name = normalized

    if not owner_name:
        for member in group.get("members_info") or []:
            if str(member.get("_id")) == owner_id:
                first = member.get("full_name")
                last = member.get("last_name")
                parts: List[str] = []
                for part in (first, last):
                    if isinstance(part, str):
                        normalized = part.strip()
                        if normalized:
                            parts.append(normalized)
                if parts:
                    candidate = " ".join(parts)
                    if candidate.lower() != "unknown":
                        owner_name = candidate
                break

    group["owner"] = owner_name or owner_id


async def _enrich_group_with_member_names(
    db: AsyncIOMotorDatabase, group_id: str
) -> Optional[dict]:
    """Helper function to enrich group data with member names and chat sender names from users collection"""
    groups_collection = db["study_groups"]

    pipeline = [
        {"$match": {"_id": ObjectId(group_id)}},
        # Lookup members to get their names
        {
            "$lookup": {
                "from": "users",
                "localField": "members",
                "foreignField": "_id",
                "as": "members_info",
            }
        },
        # Lookup pending requests to get their names
        {
            "$lookup": {
                "from": "users",
                "localField": "pending_requests",
                "foreignField": "_id",
                "as": "pending_requests_info",
            }
        },
        # Lookup chat senders to get their names (using sender_id which is the ObjectId)
        {
            "$lookup": {
                "from": "users",
                "localField": "chat.sender_id",
                "foreignField": "_id",
                "as": "chat_senders_info",
            }
        },
        # Transform to include both names and IDs
        {
            "$addFields": {
                "members": {
                    "$map": {
                        "input": "$members_info",
                        "as": "member",
                        "in": _name_concat_expression("member"),
                    }
                },
                "member_ids": {
                    "$map": {
                        "input": "$members_info",
                        "as": "member",
                        "in": {"$toString": "$$member._id"},
                    }
                },
                "pending_requests": {
                    "$map": {
                        "input": "$pending_requests_info",
                        "as": "pending",
                        "in": _name_concat_expression("pending"),
                    }
                },
                "pending_request_ids": {
                    "$map": {
                        "input": "$pending_requests_info",
                        "as": "pending",
                        "in": {"$toString": "$$pending._id"},
                    }
                },
                # Enrich chat messages with sender names
                "chat": {
                    "$map": {
                        "input": "$chat",
                        "as": "message",
                        "in": {
                            "sender": {
                                "$let": {
                                    "vars": {
                                        "matched_names": {
                                            "$map": {
                                                "input": {
                                                    "$filter": {
                                                        "input": "$chat_senders_info",
                                                        "as": "user",
                                                        "cond": {
                                                            "$eq": [
                                                                {"$toString": "$$user._id"},
                                                                _safe_string_id_expression(
                                                                    {
                                                                        "$ifNull": [
                                                                            "$$message.sender_id",
                                                                            "$$message.sender",
                                                                        ]
                                                                    }
                                                                ),
                                                            ]
                                                        },
                                                    }
                                                },
                                                "as": "user",
                                                "in": _name_concat_expression("user"),
                                            }
                                        }
                                    },
                                    "in": {
                                        "$ifNull": [
                                            {"$arrayElemAt": ["$$matched_names", 0]},
                                            {"$ifNull": ["$$message.sender", "Unknown"]},
                                        ]
                                    },
                                }
                            },
                            "sender_id": _safe_string_id_expression(
                                {"$ifNull": ["$$message.sender_id", "$$message.sender"]}
                            ),
                            "content": "$$message.content",
                            "timestamp": "$$message.timestamp",
                        }
                    }
                },
            }
        },
    ]

    results = await groups_collection.aggregate(pipeline).to_list(length=1)
    if results:
        group = results[0]
        group["_id"] = str(group["_id"])
        _assign_owner_name(group)
        return group
    return None


async def create_study_group(
    db: AsyncIOMotorDatabase, group: StudyGroupCreate, owner_id: str
) -> StudyGroupInDB:
    groups_collection = db["study_groups"]

    group_data = {
        "name": group.name,
        "description": group.description,
        "owner": ObjectId(owner_id),  # Convert to ObjectId for referential integrity
        "members": [ObjectId(owner_id)],  # Store members as ObjectIds
        "pending_requests": [],
        "files": [],
        "chat": [],
        "is_public": group.is_public,
        "exam_date": group.exam_date,
        "created_at": datetime.utcnow(),
    }

    result = await groups_collection.insert_one(group_data)
    # Use helper to enrich with names
    enriched = await _enrich_group_with_member_names(db, str(result.inserted_id))
    return StudyGroupInDB(**enriched) if enriched else StudyGroupInDB(**group_data)


async def get_study_group_by_id(
    db: AsyncIOMotorDatabase, group_id: str
) -> StudyGroupInDB:
    try:
        # Use helper to enrich with names
        enriched = await _enrich_group_with_member_names(db, group_id)
        return StudyGroupInDB(**enriched) if enriched else None
    except Exception as e:
        print(f"Error in get_study_group_by_id: {e}")
        import traceback
        traceback.print_exc()
    return None


async def get_public_study_groups(
    db: AsyncIOMotorDatabase,
    skip: int = 0,
    limit: int = 2,
    exclude_user_id: Optional[str] = None,
) -> dict:
    """
    Obtiene grupos públicos con paginación
    
    Returns:
        dict con 'groups' (lista de grupos), 'total' (total de grupos públicos),
        'page' (página actual), 'limit' (límite por página), 'total_pages' (total de páginas)
    """
    groups_collection = db["study_groups"]

    # Construir query base
    match_query = {"is_public": True}
    
    # Si se especifica exclude_user_id, excluir grupos donde el usuario ya es miembro
    if exclude_user_id:
        try:
            user_oid = ObjectId(exclude_user_id)
            match_query["members"] = {"$nin": [user_oid]}  # $nin = not in array
        except (InvalidId, TypeError):
            pass  # Si el ID no es válido, ignorar el filtro

    # Contar total de grupos públicos (excluyendo los del usuario si aplica)
    total = await groups_collection.count_documents(match_query)

    pipeline = [
        {"$match": match_query},
        {"$sort": {"created_at": -1}},  # Ordenar por más recientes primero
        {"$skip": skip},
        {"$limit": limit},
        # Lookup members to get their names
        {
            "$lookup": {
                "from": "users",
                "localField": "members",
                "foreignField": "_id",
                "as": "members_info",
            }
        },
        # Lookup pending requests to get their names
        {
            "$lookup": {
                "from": "users",
                "localField": "pending_requests",
                "foreignField": "_id",
                "as": "pending_requests_info",
            }
        },
        # Transform to include both names and IDs
        {
            "$addFields": {
                "members": {
                    "$map": {
                        "input": "$members_info",
                        "as": "member",
                        "in": _name_concat_expression("member"),
                    }
                },
                "member_ids": {
                    "$map": {
                        "input": "$members_info",
                        "as": "member",
                        "in": {"$toString": "$$member._id"},
                    }
                },
                "pending_requests": {
                    "$map": {
                        "input": "$pending_requests_info",
                        "as": "pending",
                        "in": _name_concat_expression("pending"),
                    }
                },
                "pending_request_ids": {
                    "$map": {
                        "input": "$pending_requests_info",
                        "as": "pending",
                        "in": {"$toString": "$$pending._id"},
                    }
                },
            }
        },
        # Project final result
        {
            "$project": {
                "_id": {"$toString": "$_id"},
                "name": 1,
                "description": 1,
                "owner": {"$toString": "$owner"},
                "members": 1,
                "member_ids": 1,
                "pending_requests": 1,
                "pending_request_ids": 1,
                "is_public": 1,
                "exam_date": 1,
                "created_at": 1,
                "members_count": {"$size": "$members"},
                "files_count": {"$size": "$files"},
                "messages_count": {"$size": "$chat"},
            }
        },
    ]

    groups = await groups_collection.aggregate(pipeline).to_list(length=limit)
    for group in groups:
        _assign_owner_name(group)
    
    # Calcular total de páginas
    total_pages = (total + limit - 1) // limit if limit > 0 else 0
    current_page = (skip // limit) + 1 if limit > 0 else 1
    
    return {
        "groups": groups,
        "total": total,
        "page": current_page,
        "limit": limit,
        "total_pages": total_pages,
    }


async def get_user_study_groups(
    db: AsyncIOMotorDatabase,
    user_id: str,
    skip: int = 0,
    limit: int = 2,
) -> dict:
    """
    Obtiene grupos del usuario con paginación
    
    Returns:
        dict con 'groups' (lista de grupos), 'total' (total de grupos del usuario),
        'page' (página actual), 'limit' (límite por página), 'total_pages' (total de páginas)
    """
    groups_collection = db["study_groups"]

    # Contar total de grupos del usuario
    total = await groups_collection.count_documents({"members": ObjectId(user_id)})

    pipeline = [
        {"$match": {"members": ObjectId(user_id)}},
        {"$sort": {"created_at": -1}},  # Ordenar por más recientes primero
        {"$skip": skip},
        {"$limit": limit},
        # Lookup members to get their names
        {
            "$lookup": {
                "from": "users",
                "localField": "members",
                "foreignField": "_id",
                "as": "members_info",
            }
        },
        # Lookup pending requests to get their names
        {
            "$lookup": {
                "from": "users",
                "localField": "pending_requests",
                "foreignField": "_id",
                "as": "pending_requests_info",
            }
        },
        # Transform to include both names and IDs
        {
            "$addFields": {
                "members": {
                    "$map": {
                        "input": "$members_info",
                        "as": "member",
                        "in": _name_concat_expression("member"),
                    }
                },
                "member_ids": {
                    "$map": {
                        "input": "$members_info",
                        "as": "member",
                        "in": {"$toString": "$$member._id"},
                    }
                },
                "pending_requests": {
                    "$map": {
                        "input": "$pending_requests_info",
                        "as": "pending",
                        "in": _name_concat_expression("pending"),
                    }
                },
                "pending_request_ids": {
                    "$map": {
                        "input": "$pending_requests_info",
                        "as": "pending",
                        "in": {"$toString": "$$pending._id"},
                    }
                },
            }
        },
        # Project final result
        {
            "$project": {
                "_id": {"$toString": "$_id"},
                "name": 1,
                "description": 1,
                "owner": {"$toString": "$owner"},
                "members": 1,
                "member_ids": 1,
                "pending_requests": 1,
                "pending_request_ids": 1,
                "is_public": 1,
                "exam_date": 1,
                "created_at": 1,
                "members_count": {"$size": "$members"},
                "files_count": {"$size": "$files"},
                "messages_count": {"$size": "$chat"},
            }
        },
    ]

    groups = await groups_collection.aggregate(pipeline).to_list(length=limit)
    for group in groups:
        _assign_owner_name(group)
    
    # Calcular total de páginas
    total_pages = (total + limit - 1) // limit if limit > 0 else 0
    current_page = (skip // limit) + 1 if limit > 0 else 1
    
    return {
        "groups": groups,
        "total": total,
        "page": current_page,
        "limit": limit,
        "total_pages": total_pages,
    }


async def request_to_join(
    db: AsyncIOMotorDatabase, group_id: str, user_id: str
) -> Optional[StudyGroupInDB]:
    groups_collection = db["study_groups"]

    try:
        group = await groups_collection.find_one({"_id": ObjectId(group_id)})
        if not group:
            return None

        user_oid = ObjectId(user_id)  # Convert to ObjectId for comparison

        if group["is_public"]:
            if user_oid not in group.get("members", []):
                await groups_collection.find_one_and_update(
                    {"_id": ObjectId(group_id)},
                    {"$push": {"members": user_oid}},  # Push ObjectId
                    return_document=True,
                )
                # Use helper to enrich with names
                return StudyGroupInDB(**await _enrich_group_with_member_names(db, group_id))
        else:
            if user_oid not in group.get("pending_requests", []):
                await groups_collection.find_one_and_update(
                    {"_id": ObjectId(group_id)},
                    {"$push": {"pending_requests": user_oid}},  # Push ObjectId
                    return_document=True,
                )
                # Use helper to enrich with names
                return StudyGroupInDB(**await _enrich_group_with_member_names(db, group_id))

        # Use helper to enrich with names
        enriched = await _enrich_group_with_member_names(db, group_id)
        return StudyGroupInDB(**enriched) if enriched else None
    except Exception as e:
        print(f"Error in request_to_join: {e}")
        import traceback
        traceback.print_exc()
    return None


async def accept_join_request(
    db: AsyncIOMotorDatabase, group_id: str, user_id: str, owner_id: str
) -> Optional[StudyGroupInDB]:
    groups_collection = db["study_groups"]

    try:
        group = await groups_collection.find_one({"_id": ObjectId(group_id)})
        if not group or str(group["owner"]) != owner_id:  # Compare as string
            return None

        user_oid = ObjectId(user_id)  # Convert to ObjectId

        if user_oid in group.get("pending_requests", []):
            await groups_collection.find_one_and_update(
                {"_id": ObjectId(group_id)},
                {
                    "$pull": {"pending_requests": user_oid},  # Pull ObjectId
                    "$push": {"members": user_oid},  # Push ObjectId
                },
                return_document=True,
            )
            # Use helper to enrich with names
            enriched = await _enrich_group_with_member_names(db, group_id)
            return StudyGroupInDB(**enriched) if enriched else None

        # Use helper to enrich with names
        enriched = await _enrich_group_with_member_names(db, group_id)
        return StudyGroupInDB(**enriched) if enriched else None
    except Exception as e:
        print(f"Error in accept_join_request: {e}")
        import traceback
        traceback.print_exc()
    return None


async def leave_study_group(
    db: AsyncIOMotorDatabase, group_id: str, user_id: str
) -> bool:
    groups_collection = db["study_groups"]

    try:
        result = await groups_collection.update_one(
            {"_id": ObjectId(group_id)}, {"$pull": {"members": ObjectId(user_id)}}  # Pull ObjectId
        )
        return result.modified_count > 0
    except:
        return False


async def share_file(
    db: AsyncIOMotorDatabase,
    group_id: str,
    file_url: str,
    user_id: str,
) -> Optional[StudyGroupInDB]:
    groups_collection = db["study_groups"]

    try:
        file_data = SharedFile(uploaded_by=user_id, file_url=file_url)

        result = await groups_collection.find_one_and_update(
            {"_id": ObjectId(group_id), "members": ObjectId(user_id)},  # Query by ObjectId
            {"$push": {"files": file_data.dict()}},
            return_document=True,
        )

        if result:
            # Use helper to enrich with names
            enriched = await _enrich_group_with_member_names(db, group_id)
            return StudyGroupInDB(**enriched) if enriched else None
    except Exception as e:
        print(f"Error in share_file: {e}")
        import traceback
        traceback.print_exc()
    return None


async def add_chat_message(
    db: AsyncIOMotorDatabase, group_id: str, content: str, sender_id: str
) -> Optional[StudyGroupInDB]:
    groups_collection = db["study_groups"]
    users_collection = db["users"]

    try:
        # Build a human-friendly sender name while keeping IDs for membership validation
        user = await users_collection.find_one(
            {"_id": ObjectId(sender_id)}, {"full_name": 1, "last_name": 1}
        )
        full_name = user.get("full_name") if user else None
        last_name = user.get("last_name") if user else None

        if isinstance(full_name, str):
            name_parts = [full_name.strip()]
            if isinstance(last_name, str) and last_name.strip():
                name_parts.append(last_name.strip())
            sender_display = " ".join(name_parts).strip()
        else:
            sender_display = None

        sender_display = sender_display or sender_id

        message_data = ChatMessage(sender=sender_display, sender_id=sender_id, content=content)
        message_dict = message_data.dict()
        
        # Convert sender_id to ObjectId for MongoDB lookup to work correctly
        if message_dict.get("sender_id"):
            try:
                message_dict["sender_id"] = ObjectId(message_dict["sender_id"])
            except (InvalidId, TypeError):
                print(f"Invalid sender_id format: {message_dict.get('sender_id')}")
                # Keep as string if conversion fails

        # Verify user is a member of the group and add message in one operation
        # MongoDB will only update if the user is in the members array
        result = await groups_collection.find_one_and_update(
            {"_id": ObjectId(group_id), "members": ObjectId(sender_id)},
            {"$push": {"chat": message_dict}},
            return_document=True,
        )
        
        if not result:
            print(f"Failed to add message: User {sender_id} may not be a member of group {group_id}")
            # Double-check if group exists
            group_exists = await groups_collection.find_one({"_id": ObjectId(group_id)})
            if group_exists:
                members_list = group_exists.get('members', [])
                members_str = [str(m) if isinstance(m, ObjectId) else m for m in members_list]
                print(f"Group exists but user {sender_id} is not in members: {members_str}")
            else:
                print(f"Group {group_id} does not exist")
            return None

        # Use helper to enrich with names
        enriched = await _enrich_group_with_member_names(db, group_id)
        return StudyGroupInDB(**enriched) if enriched else None
    except Exception as e:
        print(f"Error in add_chat_message: {e}")
        import traceback
        traceback.print_exc()
    return None


async def get_study_group_messages(
    db: AsyncIOMotorDatabase, group_id: str, limit: int = 50
) -> List[ChatMessage]:
    try:
        enriched = await _enrich_group_with_member_names(db, group_id)
        if enriched:
            messages = enriched.get("chat", [])
            return [ChatMessage(**msg) for msg in messages[-limit:]]
    except Exception as e:
        print(f"Error in get_study_group_messages: {e}")
        pass
    return []


async def create_study_group_indexes(db: AsyncIOMotorDatabase):
    groups_collection = db["study_groups"]
    await groups_collection.create_index("owner")
    await groups_collection.create_index("members")
    await groups_collection.create_index("is_public")
    await groups_collection.create_index("created_at")
