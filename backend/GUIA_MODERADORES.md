# 🛡️ Guía de Moderadores - Cómo Funciona y Cómo Probarlo

## 📋 Resumen

El sistema ahora tiene **3 roles de usuario**:
- **`user`**: Usuario normal (por defecto)
- **`moderator`**: Puede borrar cualquier post
- **`admin`**: Puede asignar roles y borrar cualquier post

---

## 🚀 Paso 1: Reiniciar el Backend

**IMPORTANTE:** Los cambios requieren reiniciar el servidor para que funcionen.

### Si estás usando Docker:
```bash
cd C:\python\Learnify-nuevo\backend
docker-compose restart backend
```

### Si estás corriendo manualmente:
1. Detén el servidor (Ctrl+C en la terminal donde está corriendo)
2. Vuelve a iniciarlo:
```bash
cd C:\python\Learnify-nuevo\backend
poetry run python main.py
```

---

## 🎯 Paso 2: Crear el Primer Admin

### ⚠️ IMPORTANTE: El Problema del Huevo y la Gallina

**Situación actual:**
- ✅ Todos los usuarios nuevos se crean como `"user"` por defecto
- ✅ Solo los `"admin"` pueden asignar roles a otros
- ❌ **Problema:** Si todos son "user", ¿quién puede crear el primer admin?

**Solución:** Tienes que crear el primer admin **manualmente en MongoDB**. Una vez que tengas un admin, ese admin puede asignar roles a otros usando la API.

---

### 🔧 Opción A: Crear Admin Manualmente en MongoDB (OBLIGATORIO la primera vez)

**Esto es necesario porque al principio no hay ningún admin.**

1. **Conéctate a MongoDB:**
```bash
docker exec -it learnify_mongodb mongosh -u admin -p password --authenticationDatabase admin
```

2. **Selecciona la base de datos:**
```javascript
use learnify
```

3. **Busca tu usuario por email:**
```javascript
db.users.find({email: "tu_email@example.com"})
```

Verás algo como:
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  email: "tu_email@example.com",
  role: "user",  // ← Actualmente es "user"
  hashed_password: "...",
  ...
}
```

4. **Actualiza tu rol a admin:**
```javascript
db.users.updateOne(
  {email: "tu_email@example.com"},
  {$set: {role: "admin"}}
)
```

5. **Verifica que funcionó:**
```javascript
db.users.findOne({email: "tu_email@example.com"})
```

Deberías ver:
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  email: "tu_email@example.com",
  role: "admin",  // ← ¡Ahora eres admin!
  ...
}
```

6. **Sal de MongoDB:**
```javascript
exit
```

**¡Listo!** Ahora eres admin y puedes asignar roles a otros usuarios usando la API.

---

### 🔄 Opción B: Usando la API (Solo si ya eres admin)

Una vez que ya eres admin (después de usar la Opción A), puedes asignar roles a otros usando:

```
PUT /auth/users/{user_id}/role
```

Pero recuerda: **la primera vez DEBES hacerlo en MongoDB** porque no hay ningún admin todavía.

---

## ✅ Paso 3: Verificar que Funciona

### 🔑 ¿Qué es el "Bearer Token"?

El **token** es un código que obtienes al iniciar sesión. Es como tu "tarjeta de identificación" para usar la API.

**Formato:** `Bearer {tu_token}` significa que debes poner:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Donde `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` es el token que obtienes al hacer login.

### 3.1 Obtener tu Token (Iniciar Sesión)

**Opción A: Usando Swagger (La Más Fácil)**

1. Abre: `http://localhost:8000/docs`
2. Busca el endpoint `POST /auth/login`
3. Click en "Try it out"
4. Ingresa tu email y password:
   ```json
   {
     "email": "tu_email@example.com",
     "password": "tu_password"
   }
   ```
5. Click en "Execute"
6. En la respuesta verás algo como:
   ```json
   {
     "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3VhcmlvQGV4YW1wbGUuY29tIiwiZXhwIjoxNzA5ODc2NDAwfQ.signature",
     "token_type": "bearer"
   }
   ```
