# 🚀 Guía Rápida: Sistema de Moderadores

## 📋 Pasos Rápidos

### 1️⃣ Hacerse Admin

**En MongoDB (solo la primera vez):**

```bash
docker exec -it learnify_mongodb mongosh -u admin -p password --authenticationDatabase admin
```

```javascript
use learnify
db.users.updateOne(
  {email: "TU_EMAIL@example.com"},
  {$set: {role: "admin"}}
)
```

```javascript
exit
```

**Verificar en Swagger:**
1. Abre: `http://localhost:8000/docs`
2. Login: `POST /auth/login` → copia el `access_token`
3. Click en "Authorize" → pega el token
4. Verifica: `GET /auth/me` → debe mostrar `"role": "admin"`

---

### 2️⃣ Dar Rol de Moderador a Otro Usuario

**En Swagger:**

1. Lista usuarios: `GET /auth/users` → copia el `id` del usuario
2. Asigna rol: `PUT /auth/users/{user_id}/role`
   - En `user_id`: pega el ID
   - En body:
     ```json
     {
       "role": "moderator"
     }
     ```
3. Ejecuta

**Verificar:**
- `GET /auth/users` → el usuario debe tener `"role": "moderator"`

---

### 3️⃣ Eliminar un Post (Como Moderador)

**Desde la Página Web:**
1. Inicia sesión como moderador
2. Abre cualquier post (aunque no sea tuyo)
3. Verás el botón de eliminar (tachito rojo) arriba a la derecha
4. Click → confirma → se elimina

**Desde Swagger:**
1. Login como moderador: `POST /auth/login`
2. Autoriza con el token
3. `DELETE /posts/{post_id}` → ejecuta

---

## ✅ Checklist

- [ ] Admin creado en MongoDB
- [ ] Admin verificado en Swagger (`GET /auth/me`)
- [ ] Moderador asignado (`PUT /auth/users/{id}/role`)
- [ ] Moderador puede borrar posts en la web

---

## 🔑 Roles Disponibles

- **`user`**: Usuario normal (solo borra sus posts)
- **`moderator`**: Puede borrar cualquier post
- **`admin`**: Puede asignar roles y borrar posts

---

## 💡 Tips

- **Primera vez:** Crea admin en MongoDB (solo una vez)
- **Después:** Los admins pueden crear más admins/moderadores desde Swagger
- **El botón de eliminar aparece automáticamente** para moderadores en la web

