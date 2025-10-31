# Setup Guide

## Local Development

### 1. Prerequisites
- Python 3.9 or higher
- MongoDB running on localhost:27017
- Poetry (install with: `pip install poetry`)

### 2. Install Dependencies
```bash
poetry install
```

### 3. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` if needed (defaults work for local MongoDB):
```
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=learnify
JWT_SECRET_KEY=dev-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
```

### 4. Start MongoDB
```bash
# If MongoDB is installed locally
mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

### 5. Run Server
```bash
python main.py
```

Server will be available at `http://localhost:8000`

View API docs at `http://localhost:8000/docs`

---

## Docker Development

### 1. Build and Start
```bash
docker-compose up
```

This automatically:
- Starts MongoDB with default credentials
- Starts FastAPI backend
- Creates network for services to communicate

### 2. Access Services
- **API:** `http://localhost:8000`
- **API Docs:** `http://localhost:8000/docs`
- **MongoDB:** `localhost:27017`

### 3. Stop Services
```bash
docker-compose down
```

### 4. View Logs
```bash
docker-compose logs -f backend
```

---

## Project Structure

```
backend/
├── config/              # Configuration modules
│   ├── database.py      # MongoDB connection
│   └── security.py      # JWT and password utilities
├── models/              # Data models
│   └── user.py          # User schema
├── services/            # Business logic
│   └── auth_service.py  # Authentication service
├── controllers/         # API routes
│   └── auth.py          # Auth endpoints
├── main.py              # FastAPI app entry point
├── pyproject.toml       # Poetry dependencies
├── Dockerfile           # Docker image
├── docker-compose.yml   # Docker services
└── documentation/       # API docs
```

---

## Common Commands

### Poetry Commands
```bash
# Install all dependencies
poetry install

# Add new package
poetry add package-name

# Update dependencies
poetry update

# Run shell with virtual env
poetry shell
```

### MongoDB Commands
```bash
# Check if connected
mongosh

# List databases
show databases

# Select database
use learnify

# View users collection
db.users.find()

# Delete all users
db.users.deleteMany({})
```

---

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `brew services start mongodb-community` (macOS)
- Check `MONGODB_URL` in `.env`
- Verify port 27017 is accessible

### Import Errors
- Run `poetry install` to install missing packages
- Ensure `.env` file exists

### Port Already in Use
- Change port in `main.py` (default: 8000)
- Or kill process: `lsof -ti:8000 | xargs kill -9`

### Token Validation Fails
- Ensure `JWT_SECRET_KEY` matches between requests
- Token expires after 24 hours by default
- Check token format: `Authorization: Bearer <token>`

---

## Next Steps

1. Read [API.md](./API.md) for endpoint documentation
2. Test endpoints with `/docs` swagger UI
3. Add new routes in `controllers/`
4. Add new services in `services/`
5. Create new data models in `models/`
