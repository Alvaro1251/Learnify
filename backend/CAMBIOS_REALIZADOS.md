# 📝 Cambios Realizados: Sistema de Moderadores

## 🎯 ¿Qué es Swagger?

**Swagger** (también llamado Swagger UI) es una interfaz web que FastAPI genera automáticamente para probar y documentar tu API.

- **URL:** `http://localhost:8000/docs`
- **Qué hace:** Te permite probar todos los endpoints de tu API sin necesidad de Postman o código
- **Cómo funciona:** FastAPI lee tus endpoints y genera una interfaz visual donde puedes hacer click y probar cada endpoint

**Ejemplo:**
- Tienes un endpoint `GET /auth/me`
- Swagger lo muestra con un botón "Try it out"
- Haces click, ingresas el token, y ejecutas
- Ves la respuesta directamente en la página

---

## 🔧 Cambios en el Backend

### 1. **Modelo de Usuario** (`models/user.py`)

#### Cambios:
- ✅ Agregué campo `role: str = "user"` a `UserInDB` (línea 62)
- ✅ Agregué campo `role: str = "user"` a `UserResponse` (línea 34)
- ✅ Creé nuevo modelo `RoleUpdate` para actualizar roles (líneas 49-50)

**Antes:**
```python
class UserInDB(UserBase):
    # ... otros campos
    is_active: bool = True
    # NO había campo role
```

**Después:**
```python
class UserInDB(UserBase):
    # ... otros campos
    is_active: bool = True
    role: str = "user"  # "user", "moderator", "admin" ← NUEVO
```

**¿Por qué?** Para que cada usuario tenga un rol que determine sus permisos.

---

### 2. **Servicio de Autenticación** (`services/auth_service.py`)

#### Cambios realizados:

**a) Registro de usuarios (línea 22):**
```python
user_data = {
    "email": user.email,
    "hashed_password": hashed_password,
    "is_active": True,
    "role": "user",  # ← NUEVO: Por defecto todos son "user"
    "created_at": datetime.utcnow(),
}
```

**b) Retrocompatibilidad (líneas 44-49, 62-67, 104-109):**
```python
# Si un usuario no tiene role (usuarios antiguos), se le asigna "user"
if "role" not in db_user:
    db_user["role"] = "user"
    await users_collection.update_one(
        {"_id": db_user["_id"]}, {"$set": {"role": "user"}}
    )
```

**c) Nueva función: `update_user_role()` (líneas 73-93):**
```python
async def update_user_role(
    db: AsyncIOMotorDatabase, user_id: str, new_role: str
) -> UserInDB:
    """Actualiza el rol de un usuario"""
    # Valida que el rol sea válido
    valid_roles = ["user", "moderator", "admin"]
    if new_role not in valid_roles:
        raise ValueError(f"Invalid role. Must be one of: {valid_roles}")
    
    # Actualiza en MongoDB
    result = await users_collection.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": new_role}},
        return_document=True,
    )
    return UserInDB(**result)
```

**d) Nueva función: `get_all_users()` (líneas 115-126):**
```python
async def get_all_users(db: AsyncIOMotorDatabase) -> List[dict]:
    """Obtiene todos los usuarios (solo para admins)"""
    users = await users_collection.find({}).to_list(length=None)
    # ... elimina contraseñas antes de retornar
    return result
```

**¿Por qué?** Para poder asignar roles y listar usuarios.

---

### 3. **Controladores de Autenticación** (`controllers/auth.py`)

#### Cambios realizados:

**a) Nuevas dependencies para verificar roles (líneas 43-64):**

```python
async def get_moderator(current_user=Depends(get_current_user)):
    """Verifica que el usuario sea moderador o admin"""
    if current_user.role not in ["moderator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Moderator or admin access required",
        )
    return current_user

async def get_admin(current_user=Depends(get_current_user)):
    """Verifica que el usuario sea admin"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
```

**¿Qué hacen?** Son funciones que FastAPI usa para verificar permisos antes de ejecutar un endpoint.

