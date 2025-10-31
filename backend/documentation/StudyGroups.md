# Study Groups API Documentation

## Quick Start Guide

### Get Your Study Groups

To retrieve all study groups that you are a member of:

**Request:**
```bash
curl -X GET "http://localhost:8000/study-groups/my/groups" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "Advanced Python 2024",
    "description": "Study group for advanced Python concepts",
    "owner": "John Doe",
    "members": ["John Doe", "Jane Smith"],
    "member_ids": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
    "pending_requests": [],
    "pending_request_ids": [],
    "members_count": 2,
    "files_count": 5,
    "messages_count": 42
  }
]
```

**When to Use:**
- Load user's study groups on app startup
- Refresh study group list
- Show dashboard with user's groups
- Display member names in the UI while using member_ids for backend operations

---

### Common Study Group Actions

1. **View your study groups** → `GET /study-groups/my/groups`
2. **Join a public group** → `POST /study-groups/{group_id}/join`
3. **Chat in real-time** → `WS /study-groups/ws/{group_id}`
4. **Share study materials** → `POST /study-groups/{group_id}/share-file`
5. **Leave a group** → `POST /study-groups/{group_id}/leave`

---

## Create Study Group

**Endpoint:** `POST /study-groups/create`

**Auth Required:** Yes (Bearer Token)

**Request:**
```json
{
  "name": "Advanced Python 2024",
  "description": "Study group for advanced Python concepts and exam prep",
  "is_public": true,
  "exam_date": "2024-12-15T10:00:00"
}
```

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Advanced Python 2024",
  "description": "Study group for advanced Python concepts and exam prep",
  "owner": "John Doe",
  "members": ["John Doe"],
  "member_ids": ["507f1f77bcf86cd799439011"],
  "pending_requests": [],
  "pending_request_ids": [],
  "files": [],
  "chat": [],
  "is_public": true,
  "exam_date": "2024-12-15T10:00:00",
  "created_at": "2024-10-27T21:30:00"
}
```

**Errors:**
- 401: Unauthorized (no token or invalid token)
- 400: Invalid request data
- 500: Server error

---

## Get Public Study Groups

**Endpoint:** `GET /study-groups/public`

**Auth Required:** No

**Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "Advanced Python 2024",
    "description": "Study group for advanced Python concepts",
    "owner": "John Doe",
    "members": ["John Doe", "Jane Smith", "Mike Johnson"],
    "member_ids": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
    "pending_requests": [],
    "pending_request_ids": [],
    "is_public": true,
    "exam_date": "2024-12-15T10:00:00",
    "created_at": "2024-10-27T21:30:00",
    "members_count": 3,
    "files_count": 5,
    "messages_count": 42
  }
]
```

---

## Get My Study Groups

**Endpoint:** `GET /study-groups/my/groups`

**Auth Required:** Yes (Bearer Token)

**Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "Advanced Python 2024",
    "description": "Study group for advanced Python concepts",
    "owner": "John Doe",
    "members": ["John Doe", "Jane Smith", "Mike Johnson"],
    "member_ids": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
    "pending_requests": [],
    "pending_request_ids": [],
    "is_public": true,
    "exam_date": "2024-12-15T10:00:00",
    "created_at": "2024-10-27T21:30:00",
    "members_count": 3,
    "files_count": 5,
    "messages_count": 42
  }
]
```

**Errors:**
- 401: Unauthorized (no token or invalid token)

---

## Get Study Group Details

**Endpoint:** `GET /study-groups/{group_id}`

**Auth Required:** No

**Parameters:**
- `group_id` (path) - MongoDB ObjectId of the study group

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Advanced Python 2024",
  "description": "Study group for advanced Python concepts and exam prep",
  "owner": "John Doe",
  "members": ["John Doe", "Jane Smith", "Mike Johnson"],
  "member_ids": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
  "pending_requests": ["Sarah Williams"],
  "pending_request_ids": ["507f1f77bcf86cd799439014"],
  "files": [
    {
      "file_id": "file_1",
      "uploaded_by": "Jane Smith",
      "file_url": "https://example.com/notes.pdf",
      "uploaded_at": "2024-10-27T20:00:00"
    }
  ],
  "chat": [
    {
      "sender": "Jane Smith",
      "content": "Anyone want to meet tomorrow?",
      "timestamp": "2024-10-27T21:00:00"
    },
    {
      "sender": "Mike Johnson",
      "content": "Yes! What time?",
      "timestamp": "2024-10-27T21:05:00"
    }
  ],
  "is_public": true,
  "exam_date": "2024-12-15T10:00:00",
  "created_at": "2024-10-27T21:30:00"
}
```

