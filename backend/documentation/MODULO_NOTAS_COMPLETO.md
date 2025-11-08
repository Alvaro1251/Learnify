# 📚 MÓDULO DE NOTAS (NOTES) - GUÍA COMPLETA

## 📋 Índice

1. [¿Qué es el módulo de Notas?](#qué-es-el-módulo-de-notas)
2. [Estructura de Datos](#estructura-de-datos)
3. [Endpoints Disponibles](#endpoints-disponibles)
4. [Flujos Completos](#flujos-completos)
5. [Cómo Funciona Internamente](#cómo-funciona-internamente)
6. [Sistema de Búsqueda con Filtros](#sistema-de-búsqueda-con-filtros)
7. [Ejemplos Prácticos](#ejemplos-prácticos)
8. [Diagramas de Flujo](#diagramas-de-flujo)

---

## 🎯 ¿Qué es el módulo de Notas?

El módulo de **Notas (Notes)** es un sistema de gestión de apuntes donde los estudiantes pueden:

- ✅ **Subir apuntes** con metadatos (materia, universidad, carrera, tags)
- ✅ **Buscar apuntes** con filtros avanzados (universidad, carrera, materia, tags)
- ✅ **Ver apuntes** más recientes
- ✅ **Gestionar sus propios apuntes** (ver y eliminar)
- ✅ **Compartir archivos** mediante URLs externas

**Ejemplo de uso:**
- Un estudiante sube apuntes de "Python Básico" con tags ["python", "programming"]
- Otros estudiantes buscan por materia "Programming" o tag "python"
- Encuentran los apuntes y pueden descargar el archivo

**Diferencia clave con Posts:**
- **Posts:** Preguntas y respuestas (interactivo, discusión)
- **Notas:** Apuntes y archivos (contenido estático, descargable)

---

## 📊 Estructura de Datos

### En MongoDB (Base de Datos)

```javascript
// Colección: notes
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "title": "Python Basics - Variables y Tipos",
  "description": "Apuntes sobre variables, tipos de datos y operadores básicos en Python",
  "subject": "Programming",
  "university": "MIT",
  "career": "Computer Science",
  "tags": ["python", "programming", "beginner"],
  "file_url": "https://example.com/python-basics.pdf",
  "owner": "690220c71f33b58f33665c36",  // ← String (no ObjectId en este módulo)
  "created_at": ISODate("2024-10-27T21:30:00Z"),
  "updated_at": ISODate("2024-10-27T21:30:00Z")
}
```

**Nota importante:** En este módulo, `owner` se guarda como **string** (no ObjectId), a diferencia de posts. Esto se enriquece después con nombres.

### Modelos Pydantic (Validación de Datos)

#### 1. `NoteCreate` - Datos para crear una nota
```python
class NoteCreate(BaseModel):
    title: str          # Título (1-255 caracteres)
    description: str   # Descripción (mínimo 1 carácter)
    subject: str        # Materia/asignatura (mínimo 1 carácter)
    university: str    # Universidad (mínimo 1 carácter)
    career: str        # Carrera (mínimo 1 carácter)
    tags: List[str]    # Tags (opcional, array de strings)
    file_url: Optional[str]  # URL del archivo (opcional)
```

#### 2. `NoteResponse` - Respuesta de la API
```python
class NoteResponse(BaseModel):
    id: str                    # ID de la nota
    title: str                 # Título
    description: str           # Descripción
    subject: str              # Materia
    university: str           # Universidad
    career: str               # Carrera
    tags: List[str]           # Tags
    file_url: Optional[str]   # URL del archivo
    owner: str                # Nombre completo del dueño (ej: "Juan Pérez")
    created_at: datetime      # Fecha de creación
    updated_at: datetime      # Fecha de última actualización
```

---

## 🔌 Endpoints Disponibles

### 1. **POST /notes/create** - Crear Nota

**Autenticación:** ✅ Requerida (Bearer Token)

**Request Body:**
```json
{
  "title": "Python Basics - Variables y Tipos",
  "description": "Apuntes sobre variables, tipos de datos y operadores básicos en Python",
  "subject": "Programming",
  "university": "MIT",
  "career": "Computer Science",
  "tags": ["python", "programming", "beginner"],
  "file_url": "https://example.com/python-basics.pdf"
}
```

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "Python Basics - Variables y Tipos",
  "description": "Apuntes sobre variables...",
  "subject": "Programming",
  "university": "MIT",
  "career": "Computer Science",
  "tags": ["python", "programming", "beginner"],
  "file_url": "https://example.com/python-basics.pdf",
  "owner": "Juan Pérez",
  "created_at": "2024-10-27T21:30:00",
  "updated_at": "2024-10-27T21:30:00"
}
```

**Proceso:**
1. Valida los datos con Pydantic
2. Extrae el `user_id` del token JWT
3. Crea la nota en MongoDB con `owner` como string
4. Enriquece con el nombre del dueño usando función helper
5. Retorna la nota enriquecida

---

### 2. **GET /notes/{note_id}** - Obtener Nota por ID

**Autenticación:** ❌ No requerida (público)

**Ejemplo:**
```
GET /notes/507f1f77bcf86cd799439011
```

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "Python Basics - Variables y Tipos",
  "description": "Apuntes sobre variables...",
  "subject": "Programming",
  "university": "MIT",
  "career": "Computer Science",
  "tags": ["python", "programming", "beginner"],
  "file_url": "https://example.com/python-basics.pdf",
  "owner": "Juan Pérez",
  "created_at": "2024-10-27T21:30:00",
  "updated_at": "2024-10-27T21:30:00"
}
```

**Proceso:**
1. Busca la nota por ID en MongoDB
2. Enriquece con nombre del dueño
3. Retorna la nota completa

**Error (404):**
```json
{
  "detail": "Note not found"
}
```

---

### 3. **GET /notes/** - Buscar Notas con Filtros

**Autenticación:** ❌ No requerida (público)

**Query Parameters (todos opcionales):**
- `university` - Filtrar por universidad (case-insensitive)
- `career` - Filtrar por carrera (case-insensitive)
- `subject` - Filtrar por materia (case-insensitive)
- `tags` - Filtrar por tags (puede pasar múltiples veces)

**Ejemplos de uso:**

```
# Por universidad
GET /notes/?university=MIT

# Por carrera
GET /notes/?career=Computer%20Science

# Por materia
GET /notes/?subject=Programming

# Por un tag
GET /notes/?tags=python

# Por múltiples tags
GET /notes/?tags=python&tags=beginner

# Combinado (todos los filtros)
GET /notes/?university=MIT&career=Computer%20Science&subject=Programming&tags=python
```

**Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "Python Basics",
    "description": "Fundamentos de Python",
    "subject": "Programming",
    "university": "MIT",
    "career": "Computer Science",
    "tags": ["python", "programming", "beginner"],
    "file_url": "https://example.com/python.pdf",
    "owner": "Juan Pérez",
    "created_at": "2024-10-27T21:30:00",
    "updated_at": "2024-10-27T21:30:00"
  },
  {
    "id": "507f1f77bcf86cd799439012",
    "title": "Advanced Python",
    "description": "Conceptos avanzados",
    "subject": "Programming",
    "university": "MIT",
    "career": "Computer Science",
    "tags": ["python", "advanced"],
    "file_url": "https://example.com/advanced-python.pdf",
    "owner": "María García",
    "created_at": "2024-10-27T20:15:00",
    "updated_at": "2024-10-27T20:15:00"
  }
]
```

**Proceso:**
1. Construye query de MongoDB con filtros
2. Usa regex case-insensitive para texto
3. Usa `$in` para tags múltiples
4. Busca notas que coincidan
5. Enriquece con nombres de dueños
6. Retorna lista filtrada

---

### 4. **GET /notes/latest/notes** - Obtener Últimas 3 Notas

**Autenticación:** ❌ No requerida (público)

**Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "Python Basics",
    "description": "Fundamentos de Python",
    "subject": "Programming",
    "university": "MIT",
    "career": "Computer Science",
    "tags": ["python", "beginner"],
    "file_url": "https://example.com/python.pdf",
    "owner": "Juan Pérez",
    "created_at": "2024-10-27T21:30:00",
    "updated_at": "2024-10-27T21:30:00"
  },
  {
    "id": "507f1f77bcf86cd799439012",
    "title": "JavaScript Tips",
    "description": "Consejos útiles de JavaScript",
    "subject": "Programming",
    "university": "Stanford",
    "career": "Web Development",
    "tags": ["javascript", "web"],
    "file_url": "https://example.com/js-tips.pdf",
    "owner": "María García",
    "created_at": "2024-10-27T20:15:00",
    "updated_at": "2024-10-27T20:15:00"
  },
  {
    "id": "507f1f77bcf86cd799439013",
    "title": "Database Design",
    "description": "Introducción a bases de datos",
    "subject": "Databases",
    "university": "Harvard",
    "career": "Data Science",
    "tags": ["database", "sql"],
    "file_url": "https://example.com/db-design.pdf",
    "owner": "Carlos López",
    "created_at": "2024-10-27T19:00:00",
    "updated_at": "2024-10-27T19:00:00"
  }
]
```

**Proceso:**
1. Ordena notas por `created_at` descendente (más recientes primero)
2. Limita a 3 resultados
3. Enriquece con nombres
4. Retorna las 3 notas más recientes

---

### 5. **GET /notes/my/notes** - Obtener Mis Notas

**Autenticación:** ✅ Requerida (Bearer Token)

**Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "Python Basics",
    "description": "Fundamentos de Python",
    "subject": "Programming",
    "university": "MIT",
    "career": "Computer Science",
    "tags": ["python", "beginner"],
    "file_url": "https://example.com/python.pdf",
    "owner": "Juan Pérez",
    "created_at": "2024-10-27T21:30:00",
    "updated_at": "2024-10-27T21:30:00"
  }
]
```

**Proceso:**
1. Extrae el `user_id` del token
2. Busca todas las notas donde `owner == user_id`
3. Enriquece con nombres
4. Retorna lista de notas del usuario

---

### 6. **DELETE /notes/{note_id}** - Eliminar Nota

**Autenticación:** ✅ Requerida (Bearer Token)

**Response (200):**
```json
{
  "message": "Note deleted"
}
```

**Proceso:**
1. Extrae el `user_id` del token
2. Busca la nota con `_id == note_id` Y `owner == user_id`
3. Solo elimina si el usuario es el dueño
4. Retorna mensaje de éxito

**Error (404):**
```json
{
  "detail": "Note not found or not authorized"
}
```

---

## 🔄 Flujos Completos

### Flujo 1: Crear Nota y Buscarla

```
┌─────────────┐
│   Usuario   │
│   (Juan)    │
└──────┬──────┘
       │
       │ 1. POST /notes/create
       │    Headers: Bearer TOKEN_Juan
       │    Body: {
       │      title, description, subject,
       │      university, career, tags, file_url
       │    }
       ▼
┌─────────────┐
│  Backend    │──▶ Valida token → Obtiene user_id
│  Controller │──▶ Valida datos con Pydantic
└──────┬──────┘──▶ Crea nota en MongoDB
       │
       ▼
┌─────────────┐
│  MongoDB    │──▶ Insert note:
│  notes      │    {
│             │      title, description, subject,
│             │      university, career, tags,
│             │      file_url,
│             │      owner: "user_id" (string),
│             │      created_at, updated_at
│             │    }
└──────┬──────┘
       │
       │ 2. Enriquecer con nombre
       │    (_enrich_notes_with_owner_names)
       ▼
┌─────────────┐
│  Backend    │──▶ Busca usuario en users collection
│  Service    │──▶ Obtiene full_name + last_name
│             │──▶ Reemplaza owner con "Juan Pérez"
└──────┬──────┘
       │
       │ 3. Retorna nota creada
       ▼
┌─────────────┐
│  Frontend   │──▶ Muestra nota en lista
│             │    Actualiza UI
└─────────────┘

       │
       │ 4. Otro usuario busca notas
       ▼
┌─────────────┐
│   Usuario   │──▶ GET /notes/?subject=Programming
│   (María)   │              &tags=python
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Backend    │──▶ Construye query MongoDB:
│  Service    │    {
│             │      subject: {$regex: "Programming", $options: "i"},
│             │      tags: {$in: ["python"]}
│             │    }
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  MongoDB    │──▶ Find notas que coincidan
│             │    Retorna lista de notas
└──────┬──────┘
       │
       │ 5. Enriquecer todas las notas
       ▼
┌─────────────┐
│  Backend    │──▶ Para cada nota:
│  Service    │    - Busca owner en users
│             │    - Reemplaza con nombre
└──────┬──────┘
       │
       │ 6. Retorna lista filtrada
       ▼
┌─────────────┐
│  Frontend   │──▶ Muestra notas encontradas
│             │    Permite filtrar más
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
│  - notesApi.searchNotes()                           │
│  - notesApi.createNote()                            │
│  - notesApi.getLatestNotes()                        │
└─────────────────┬──────────────────────────────────┘
                   │ HTTP Requests
                   ▼
┌─────────────────────────────────────────────────────┐
│                    BACKEND                           │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  CONTROLLERS (controllers/note.py)          │   │
│  │  - Define endpoints                          │   │
│  │  - Valida autenticación                     │   │
│  │  - Maneja requests/responses                 │   │
│  └──────────────┬──────────────────────────────┘   │
│                 │                                    │
│                 ▼                                    │
│  ┌─────────────────────────────────────────────┐   │
│  │  SERVICES (services/note_service.py)         │   │
│  │  - Lógica de negocio                         │   │
│  │  - Búsquedas con filtros                     │   │
│  │  - Enriquecimiento de datos                  │   │
│  └──────────────┬──────────────────────────────┘   │
│                 │                                    │
│                 ▼                                    │
│  ┌─────────────────────────────────────────────┐   │
│  │  MODELS (models/note.py)                     │   │
│  │  - Validación de datos (Pydantic)            │   │
│  │  - Estructura de respuestas                  │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────┬──────────────────────────────────┘
                  │ MongoDB Queries
                  ▼
┌─────────────────────────────────────────────────────┐
│                    MONGODB                           │
│                                                     │
│  - notes collection                                 │
│  - users collection (para enriquecer)               │
└─────────────────────────────────────────────────────┘
```

### Servicios Principales

#### 1. `create_note()`
```python
async def create_note(db, note: NoteCreate, owner_id: str):
    # 1. Prepara datos
    note_data = {
        "title": note.title,
        "description": note.description,
        "subject": note.subject,
        "university": note.university,
        "career": note.career,
        "tags": note.tags,
        "file_url": note.file_url,
        "owner": owner_id,  # String, no ObjectId
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    # 2. Inserta en MongoDB
    result = await notes_collection.insert_one(note_data)
    note_data["_id"] = result.inserted_id
    
    # 3. Enriquece con nombre del dueño
    await _enrich_notes_with_owner_names(db, [note_data])
    
    # 4. Retorna nota creada
    return NoteInDB(**note_data)
```

#### 2. `search_notes()` - Sistema de Búsqueda con Filtros

Esta función construye una query dinámica basada en los filtros proporcionados:

```python
async def search_notes(db, university=None, career=None, subject=None, tags=None):
    query = {}
    
    # 1. Filtro por universidad (case-insensitive)
    if university:
        query["university"] = {
            "$regex": university,      # Busca el texto
            "$options": "i"             # Case-insensitive (no importa mayúsculas/minúsculas)
        }
    
    # 2. Filtro por carrera (case-insensitive)
    if career:
        query["career"] = {
            "$regex": career,
            "$options": "i"
        }
    
    # 3. Filtro por materia (case-insensitive)
    if subject:
        query["subject"] = {
            "$regex": subject,
            "$options": "i"
        }
    
    # 4. Filtro por tags (array)
    if tags:
        query["tags"] = {
            "$in": tags  # Nota debe tener al menos uno de estos tags
        }
    
    # 5. Ejecutar búsqueda
    notes = await notes_collection.find(query).to_list(length=None)
    
    # 6. Enriquecer con nombres
    await _enrich_notes_with_owner_names(db, notes)
    
    return [NoteInDB(**note) for note in notes]
```

**Ejemplo de query construida:**
```javascript
// Si se busca: university=MIT, subject=Programming, tags=["python"]
{
  "university": {$regex: "MIT", $options: "i"},
  "subject": {$regex: "Programming", $options: "i"},
  "tags": {$in: ["python"]}
}
```

**Ejemplos de coincidencias:**
- `"MIT"` coincide con `"MIT"`, `"mit"`, `"Mit University"`
- `"Programming"` coincide con `"Programming"`, `"programming"`, `"PROGRAMMING"`
- `tags: ["python"]` encuentra notas que tengan "python" en su array de tags

#### 3. `_enrich_notes_with_owner_names()` - Función Helper

Esta función enriquece las notas con los nombres de los dueños:

```python
async def _enrich_notes_with_owner_names(db, notes):
    # 1. Extraer todos los owner IDs únicos
    owner_candidates = []
    for note in notes:
        owner_value = note.get("owner")
        if isinstance(owner_value, ObjectId):
            owner_candidates.append(str(owner_value))
        elif isinstance(owner_value, str):
            owner_candidates.append(owner_value)
    
    # 2. Buscar usuarios en batch (una sola query)
    owner_map = await _fetch_owner_display_map(db, owner_candidates)
    # Retorna: {"user_id_1": "Juan Pérez", "user_id_2": "María García"}
    
    # 3. Reemplazar owner con nombre en cada nota
    for note in notes:
        owner_key = str(note.get("owner"))
        display_name = owner_map.get(owner_key)
        note["owner"] = display_name or owner_key  # Usa nombre o fallback a ID
        note["_id"] = str(note["_id"])  # Convertir ObjectId a string
```

**Ventajas de este enfoque:**
- **Eficiente:** Una sola query para obtener todos los usuarios necesarios
- **Batch processing:** No hace una query por cada nota
- **Fallback:** Si no encuentra nombre, usa el ID

#### 4. `get_latest_notes()`

```python
async def get_latest_notes(db, limit=3):
    # 1. Ordenar por fecha descendente
    # 2. Limitar cantidad
    notes = (
        await notes_collection.find({})
        .sort("created_at", -1)  # -1 = descendente
        .limit(limit)
        .to_list(length=limit)
    )
    
    # 3. Enriquecer con nombres
    await _enrich_notes_with_owner_names(db, notes)
    
    return [NoteInDB(**note) for note in notes]
```

#### 5. `delete_note()`

```python
async def delete_note(db, note_id, user_id):
    # 1. Eliminar solo si el usuario es el dueño
    result = await notes_collection.delete_one(
        {
            "_id": ObjectId(note_id),
            "owner": user_id  # Verifica que es el dueño
        }
    )
    
    # 2. Retorna True si se eliminó algo
    return result.deleted_count > 0
```

---

## 🔍 Sistema de Búsqueda con Filtros

### Cómo Funcionan los Filtros

#### 1. **Filtro por Texto (University, Career, Subject)**

```python
# Usa regex case-insensitive
query["university"] = {
    "$regex": "MIT",
    "$options": "i"  # Case-insensitive
}
```

**Coincide con:**
- ✅ "MIT"
- ✅ "mit"
- ✅ "Mit University"
- ✅ "MIT - Massachusetts"
- ❌ "Harvard" (no contiene "MIT")

#### 2. **Filtro por Tags (Array)**

```python
# Usa $in para buscar en arrays
query["tags"] = {
    "$in": ["python", "beginner"]
}
```

**Coincide con notas que tengan:**
- ✅ `tags: ["python"]`
- ✅ `tags: ["python", "beginner"]`
- ✅ `tags: ["python", "advanced"]`
- ❌ `tags: ["javascript"]` (no tiene "python")

**Múltiples tags:**
```python
# GET /notes/?tags=python&tags=beginner
# Busca notas que tengan AMBOS tags
query["tags"] = {
    "$in": ["python", "beginner"]
}
```

**Nota:** `$in` significa "tiene al menos uno de estos", no "tiene todos".

#### 3. **Filtros Combinados**

```python
# GET /notes/?university=MIT&career=CS&subject=Programming&tags=python
query = {
    "university": {$regex: "MIT", $options: "i"},
    "career": {$regex: "CS", $options: "i"},
    "subject": {$regex: "Programming", $options: "i"},
    "tags": {$in: ["python"]}
}
```

**Resultado:** Notas que cumplan TODAS las condiciones (AND lógico).

### Índices de MongoDB

Para optimizar las búsquedas, se crean índices:

```python
async def create_note_indexes(db):
    notes_collection = db["notes"]
    await notes_collection.create_index("university")  # Búsquedas rápidas por universidad
    await notes_collection.create_index("career")      # Búsquedas rápidas por carrera
    await notes_collection.create_index("subject")     # Búsquedas rápidas por materia
    await notes_collection.create_index("tags")        # Búsquedas rápidas por tags
    await notes_collection.create_index("owner")       # Búsquedas rápidas por dueño
    await notes_collection.create_index("created_at")  # Ordenamiento rápido
```

**Beneficios:**
- Búsquedas más rápidas
- Mejor rendimiento con muchos datos
- MongoDB usa índices automáticamente

---

## 💡 Ejemplos Prácticos

### Ejemplo 1: Usuario crea una nota

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

**Paso 2: Crear nota**
```json
POST /notes/create
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
Body: {
  "title": "Python Basics - Variables y Tipos",
  "description": "Apuntes sobre variables, tipos de datos y operadores básicos en Python",
  "subject": "Programming",
  "university": "MIT",
  "career": "Computer Science",
  "tags": ["python", "programming", "beginner"],
  "file_url": "https://example.com/python-basics.pdf"
}

Response:
{
  "id": "507f1f77bcf86cd799439011",
  "title": "Python Basics - Variables y Tipos",
  "description": "Apuntes sobre variables...",
  "subject": "Programming",
  "university": "MIT",
  "career": "Computer Science",
  "tags": ["python", "programming", "beginner"],
  "file_url": "https://example.com/python-basics.pdf",
  "owner": "Juan Pérez",
  "created_at": "2024-10-27T21:30:00",
  "updated_at": "2024-10-27T21:30:00"
}
```

**Lo que pasó internamente:**
1. Backend validó el token → extrajo `user_id: "690220c71f33b58f33665c36"`
2. Validó datos con Pydantic
3. Insertó en MongoDB:
   ```javascript
   {
     _id: ObjectId("507f1f77bcf86cd799439011"),
     title: "Python Basics - Variables y Tipos",
     description: "Apuntes sobre variables...",
     subject: "Programming",
     university: "MIT",
     career: "Computer Science",
     tags: ["python", "programming", "beginner"],
     file_url: "https://example.com/python-basics.pdf",
     owner: "690220c71f33b58f33665c36",  // ← String (no ObjectId)
     created_at: ISODate("2024-10-27T21:30:00Z"),
     updated_at: ISODate("2024-10-27T21:30:00Z")
   }
   ```
4. Enriqueció con nombre: buscó usuario en `users` collection → "Juan Pérez"
5. Retornó la nota enriquecida

---

### Ejemplo 2: Buscar notas con filtros

**Paso 1: Buscar por materia**
```json
GET /notes/?subject=Programming

Response:
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "Python Basics",
    "subject": "Programming",
    "university": "MIT",
    "career": "Computer Science",
    "tags": ["python", "beginner"],
    "owner": "Juan Pérez",
    ...
  },
  {
    "id": "507f1f77bcf86cd799439012",
    "title": "JavaScript Tips",
    "subject": "Programming",
    "university": "Stanford",
    "career": "Web Development",
    "tags": ["javascript"],
    "owner": "María García",
    ...
  }
]
```

**Lo que pasó:**
1. Backend construyó query:
   ```javascript
   {
     "subject": {$regex: "Programming", $options: "i"}
   }
   ```
2. MongoDB encontró todas las notas con subject que contenga "Programming"
3. Enriqueció con nombres de dueños
4. Retornó lista filtrada

**Paso 2: Buscar con múltiples filtros**
```json
GET /notes/?university=MIT&career=Computer%20Science&subject=Programming&tags=python

Response:
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "Python Basics",
    "subject": "Programming",
    "university": "MIT",
    "career": "Computer Science",
    "tags": ["python", "beginner"],
    "owner": "Juan Pérez",
    ...
  }
]
```

**Lo que pasó:**
1. Backend construyó query combinada:
   ```javascript
   {
     "university": {$regex: "MIT", $options: "i"},
     "career": {$regex: "Computer Science", $options: "i"},
     "subject": {$regex: "Programming", $options: "i"},
     "tags": {$in: ["python"]}
   }
   ```
2. MongoDB encontró solo notas que cumplan TODAS las condiciones
3. Retornó resultado filtrado

---

### Ejemplo 3: Ver últimas notas

**Usuario quiere ver las 3 notas más recientes:**
```json
GET /notes/latest/notes

