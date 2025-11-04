# Learnify

Plataforma colaborativa para estudiantes

---

## 📄 Descripción del Proyecto

Learnify es un sistema de información orientado a estudiantes universitarios. Su objetivo es facilitar el acceso a material de estudio a través de una plataforma web donde los usuarios pueden compartir, buscar y descargar apuntes. Además, promueve el aprendizaje colaborativo mediante grupos de estudio y foros de consulta académica.

---

## 🔎 Objetivo

Crear un espacio centralizado, simple y ordenado donde los estudiantes puedan:

* Subir y clasificar apuntes
* Buscar y filtrar material por materia, carrera o universidad
* Interactuar con otros usuarios en grupos y foros

---

## 📅 Alcance Inicial

El MVP contempla las siguientes funcionalidades:

* Inicio y registro de usuarios (Con base de datos funcional).
* Alta y baja de Grupos de estudio, foros y notas(apuntes).
* Busqueda con filtros.
* Chat en tiempo real implementado con WebSockets.
* Comentarios en publicaciones.
* Carga de archivos.
---

## 🔢 Requisitos Funcionales

1. Registro de nuevos usuarios
2. Inicio de sesión con email y contraseña
3. Subida y almacenamiento de apuntes
4. Búsqueda con filtros por materia/carrera
5. Descarga de archivos
6. Comentarios
7. Participación en grupos de estudio
8. Participación en foros
9. Registro de actividad reciente
10. Cierre de sesión seguro

---

## 🛠️ Requisitos No Funcionales

* Interfaz simple y moderna (solo para PC)
* Navegación fluida y sin recargas innecesarias
* Validación de datos y formularios
* Seguridad en el manejo de datos del usuario
* Escalabilidad para futuras funcionalidades


---

## 🔍 Casos de Uso Clave

* Subir Apunte
* Buscar Apunte con filtros
* Descargar Apunte
* Compartir Apunte
* Participar en Grupo de Estudio
* Participar en Publicaciones

---

## 📊 Tecnologías

* **Frontend**: React + Tailwind CSS, TypeScript
* **Backend**: FastAPI (Python) , Pydantic
* **Base de Datos**: MongoDB (modelo NoSQL con Pydantic)
* **Autenticación**: JWT (JSON Web Tokens)
* **Versionado**: Git + GitHub
* **Infraestructura**: Docker
---
### Autenticación

- **JWT (JSON Web Tokens)** para autenticación stateless

- Tokens con expiración automática

- Contraseñas hasheadas con **Bcrypt**

- No se almacenan contraseñas en texto plano
---
## 👥 Roles del Sistema (Planificados)

 
### Estudiante (Actual)

- Subir, buscar, descargar apuntes

- Participar en foros y grupos de estudio

- Gestionar perfil

 

### Moderador (Futuro)

- Eliminar contenido inapropiado

- Suspender usuarios

- Moderar foros

 

### Administrador (Futuro)

- Gestionar usuarios y roles

- Ver estadísticas

- Mantenimiento del sistema

 
---
## 🔌 API Endpoints


### Autenticación (`/auth`)

- `POST /auth/register` - Registrar nuevo usuario

- `POST /auth/login` - Iniciar sesión (devuelve JWT)

- `GET /auth/me` - Obtener usuario actual (requiere JWT)

 

### Perfiles (`/profile`)

- `GET /profile/me` - Obtener perfil del usuario

### Notas (`/notes`)

- `POST /notes/create` - Crear nota (requiere JWT)

- `GET /notes/` - Buscar notas (filtros opcionales: university, career, subject, tags)

- `GET /notes/latest/notes` - Últimas 3 notas

- `GET /notes/{note_id}` - Detalle de nota

- `GET /notes/my/notes` - Mis notas (requiere JWT)

- `DELETE /notes/{note_id}` - Eliminar nota (requiere JWT)

 
### Posts (`/posts`)

- `POST /posts/create` - Crear post (requiere JWT)

- `GET /posts/latest` - Posts recientes

- `GET /posts/{post_id}` - Detalle de post

- `POST /posts/{post_id}/response` - Agregar respuesta (requiere JWT)

- `GET /posts/my/posts` - Mis posts (requiere JWT)

- `DELETE /posts/{post_id}` - Eliminar post (requiere JWT)

 

### Grupos de Estudio (`/study-groups`)

- `POST /study-groups/create` - Crear grupo (requiere JWT)

- `GET /study-groups/public` - Grupos públicos

- `GET /study-groups/{group_id}` - Detalle de grupo

- `GET /study-groups/my/groups` - Mis grupos (requiere JWT)

- `POST /study-groups/{group_id}/join` - Unirse a grupo (requiere JWT)

- `POST /study-groups/{group_id}/accept-request/{user_id}` - Aceptar solicitud (requiere JWT)

- `POST /study-groups/{group_id}/leave` - Salir de grupo (requiere JWT)

- `POST /study-groups/{group_id}/share-file` - Compartir archivo (requiere JWT)

- `GET /study-groups/{group_id}/messages` - Obtener mensajes

- `WebSocket /study-groups/ws/{group_id}` - Chat en tiempo real
  
---
## 📏 Equipo de Desarrollo
---
* \[Budano, Bautista]
* \[Perrino, Fabrizio]
* \[Ravachino, Ramiro]
* \[Signorio, Alvaro]
* \[Viera, Gabriel]

