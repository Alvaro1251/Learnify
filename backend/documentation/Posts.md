# Posts API Documentation

## Create Post

**Endpoint:** `POST /posts/create`

**Auth Required:** Yes (Bearer Token)

**Request:**
```json
{
  "title": "How to learn Python?",
  "description": "I'm struggling with Python basics, any tips?",
  "subject": "Programming"
}
```

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "How to learn Python?",
  "description": "I'm struggling with Python basics, any tips?",
  "subject": "Programming",
  "owner": "John Doe",
  "creation_date": "2024-10-27T21:30:00",
  "responses": []
}
```

**Errors:**
- 401: Unauthorized (no token or invalid token)
- 400: Invalid request data
- 500: Server error

---

## Get Latest Posts

**Endpoint:** `GET /posts/latest?limit=10`

**Auth Required:** No

**Query Parameters:**
- `limit` (optional) - Number of posts to retrieve (default: 10, max: 100)

**Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "How to learn Python?",
    "description": "I'm struggling with Python basics, any tips?",
    "subject": "Programming",
    "owner": "John Doe",
    "creation_date": "2024-10-27T21:30:00",
    "responses_count": 2
  },
  {
    "id": "507f1f77bcf86cd799439012",
    "title": "Best IDE for JavaScript",
    "description": "What's the best IDE for JS development?",
    "subject": "Programming",
    "owner": "Jane Smith",
    "creation_date": "2024-10-27T20:15:00",
    "responses_count": 5
  }
]
```

---

## Get Post Details

**Endpoint:** `GET /posts/{post_id}`

**Auth Required:** No

**Parameters:**
- `post_id` (path) - MongoDB ObjectId of the post

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "How to learn Python?",
  "description": "I'm struggling with Python basics, any tips?",
  "subject": "Programming",
  "owner": "John Doe",
  "creation_date": "2024-10-27T21:30:00",
  "responses": [
    {
      "owner": "Jane Smith",
      "content": "Try starting with codecademy or freeCodeCamp",
      "creation_date": "2024-10-27T21:45:00"
    },
    {
      "owner": "Mike Johnson",
      "content": "Practice on LeetCode, it helps a lot!",
      "creation_date": "2024-10-27T22:10:00"
    }
  ]
}
```

**Errors:**
- 404: Post not found

---

## Add Response to Post

**Endpoint:** `POST /posts/{post_id}/response`

**Auth Required:** Yes (Bearer Token)

**Parameters:**
- `post_id` (path) - MongoDB ObjectId of the post

**Request:**
```json
{
  "content": "I recommend starting with tutorials on YouTube!"
}
```

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "How to learn Python?",
  "description": "I'm struggling with Python basics, any tips?",
  "subject": "Programming",
  "owner": "John Doe",
  "creation_date": "2024-10-27T21:30:00",
  "responses": [
    {
      "owner": "Jane Smith",
      "content": "Try starting with codecademy or freeCodeCamp",
      "creation_date": "2024-10-27T21:45:00"
    },
    {
      "owner": "Mike Johnson",
      "content": "Practice on LeetCode, it helps a lot!",
      "creation_date": "2024-10-27T22:10:00"
    },
    {
      "owner": "Sarah Williams",
      "content": "I recommend starting with tutorials on YouTube!",
      "creation_date": "2024-10-27T22:30:00"
    }
  ]
}
```

**Errors:**
- 401: Unauthorized (no token or invalid token)
- 404: Post not found

---

## Get My Posts

**Endpoint:** `GET /posts/my/posts`

**Auth Required:** Yes (Bearer Token)

**Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "How to learn Python?",
    "description": "I'm struggling with Python basics, any tips?",
    "subject": "Programming",
    "owner": "John Doe",
    "creation_date": "2024-10-27T21:30:00",
    "responses": [
      {
        "owner": "Jane Smith",
        "content": "Try starting with codecademy or freeCodeCamp",
        "creation_date": "2024-10-27T21:45:00"
      }
    ]
  }
]
```

**Errors:**
- 401: Unauthorized (no token or invalid token)

---

## Delete Post

**Endpoint:** `DELETE /posts/{post_id}`

**Auth Required:** Yes (Bearer Token)

**Parameters:**
- `post_id` (path) - MongoDB ObjectId of the post

**Response (200):**
```json
{
  "message": "Post deleted"
}
```

**Errors:**
- 401: Unauthorized (no token or invalid token)
- 404: Post not found or not authorized (not the owner)

---

## cURL Examples

### Create Post
```bash
curl -X POST "http://localhost:8000/posts/create" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "How to learn Python?",
    "description": "I am struggling with Python basics, any tips?",
    "subject": "Programming"
  }'