**Errors:**
- 404: Study group not found

---

## Join Study Group

**Endpoint:** `POST /study-groups/{group_id}/join`

**Auth Required:** Yes (Bearer Token)

**Parameters:**
- `group_id` (path) - MongoDB ObjectId of the study group

**Response (200) - Public Group:**
```json
{
  "message": "Successfully joined the group"
}
```

**Response (200) - Private Group:**
```json
{
  "message": "Join request sent. Waiting for owner approval."
}
```

**Errors:**
- 401: Unauthorized (no token or invalid token)
- 404: Study group not found

---

## Accept Join Request

**Endpoint:** `POST /study-groups/{group_id}/accept-request/{user_id}`

**Auth Required:** Yes (Bearer Token - must be group owner)

**Parameters:**
- `group_id` (path) - MongoDB ObjectId of the study group
- `user_id` (path) - User ID to accept

**Response (200):**
```json
{
  "message": "Join request accepted"
}
```

**Errors:**
- 401: Unauthorized (no token or invalid token)
- 403: Not authorized (not the group owner)
- 404: Request not found

---

## Leave Study Group

**Endpoint:** `POST /study-groups/{group_id}/leave`

**Auth Required:** Yes (Bearer Token)

**Parameters:**
- `group_id` (path) - MongoDB ObjectId of the study group

**Response (200):**
```json
{
  "message": "Successfully left the group"
}
```

**Errors:**
- 401: Unauthorized (no token or invalid token)
- 404: Study group not found

---

## Share File

**Endpoint:** `POST /study-groups/{group_id}/share-file`

**Auth Required:** Yes (Bearer Token - must be member)

**Parameters:**
- `group_id` (path) - MongoDB ObjectId of the study group

**Request:**
```json
{
  "file_url": "https://example.com/study_notes.pdf"
}
```

**Response (200):**
```json
{
  "message": "File shared successfully",
  "group": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Advanced Python 2024",
    "description": "Study group for advanced Python concepts and exam prep",
    "owner": "John Doe",
    "members": ["John Doe", "Jane Smith"],
    "member_ids": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
    "pending_requests": [],
    "pending_request_ids": [],
    "files": [
      {
        "file_id": "file_1",
        "uploaded_by": "John Doe",
        "file_url": "https://example.com/study_notes.pdf",
        "uploaded_at": "2024-10-27T21:45:00"
      }
    ],
    "chat": [],
    "is_public": true,
    "exam_date": "2024-12-15T10:00:00",
    "created_at": "2024-10-27T21:30:00"
  }
}
```

**Errors:**
- 401: Unauthorized (no token or invalid token)
- 404: Study group not found or not a member

---

## Get Chat Messages

**Endpoint:** `GET /study-groups/{group_id}/messages?limit=50`

**Auth Required:** No

**Query Parameters:**
- `limit` (optional) - Number of messages to retrieve (default: 50)

**Parameters:**
- `group_id` (path) - MongoDB ObjectId of the study group

**Response (200):**
```json
{
  "messages": [
    {
      "sender": "user_id_1",
      "content": "What's the homework for next week?",
      "timestamp": "2024-10-27T21:00:00"
    },
    {
      "sender": "user_id_2",
      "content": "Chapter 5 and 6 exercises",
      "timestamp": "2024-10-27T21:05:00"
    }
  ]
}
```

---

## WebSocket Real-Time Chat

**Endpoint:** `WS /study-groups/ws/{group_id}`

**Auth Required:** No (connection-based, but sender_id must be a valid user)

**Connection:**
```javascript
const groupId = '507f1f77bcf86cd799439011';
const userId = 'your_user_id_here';
const ws = new WebSocket(`ws://localhost:8000/study-groups/ws/${groupId}`);

