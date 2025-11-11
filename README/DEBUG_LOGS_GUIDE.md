# 🔍 Guía de Logs para Debug: esAdmin

## Resumen Rápido

Se han agregado logs detallados en **4 puntos críticos** para rastrear dónde se pierde el valor `esAdmin` al intentar acceder a Configuraciones.

---

## 1️⃣ **Endpoint de Login** (`app/api/auth/login/route.ts`)

**Línea:** ~85-112

**Qué hace:**
- Intenta buscar el perfil del usuario en la tabla `profiles`
- Si lo encuentra: Log detallado del `es_admin`
- Si NO lo encuentra: Log de error + retorna `es_admin: false`

**Qué buscar en los logs:**
```
❌ [LOGIN] Perfil NO encontrado en BD
❌ [LOGIN] Error: NOROW
❌ [LOGIN] Creando respuesta con datos mínimos (es_admin=false)
```

O (si existe):
```
✅ [LOGIN] Datos del perfil obtenidos desde BD
✅ [LOGIN]   Email: usuario@example.com
✅ [LOGIN]   es_admin: true  ← AQUÍ ES DONDE DEBERÍA DECIR TRUE
```

---

## 2️⃣ **Cliente - Login Fresco** (`app/page.tsx`)

**Línea:** ~125-180

**Qué hace:**
- Cliente recibe la respuesta del servidor
- Extrae `data.user.es_admin`
- Guarda en localStorage

**Qué buscar en los logs:**
```
✅ [CLIENTE] Login exitoso con Supabase Auth
🔐 [CLIENTE] Data COMPLETA recibida del servidor: {...}
🔐 [CLIENTE] data.user.es_admin = true  ← DEBE SER true O false
🔐 [CLIENTE] currentUser después de setCurrentUser:
   - esAdmin: true  ← DEBE COINCIDIR CON LO DE ARRIBA
💾 [CLIENTE] Guardando token en localStorage:
   - esAdmin en token: true  ← DEBE SER true
✅ [CLIENTE] Token guardado en localStorage
```

---

## 3️⃣ **Cliente - Restauración de Sesión** (`app/page.tsx`)

**Línea:** ~50-75

**Cuándo ocurre:**
- Cuando recargas la página (F5, Ctrl+R)
- Lee token de localStorage
- Restaura la sesión

**Qué buscar en los logs:**
```
🔐 [RESTAURAR] Encontrado token en localStorage
   - id: 0006b3f6-2a4d-427a-be89-f3ab4122e4db
   - email: usuario@example.com
   - token.esAdmin: true  ← DEBE SER true SI GUARDASTE BIEN
   - Tipo de esAdmin: boolean
🔐 [RESTAURAR] esAdminValue final: true
✅ [RESTAURAR] User restaurado desde localStorage: {...}
```

---

## 4️⃣ **Componente Principal** (`components/MainApp.tsx`)

**Línea:** ~714

**Qué hace:**
- Cuando intentas acceder a Configuraciones
- Verifica si `currentUser.esAdmin === true`
- Si no lo es: Muestra "Acceso Denegado"

**Qué buscar en los logs:**
```
🔐 [MAINAPP CONFIG] currentUser: {
  id: '0006b3f6...',
  email: 'usuario@example.com',
  esAdmin: true,  ← DEBE SER true
  ...
}
   - esAdmin: true
   - Tipo de esAdmin: boolean
   - Check (currentUser.esAdmin): true  ← DEBE SER true
```

---

## 🎯 **Flujo Completo Esperado**

```
1. LOGIN:
   [SERVIDOR] ❌ Perfil NO encontrado
   [SERVIDOR] Retorna es_admin: false

   OR

   [SERVIDOR] ✅ Encontrado perfil
   [SERVIDOR] es_admin: true

2. [CLIENTE] Recibe response:
   [CLIENTE] esAdmin: true (o false)

3. [CLIENTE] Guarda en localStorage:
   💾 Token guardado con esAdmin: true

4. [CLIENTE] Intenta acceder Configuraciones:
   🔐 [MAINAPP CONFIG] esAdmin: true
   ✅ ACCESO PERMITIDO
```

---

## 🚨 **Problemas Comunes y Qué Verificar**

