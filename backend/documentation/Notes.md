# Notes API Documentation

## Create Note

**Endpoint:** `POST /notes/create`

**Auth Required:** Yes (Bearer Token)

**Request:**
```json
{
  "title": "Python Basics",
  "description": "Introduction to Python programming",
  "subject": "Programming",
  "university": "MIT",
  "career": "Computer Science",
  "tags": ["python", "programming", "beginner"],
  "file_url": "https://example.com/file.pdf"
}
```

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "Python Basics",
  "description": "Introduction to Python programming",
  "subject": "Programming",
  "university": "MIT",
  "career": "Computer Science",
  "tags": ["python", "programming", "beginner"],
  "file_url": "https://example.com/file.pdf",
  "owner": "John Doe",
  "created_at": "2024-10-27T21:30:00",
  "updated_at": "2024-10-27T21:30:00"
}
```

**Field Notes:**
- `owner` now returns the note creator's display name (first + last) instead of their raw identifier.

**Errors:**
- 401: Unauthorized (no token or invalid token)
- 400: Invalid request data
- 500: Server error

---

## Get Note by ID

**Endpoint:** `GET /notes/{note_id}`

**Auth Required:** No

**Parameters:**
- `note_id` (path) - MongoDB ObjectId of the note

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "Python Basics",
  "description": "Introduction to Python programming",
  "subject": "Programming",
  "university": "MIT",
  "career": "Computer Science",
  "tags": ["python", "programming", "beginner"],
  "file_url": "https://example.com/file.pdf",
  "owner": "John Doe",
  "created_at": "2024-10-27T21:30:00",
  "updated_at": "2024-10-27T21:30:00"
}
```

**Errors:**
- 404: Note not found

---

## Search Notes with Filters

**Endpoint:** `GET /notes/?university=MIT&career=CS&subject=Programming&tags=python`

**Auth Required:** No

**Query Parameters (all optional):**
- `university` - Filter by university (case-insensitive)
- `career` - Filter by career (case-insensitive)
- `subject` - Filter by subject (case-insensitive)
- `tags` - Filter by tags (can pass multiple times)

**Examples:**
```
GET /notes/?university=MIT
GET /notes/?career=Computer%20Science
GET /notes/?subject=Programming&tags=python&tags=beginner
GET /notes/?university=MIT&career=CS&subject=Math
```

**Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "Python Basics",
    "description": "Introduction to Python programming",
    "subject": "Programming",
    "university": "MIT",
    "career": "Computer Science",
    "tags": ["python", "programming", "beginner"],
    "file_url": "https://example.com/file.pdf",
    "owner": "John Doe",
    "created_at": "2024-10-27T21:30:00",
    "updated_at": "2024-10-27T21:30:00"
  }
]
```

---

## Get Latest 3 Notes

**Endpoint:** `GET /notes/latest/notes`

**Auth Required:** No

**Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "Python Basics",
    "description": "Introduction to Python programming",
    "subject": "Programming",
    "university": "MIT",
    "career": "Computer Science",
    "tags": ["python", "programming", "beginner"],
    "file_url": "https://example.com/file.pdf",
    "owner": "Alex Smith",
    "created_at": "2024-10-27T21:30:00",
    "updated_at": "2024-10-27T21:30:00"
  },
  {
    "id": "507f1f77bcf86cd799439012",
    "title": "JavaScript Tips",
    "description": "Useful JavaScript tips",
    "subject": "Programming",
    "university": "Stanford",
    "career": "Web Development",
    "tags": ["javascript", "web"],
    "file_url": "https://example.com/file2.pdf",
    "owner": "Maria Johnson",
    "created_at": "2024-10-27T20:15:00",
    "updated_at": "2024-10-27T20:15:00"
  },
  {
    "id": "507f1f77bcf86cd799439013",
    "title": "Database Design",
    "description": "Intro to databases",
    "subject": "Databases",
    "university": "Harvard",
    "career": "Data Science",
    "tags": ["database", "sql"],
    "file_url": "https://example.com/file3.pdf",
    "owner": "user_id_here",
    "created_at": "2024-10-27T19:00:00",
    "updated_at": "2024-10-27T19:00:00"
  }
]
```

