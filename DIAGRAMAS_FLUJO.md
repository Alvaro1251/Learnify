# 📊 Diagramas de Flujo - Learnify

Este documento contiene diagramas de flujo ASCII para visualizar cómo funcionan los procesos principales del sistema.

---

## 🔐 1. Flujo de Autenticación y Registro

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │
       │ 1. Registro
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│  Frontend   │──▶│  Backend    │
│  Signup     │   │ /auth/       │
│  Form       │   │ register     │
└─────────────┘   └──────┬──────┘
                          │
                          │ 2. Validar email/password
                          │    Hash password (bcrypt)
                          │
                          ▼
                   ┌─────────────┐
                   │  MongoDB     │
                   │  users      │
                   │  collection │
                   └──────┬──────┘
                          │
                          │ 3. Crear usuario
                          │
                          ▼
                   ┌─────────────┐
                   │  Backend    │
                   │  Genera JWT │
                   │  Token      │
                   └──────┬──────┘
                          │
                          │ 4. Retorna token
                          │
                          ▼
                   ┌─────────────┐
                   │  Frontend   │
                   │  Guarda    │
                   │  token en  │
                   │  storage   │
                   └─────────────┘
```

### Login

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │
       │ 1. Login
       ▼
┌─────────────┐
│  Frontend   │──▶ POST /auth/login
│  Login Form │    {email, password}
└─────────────┘
       │
       ▼
┌─────────────┐
│  Backend    │──▶ Buscar usuario en MongoDB
│ /auth/login │    Verificar password
└──────┬──────┘    Generar JWT token
       │
       │ 2. Token válido
       ▼
┌─────────────┐
│  MongoDB    │
│  users      │
└──────┬──────┘
       │
       │ 3. Retorna token
       ▼
┌─────────────┐
│  Frontend   │──▶ Guarda token
│  Redirige  │    Redirige a /app
│  a /app    │
└─────────────┘
```

---

## 📝 2. Flujo de Publicaciones (Posts)

### Crear Publicación

```
┌─────────────┐
│   Usuario   │
│  Autenticado│
└──────┬──────┘
       │
       │ 1. Crear publicación
       ▼
┌─────────────┐
│  Frontend   │──▶ POST /posts/create
│  Create Post│    Headers: Bearer TOKEN
│  Dialog     │    Body: {title, description, subject}
└─────────────┘
       │
       ▼
┌─────────────┐
│  Backend    │──▶ Verificar token
│  Controller │    Obtener user_id del token
│  post.py    │    Crear post en MongoDB
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  MongoDB    │──▶ Insert en posts collection
│  posts      │    {
│  collection │      title, description, subject,
│             │      owner: ObjectId(user_id),
│             │      responses: [],
│             │      creation_date
│             │    }
└──────┬──────┘
       │
       │ 2. Enriquecer con nombre del owner
       │    ($lookup con users collection)
       ▼
┌─────────────┐
│  Backend    │──▶ Retorna PostDetailResponse
│  Service    │    {
│             │      id, title, description,
│             │      owner: "Juan Pérez",  ← nombre
│             │      responses: []
│             │    }
└──────┬──────┘
       │
       │ 3. Mostrar en UI
       ▼
┌─────────────┐
│  Frontend   │──▶ Actualiza lista de posts
│  Posts List │    Muestra nuevo post
└─────────────┘
```

### Agregar Respuesta

```
┌─────────────┐
│   Usuario   │
│  (Juan)     │
└──────┬──────┘
       │
       │ 1. Ver post de María
       ▼
┌─────────────┐
│  Frontend   │──▶ GET /posts/{post_id}
│  Post Detail│    Retorna post con responses
└──────┬──────┘
       │
       │ 2. Escribir respuesta
       ▼
┌─────────────┐
│  Frontend   │──▶ POST /posts/{post_id}/response
│  Add        │    Headers: Bearer TOKEN_Juan
│  Response   │    Body: {content: "Buena pregunta!"}
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Backend    │──▶ Verificar token
│  Controller │    Obtener user_id (Juan)
│             │    Buscar post en MongoDB
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  MongoDB    │──▶ Update post:
│  posts      │    $push: {
│             │      responses: {
│             │        owner: ObjectId(juan_id),
│             │        content: "Buena pregunta!",
│             │        creation_date
│             │      }
│             │    }
└──────┬──────┘
       │
       │ 3. Enriquecer respuestas
       │    ($lookup para nombres)
       ▼
┌─────────────┐
│  Backend    │──▶ Retorna post actualizado
│  Service    │    {
│             │      responses: [
│             │        {
│             │          owner: "Juan Pérez", ← nombre
│             │          content: "Buena pregunta!",
│             │          creation_date
│             │        }
│             │      ]
│             │    }
└──────┬──────┘
       │
       │ 4. Actualizar UI
       ▼
┌─────────────┐
│  Frontend   │──▶ Muestra nueva respuesta
│  Post Detail│    Actualiza lista
└─────────────┘
```

