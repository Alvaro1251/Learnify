# 🗄️ Guía: Cómo Levantar la Base de Datos MongoDB

Esta guía te muestra **3 formas diferentes** de levantar MongoDB para poder ver y trabajar con tus datos. Elige la que más te convenga:

---

## 📋 Opción 1: MongoDB Atlas (Vía Web - GRATIS) ⭐ RECOMENDADO

**✅ Ventajas:**
- No necesitas instalar nada
- Acceso desde cualquier lugar
- Panel web para ver tus datos
- Gratis hasta 512MB (suficiente para desarrollo)
- Backup automático

**❌ Desventajas:**
- Requiere conexión a internet
- Configuración inicial puede tomar 5-10 minutos

### Pasos:

1. **Crear cuenta en MongoDB Atlas:**
   - Ve a: https://www.mongodb.com/cloud/atlas/register
   - Regístrate con tu email (gratis)

2. **Crear un cluster:**
   - Después de registrarte, haz click en "Build a Database"
   - Elige el plan **FREE (M0)**
   - Selecciona un proveedor (AWS, Google Cloud, Azure) y una región cercana
   - Click en "Create"

3. **Configurar acceso:**
   - **Database Access:**
     - Ve a "Database Access" en el menú lateral
     - Click en "Add New Database User"
     - Username: `learnify_user`
     - Password: Genera una contraseña segura (guárdala)
     - Privileges: "Atlas admin" o "Read and write to any database"
     - Click en "Add User"
   
   - **Network Access:**
     - Ve a "Network Access" en el menú lateral
     - Click en "Add IP Address"
     - Click en "Allow Access from Anywhere" (para desarrollo)
     - O agrega tu IP actual
     - Click en "Confirm"

4. **Obtener la URL de conexión:**
   - Ve a "Database" → Click en "Connect"
   - Elige "Connect your application"
   - Selecciona "Python" y versión "3.6 or later"
   - Copia la connection string (algo como):
     ```
     mongodb+srv://learnify_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```

5. **Configurar en tu proyecto:**
   - Ve a `Learnify-nuevo/backend/`
   - Crea un archivo `.env` (si no existe):
     ```env
     MONGODB_URL=mongodb+srv://learnify_user:TU_PASSWORD@cluster0.xxxxx.mongodb.net/learnify?retryWrites=true&w=majority
     MONGODB_DB_NAME=learnify
     JWT_SECRET_KEY=dev-secret-key
     JWT_ALGORITHM=HS256
     JWT_EXPIRATION_HOURS=24
     ```
   - **Reemplaza** `TU_PASSWORD` con la contraseña que creaste
   - **Reemplaza** `cluster0.xxxxx.mongodb.net` con tu cluster real

6. **Ver tus datos en el panel web:**
   - Ve a "Database" → "Browse Collections"
   - Ahí verás todas tus colecciones (users, posts, notes, etc.)
   - Puedes ver, editar y eliminar documentos directamente desde la web

7. **Levantar el backend:**
   ```bash
   cd Learnify-nuevo/backend
   poetry install
   poetry run python main.py
   ```

---

## 🐳 Opción 2: Docker (Fácil - Local)

**✅ Ventajas:**
- No necesitas instalar MongoDB
- Funciona sin internet (después de la primera descarga)
- Muy rápido de levantar

**❌ Desventajas:**
- Necesitas tener Docker instalado
- Los datos se guardan localmente (no hay backup automático)

### Pasos:

1. **Instalar Docker Desktop (si no lo tienes):**
   - Descarga: https://www.docker.com/products/docker-desktop
   - Instala y reinicia tu computadora
   - Abre Docker Desktop y espera a que inicie

2. **Levantar MongoDB con Docker:**
   ```bash
   cd Learnify-nuevo/backend
   docker-compose up mongodb -d
   ```
   
   Esto descarga MongoDB (si es la primera vez) y lo levanta en el puerto 27017.

3. **Verificar que está corriendo:**
   ```bash
   docker ps
   ```
   Deberías ver `learnify_mongodb` en la lista.

4. **Conectarte a MongoDB para ver los datos:**

   **Opción A: Usar MongoDB Compass (Interfaz Gráfica)**
   - Descarga: https://www.mongodb.com/products/compass
   - Conecta con: `mongodb://admin:password@localhost:27017/learnify?authSource=admin`
   
   **Opción B: Usar línea de comandos:**
   ```bash
   docker exec -it learnify_mongodb mongosh -u admin -p password --authenticationDatabase admin
   ```
   
   Luego puedes usar comandos como:
   ```javascript
   use learnify
   show collections
   db.posts.find().pretty()
   db.users.find().pretty()
   ```

5. **Configurar el backend:**
   - Crea un archivo `.env` en `Learnify-nuevo/backend/`:
     ```env
     MONGODB_URL=mongodb://admin:password@localhost:27017/learnify?authSource=admin
     MONGODB_DB_NAME=learnify
     JWT_SECRET_KEY=dev-secret-key
     JWT_ALGORITHM=HS256
     JWT_EXPIRATION_HOURS=24
     ```

6. **Levantar el backend:**
   ```bash
   cd Learnify-nuevo/backend
   poetry install
   poetry run python main.py
   ```

---

## 💾 Opción 3: MongoDB Local (Instalación Completa)

**✅ Ventajas:**
- Control total
- Sin dependencias externas

**❌ Desventajas:**
- Más complejo de instalar
- Ocupa espacio en tu disco