Response:
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "Python Basics",
    "created_at": "2024-10-27T21:30:00",  // ← Más reciente
    "owner": "Juan Pérez",
    ...
  },
  {
    "id": "507f1f77bcf86cd799439012",
    "title": "JavaScript Tips",
    "created_at": "2024-10-27T20:15:00",
    "owner": "María García",
    ...
  },
  {
    "id": "507f1f77bcf86cd799439013",
    "title": "Database Design",
    "created_at": "2024-10-27T19:00:00",  // ← Menos reciente
    "owner": "Carlos López",
    ...
  }
]
```

**Lo que pasó:**
1. Backend ordenó por `created_at` descendente
2. Limitó a 3 resultados
3. Enriqueció con nombres
4. Retornó las 3 más recientes

---

## 📐 Diagramas de Flujo Detallados

### Flujo Completo: Crear Nota → Buscar → Ver

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO COMPLETO                            │
└─────────────────────────────────────────────────────────────┘

Usuario Juan                    Backend                    MongoDB
      │                           │                           │
      │ 1. POST /notes/create     │                           │
      │    {title, description,   │                           │
      │     subject, university,  │                           │
      │     career, tags,         │                           │
      │     file_url}             │                           │
      ├──────────────────────────▶│                           │
      │                           │                           │
      │                           │ 2. Validar token JWT      │
      │                           │    Extraer user_id        │
      │                           │                           │
      │                           │ 3. Validar datos          │
      │                           │    (Pydantic)            │
      │                           │                           │
      │                           │ 4. Insert note            │
      │                           ├──────────────────────────▶│
      │                           │                           │
      │                           │                           │ 5. Insert documento
      │                           │                           │    {
      │                           │                           │      _id: ObjectId(...)
      │                           │                           │      title: "..."
      │                           │                           │      owner: "user_id" (string)
      │                           │                           │      tags: ["python"]
      │                           │                           │      ...
      │                           │                           │    }
      │                           │                           │
      │                           │ 6. Enriquecer con nombre  │
      │                           │    Buscar en users        │
      │                           │◀──────────────────────────┤
      │                           │    owner: "Juan Pérez"    │
      │                           │                           │
      │ 7. Retorna nota creada    │                           │
      │◀──────────────────────────┤                           │
      │                           │                           │
      │                           │                           │
      │ Usuario María             │                           │
      │                           │                           │
      │ 8. GET /notes/?           │                           │
      │    subject=Programming    │                           │
      │    &tags=python           │                           │
      ├──────────────────────────▶│                           │
      │                           │                           │
      │                           │ 9. Construir query        │
      │                           │    {
      │                           │      subject: {$regex: "Programming", $options: "i"},
      │                           │      tags: {$in: ["python"]}
      │                           │    }                      │
      │                           │                           │
      │                           │ 10. Query MongoDB         │
      │                           ├──────────────────────────▶│
      │                           │                           │
      │                           │                           │ 11. Find notas que coincidan
      │                           │                           │
      │                           │ 12. Enriquecer todas      │
      │                           │◀──────────────────────────┤
      │                           │    notas con nombres      │
      │                           │                           │
      │ 13. Lista de notas        │                           │
      │     filtradas             │                           │
      │◀──────────────────────────┤                           │
      │                           │                           │
      │ 14. GET /notes/{id}       │                           │
      │     Ver detalle           │                           │
      ├──────────────────────────▶│                           │
      │                           │                           │
      │                           │ 15. Buscar nota por ID    │
      │                           │     Enriquecer            │
      │                           ├──────────────────────────▶│
      │                           │                           │
      │ 16. Nota completa         │                           │
      │     con todos los datos   │                           │
      │◀──────────────────────────┤                           │
```

