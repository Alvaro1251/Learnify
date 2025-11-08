"""
Script para inicializar el campo 'likes' en las notas existentes que no lo tienen.
Ejecutar desde el directorio backend: python scripts/init_notes_likes.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

MONGODB_URL = "mongodb://admin:password@localhost:27017/learnify?authSource=admin"
DB_NAME = "learnify"


async def init_notes_likes():
    """Inicializa el campo 'likes' en todas las notas que no lo tienen"""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    notes_collection = db["notes"]

    # Encontrar todas las notas que no tienen el campo 'likes'
    notes_without_likes = await notes_collection.find(
        {"likes": {"$exists": False}}
    ).to_list(length=None)

    print(f"Found {len(notes_without_likes)} notes without 'likes' field")

    if notes_without_likes:
        # Actualizar todas las notas para agregar el campo 'likes' como array vacío
        result = await notes_collection.update_many(
            {"likes": {"$exists": False}},
            {"$set": {"likes": []}}
        )
        print(f"Updated {result.modified_count} notes with empty 'likes' array")
    else:
        print("All notes already have 'likes' field")

    # También verificar que todas las notas tengan 'likes' como array
    notes_with_invalid_likes = await notes_collection.find(
        {"likes": {"$not": {"$type": "array"}}}
    ).to_list(length=None)

    if notes_with_invalid_likes:
        result2 = await notes_collection.update_many(
            {"likes": {"$not": {"$type": "array"}}},
            {"$set": {"likes": []}}
        )
        print(f"Fixed {result2.modified_count} notes with invalid 'likes' field")

    client.close()
    print("Done!")


if __name__ == "__main__":
    asyncio.run(init_notes_likes())

