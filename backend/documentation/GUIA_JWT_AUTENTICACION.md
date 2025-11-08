# 🔐 Guía Completa: Autenticación JWT en Learnify

Esta guía explica **paso a paso** cómo funciona el sistema de autenticación JWT (JSON Web Tokens) en Learnify.

---

## 📚 ¿Qué es JWT?

**JWT (JSON Web Token)** es un estándar para crear tokens de acceso que permiten identificar usuarios sin necesidad de guardar su sesión en el servidor.

### Características:
- ✅ **Stateless** (Sin estado): El servidor no guarda sesiones
- ✅ **Portable**: El token contiene toda la información necesaria
- ✅ **Seguro**: Firmado digitalmente con una clave secreta
- ✅ **Temporal**: Tiene fecha de expiración

### Estructura de un JWT:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwiZXhwIjoxNzA5ODc2NDAwfQ.signature
```

Un JWT tiene **3 partes** separadas por puntos (.):

1. **Header** (Encabezado): Tipo de token y algoritmo
2. **Payload** (Carga útil): Datos del usuario (email, expiración, etc.)
3. **Signature** (Firma): Verificación de autenticidad

---

## 🔄 Flujo Completo de Autenticación

### Flujo 1: Registro de Usuario

```
┌──────────┐
│ Usuario  │
│ (Frontend)│
└────┬─────┘
     │
     │ 1. POST /auth/register
     │    {
     │      "email": "juan@example.com",
     │      "password": "miPassword123"
     │    }
     ▼
┌─────────────────────────────────────┐
│         Backend (FastAPI)            │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ controllers/auth.py           │ │
│  │ @router.post("/register")     │ │
│  └───────────┬───────────────────┘ │
│              │                       │
│              ▼                       │
│  ┌───────────────────────────────┐ │
│  │ services/auth_service.py      │ │
│  │ register_user()               │ │
│  │  - Verifica si email existe   │ │
│  │  - Hash de password (bcrypt)  │ │
│  └───────────┬───────────────────┘ │
│              │                       │
│              ▼                       │
│  ┌───────────────────────────────┐ │
│  │ MongoDB                       │ │
│  │ Guarda usuario con password   │ │
│  │ hasheado                      │ │
│  └───────────┬───────────────────┘ │
│              │                       │
│              ▼                       │
│  ┌───────────────────────────────┐ │
│  │ config/security.py            │ │
│  │ create_access_token()         │ │
│  │  - Crea JWT con email         │ │
│  │  - Agrega expiración (24h)    │ │
│  │  - Firma con SECRET_KEY       │ │
│  └───────────┬───────────────────┘ │
└──────────────┼───────────────────────┘
                │
                │ 2. Response
                │    {
                │      "access_token": "eyJhbGc...",
                │      "token_type": "bearer"
                │    }
                ▼
┌──────────┐
│ Usuario  │ Guarda el token en localStorage
│ (Frontend)│ o en el estado de la app
└──────────┘
```

**Código relevante:**

```python
# controllers/auth.py
@router.post("/register")
async def register(user_data: UserRegister, db: ...):
    # 1. Registra el usuario en MongoDB
    user = await register_user(db, user_data)
    
    # 2. Crea el JWT con el email del usuario
    access_token = create_access_token(data={"sub": user.email})
    
    # 3. Retorna el token
    return {"access_token": access_token, "token_type": "bearer"}
```

```python
# services/auth_service.py
async def register_user(db, user: UserRegister):
    # Verifica si el email ya existe
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise ValueError("Email already registered")
    
    # Hash de la contraseña (bcrypt)
    hashed_password = hash_password(user.password)
    
    # Guarda en MongoDB
    user_data = {
        "email": user.email,
        "hashed_password": hashed_password,  # ← NUNCA se guarda la contraseña en texto plano
        "is_active": True,
        "created_at": datetime.utcnow(),
    }
    await users_collection.insert_one(user_data)
```

---

### Flujo 2: Login (Inicio de Sesión)

```
┌──────────┐
│ Usuario  │
└────┬─────┘
     │
     │ 1. POST /auth/login
     │    {
     │      "email": "juan@example.com",
     │      "password": "miPassword123"
     │    }
     ▼