**b) Nuevo endpoint: `GET /auth/users` (líneas 103-110):**
```python
@router.get("/users", response_model=List[UserResponse])
async def list_users(
    current_admin=Depends(get_admin),  # ← Solo admins pueden acceder
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Lista todos los usuarios. Solo admins pueden hacerlo."""
    users = await get_all_users(db)
    return [UserResponse(**user) for user in users]
```

**¿Qué hace?** Permite a los admins ver todos los usuarios con sus roles.

**c) Nuevo endpoint: `PUT /auth/users/{user_id}/role` (líneas 113-131):**
```python
@router.put("/users/{user_id}/role", response_model=UserResponse)
async def update_role(
    user_id: str,
    role_data: RoleUpdate,
    current_admin=Depends(get_admin),  # ← Solo admins pueden acceder
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Actualiza el rol de un usuario. Solo admins pueden hacerlo."""
    user = await update_user_role(db, user_id, role_data.role)
    return UserResponse(**user.model_dump(exclude={"hashed_password"}))
```

**¿Qué hace?** Permite a los admins cambiar el rol de cualquier usuario.

---

### 4. **Servicio de Posts** (`services/post_service.py`)

#### Cambio en `delete_post()` (líneas 379-399):

**Antes:**
```python
async def delete_post(db, post_id: str, user_id: str) -> bool:
    # Solo podía borrar si era el dueño
    result = await posts_collection.delete_one(
        {"_id": ObjectId(post_id), "owner": ObjectId(user_id)}
    )
    return result.deleted_count > 0
```

**Después:**
```python
async def delete_post(
    db, post_id: str, user_id: str, user_role: str = "user"
) -> bool:
    # Si es moderador o admin, puede borrar cualquier post
    if user_role in ["moderator", "admin"]:
        result = await posts_collection.delete_one({"_id": ObjectId(post_id)})
    else:
        # Si es usuario normal, solo puede borrar sus propios posts
        result = await posts_collection.delete_one(
            {"_id": ObjectId(post_id), "owner": ObjectId(user_id)}
        )
    return result.deleted_count > 0
```

**¿Qué cambió?** Ahora acepta el `user_role` como parámetro y permite a moderadores/admins borrar cualquier post.

---

### 5. **Controlador de Posts** (`controllers/post.py`)

#### Cambio en el endpoint `DELETE /posts/{post_id}` (líneas 89-103):

**Antes:**
```python
@router.delete("/{post_id}")
async def delete_post_endpoint(
    post_id: str,
    current_user=Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    success = await delete_post(db, post_id, str(current_user.id))
    # ...
```

**Después:**
```python
@router.delete("/{post_id}")
async def delete_post_endpoint(
    post_id: str,
    current_user=Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    success = await delete_post(
        db, post_id, str(current_user.id), current_user.role  # ← Pasa el role
    )
    # ...
```

**¿Qué cambió?** Ahora pasa el `role` del usuario al servicio para que pueda decidir si permitir el borrado.

---

## 🎨 Cambios en el Frontend

### 1. **Interfaz de Usuario** (`src/lib/api.ts`)

#### Cambio en `UserProfile` (línea 36):

**Antes:**
```typescript
export interface UserProfile {
  email: string;
  // ... otros campos
  is_active: boolean;
  created_at: string;
  // NO había campo role
}
```

**Después:**
```typescript
export interface UserProfile {
  email: string;
  // ... otros campos
  is_active: boolean;
  role?: string; // "user", "moderator", "admin" ← NUEVO
  created_at: string;
}
```

**¿Por qué?** Para que TypeScript sepa que el usuario puede tener un campo `role`.

---

### 2. **Página de Detalle de Post** (`src/app/app/posts/[id]/page.tsx`)

#### Cambios (líneas 114-162):

**Antes:**
```typescript
const isOwner = currentUserFullName && post.owner === currentUserFullName

// Solo mostraba el botón si era el dueño
{isOwner && (
  <button onClick={handleDelete}>
    <Trash2 className="h-5 w-5 text-destructive" />
  </button>
)}
```