---

## 📚 3. Flujo de Apuntes (Notes)

### Crear y Buscar Apunte

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │
       │ 1. Crear apunte
       ▼
┌─────────────┐
│  Frontend   │──▶ POST /notes/create
│  Create Note│    Headers: Bearer TOKEN
│  Dialog     │    Body: {
│             │      title, description, subject,
│             │      university, career,
│             │      tags: ["python", "beginner"],
│             │      file_url
│             │    }
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  MongoDB    │──▶ Insert en notes collection
│  notes      │    {
│             │      title, description, subject,
│             │      university, career, tags,
│             │      file_url,
│             │      owner: ObjectId(user_id),
│             │      created_at, updated_at
│             │    }
└──────┬──────┘
       │
       │ 2. Buscar apuntes
       ▼
┌─────────────┐
│  Frontend   │──▶ GET /notes/?university=MIT
│  Search     │              &subject=Programming
│  Notes      │              &tags=python
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Backend    │──▶ Query MongoDB con filtros
│  Service    │    (case-insensitive)
│             │    {
│             │      $match: {
│             │        university: /MIT/i,
│             │        subject: /Programming/i,
│             │        tags: "python"
│             │      }
│             │    }
└──────┬──────┘
       │
       │ 3. Enriquecer con nombres
       │    ($lookup con users)
       ▼
┌─────────────┐
│  MongoDB    │──▶ Retorna notas filtradas
│             │    con owner: "Juan Pérez"
└──────┬──────┘
       │
       │ 4. Mostrar resultados
       ▼
┌─────────────┐
│  Frontend   │──▶ Lista de notas filtradas
│  Notes List │    Muestra cards con info
└─────────────┘
```

---

## 👥 4. Flujo de Grupos de Estudio

### Crear y Unirse a Grupo

```
┌─────────────┐
│   Usuario 1 │
│  (Creador)   │
└──────┬──────┘
       │
       │ 1. Crear grupo
       ▼
┌─────────────┐
│  Frontend   │──▶ POST /study-groups/create
│  Create     │    Headers: Bearer TOKEN_1
│  Group       │    Body: {
│             │      name, description,
│             │      is_public: true,
│             │      exam_date
│             │    }
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  MongoDB    │──▶ Insert en study_groups
│  study_     │    {
│  groups      │      name, description,
│             │      owner: ObjectId(user1_id),
│             │      members: [ObjectId(user1_id)],
│             │      pending_requests: [],
│             │      files: [],
│             │      chat: [],
│             │      is_public: true,
│             │      exam_date
│             │    }
└──────┬──────┘
       │
       │ 2. Usuario 2 ve grupo público
       ▼
┌─────────────┐
│   Usuario 2 │──▶ GET /study-groups/public
│             │    Ve lista de grupos públicos
└──────┬──────┘
       │
       │ 3. Unirse a grupo
       ▼
┌─────────────┐
│  Frontend   │──▶ POST /study-groups/{group_id}/join
│  Join Group │    Headers: Bearer TOKEN_2
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Backend    │──▶ Verificar si es público
│  Controller │    Si is_public: agregar a members
│             │    Si privado: agregar a pending_requests
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  MongoDB    │──▶ Update study_groups
│             │    $push: {
│             │      members: ObjectId(user2_id)
│             │    }
└──────┬──────┘
       │
       │ 4. Retorna grupo actualizado
       ▼
┌─────────────┐
│  Frontend   │──▶ Muestra grupo actualizado
│  Group Detail│    con nuevo miembro
└─────────────┘
```

### Compartir Archivo

```
┌─────────────┐
│   Usuario   │
│  (Miembro)   │
└──────┬──────┘
       │
       │ 1. Compartir archivo
       ▼
┌─────────────┐
│  Frontend   │──▶ POST /study-groups/{group_id}/share-file
│  Share File │    Headers: Bearer TOKEN
│             │    Body: {file_url}
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Backend    │──▶ Verificar que es miembro
│  Controller │    Verificar token
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  MongoDB    │──▶ Update study_groups
│             │    $push: {
│             │      files: {
│             │        file_id: UUID,
│             │        uploaded_by: ObjectId(user_id),
│             │        file_url,
│             │        uploaded_at
│             │      }
│             │    }
└──────┬──────┘
       │
       │ 2. Retorna grupo con nuevo archivo
       ▼
