# 📝 MÓDULO DE PUBLICACIONES (POSTS) - GUÍA COMPLETA

## 📋 Índice

1. [¿Qué es el módulo de Publicaciones?](#qué-es-el-módulo-de-publicaciones)
2. [Estructura de Datos](#estructura-de-datos)
3. [Endpoints Disponibles](#endpoints-disponibles)
4. [Flujos Completos](#flujos-completos)
5. [Cómo Funciona Internamente](#cómo-funciona-internamente)
6. [Ejemplos Prácticos](#ejemplos-prácticos)
7. [Diagramas de Flujo](#diagramas-de-flujo)

---

## 🎯 ¿Qué es el módulo de Publicaciones?

El módulo de **Publicaciones (Posts)** es un sistema de preguntas y respuestas donde los estudiantes pueden:

- ✅ **Crear publicaciones** con preguntas o temas de discusión
- ✅ **Responder** a publicaciones de otros estudiantes
- ✅ **Ver publicaciones** más recientes
- ✅ **Ver detalles** completos de una publicación con todas sus respuestas
- ✅ **Gestionar sus propias publicaciones** (ver y eliminar)

**Ejemplo de uso:**
- Un estudiante pregunta: "¿Cómo empezar con Python?"
- Otros estudiantes responden con consejos y recursos
- Todos pueden ver la pregunta y las respuestas

---

## 📊 Estructura de Datos

### En MongoDB (Base de Datos)

```javascript
// Colección: posts
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "title": "¿Cómo aprender Python desde cero?",
  "description": "Estoy empezando con Python y me gustaría saber por dónde comenzar.",
  "subject": "Programming",
  "owner": ObjectId("690220c71f33b58f33665c36"),  // ← Referencia a users
  "creation_date": ISODate("2024-10-27T21:30:00Z"),
  "responses": [
    {
      "owner": ObjectId("690220c71f33b58f33665c37"),  // ← Referencia a users
      "content": "Te recomiendo empezar con Codecademy",
      "creation_date": ISODate("2024-10-27T21:45:00Z")
    },
    {
      "owner": ObjectId("690220c71f33b58f33665c38"),
      "content": "Practica en LeetCode, ayuda mucho!",
      "creation_date": ISODate("2024-10-27T22:10:00Z")
    }
  ]
}
```

### Modelos Pydantic (Validación de Datos)

#### 1. `PostCreate` - Datos para crear una publicación
```python
class PostCreate(BaseModel):
    title: str          # Título (1-255 caracteres)
    description: str    # Descripción (mínimo 1 carácter)
    subject: str        # Materia/asignatura (mínimo 1 carácter)
```

#### 2. `PostResponse` - Publicación en lista (sin respuestas completas)
```python
class PostResponse(BaseModel):
    id: str                    # ID del post
    title: str                 # Título
    description: str           # Descripción
    subject: str              # Materia
    owner: str                # Nombre completo del dueño (ej: "Juan Pérez")
    creation_date: datetime   # Fecha de creación
    responses_count: int      # Cantidad de respuestas (número solo)
```

#### 3. `PostDetailResponse` - Publicación completa con respuestas
```python
class PostDetailResponse(BaseModel):
    id: str                    # ID del post
    title: str                 # Título
    description: str           # Descripción
    subject: str              # Materia
    owner: str                # Nombre completo del dueño
    creation_date: datetime   # Fecha de creación
    responses: List[ResponseWithUser]  # Lista completa de respuestas
```

#### 4. `ResponseCreate` - Datos para crear una respuesta
```python
class ResponseCreate(BaseModel):
    content: str  # Contenido de la respuesta (mínimo 1 carácter)
```

#### 5. `ResponseWithUser` - Respuesta con nombre del usuario
```python
class ResponseWithUser(BaseModel):
    owner: str          # Nombre completo del autor (ej: "María García")
    content: str        # Contenido de la respuesta
    creation_date: datetime  # Fecha de creación
```

---

## 🔌 Endpoints Disponibles

### 1. **POST /posts/create** - Crear Publicación

**Autenticación:** ✅ Requerida (Bearer Token)

**Request Body:**
```json
{
  "title": "¿Cómo aprender Python desde cero?",
  "description": "Estoy empezando con Python y me gustaría saber por dónde comenzar.",
  "subject": "Programming"
}
```

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "¿Cómo aprender Python desde cero?",
  "description": "Estoy empezando con Python...",
  "subject": "Programming",
  "owner": "Juan Pérez",
  "creation_date": "2024-10-27T21:30:00",
  "responses": []
}
```

**Proceso:**
1. Valida los datos con Pydantic
2. Extrae el `user_id` del token JWT
3. Crea el post en MongoDB con `owner` como ObjectId
4. Retorna el post con el nombre del dueño enriquecido

---

### 2. **GET /posts/latest** - Obtener Últimas Publicaciones

**Autenticación:** ❌ No requerida (público)

**Query Parameters:**
- `limit` (opcional): Número de posts (default: 10, máximo: 100)

**Ejemplo:**
```
GET /posts/latest?limit=5
```

**Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "¿Cómo aprender Python?",
    "description": "Estoy empezando...",
    "subject": "Programming",
    "owner": "Juan Pérez",
    "creation_date": "2024-10-27T21:30:00",
    "responses_count": 2
  },
  {
    "id": "507f1f77bcf86cd799439012",
    "title": "Mejor IDE para JavaScript",
    "description": "¿Cuál es el mejor IDE?",
    "subject": "Programming",
    "owner": "María García",
    "creation_date": "2024-10-27T20:15:00",
    "responses_count": 5
  }
]
```

**Proceso:**
1. Ordena posts por `creation_date` descendente (más recientes primero)
2. Limita la cantidad según el parámetro
3. Enriquece con nombres de usuarios usando `$lookup`
4. Calcula `responses_count` (solo el número, no las respuestas completas)
5. Retorna lista optimizada para mostrar en lista

**Nota:** No incluye las respuestas completas para optimizar la respuesta.

---

### 3. **GET /posts/{post_id}** - Obtener Detalle de Publicación

**Autenticación:** ❌ No requerida (público)

**Ejemplo:**
```
GET /posts/507f1f77bcf86cd799439011
```

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "¿Cómo aprender Python desde cero?",
  "description": "Estoy empezando con Python...",
  "subject": "Programming",
  "owner": "Juan Pérez",
  "creation_date": "2024-10-27T21:30:00",
  "responses": [
    {
      "owner": "María García",
      "content": "Te recomiendo empezar con Codecademy",
      "creation_date": "2024-10-27T21:45:00"
    },
    {
      "owner": "Carlos López",
      "content": "Practica en LeetCode, ayuda mucho!",
      "creation_date": "2024-10-27T22:10:00"
    }
  ]
}
```

**Proceso:**
1. Busca el post por ID en MongoDB
2. Usa agregación compleja para enriquecer:
   - Nombre del dueño del post
   - Nombres de los dueños de cada respuesta
3. Retorna post completo con todas las respuestas

**Error (404):**
```json
{
  "detail": "Post not found"
}
```

---

### 4. **POST /posts/{post_id}/response** - Agregar Respuesta

**Autenticación:** ✅ Requerida (Bearer Token)

**Request Body:**
```json
{
  "content": "Te recomiendo empezar con los tutoriales de Python.org"
}
```

**Response (200):** (Retorna el post completo actualizado)
```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "¿Cómo aprender Python desde cero?",
  "description": "Estoy empezando...",
  "subject": "Programming",
  "owner": "Juan Pérez",
  "creation_date": "2024-10-27T21:30:00",
  "responses": [
    {
      "owner": "María García",
      "content": "Te recomiendo Codecademy",
      "creation_date": "2024-10-27T21:45:00"
    },
    {
      "owner": "Ana Martínez",  // ← Nueva respuesta agregada
      "content": "Te recomiendo empezar con los tutoriales de Python.org",
      "creation_date": "2024-10-27T22:30:00"
    }
  ]
}
```

**Proceso:**
1. Valida el token y obtiene el `user_id`
2. Busca el post en MongoDB
3. Agrega la respuesta al array `responses` usando `$push`
4. Usa agregación para enriquecer con nombres
5. Retorna el post completo actualizado

**Error (404):**
```json
{
  "detail": "Post not found"
}
```

---

### 5. **GET /posts/my/posts** - Obtener Mis Publicaciones

**Autenticación:** ✅ Requerida (Bearer Token)

**Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "¿Cómo aprender Python?",
    "description": "Estoy empezando...",
    "subject": "Programming",
    "owner": "Juan Pérez",
    "creation_date": "2024-10-27T21:30:00",
    "responses": [
      {
        "owner": "María García",
        "content": "Te recomiendo Codecademy",
        "creation_date": "2024-10-27T21:45:00"
      }
    ]
  }
]
```

**Proceso:**
1. Extrae el `user_id` del token
2. Busca todos los posts donde `owner == user_id`
3. Enriquece con nombres usando agregación
4. Retorna lista completa con todas las respuestas

---

### 6. **DELETE /posts/{post_id}** - Eliminar Publicación

**Autenticación:** ✅ Requerida (Bearer Token)

**Response (200):**
```json
{
  "message": "Post deleted"
}
```

**Proceso:**
1. Extrae el `user_id` del token
2. Busca el post con `_id == post_id` Y `owner == user_id`
3. Solo elimina si el usuario es el dueño
4. Retorna mensaje de éxito

**Error (404):**
```json
{
  "detail": "Post not found or not authorized"
}
```

---

## 🔄 Flujos Completos

### Flujo 1: Crear Publicación y Recibir Respuestas

```
┌─────────────┐
│   Usuario   │
│   (Juan)    │
└──────┬──────┘
       │
       │ 1. POST /posts/create
       │    Headers: Bearer TOKEN_Juan
       │    Body: {title, description, subject}
       ▼
┌─────────────┐
│  Backend    │──▶ Valida token → Obtiene user_id
│  Controller │──▶ Valida datos con Pydantic
└──────┬──────┘──▶ Crea post en MongoDB
       │
       ▼
┌─────────────┐
│  MongoDB    │──▶ Insert post:
│  posts      │    {
│             │      title, description, subject,
│             │      owner: ObjectId(juan_id),
│             │      responses: [],
│             │      creation_date
│             │    }
└──────┬──────┘
       │
       │ 2. Retorna post creado
       ▼
┌─────────────┐
│  Frontend   │──▶ Muestra post en lista
│             │    Actualiza UI
└─────────────┘

       │
       │ 3. Otro usuario ve el post
       ▼
┌─────────────┐
│   Usuario   │──▶ GET /posts/latest
│   (María)   │    Ve lista de posts
└──────┬──────┘
       │
       │ 4. Click en post
       ▼
┌─────────────┐
│  Frontend   │──▶ GET /posts/{post_id}
│             │    Obtiene detalles completos
└──────┬──────┘
       │
       │ 5. Escribe respuesta
       ▼
┌─────────────┐
│   Usuario   │──▶ POST /posts/{post_id}/response
│   (María)   │    Headers: Bearer TOKEN_Maria
│             │    Body: {content: "Recomiendo Codecademy"}
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  MongoDB    │──▶ Update post:
│             │    $push: {
│             │      responses: {
│             │        owner: ObjectId(maria_id),
│             │        content: "Recomiendo Codecademy",
│             │        creation_date
│             │      }
│             │    }
└──────┬──────┘
       │
       │ 6. Retorna post actualizado
       ▼
┌─────────────┐
│  Frontend   │──▶ Muestra nueva respuesta
│             │    Actualiza UI en tiempo real
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
│  - postsApi.getLatestPosts()                        │
│  - postsApi.createPost()                            │
│  - postsApi.addResponse()                           │
└─────────────────┬──────────────────────────────────┘
                   │ HTTP Requests
                   ▼
┌─────────────────────────────────────────────────────┐
│                    BACKEND                           │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  CONTROLLERS (controllers/post.py)          │   │
│  │  - Define endpoints                          │   │
│  │  - Valida autenticación                     │   │
│  │  - Maneja requests/responses                 │   │
│  └──────────────┬──────────────────────────────┘   │
│                 │                                    │
│                 ▼                                    │
│  ┌─────────────────────────────────────────────┐   │
│  │  SERVICES (services/post_service.py)         │   │
│  │  - Lógica de negocio                         │   │
│  │  - Agregaciones MongoDB                      │   │
│  │  - Enriquecimiento de datos                  │   │
│  └──────────────┬──────────────────────────────┘   │
│                 │                                    │
│                 ▼                                    │
│  ┌─────────────────────────────────────────────┐   │
│  │  MODELS (models/post.py)                     │   │
│  │  - Validación de datos (Pydantic)            │   │
│  │  - Estructura de respuestas                  │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────┬──────────────────────────────────┘
                  │ MongoDB Queries
                  ▼
┌─────────────────────────────────────────────────────┐
│                    MONGODB                           │
│                                                     │
│  - posts collection                                 │
│  - users collection (para enriquecer)               │
└─────────────────────────────────────────────────────┘
```

### Servicios Principales

#### 1. `create_post()`
```python
async def create_post(db, post: PostCreate, owner_id: str):
    # 1. Prepara datos
    post_data = {
        "title": post.title,
        "description": post.description,
        "subject": post.subject,
        "owner": ObjectId(owner_id),  # Convierte string a ObjectId
        "creation_date": datetime.utcnow(),
        "responses": [],  # Inicializa array vacío
    }
    
    # 2. Inserta en MongoDB
    result = await posts_collection.insert_one(post_data)
    
    # 3. Retorna post creado
    return post_data
```

#### 2. `get_latest_posts()` - Agregación MongoDB

Esta función usa una **pipeline de agregación** para:
1. Ordenar por fecha descendente
2. Limitar cantidad
3. Hacer JOIN con users para obtener nombres
4. Calcular cantidad de respuestas

```python
pipeline = [
    # 1. Ordenar por fecha (más recientes primero)
    {"$sort": {"creation_date": -1}},
    
    # 2. Limitar cantidad
    {"$limit": limit},
    
    # 3. JOIN con users (para obtener nombre del dueño)
    {
        "$lookup": {
            "from": "users",              # Colección a unir
            "localField": "owner",        # Campo del post (ObjectId)
            "foreignField": "_id",        # Campo del user (_id)
            "as": "owner_info"            # Resultado del JOIN
        }
    },
    
    # 4. Construir nombre completo (full_name + last_name)
    {
        "$addFields": {
            "owner": {
                "$concat": [
                    {"$arrayElemAt": ["$owner_info.full_name", 0]},
                    " ",
                    {"$arrayElemAt": ["$owner_info.last_name", 0]}
                ]
            }
        }
    },
    
    # 5. Proyectar campos finales
    {
        "$project": {
            "_id": {"$toString": "$_id"},  # Convertir ObjectId a string
            "title": 1,
            "description": 1,
            "subject": 1,
            "owner": 1,                     # Nombre completo
            "creation_date": 1,
            "responses_count": {"$size": "$responses"}  # Solo el número
        }
    }
]
```

**Resultado:**
- En MongoDB: `owner: ObjectId("690220c71f33b58f33665c36")`
- En API: `owner: "Juan Pérez"`

#### 3. `get_post_by_id()` - Agregación Compleja

Esta función hace una agregación más compleja para enriquecer:
- El nombre del dueño del post
- Los nombres de los dueños de cada respuesta

```python
pipeline = [
    # 1. Buscar post por ID
    {"$match": {"_id": ObjectId(post_id)}},
    
    # 2. JOIN para obtener nombre del dueño del post
    {
        "$lookup": {
            "from": "users",
            "localField": "owner",
            "foreignField": "_id",
            "as": "owner_info"
        }
    },
    
    # 3. Construir nombre del dueño
    {
        "$addFields": {
            "owner": {
                "$concat": [
                    {"$arrayElemAt": ["$owner_info.full_name", 0]},
                    " ",
                    {"$arrayElemAt": ["$owner_info.last_name", 0]}
                ]
            }
        }
    },
    
    # 4. Desenrollar array de respuestas (una por documento)
    {
        "$unwind": {
            "path": "$responses",
            "preserveNullAndEmptyArrays": True  # Si no hay respuestas, sigue funcionando
        }
    },
    
    # 5. JOIN para cada respuesta (obtener nombre del autor)
    {
        "$lookup": {
            "from": "users",
            "localField": "responses.owner",  # ObjectId del autor de la respuesta
            "foreignField": "_id",
            "as": "response_owner_info"
        }
    },
    
    # 6. Construir nombre del autor de cada respuesta
    {
        "$addFields": {
            "responses.owner": {
                "$cond": [
                    {"$gt": [{"$size": "$response_owner_info"}, 0]},
                    {
                        "$concat": [
                            {"$arrayElemAt": ["$response_owner_info.full_name", 0]},
                            " ",
                            {"$arrayElemAt": ["$response_owner_info.last_name", 0]}
                        ]
                    },
                    None
                ]
            }
        }
    },
    
    # 7. Agrupar de nuevo (volver a juntar todas las respuestas)
    {
        "$group": {
            "_id": "$_id",
            "title": {"$first": "$title"},
            "description": {"$first": "$description"},
            "subject": {"$first": "$subject"},
            "owner": {"$first": "$owner"},
            "creation_date": {"$first": "$creation_date"},
            "responses": {"$push": "$responses"}  # Reconstruir array
        }
    },
    
    # 8. Filtrar respuestas válidas y proyectar
    {
        "$project": {
            "_id": 1,
            "title": 1,
            "description": 1,
            "subject": 1,
            "owner": 1,
            "creation_date": 1,
            "responses": {
                "$filter": {
                    "input": "$responses",
                    "as": "response",
                    "cond": {"$ne": ["$$response.owner", None]}  # Solo respuestas válidas
                }
            }
        }
    }
]
```

**¿Por qué esta complejidad?**
- En MongoDB, `owner` y `responses[].owner` son ObjectIds
- Necesitamos nombres legibles para mostrar en el frontend
- MongoDB no tiene JOINs nativos, usamos `$lookup` (agregación)
- El proceso: buscar → unir → desenrollar → enriquecer → reagrupar

#### 4. `add_response_to_post()`

```python
async def add_response_to_post(db, post_id, response: ResponseCreate, owner_id):
    # 1. Crear nueva respuesta
    new_response = {
        "owner": ObjectId(owner_id),
        "content": response.content,
        "creation_date": datetime.utcnow()
    }
    
    # 2. Agregar al array usando $push
    await posts_collection.find_one_and_update(
        {"_id": ObjectId(post_id)},
        {"$push": {"responses": new_response}},  # Agrega al final del array
        return_document=True
    )
    
    # 3. Usar agregación para enriquecer (igual que get_post_by_id)
    # Retorna post completo actualizado
```

**Operación MongoDB:**
```javascript
db.posts.updateOne(
  {_id: ObjectId("507f1f77bcf86cd799439011")},
  {
    $push: {
      responses: {
        owner: ObjectId("690220c71f33b58f33665c37"),
        content: "Te recomiendo Codecademy",
        creation_date: ISODate("2024-10-27T21:45:00Z")
      }
    }
  }
)
```

---

## 💡 Ejemplos Prácticos

### Ejemplo 1: Usuario crea una publicación

**Paso 1: Usuario hace login**
```json
POST /auth/login
{
  "email": "juan@example.com",
  "password": "password123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Paso 2: Crear publicación**
```json
POST /posts/create
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
Body: {
  "title": "¿Cómo empezar con Python?",
  "description": "Soy nuevo en programación y quiero aprender Python. ¿Por dónde empiezo?",
  "subject": "Programming"
}

Response:
{
  "id": "507f1f77bcf86cd799439011",
  "title": "¿Cómo empezar con Python?",
  "description": "Soy nuevo en programación...",
  "subject": "Programming",
  "owner": "Juan Pérez",
  "creation_date": "2024-10-27T21:30:00",
  "responses": []
}
```

**Lo que pasó internamente:**
1. Backend validó el token → extrajo `user_id: "690220c71f33b58f33665c36"`
2. Validó datos con Pydantic (título mínimo 1 carácter, etc.)
3. Insertó en MongoDB:
   ```javascript
   {
     _id: ObjectId("507f1f77bcf86cd799439011"),
     title: "¿Cómo empezar con Python?",
     description: "Soy nuevo en programación...",
     subject: "Programming",
     owner: ObjectId("690220c71f33b58f33665c36"),  // ← ID de Juan
     creation_date: ISODate("2024-10-27T21:30:00Z"),
     responses: []
   }
   ```
4. Hizo `$lookup` con users para obtener nombre → "Juan Pérez"
5. Retornó el post enriquecido

---

### Ejemplo 2: Otro usuario responde

**Paso 1: María ve las publicaciones**
```json
GET /posts/latest?limit=10

Response:
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "¿Cómo empezar con Python?",
    "description": "Soy nuevo en programación...",
    "subject": "Programming",
    "owner": "Juan Pérez",
    "creation_date": "2024-10-27T21:30:00",
    "responses_count": 0  // ← Solo el número, no las respuestas
  }
]
```

**Paso 2: María hace click y ve detalles**
```json
GET /posts/507f1f77bcf86cd799439011

Response:
{
  "id": "507f1f77bcf86cd799439011",
  "title": "¿Cómo empezar con Python?",
  "description": "Soy nuevo en programación...",
  "subject": "Programming",
  "owner": "Juan Pérez",
  "creation_date": "2024-10-27T21:30:00",
  "responses": []  // ← Array completo (vacío por ahora)
}
```

**Paso 3: María agrega respuesta**
```json
POST /posts/507f1f77bcf86cd799439011/response
Headers: {
  "Authorization": "Bearer TOKEN_MARIA"
}
Body: {
  "content": "Te recomiendo empezar con los tutoriales oficiales de Python.org, son excelentes para principiantes."
}

Response: (Post completo actualizado)
{
  "id": "507f1f77bcf86cd799439011",
  "title": "¿Cómo empezar con Python?",
  "description": "Soy nuevo en programación...",
  "subject": "Programming",
  "owner": "Juan Pérez",
  "creation_date": "2024-10-27T21:30:00",
  "responses": [
    {
      "owner": "María García",  // ← Nombre enriquecido
      "content": "Te recomiendo empezar con los tutoriales oficiales...",
      "creation_date": "2024-10-27T21:45:00"
    }
  ]
}
```

**Lo que pasó internamente:**
1. Backend validó token de María → `user_id: "690220c71f33b58f33665c37"`
2. Buscó el post en MongoDB
3. Agregó respuesta al array:
   ```javascript
   db.posts.updateOne(
     {_id: ObjectId("507f1f77bcf86cd799439011")},
     {
       $push: {
         responses: {
           owner: ObjectId("690220c71f33b58f33665c37"),  // ← ID de María
           content: "Te recomiendo empezar...",
           creation_date: ISODate("2024-10-27T21:45:00Z")
         }
       }
     }
   )
   ```
4. Ejecutó agregación compleja para enriquecer nombres
5. Retornó post completo con la nueva respuesta

---

### Ejemplo 3: Ver mis propias publicaciones

**Usuario Juan quiere ver sus posts:**
```json
GET /posts/my/posts
Headers: {
  "Authorization": "Bearer TOKEN_JUAN"
}

Response:
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "¿Cómo empezar con Python?",
    "description": "Soy nuevo en programación...",
    "subject": "Programming",
    "owner": "Juan Pérez",
    "creation_date": "2024-10-27T21:30:00",
    "responses": [
      {
        "owner": "María García",
        "content": "Te recomiendo empezar...",
        "creation_date": "2024-10-27T21:45:00"
      },
      {
        "owner": "Carlos López",
        "content": "También puedes probar Codecademy",
        "creation_date": "2024-10-27T22:10:00"
      }
    ]
  }
]
```

**Lo que pasó:**
1. Backend extrajo `user_id` del token de Juan
2. Buscó todos los posts donde `owner == user_id`
3. Enriqueció con nombres usando agregación
4. Retornó lista completa con todas las respuestas

---

## 📐 Diagramas de Flujo Detallados

### Flujo Completo: Crear Post → Ver → Responder

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO COMPLETO                            │
└─────────────────────────────────────────────────────────────┘

Usuario Juan                    Backend                    MongoDB
      │                           │                           │
      │ 1. POST /posts/create     │                           │
      │    {title, description,   │                           │
      │     subject}              │                           │
      ├──────────────────────────▶│                           │
      │                           │                           │
      │                           │ 2. Validar token JWT      │
      │                           │    Extraer user_id        │
      │                           │                           │
      │                           │ 3. Validar datos          │
      │                           │    (Pydantic)            │
      │                           │                           │
      │                           │ 4. Insert post            │
      │                           ├──────────────────────────▶│
      │                           │                           │
      │                           │                           │ 5. Insert documento
      │                           │                           │    {
      │                           │                           │      _id: ObjectId(...)
      │                           │                           │      title: "..."
      │                           │                           │      owner: ObjectId(juan_id)
      │                           │                           │      responses: []
      │                           │                           │    }
      │                           │                           │
      │                           │ 6. $lookup con users      │
      │                           │◀──────────────────────────┤
      │                           │    owner: "Juan Pérez"    │
      │                           │                           │
      │ 7. Retorna post creado    │                           │
      │◀──────────────────────────┤                           │
      │                           │                           │
      │                           │                           │
      │ 8. GET /posts/latest      │                           │
      ├──────────────────────────▶│                           │
      │                           │                           │
      │                           │ 9. Query MongoDB          │
      │                           │    $sort: creation_date   │
      │                           │    $limit: 10            │
      │                           ├──────────────────────────▶│
      │                           │                           │
      │                           │ 10. $lookup users         │
      │                           │     Calcular responses_count
      │                           │◀──────────────────────────┤
      │                           │                           │
      │ 11. Lista de posts        │                           │
      │◀──────────────────────────┤                           │
      │                           │                           │
      │                           │                           │
      │ Usuario María             │                           │
      │                           │                           │
      │ 12. GET /posts/{id}       │                           │
      ├──────────────────────────▶│                           │
      │                           │                           │
      │                           │ 13. Agregación compleja    │
      │                           │     - $lookup owner       │
      │                           │     - $unwind responses  │
      │                           │     - $lookup cada response
      │                           │     - $group de nuevo     │
      │                           ├──────────────────────────▶│
      │                           │                           │
      │ 14. Post completo          │                           │
      │     con responses          │                           │
      │◀──────────────────────────┤                           │
      │                           │                           │
      │ 15. POST /posts/{id}/     │                           │
      │     response              │                           │
      │     {content: "..."}      │                           │
      ├──────────────────────────▶│                           │
      │                           │                           │
      │                           │ 16. $push response        │
      │                           ├──────────────────────────▶│
      │                           │                           │
      │                           │                           │ 17. Update documento
      │                           │                           │    $push: {responses: {...}}
      │                           │                           │
      │                           │ 18. Agregación para       │
      │                           │     enriquecer            │
      │                           │◀──────────────────────────┤
      │                           │                           │
      │ 19. Post actualizado      │                           │
      │     con nueva respuesta   │                           │
      │◀──────────────────────────┤                           │
```