┌─────────────────────────────────────┐
│         Backend (FastAPI)            │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ services/auth_service.py      │ │
│  │ authenticate_user()           │ │
│  │  - Busca usuario por email    │ │
│  │  - Verifica password (bcrypt) │ │
│  └───────────┬───────────────────┘ │
│              │                       │
│              │ ✓ Password correcto   │
│              ▼                       │
│  ┌───────────────────────────────┐ │
│  │ config/security.py            │ │
│  │ create_access_token()         │ │
│  │  - Crea JWT                   │ │
│  └───────────┬───────────────────┘ │
└──────────────┼───────────────────────┘
                │
                │ 2. Response
                │    {
                │      "access_token": "eyJhbGc...",
                │      "token_type": "bearer"
                │    }
                ▼
┌──────────┐
│ Usuario  │ Guarda el token
└──────────┘
```

**Código relevante:**

```python
# controllers/auth.py
@router.post("/login")
async def login(user_data: UserLogin, db: ...):
    # 1. Verifica email y password
    user = await authenticate_user(db, user_data)
    if not user:
        raise HTTPException(401, "Invalid email or password")
    
    # 2. Crea JWT si las credenciales son correctas
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
```

```python
# services/auth_service.py
async def authenticate_user(db, user: UserLogin):
    # Busca el usuario en MongoDB
    db_user = await users_collection.find_one({"email": user.email})
    if not db_user:
        return None  # Email no existe
    
    # Verifica la contraseña (compara hash)
    if not verify_password(user.password, db_user["hashed_password"]):
        return None  # Password incorrecto
    
    return UserInDB(**db_user)  # Usuario autenticado
```

---

### Flujo 3: Usar el Token para Acceder a Endpoints Protegidos

```
┌──────────┐
│ Usuario  │
└────┬─────┘
     │
     │ 1. POST /posts/create
     │    Headers: {
     │      "Authorization": "Bearer eyJhbGc..."
     │    }
     │    Body: {
     │      "title": "Mi publicación",
     │      "description": "...",
     │      "subject": "Programación"
     │    }
     ▼
