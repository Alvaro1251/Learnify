from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.server_api import ServerApi
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "learnify"

    class Config:
        env_file = ".env"


settings = Settings()

# MongoDB client
client: AsyncIOMotorClient = None
db: AsyncIOMotorDatabase = None


async def connect_to_mongo():
    """Connect to MongoDB with Stable API"""
    global client, db
    try:
        client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            server_api=ServerApi('1')
        )
        db = client[settings.MONGODB_DB_NAME]

        # Ping to verify connection
        await client.admin.command('ping')
        print(f"Connected to MongoDB at {settings.MONGODB_URL}")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """Close MongoDB connection"""
    global client
    if client:
        try:
            client.close()
            print("Disconnected from MongoDB")
        except Exception as e:
            print(f"Error closing MongoDB connection: {e}")


def get_database() -> AsyncIOMotorDatabase:
    """Get the MongoDB database instance"""
    return db
