#!/usr/bin/env python3
"""
Script completo de pruebas para Learnify API
Ejecutar: python test_learnify.py
"""

import requests
import json
import asyncio
import websockets
from datetime import datetime

BASE_URL = "http://localhost:8000"

# Colores para output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_success(msg):
    print(f"{Colors.GREEN}✅ {msg}{Colors.END}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.END}")

def print_error(msg):
    print(f"{Colors.RED}❌ {msg}{Colors.END}")

def print_section(msg):
    print(f"\n{Colors.BOLD}{Colors.YELLOW}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.YELLOW}{msg}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.YELLOW}{'='*60}{Colors.END}\n")

# ============================================
# 1. AUTENTICACIÓN
# ============================================

def register_user(email, password):
    """Registrar nuevo usuario"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={"email": email, "password": password}
        )
        response.raise_for_status()
        token = response.json()["access_token"]
        print_success(f"Usuario registrado: {email}")
        return token
    except Exception as e:
        print_error(f"Error al registrar: {e}")
        return None

def login_user(email, password):
    """Login usuario existente"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": email, "password": password}
        )
        response.raise_for_status()
        token = response.json()["access_token"]
        print_success(f"Login exitoso: {email}")
        return token
    except Exception as e:
        print_error(f"Error en login: {e}")
        return None