┌─────────────┐
│  Frontend   │──▶ Muestra archivo en lista
│  Group Detail│    Actualiza files_count
└─────────────┘
```

---

## 💬 5. Flujo de Chat en Tiempo Real (WebSocket)

```
┌─────────────┐         ┌─────────────┐
│  Usuario 1  │         │  Usuario 2  │
│  (Juan)     │         │  (María)     │
└──────┬──────┘         └──────┬──────┘
       │                       │
       │ 1. Conectar           │ 2. Conectar
       ▼                       ▼
┌─────────────────────────────────────────┐
│  Frontend (Browser)                    │
│  WebSocket: ws://localhost:8000/        │
│           study-groups/ws/{group_id}    │
└──────┬───────────────────────┬──────────┘
       │                       │
       │                       │
       ▼                       ▼
┌─────────────────────────────────────────┐
│  Backend (FastAPI)                       │
│  WebSocketManager                        │
│  ConnectionManager                       │
│  active_connections[group_id] = [       │
│    websocket_juan,                      │
│    websocket_maria                      │
│  ]                                       │
└──────┬───────────────────────┬──────────┘
       │                       │
       │                       │
       │ 3. Juan envía mensaje │
       ▼                       │
┌─────────────┐                │
│  Frontend   │──▶ Send JSON   │
│  Juan       │    {           │
│             │      sender_id: juan_id,
│             │      content: "Hola!"
│             │    }          │
└──────┬──────┘                │
       │                       │
       ▼                       │
┌─────────────┐                │
│  Backend    │──▶ Broadcast   │
│  WebSocket  │    a todos los │
│  Manager    │    conexiones  │
│             │    del grupo   │
└──────┬──────┘                │
       │                       │
       │                       │
       ▼                       ▼
┌─────────────┐         ┌─────────────┐
│  MongoDB    │         │  Frontend   │
│  study_     │         │  Juan       │
│  groups      │         │  Recibe su  │
│  chat: []   │         │  propio     │
│             │         │  mensaje    │
│  $push: {   │         └─────────────┘
│    sender:  │
│    juan_id, │
│    content, │
│    timestamp│
│  }          │
└──────┬──────┘
       │
       │ 4. Persistir mensaje
       │
       ▼
┌─────────────┐
│  Frontend   │
│  María      │──▶ Recibe mensaje
│  Recibe     │    {sender_name: "Juan Pérez",
│  mensaje    │     content: "Hola!",
│             │     timestamp}
└─────────────┘
```

### Flujo Completo de Chat

```
┌─────────────────────────────────────────────────────┐
│                    FLUJO DE CHAT                    │
└─────────────────────────────────────────────────────┘

Usuario 1                  Backend                    Usuario 2
   │                          │                          │
   │ 1. Conectar WS           │                          │
   ├─────────────────────────▶│                          │
   │                          │                          │
   │                          │ 2. Conectar WS           │
   │                          │◀─────────────────────────┤
   │                          │                          │
   │                          │ 3. Guardar conexiones    │
   │                          │    active_connections    │
   │                          │                          │
   │ 4. Enviar mensaje        │                          │
   ├─────────────────────────▶│                          │
   │                          │                          │
   │                          │ 5. Persistir en MongoDB │
   │                          │                          │
   │                          │ 6. Broadcast a todos     │
   │                          ├─────────────────────────▶│
   │                          │                          │
   │ 7. Recibir mensaje       │                          │
   │◀─────────────────────────┤                          │
   │                          │                          │
   │                          │                          │ 8. Recibir mensaje
   │                          │                          │◀──────────────────
```

---

## 🔄 6. Flujo Completo de Interacción

```
┌─────────────────────────────────────────────────────────────┐
│              FLUJO COMPLETO DE USUARIO NUEVO               │
└─────────────────────────────────────────────────────────────┘

1. REGISTRO
   Usuario → Frontend → Backend → MongoDB (crear usuario)
   Backend → Frontend → Token JWT

2. COMPLETAR PERFIL
   Usuario → Frontend → Backend → MongoDB (actualizar perfil)
   Backend → Frontend → Perfil completo

3. EXPLORAR CONTENIDO
   Usuario → Frontend → Backend → MongoDB
   GET /posts/latest
   GET /notes/latest/notes
   GET /study-groups/public
   Backend → Frontend → Listas de contenido

