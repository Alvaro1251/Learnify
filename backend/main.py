from fastapi import FastAPI, Depends
import uvicorn
from routes.auth import router as auth_router
from routes.profile import router as profile_router
from routes.post import router as post_router
from utils.auth import get_current_user

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

# Configure CORS
origins = [
    "http://localhost:3000",    # React default port
    "http://localhost:5173",    # Vite default port
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # Specify the allowed origins
    allow_credentials=True,     # Important for cookies/authentication
    allow_methods=["*"],        # Allow all methods
    allow_headers=["*"],        # Allow all headers
    expose_headers=["*"]        # Expose all headers
)

# Include routes
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(post_router)

@app.get("/")
async def root():
    return {"message": "Welcome to Learnify API"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
