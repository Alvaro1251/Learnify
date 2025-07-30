# 🚀 Guía de Instalación - Learnify

## Prerrequisitos

- **Node.js** (versión 18 o superior)
- **Python** (versión 3.12)
- **Docker** (para MongoDB)
- **Git**

## 📦 Instalación

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd Learnify
```

### 2. Instalar dependencias
```bash
# Instalar dependencias del proyecto raíz
npm install

# Instalar dependencias del frontend
cd frontend
npm install

# Instalar dependencias del backend
cd ../backend
pip install -r requirements.txt
```

### 3. Configurar MongoDB
```bash
# Iniciar MongoDB con Docker
docker-compose up -d mongodb

# Verificar que MongoDB esté corriendo
docker ps
```

### 4. Configurar variables de entorno

Crear archivo `.env.local` en el directorio `frontend/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🏃‍♂️ Ejecutar el proyecto

### Opción 1: Ejecutar todo junto
```bash
# Iniciar MongoDB
npm run start:mongodb

# Iniciar frontend y backend
npm run dev
```

### Opción 2: Ejecutar por separado
```bash
# Terminal 1: MongoDB
docker-compose up -d mongodb

# Terminal 2: Backend
cd backend
python main.py

# Terminal 3: Frontend
cd frontend
npm run dev
```

## 🌐 URLs de acceso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **MongoDB**: localhost:27017
- **Documentación API**: http://localhost:8000/docs

## 🧪 Probar la conexión

1. Abrir http://localhost:3000
2. Navegar a http://localhost:3000/login
3. Probar el formulario de login

## 🔧 Comandos útiles

```bash
# Detener MongoDB
npm run stop:mongodb

# Ver logs de MongoDB
docker-compose logs mongodb

# Reinstalar todas las dependencias
npm run install:all
```

## 🐛 Solución de problemas

### Error de conexión a MongoDB
```bash
# Verificar que Docker esté corriendo
docker --version

# Reiniciar MongoDB
docker-compose down
docker-compose up -d mongodb
```

### Error de dependencias Python
```bash
cd backend
pip install --upgrade pip
pip install -r requirements.txt
```

### Error de dependencias Node.js
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## 📝 Notas importantes

- El backend debe estar corriendo en el puerto 8000
- El frontend debe estar corriendo en el puerto 3000
- MongoDB debe estar corriendo en el puerto 27017
- Asegúrate de que los puertos no estén ocupados por otras aplicaciones 