---

## 🔍 Diferencias Clave: Notas vs Posts

### Notas
- **Propósito:** Contenido estático (apuntes, archivos)
- **Estructura:** Metadatos (universidad, carrera, tags)
- **Búsqueda:** Filtros avanzados (universidad, carrera, materia, tags)
- **Owner:** Guardado como string
- **Interacción:** Descarga de archivos, no respuestas

### Posts
- **Propósito:** Preguntas y respuestas (interactivo)
- **Estructura:** Título, descripción, materia
- **Búsqueda:** Solo por lista reciente
- **Owner:** Guardado como ObjectId
- **Interacción:** Sistema de respuestas

---

## 🎓 Conceptos Clave para Entender

### 1. **Regex Case-Insensitive**
```python
query["university"] = {
    "$regex": "MIT",
    "$options": "i"  # No importa mayúsculas/minúsculas
}
```
- **Propósito:** Buscar texto sin importar mayúsculas/minúsculas
- **Ejemplo:** "MIT" coincide con "mit", "Mit", "MIT"

### 2. **$in para Arrays**
```python
query["tags"] = {
    "$in": ["python", "beginner"]
}
```
- **Propósito:** Buscar en arrays
- **Significado:** "Tiene al menos uno de estos valores"
- **Ejemplo:** Encuentra notas con tags que contengan "python" o "beginner"