┌─────────────────────────────────────┐
│         Backend (FastAPI)            │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ controllers/post.py           │ │
│  │ @router.post("/create")       │ │
│  │ async def create_new_post(    │ │
│  │     current_user=Depends(     │ │
│  │         get_current_user      │ │ ← Aquí se valida
│  │     )                         │ │
│  └───────────┬───────────────────┘ │
│              │                       │
│              ▼                       │
│  ┌───────────────────────────────┐ │
│  │ controllers/auth.py            │ │
│  │ get_current_user()             │ │
│  │  - Extrae token del header     │ │
│  │  - Decodifica JWT              │ │
│  │  - Verifica firma              │ │
│  │  - Obtiene email del payload  │ │
│  │  - Busca usuario en MongoDB    │ │
│  └───────────┬───────────────────┘ │
│              │                       │
│              │ ✓ Token válido        │
│              │ ✓ Usuario encontrado  │
│              ▼                       │
│  ┌───────────────────────────────┐ │
│  │ services/post_service.py      │ │
│  │ create_post()                 │ │
│  │  - Crea post con owner_id     │ │
│  │    del usuario autenticado    │ │
│  └───────────┬───────────────────┘ │
└──────────────┼───────────────────────┘
                │
                │ 2. Response (200)
                │    Post creado exitosamente
                ▼
┌──────────┐
│ Usuario  │ Recibe respuesta exitosa
└──────────┘
```

**Código relevante:**

```python
# controllers/post.py
@router.post("/create")
async def create_new_post(
    post_data: PostCreate,
    current_user=Depends(get_current_user),  # ← Aquí se valida el token
    db: ... = Depends(get_database),
):
    # Si llegamos aquí, el usuario está autenticado
    # current_user contiene toda la info del usuario
    post = await create_post(db, post_data, str(current_user.id))
    return post
```

```python
# controllers/auth.py
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    # 1. Extrae el token del header "Authorization: Bearer ..."
    token = credentials.credentials
    
    # 2. Decodifica el JWT y obtiene el email
    email = decode_access_token(token)
    if email is None:
        raise HTTPException(401, "Invalid authentication credentials")
    
    # 3. Busca el usuario en MongoDB
    user = await get_user_by_email(db, email)
    if user is None:
        raise HTTPException(401, "User not found")
    
    # 4. Retorna el usuario completo
    return user
```

---

## 🔧 Funciones Clave de JWT

### 1. `create_access_token()` - Crear Token

```python
# config/security.py
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    # Copia los datos (ej: {"sub": "user@example.com"})
    to_encode = data.copy()
    
    # Calcula fecha de expiración (24 horas por defecto)
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
    
    # Agrega la expiración al payload
    to_encode.update({"exp": expire})
    
    # Codifica el JWT con la clave secreta
    encoded_jwt = jwt.encode(
        to_encode,
        security_settings.JWT_SECRET_KEY,  # Clave secreta del .env
        algorithm=security_settings.JWT_ALGORITHM,  # HS256
    )
    return encoded_jwt
```

**Ejemplo de payload:**
```json
{
  "sub": "juan@example.com",
  "exp": 1709876400  // Timestamp de expiración
}
```

---

### 2. `decode_access_token()` - Decodificar Token

```python
# config/security.py
def decode_access_token(token: str) -> Optional[str]:
    try:
        # Decodifica y verifica el token
        payload = jwt.decode(
            token,
            security_settings.JWT_SECRET_KEY,  # Debe coincidir con la clave usada para crear
            algorithms=[security_settings.JWT_ALGORITHM],  # HS256
        )
        
        # Extrae el email del payload (campo "sub")
        email: str = payload.get("sub")
        if email is None:
            return None
        
        return email
    except JWTError:
        # Token inválido, expirado, o firma incorrecta
        return None
```

**¿Qué verifica `jwt.decode()`?**
- ✅ La firma es correcta (usando la misma SECRET_KEY)
- ✅ El token no ha expirado (campo `exp`)
- ✅ El algoritmo es el correcto (HS256)

---

## 🔒 Seguridad de Contraseñas (bcrypt)

### ¿Por qué hash de contraseñas?

**NUNCA** se guarda la contraseña en texto plano. Siempre se guarda un **hash** (versión encriptada irreversible).

### Hash de Contraseña

```python
# config/security.py
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)
```

**Ejemplo:**
```python
# Contraseña original: "miPassword123"
# Hash generado: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5Bd..."
```

**Características de bcrypt:**
- ✅ **Irreversible**: No se puede obtener la contraseña original del hash
- ✅ **Único**: Cada hash es diferente (aunque uses la misma contraseña)
- ✅ **Lento**: Diseñado para ser lento (previene ataques de fuerza bruta)

### Verificación de Contraseña

```python
# config/security.py
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

**Cómo funciona:**
1. Toma la contraseña en texto plano del usuario
2. Toma el hash guardado en MongoDB
3. Compara usando bcrypt (no compara strings directamente)
4. Retorna `True` si coinciden, `False` si no

---

## 📊 Estructura de Datos en MongoDB

### Usuario en la Base de Datos

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "email": "juan@example.com",
  "hashed_password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCO...",
  "full_name": "Juan",
  "last_name": "Pérez",
  "is_active": true,
  "created_at": ISODate("2024-10-27T21:30:00Z")
}
```

**Importante:**
- ✅ `hashed_password`: Hash bcrypt (nunca la contraseña original)
- ✅ `email`: Único (índice único en MongoDB)
- ✅ `is_active`: Permite desactivar usuarios sin eliminar

---

## 🔐 Configuración de Seguridad

### Variables de Entorno (.env)

```env
# Clave secreta para firmar JWT (DEBE ser secreta y única)
JWT_SECRET_KEY=dev-secret-key-change-in-production

# Algoritmo de encriptación
JWT_ALGORITHM=HS256

# Tiempo de expiración del token (en horas)
JWT_EXPIRATION_HOURS=24
```

**⚠️ IMPORTANTE:**
- **NUNCA** compartas tu `JWT_SECRET_KEY`
- En producción, usa una clave larga y aleatoria
- Si alguien tiene tu `JWT_SECRET_KEY`, puede crear tokens falsos

---

## 📝 Ejemplo Completo: Registro → Login → Crear Post

### Paso 1: Registro

**Request:**
```bash
POST http://localhost:8000/auth/register
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "miPassword123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqdWFuQGV4YW1wbGUuY29tIiwiZXhwIjoxNzA5ODc2NDAwfQ.signature",
  "token_type": "bearer"
}
```

**Lo que pasó:**
1. Backend recibió email y password
2. Hash de password con bcrypt: `$2b$12$...`
3. Guardó en MongoDB: `{email, hashed_password, ...}`
4. Creó JWT con email: `{"sub": "juan@example.com", "exp": ...}`
5. Firmó con SECRET_KEY
6. Retornó el token

---

### Paso 2: Login (Si el usuario ya existe)

**Request:**
```bash
POST http://localhost:8000/auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "miPassword123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Lo que pasó:**
1. Backend buscó usuario por email
2. Comparó password con hash usando bcrypt
3. Si coinciden, creó nuevo JWT
4. Retornó el token

