# 🤔 Explicación: ¿Cómo Funcionan los Roles?

## ❓ La Pregunta Clave

**"Si todos empiezan como 'user', ¿cómo se crea el primer admin?"**

---

## 📊 El Sistema de Roles

### Roles Disponibles
- **`user`**: Usuario normal (por defecto)
- **`moderator`**: Puede borrar cualquier post
- **`admin`**: Puede asignar roles y borrar posts

### ¿Qué pasa cuando te registras?

Cuando alguien se registra por primera vez:
```json
{
  "email": "nuevo@example.com",
  "password": "...",
  "role": "user"  // ← SIEMPRE empieza como "user"
}
```

**Todos empiezan como "user" por seguridad.**

---

## 🔐 El Problema del Huevo y la Gallina

### La Situación:

```
1. Todos los usuarios nuevos = "user"
2. Solo los "admin" pueden asignar roles
3. Pero no hay ningún "admin" todavía...
4. ¿Cómo crear el primer admin? 🤔
```

### La Solución:

**Tienes que crear el primer admin MANUALMENTE en MongoDB.**

Una vez que tengas un admin, ese admin puede crear más admins usando la API.

---

## 🛠️ Proceso Completo

### Paso 1: Registrarse (Normal)

1. Cualquiera se registra:
   ```
   POST /auth/register
   {
     "email": "yo@example.com",
     "password": "mipassword"
   }
   ```

2. Automáticamente se crea como `"role": "user"`

### Paso 2: Crear el Primer Admin (Manual)

**Esto solo se hace UNA VEZ, la primera vez.**

1. Conéctate a MongoDB:
   ```bash
   docker exec -it learnify_mongodb mongosh -u admin -p password --authenticationDatabase admin
   ```

2. Actualiza tu usuario:
   ```javascript
   use learnify
   db.users.updateOne(
     {email: "yo@example.com"},
     {$set: {role: "admin"}}
   )
   ```

3. **¡Listo!** Ahora eres admin.

### Paso 3: Verificar que Eres Admin

1. Inicia sesión: `POST /auth/login`
2. Verifica tu rol: `GET /auth/me`
3. Deberías ver: `"role": "admin"`

### Paso 4: Crear Más Admins/Moderadores (Desde la API)

Ahora que eres admin, puedes asignar roles usando:

```
PUT /auth/users/{user_id}/role
{
  "role": "moderator"  // o "admin"
}
```

Ya NO necesitas MongoDB para esto.

---

## 🎯 Flujo Visual

```
┌─────────────────────────────────────────────┐
│ 1. Registro de Usuario                      │
│    → Automáticamente: role = "user"          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 2. Crear Primer Admin (MANUAL en MongoDB)   │
│    → db.users.updateOne({role: "admin"})   │
│    → Esto solo se hace UNA VEZ              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 3. Verificar que eres Admin                │
│    → GET /auth/me → "role": "admin"        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 4. Asignar Roles a Otros (Desde la API)    │
│    → PUT /auth/users/{id}/role             │
│    → Puedes crear más admins/moderadores    │
└─────────────────────────────────────────────┘
```

---

## 💡 Preguntas Frecuentes

### ¿Por qué no todos empiezan como admin?
**Seguridad.** Si todos fueran admin, cualquiera podría asignar roles y causar problemas.

### ¿Por qué tengo que usar MongoDB la primera vez?
Porque no hay ningún admin todavía que pueda usar la API. Es el "bootstrap" del sistema.

### ¿Tengo que hacer esto cada vez?
**No.** Solo la primera vez. Una vez que tengas un admin, ese admin puede crear más usando la API.

### ¿Puedo hacer admin a alguien más desde la API?
**Sí**, pero solo si TÚ eres admin. Si eres admin, puedes usar:
```
PUT /auth/users/{user_id}/role
{"role": "admin"}
```

### ¿Cómo sé si soy admin?
1. Haz login: `POST /auth/login`
2. Verifica: `GET /auth/me`
3. Si ves `"role": "admin"` → Eres admin ✅
4. Si ves `"role": "user"` → Aún no eres admin ❌

---

## 📝 Resumen

1. **Todos empiezan como "user"** (por seguridad)
2. **Primera vez:** Crea admin manualmente en MongoDB
3. **Después:** Los admins pueden crear más admins/moderadores desde la API
4. **Verifica tu rol:** `GET /auth/me`

---

## ✅ Checklist: ¿Soy Admin?

- [ ] ¿Hice login y obtuve mi token?
- [ ] ¿Verifiqué con `GET /auth/me`?
- [ ] ¿Veo `"role": "admin"` en la respuesta?
- [ ] Si no, ¿hice el paso de MongoDB para crear el primer admin?

Si respondiste "Sí" a todas, ¡eres admin! 🎉

