from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi

MONGO_URL = "mongodb://localhost:27017"
client = AsyncIOMotorClient(MONGO_URL, server_api=ServerApi('1'))
db = client.learnify_db

# Collections
users_collection = db.users 