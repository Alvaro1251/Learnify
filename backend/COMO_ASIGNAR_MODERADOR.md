# 👥 Cómo Asignar Moderador a Otra Persona

## 📋 Resumen Rápido

Solo los **admins** pueden asignar roles. Para hacer moderador a alguien:

1. **Obtén su ID de usuario** (usando `GET /auth/users`)
2. **Usa `PUT /auth/users/{user_id}/role`** con `{"role": "moderator"}`

---

## 🎯 Pasos Detallados

### Paso 1: Asegúrate de ser Admin

1. Abre `http://localhost:8000/docs`
2. Haz login: `POST /auth/login`
3. Copia el `access_token`
4. Click en "Authorize" y pega el token
5. Verifica tu rol: `GET /auth/me`
   - Debe mostrar `"role": "admin"`

### Paso 2: Ver todos los usuarios

1. En Swagger, busca `GET /auth/users`
2. Click en "Try it out" → "Execute"
3. Verás una lista de usuarios con sus IDs

**Ejemplo de respuesta:**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "email": "juan@example.com",
    "role": "user",
    "full_name": "Juan Pérez"
  },
  {
    "id": "507f1f77bcf86cd799439012",
    "email": "maria@example.com",
    "role": "user",
    "full_name": "María García"
  }
]
```

### Paso 3: Encontrar a la persona y copiar su ID

- Busca por email o nombre
- **Copia el `id`** de la persona que quieres hacer moderador
- Ejemplo: `507f1f77bcf86cd799439011`

### Paso 4: Asignar el rol de moderador

1. Busca `PUT /auth/users/{user_id}/role` en Swagger
2. Click en "Try it out"
3. **En `user_id`**, pega el ID que copiaste:
   ```
   507f1f77bcf86cd799439011
   ```
4. **En el Request body**, ingresa:
   ```json
   {
     "role": "moderator"
   }
   ```
5. Click en "Execute"

### Paso 5: Verificar

La respuesta debería mostrar:
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "juan@example.com",
  "role": "moderator",  // ← ¡Ahora es moderador!
  "full_name": "Juan Pérez",
  ...
}
```

---

## 🎨 Ejemplo Visual en Swagger

```
┌─────────────────────────────────────────┐
│ PUT /auth/users/{user_id}/role          │
├─────────────────────────────────────────┤
│                                         │
│ user_id: [507f1f77bcf86cd799439011]     │ ← Pega el ID aquí
│                                         │
│ Request body:                           │
│ ┌─────────────────────────────────┐   │
│ │ {                               │   │
│ │   "role": "moderator"           │   │ ← Cambia a "moderator"
│ │ }                               │   │
│ └─────────────────────────────────┘   │
│                                         │
│ [Execute]                               │
└─────────────────────────────────────────┘
```

---

## 🔄 Cambiar Roles

Puedes cambiar entre estos roles:
- `"user"` - Usuario normal
- `"moderator"` - Puede borrar cualquier post
- `"admin"` - Puede asignar roles y borrar posts

**Solo cambia el valor en `"role"` en el body.**

---

## ⚠️ Errores Comunes

### "Admin access required"
- **Solución:** Asegúrate de ser admin. Verifica con `GET /auth/me`

### "User not found"
- **Solución:** Verifica que el `user_id` sea correcto. Úsalo de `GET /auth/users`

### "Invalid role"
- **Solución:** Solo puedes usar: `"user"`, `"moderator"`, o `"admin"`

---

## 💡 Tips

1. **Guarda los IDs:** Los IDs de usuarios no cambian, puedes guardarlos para futuras referencias
2. **Verifica antes:** Siempre usa `GET /auth/users` antes de asignar roles para confirmar el ID
3. **Prueba después:** Después de asignar moderador, pídele que pruebe borrar un post que no sea suyo

---

## 📝 Resumen Rápido

```bash
# 1. Ver usuarios
GET /auth/users → Copia el ID

# 2. Asignar moderador
PUT /auth/users/{ID}/role
Body: {"role": "moderator"}

# 3. Verificar
GET /auth/users → Debe mostrar "role": "moderator"
```