**Después:**
```typescript
const isOwner = currentUserFullName && post.owner === currentUserFullName

// Verifica si es moderador o admin
const isModeratorOrAdmin = currentUser?.role === "moderator" || currentUser?.role === "admin"
const canDelete = isOwner || isModeratorOrAdmin  // ← NUEVO

// Muestra el botón si es dueño O moderador/admin
{canDelete && (
  <button 
    onClick={handleDelete}
    title={isOwner ? "Eliminar publicación" : "Eliminar publicación (Moderador)"}
  >
    <Trash2 className="h-5 w-5 text-destructive" />
  </button>
)}
```

**¿Qué cambió?** Ahora el botón de eliminar aparece también para moderadores y admins, aunque no sean dueños del post.

---

## 📊 Resumen de Archivos Modificados

### Backend:
1. ✅ `models/user.py` - Agregado campo `role` y modelo `RoleUpdate`
2. ✅ `services/auth_service.py` - Funciones para gestionar roles
3. ✅ `controllers/auth.py` - Dependencies y endpoints para roles
4. ✅ `services/post_service.py` - Modificado `delete_post()` para permitir moderadores
5. ✅ `controllers/post.py` - Modificado para pasar el `role` al servicio

### Frontend:
1. ✅ `src/lib/api.ts` - Agregado campo `role` a `UserProfile`
2. ✅ `src/app/app/posts/[id]/page.tsx` - Modificado para mostrar botón de eliminar a moderadores

---

## 🔐 Cómo Funciona el Sistema de Permisos

### Flujo de Verificación:

1. **Usuario hace login** → Obtiene token JWT
2. **Usuario intenta acceder a un endpoint protegido** → FastAPI valida el token
3. **FastAPI obtiene el usuario de la BD** → Lee el campo `role`
4. **Dependency verifica el rol:**
   - `get_current_user()` → Verifica que esté autenticado
   - `get_moderator()` → Verifica que sea moderador O admin
   - `get_admin()` → Verifica que sea admin
5. **Si pasa la verificación** → Ejecuta el endpoint
6. **Si no pasa** → Retorna error 403 (Forbidden)

### Ejemplo:

```python
@router.get("/users")
async def list_users(
    current_admin=Depends(get_admin),  # ← Aquí se verifica el rol
    ...
):
    # Si llegó aquí, es porque es admin
    # Si no es admin, get_admin() lanza error 403 antes de llegar aquí
```

---

## 🎯 Endpoints Nuevos

| Endpoint | Método | Permisos | Descripción |
|----------|--------|----------|-------------|
| `/auth/users` | GET | Admin | Lista todos los usuarios |
| `/auth/users/{user_id}/role` | PUT | Admin | Asigna rol a un usuario |

---

## ✅ Cambios en Endpoints Existentes

| Endpoint | Cambio |
|----------|--------|
| `DELETE /posts/{post_id}` | Ahora moderadores/admins pueden borrar cualquier post |
| `GET /auth/me` | Ahora retorna el campo `role` |

---

## 🔄 Flujo Completo de Uso

1. **Crear admin** (en MongoDB, primera vez)
2. **Admin se autentica** → Obtiene token con `role: "admin"`
3. **Admin lista usuarios** → `GET /auth/users` (solo admins)
4. **Admin asigna moderador** → `PUT /auth/users/{id}/role` con `{"role": "moderator"}`
5. **Moderador se autentica** → Obtiene token con `role: "moderator"`
6. **Moderador ve post** → Frontend muestra botón de eliminar (porque `role === "moderator"`)
7. **Moderador borra post** → Backend permite porque `user_role in ["moderator", "admin"]`

---

## 💡 Conceptos Clave

### Dependencies en FastAPI
Son funciones que se ejecutan **antes** del endpoint para validar permisos, obtener datos, etc.

### Roles
- **`user`**: Por defecto, solo puede borrar sus posts
- **`moderator`**: Puede borrar cualquier post
- **`admin`**: Puede asignar roles y borrar posts

### Swagger
Interfaz web automática para probar tu API. FastAPI la genera automáticamente.

---

## 🎉 Resultado Final

- ✅ Sistema de roles funcionando
- ✅ Moderadores pueden borrar posts desde la web
- ✅ Admins pueden gestionar roles desde Swagger
- ✅ Frontend muestra botones según permisos
- ✅ Backend valida permisos en cada request

