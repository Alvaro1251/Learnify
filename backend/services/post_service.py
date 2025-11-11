from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from models.post import PostCreate, Response, ResponseCreate, PostInDB
from typing import List, Optional


async def create_post(
    db: AsyncIOMotorDatabase, post: PostCreate, owner_id: str
) -> PostInDB:
    posts_collection = db["posts"]

    post_data = {
        "title": post.title,
        "description": post.description,
        "subject": post.subject,
        "owner": ObjectId(owner_id),  # Convert string to ObjectId
        "creation_date": datetime.utcnow(),
        "responses": [],
    }

    result = await posts_collection.insert_one(post_data)
    post_data["_id"] = str(result.inserted_id)
    post_data["owner"] = owner_id  # Convert back to string for response
    return PostInDB(**post_data)


async def get_post_by_id(db: AsyncIOMotorDatabase, post_id: str):
    posts_collection = db["posts"]

    try:
        pipeline = [
            {"$match": {"_id": ObjectId(post_id)}},
            {
                "$lookup": {
                    "from": "users",
                    "localField": "owner",
                    "foreignField": "_id",
                    "as": "owner_info",
                }
            },
            {
                "$addFields": {
                    "owner": {
                        "$concat": [
                            {"$ifNull": [{"$arrayElemAt": ["$owner_info.full_name", 0]}, "Unknown"]},
                            " ",
                            {"$ifNull": [{"$arrayElemAt": ["$owner_info.last_name", 0]}, ""]},
                        ]
                    }
                }
            },
            {
                "$unwind": {
                    "path": "$responses",
                    "preserveNullAndEmptyArrays": True,
                }
            },
            {
                "$lookup": {
                    "from": "users",
                    "localField": "responses.owner",
                    "foreignField": "_id",
                    "as": "response_owner_info",
                }
            },
            {
                "$addFields": {
                    "responses.owner": {
                        "$cond": [
                            {"$and": [
                                {"$gt": [{"$size": "$response_owner_info"}, 0]},
                                {"$ne": ["$responses.content", None]},
                            ]},
                            {
                                "$concat": [
                                    {"$arrayElemAt": ["$response_owner_info.full_name", 0]},
                                    " ",
                                    {"$ifNull": [{"$arrayElemAt": ["$response_owner_info.last_name", 0]}, ""]},
                                ]
                            },
                            None,
                        ]
                    }
                }
            },
            {
                "$group": {
                    "_id": "$_id",
                    "title": {"$first": "$title"},
                    "description": {"$first": "$description"},
                    "subject": {"$first": "$subject"},
                    "owner": {"$first": "$owner"},
                    "creation_date": {"$first": "$creation_date"},
                    "responses": {"$push": "$responses"},
                }
            },
            {
                "$project": {
                    "_id": 1,
                    "title": 1,
                    "description": 1,
                    "subject": 1,
                    "owner": 1,
                    "creation_date": 1,
                    "responses": {
                        "$filter": {
                            "input": "$responses",
                            "as": "response",
                            "cond": {"$ne": ["$$response.owner", None]},
                        }
                    },
                }
            },
        ]

        results = await posts_collection.aggregate(pipeline).to_list(length=1)
        if results:
            post = results[0]
            post["_id"] = str(post["_id"])
            return post
    except Exception as e:
        print(f"Error in get_post_by_id: {e}")
        import traceback
        traceback.print_exc()
    return None