### 3. **Enriquecimiento de Datos**
- **Problema:** En MongoDB guardamos `owner: "user_id"` (string)
- **Solución:** Buscar en `users` collection para obtener nombre
- **Resultado:** API retorna `owner: "Juan Pérez"` en lugar de ID

### 4. **Índices de MongoDB**
- **Propósito:** Acelerar búsquedas
- **Creados para:** university, career, subject, tags, owner, created_at
- **Beneficio:** Búsquedas rápidas incluso con muchos datos

### 5. **Owner como String**
- **En este módulo:** `owner` se guarda como string (no ObjectId)
- **Razón:** Simplifica algunas operaciones
- **Enriquecimiento:** Se hace después con función helper

---

## 📚 Resumen Final

### ¿Qué hace el módulo?
Permite a estudiantes subir apuntes con metadatos y buscarlos con filtros avanzados.

### Endpoints principales:
1. **Crear** nota → `POST /notes/create`
2. **Buscar** con filtros → `GET /notes/?university=...&subject=...&tags=...`
3. **Ver detalle** → `GET /notes/{id}`
4. **Últimas 3** → `GET /notes/latest/notes`
5. **Mis notas** → `GET /notes/my/notes`
6. **Eliminar** → `DELETE /notes/{id}`

### Tecnologías clave:
- **FastAPI:** Framework backend
- **MongoDB:** Base de datos NoSQL
- **Regex:** Búsquedas case-insensitive
- **$in operator:** Búsqueda en arrays
- **Índices:** Optimización de búsquedas
- **Pydantic:** Validación de datos
- **JWT:** Autenticación

### Flujo típico:
1. Usuario crea nota con metadatos
2. Otros usuarios buscan con filtros
3. Encuentran notas relevantes
4. Descargar archivos desde URLs

### Características especiales:
- ✅ Búsqueda con múltiples filtros simultáneos
- ✅ Case-insensitive (no importa mayúsculas/minúsculas)
- ✅ Búsqueda por tags múltiples
- ✅ Enriquecimiento automático de nombres
- ✅ Índices para búsquedas rápidas

---

¡Listo! Ahora entiendes completamente el módulo de Notas. 🎉

