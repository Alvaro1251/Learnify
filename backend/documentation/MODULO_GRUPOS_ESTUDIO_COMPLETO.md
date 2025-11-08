# 👥 MÓDULO DE GRUPOS DE ESTUDIO (STUDY GROUPS) - GUÍA COMPLETA

## 📋 Índice

1. [¿Qué es el módulo de Grupos de Estudio?](#qué-es-el-módulo-de-grupos-de-estudio)
2. [Estructura de Datos](#estructura-de-datos)
3. [Endpoints Disponibles](#endpoints-disponibles)
4. [WebSocket Chat en Tiempo Real](#websocket-chat-en-tiempo-real)
5. [Flujos Completos](#flujos-completos)
6. [Cómo Funciona Internamente](#cómo-funciona-internamente)
7. [Sistema de Membresía (Público vs Privado)](#sistema-de-membresía-público-vs-privado)
8. [Ejemplos Prácticos](#ejemplos-prácticos)
9. [Diagramas de Flujo](#diagramas-de-flujo)

---

## 🎯 ¿Qué es el módulo de Grupos de Estudio?

El módulo de **Grupos de Estudio (Study Groups)** es un sistema colaborativo donde los estudiantes pueden:

- ✅ **Crear grupos de estudio** para preparar exámenes o materias
- ✅ **Unirse a grupos** públicos o solicitar acceso a privados
- ✅ **Compartir archivos** de estudio con el grupo
- ✅ **Chatear en tiempo real** con otros miembros del grupo
- ✅ **Gestionar solicitudes** de ingreso (si eres dueño)
- ✅ **Ver historial** de mensajes del chat

**Ejemplo de uso:**
- Un estudiante crea un grupo "Python Avanzado 2024" para preparar examen
- Otros estudiantes se unen al grupo
- Comparten apuntes y archivos
- Chatean en tiempo real para coordinar sesiones de estudio

**Características especiales:**
- **Grupos públicos:** Cualquiera puede unirse inmediatamente
- **Grupos privados:** Requieren aprobación del dueño
- **Chat en tiempo real:** WebSocket para mensajes instantáneos
- **Compartir archivos:** URLs de archivos compartidos en el grupo

---

## 📊 Estructura de Datos

### En MongoDB (Base de Datos)

```javascript
// Colección: study_groups
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "name": "Python Avanzado 2024",
  "description": "Grupo de estudio para conceptos avanzados de Python",
  "owner": ObjectId("690220c71f33b58f33665c36"),  // ← Referencia a users
  "members": [
    ObjectId("690220c71f33b58f33665c36"),  // ← Dueño
    ObjectId("690220c71f33b58f33665c37"),  // ← Miembro 1
    ObjectId("690220c71f33b58f33665c38")   // ← Miembro 2
  ],
  "pending_requests": [
    ObjectId("690220c71f33b58f33665c39")  // ← Usuario esperando aprobación
  ],
  "files": [
    {
      "file_id": "uuid-1234-5678",
      "uploaded_by": ObjectId("690220c71f33b58f33665c37"),
      "file_url": "https://example.com/study-material.pdf",
      "uploaded_at": ISODate("2024-10-27T21:45:00Z")
    }
  ],
  "chat": [
    {
      "sender": ObjectId("690220c71f33b58f33665c37"),
      "sender_id": "690220c71f33b58f33665c37",
      "content": "¿Alguien quiere estudiar mañana?",
      "timestamp": ISODate("2024-10-27T22:00:00Z")
    },
    {
      "sender": ObjectId("690220c71f33b58f33665c38"),
      "sender_id": "690220c71f33b58f33665c38",
      "content": "¡Sí! ¿A qué hora?",
      "timestamp": ISODate("2024-10-27T22:05:00Z")
    }
  ],
  "is_public": true,  // true = público, false = privado
  "exam_date": ISODate("2024-12-15T10:00:00Z"),
  "created_at": ISODate("2024-10-27T21:30:00Z")
}
```

**Nota importante:** Los ObjectIds se enriquecen después con nombres para mostrar en la API.

### Modelos Pydantic (Validación de Datos)

#### 1. `StudyGroupCreate` - Datos para crear un grupo
```python
class StudyGroupCreate(BaseModel):
    name: str          # Nombre del grupo (1-255 caracteres)
    description: str   # Descripción (mínimo 1 carácter)
    is_public: bool    # true = público, false = privado
    exam_date: datetime  # Fecha del examen
```

#### 2. `StudyGroupResponse` - Grupo en lista (resumen)
```python
class StudyGroupResponse(BaseModel):
    id: str                    # ID del grupo
    name: str                  # Nombre
    description: str           # Descripción
    owner: str                 # Nombre completo del dueño
    members: List[str]         # Nombres de miembros
    member_ids: List[str]      # IDs de miembros (para operaciones)
    pending_requests: List[str]  # Nombres de solicitudes pendientes
    pending_request_ids: List[str]  # IDs de solicitudes pendientes
    is_public: bool            # Es público?
    exam_date: datetime        # Fecha del examen
    created_at: datetime       # Fecha de creación
    members_count: int         # Cantidad de miembros
    files_count: int           # Cantidad de archivos
    messages_count: int        # Cantidad de mensajes
```

#### 3. `StudyGroupDetailResponse` - Grupo completo con detalles
```python
class StudyGroupDetailResponse(BaseModel):
    id: str                    # ID del grupo
    name: str                  # Nombre
    description: str           # Descripción
    owner: str                 # Nombre completo del dueño
    members: List[str]         # Nombres de miembros
    member_ids: List[str]      # IDs de miembros
    pending_requests: List[str]  # Nombres de solicitudes pendientes
    pending_request_ids: List[str]  # IDs de solicitudes pendientes
    files: List[SharedFile]    # Archivos compartidos
    chat: List[ChatMessage]    # Mensajes del chat
    is_public: bool            # Es público?
    exam_date: datetime        # Fecha del examen
    created_at: datetime       # Fecha de creación
```

#### 4. `SharedFile` - Archivo compartido
```python
class SharedFile(BaseModel):
    file_id: str              # UUID único del archivo
    uploaded_by: str          # ID del usuario que subió
    file_url: str             # URL del archivo
    uploaded_at: datetime     # Fecha de subida
```

#### 5. `ChatMessage` - Mensaje del chat
```python
class ChatMessage(BaseModel):
    sender: str               # Nombre del remitente
    sender_id: Optional[str]  # ID del remitente
    content: str              # Contenido del mensaje
    timestamp: datetime       # Fecha y hora
```

---

## 🔌 Endpoints Disponibles

### 1. **POST /study-groups/create** - Crear Grupo de Estudio

**Autenticación:** ✅ Requerida (Bearer Token)

**Request Body:**
```json
{
  "name": "Python Avanzado 2024",
  "description": "Grupo de estudio para conceptos avanzados de Python y preparación de examen",
  "is_public": true,
  "exam_date": "2024-12-15T10:00:00"
}
```

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Python Avanzado 2024",
  "description": "Grupo de estudio para conceptos avanzados...",
  "owner": "Juan Pérez",
  "members": ["Juan Pérez"],
  "member_ids": ["690220c71f33b58f33665c36"],
  "pending_requests": [],
  "pending_request_ids": [],
  "files": [],
  "chat": [],
  "is_public": true,
  "exam_date": "2024-12-15T10:00:00",
  "created_at": "2024-10-27T21:30:00"
}
```

**Proceso:**
1. Valida los datos con Pydantic
2. Extrae el `user_id` del token JWT
3. Crea el grupo en MongoDB:
   - `owner` como ObjectId del creador
   - `members` incluye al dueño (se agrega automáticamente)
   - Arrays vacíos para `pending_requests`, `files`, `chat`
4. Enriquece con nombres usando agregación compleja
5. Retorna el grupo creado

---

### 2. **GET /study-groups/public** - Obtener Grupos Públicos

**Autenticación:** ❌ No requerida (público)

**Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "Python Avanzado 2024",
    "description": "Grupo de estudio para conceptos avanzados...",
    "owner": "Juan Pérez",
    "members": ["Juan Pérez", "María García", "Carlos López"],
    "member_ids": ["690220c71f33b58f33665c36", "690220c71f33b58f33665c37", "690220c71f33b58f33665c38"],
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

**Proceso:**
1. Busca grupos donde `is_public == true`
2. Usa agregación para enriquecer:
   - Nombres de miembros
   - Nombres de solicitudes pendientes
   - Contadores (members_count, files_count, messages_count)
3. Retorna lista de grupos públicos

---

### 3. **GET /study-groups/my/groups** - Obtener Mis Grupos

**Autenticación:** ✅ Requerida (Bearer Token)

**Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "Python Avanzado 2024",
    "description": "Grupo de estudio...",
    "owner": "Juan Pérez",
    "members": ["Juan Pérez", "María García"],
    "member_ids": ["690220c71f33b58f33665c36", "690220c71f33b58f33665c37"],
    "pending_requests": ["Carlos López"],
    "pending_request_ids": ["690220c71f33b58f33665c38"],
    "is_public": true,
    "exam_date": "2024-12-15T10:00:00",
    "created_at": "2024-10-27T21:30:00",
    "members_count": 2,
    "files_count": 3,
    "messages_count": 15
  }
]
```

**Proceso:**
1. Extrae el `user_id` del token
2. Busca grupos donde el usuario está en `members`
3. Enriquece con nombres usando agregación
4. Retorna lista de grupos del usuario

---

### 4. **GET /study-groups/{group_id}** - Obtener Detalle de Grupo

**Autenticación:** ❌ No requerida (público)

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Python Avanzado 2024",
  "description": "Grupo de estudio para conceptos avanzados...",
  "owner": "Juan Pérez",
  "members": ["Juan Pérez", "María García", "Carlos López"],
  "member_ids": ["690220c71f33b58f33665c36", "690220c71f33b58f33665c37", "690220c71f33b58f33665c38"],
  "pending_requests": [],
  "pending_request_ids": [],
  "files": [
    {
      "file_id": "uuid-1234-5678",
      "uploaded_by": "690220c71f33b58f33665c37",
      "file_url": "https://example.com/study-material.pdf",
      "uploaded_at": "2024-10-27T21:45:00"
    }
  ],
  "chat": [
    {
      "sender": "María García",
      "sender_id": "690220c71f33b58f33665c37",
      "content": "¿Alguien quiere estudiar mañana?",
      "timestamp": "2024-10-27T22:00:00"
    },
    {
      "sender": "Carlos López",
      "sender_id": "690220c71f33b58f33665c38",
      "content": "¡Sí! ¿A qué hora?",
      "timestamp": "2024-10-27T22:05:00"
    }
  ],
  "is_public": true,
  "exam_date": "2024-12-15T10:00:00",
  "created_at": "2024-10-27T21:30:00"
}
```

**Proceso:**
1. Busca el grupo por ID
2. Usa agregación compleja para enriquecer:
   - Nombres de miembros
   - Nombres de solicitudes pendientes
   - Nombres de autores de mensajes del chat
3. Retorna grupo completo con todos los detalles

---

### 5. **POST /study-groups/{group_id}/join** - Unirse a Grupo

**Autenticación:** ✅ Requerida (Bearer Token)

**Response (200) - Grupo Público:**
```json
{
  "message": "Successfully joined the group"
}
```

**Response (200) - Grupo Privado:**
```json
{
  "message": "Join request sent. Waiting for owner approval."
}
```

**Proceso:**
1. Extrae el `user_id` del token
2. Busca el grupo en MongoDB
3. **Si es público (`is_public == true`):**
   - Agrega usuario a `members` usando `$push`
   - Retorna mensaje de éxito
4. **Si es privado (`is_public == false`):**
   - Agrega usuario a `pending_requests` usando `$push`
   - Retorna mensaje de solicitud enviada

**Error (404):**
```json
{
  "detail": "Study group not found"
}
```

---

### 6. **POST /study-groups/{group_id}/accept-request/{user_id}** - Aceptar Solicitud

**Autenticación:** ✅ Requerida (Bearer Token - debe ser dueño)

**Response (200):**
```json
{
  "message": "Join request accepted"
}
```

**Proceso:**
1. Extrae el `user_id` del token (debe ser el dueño)
2. Verifica que el usuario es dueño del grupo
3. Busca el `user_id` en `pending_requests`
4. Si está:
   - Remueve de `pending_requests` usando `$pull`
   - Agrega a `members` usando `$push`
5. Retorna mensaje de éxito

**Error (403):**
```json
{
  "detail": "Not authorized or request not found"
}
```

---

### 7. **POST /study-groups/{group_id}/leave** - Salir del Grupo

**Autenticación:** ✅ Requerida (Bearer Token)

**Response (200):**
```json
{
  "message": "Successfully left the group"
}
```

**Proceso:**
1. Extrae el `user_id` del token
2. Remueve el usuario de `members` usando `$pull`
3. Retorna mensaje de éxito

**Nota:** El dueño NO puede salir del grupo (o debería haber validación adicional).

---

### 8. **POST /study-groups/{group_id}/share-file** - Compartir Archivo

**Autenticación:** ✅ Requerida (Bearer Token - debe ser miembro)

**Request Body:**
```json
{
  "file_url": "https://example.com/study-material.pdf"
}
```

**Response (200):**
```json
{
  "message": "File shared successfully",
  "group": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Python Avanzado 2024",
    "files": [
      {
        "file_id": "uuid-1234-5678",
        "uploaded_by": "690220c71f33b58f33665c37",
        "file_url": "https://example.com/study-material.pdf",
        "uploaded_at": "2024-10-27T21:45:00"
      }
    ],
    ...
  }
}
```

**Proceso:**
1. Extrae el `user_id` del token
2. Verifica que el usuario está en `members`
3. Crea objeto `SharedFile` con:
   - `file_id`: UUID generado
   - `uploaded_by`: user_id
   - `file_url`: URL proporcionada
   - `uploaded_at`: Fecha actual
4. Agrega a `files` usando `$push`
5. Retorna grupo actualizado

**Error (404):**
```json
{
  "detail": "Study group not found or not a member"
}
```

---

### 9. **GET /study-groups/{group_id}/messages** - Obtener Mensajes del Chat

**Autenticación:** ❌ No requerida (público)

**Query Parameters:**
- `limit` (opcional): Número de mensajes (default: 50)

**Response (200):**
```json
{
  "messages": [
    {
      "sender": "María García",
      "sender_id": "690220c71f33b58f33665c37",
      "content": "¿Alguien quiere estudiar mañana?",
      "timestamp": "2024-10-27T22:00:00"
    },
    {
      "sender": "Carlos López",
      "sender_id": "690220c71f33b58f33665c38",
      "content": "¡Sí! ¿A qué hora?",
      "timestamp": "2024-10-27T22:05:00"
    }
  ]
}
```

**Proceso:**
1. Busca el grupo por ID
2. Enriquece con nombres
3. Obtiene los últimos `limit` mensajes del array `chat`
4. Retorna lista de mensajes

---

## 💬 WebSocket Chat en Tiempo Real

### **WS /study-groups/ws/{group_id}** - Conexión WebSocket

**Autenticación:** ❌ No requerida (conexión abierta, pero `sender_id` debe ser válido)

**Conexión:**
```javascript
const groupId = '507f1f77bcf86cd799439011';
const ws = new WebSocket(`ws://localhost:8000/study-groups/ws/${groupId}`);

// Conectar
ws.onopen = () => {
  console.log('Conectado al chat del grupo');
};

// Enviar mensaje
ws.send(JSON.stringify({
  sender_id: "690220c71f33b58f33665c37",
  content: "Hola a todos!"
}));

// Recibir mensajes
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(`${message.sender_name}: ${message.content}`);
};

// Desconectar
ws.onclose = () => {
  console.log('Desconectado del chat');
};
```

**Mensaje enviado:**
```json
{
  "sender_id": "690220c71f33b58f33665c37",
  "content": "Hola a todos!"
}
```

**Mensaje recibido (broadcast a todos):**
```json
{
  "type": "message",
  "sender_id": "690220c71f33b58f33665c37",
  "sender": "María García",
  "sender_name": "María García",
  "content": "Hola a todos!",
  "timestamp": "2024-10-27T22:00:00"
}
```

**Proceso:**
1. Cliente se conecta al WebSocket
2. Backend acepta conexión y la guarda en `ConnectionManager`
3. Cliente envía mensaje con `sender_id` y `content`
4. Backend:
   - Valida que `sender_id` es miembro del grupo
   - Persiste mensaje en MongoDB (agrega a `chat` array)
   - Obtiene nombre del sender desde `users` collection
   - Hace broadcast a todos los conectados al grupo
5. Todos los clientes conectados reciben el mensaje en tiempo real

---

## 🔄 Flujos Completos

### Flujo 1: Crear Grupo → Unirse → Compartir Archivo → Chatear

```
┌─────────────┐
│   Usuario   │
│   (Juan)    │
└──────┬──────┘
       │
       │ 1. POST /study-groups/create
       │    Headers: Bearer TOKEN_Juan
       │    Body: {name, description, is_public, exam_date}
       ▼
┌─────────────┐
│  Backend    │──▶ Valida token → Obtiene user_id
│  Controller │──▶ Valida datos con Pydantic
└──────┬──────┘──▶ Crea grupo en MongoDB
       │
       ▼
┌─────────────┐
│  MongoDB    │──▶ Insert study_group:
│  study_     │    {
│  groups      │      name, description,
│             │      owner: ObjectId(juan_id),
│             │      members: [ObjectId(juan_id)],
│             │      pending_requests: [],
│             │      files: [],
│             │      chat: [],
│             │      is_public: true,
│             │      exam_date
│             │    }
└──────┬──────┘
       │
       │ 2. Enriquecer con nombres
       │    (agregación compleja)
       ▼
┌─────────────┐
│  Backend    │──▶ Retorna grupo creado
│  Service    │    con nombres enriquecidos
└──────┬──────┘
       │
       │ 3. Retorna grupo creado
       ▼
┌─────────────┐
│  Frontend   │──▶ Muestra grupo en lista
│             │    Actualiza UI
└─────────────┘

       │
       │ 4. Otro usuario ve grupos públicos
       ▼
┌─────────────┐
│   Usuario   │──▶ GET /study-groups/public
│   (María)   │    Ve lista de grupos públicos
└──────┬──────┘
       │
       │ 5. Unirse a grupo
       ▼
┌─────────────┐
│  Frontend   │──▶ POST /study-groups/{group_id}/join
│             │    Headers: Bearer TOKEN_Maria
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Backend    │──▶ Verifica si es público
│  Controller │    Si público: $push a members
│             │    Si privado: $push a pending_requests
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  MongoDB    │──▶ Update study_group:
│             │    $push: {
│             │      members: ObjectId(maria_id)
│             │    }
└──────┬──────┘
       │
       │ 6. Compartir archivo
       ▼
┌─────────────┐
│  Frontend   │──▶ POST /study-groups/{group_id}/share-file
│             │    Body: {file_url}
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  MongoDB    │──▶ Update study_group:
│             │    $push: {
│             │      files: {
│             │        file_id: UUID,
│             │        uploaded_by: ObjectId(maria_id),
│             │        file_url,
│             │        uploaded_at
│             │      }
│             │    }
└──────┬──────┘
       │
       │ 7. Conectar WebSocket para chat
       ▼
┌─────────────┐
│  Frontend   │──▶ WS /study-groups/ws/{group_id}
│  WebSocket  │    Conecta al chat
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Backend    │──▶ ConnectionManager.connect()
│  WebSocket  │    Guarda conexión
│  Manager    │
└──────┬──────┘
       │
       │ 8. Enviar mensaje
       ▼
┌─────────────┐
│  Frontend   │──▶ Send: {sender_id, content}
│             │    "Hola a todos!"
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Backend    │──▶ 1. Persistir en MongoDB
│             │    $push: {chat: {sender, content, timestamp}}
│             │    2. Obtener nombre del sender
│             │    3. Broadcast a todos los conectados
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Frontend   │──▶ Recibe mensaje en tiempo real
│  (Todos los │    Muestra en UI
│  conectados)│
└─────────────┘
```

---

## 🔧 Cómo Funciona Internamente

### Arquitectura del Módulo

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│  (Next.js + React + TypeScript)                    │
│                                                     │
│  - studyGroupsApi.getPublicStudyGroups()           │
│  - studyGroupsApi.createStudyGroup()               │
│  - studyGroupsApi.joinStudyGroup()                 │
│  - WebSocket: ws://localhost:8000/                 │
│           study-groups/ws/{group_id}                │
└─────────────────┬──────────────────────────────────┘
                   │ HTTP Requests + WebSocket
                   ▼
┌─────────────────────────────────────────────────────┐
│                    BACKEND                           │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  CONTROLLERS (controllers/study_group.py)   │   │
│  │  - Define endpoints REST                    │   │
│  │  - Define WebSocket endpoint                │   │
│  │  - Valida autenticación                     │   │
│  └──────────────┬──────────────────────────────┘   │
│                 │                                    │
│                 ▼                                    │
│  ┌─────────────────────────────────────────────┐   │
│  │  SERVICES (services/study_group_service.py) │   │
│  │  - Lógica de negocio                         │   │
│  │  - Agregaciones MongoDB                      │   │
│  │  - Enriquecimiento de datos                  │   │
│  └──────────────┬──────────────────────────────┘   │
│                 │                                    │
│                 ▼                                    │
│  ┌─────────────────────────────────────────────┐   │
│  │  WEBSOCKET MANAGER                          │   │
│  │  (config/websocket_manager.py)              │   │
│  │  - Gestiona conexiones                      │   │
│  │  - Broadcast de mensajes                    │   │
│  └──────────────┬──────────────────────────────┘   │
│                 │                                    │
│                 ▼                                    │
│  ┌─────────────────────────────────────────────┐   │
│  │  MODELS (models/study_group.py)             │   │
│  │  - Validación de datos (Pydantic)            │   │
│  │  - Estructura de respuestas                  │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────┬──────────────────────────────────┘
                  │ MongoDB Queries
                  ▼
┌─────────────────────────────────────────────────────┐
│                    MONGODB                           │
│                                                     │
│  - study_groups collection                          │
│  - users collection (para enriquecer)               │
└─────────────────────────────────────────────────────┘
```

### Servicios Principales

#### 1. `create_study_group()`
```python
async def create_study_group(db, group: StudyGroupCreate, owner_id: str):
    # 1. Prepara datos
    group_data = {
        "name": group.name,
        "description": group.description,
        "owner": ObjectId(owner_id),  # ObjectId para referencial integrity
        "members": [ObjectId(owner_id)],  # Dueño es primer miembro
        "pending_requests": [],
        "files": [],
        "chat": [],
        "is_public": group.is_public,
        "exam_date": group.exam_date,
        "created_at": datetime.utcnow(),
    }
    
    # 2. Inserta en MongoDB
    result = await groups_collection.insert_one(group_data)
    
    # 3. Enriquece con nombres usando agregación compleja
    enriched = await _enrich_group_with_member_names(db, str(result.inserted_id))
    
    # 4. Retorna grupo creado
    return StudyGroupInDB(**enriched)
```

#### 2. `_enrich_group_with_member_names()` - Agregación Compleja

Esta función hace múltiples `$lookup` para enriquecer todos los datos:

```python
pipeline = [
    # 1. Buscar grupo por ID
    {"$match": {"_id": ObjectId(group_id)}},
    
    # 2. JOIN con users para obtener nombres de miembros
    {
        "$lookup": {
            "from": "users",
            "localField": "members",        # Array de ObjectIds
            "foreignField": "_id",
            "as": "members_info"            # Resultado del JOIN
        }
    },
    
    # 3. JOIN con users para obtener nombres de solicitudes pendientes
    {
        "$lookup": {
            "from": "users",
            "localField": "pending_requests",
            "foreignField": "_id",
            "as": "pending_requests_info"
        }
    },
    
    # 4. JOIN con users para obtener nombres de autores de chat
    {
        "$lookup": {
            "from": "users",
            "localField": "chat.sender",    # Campo anidado
            "foreignField": "_id",
            "as": "chat_senders_info"
        }
    },
    
    # 5. Transformar miembros: crear arrays de nombres e IDs
    {
        "$addFields": {
            "members": {
                "$map": {
                    "input": "$members_info",
                    "as": "member",
                    "in": {
                        "$concat": [
                            {"$ifNull": ["$$member.full_name", "Unknown"]},
                            " ",
                            {"$ifNull": ["$$member.last_name", ""]}
                        ]
                    }
                }
            },
            "member_ids": {
                "$map": {
                    "input": "$members_info",
                    "as": "member",
                    "in": {"$toString": "$$member._id"}
                }
            },
            # Similar para pending_requests y pending_request_ids
            # ...
            
            # 6. Enriquecer mensajes del chat
            "chat": {
                "$map": {
                    "input": "$chat",
                    "as": "message",
                    "in": {
                        "sender": {
                            # Buscar nombre del sender en chat_senders_info
                            "$let": {
                                "vars": {
                                    "matched_names": {
                                        "$map": {
                                            "input": {
                                                "$filter": {
                                                    "input": "$chat_senders_info",
                                                    "as": "user",
                                                    "cond": {
                                                        "$eq": [
                                                            {"$toString": "$$user._id"},
                                                            {"$toString": "$$message.sender"}
                                                        ]
                                                    }
                                                }
                                            },
                                            "as": "user",
                                            "in": {
                                                "$concat": [
                                                    {"$ifNull": ["$$user.full_name", "Unknown"]},
                                                    " ",
                                                    {"$ifNull": ["$$user.last_name", ""]}
                                                ]
                                            }
                                        }
                                    }
                                },
                                "in": {
                                    "$ifNull": [
                                        {"$arrayElemAt": ["$$matched_names", 0]},
                                        "$$message.sender"
                                    ]
                                }
                            }
                        },
                        "sender_id": {"$toString": "$$message.sender"},
                        "content": "$$message.content",
                        "timestamp": "$$message.timestamp"
                    }
                }
            }
        }
    }
]
```

**Resultado:**
- `members`: `["Juan Pérez", "María García"]` (nombres)
- `member_ids`: `["690220c71f33b58f33665c36", "690220c71f33b58f33665c37"]` (IDs)
- `chat[].sender`: `"María García"` (nombre en lugar de ObjectId)

#### 3. `request_to_join()` - Unirse a Grupo

```python
async def request_to_join(db, group_id, user_id):
    # 1. Buscar grupo
    group = await groups_collection.find_one({"_id": ObjectId(group_id)})
    
    user_oid = ObjectId(user_id)
    
    # 2. Si es público
    if group["is_public"]:
        if user_oid not in group.get("members", []):
            # Agregar a members directamente
            await groups_collection.find_one_and_update(
                {"_id": ObjectId(group_id)},
                {"$push": {"members": user_oid}},  # Push ObjectId
                return_document=True
            )
    
    # 3. Si es privado
    else:
        if user_oid not in group.get("pending_requests", []):
            # Agregar a pending_requests
            await groups_collection.find_one_and_update(
                {"_id": ObjectId(group_id)},
                {"$push": {"pending_requests": user_oid}},  # Push ObjectId
                return_document=True
            )
    
    # 4. Enriquecer y retornar
    enriched = await _enrich_group_with_member_names(db, group_id)
    return StudyGroupInDB(**enriched)
```

#### 4. `add_chat_message()` - Agregar Mensaje al Chat

```python
async def add_chat_message(db, group_id, content, sender_id):
    # 1. Buscar usuario para obtener nombre
    user = await users_collection.find_one(
        {"_id": ObjectId(sender_id)},
        {"full_name": 1, "last_name": 1}
    )
    
    # 2. Construir nombre del sender
    full_name = user.get("full_name") if user else None
    last_name = user.get("last_name") if user else None
    
    if isinstance(full_name, str):
        name_parts = [full_name.strip()]
        if isinstance(last_name, str) and last_name.strip():
            name_parts.append(last_name.strip())
        sender_display = " ".join(name_parts).strip()
    else:
        sender_display = sender_id  # Fallback
    
    # 3. Crear mensaje
    message_data = ChatMessage(
        sender=sender_display,
        sender_id=sender_id,
        content=content
    )
    
    # 4. Agregar a chat array
    # IMPORTANTE: Solo miembros pueden enviar mensajes
    result = await groups_collection.find_one_and_update(
        {
            "_id": ObjectId(group_id),
            "members": ObjectId(sender_id)  # Verifica membresía
        },
        {"$push": {"chat": message_data.dict()}},
        return_document=True
    )
    
    # 5. Enriquecer y retornar
    if result:
        enriched = await _enrich_group_with_member_names(db, group_id)
        return StudyGroupInDB(**enriched)
```

#### 5. `ConnectionManager` - Gestión de WebSocket

```python
class ConnectionManager:
    def __init__(self):
        # Diccionario: {group_id: [websocket1, websocket2, ...]}
        self.active_connections = {}
    
    async def connect(self, group_id: str, websocket: WebSocket):
        # Aceptar conexión
        await websocket.accept()
        
        # Agregar a conexiones del grupo
        if group_id not in self.active_connections:
            self.active_connections[group_id] = []
        self.active_connections[group_id].append(websocket)
    
    def disconnect(self, group_id: str, websocket: WebSocket):
        # Remover conexión
        if group_id in self.active_connections:
            self.active_connections[group_id].remove(websocket)
            # Si no hay más conexiones, eliminar entrada
            if len(self.active_connections[group_id]) == 0:
                del self.active_connections[group_id]
    
    async def broadcast(self, group_id: str, message: dict):
        # Enviar mensaje a todos los conectados al grupo
        if group_id in self.active_connections:
            for connection in self.active_connections[group_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass  # Si falla, continuar con otros
```

**Flujo de WebSocket:**
1. Cliente conecta → `manager.connect(group_id, websocket)`
2. Cliente envía mensaje → Backend recibe JSON
3. Backend persiste en MongoDB → `add_chat_message()`
4. Backend hace broadcast → `manager.broadcast(group_id, message_data)`
5. Todos los clientes reciben → `websocket.onmessage()`
6. Cliente desconecta → `manager.disconnect(group_id, websocket)`

---

## 🔐 Sistema de Membresía (Público vs Privado)

### Grupos Públicos (`is_public: true`)

**Características:**
- ✅ Cualquiera puede unirse inmediatamente
- ✅ No requiere aprobación
- ✅ `POST /study-groups/{id}/join` agrega directamente a `members`

**Flujo:**
```
Usuario → POST /join → Backend verifica is_public → $push a members → Éxito
```

**Ejemplo:**
```json
POST /study-groups/507f1f77bcf86cd799439011/join
Headers: Authorization: Bearer TOKEN

Response:
{
  "message": "Successfully joined the group"
}
```

### Grupos Privados (`is_public: false`)

**Características:**
- 🔒 Requiere solicitud de ingreso
- 🔒 Dueño debe aprobar
- 🔒 `POST /study-groups/{id}/join` agrega a `pending_requests`

**Flujo:**
```
Usuario → POST /join → Backend verifica is_public → $push a pending_requests → Espera
Dueño → POST /accept-request/{user_id} → $pull de pending_requests + $push a members → Aceptado
```

**Ejemplo:**
```json
# 1. Usuario solicita unirse
POST /study-groups/507f1f77bcf86cd799439011/join
Headers: Authorization: Bearer TOKEN_USUARIO

Response:
{
  "message": "Join request sent. Waiting for owner approval."
}

# 2. Dueño acepta solicitud
POST /study-groups/507f1f77bcf86cd799439011/accept-request/690220c71f33b58f33665c39
Headers: Authorization: Bearer TOKEN_DUEÑO

Response:
{
  "message": "Join request accepted"
}
```

---

## 💡 Ejemplos Prácticos

### Ejemplo 1: Crear Grupo y Unirse

**Paso 1: Juan crea grupo**
```json
POST /study-groups/create
Headers: {
  "Authorization": "Bearer TOKEN_JUAN"
}
Body: {
  "name": "Python Avanzado 2024",
  "description": "Grupo para estudiar Python avanzado",
  "is_public": true,
  "exam_date": "2024-12-15T10:00:00"
}

Response:
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Python Avanzado 2024",
  "owner": "Juan Pérez",
  "members": ["Juan Pérez"],
  "member_ids": ["690220c71f33b58f33665c36"],
  "is_public": true,
  ...
}
```

**Paso 2: María se une**
```json
POST /study-groups/507f1f77bcf86cd799439011/join
Headers: {
  "Authorization": "Bearer TOKEN_MARIA"
}

Response:
{
  "message": "Successfully joined the group"
}
```

**Lo que pasó:**
1. Backend verificó que `is_public == true`
2. Agregó `ObjectId(maria_id)` a `members` array
3. Retornó mensaje de éxito

---

### Ejemplo 2: Chat en Tiempo Real

**Paso 1: Conectar WebSocket**
```javascript
const ws = new WebSocket('ws://localhost:8000/study-groups/ws/507f1f77bcf86cd799439011');

ws.onopen = () => {
  console.log('Conectado al chat');
};
```

**Paso 2: Enviar mensaje**
```javascript
ws.send(JSON.stringify({
  sender_id: "690220c71f33b58f33665c37",  // ID de María
  content: "¿Alguien quiere estudiar mañana?"
}));
```

**Lo que pasó:**
1. Backend recibió mensaje
2. Validó que `sender_id` está en `members`
3. Persistió en MongoDB:
   ```javascript
   db.study_groups.updateOne(
     {_id: ObjectId("507f1f77bcf86cd799439011")},
     {
       $push: {
         chat: {
           sender: ObjectId("690220c71f33b58f33665c37"),
           sender_id: "690220c71f33b58f33665c37",
           content: "¿Alguien quiere estudiar mañana?",
           timestamp: ISODate("2024-10-27T22:00:00Z")
         }
       }
     }
   )
   ```
4. Buscó nombre de María en `users` → "María García"
5. Hizo broadcast a todos los conectados:
   ```json
   {
     "type": "message",
     "sender_id": "690220c71f33b58f33665c37",
     "sender": "María García",
     "sender_name": "María García",
     "content": "¿Alguien quiere estudiar mañana?",
     "timestamp": "2024-10-27T22:00:00"
   }
   ```

**Paso 3: Todos reciben mensaje**
```javascript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(`${message.sender_name}: ${message.content}`);
  // Output: "María García: ¿Alguien quiere estudiar mañana?"
};
```

---

### Ejemplo 3: Grupo Privado con Aprobación

**Paso 1: Juan crea grupo privado**
```json
POST /study-groups/create
Body: {
  "name": "Grupo Privado Python",
  "description": "Solo estudiantes avanzados",
  "is_public": false,  // ← Privado
  "exam_date": "2024-12-15T10:00:00"
}
```

**Paso 2: María solicita unirse**
```json
POST /study-groups/{group_id}/join
Headers: Authorization: Bearer TOKEN_MARIA

Response:
{
  "message": "Join request sent. Waiting for owner approval."
}
```

**Lo que pasó:**
- María fue agregada a `pending_requests`
- No está en `members` todavía

**Paso 3: Juan acepta solicitud**
```json
POST /study-groups/{group_id}/accept-request/690220c71f33b58f33665c37
Headers: Authorization: Bearer TOKEN_JUAN

Response:
{
  "message": "Join request accepted"
}
```

**Lo que pasó:**
1. Backend verificó que Juan es el dueño
2. Removió a María de `pending_requests` usando `$pull`
3. Agregó a María a `members` usando `$push`
4. Retornó mensaje de éxito

---

## 📐 Diagramas de Flujo Detallados

### Flujo Completo: Crear → Unirse → Chatear

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO COMPLETO                            │
└─────────────────────────────────────────────────────────────┘

Usuario Juan                    Backend                    MongoDB
      │                           │                           │
      │ 1. POST /study-groups/    │                           │
      │    create                 │                           │
      │    {name, description,    │                           │
      │     is_public, exam_date} │                           │
      ├──────────────────────────▶│                           │
      │                           │                           │
      │                           │ 2. Validar token JWT      │
      │                           │    Extraer user_id        │
      │                           │                           │
      │                           │ 3. Insert group           │
      │                           ├──────────────────────────▶│
      │                           │                           │
      │                           │                           │ 4. Insert documento
      │                           │                           │    {
      │                           │                           │      _id: ObjectId(...)
      │                           │                           │      owner: ObjectId(juan_id)
      │                           │                           │      members: [ObjectId(juan_id)]
      │                           │                           │      is_public: true
      │                           │                           │      ...
      │                           │                           │    }
      │                           │                           │
      │                           │ 5. Agregación compleja     │
      │                           │    - $lookup members      │
      │                           │    - $lookup pending      │
      │                           │    - $lookup chat senders │
      │                           │◀──────────────────────────┤
      │                           │    Enriquecer con nombres │
      │                           │                           │
      │ 6. Retorna grupo creado   │                           │
      │◀──────────────────────────┤                           │
      │                           │                           │
      │                           │                           │
      │ Usuario María             │                           │
      │                           │                           │
      │ 7. POST /join             │                           │
      ├──────────────────────────▶│                           │
      │                           │                           │
      │                           │ 8. Verificar is_public    │
      │                           │    Si público: $push      │
      │                           │    Si privado: $push      │
      │                           │       a pending_requests │
      │                           ├──────────────────────────▶│
      │                           │                           │
      │                           │                           │ 9. Update documento
      │                           │                           │    $push: {
      │                           │                           │      members: ObjectId(maria_id)
      │                           │                           │    }
      │                           │                           │
      │ 10. Mensaje de éxito      │                           │
      │◀──────────────────────────┤                           │
      │                           │                           │
      │ 11. Conectar WebSocket    │                           │
      ├──────────────────────────▶│                           │
      │                           │                           │
      │                           │ 12. ConnectionManager     │
      │                           │     .connect(group_id)    │
      │                           │     Guarda conexión       │
      │                           │                           │
      │ 13. Enviar mensaje         │                           │
      │     {sender_id, content}   │                           │
      ├──────────────────────────▶│                           │
      │                           │                           │
      │                           │ 14. Validar membresía     │
      │                           │     Persistir en MongoDB │
      │                           ├──────────────────────────▶│
      │                           │                           │
      │                           │                           │ 15. $push mensaje a chat
      │                           │                           │
      │                           │ 16. Obtener nombre sender │
      │                           │     Broadcast a todos    │
      │                           │◀──────────────────────────┤
      │                           │                           │
      │ 17. Recibir mensaje       │                           │
      │     (todos los conectados) │                           │
      │◀──────────────────────────┤                           │
```

---

## 🔍 Diferencias Clave: Grupos vs Posts/Notas

### Grupos de Estudio
- **Propósito:** Colaboración en tiempo real
- **Estructura:** Membresía, archivos compartidos, chat
- **Interacción:** Chat WebSocket, compartir archivos
- **Membresía:** Sistema público/privado con aprobaciones
- **Tiempo real:** Mensajes instantáneos

### Posts
- **Propósito:** Preguntas y respuestas
- **Estructura:** Título, descripción, respuestas
- **Interacción:** Sistema de respuestas (no tiempo real)
- **Membresía:** No aplica
- **Tiempo real:** No

### Notas
- **Propósito:** Apuntes y archivos
- **Estructura:** Metadatos, tags, file_url
- **Interacción:** Búsqueda y descarga
- **Membresía:** No aplica
- **Tiempo real:** No

---

## 🎓 Conceptos Clave para Entender

### 1. **WebSocket vs REST**
- **REST:** Request → Response (una vez)
- **WebSocket:** Conexión persistente, mensajes bidireccionales
- **Ventaja:** Tiempo real sin polling constante

### 2. **Broadcast**
- **Propósito:** Enviar mensaje a todos los conectados
- **Implementación:** Iterar sobre `active_connections[group_id]`
- **Resultado:** Todos los miembros ven el mensaje instantáneamente

### 3. **$push y $pull en MongoDB**
- **$push:** Agregar elemento a array
- **$pull:** Remover elemento de array
- **Uso:** Gestionar miembros, archivos, mensajes

### 4. **Membresía con ObjectIds**
- **En MongoDB:** `members: [ObjectId(...), ObjectId(...)]`
- **En API:** `members: ["Juan Pérez", "María García"]` (nombres)
- **También:** `member_ids: ["id1", "id2"]` (IDs para operaciones)

### 5. **Agregación Compleja**
- **Múltiples $lookup:** Para enriquecer diferentes arrays
- **$map:** Para transformar arrays
- **Resultado:** Datos enriquecidos con nombres legibles

---

## 📚 Resumen Final

### ¿Qué hace el módulo?
Permite a estudiantes crear grupos de estudio, unirse, compartir archivos y chatear en tiempo real.

### Endpoints principales:
1. **Crear** grupo → `POST /study-groups/create`
2. **Ver públicos** → `GET /study-groups/public`
3. **Mis grupos** → `GET /study-groups/my/groups`
4. **Ver detalle** → `GET /study-groups/{id}`
5. **Unirse** → `POST /study-groups/{id}/join`
6. **Aceptar solicitud** → `POST /study-groups/{id}/accept-request/{user_id}`
7. **Salir** → `POST /study-groups/{id}/leave`
8. **Compartir archivo** → `POST /study-groups/{id}/share-file`
9. **Ver mensajes** → `GET /study-groups/{id}/messages`
10. **Chat WebSocket** → `WS /study-groups/ws/{id}`

### Tecnologías clave:
- **FastAPI:** Framework backend
- **MongoDB:** Base de datos NoSQL
- **WebSocket:** Chat en tiempo real
- **ConnectionManager:** Gestión de conexiones
- **Agregaciones MongoDB:** Enriquecimiento de datos
- **Pydantic:** Validación de datos
- **JWT:** Autenticación

### Flujo típico:
1. Usuario crea grupo (público o privado)
2. Otros usuarios se unen o solicitan acceso
3. Miembros comparten archivos
4. Chatean en tiempo real vía WebSocket
5. Mensajes se persisten en MongoDB

### Características especiales:
- ✅ Grupos públicos y privados
- ✅ Sistema de aprobación para privados
- ✅ Chat en tiempo real con WebSocket
- ✅ Broadcast de mensajes a todos los conectados
- ✅ Compartir archivos entre miembros
- ✅ Enriquecimiento complejo de datos (múltiples $lookup)

---

¡Listo! Ahora entiendes completamente el módulo de Grupos de Estudio. 🎉