### Pasos:

1. **Instalar MongoDB:**
   - Windows: Descarga el instalador desde https://www.mongodb.com/try/download/community
   - Selecciona "Complete" installation
   - Durante la instalación, marca "Install MongoDB as a Service"
   - Marca "Install MongoDB Compass" (interfaz gráfica)

2. **Verificar instalación:**
   - MongoDB debería iniciarse automáticamente como servicio
   - Puedes verificar en "Services" de Windows buscando "MongoDB"

3. **Conectarte a MongoDB:**
   - Abre MongoDB Compass (instalado con MongoDB)
   - Conecta con: `mongodb://localhost:27017`
   - O crea una nueva conexión con ese string

4. **Configurar el backend:**
   - Crea un archivo `.env` en `Learnify-nuevo/backend/`:
     ```env
     MONGODB_URL=mongodb://localhost:27017
     MONGODB_DB_NAME=learnify
     JWT_SECRET_KEY=dev-secret-key
     JWT_ALGORITHM=HS256
     JWT_EXPIRATION_HOURS=24
     ```

5. **Levantar el backend:**
   ```bash
   cd Learnify-nuevo/backend
   poetry install
   poetry run python main.py
   ```

---

## 🔍 Ver tus Datos en Tiempo Real

### Si usas MongoDB Atlas (Opción 1):
- Ve al panel web de Atlas
- Click en "Database" → "Browse Collections"
- Selecciona la colección que quieras ver (posts, users, notes, etc.)
- Puedes ver, editar y eliminar documentos en tiempo real

### Si usas Docker o MongoDB Local:

**Con MongoDB Compass (Recomendado):**
1. Descarga: https://www.mongodb.com/products/compass
2. Conecta con:
   - Docker: `mongodb://admin:password@localhost:27017/learnify?authSource=admin`
   - Local: `mongodb://localhost:27017`
3. Navega a la base de datos `learnify`
4. Explora las colecciones: `posts`, `users`, `notes`, `study_groups`

**Con línea de comandos:**
```bash
# Docker
docker exec -it learnify_mongodb mongosh -u admin -p password --authenticationDatabase admin

# Local
mongosh
```

Luego:
```javascript
use learnify
show collections

// Ver todos los posts
db.posts.find().pretty()

// Ver un post específico
db.posts.findOne({title: "¿Cómo empezar con Python?"})

// Contar posts
db.posts.countDocuments()

// Ver usuarios
db.users.find().pretty()

// Ver respuestas dentro de un post
db.posts.findOne({_id: ObjectId("507f1f77bcf86cd799439011")})
```

---

## 📊 Estructura de Datos en MongoDB

Tu base de datos `learnify` tendrá estas colecciones:

- **users**: Usuarios registrados
- **posts**: Publicaciones y preguntas
- **notes**: Notas de los usuarios
- **study_groups**: Grupos de estudio

Cada post tiene esta estructura:
```json
{
  "_id": ObjectId("..."),
  "title": "¿Cómo empezar con Python?",
  "description": "Soy nuevo en programación...",
  "subject": "Programming",
  "owner": ObjectId("..."),  // Referencia al usuario
  "creation_date": ISODate("2024-10-27T21:30:00Z"),
  "responses": [
    {
      "owner": ObjectId("..."),
      "content": "Te recomiendo Codecademy",
      "creation_date": ISODate("2024-10-27T21:45:00Z")
    }
  ]
}
```

---

## 🚀 Levantar Todo (Backend + MongoDB)

### Opción A: Todo con Docker (Más Fácil)
```bash
cd Learnify-nuevo/backend
docker-compose up
```
Esto levanta MongoDB y el backend automáticamente.

### Opción B: MongoDB separado + Backend manual
```bash
# Terminal 1: MongoDB
cd Learnify-nuevo/backend
docker-compose up mongodb -d

# Terminal 2: Backend
cd Learnify-nuevo/backend
poetry install
poetry run python main.py
```

---

## ⚠️ Problemas Comunes

### "Failed to connect to MongoDB"
- Verifica que MongoDB esté corriendo
- Revisa la URL en tu archivo `.env`
- Si usas Docker: `docker ps` para ver si el contenedor está activo
- Si usas Atlas: Verifica que tu IP esté en la whitelist

### "Authentication failed"
- Verifica usuario y contraseña en `.env`
- Si usas Docker: Usuario `admin`, Password `password`
- Si usas Atlas: Verifica las credenciales en Database Access

### No veo mis datos
- Verifica que estés conectado a la base de datos correcta (`learnify`)
- Si creaste datos, deberían estar en las colecciones `posts`, `users`, etc.
- Prueba crear un post desde la API y luego búscalo en MongoDB

---

## 📝 Recomendación

**Para desarrollo:**
- **Opción 1 (MongoDB Atlas)** si quieres ver tus datos desde cualquier lugar y tener backup automático
- **Opción 2 (Docker)** si prefieres trabajar localmente sin internet

**Para producción:**
- Usa **MongoDB Atlas** (gratis hasta 512MB, luego hay planes de pago)

---

## 🔗 Enlaces Útiles

- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- MongoDB Compass: https://www.mongodb.com/products/compass
- Docker Desktop: https://www.docker.com/products/docker-desktop
- Documentación MongoDB: https://docs.mongodb.com/

---

¿Necesitas ayuda? Revisa los logs del backend o los logs de MongoDB para ver qué está pasando.