ws.onopen = () => {
  console.log('Connected to study group chat');
  // Send initial message
  ws.send(JSON.stringify({
    sender_id: userId,
    content: 'Hello everyone!'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(`${message.sender_name} (${message.sender_id}): ${message.content} (${message.timestamp})`);
  // Update UI with new message
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from group chat');
};
```

**Sending Messages:**
```json
{
  "sender_id": "user_id_here",
  "content": "Hello everyone!"
}
```

**Receiving Messages (Broadcast):**
```json
{
  "type": "message",
  "sender_id": "user_id_here",
  "sender": "John Doe",
  "sender_name": "John Doe",
  "content": "Hello everyone!",
  "timestamp": "2024-10-27T21:30:00"
}
```

**Chat Features:**
- **Real-time Broadcasting:** When any member sends a message, all connected members receive it instantly
- **Message Persistence:** All messages are automatically saved to the database
- **Automatic Cleanup:** Connections are properly cleaned up when a user disconnects
- **Multiple Connections:** Multiple users can connect to the same group and chat simultaneously
- **Message History:** Use `GET /study-groups/{group_id}/messages` to retrieve message history

**Chat Workflow:**
1. User joins a study group using `POST /study-groups/{group_id}/join`
2. User opens WebSocket connection to `WS /study-groups/ws/{group_id}`
3. User sends messages with their `sender_id` and message content
4. All connected members receive the message in real-time
5. Message is persisted to database automatically
6. User can retrieve message history using the REST endpoint

---

## cURL Examples

### Create Study Group
```bash
curl -X POST "http://localhost:8000/study-groups/create" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Advanced Python 2024",
    "description": "Study group for advanced Python concepts",
    "is_public": true,
    "exam_date": "2024-12-15T10:00:00"
  }'
```

### Get Public Study Groups
```bash
curl -X GET "http://localhost:8000/study-groups/public"
```

### Get My Study Groups
```bash
curl -X GET "http://localhost:8000/study-groups/my/groups" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Study Group Details
```bash
curl -X GET "http://localhost:8000/study-groups/507f1f77bcf86cd799439011"
```

### Join Study Group
```bash
curl -X POST "http://localhost:8000/study-groups/507f1f77bcf86cd799439011/join" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Accept Join Request
```bash
curl -X POST "http://localhost:8000/study-groups/507f1f77bcf86cd799439011/accept-request/user_id_here" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Leave Study Group
```bash
curl -X POST "http://localhost:8000/study-groups/507f1f77bcf86cd799439011/leave" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Share File
```bash
curl -X POST "http://localhost:8000/study-groups/507f1f77bcf86cd799439011/share-file" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "file_url": "https://example.com/notes.pdf"
  }'
```

### Get Messages
```bash
curl -X GET "http://localhost:8000/study-groups/507f1f77bcf86cd799439011/messages?limit=50"
```

---

## Python Examples

```python
import requests
import asyncio
import websockets
import json

BASE_URL = "http://localhost:8000"
TOKEN = "your_access_token_here"
WS_URL = "ws://localhost:8000"

headers = {"Authorization": f"Bearer {TOKEN}"}

# Create study group
response = requests.post(
    f"{BASE_URL}/study-groups/create",
    headers=headers,
    json={
        "name": "Advanced Python 2024",
        "description": "Study group for advanced Python concepts",
        "is_public": True,
        "exam_date": "2024-12-15T10:00:00"
    }
)
group = response.json()
group_id = group["id"]

# Get public study groups
response = requests.get(f"{BASE_URL}/study-groups/public")
public_groups = response.json()

# Get my study groups
response = requests.get(f"{BASE_URL}/study-groups/my/groups", headers=headers)
my_groups = response.json()

# Get group details
response = requests.get(f"{BASE_URL}/study-groups/{group_id}")
group_details = response.json()

# Join study group
response = requests.post(
    f"{BASE_URL}/study-groups/{group_id}/join",
    headers=headers
)

# Accept join request
response = requests.post(
    f"{BASE_URL}/study-groups/{group_id}/accept-request/user_id_here",
    headers=headers
)

# Leave study group
response = requests.post(
    f"{BASE_URL}/study-groups/{group_id}/leave",
    headers=headers
)

# Share file
response = requests.post(
    f"{BASE_URL}/study-groups/{group_id}/share-file",
    headers=headers,
    json={"file_url": "https://example.com/notes.pdf"}
)

# Get messages
response = requests.get(f"{BASE_URL}/study-groups/{group_id}/messages?limit=50")
messages = response.json()

# WebSocket chat
async def chat():
    uri = f"{WS_URL}/study-groups/ws/{group_id}"
    async with websockets.connect(uri) as websocket:
        # Send message
        await websocket.send(json.dumps({
            "sender_id": "your_user_id",
            "content": "Hello everyone!"
        }))

        # Receive messages
        async for message in websocket:
            print(json.loads(message))

# Run WebSocket chat
asyncio.run(chat())
```

---

## Study Group Attributes

**Study Group:**
- **id** - MongoDB ObjectId (auto-generated, returned as string)
- **name** - String (required, max 255 chars)
- **description** - String (required)
- **owner** - User's full name (string) - Stored as ObjectId in MongoDB, returned as concatenated first and last name in API responses
- **members** - Array of User full names (strings) - Stored as ObjectIds in MongoDB, returned as names (full_name + last_name) in API responses
- **member_ids** - Array of User IDs (strings) - Use these IDs for backend operations and API calls
- **pending_requests** - Array of User full names (strings) - Stored as ObjectIds in MongoDB, returned as names in API responses
- **pending_request_ids** - Array of User IDs (strings) - Use these IDs for backend operations and API calls
- **files** - Array of SharedFile objects
- **chat** - Array of ChatMessage objects
- **is_public** - Boolean (true = anyone can join, false = owner approval needed)
- **exam_date** - DateTime (exam date for this study group)
- **created_at** - Timestamp (auto-generated)

**Shared File:**
- **file_id** - String (auto-generated UUID)
- **uploaded_by** - User ID (string) - User who uploaded the file
- **file_url** - String (external file URL)
- **uploaded_at** - Timestamp (auto-generated)

**Chat Message:**
- **sender** - User ID (string) - User who sent the message
- **content** - String (required, non-empty)
- **timestamp** - Timestamp (auto-generated)

---

## Database Design & Optimization

### ObjectId References

- **Owner Field:** Stored as MongoDB ObjectId in the database, creating a proper 1-to-1 relationship with the User collection
- **Members Field:** Array of MongoDB ObjectIds in the database, creating a proper 1-to-many relationship with Users
- **Pending Requests Field:** Array of MongoDB ObjectIds in the database for users awaiting approval
- **Benefits:** Maintains referential integrity, enables efficient queries, and prevents data duplication

### Data Storage vs API Response

The API intelligently converts ObjectIds for the client:

**Stored in MongoDB:**
```json
{
  "_id": ObjectId("690228a4bc6bc5cefac269be"),
  "owner": ObjectId("690220c71f33b58f33665c36"),
  "members": [
    ObjectId("690220c71f33b58f33665c36"),
    ObjectId("690220c71f33b58f33665c37")
  ],
  "pending_requests": [
    ObjectId("690220c71f33b58f33665c38")
  ]
}
```

**Returned to API Client:**
```json
{
  "id": "690228a4bc6bc5cefac269be",
  "owner": "690220c71f33b58f33665c36",
  "members": [
    "690220c71f33b58f33665c36",
    "690220c71f33b58f33665c37"
  ],
  "pending_requests": [
    "690220c71f33b58f33665c38"
  ]
}
```

### How User Names and IDs Work

The API returns both user names and user IDs for flexibility:

**For Display (UI):** Use the `members` and `pending_requests` arrays which contain user full names (concatenated first_name + last_name)
```
"members": ["John Doe", "Jane Smith"]
"pending_requests": ["Sarah Williams"]
```

**For Backend Operations:** Use the `member_ids` and `pending_request_ids` arrays which contain actual user IDs
```
"member_ids": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
"pending_request_ids": ["507f1f77bcf86cd799439014"]
```

**Behind the Scenes:** The backend automatically:
1. Stores user ObjectIds in MongoDB for referential integrity
2. Joins with the users collection to enrich names for API responses
3. Returns both names (for display) and IDs (for operations) to clients

---

## Public vs Private Groups

**Public Groups:**
- Anyone can join immediately
- `POST /study-groups/{group_id}/join` returns "Successfully joined the group"
- No owner approval needed

**Private Groups:**
- Users must request to join
- `POST /study-groups/{group_id}/join` adds user to `pending_requests`
- Owner must use `POST /study-groups/{group_id}/accept-request/{user_id}` to accept
- User appears in `members` only after acceptance

---

## WebSocket Notes

- Connection is per-study-group
- All members receive broadcast messages
- Messages are persisted to database
- Automatic cleanup on disconnect
- No authentication required but sender_id must be valid user ID