```

### Get Latest Posts
```bash
curl -X GET "http://localhost:8000/posts/latest?limit=5"
```

### Get Post Details
```bash
curl -X GET "http://localhost:8000/posts/507f1f77bcf86cd799439011"
```

### Add Response
```bash
curl -X POST "http://localhost:8000/posts/507f1f77bcf86cd799439011/response" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Great tip! I will try that!"
  }'
```

### Get My Posts
```bash
curl -X GET "http://localhost:8000/posts/my/posts" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Delete Post
```bash
curl -X DELETE "http://localhost:8000/posts/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Python Examples

```python
import requests

BASE_URL = "http://localhost:8000"
TOKEN = "your_access_token_here"

headers = {"Authorization": f"Bearer {TOKEN}"}

# Create post
response = requests.post(
    f"{BASE_URL}/posts/create",
    headers=headers,
    json={
        "title": "How to learn Python?",
        "description": "I am struggling with Python basics",
        "subject": "Programming"
    }
)
post = response.json()
post_id = post["id"]

# Get latest posts
response = requests.get(f"{BASE_URL}/posts/latest?limit=10")
posts = response.json()

# Get post details
response = requests.get(f"{BASE_URL}/posts/{post_id}")
post_detail = response.json()

# Add response to post
response = requests.post(
    f"{BASE_URL}/posts/{post_id}/response",
    headers=headers,
    json={"content": "Great question!"}
)
updated_post = response.json()

# Get my posts
response = requests.get(f"{BASE_URL}/posts/my/posts", headers=headers)
my_posts = response.json()

# Delete post
response = requests.delete(f"{BASE_URL}/posts/{post_id}", headers=headers)
```

---

## Post Attributes

**Post:**
- **id** - MongoDB ObjectId (auto-generated, returned as string)
- **title** - String (required, max 255 chars)
- **description** - String (required)
- **subject** - String (required)
- **owner** - User's full name (string) - Stored as ObjectId in MongoDB, returned as concatenated first and last name
- **creation_date** - Timestamp (auto-generated)
- **responses** - Array of Response objects (auto-initialized to empty)

**Response (inside Post):**
- **owner** - User's full name (string) - Stored as ObjectId in MongoDB, returned as concatenated first and last name
- **content** - String (required, non-empty)
- **creation_date** - Timestamp (auto-generated)

---

## Response Count vs Full Responses

- **GET /posts/latest** returns posts with `responses_count` (number only, not full responses)
- **GET /posts/{post_id}** returns post with full `responses` array
- This keeps the latest posts list lightweight

---

## Database Design & Optimization

### ObjectId References
- **Owner Field:** Stored as MongoDB ObjectId in the database, creating a proper 1-to-1 relationship with the User collection
- **Response Owner Field:** Each response owner is also stored as ObjectId, creating a proper 1-to-many relationship with Users
- **Benefits:** Maintains referential integrity, enables efficient queries, and prevents data duplication

### Data Enrichment via Aggregation
The API uses MongoDB aggregation pipelines with `$lookup` operations to:
1. Join post owner information from the users collection
2. Return the user's full name (concatenated first_name + last_name) instead of just the ID
3. Perform the same enrichment for each response's owner
4. Efficiently retrieve related data in a single query

### Example - How Owner Data is Returned
**Stored in MongoDB:**
```json
{
  "_id": ObjectId("690228a4bc6bc5cefac269be"),
  "owner": ObjectId("690220c71f33b58f33665c36"),
  "responses": [
    {
      "owner": ObjectId("690220c71f33b58f33665c36")
    }
  ]
}
```

**Returned to API Client:**
```json
{
  "id": "690228a4bc6bc5cefac269be",
  "owner": "John Doe",
  "responses": [
    {
      "owner": "John Doe"
    }
  ]
}
```

This design ensures:
- ✅ Data integrity through ObjectId references
- ✅ Readable user names in API responses
- ✅ Efficient database queries with proper indexing
- ✅ No data duplication or inconsistency