---

## 🔍 Diferencias Clave: Lista vs Detalle

### GET /posts/latest (Lista)
```json
{
  "responses_count": 5  // ← Solo el número
}
```
- **Optimizado para velocidad**
- No carga todas las respuestas
- Solo muestra cantidad
- Útil para mostrar muchas publicaciones rápidamente

### GET /posts/{id} (Detalle)
```json
{
  "responses": [
    {
      "owner": "María García",
      "content": "Respuesta completa...",
      "creation_date": "..."
    }
  ]  // ← Array completo con todas las respuestas
}
```
- **Completo para mostrar detalles**
- Carga todas las respuestas
- Enriquece con nombres
- Útil cuando el usuario quiere leer todo

---

## 🎓 Conceptos Clave para Entender

### 1. **ObjectId vs String**
- **En MongoDB:** Se guarda como `ObjectId("690220c71f33b58f33665c36")`
- **En API:** Se retorna como string `"690220c71f33b58f33665c36"`
- **Conversión:** `ObjectId(user_id)` para guardar, `str(post["_id"])` para retornar

### 2. **Agregaciones MongoDB ($lookup)**
- **Propósito:** Hacer "JOINs" entre colecciones
- **Ejemplo:** Unir `posts.owner` (ObjectId) con `users._id` para obtener nombre
- **Resultado:** En lugar de `owner: ObjectId(...)`, obtenemos `owner: "Juan Pérez"`

