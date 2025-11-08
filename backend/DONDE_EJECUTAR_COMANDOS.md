# 💻 ¿Dónde Ejecutar los Comandos?

## 🖥️ En la Terminal de Windows

Los comandos de MongoDB se ejecutan en la **terminal de Windows** (PowerShell o CMD).

### Opción 1: PowerShell (Recomendado)

1. **Abre PowerShell:**
   - Presiona `Windows + X`
   - Selecciona "Windows PowerShell" o "Terminal"
   - O busca "PowerShell" en el menú de inicio

2. **Navega al directorio del proyecto** (opcional, pero útil):
   ```powershell
   cd C:\python\Learnify-nuevo\backend
   ```

3. **Ejecuta el comando de MongoDB:**
   ```bash
   docker exec -it learnify_mongodb mongosh -u admin -p password --authenticationDatabase admin
   ```

4. **Ahora estás dentro de MongoDB Shell** - verás algo como:
   ```
   Current Mongosh Log ID: ...
   Connecting to: mongodb://admin@localhost:27017/?directConnection=true&authSource=admin
   Using MongoDB: 7.0.x
   Using Mongosh: ...
   ```

5. **Ejecuta los comandos JavaScript:**
   ```javascript
   use learnify
   db.users.updateOne(
     {email: "fabrizio14@live.com.ar"},
     {$set: {role: "admin"}}
   )
   ```

6. **Para salir de MongoDB:**
   ```javascript
   exit
   ```

---

### Opción 2: CMD (Símbolo del sistema)

1. **Abre CMD:**
   - Presiona `Windows + R`
   - Escribe `cmd` y presiona Enter
   - O busca "Símbolo del sistema" en el menú de inicio

2. **Ejecuta los mismos comandos** que en PowerShell

---

## 📍 Resumen Visual

```
┌─────────────────────────────────────────┐
│ 1. Abre PowerShell/CMD en Windows       │
│    (Windows + X → PowerShell)          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 2. Ejecuta:                             │
│    docker exec -it learnify_mongodb    │
│    mongosh -u admin -p password        │
│    --authenticationDatabase admin       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 3. Ahora estás en MongoDB Shell         │
│    (verás el prompt de mongosh)         │
│    Ejecuta comandos JavaScript aquí     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 4. Ejecuta:                             │
│    use learnify                         │
│    db.users.updateOne(...)              │
│    exit                                 │
└─────────────────────────────────────────┘
```

---

## 🎯 Paso a Paso Completo

### Paso 1: Abre PowerShell

1. Presiona `Windows + X`
2. Click en "Windows PowerShell" o "Terminal"
3. Se abrirá una ventana negra/azul con texto

### Paso 2: Verifica que Docker está corriendo

```bash
docker ps
```

Deberías ver algo como:
```
CONTAINER ID   IMAGE          STATUS
abc123...      mongo:7.0      Up 5 minutes
def456...      learnify...    Up 5 minutes
```

Si ves los contenedores, está bien. Si no, primero levanta Docker:
```bash
cd C:\python\Learnify-nuevo\backend
docker-compose up -d
```

### Paso 3: Conéctate a MongoDB

```bash
docker exec -it learnify_mongodb mongosh -u admin -p password --authenticationDatabase admin
```

**Si funciona, verás:**
```
Current Mongosh Log ID: ...
Connecting to: mongodb://...
Using MongoDB: 7.0.x
```

**Si da error, verifica:**
- ¿MongoDB está corriendo? → `docker ps`
- ¿El nombre del contenedor es correcto? → `docker ps` para ver el nombre

### Paso 4: Ejecuta los comandos de MongoDB

Ahora estás dentro de MongoDB. Ejecuta:

```javascript
use learnify
```

```javascript
db.users.updateOne(
  {email: "fabrizio14@live.com.ar"},
  {$set: {role: "admin"}}
)
```

```javascript
db.users.findOne({email: "fabrizio14@live.com.ar"})
```

### Paso 5: Sal

```javascript
exit
```

---

## ⚠️ Errores Comunes

### Error: "docker: command not found"
**Solución:** Docker Desktop no está instalado o no está en el PATH. Instala Docker Desktop.

### Error: "Cannot connect to the Docker daemon"
**Solución:** Docker Desktop no está corriendo. Ábrelo desde el menú de inicio.

### Error: "No such container: learnify_mongodb"
**Solución:** El contenedor no está corriendo. Levanta Docker:
```bash
cd C:\python\Learnify-nuevo\backend
docker-compose up -d
```

### El comando se "cuelga" o no responde
**Solución:** Puede ser que MongoDB esté iniciando. Espera unos segundos o presiona Ctrl+C y vuelve a intentar.

---

## 💡 Tip: Usar la Terminal Integrada de VS Code

Si estás usando VS Code, puedes:

1. Abrir la terminal integrada: `Ctrl + Ñ` o `Terminal → New Terminal`
2. Ejecutar los comandos ahí
3. Es más cómodo porque ya está en el directorio del proyecto

---

## ✅ Checklist

- [ ] Abrí PowerShell o CMD
- [ ] Docker está corriendo (`docker ps` funciona)
- [ ] MongoDB está corriendo (verificado con `docker ps`)
- [ ] Me conecté a MongoDB (`docker exec -it...`)
- [ ] Ejecuté los comandos JavaScript
- [ ] Salí con `exit`
- [ ] Verifiqué en MongoDB Compass o en la API

---

## 🎯 Comando Rápido (Todo en Uno)

Si prefieres, puedes ejecutar todo en una sola línea:

```bash
docker exec -it learnify_mongodb mongosh -u admin -p password --authenticationDatabase admin --eval "use learnify; db.users.updateOne({email: 'fabrizio14@live.com.ar'}, {\$set: {role: 'admin'}}); db.users.findOne({email: 'fabrizio14@live.com.ar'}, {email: 1, role: 1})"
```

Pero es más fácil hacerlo paso a paso para entender qué está pasando.