async def get_latest_posts(
    db: AsyncIOMotorDatabase,
    skip: int = 0,
    limit: int = 2,
    search: str = None,
    subject: str = None,
) -> dict:
    """
    Obtiene posts con paginación y filtros
    
    Returns:
        dict con 'posts' (lista de posts), 'total' (total de posts que cumplen los filtros),
        'page' (página actual), 'limit' (límite por página), 'total_pages' (total de páginas)
    """
    posts_collection = db["posts"]

    # Construir el match inicial para filtros
    match_stage = {}
    
    # Filtro por búsqueda (título o descripción)
    if search and search.strip():
        search_term = search.strip()
        match_stage["$or"] = [
            {"title": {"$regex": search_term, "$options": "i"}},
            {"description": {"$regex": search_term, "$options": "i"}},
        ]
    
    # Filtro por materia
    if subject and subject.strip():
        match_stage["subject"] = {"$regex": subject.strip(), "$options": "i"}

    # Pipeline de agregación
    pipeline = [
        {"$sort": {"creation_date": -1}},
    ]
    
    # Agregar match si hay filtros
    if match_stage:
        pipeline.insert(0, {"$match": match_stage})
    
    # Contar total antes de aplicar skip/limit
    if match_stage:
        # Si hay filtros, usar el pipeline de agregación
        count_pipeline = [{"$match": match_stage}]
        count_result = await posts_collection.aggregate([
            *count_pipeline,
            {"$count": "total"}
        ]).to_list(length=1)
        total = count_result[0]["total"] if count_result else 0
    else:
        # Si no hay filtros, usar count_documents (más eficiente)
        total = await posts_collection.count_documents({})
    
    # Agregar skip, limit y lookups
    pipeline.extend([
        {"$skip": skip},
        {"$limit": limit},
        {
            "$lookup": {
                "from": "users",
                "localField": "owner",
                "foreignField": "_id",
                "as": "owner_info",
            }
        },
        {
            "$addFields": {
                "owner": {
                    "$concat": [
                        {"$ifNull": [{"$arrayElemAt": ["$owner_info.full_name", 0]}, "Unknown"]},
                        " ",
                        {"$ifNull": [{"$arrayElemAt": ["$owner_info.last_name", 0]}, ""]},
                    ]
                }
            }
        },
        {
            "$project": {
                "_id": {"$toString": "$_id"},
                "title": 1,
                "description": 1,
                "subject": 1,
                "owner": 1,
                "creation_date": 1,
                "responses_count": {"$size": "$responses"},
            }
        },
    ])

    posts = await posts_collection.aggregate(pipeline).to_list(length=limit)
    
    # Calcular total de páginas
    total_pages = (total + limit - 1) // limit if limit > 0 else 0
    current_page = (skip // limit) + 1 if limit > 0 else 1
    
    return {
        "posts": posts,
        "total": total,
        "page": current_page,
        "limit": limit,
        "total_pages": total_pages,
    }


async def add_response_to_post(
    db: AsyncIOMotorDatabase, post_id: str, response: ResponseCreate, owner_id: str
):
    posts_collection = db["posts"]

    try:
        new_response = {
            "owner": ObjectId(owner_id),  # Convert string to ObjectId
            "content": response.content,
            "creation_date": datetime.utcnow(),
        }

        await posts_collection.find_one_and_update(
            {"_id": ObjectId(post_id)},
            {"$push": {"responses": new_response}},
            return_document=True,
        )

        # Use aggregation to return the updated post with user names
        pipeline = [
            {"$match": {"_id": ObjectId(post_id)}},
            {
                "$lookup": {
                    "from": "users",
                    "localField": "owner",
                    "foreignField": "_id",
                    "as": "owner_info",
                }
            },
            {
                "$addFields": {
                    "owner": {
                        "$concat": [
                            {"$ifNull": [{"$arrayElemAt": ["$owner_info.full_name", 0]}, "Unknown"]},
                            " ",
                            {"$ifNull": [{"$arrayElemAt": ["$owner_info.last_name", 0]}, ""]},
                        ]
                    }
                }
            },
            {
                "$unwind": {
                    "path": "$responses",
                    "preserveNullAndEmptyArrays": True,
                }
            },
            {
                "$lookup": {
                    "from": "users",
                    "localField": "responses.owner",
                    "foreignField": "_id",
                    "as": "response_owner_info",
                }
            },
            {
                "$addFields": {
                    "responses.owner": {
                        "$cond": [
                            {"$and": [
                                {"$gt": [{"$size": "$response_owner_info"}, 0]},
                                {"$ne": ["$responses.content", None]},
                            ]},
                            {
                                "$concat": [
                                    {"$arrayElemAt": ["$response_owner_info.full_name", 0]},
                                    " ",
                                    {"$ifNull": [{"$arrayElemAt": ["$response_owner_info.last_name", 0]}, ""]},
                                ]
                            },
                            None,
                        ]
                    }
                }
            },
            {
                "$group": {
                    "_id": "$_id",
                    "title": {"$first": "$title"},
                    "description": {"$first": "$description"},
                    "subject": {"$first": "$subject"},
                    "owner": {"$first": "$owner"},
                    "creation_date": {"$first": "$creation_date"},
                    "responses": {"$push": "$responses"},
                }
            },
            {
                "$project": {
                    "_id": 1,
                    "title": 1,
                    "description": 1,
                    "subject": 1,
                    "owner": 1,
                    "creation_date": 1,
                    "responses": {
                        "$filter": {
                            "input": "$responses",
                            "as": "response",
                            "cond": {"$ne": ["$$response.owner", None]},
                        }
                    },
                }
            },
        ]

        results = await posts_collection.aggregate(pipeline).to_list(length=1)
        if results:
            post = results[0]
            post["_id"] = str(post["_id"])
            return post
    except Exception as e:
        print(f"Error in add_response_to_post: {e}")
        import traceback
        traceback.print_exc()
    return None


async def get_user_posts(db: AsyncIOMotorDatabase, user_id: str):
    posts_collection = db["posts"]

    pipeline = [
        {"$match": {"owner": ObjectId(user_id)}},
        {
            "$lookup": {
                "from": "users",
                "localField": "owner",
                "foreignField": "_id",
                "as": "owner_info",
            }
        },
        {
            "$addFields": {
                "owner": {
                    "$concat": [
                        {"$ifNull": [{"$arrayElemAt": ["$owner_info.full_name", 0]}, "Unknown"]},
                        " ",
                        {"$ifNull": [{"$arrayElemAt": ["$owner_info.last_name", 0]}, ""]},
                    ]
                }
            }
        },
        {
            "$unwind": {
                "path": "$responses",
                "preserveNullAndEmptyArrays": True,
            }
        },
        {
            "$lookup": {
                "from": "users",
                "localField": "responses.owner",
                "foreignField": "_id",
                "as": "response_owner_info",
            }
        },
        {
            "$addFields": {
                "responses.owner": {
                    "$cond": [
                        {"$and": [
                            {"$gt": [{"$size": "$response_owner_info"}, 0]},
                            {"$ne": ["$responses.content", None]},
                        ]},
                        {
                            "$concat": [
                                {"$arrayElemAt": ["$response_owner_info.full_name", 0]},
                                " ",
                                {"$ifNull": [{"$arrayElemAt": ["$response_owner_info.last_name", 0]}, ""]},
                            ]
                        },
                        None,
                    ]
                }
            }
        },
        {
            "$group": {
                "_id": "$_id",
                "title": {"$first": "$title"},
                "description": {"$first": "$description"},
                "subject": {"$first": "$subject"},
                "owner": {"$first": "$owner"},
                "creation_date": {"$first": "$creation_date"},
                "responses": {"$push": "$responses"},
            }
        },
        {
            "$project": {
                "_id": {"$toString": "$_id"},
                "title": 1,
                "description": 1,
                "subject": 1,
                "owner": 1,
                "creation_date": 1,
                "responses": {
                    "$filter": {
                        "input": "$responses",
                        "as": "response",
                        "cond": {"$ne": ["$$response.owner", None]},
                    }
                },
            }
        },
    ]

    posts = await posts_collection.aggregate(pipeline).to_list(length=None)
    return posts


async def delete_post(
    db: AsyncIOMotorDatabase, post_id: str, user_id: str, user_role: str = "user"
) -> bool:
    """
    Elimina un post. Solo el dueño puede borrarlo, excepto moderadores y admins
    que pueden borrar cualquier post.
    """
    posts_collection = db["posts"]

    try:
        # Si es moderador o admin, puede borrar cualquier post
        if user_role in ["moderator", "admin"]:
            result = await posts_collection.delete_one({"_id": ObjectId(post_id)})
        else:
            # Si es usuario normal, solo puede borrar sus propios posts
            result = await posts_collection.delete_one(
                {"_id": ObjectId(post_id), "owner": ObjectId(user_id)}
            )
        return result.deleted_count > 0
    except:
        return False


async def create_post_indexes(db: AsyncIOMotorDatabase):
    posts_collection = db["posts"]
    await posts_collection.create_index("subject")
    await posts_collection.create_index("owner")
    await posts_collection.create_index("creation_date")