7. **Copia el valor de `access_token`** (esa cadena larga que empieza con `eyJ...`)

**Opción B: Usando cURL o Postman**

```bash
POST http://localhost:8000/auth/login
Content-Type: application/json

{
  "email": "tu_email@example.com",
  "password": "tu_password"
}
```

La respuesta será:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 3.2 Usar el Token en Swagger

1. En `http://localhost:8000/docs`, busca el botón **"Authorize"** (arriba a la derecha, 🔒)
2. Click en "Authorize"
3. En el campo "Value", pega SOLO el token (sin la palabra "Bearer"):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Click en "Authorize" y luego "Close"
5. Ahora todos los endpoints que pruebes usarán ese token automáticamente

### 3.3 Verificar tu rol actual

Ahora que tienes el token configurado:

1. Busca `GET /auth/me` en Swagger
2. Click en "Try it out"
3. Click en "Execute"
4. Deberías ver tu perfil con el campo `role`:
   ```json
   {
     "email": "tu_email@example.com",
     "id": "507f1f77bcf86cd799439011",
     "role": "admin",  // ← Aquí ves tu rol
     "is_active": true,
     ...
   }
   ```

**Si ves `"role": "user"`:**
- Significa que aún no eres admin
- Necesitas hacer el **Paso 2** (crear admin en MongoDB) primero

**Si ves `"role": "admin"`:**
- ¡Perfecto! Ya puedes asignar roles a otros

Deberías ver algo como:
```json
{
  "email": "tu_email@example.com",
  "id": "...",
  "role": "admin",
  "is_active": true,
  ...
}
```

### 3.4 Listar todos los usuarios (Solo Admin)

1. En Swagger, busca `GET /auth/users`
2. Click en "Try it out" → "Execute"
3. Si eres admin, verás la lista de usuarios con sus IDs y roles

### 3.5 Asignar rol de moderador a otra persona

**Requisito:** Tú debes ser **admin** para poder asignar roles.

#### Paso 1: Ver todos los usuarios y encontrar su ID

1. En Swagger, busca `GET /auth/users`
2. Click en "Try it out" → "Execute"
3. Verás una lista como esta:
   ```json
   [
     {
       "id": "507f1f77bcf86cd799439011",
       "email": "juan@example.com",
       "role": "user",
       "full_name": "Juan",
       ...
     },
     {
       "id": "507f1f77bcf86cd799439012",
       "email": "maria@example.com",
       "role": "user",
       "full_name": "María",
       ...
     }
   ]
   ```
4. **Busca el email de la persona** que quieres hacer moderador
5. **Copia el `id`** de esa persona (ese código largo, ej: `507f1f77bcf86cd799439011`)

#### Paso 2: Asignar el rol de moderador

1. En Swagger, busca `PUT /auth/users/{user_id}/role`
2. Click en "Try it out"
3. **En el campo `user_id`**, pega el ID que copiaste antes
4. **En el body (Request body)**, ingresa:
   ```json
   {
     "role": "moderator"
   }
   ```
5. Click en "Execute"
6. Si todo está bien, verás la respuesta con el usuario actualizado:
   ```json
   {
     "id": "507f1f77bcf86cd799439011",
     "email": "juan@example.com",
     "role": "moderator",  // ← Ahora es moderador
     ...
   }
   ```

#### Paso 3: Verificar que funcionó

1. Vuelve a usar `GET /auth/users`
2. Verifica que el usuario ahora tiene `"role": "moderator"`

**¡Listo!** Esa persona ahora puede borrar cualquier post.

---

## 🧪 Paso 4: Probar que los Moderadores Pueden Borrar Posts

### 4.1 Crear un post con un usuario normal

1. **Inicia sesión con un usuario normal** (no moderador):
   - En Swagger, usa `POST /auth/login` con credenciales de un usuario normal
   - Copia el `access_token` de la respuesta
   - Click en "Authorize" y pega el token