def get_current_user(token):
    """Obtener usuario actual"""
    try:
        response = requests.get(
            f"{BASE_URL}/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print_error(f"Error al obtener usuario: {e}")
        return None

# ============================================
# 2. PERFIL
# ============================================

def update_profile(token, profile_data):
    """Actualizar perfil"""
    try:
        response = requests.put(
            f"{BASE_URL}/profile/update",
            headers={"Authorization": f"Bearer {token}"},
            json=profile_data
        )
        response.raise_for_status()
        print_success("Perfil actualizado")
        return response.json()
    except Exception as e:
        print_error(f"Error al actualizar perfil: {e}")
        return None

# ============================================
# 3. PUBLICACIONES
# ============================================

def create_post(token, title, description, subject):
    """Crear publicación"""
    try:
        response = requests.post(
            f"{BASE_URL}/posts/create",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": title, "description": description, "subject": subject}
        )
        response.raise_for_status()
        post = response.json()
        print_success(f"Post creado: {post['id']}")
        return post
    except Exception as e:
        print_error(f"Error al crear post: {e}")
        return None

def get_latest_posts(limit=10):
    """Obtener últimas publicaciones"""
    try:
        response = requests.get(f"{BASE_URL}/posts/latest?limit={limit}")
        response.raise_for_status()
        posts = response.json()
        print_success(f"Obtenidas {len(posts)} publicaciones")
        return posts
    except Exception as e:
        print_error(f"Error al obtener posts: {e}")
        return []

def add_response(token, post_id, content):
    """Agregar respuesta a publicación"""
    try:
        response = requests.post(
            f"{BASE_URL}/posts/{post_id}/response",
            headers={"Authorization": f"Bearer {token}"},
            json={"content": content}
        )
        response.raise_for_status()
        print_success(f"Respuesta agregada al post {post_id}")
        return response.json()
    except Exception as e:
        print_error(f"Error al agregar respuesta: {e}")
        return None

# ============================================
# 4. APUNTES
# ============================================

def create_note(token, note_data):
    """Crear apunte"""
    try:
        response = requests.post(
            f"{BASE_URL}/notes/create",
            headers={"Authorization": f"Bearer {token}"},
            json=note_data
        )
        response.raise_for_status()
        note = response.json()
        print_success(f"Nota creada: {note['id']}")
        return note
    except Exception as e:
        print_error(f"Error al crear nota: {e}")
        return None

def search_notes(filters=None):
    """Buscar apuntes con filtros"""
    try:
        params = filters or {}
        response = requests.get(f"{BASE_URL}/notes/", params=params)
        response.raise_for_status()
        notes = response.json()
        print_success(f"Encontrados {len(notes)} apuntes")
        return notes
    except Exception as e:
        print_error(f"Error al buscar notas: {e}")
        return []

# ============================================
# 5. GRUPOS DE ESTUDIO
# ============================================

def create_study_group(token, name, description, is_public=True, exam_date=None):
    """Crear grupo de estudio"""
    try:
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
        print_success(f"Grupo creado: {group['id']}")
        return group
    except Exception as e:
        print_error(f"Error al crear grupo: {e}")
        return None

def join_group(token, group_id):
    """Unirse a grupo"""
    try:
        response = requests.post(
            f"{BASE_URL}/study-groups/{group_id}/join",
            headers={"Authorization": f"Bearer {token}"}
        )
        response.raise_for_status()
        print_success(f"Unido al grupo {group_id}")
        return response.json()
    except Exception as e:
        print_error(f"Error al unirse al grupo: {e}")
        return None

def share_file(token, group_id, file_url):
    """Compartir archivo en grupo"""
    try:
        response = requests.post(
            f"{BASE_URL}/study-groups/{group_id}/share-file",
            headers={"Authorization": f"Bearer {token}"},
            json={"file_url": file_url}
        )
        response.raise_for_status()
        print_success(f"Archivo compartido en grupo {group_id}")
        return response.json()
    except Exception as e:
        print_error(f"Error al compartir archivo: {e}")
        return None

# ============================================
# 6. CHAT WEBSOCKET
# ============================================

async def chat_test(group_id, user_id, messages):
    """Probar chat en tiempo real"""
    uri = f"ws://localhost:8000/study-groups/ws/{group_id}"
    try:
        async with websockets.connect(uri) as websocket:
            print_success(f"Conectado al chat del grupo {group_id}")
            
            # Enviar mensajes
            for msg in messages:
                message = {
                    "sender_id": user_id,
                    "content": msg
                }
                await websocket.send(json.dumps(message))
                print_info(f"📤 Enviado: {msg}")
                await asyncio.sleep(1)
            
            # Recibir mensajes por 5 segundos
            try:
                async with asyncio.timeout(5):
                    async for message in websocket:
                        data = json.loads(message)
                        sender = data.get('sender_name', 'Unknown')
                        content = data.get('content', '')
                        print_info(f"📥 {sender}: {content}")
                        await asyncio.sleep(0.1)
            except asyncio.TimeoutError:
                pass
    except Exception as e:
        print_error(f"Error en WebSocket: {e}")

# ============================================
# FLUJO COMPLETO DE PRUEBA
# ============================================

def run_full_test():
    """Ejecutar pruebas completas"""
    print_section("🧪 INICIANDO PRUEBAS COMPLETAS")
    
    results = {}
    
    # 1. Registrar usuarios
    print_section("1️⃣  AUTENTICACIÓN")
    token1 = register_user("test1@example.com", "password123")
    token2 = register_user("test2@example.com", "password123")
    
    if not token1 or not token2:
        print_error("No se pudieron registrar usuarios. Verifica que el backend esté corriendo.")
        return None
    
    user1 = get_current_user(token1)
    user2 = get_current_user(token2)
    
    if not user1 or not user2:
        print_error("No se pudieron obtener usuarios.")
        return None
    
    user1_id = user1.get("id") or user1.get("_id")
    user2_id = user2.get("id") or user2.get("_id")
    
    results["user1_token"] = token1
    results["user2_token"] = token2
    results["user1_id"] = user1_id
    results["user2_id"] = user2_id
    
    # 2. Actualizar perfiles
    print_section("2️⃣  PERFILES")
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
    print_section("3️⃣  PUBLICACIONES")
    post1 = create_post(
        token1,
        "¿Cómo empezar con Python?",
        "Soy nuevo en programación y quiero aprender Python",
        "Programming"
    )
    
    if post1:
        results["post_id"] = post1.get("id") or post1.get("_id")
        # Agregar respuesta
        add_response(token2, results["post_id"], "Te recomiendo empezar con los tutoriales de Python.org")
    
    # Obtener últimas publicaciones
    get_latest_posts(5)
    
    # 4. Crear apuntes
    print_section("4️⃣  APUNTES")
    note1 = create_note(token1, {
        "title": "Python Basics",
        "description": "Fundamentos de Python",
        "subject": "Programming",
        "university": "MIT",
        "career": "Computer Science",
        "tags": ["python", "beginner"],
        "file_url": "https://example.com/python.pdf"
    })
    
    if note1:
        results["note_id"] = note1.get("id") or note1.get("_id")
    
    # Buscar apuntes
    search_notes({"university": "MIT", "subject": "Programming"})
    
    # 5. Crear grupo de estudio
    print_section("5️⃣  GRUPOS DE ESTUDIO")
    group = create_study_group(
        token1,
        "Python Avanzado 2024",
        "Grupo para estudiar Python avanzado",
        is_public=True,
        exam_date="2024-12-15T10:00:00"
    )
    
    if group:
        results["group_id"] = group.get("id") or group.get("_id")
        # Unirse al grupo
        join_group(token2, results["group_id"])
        
        # Compartir archivo
        share_file(token1, results["group_id"], "https://example.com/study-material.pdf")
    
    # 6. Chat en tiempo real
    print_section("6️⃣  CHAT WEBSOCKET")
    if results.get("group_id") and results.get("user1_id"):
        print_info("Ejecuta esto para probar chat:")
        print(f"   python -c \"import asyncio; from test_learnify import chat_test; asyncio.run(chat_test('{results['group_id']}', '{results['user1_id']}', ['Hola!', '¿Cómo están?']))\"")
    
    print_section("✅ PRUEBAS COMPLETADAS")
    
    print(f"\n{Colors.BOLD}📋 IDs GENERADOS:{Colors.END}")
    print(json.dumps(results, indent=2))
    
    return results

if __name__ == "__main__":
    try:
        results = run_full_test()
        if results:
            print(f"\n{Colors.GREEN}{Colors.BOLD}✅ Todas las pruebas completadas exitosamente!{Colors.END}")
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}⚠️  Pruebas interrumpidas por el usuario{Colors.END}")
    except Exception as e:
        print_error(f"Error inesperado: {e}")
        import traceback
        traceback.print_exc()














