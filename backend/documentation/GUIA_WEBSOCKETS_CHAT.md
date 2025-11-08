# 💬 Guía Completa: WebSockets y Chat en Tiempo Real

Esta guía explica **paso a paso** cómo funciona el sistema de chat en tiempo real usando WebSockets en Learnify.

---

## 📚 ¿Qué es WebSocket?

**WebSocket** es un protocolo de comunicación que permite una conexión **bidireccional y persistente** entre el cliente (navegador) y el servidor.

### Diferencias con HTTP REST:

| Característica | HTTP REST | WebSocket |
|---------------|----------|-----------|
| **Conexión** | Una petición → Una respuesta | Conexión persistente |
| **Dirección** | Solo cliente → servidor | Bidireccional (cliente ↔ servidor) |
| **Tiempo Real** | No (polling necesario) | Sí (instantáneo) |
| **Uso** | Obtener datos, crear recursos | Chat, notificaciones en vivo |

### ¿Por qué WebSocket para Chat?

- ✅ **Tiempo Real**: Los mensajes aparecen instantáneamente
- ✅ **Eficiente**: No necesitas hacer polling cada segundo
- ✅ **Bidireccional**: El servidor puede enviar sin que el cliente pida
- ✅ **Persistente**: La conexión se mantiene abierta

---