### Problema 1: "Perfil NO encontrado"
```
❌ [LOGIN] Perfil NO encontrado en BD
```
**Causa:** Usuario existe en `auth.users` pero NO en `profiles`
**Solución:** Ver [CREAR PERFIL](#crear-perfil)

### Problema 2: "esAdmin en BD es false"
```
✅ [LOGIN] es_admin: false
```
**Causa:** En la BD, el usuario tiene `es_admin = false`
**Solución:** Actualizar el usuario en la BD a `es_admin = true`

### Problema 3: "esAdmin en localStorage es false/undefined"
```
💾 Guardando token en localStorage:
   - esAdmin en token: false
```
**Causa:** El servidor envió `es_admin: false`
**Solución:** Revisar Problema 1 o 2

### Problema 4: "Restauración da false"
```
🔐 [RESTAURAR] token.esAdmin: undefined
```
**Causa:** Token viejo en localStorage que no tiene `esAdmin`
**Solución:** Limpiar localStorage: `localStorage.removeItem('sistema_auth_token')`

---

## 📝 **Cómo Ejecutar el Debug**

### Paso 1: Abre DevTools
```
F12 o Ctrl+Shift+I
```

### Paso 2: Ve a la pestaña Console
```
Click en "Console"
```

### Paso 3: Limpia la consola
```
Ctrl+L o command+K
```

### Paso 4: Limpia localStorage (importante)
```javascript
localStorage.removeItem('sistema_auth_token')
localStorage.removeItem('sistema_auth_user')
```

### Paso 5: Recarga la página
```
F5 o Ctrl+R
```

### Paso 6: Ingresa credenciales
```
Email: usuario@example.com
Contraseña: ****
```

### Paso 7: Lee los logs en orden
```
1. [LOGIN] - Busca "❌ Perfil NO encontrado" o "✅ es_admin:"
2. [CLIENTE] - Busca "data.user.es_admin ="
3. [LOCALSTORAGE] - Busca "esAdmin en token:"
4. [MAINAPP CONFIG] - Busca "Check (currentUser.esAdmin):"
```

### Paso 8: Accede a Configuraciones
```
Click en botón "Configuraciones"
- Si ves "Acceso Denegado" → esAdmin es false
- Si ves panel → esAdmin es true ✅
```

---

## 🔐 **Caso Normal (Sin Problemas)**

Todo debería mostrar `true`:

```
[LOGIN]     es_admin: true ✅
[CLIENTE]   data.user.es_admin: true ✅
[CLIENTE]   esAdmin: true ✅
[STORAGE]   esAdmin en token: true ✅
[MAINAPP]   esAdmin: true ✅
[MAINAPP]   Check: true ✅

RESULTADO: ✅ Acceso Permitido a Configuraciones
```

---

## 🆘 **Si Algo Está Mal**

### Captura Todos los Logs

En DevTools Console:
```javascript
// Copia TODOS los logs desde [LOGIN] hasta [MAINAPP]
// Pegálos en el chat para análisis
```

### Información Adicional Necesaria

```javascript
// Para verificar estado actual
console.log('Token:', JSON.parse(localStorage.getItem('sistema_auth_token')))
console.log('User ID:', JSON.parse(localStorage.getItem('sistema_auth_token'))?.id)
```

---

## 📌 **Archivo Raíz del Problema**

**Base de Datos:** Tabla `profiles`
- Columna correcta: `es_admin` (boolean)
- UID del usuario: `0006b3f6-2a4d-427a-be89-f3ab4122e4db`

**Verificar en Supabase:**
```sql
SELECT id, email, es_admin FROM profiles 
WHERE id = '0006b3f6-2a4d-427a-be89-f3ab4122e4db';
```

Si sale vacío → Usuario no existe → Ver [CREAR PERFIL](#crear-perfil)
Si sale `es_admin: false` → Actualizar a `true`

---

## 📍 **Resumen de Cambios Aplicados**

| Archivo | Línea | Cambio |
|---------|-------|--------|
| `app/api/auth/login/route.ts` | ~85-112 | Logs detallados de búsqueda en profiles |
| `app/page.tsx` | ~50-75 | Logs de restauración de sesión |
| `app/page.tsx` | ~125-180 | Logs de login fresco |
| `components/MainApp.tsx` | ~714 | Logs del check de esAdmin |

---

💡 **PRÓXIMO PASO:** Ejecuta el debug, copia los logs y pégalos aquí.
