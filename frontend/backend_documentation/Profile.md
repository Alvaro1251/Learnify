# Profile API Documentation

## Get My Profile

**Endpoint:** `GET /profile/me`

**Auth Required:** Yes (Bearer Token)

**Response (200):**
```json
{
  "email": "user@example.com",
  "id": "507f1f77bcf86cd799439011",
  "full_name": "John",
  "last_name": "Doe",
  "career": "Computer Science",
  "university": "MIT",
  "birth_date": "1998-05-15T00:00:00",
  "is_active": true,
  "created_at": "2024-10-27T21:30:00"
}
```

**Errors:**
- 401: Unauthorized (no token or invalid token)

---

## Update Profile

**Endpoint:** `PUT /profile/update`

**Auth Required:** Yes (Bearer Token)

**Request:**
```json
{
  "full_name": "John",
  "last_name": "Doe",
  "career": "Computer Science",
  "university": "MIT",
  "birth_date": "1998-05-15T00:00:00"
}
```

**Request (Partial Update):**
```json
{
  "full_name": "Jonathan",
  "career": "Software Engineering"
}
```

**Response (200):**
```json
{
  "email": "user@example.com",
  "id": "507f1f77bcf86cd799439011",
  "full_name": "Jonathan",
  "last_name": "Doe",
  "career": "Software Engineering",
  "university": "MIT",
  "birth_date": "1998-05-15T00:00:00",
  "is_active": true,
  "created_at": "2024-10-27T21:30:00"
}
```

**Errors:**
- 401: Unauthorized (no token or invalid token)
- 404: User not found
- 500: Server error

---

## Profile Fields

All profile fields are optional and can be updated individually or together:

- **full_name** - User's first name
- **last_name** - User's last name
- **career** - User's career or major
- **university** - User's university or institution
- **birth_date** - User's birth date (ISO 8601 format)

---

## cURL Examples

### Get Profile
```bash
curl -X GET "http://localhost:8000/profile/me" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Full Profile
```bash
curl -X PUT "http://localhost:8000/profile/update" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John",
    "last_name": "Doe",
    "career": "Computer Science",
    "university": "MIT",
    "birth_date": "1998-05-15T00:00:00"
  }'
```

### Update Single Field
```bash
curl -X PUT "http://localhost:8000/profile/update" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Jonathan"
  }'
```

### Update Multiple Fields
```bash
curl -X PUT "http://localhost:8000/profile/update" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "career": "Data Science",
    "university": "Stanford"
  }'
```

---

## Python Examples

```python
import requests
from datetime import datetime

BASE_URL = "http://localhost:8000"
TOKEN = "your_access_token_here"

headers = {"Authorization": f"Bearer {TOKEN}"}

# Get profile
response = requests.get(f"{BASE_URL}/profile/me", headers=headers)
profile = response.json()
print(profile)

# Update full profile
response = requests.put(
    f"{BASE_URL}/profile/update",
    headers=headers,
    json={
        "full_name": "John",
        "last_name": "Doe",
        "career": "Computer Science",
        "university": "MIT",
        "birth_date": "1998-05-15T00:00:00"
    }
)
updated_profile = response.json()

# Update single field
response = requests.put(
    f"{BASE_URL}/profile/update",
    headers=headers,
    json={"full_name": "Jonathan"}
)
updated_profile = response.json()

# Update multiple fields
response = requests.put(
    f"{BASE_URL}/profile/update",
    headers=headers,
    json={
        "career": "Data Science",
        "university": "Stanford"
    }
)
updated_profile = response.json()
```

---

## Profile Information in Other Endpoints

When retrieving user information through other endpoints, the profile data is included:

**GET /auth/me**
```json
{
  "email": "user@example.com",
  "id": "507f1f77bcf86cd799439011",
  "full_name": "John",
  "last_name": "Doe",
  "career": "Computer Science",
  "university": "MIT",
  "birth_date": "1998-05-15T00:00:00",
  "is_active": true,
  "created_at": "2024-10-27T21:30:00"
}
```

**GET /notes/{note_id}**
```json
{
  "id": "note_id",
  "title": "Python Notes",
  "description": "Advanced Python concepts",
  "subject": "Programming",
  "university": "MIT",
  "career": "Computer Science",
  "tags": ["python"],
  "file_url": "https://example.com/file.pdf",
  "owner": "507f1f77bcf86cd799439011",
  "created_at": "2024-10-27T21:30:00",
  "updated_at": "2024-10-27T21:30:00"
}
```

Note: The `owner` field contains the user ID. To get full user profile information, you can make a separate request to `/profile/me` with proper authorization.

---

## Date Format

Birth date should be provided in ISO 8601 format:
- `YYYY-MM-DDTHH:MM:SS` (e.g., `1998-05-15T00:00:00`)
- `YYYY-MM-DD` (e.g., `1998-05-15`)

---

## Notes

- All profile fields are optional
- You can update any combination of fields
- Fields not included in the request will remain unchanged
- Empty strings or null values in the request will keep existing values
- Profile is automatically created with null values when user registers