## 🏗️ Arquitectura del Sistema de Chat

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Next.js)                  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ WebSocket Client                                       │ │
│  │ const ws = new WebSocket(ws://localhost:8000/...)    │ │
│  │                                                        │ │
│  │ ws.onopen → Conectado                                 │ │
│  │ ws.onmessage → Recibe mensajes                        │ │
│  │ ws.send() → Envía mensajes                            │ │
│  │ ws.onclose → Desconectado                             │ │
│  └───────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ WebSocket (ws://)
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ controllers/study_group.py                            │ │
│  │ @router.websocket("/ws/{group_id}")                   │ │
│  │ websocket_endpoint()                                  │ │
│  └──────────────────┬───────────────────────────────────┘ │
│                     │                                       │
│                     ▼                                       │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ config/websocket_manager.py                           │ │
│  │ ConnectionManager                                      │ │
│  │  - connect() → Acepta conexión                        │ │
│  │  - broadcast() → Envía a todos                       │ │
│  │  - disconnect() → Limpia conexión                    │ │
│  └──────────────────┬───────────────────────────────────┘ │
│                     │                                       │
│                     ▼                                       │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ services/study_group_service.py                        │ │
│  │ add_chat_message()                                     │ │
│  │  - Persiste mensaje en MongoDB                        │ │
│  │  - Obtiene nombre del usuario                         │ │
│  └──────────────────┬───────────────────────────────────┘ │
└──────────────────────┼──────────────────────────────────────┘
                       │
                       │ MongoDB Queries
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    MONGODB                                    │
│                                                             │
│  study_groups collection:                                   │
│  {                                                           │
│    _id: ObjectId("..."),                                    │
│    name: "Grupo de Programación",                          │
│    chat: [                                                  │
│      {                                                       │
│        sender: "Juan Pérez",                                │
│        sender_id: ObjectId("..."),                         │
│        content: "Hola a todos!",                           │
│        timestamp: ISODate("2024-10-27T21:30:00Z")          │
│      },                                                     │
│      ...                                                     │
│    ]                                                        │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo Completo de Chat

### Flujo 1: Usuario Conecta al Chat

```
┌──────────┐
│ Usuario  │
│ (Juan)   │
└────┬─────┘
     │
     │ 1. Abre página del grupo
     │    Click en "Ver detalles del grupo"
     ▼
┌─────────────────────────────────────┐
│         Frontend (React)             │
│                                     │
│  const ws = new WebSocket(          │
│    'ws://localhost:8000/            │
│     study-groups/ws/{group_id}'     │
│  )                                  │
│                                     │
│  ws.onopen = () => {                │
│    console.log('Conectado')         │
│  }                                  │
└──────┬───────────────────────────────┘
       │
       │ 2. WebSocket Handshake
       │    Upgrade HTTP → WebSocket
       ▼
┌─────────────────────────────────────┐
│         Backend (FastAPI)            │
│                                     │
│  @router.websocket("/ws/{group_id}")│
│  async def websocket_endpoint(      │
│    websocket: WebSocket,            │
│    group_id: str                    │
│  ):                                 │
│    await manager.connect(           │
│      group_id,                      │
│      websocket                      │
│    )                                │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   ConnectionManager                 │
│                                     │
│   active_connections = {            │
│     "group_id_1": [                 │
│       websocket_juan,                │
│       websocket_maria,              │
│       websocket_carlos              │
│     ]                               │
│   }                                 │
└─────────────────────────────────────┘
```

**Código relevante:**

```python
# config/websocket_manager.py
class ConnectionManager:
    def __init__(self):
        # Diccionario: {group_id: [websocket1, websocket2, ...]}
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, group_id: str, websocket: WebSocket):
        # Acepta la conexión WebSocket
        await websocket.accept()
        
        # Si es el primer usuario del grupo, crea la lista
        if group_id not in self.active_connections:
            self.active_connections[group_id] = []
        
        # Agrega esta conexión a la lista del grupo
        self.active_connections[group_id].append(websocket)
```

---

### Flujo 2: Usuario Envía Mensaje

```
┌──────────┐
│ Usuario  │
│ (Juan)   │
└────┬─────┘
     │
     │ 1. Escribe mensaje y presiona Enter
     │    "Hola a todos!"
     ▼
┌─────────────────────────────────────┐
│         Frontend (React)             │
│                                     │
│  ws.send(JSON.stringify({           │
│    sender_id: "juan_id",            │
│    content: "Hola a todos!"        │
│  }))                                │
└──────┬──────────────────────────────┘
       │
       │ 2. WebSocket Message
       ▼
┌─────────────────────────────────────┐
│         Backend (FastAPI)            │
│                                     │
│  while True:                        │
│    data = await websocket.receive_json()
│    # data = {                       │
│    #   "sender_id": "juan_id",      │
│    #   "content": "Hola a todos!"   │
│    # }                              │
│                                     │
│    sender_id = data.get("sender_id")
│    content = data.get("content")
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   services/study_group_service.py    │
│                                     │
│   add_chat_message()                 │
│   1. Busca usuario para obtener nombre│
│   2. Crea ChatMessage                │
│   3. Persiste en MongoDB             │
└──────┬──────────────────────────────┘
       │
       │ 3. MongoDB Update
       ▼
┌─────────────────────────────────────┐
│         MongoDB                      │
│                                     │
│  db.study_groups.updateOne(         │
│    {                                │
│      _id: ObjectId(group_id),      │
│      members: ObjectId(juan_id)     │
│    },                               │
│    {                                │
│      $push: {                       │
│        chat: {                      │
│          sender: "Juan Pérez",      │
│          sender_id: "juan_id",     │
│          content: "Hola a todos!",  │
│          timestamp: ISODate(...)    │
│        }                            │
│      }                              │
│    }                                │
│  )                                  │
└──────┬──────────────────────────────┘
       │
       │ 4. Retorna grupo actualizado
       ▼
┌─────────────────────────────────────┐
│         Backend (FastAPI)            │
│                                     │
│  message_data = {                   │
│    "type": "message",               │
│    "sender_id": "juan_id",          │
│    "sender": "Juan Pérez",          │
│    "content": "Hola a todos!",      │
│    "timestamp": "2024-10-27..."    │
│  }                                  │
│                                     │
│  await manager.broadcast(           │
│    group_id,                        │
│    message_data                     │
│  )                                  │
└──────┬──────────────────────────────┘
       │
       │ 5. Broadcast a todos
       ▼
┌─────────────────────────────────────┐
│   ConnectionManager                  │
│                                     │
│   for connection in                 │
│     active_connections[group_id]:   │
│     await connection.send_json(     │
│       message_data                  │
│     )                               │
│                                     │
│   Envía a:                          │
│   - websocket_juan (quien envió)    │
│   - websocket_maria                 │
│   - websocket_carlos                │
└──────┬──────────────────────────────┘
       │
       │ 6. Todos reciben mensaje
       ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Usuario  │  │ Usuario  │  │ Usuario  │
│ (Juan)   │  │ (María)  │  │ (Carlos) │
│          │  │          │  │          │
│ Recibe:  │  │ Recibe:  │  │ Recibe:  │
│ "Hola..."│  │ "Hola..."│  │ "Hola..."│
└──────────┘  └──────────┘  └──────────┘
```

**Código relevante:**

```python
# controllers/study_group.py
@router.websocket("/ws/{group_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    group_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    # 1. Conecta el WebSocket
    await manager.connect(group_id, websocket)
    
    try:
        # 2. Bucle infinito para recibir mensajes
        while True:
            # 3. Espera recibir un mensaje JSON
            data = await websocket.receive_json()
            sender_id = data.get("sender_id")
            content = data.get("content")
            
            # 4. Si tiene sender_id y content, procesa el mensaje
            if sender_id and content:
                # 5. Persiste en MongoDB
                group = await add_chat_message(db, group_id, content, sender_id)
                
                if group:
                    # 6. Prepara datos del mensaje
                    message_data = {
                        "type": "message",
                        "sender_id": sender_id,
                        "sender": group.chat[-1].sender,  # Nombre del usuario
                        "sender_name": group.chat[-1].sender,
                        "content": content,
                        "timestamp": str(group.chat[-1].timestamp),
                    }
                    
                    # 7. Envía a todos los conectados del grupo
                    await manager.broadcast(group_id, message_data)
                    
    except WebSocketDisconnect:
        # Usuario se desconectó normalmente
        manager.disconnect(group_id, websocket)
    except Exception as e:
        # Error, desconectar
        manager.disconnect(group_id, websocket)
```

---

## 🔧 Componentes Clave

### 1. ConnectionManager - Gestor de Conexiones

```python
# config/websocket_manager.py
from fastapi import WebSocket
from typing import List, Dict

class ConnectionManager:
    def __init__(self):
        # Estructura: {group_id: [websocket1, websocket2, ...]}
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, group_id: str, websocket: WebSocket):
        """Acepta una nueva conexión WebSocket"""
        await websocket.accept()
        
        if group_id not in self.active_connections:
            self.active_connections[group_id] = []
        
        self.active_connections[group_id].append(websocket)

    def disconnect(self, group_id: str, websocket: WebSocket):
        """Desconecta una conexión WebSocket"""
        if group_id in self.active_connections:
            self.active_connections[group_id].remove(websocket)
            
            # Si no quedan conexiones, elimina el grupo
            if len(self.active_connections[group_id]) == 0:
                del self.active_connections[group_id]

    async def broadcast(self, group_id: str, message: dict):
        """Envía un mensaje a todos los conectados del grupo"""
        if group_id in self.active_connections:
            for connection in self.active_connections[group_id]:
                try:
                    await connection.send_json(message)
                except:
                    # Si falla enviar a una conexión, la ignoramos
                    pass

    async def send_personal_message(self, websocket: WebSocket, message: dict):
        """Envía un mensaje a una conexión específica"""
        try:
            await websocket.send_json(message)
        except:
            pass

# Instancia global del manager
manager = ConnectionManager()
```

**¿Cómo funciona?**
- **`active_connections`**: Diccionario que guarda todas las conexiones activas por grupo
- **`connect()`**: Agrega una nueva conexión al grupo
- **`disconnect()`**: Elimina una conexión cuando el usuario se va
- **`broadcast()`**: Envía un mensaje a todos los conectados del mismo grupo

---

### 2. add_chat_message() - Persistir Mensaje

```python
# services/study_group_service.py
async def add_chat_message(
    db: AsyncIOMotorDatabase,
    group_id: str,
    content: str,
    sender_id: str
) -> Optional[StudyGroupInDB]:
    groups_collection = db["study_groups"]
    users_collection = db["users"]
    
    try:
        # 1. Busca el usuario para obtener su nombre
        user = await users_collection.find_one(
            {"_id": ObjectId(sender_id)},
            {"full_name": 1, "last_name": 1}
        )
        
        # 2. Construye el nombre completo
        full_name = user.get("full_name") if user else None
        last_name = user.get("last_name") if user else None
        
        if isinstance(full_name, str):
            name_parts = [full_name.strip()]
            if isinstance(last_name, str) and last_name.strip():
                name_parts.append(last_name.strip())
            sender_display = " ".join(name_parts).strip()
        else:
            sender_display = None
        
        sender_display = sender_display or sender_id  # Fallback al ID
        
        # 3. Crea el objeto ChatMessage
        message_data = ChatMessage(
            sender=sender_display,    # Nombre legible: "Juan Pérez"
            sender_id=sender_id,      # ID del usuario
            content=content           # Contenido del mensaje
        )
        
        # 4. Actualiza MongoDB
        # IMPORTANTE: Solo miembros pueden enviar mensajes
        result = await groups_collection.find_one_and_update(
            {
                "_id": ObjectId(group_id),
                "members": ObjectId(sender_id)  # Verifica membresía
            },
            {"$push": {"chat": message_data.dict()}},
            return_document=True
        )
        
        # 5. Enriquece con nombres y retorna
        if result:
            enriched = await _enrich_group_with_member_names(db, group_id)
            return StudyGroupInDB(**enriched) if enriched else None
            
    except Exception as e:
        print(f"Error in add_chat_message: {e}")
        return None
```

**¿Qué hace?**
1. Busca el usuario para obtener su nombre completo
2. Crea el objeto `ChatMessage` con el nombre legible
3. Persiste el mensaje en MongoDB (solo si el usuario es miembro)
4. Enriquece el grupo con nombres y retorna el grupo actualizado

---

### 3. Modelo ChatMessage

```python
# models/study_group.py
class ChatMessage(BaseModel):
    sender: str          # Nombre del usuario: "Juan Pérez"
    sender_id: Optional[str] = None  # ID del usuario (ObjectId)
    content: str         # Contenido del mensaje
    timestamp: datetime = Field(default_factory=datetime.utcnow)  # Fecha/hora
```

**Estructura en MongoDB:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "name": "Grupo de Programación",
  "chat": [
    {
      "sender": "Juan Pérez",
      "sender_id": "507f1f77bcf86cd799439012",
      "content": "Hola a todos!",
      "timestamp": ISODate("2024-10-27T21:30:00Z")
    },
    {
      "sender": "María García",
      "sender_id": "507f1f77bcf86cd799439013",
      "content": "¡Hola Juan!",
      "timestamp": ISODate("2024-10-27T21:31:00Z")
    }
  ]
}
```

---

## 💻 Implementación en Frontend

### React/Next.js Example

```typescript
// components/group-chat-with-input.tsx
import { useState, useEffect, useRef } from 'react'

export function GroupChatWithInput({ groupId, userId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  
  useEffect(() => {
    // 1. Conectar WebSocket
    const wsUrl = `ws://localhost:8000/study-groups/ws/${groupId}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws
    
    // 2. Cuando se conecta
    ws.onopen = () => {
      console.log('WebSocket connected')
    }
    
    // 3. Cuando recibe un mensaje
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      
      // Agrega el mensaje al estado
      setMessages(prev => [...prev, {
        sender: message.sender,
        sender_id: message.sender_id,
        content: message.content,
        timestamp: new Date(message.timestamp)
      }])
    }
    
    // 4. Cuando hay error
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
    
    // 5. Cuando se desconecta
    ws.onclose = () => {
      console.log('WebSocket disconnected')
    }
    
    // Cleanup al desmontar componente
    return () => {
      ws.close()
    }
  }, [groupId])
  
  // 6. Función para enviar mensaje
  const sendMessage = (content: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        sender_id: userId,
        content: content
      }))
    }
  }
  
  return (
    <div>
      {/* Lista de mensajes */}
      <div>
        {messages.map((msg, i) => (
          <div key={i}>
            <strong>{msg.sender}:</strong> {msg.content}
          </div>
        ))}
      </div>
      
      {/* Input para enviar */}
      <input
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            sendMessage(e.target.value)
            e.target.value = ''
          }
        }}
      />
    </div>
  )
}
```

---

## 📊 Flujo de Datos Completo

```
Usuario Juan                  Backend                    MongoDB
     │                           │                           │
     │ 1. Conectar WebSocket     │                           │
     ├──────────────────────────▶│                           │
     │                           │                           │
     │                           │ 2. manager.connect()     │
     │                           │    Guarda conexión       │
     │                           │                           │
     │ 3. Enviar mensaje         │                           │
     │    {sender_id, content}  │                           │
     ├──────────────────────────▶│                           │
     │                           │                           │
     │                           │ 4. add_chat_message()     │
     │                           │    - Busca usuario        │
     │                           │    - Crea ChatMessage     │
     │                           │                           │
     │                           │ 5. MongoDB $push          │
     │                           ├──────────────────────────▶│
     │                           │                           │ 6. Update documento
     │                           │                           │    $push: {chat: {...}}
     │                           │                           │
     │                           │ 7. Retorna grupo          │
     │                           │◀──────────────────────────┤
     │                           │                           │
     │                           │ 8. manager.broadcast()   │
     │                           │    Envía a todos          │
     │                           │                           │
     │ 9. Recibe mensaje         │                           │
     │◀──────────────────────────┤                           │
     │                           │                           │
     │ Usuario María             │                           │
     │                           │                           │
     │ 10. Recibe mensaje        │                           │
     │◀──────────────────────────┤                           │
     │                           │                           │
     │ Usuario Carlos            │                           │
     │                           │                           │
     │ 11. Recibe mensaje        │                           │
     │◀──────────────────────────┤                           │
```

---

## 🔍 Ver Historial de Mensajes

### Endpoint REST: GET /study-groups/{group_id}/messages

```python
# controllers/study_group.py
@router.get("/{group_id}/messages")
async def get_messages(
    group_id: str,
    limit: int = 50,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    messages = await get_study_group_messages(db, group_id, limit)
    return {"messages": messages}
```

**Ejemplo de uso:**
```bash
GET http://localhost:8000/study-groups/507f1f77bcf86cd799439011/messages?limit=50
```

**Response:**
```json
{
  "messages": [
    {
      "sender": "Juan Pérez",
      "sender_id": "507f1f77bcf86cd799439012",
      "content": "Hola a todos!",
      "timestamp": "2024-10-27T21:30:00"
    },
    {
      "sender": "María García",
      "sender_id": "507f1f77bcf86cd799439013",
      "content": "¡Hola Juan!",
      "timestamp": "2024-10-27T21:31:00"
    }
  ]
}
```

**¿Cuándo usar?**
- Al cargar la página del grupo (mostrar historial)
- Cuando el usuario se conecta (cargar mensajes anteriores)
- Para recuperar mensajes antiguos (paginación)

---

## 🛡️ Seguridad y Validaciones

### 1. Solo Miembros Pueden Enviar Mensajes

```python
# En add_chat_message()
result = await groups_collection.find_one_and_update(
    {
        "_id": ObjectId(group_id),
        "members": ObjectId(sender_id)  # ← Solo si es miembro
    },
    {"$push": {"chat": message_data.dict()}},
    return_document=True
)
```

**Si el usuario NO es miembro:**
- `find_one_and_update()` retorna `None`
- El mensaje NO se persiste
- NO se hace broadcast

---

### 2. Validación de Contenido

```python
# models/study_group.py
class ChatMessage(BaseModel):
    content: str = Field(..., min_length=1)  # Mínimo 1 carácter
```

**Mensajes vacíos son rechazados automáticamente por Pydantic**

---

## ⚠️ Manejo de Errores

### 1. Desconexión Normal

```python
except WebSocketDisconnect:
    manager.disconnect(group_id, websocket)
```

**Cuando el usuario:**
- Cierra la pestaña
- Navega a otra página
- Cierra el navegador

**Qué pasa:**
- Se ejecuta `disconnect()`
- Se elimina la conexión del `active_connections`
- No afecta a otros usuarios

---

### 2. Error en Conexión

```python
except Exception as e:
    manager.disconnect(group_id, websocket)
```

**Cuando hay:**
- Error al enviar mensaje
- Error al persistir en MongoDB
- Error de red

**Qué pasa:**
- Se desconecta la conexión problemática
- Se loguea el error
- Otros usuarios no se afectan

---

### 3. Conexión Fallida al Enviar

```python
async def broadcast(self, group_id: str, message: dict):
    for connection in self.active_connections[group_id]:
        try:
            await connection.send_json(message)
        except:
            pass  # Ignora conexiones muertas
```

**Si una conexión falla:**
- Se ignora silenciosamente
- No afecta a otras conexiones
- La conexión muerta se limpia automáticamente

---

## 📝 Ejemplo Completo: Flujo de Chat

### Paso 1: Usuario Conecta

```javascript
// Frontend
const ws = new WebSocket('ws://localhost:8000/study-groups/ws/507f1f77bcf86cd799439011')

ws.onopen = () => {
  console.log('Conectado al chat')
}
```

**Backend:**
```python
# manager.active_connections queda así:
{
  "507f1f77bcf86cd799439011": [websocket_juan]
}
```

---

### Paso 2: Otro Usuario Conecta

```javascript
// Frontend (María)
const ws = new WebSocket('ws://localhost:8000/study-groups/ws/507f1f77bcf86cd799439011')
```

**Backend:**
```python
# manager.active_connections queda así:
{
  "507f1f77bcf86cd799439011": [websocket_juan, websocket_maria]
}
```

---

### Paso 3: Juan Envía Mensaje

```javascript
// Frontend (Juan)
ws.send(JSON.stringify({
  sender_id: "juan_id",
  content: "Hola a todos!"
}))
```

**Backend procesa:**
1. Recibe mensaje
2. Persiste en MongoDB
3. Broadcast a todos:
   - Envía a `websocket_juan` (quien lo envió)
   - Envía a `websocket_maria`

**Frontend recibe:**
```javascript
// Tanto Juan como María reciben:
ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  // message = {
  //   type: "message",
  //   sender_id: "juan_id",
  //   sender: "Juan Pérez",
  //   content: "Hola a todos!",
  //   timestamp: "2024-10-27T21:30:00"
  // }
}
```

---

## 🔗 Archivos Relacionados

- `config/websocket_manager.py` - Gestión de conexiones WebSocket
- `controllers/study_group.py` - Endpoint WebSocket
- `services/study_group_service.py` - Lógica de chat
- `models/study_group.py` - Modelo ChatMessage

---

## 📚 Resumen

### ¿Qué es WebSocket?
- Protocolo de comunicación bidireccional y persistente
- Perfecto para chat en tiempo real

### ¿Cómo funciona?
1. **Conexión**: Cliente conecta → Backend acepta → Guarda en `active_connections`
2. **Envío**: Cliente envía mensaje → Backend persiste en MongoDB → Broadcast a todos
3. **Recepción**: Todos los conectados reciben el mensaje instantáneamente
4. **Desconexión**: Se limpia la conexión automáticamente

### Características:
- ✅ **Tiempo Real**: Mensajes instantáneos
- ✅ **Persistencia**: Todos los mensajes se guardan en MongoDB
- ✅ **Seguridad**: Solo miembros pueden enviar mensajes
- ✅ **Escalable**: Múltiples usuarios pueden chatear simultáneamente
- ✅ **Resiliente**: Maneja errores y desconexiones automáticamente

---

¿Tienes preguntas? Prueba el chat en `http://localhost:8000/docs` o revisa el código fuente 🚀


