# 🐳 Cómo Correr el Backend con Docker

## 🚀 Opción 1: Todo con Docker (Recomendado)

### Paso 1: Asegúrate de estar en el directorio correcto

```bash
cd C:\python\Learnify-nuevo\backend
```

### Paso 2: Levanta todo (MongoDB + Backend)

```bash
docker-compose up
```

**O si quieres que corra en segundo plano:**
```bash
docker-compose up -d
```

### Paso 3: Verifica que está corriendo

**Backend:**
- Abre: `http://localhost:8000/docs`
- Deberías ver la documentación de Swagger

**MongoDB:**
- Está corriendo en `localhost:27017`
- Usuario: `admin`
- Password: `password`
- Base de datos: `learnify`

---

## ⚙️ ¿Cómo Funciona?

### Configuración Automática

El `docker-compose.yml` ya está configurado para:

1. **MongoDB:**
   - Imagen: `mongo:7.0`
   - Puerto: `27017`
   - Credenciales: `admin/password`
   - Base de datos: `learnify`

2. **Backend:**
   - Se conecta automáticamente a MongoDB
   - URL de conexión: `mongodb://admin:password@mongodb:27017/learnify?authSource=admin`
   - Puerto: `8000`
   - Modo: `--reload` (recarga automática al cambiar código)

### Variables de Entorno

El backend usa estas variables automáticamente cuando corre en Docker:
- `MONGODB_URL=mongodb://admin:password@mongodb:27017/learnify?authSource=admin`
- `MONGODB_DB_NAME=learnify`

**Nota:** Dentro de Docker, el servicio MongoDB se llama `mongodb` (no `localhost`), por eso la URL usa `@mongodb:27017` en lugar de `@localhost:27017`.

---

## 📋 Comandos Útiles

### Ver los logs
```bash
# Ver logs de ambos servicios
docker-compose logs -f

# Ver solo logs del backend
docker-compose logs -f backend

# Ver solo logs de MongoDB
docker-compose logs -f mongodb
```

### Detener todo
```bash
docker-compose down
```

### Detener y eliminar volúmenes (borra datos)
```bash
docker-compose down -v
```

### Reiniciar un servicio específico
```bash
# Reiniciar solo el backend
docker-compose restart backend

# Reiniciar solo MongoDB
docker-compose restart mongodb
```

### Reconstruir la imagen del backend (si cambiaste dependencias)
```bash
docker-compose build backend
docker-compose up -d
```

### Ver qué está corriendo
```bash
docker-compose ps
```

---

## 🔧 Solución de Problemas

### Error: "Port already in use"

**Solución:** Algo ya está usando el puerto 8000 o 27017

```bash
# Ver qué está usando el puerto
netstat -ano | findstr :8000
netstat -ano | findstr :27017

# O cambiar los puertos en docker-compose.yml
```

### Error: "Cannot connect to MongoDB"

**Verifica que MongoDB esté corriendo:**
```bash
docker-compose ps
# Deberías ver ambos servicios como "Up"
```

**Prueba conectarte manualmente:**
```bash
docker exec -it learnify_mongodb mongosh -u admin -p password --authenticationDatabase admin
```

### El backend no se conecta a MongoDB

**Verifica las variables de entorno:**
```bash
docker-compose exec backend env | grep MONGODB
```

Deberías ver:
```
MONGODB_URL=mongodb://admin:password@mongodb:27017/learnify?authSource=admin
MONGODB_DB_NAME=learnify
```

### Cambios en el código no se reflejan

El backend está configurado con `--reload`, pero si no funciona:
```bash
docker-compose restart backend
```

---

## 🎯 Opción 2: Solo MongoDB con Docker, Backend Manual

Si prefieres correr el backend manualmente pero MongoDB en Docker:

### Paso 1: Levanta solo MongoDB
```bash
cd C:\python\Learnify-nuevo\backend
docker-compose up mongodb -d
```

### Paso 2: Crea un archivo `.env` en `backend/`
```env
MONGODB_URL=mongodb://admin:password@localhost:27017/learnify?authSource=admin
MONGODB_DB_NAME=learnify
JWT_SECRET_KEY=dev-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
```

### Paso 3: Corre el backend manualmente
```bash
cd C:\python\Learnify-nuevo\backend
poetry install
poetry run python main.py
```

**Nota:** En este caso, la URL es `@localhost:27017` porque el backend corre fuera de Docker.

---

## 📊 Estructura del Proyecto

```
Learnify-nuevo/backend/
├── docker-compose.yml    # Configuración de Docker
├── Dockerfile           # Imagen del backend
├── .env                 # Variables de entorno (opcional)
├── main.py              # Aplicación FastAPI
└── ...
```

---

## ✅ Verificación Rápida

1. **Todo corriendo:**
   ```bash
   docker-compose ps
   ```
   Deberías ver:
   ```
   NAME                  STATUS
   learnify_backend      Up
   learnify_mongodb      Up
   ```

2. **Backend responde:**
   - Abre: `http://localhost:8000/health`
   - Debería responder: `{"status":"healthy"}`

3. **MongoDB responde:**
   ```bash
   docker exec -it learnify_mongodb mongosh -u admin -p password --authenticationDatabase admin
   ```
   Deberías conectarte sin problemas.

---

## 🎉 ¡Listo!

Ahora tienes:
- ✅ MongoDB corriendo en Docker
- ✅ Backend corriendo en Docker
- ✅ Ambos conectados automáticamente
- ✅ API disponible en `http://localhost:8000/docs`

**Para usar el sistema de moderadores, ahora puedes seguir la guía de moderadores.**