2. **Crea un post:**
   - Busca `POST /posts/create` en Swagger
   - Ingresa:
     ```json
     {
       "title": "Post de prueba",
       "description": "Este es un post de prueba",
       "subject": "Matemáticas"
     }
     ```
   - Click en "Execute"
   - **Copia el `id` del post** de la respuesta (aparece como `"_id"` o `"id"`)

### 4.2 Intentar borrarlo con usuario normal (debería fallar si no es el dueño)

Si intentas borrar un post que no es tuyo con un usuario normal, debería dar error 404 o 403.

### 4.3 Borrarlo con moderador (debería funcionar)

1. **Inicia sesión con un moderador:**
   - Usa `POST /auth/login` con credenciales de un usuario moderador
   - Copia el nuevo `access_token`
   - Click en "Authorize" y pega el nuevo token (esto reemplaza el anterior)

2. **Borra el post** (aunque no sea tuyo):
   - Busca `DELETE /posts/{post_id}` en Swagger
   - En `post_id`, pega el ID del post que creaste antes
   - Click en "Execute"

3. **¡Debería funcionar!** El moderador puede borrar cualquier post, incluso si no es el dueño.

---

## 📝 Resumen: Usando Swagger (Recomendado)

Swagger es la forma más fácil de probar todo. Aquí está el flujo completo:

1. **Abre:** `http://localhost:8000/docs`

2. **Obtén tu token:**
   - `POST /auth/login` → Copia el `access_token`

3. **Autoriza:**
   - Click en "Authorize" (🔒 arriba a la derecha)
   - Pega SOLO el token (sin "Bearer", sin llaves)
   - Click en "Authorize" → "Close"

4. **Prueba endpoints:**
   - `GET /auth/me` - Ver tu rol actual
   - `GET /auth/users` - Listar usuarios (solo admin)
   - `PUT /auth/users/{user_id}/role` - Asignar rol (solo admin)
   - `DELETE /posts/{post_id}` - Borrar post (moderadores pueden borrar cualquier post)

**💡 Tip:** Si quieres cambiar de usuario, simplemente haz login de nuevo y reemplaza el token en "Authorize"

---

## 🔍 Verificar en MongoDB

Si quieres ver directamente en la base de datos:

```bash
docker exec -it learnify_mongodb mongosh -u admin -p password --authenticationDatabase admin
```

```javascript
use learnify

// Ver todos los usuarios con sus roles
db.users.find({}, {email: 1, role: 1, _id: 1})

// Ver un usuario específico
db.users.findOne({email: "tu_email@example.com"})

// Ver posts
db.posts.find({}, {title: 1, owner: 1, _id: 1})
```

---

## ⚠️ Troubleshooting

### "Admin access required" al intentar asignar roles
- Asegúrate de que tu usuario tenga `role: "admin"` en MongoDB
- Verifica que estés usando el token correcto

### "Post not found or not authorized" al borrar
- Si eres usuario normal: Solo puedes borrar tus propios posts
- Si eres moderador/admin: Puedes borrar cualquier post, verifica que el post_id sea correcto

### Los cambios no se reflejan
- **Reinicia el backend** (muy importante)
- Verifica que MongoDB esté corriendo
- Revisa los logs del backend para ver errores

---

## 📊 Resumen de Endpoints

| Endpoint | Método | Permisos | Descripción |
|----------|--------|----------|-------------|
| `/auth/me` | GET | Usuario autenticado | Ver tu perfil y rol |
| `/auth/users` | GET | Admin | Listar todos los usuarios |
| `/auth/users/{user_id}/role` | PUT | Admin | Asignar rol a usuario |
| `/posts/{post_id}` | DELETE | Owner o Moderador/Admin | Borrar post |

---

## 🎉 ¡Listo!

Ahora tienes un sistema de moderación funcionando. Los moderadores pueden borrar cualquier post, y los admins pueden gestionar roles.