---

## Get My Notes

**Endpoint:** `GET /notes/my/notes`

**Auth Required:** Yes (Bearer Token)

**Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "Python Basics",
    "description": "Introduction to Python programming",
    "subject": "Programming",
    "university": "MIT",
    "career": "Computer Science",
    "tags": ["python", "programming", "beginner"],
    "file_url": "https://example.com/file.pdf",
    "owner": "Current User Name",
    "created_at": "2024-10-27T21:30:00",
    "updated_at": "2024-10-27T21:30:00"
  }
]
```

**Errors:**
- 401: Unauthorized (no token or invalid token)

---

## Delete Note

**Endpoint:** `DELETE /notes/{note_id}`

**Auth Required:** Yes (Bearer Token)

**Parameters:**
- `note_id` (path) - MongoDB ObjectId of the note

**Response (200):**
```json
{
  "message": "Note deleted"
}
```

**Errors:**
- 401: Unauthorized (no token or invalid token)
- 404: Note not found or not authorized (not the owner)

---

## cURL Examples

### Create Note
```bash
curl -X POST "http://localhost:8000/notes/create" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Python Basics",
    "description": "Introduction to Python programming",
    "subject": "Programming",
    "university": "MIT",
    "career": "Computer Science",
    "tags": ["python", "programming"],
    "file_url": "https://example.com/file.pdf"
  }'
```

### Get Note by ID
```bash
curl -X GET "http://localhost:8000/notes/507f1f77bcf86cd799439011"
```

### Search Notes
```bash
curl -X GET "http://localhost:8000/notes/?university=MIT&subject=Programming"
```

### Get Latest Notes
```bash
curl -X GET "http://localhost:8000/notes/latest/notes"
```

### Get My Notes
```bash
curl -X GET "http://localhost:8000/notes/my/notes" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Delete Note
```bash
curl -X DELETE "http://localhost:8000/notes/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Python Examples

```python
import requests

BASE_URL = "http://localhost:8000"
TOKEN = "your_access_token_here"

headers = {"Authorization": f"Bearer {TOKEN}"}

# Create note
response = requests.post(
    f"{BASE_URL}/notes/create",
    headers=headers,
    json={
        "title": "Python Basics",
        "description": "Introduction to Python",
        "subject": "Programming",
        "university": "MIT",
        "career": "Computer Science",
        "tags": ["python", "programming"],
        "file_url": "https://example.com/file.pdf"
    }
)
note = response.json()
note_id = note["id"]

# Get note
response = requests.get(f"{BASE_URL}/notes/{note_id}")
note = response.json()

# Search notes
response = requests.get(
    f"{BASE_URL}/notes/",
    params={
        "university": "MIT",
        "subject": "Programming",
        "tags": ["python"]
    }
)
notes = response.json()

# Get latest notes
response = requests.get(f"{BASE_URL}/notes/latest/notes")
latest_notes = response.json()

# Get my notes
response = requests.get(f"{BASE_URL}/notes/my/notes", headers=headers)
my_notes = response.json()

# Delete note
response = requests.delete(f"{BASE_URL}/notes/{note_id}", headers=headers)
```

---

## Filter Examples

**By University:**
```
GET /notes/?university=MIT
```

**By Career:**
```
GET /notes/?career=Computer%20Science
```

**By Subject:**
```
GET /notes/?subject=Programming
```

**By Single Tag:**
```
GET /notes/?tags=python
```

**By Multiple Tags:**
```
GET /notes/?tags=python&tags=beginner
```

**Combined Filters:**
```
GET /notes/?university=MIT&career=Computer%20Science&subject=Programming&tags=python
```

---

## Note Attributes

- **id** - MongoDB ObjectId (auto-generated)
- **title** - String (required, max 255 chars)
- **description** - String (required)
- **subject** - String (required)
- **university** - String (required)
- **career** - String (required)
- **tags** - Array of strings (optional)
- **file_url** - String (optional, external file link)
- **owner** - User ObjectId (auto-set to current user)
- **created_at** - Timestamp (auto-generated)
- **updated_at** - Timestamp (auto-generated)
