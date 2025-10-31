# Learnify API Documentation

## Setup

### Prerequisites
- Python 3.9+
- MongoDB running on localhost:27017
- Poetry

### Installation

1. Install dependencies:
```bash
poetry install
```

2. Create `.env` file from example:
```bash
cp .env.example .env
```

3. Update `.env` with your settings (optional for local development):
```
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=learnify
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
```

### Running the Server

```bash
python main.py
```

Server runs on `http://localhost:8000`

API Documentation available at `http://localhost:8000/docs`

---

## Authentication Endpoints

### Register User

**Endpoint:** `POST /auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Errors:**
- 400: Email already registered
- 400: Invalid email format
- 400: Password too short (minimum 6 characters)

---

### Login User

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Errors:**
- 401: Invalid email or password

---

### Get Current User

**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "email": "user@example.com",
  "id": "507f1f77bcf86cd799439011",
  "is_active": true,
  "created_at": "2024-10-27T21:30:00"
}
```

**Errors:**
- 401: Invalid or expired token
- 403: User not found

---

## Usage Examples

### Using cURL

**Register:**
```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Get User (replace TOKEN with actual token):**
```bash
curl -X GET "http://localhost:8000/auth/me" \
  -H "Authorization: Bearer TOKEN"
```

### Using Python requests

```python
import requests

BASE_URL = "http://localhost:8000"

# Register
response = requests.post(
    f"{BASE_URL}/auth/register",
    json={"email": "user@example.com", "password": "password123"}
)
token = response.json()["access_token"]

# Login
response = requests.post(
    f"{BASE_URL}/auth/login",
    json={"email": "user@example.com", "password": "password123"}
)
token = response.json()["access_token"]

# Get current user
response = requests.get(
    f"{BASE_URL}/auth/me",
    headers={"Authorization": f"Bearer {token}"}
)
user = response.json()
print(user)
```

---

## Health Check

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy"
}
```

---

## Database

### MongoDB Collections

**users**
- `_id` - ObjectId (auto-generated)
- `email` - String (unique)
- `hashed_password` - String (bcrypt hash)
- `is_active` - Boolean
- `created_at` - DateTime

---

## Docker

### Run with Docker Compose

```bash
docker-compose up
```

This starts:
- MongoDB on port 27017
- FastAPI backend on port 8000

Access API at `http://localhost:8000`

### Stop services

```bash
docker-compose down
```

---

## Notes

- Passwords are hashed with bcrypt
- Tokens expire after 24 hours (configurable in `.env`)
- All endpoints require valid requests
- CORS is enabled for all origins (change in production)