---

### Paso 3: Crear Post (Usando el Token)

**Request:**
```bash
POST http://localhost:8000/posts/create
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "¿Cómo empezar con Python?",
  "description": "Soy nuevo en programación...",
  "subject": "Programming"
}
```

**Lo que pasó:**
1. Backend extrajo token del header `Authorization`
2. Decodificó JWT → Obtenió email: `"juan@example.com"`
3. Buscó usuario en MongoDB → Encontró: `{id: "...", email: "juan@example.com", ...}`
4. Creó el post con `owner_id` del usuario autenticado
5. Retornó el post creado

**Response:**
```json
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

---

## 🛡️ Protección de Endpoints

### Endpoints Protegidos (Requieren Token)

```python
# controllers/post.py
@router.post("/create")
async def create_new_post(
    current_user=Depends(get_current_user),  # ← Requiere autenticación
    ...
):
    # Solo usuarios autenticados pueden crear posts
    ...
```

### Endpoints Públicos (No requieren Token)

```python
# controllers/post.py
@router.get("/latest")
async def latest_posts(...):  # ← No tiene Depends(get_current_user)
    # Cualquiera puede ver las publicaciones
    ...
```

---

## 🔍 Verificar Token Manualmente

### Decodificar JWT Online

Puedes usar herramientas como https://jwt.io para decodificar tokens (sin verificar la firma):

1. Pega tu token JWT
2. Verás el header y payload (sin la firma)
3. **NO** puedes crear tokens falsos sin la SECRET_KEY

**Ejemplo de payload decodificado:**
```json
{
  "sub": "juan@example.com",
  "exp": 1709876400
}
```

---

## ⚠️ Errores Comunes

### 1. Token Expirado

**Error:**
```json
{
  "detail": "Invalid authentication credentials"
}
```

**Causa:** El token expiró (después de 24 horas por defecto)

**Solución:** El usuario debe hacer login nuevamente

---

### 2. Token Inválido

**Error:**
```json
{
  "detail": "Invalid authentication credentials"
}
```

**Causa:** 
- Token mal formado
- Firma incorrecta (SECRET_KEY diferente)
- Token modificado

**Solución:** Verificar que el token sea el correcto

---

### 3. Usuario No Encontrado

**Error:**
```json
{
  "detail": "User not found"
}
```

**Causa:** El token tiene un email válido, pero el usuario fue eliminado de la BD

**Solución:** Verificar que el usuario exista en MongoDB

---

## 📚 Resumen

### ¿Qué es JWT?
- Token que contiene información del usuario (email, expiración)
- Firmado digitalmente para prevenir falsificación
- No requiere sesión en el servidor (stateless)

### ¿Cómo funciona?
1. **Registro/Login:** Usuario se autentica → Backend crea JWT → Retorna token
2. **Peticiones:** Frontend envía token en header `Authorization: Bearer ...`
3. **Validación:** Backend decodifica token → Verifica firma → Obtiene usuario
4. **Acceso:** Si token es válido, permite acceso al endpoint

### Seguridad:
- ✅ Contraseñas hasheadas con bcrypt (irreversibles)
- ✅ Tokens firmados con SECRET_KEY (no falsificables)
- ✅ Tokens con expiración (24 horas por defecto)
- ✅ Validación en cada petición protegida

---

## 🔗 Archivos Relacionados

- `config/security.py` - Funciones de JWT y bcrypt
- `controllers/auth.py` - Endpoints de registro/login y validación
- `services/auth_service.py` - Lógica de autenticación
- `models/user.py` - Modelos de usuario y token

---

¿Tienes preguntas? Revisa el código o prueba los endpoints en `http://localhost:8000/docs` 🚀

