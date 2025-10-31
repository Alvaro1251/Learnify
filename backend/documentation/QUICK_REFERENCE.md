# Quick Reference

## Start Server

```bash
python main.py
```

Access at: `http://localhost:8000`

---

## Register & Login Flow

### 1. Register
```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'
```

Response:
```json
{"access_token":"eyJ...","token_type":"bearer"}
```

### 2. Login
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'
```

Response:
```json
{"access_token":"eyJ...","token_type":"bearer"}
```

### 3. Use Token
```bash
curl -X GET "http://localhost:8000/auth/me" \
  -H "Authorization: Bearer eyJ..."
```

Response:
```json
{
  "email":"user@example.com",
  "id":"507f...",
  "is_active":true,
  "created_at":"2024-10-27T21:30:00"
}
```

---

## All Endpoints

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| GET | `/` | No | API status |
| GET | `/health` | No | Health check |
| POST | `/auth/register` | No | Create new user |
| POST | `/auth/login` | No | Login user |
| GET | `/auth/me` | Yes | Get current user |

---

## Request/Response Format

### Register Request
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Login Request
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Token Response
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### User Response
```json
{
  "email": "user@example.com",
  "id": "507f1f77bcf86cd799439011",
  "is_active": true,
  "created_at": "2024-10-27T21:30:00"
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (invalid data) |
| 401 | Unauthorized (invalid token/credentials) |
| 403 | Forbidden (user not found) |
| 500 | Server error |

---

## Error Examples

### Invalid Email
```json
{
  "detail": "value is not a valid email address"
}
```

### Email Already Registered
```json
{
  "detail": "Email already registered"
}
```

### Invalid Credentials
```json
{
  "detail": "Invalid email or password"
}
```

### Invalid Token
```json
{
  "detail": "Invalid authentication credentials"
}
```

---

## Environment Variables

```
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=learnify
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
```

---

## Docker Quick Start

```bash
# Start everything
docker-compose up

# Stop everything
docker-compose down

# View logs
docker-compose logs -f
```

---

## Test in Browser

Visit `http://localhost:8000/docs` for interactive Swagger UI

- Try endpoints directly
- See request/response examples
- Check authentication

---

## Common Tasks

### Change JWT Expiration
Edit `.env`:
```
JWT_EXPIRATION_HOURS=48
```

### Use Different MongoDB
Edit `.env`:
```
MONGODB_URL=mongodb://username:password@host:27017/database
```

### Reset All Users
```bash
# MongoDB shell
mongosh
use learnify
db.users.deleteMany({})
```
