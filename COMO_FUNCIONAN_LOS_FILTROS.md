# 🔍 Cómo Funcionan los Filtros de Búsqueda en Learnify

Una explicación simple del funcionamiento de los filtros de búsqueda.

---

## 🎯 ¿Qué son los Filtros?

Los filtros te permiten buscar notas específicas escribiendo en los campos:
- **Universidad** (ej: UBA, UTN)
- **Carrera** (ej: Informática, Medicina)
- **Materia** (ej: Programación, Álgebra)
- **Tags** (ej: parciales, teórico)

---

## ⚡ ¿Cómo Funciona la Búsqueda en Tiempo Real?

### La Magia: **No Necesitas Hacer Clic en "Buscar"**

Cuando escribes en cualquier campo, la búsqueda se ejecuta automáticamente. No necesitas presionar ningún botón.

---

## 📖 El Flujo Completo (Simple)

### 1. **Escribes en el Campo**
   - Ejemplo: Escribes "Programación" en el campo "Materia"
   - La aplicación detecta que escribiste algo

### 2. **La Aplicación Prepara la Búsqueda**
   - Toma lo que escribiste ("Programación")
   - Lo combina con otros filtros si los hay
   - Prepara una petición para el servidor

### 3. **Se Envía la Petición al Servidor**
   - La aplicación le pregunta al servidor: 
     *"¿Tienes notas de Programación?"*
   - La pregunta se envía por internet (HTTP)

### 4. **El Servidor Busca en la Base de Datos**
   - El servidor recibe la pregunta
   - Va a MongoDB (la base de datos) y busca:
     *"Dame todas las notas donde la materia contenga 'Programación'"*
   - MongoDB busca en todos los documentos guardados

### 5. **MongoDB Encuentra las Notas**
   - Busca notas que tengan "Programación" en el campo materia
   - No importa si está escrito "Programación", "programación" o "PROGRAMACIÓN"
   - Encuentra todas las que coincidan

### 6. **El Servidor Devuelve los Resultados**
   - El servidor toma las notas encontradas
   - Las prepara para enviarlas de vuelta
   - Agrega información extra (nombre del dueño, cantidad de likes, etc.)

### 7. **La Aplicación Muestra los Resultados**
   - Recibe las notas encontradas
   - Las muestra en pantalla automáticamente
   - Actualiza la lista sin recargar la página

---

## 🔄 Resumen Visual

```
Tú escribes "Programación"
         ↓
La app detecta el cambio
         ↓
Prepara la búsqueda
         ↓
Envía: "Busca notas de Programación"
         ↓
El servidor pregunta a MongoDB
         ↓
MongoDB encuentra las notas
         ↓
El servidor devuelve los resultados
         ↓
La app muestra las notas en pantalla
```

---

## 💡 Características Importantes

### ✨ **Búsqueda Inteligente**
- **No distingue mayúsculas/minúsculas**: Si escribes "programación" encuentra "Programación"
- **Búsqueda parcial**: Si escribes "Prog" encuentra "Programación", "Programación Avanzada", etc.
- **No requiere coincidencia exacta**: Busca dentro del texto

### 🔀 **Múltiples Filtros**
- Puedes usar varios filtros a la vez
- Ejemplo: Materia = "Programación" Y Universidad = "UBA"
- La búsqueda encuentra notas que cumplan TODOS los filtros

### ⚡ **Automático**
- No necesitas hacer clic en "Buscar"
- Cada vez que escribes o cambias un filtro, busca automáticamente
- Los resultados aparecen casi instantáneamente

---

## 🎓 Ejemplo Práctico

**Situación:** Quieres buscar apuntes de Programación en la UBA

1. Abres la página de notas
2. Escribes "Programación" en el campo "Materia"
3. Escribes "UBA" en el campo "Universidad"
4. Automáticamente aparecen las notas que cumplen ambas condiciones
5. Puedes cambiar el ordenamiento (Más recientes, Más valoradas, etc.)

**Resultado:** Ves solo las notas de Programación de la UBA, ordenadas como prefieras.

---

## 🗂️ ¿Dónde se Guardan las Notas?

Las notas se guardan en **MongoDB**, que es como una gran caja de archivos digitales.

Cada nota tiene información como:
- Título
- Materia (ej: "Programación")
- Universidad (ej: "UBA")
- Carrera (ej: "Informática")
- Tags (ej: ["parciales", "teorico"])
- Dueño (quién la subió)
- Fecha de creación
- Likes (quién le dio like)

Cuando buscas, MongoDB revisa todas estas cajas y te devuelve las que coinciden con lo que pediste.

---

## 🔍 ¿Cómo Funciona la Búsqueda Exactamente?

### Búsqueda por Texto (Universidad, Carrera, Materia)

Cuando escribes "Programación":
- MongoDB busca en el campo "subject" (materia)
- Busca cualquier nota que contenga "Programación" en ese campo
- No importa si está al principio, en el medio o al final
- No importa si está en mayúsculas o minúsculas

**Ejemplos de lo que encuentra:**
- ✅ "Programación"
- ✅ "Programación Avanzada"
- ✅ "Introducción a la Programación"
- ✅ "programación" (minúsculas)
- ✅ "PROGRAMACIÓN" (mayúsculas)

### Búsqueda por Tags

Los tags funcionan diferente:
- Debes escribir exactamente el tag
- Ejemplo: Si buscas "parciales", encuentra notas que tengan ese tag
- Puedes buscar múltiples tags separados por comas

---

## 🎛️ Ordenamiento

Además de filtrar, puedes ordenar los resultados:

- **Más recientes**: Las notas más nuevas primero
- **Más valoradas**: Las notas con más likes primero
- **Más antiguas**: Las notas más viejas primero

El ordenamiento se aplica DESPUÉS de filtrar, así que siempre ves las notas que cumplen tus filtros, pero ordenadas como prefieras.

---

## ❓ Preguntas Frecuentes

### ¿Por qué aparece al toque sin hacer clic?
Porque la aplicación está "escuchando" los cambios que haces. Cada vez que escribes algo, automáticamente busca.

### ¿Puedo buscar por varias cosas a la vez?
Sí, puedes usar todos los filtros juntos. La búsqueda encuentra notas que cumplan TODAS las condiciones.

### ¿Qué pasa si no encuentro nada?
Aparece un mensaje diciendo que no se encontraron notas con esos filtros. Puedes probar con otros términos o quitar algunos filtros.

### ¿La búsqueda distingue mayúsculas?
No, puedes escribir "programación" o "Programación" y encuentra lo mismo.

### ¿Puedo buscar solo parte de una palabra?
Sí, si escribes "Prog" encuentra "Programación", "Programación Avanzada", etc.

---

## 🎯 En Resumen

1. **Escribes** en los campos de filtro
2. **La app busca automáticamente** sin que hagas clic
3. **El servidor consulta MongoDB** para encontrar las notas
4. **Los resultados aparecen** en pantalla casi al instante
5. **Puedes combinar filtros** y ordenar como quieras

Es como tener un asistente que busca en una biblioteca gigante cada vez que le dices qué necesitas, y te muestra los resultados al instante.

---

**Última actualización:** 2024
