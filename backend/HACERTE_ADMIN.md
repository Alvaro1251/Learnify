# 👑 Hacerse Admin - Comando Rápido

## Paso 1: Conectarte a MongoDB

```bash
docker exec -it learnify_mongodb mongosh -u admin -p password --authenticationDatabase admin
```

## Paso 2: Ejecutar estos comandos

```javascript
use learnify
```

```javascript
db.users.updateOne(
  {email: "fabrizio14@live.com.ar"},
  {$set: {role: "admin"}}
)
```

Debería responder:
```
{
  acknowledged: true,
  insertedId: null,
  matchedCount: 1,
  modifiedCount: 1,
  upsertedCount: 0
}
```

## Paso 3: Verificar

```javascript
db.users.findOne({email: "fabrizio14@live.com.ar"})
```

Deberías ver:
```javascript
{
  _id: ObjectId('690909695e8d76c265ea0710'),
  email: "fabrizio14@live.com.ar",
  role: "admin",  // ← ¡Ahora eres admin!
  full_name: "Fabrizio",
  ...
}
```

## Paso 4: Salir

```javascript
exit
```

## Paso 5: Verificar en la API

1. Abre: `http://localhost:8000/docs`
2. Haz login: `POST /auth/login` con tu email y password
3. Copia el `access_token`
4. Click en "Authorize" y pega el token
5. Verifica: `GET /auth/me`
6. Deberías ver: `"role": "admin"` ✅

---

## 🎯 Comando Todo en Uno

```bash
docker exec -it learnify_mongodb mongosh -u admin -p password --authenticationDatabase admin --eval "use learnify; db.users.updateOne({email: 'fabrizio14@live.com.ar'}, {\$set: {role: 'admin'}}); db.users.findOne({email: 'fabrizio14@live.com.ar'}, {email: 1, role: 1})"
```


