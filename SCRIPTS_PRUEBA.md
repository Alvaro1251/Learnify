# 🧪 Scripts de Prueba - Learnify

Este documento contiene scripts para probar todas las funcionalidades del sistema localmente.

## 📋 Índice

1. [Autenticación](#autenticación)
2. [Perfil](#perfil)
3. [Publicaciones (Posts)](#publicaciones-posts)
4. [Apuntes (Notes)](#apuntes-notes)
5. [Grupos de Estudio](#grupos-de-estudio)
6. [Chat WebSocket](#chat-websocket)
7. [Script Python Completo](#script-python-completo)

---

## ⚙️ Configuración Inicial

**IMPORTANTE:** Guarda tu token después de registrarte/login para usar en los demás comandos.

```powershell
# Variable para guardar el token
$TOKEN = "TU_TOKEN_AQUI"
$BASE_URL = "http://localhost:8000"
```

---

## 🔐 Autenticación

### 1. Registrar Usuario

```powershell
# Usuario 1
$response = Invoke-RestMethod -Uri "$BASE_URL/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body (@{
        email = "juan@example.com"
        password = "password123"
    } | ConvertTo-Json)

$TOKEN_USER1 = $response.access_token
Write-Host "Token Usuario 1: $TOKEN_USER1" -ForegroundColor Green
```

```powershell
# Usuario 2 (para probar interacciones)
$response = Invoke-RestMethod -Uri "$BASE_URL/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body (@{
        email = "maria@example.com"
        password = "password123"
    } | ConvertTo-Json)

$TOKEN_USER2 = $response.access_token
Write-Host "Token Usuario 2: $TOKEN_USER2" -ForegroundColor Green
```

### 2. Login

```powershell
$response = Invoke-RestMethod -Uri "$BASE_URL/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body (@{
        email = "juan@example.com"
        password = "password123"
    } | ConvertTo-Json)

$TOKEN = $response.access_token
Write-Host "Token: $TOKEN" -ForegroundColor Green
```

### 3. Obtener Usuario Actual

```powershell
$headers = @{
    Authorization = "Bearer $TOKEN"
}

$user = Invoke-RestMethod -Uri "$BASE_URL/auth/me" `
    -Method GET `
    -Headers $headers

$user | ConvertTo-Json -Depth 10
```

---

## 👤 Perfil

### 1. Actualizar Perfil

```powershell
$headers = @{
    Authorization = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}

$profile = @{
    full_name = "Juan"
    last_name = "Pérez"
    career = "Computer Science"
    university = "MIT"
    birth_date = "1998-05-15T00:00:00"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$BASE_URL/profile/update" `
    -Method PUT `
    -Headers $headers `
    -Body $profile

$response | ConvertTo-Json -Depth 10
```

### 2. Obtener Mi Perfil

```powershell
$headers = @{
    Authorization = "Bearer $TOKEN"
}

$profile = Invoke-RestMethod -Uri "$BASE_URL/profile/me" `
    -Method GET `
    -Headers $headers

$profile | ConvertTo-Json -Depth 10
```

---

## 📝 Publicaciones (Posts)

### 1. Crear Publicación

```powershell
$headers = @{
    Authorization = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}

$post = @{
    title = "¿Cómo aprender Python desde cero?"
    description = "Estoy empezando con Python y me gustaría saber por dónde comenzar. ¿Algún consejo?"
    subject = "Programming"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$BASE_URL/posts/create" `
    -Method POST `
    -Headers $headers `
    -Body $post

$POST_ID = $response.id
Write-Host "Post ID: $POST_ID" -ForegroundColor Green
$response | ConvertTo-Json -Depth 10
```

### 2. Obtener Últimas Publicaciones

```powershell
$posts = Invoke-RestMethod -Uri "$BASE_URL/posts/latest?limit=5" `
    -Method GET

$posts | ConvertTo-Json -Depth 10
```

### 3. Obtener Detalle de Publicación

```powershell
# Reemplaza POST_ID con el ID real
$post = Invoke-RestMethod -Uri "$BASE_URL/posts/$POST_ID" `
    -Method GET

$post | ConvertTo-Json -Depth 10
```

### 4. Agregar Respuesta a Publicación

```powershell
$headers = @{
    Authorization = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}

$response_data = @{
    content = "Te recomiendo empezar con Codecademy o freeCodeCamp. Son excelentes recursos gratuitos."
} | ConvertTo-Json

$post = Invoke-RestMethod -Uri "$BASE_URL/posts/$POST_ID/response" `
    -Method POST `
    -Headers $headers `
    -Body $response_data

$post | ConvertTo-Json -Depth 10
```

### 5. Obtener Mis Publicaciones

```powershell
$headers = @{
    Authorization = "Bearer $TOKEN"
}

$myPosts = Invoke-RestMethod -Uri "$BASE_URL/posts/my/posts" `
    -Method GET `
    -Headers $headers

$myPosts | ConvertTo-Json -Depth 10
```

### 6. Eliminar Publicación

```powershell
$headers = @{
    Authorization = "Bearer $TOKEN"
}

$response = Invoke-RestMethod -Uri "$BASE_URL/posts/$POST_ID" `
    -Method DELETE `
    -Headers $headers

$response | ConvertTo-Json
```

---

## 📚 Apuntes (Notes)

### 1. Crear Apunte

```powershell
$headers = @{
    Authorization = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}

$note = @{
    title = "Python Basics - Variables y Tipos"
    description = "Apuntes sobre variables, tipos de datos y operadores básicos en Python"
    subject = "Programming"
    university = "MIT"
    career = "Computer Science"
    tags = @("python", "programming", "beginner")
    file_url = "https://example.com/python-basics.pdf"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$BASE_URL/notes/create" `
    -Method POST `
    -Headers $headers `
    -Body $note

$NOTE_ID = $response.id
Write-Host "Note ID: $NOTE_ID" -ForegroundColor Green
$response | ConvertTo-Json -Depth 10
```

### 2. Buscar Apuntes (Filtros)

```powershell
# Por universidad
Invoke-RestMethod -Uri "$BASE_URL/notes/?university=MIT" -Method GET

# Por carrera
Invoke-RestMethod -Uri "$BASE_URL/notes/?career=Computer%20Science" -Method GET

# Por materia
Invoke-RestMethod -Uri "$BASE_URL/notes/?subject=Programming" -Method GET

# Por tags (múltiples)
Invoke-RestMethod -Uri "$BASE_URL/notes/?tags=python&tags=beginner" -Method GET

# Combinado
Invoke-RestMethod -Uri "$BASE_URL/notes/?university=MIT&career=Computer%20Science&subject=Programming&tags=python" -Method GET
```

### 3. Obtener Últimas 3 Apuntes

```powershell
$notes = Invoke-RestMethod -Uri "$BASE_URL/notes/latest/notes" -Method GET
$notes | ConvertTo-Json -Depth 10
```

### 4. Obtener Detalle de Apunte

```powershell
$note = Invoke-RestMethod -Uri "$BASE_URL/notes/$NOTE_ID" -Method GET
$note | ConvertTo-Json -Depth 10
```

### 5. Obtener Mis Apuntes

```powershell
$headers = @{
    Authorization = "Bearer $TOKEN"
}

$myNotes = Invoke-RestMethod -Uri "$BASE_URL/notes/my/notes" `
    -Method GET `
    -Headers $headers

$myNotes | ConvertTo-Json -Depth 10
```

### 6. Eliminar Apunte

```powershell
$headers = @{
    Authorization = "Bearer $TOKEN"
}

$response = Invoke-RestMethod -Uri "$BASE_URL/notes/$NOTE_ID" `
    -Method DELETE `
    -Headers $headers

$response | ConvertTo-Json
```

---

## 👥 Grupos de Estudio

### 1. Crear Grupo de Estudio

```powershell
$headers = @{
    Authorization = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}

$group = @{
    name = "Python Avanzado 2024"
    description = "Grupo de estudio para conceptos avanzados de Python y preparación de examen"
    is_public = $true
    exam_date = "2024-12-15T10:00:00"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$BASE_URL/study-groups/create" `
    -Method POST `
    -Headers $headers `
    -Body $group

$GROUP_ID = $response.id
Write-Host "Group ID: $GROUP_ID" -ForegroundColor Green
$response | ConvertTo-Json -Depth 10
```

### 2. Obtener Grupos Públicos

```powershell
$groups = Invoke-RestMethod -Uri "$BASE_URL/study-groups/public" -Method GET
$groups | ConvertTo-Json -Depth 10
```

### 3. Obtener Mis Grupos

```powershell
$headers = @{
    Authorization = "Bearer $TOKEN"
}

$myGroups = Invoke-RestMethod -Uri "$BASE_URL/study-groups/my/groups" `
    -Method GET `
    -Headers $headers

$myGroups | ConvertTo-Json -Depth 10
```

### 4. Obtener Detalle de Grupo

```powershell
$group = Invoke-RestMethod -Uri "$BASE_URL/study-groups/$GROUP_ID" -Method GET
$group | ConvertTo-Json -Depth 10
```

### 5. Unirse a Grupo (Público)

```powershell
$headers = @{
    Authorization = "Bearer $TOKEN_USER2"
}

$response = Invoke-RestMethod -Uri "$BASE_URL/study-groups/$GROUP_ID/join" `
    -Method POST `
    -Headers $headers

$response | ConvertTo-Json
```

### 6. Compartir Archivo en Grupo

```powershell
$headers = @{
    Authorization = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}

$file = @{
    file_url = "https://example.com/study-material.pdf"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$BASE_URL/study-groups/$GROUP_ID/share-file" `
    -Method POST `
    -Headers $headers `
    -Body $file

$response.group | ConvertTo-Json -Depth 10
```

### 7. Obtener Mensajes del Chat

```powershell
$messages = Invoke-RestMethod -Uri "$BASE_URL/study-groups/$GROUP_ID/messages?limit=50" -Method GET
$messages.messages | ConvertTo-Json -Depth 10
```

### 8. Salir de Grupo

```powershell
$headers = @{
    Authorization = "Bearer $TOKEN"
}

$response = Invoke-RestMethod -Uri "$BASE_URL/study-groups/$GROUP_ID/leave" `
    -Method POST `
    -Headers $headers

$response | ConvertTo-Json
```

---

## 💬 Chat WebSocket

### Prueba con wscat (Instalar: `npm install -g wscat`)

```powershell
# Conectar a un grupo
wscat -c ws://localhost:8000/study-groups/ws/$GROUP_ID

# Enviar mensaje (desde wscat):
{"sender_id": "TU_USER_ID", "content": "Hola a todos!"}
```

### Prueba con Python (ver script completo abajo)

```python
import asyncio
import websockets
import json

async def chat_test(group_id, user_id):
    uri = f"ws://localhost:8000/study-groups/ws/{group_id}"
    async with websockets.connect(uri) as websocket:
        # Enviar mensaje
        message = {
            "sender_id": user_id,
            "content": "Hola desde Python!"
        }
        await websocket.send(json.dumps(message))
        
        # Recibir mensajes
        async for message in websocket:
            print(json.loads(message))

# Ejecutar
asyncio.run(chat_test("GROUP_ID", "USER_ID"))
```

---

## 🐍 Script Python Completo

Copia este script en un archivo `test_learnify.py`:

```python
import requests
import json
import asyncio
import websockets
from datetime import datetime

BASE_URL = "http://localhost:8000"

# ============================================
# 1. AUTENTICACIÓN
# ============================================

def register_user(email, password):
    """Registrar nuevo usuario"""
    response = requests.post(
        f"{BASE_URL}/auth/register",
        json={"email": email, "password": password}
    )
    response.raise_for_status()
    token = response.json()["access_token"]
    print(f"✅ Usuario registrado: {email}")
    return token

def login_user(email, password):
    """Login usuario existente"""
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": email, "password": password}
    )
    response.raise_for_status()
    token = response.json()["access_token"]
    print(f"✅ Login exitoso: {email}")
    return token

def get_current_user(token):
    """Obtener usuario actual"""
    response = requests.get(
        f"{BASE_URL}/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    response.raise_for_status()
    return response.json()

# ============================================
# 2. PERFIL
# ============================================

def update_profile(token, profile_data):
    """Actualizar perfil"""
    response = requests.put(
        f"{BASE_URL}/profile/update",
        headers={"Authorization": f"Bearer {token}"},
        json=profile_data
    )
    response.raise_for_status()
    print("✅ Perfil actualizado")
    return response.json()

# ============================================
# 3. PUBLICACIONES
# ============================================

def create_post(token, title, description, subject):
    """Crear publicación"""
    response = requests.post(
        f"{BASE_URL}/posts/create",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": title, "description": description, "subject": subject}
    )
    response.raise_for_status()
    post = response.json()
    print(f"✅ Post creado: {post['id']}")
    return post

def get_latest_posts(limit=10):
    """Obtener últimas publicaciones"""
    response = requests.get(f"{BASE_URL}/posts/latest?limit={limit}")
    response.raise_for_status()
    return response.json()

def add_response(token, post_id, content):
    """Agregar respuesta a publicación"""
    response = requests.post(
        f"{BASE_URL}/posts/{post_id}/response",
        headers={"Authorization": f"Bearer {token}"},
        json={"content": content}
    )
    response.raise_for_status()
    print(f"✅ Respuesta agregada al post {post_id}")
    return response.json()

# ============================================
# 4. APUNTES
# ============================================

def create_note(token, note_data):
    """Crear apunte"""
    response = requests.post(
        f"{BASE_URL}/notes/create",
        headers={"Authorization": f"Bearer {token}"},
        json=note_data
    )
    response.raise_for_status()
    note = response.json()
    print(f"✅ Nota creada: {note['id']}")
    return note

def search_notes(filters=None):
    """Buscar apuntes con filtros"""
    params = filters or {}
    response = requests.get(f"{BASE_URL}/notes/", params=params)
    response.raise_for_status()
    return response.json()

# ============================================
# 5. GRUPOS DE ESTUDIO
# ============================================

def create_study_group(token, name, description, is_public=True, exam_date=None):
    """Crear grupo de estudio"""
    data = {
        "name": name,
        "description": description,
        "is_public": is_public
    }
    if exam_date:
        data["exam_date"] = exam_date
    
    response = requests.post(
        f"{BASE_URL}/study-groups/create",
        headers={"Authorization": f"Bearer {token}"},
        json=data
    )
    response.raise_for_status()
    group = response.json()
    print(f"✅ Grupo creado: {group['id']}")
    return group

def join_group(token, group_id):
    """Unirse a grupo"""
    response = requests.post(
        f"{BASE_URL}/study-groups/{group_id}/join",
        headers={"Authorization": f"Bearer {token}"}
    )
    response.raise_for_status()
    print(f"✅ Unido al grupo {group_id}")
    return response.json()

def share_file(token, group_id, file_url):
    """Compartir archivo en grupo"""
    response = requests.post(
        f"{BASE_URL}/study-groups/{group_id}/share-file",
        headers={"Authorization": f"Bearer {token}"},
        json={"file_url": file_url}
    )
    response.raise_for_status()
    print(f"✅ Archivo compartido en grupo {group_id}")
    return response.json()

# ============================================
# 6. CHAT WEBSOCKET
# ============================================

async def chat_test(group_id, user_id, messages):
    """Probar chat en tiempo real"""
    uri = f"ws://localhost:8000/study-groups/ws/{group_id}"
    async with websockets.connect(uri) as websocket:
        print(f"✅ Conectado al chat del grupo {group_id}")
        
        # Enviar mensajes
        for msg in messages:
            message = {
                "sender_id": user_id,
                "content": msg
            }
            await websocket.send(json.dumps(message))
            print(f"📤 Enviado: {msg}")
            await asyncio.sleep(1)
        
        # Recibir mensajes por 5 segundos
        try:
            async for message in websocket:
                data = json.loads(message)
                print(f"📥 Recibido: {data.get('sender_name', 'Unknown')}: {data.get('content', '')}")
                await asyncio.sleep(0.1)
        except asyncio.TimeoutError:
            pass

# ============================================
# FLUJO COMPLETO DE PRUEBA
# ============================================

def run_full_test():
    """Ejecutar pruebas completas"""
    print("\n" + "="*60)
    print("🧪 INICIANDO PRUEBAS COMPLETAS")
    print("="*60 + "\n")
    
    # 1. Registrar usuarios
    print("1️⃣  AUTENTICACIÓN")
    token1 = register_user("test1@example.com", "password123")
    token2 = register_user("test2@example.com", "password123")
    
    user1 = get_current_user(token1)
    user2 = get_current_user(token2)
    user1_id = user1["id"]
    user2_id = user2["id"]
    
    # 2. Actualizar perfiles
    print("\n2️⃣  PERFILES")
    update_profile(token1, {
        "full_name": "Juan",
        "last_name": "Pérez",
        "career": "Computer Science",
        "university": "MIT"
    })
    
    update_profile(token2, {
        "full_name": "María",
        "last_name": "García",
        "career": "Data Science",
        "university": "Stanford"
    })
    
    # 3. Crear publicaciones
    print("\n3️⃣  PUBLICACIONES")
    post1 = create_post(
        token1,
        "¿Cómo empezar con Python?",
        "Soy nuevo en programación y quiero aprender Python",
        "Programming"
    )
    
    # Agregar respuesta
    add_response(token2, post1["id"], "Te recomiendo empezar con los tutoriales de Python.org")
    
    # Obtener últimas publicaciones
    posts = get_latest_posts(5)
    print(f"✅ Obtenidas {len(posts)} publicaciones")
    
    # 4. Crear apuntes
    print("\n4️⃣  APUNTES")
    note1 = create_note(token1, {
        "title": "Python Basics",
        "description": "Fundamentos de Python",
        "subject": "Programming",
        "university": "MIT",
        "career": "Computer Science",
        "tags": ["python", "beginner"],
        "file_url": "https://example.com/python.pdf"
    })
    
    # Buscar apuntes
    notes = search_notes({"university": "MIT", "subject": "Programming"})
    print(f"✅ Encontrados {len(notes)} apuntes")
    
    # 5. Crear grupo de estudio
    print("\n5️⃣  GRUPOS DE ESTUDIO")
    group = create_study_group(
        token1,
        "Python Avanzado 2024",
        "Grupo para estudiar Python avanzado",
        is_public=True,
        exam_date="2024-12-15T10:00:00"
    )
    group_id = group["id"]
    
    # Unirse al grupo
    join_group(token2, group_id)
    
    # Compartir archivo
    share_file(token1, group_id, "https://example.com/study-material.pdf")
    
    # 6. Chat en tiempo real
    print("\n6️⃣  CHAT WEBSOCKET")
    print("Ejecuta esto en otra terminal para probar chat:")
    print(f"   python -c \"import asyncio; from test_learnify import chat_test; asyncio.run(chat_test('{group_id}', '{user1_id}', ['Hola!', '¿Cómo están?']))\"")
    
    print("\n" + "="*60)
    print("✅ PRUEBAS COMPLETADAS")
    print("="*60 + "\n")
    
    return {
        "user1_token": token1,
        "user2_token": token2,
        "user1_id": user1_id,
        "user2_id": user2_id,
        "post_id": post1["id"],
        "note_id": note1["id"],
        "group_id": group_id
    }

if __name__ == "__main__":
    results = run_full_test()
    print("\n📋 IDs GENERADOS:")
    print(json.dumps(results, indent=2))
```

---

## 🚀 Cómo Usar los Scripts

### PowerShell (Windows)

1. Abre PowerShell
2. Ejecuta los comandos uno por uno
3. Guarda los tokens en variables para reutilizar

### Python

```powershell
# Instalar dependencias
pip install requests websockets

# Ejecutar script completo
python test_learnify.py
```

---

## 📊 Notas Importantes

- **Tokens expiran** después de 24 horas (configurable)
- **IDs de MongoDB** se devuelven como strings
- **WebSocket** requiere conexión activa para funcionar
- **Filtros** en búsqueda de notas son case-insensitive
- **Grupos públicos** permiten unirse inmediatamente
- **Grupos privados** requieren aprobación del dueño

---

## ✅ Checklist de Pruebas

- [ ] Registrar 2 usuarios
- [ ] Login con ambos usuarios
- [ ] Actualizar perfiles
- [ ] Crear publicación
- [ ] Agregar respuesta a publicación
- [ ] Crear apunte
- [ ] Buscar apuntes con filtros
- [ ] Crear grupo de estudio
- [ ] Unirse a grupo
- [ ] Compartir archivo en grupo
- [ ] Probar chat WebSocket
- [ ] Obtener mis publicaciones/apuntes/grupos

---

¡Listo para probar! 🎉