4. CREAR CONTENIDO
   Usuario → Frontend → Backend → MongoDB
   POST /posts/create
   POST /notes/create
   POST /study-groups/create
   Backend → Frontend → Contenido creado

5. INTERACTUAR
   Usuario → Frontend → Backend → MongoDB
   POST /posts/{id}/response (responder)
   POST /study-groups/{id}/join (unirse)
   POST /study-groups/{id}/share-file (compartir)
   Backend → Frontend → Acción completada

6. CHAT EN TIEMPO REAL
   Usuario → Frontend → WebSocket → Backend
   Backend → MongoDB (persistir)
   Backend → Broadcast → Todos los miembros
   Frontend → Mostrar mensaje en tiempo real
```

---

## 📊 7. Estructura de Datos en MongoDB

```
┌─────────────────────────────────────────────────────────────┐
│                    COLECCIONES MONGODB                      │
└─────────────────────────────────────────────────────────────┘

users
├── _id: ObjectId
├── email: String (unique)
├── hashed_password: String (bcrypt)
├── full_name: String
├── last_name: String
├── career: String
├── university: String
├── birth_date: DateTime
├── is_active: Boolean
└── created_at: DateTime

posts
├── _id: ObjectId
├── title: String
├── description: String
├── subject: String
├── owner: ObjectId → users._id
├── responses: [
│     {
│       owner: ObjectId → users._id
│       content: String
│       creation_date: DateTime
│     }
│   ]
└── creation_date: DateTime

notes
├── _id: ObjectId
├── title: String
├── description: String
├── subject: String
├── university: String
├── career: String
├── tags: [String]
├── file_url: String
├── owner: ObjectId → users._id
├── created_at: DateTime
└── updated_at: DateTime

study_groups
├── _id: ObjectId
├── name: String
├── description: String
├── owner: ObjectId → users._id
├── members: [ObjectId] → users._id[]
├── pending_requests: [ObjectId] → users._id[]
├── files: [
│     {
│       file_id: String (UUID)
│       uploaded_by: ObjectId → users._id
│       file_url: String
│       uploaded_at: DateTime
│     }
│   ]
├── chat: [
│     {
│       sender: ObjectId → users._id
│       content: String
│       timestamp: DateTime
│     }
│   ]
├── is_public: Boolean
├── exam_date: DateTime
└── created_at: DateTime
```

---

## 🔗 8. Relaciones entre Colecciones

```
┌─────────────┐
│    users    │
│  (central)  │
└──────┬──────┘
       │
       │ Referencias ObjectId
       │
       ├─────────────────────────┐
       │                         │
       ▼                         ▼
┌─────────────┐         ┌─────────────┐
│    posts    │         │    notes    │
│  owner:     │         │  owner:     │
│  ObjectId   │         │  ObjectId   │
│             │         │             │
│  responses: │         │             │
│  [owner:    │         │             │
│   ObjectId] │         │             │
└─────────────┘         └─────────────┘
       │                         │
       │                         │
       └─────────────────────────┼──────────────┐
                                 │              │
                                 ▼              ▼
                          ┌─────────────┐  ┌─────────────┐
                          │study_groups │  │study_groups │
                          │  owner:     │  │  members:   │
                          │  ObjectId   │  │  [ObjectId] │
                          │             │  │             │
                          │  files:     │  │  chat:      │
                          │  [uploaded_ │  │  [sender:    │
                          │   by:       │  │   ObjectId] │
                          │   ObjectId] │  │             │
                          └─────────────┘  └─────────────┘

$lookup Operations:
- posts.owner → users → full_name + last_name
- posts.responses.owner → users → full_name + last_name
- notes.owner → users → full_name + last_name
- study_groups.owner → users → full_name + last_name
- study_groups.members → users → full_name + last_name
- study_groups.files.uploaded_by → users → full_name + last_name
- study_groups.chat.sender → users → full_name + last_name
```

---

## 🎯 Resumen de Flujos Principales

1. **Autenticación**: Registro → Login → Token → Guardar en storage
2. **Publicaciones**: Crear → Ver → Responder → Listar
3. **Apuntes**: Crear → Buscar (filtros) → Ver → Mis apuntes
4. **Grupos**: Crear → Unirse → Compartir archivos → Chat
5. **Chat**: Conectar WS → Enviar → Broadcast → Persistir → Recibir

Todos los flujos incluyen:
- ✅ Validación de datos (Pydantic)
- ✅ Autenticación JWT
- ✅ Enriquecimiento de datos ($lookup)
- ✅ Manejo de errores
- ✅ Respuestas estructuradas

---

¡Listo para entender el sistema completo! 🚀


