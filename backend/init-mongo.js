// Script de inicialización para MongoDB
db = db.getSiblingDB('learnify_db');

// Crear colecciones
db.createCollection('users');
db.createCollection('user_profiles');
db.createCollection('posts');
db.createCollection('post_reactions');

// Crear índices para optimizar búsquedas
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.posts.createIndex({ "author_id": 1 });
db.posts.createIndex({ "created_at": -1 });
db.posts.createIndex({ "title": "text", "content": "text" });
db.post_reactions.createIndex({ "post_id": 1, "user_id": 1 }, { unique: true });

print('Base de datos Learnify inicializada correctamente'); 