### 3. **$push en MongoDB**
- **Propósito:** Agregar elementos a un array
- **Ejemplo:** Agregar respuesta al array `responses`
- **Operación atómica:** Se ejecuta todo o nada

### 4. **Validación con Pydantic**
- **Propósito:** Validar datos antes de guardar
- **Ejemplo:** `title: str = Field(..., min_length=1, max_length=255)`
- **Beneficio:** Asegura que los datos sean correctos antes de llegar a MongoDB

### 5. **Autenticación JWT**
- **Header:** `Authorization: Bearer TOKEN`
- **Proceso:** Backend valida token → extrae `user_id`
- **Seguridad:** Solo usuarios autenticados pueden crear/responder

---

## 📚 Resumen Final

### ¿Qué hace el módulo?
Permite a estudiantes crear preguntas y recibir respuestas de otros estudiantes.

### Endpoints principales:
1. **Crear** publicación → `POST /posts/create`
2. **Listar** últimas → `GET /posts/latest`
3. **Ver detalle** → `GET /posts/{id}`
4. **Responder** → `POST /posts/{id}/response`
5. **Mis posts** → `GET /posts/my/posts`
6. **Eliminar** → `DELETE /posts/{id}`

### Tecnologías clave:
- **FastAPI:** Framework backend
- **MongoDB:** Base de datos NoSQL
- **Motor:** Driver async para MongoDB
- **Pydantic:** Validación de datos
- **JWT:** Autenticación
- **Agregaciones MongoDB:** Para enriquecer datos

### Flujo típico:
1. Usuario crea publicación
2. Otros usuarios ven la lista
3. Click para ver detalles
4. Escriben respuesta
5. Respuesta aparece en tiempo real

---

¡Listo! Ahora entiendes completamente el módulo de Publicaciones. 🎉

