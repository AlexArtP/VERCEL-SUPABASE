# 🔍 DEBUGGING SESIÓN: esAdmin Access Denied

## Estado Actual

### ✅ Lo Que Hice

1. **Identifiqué el problema root cause:**
   - La tabla `profiles` en Supabase **está completamente vacía**
   - Hay 2 usuarios en `auth.users` pero NINGUNO en `profiles`
   - Cuando se intenta hacer login, el endpoint NO encuentra el perfil
   - Resultado: retorna `es_admin: false` por defecto

2. **Agregué logs detallados en 4 puntos críticos:**
   - `app/api/auth/login/route.ts` - Login endpoint
   - `app/page.tsx` línea ~50 - Session restoration 
   - `app/page.tsx` línea ~125 - Fresh login
   - `components/MainApp.tsx` línea ~714 - Config check

3. **Arreglé error de sintaxis** en page.tsx (había código duplicado)

4. **Reinicié el servidor** - Ahora corriendo con los nuevos logs

---

## 🎯 Lo Que Necesitas Hacer Ahora

### Paso 1: En el Navegador
```
1. Abre DevTools (F12)
2. Ve a "Console" tab
3. Limpia la consola (Ctrl+L)
```

### Paso 2: Limpia localStorage
En la consola escribe:
```javascript
localStorage.clear()
// O más específico:
localStorage.removeItem('sistema_auth_token')
```

### Paso 3: Recarga la página
```
Ctrl+Shift+R (hard reload)
```

### Paso 4: Intenta hacer login
- Email: uno de los usuarios que existen
- Contraseña: su contraseña

### Paso 5: Observa los logs
Deberías ver en Console (en orden):

```
❌ [LOGIN] Perfil NO encontrado en BD
❌ [LOGIN] Error: NOROW
❌ [LOGIN] Creando respuesta con datos mínimos (es_admin=false)

✅ [CLIENTE] Login exitoso con Supabase Auth
🔐 [CLIENTE] data.user.es_admin = false  ← AQUÍ ESTÁ EL PROBLEMA
💾 [CLIENTE] esAdmin en token: false

🔐 [MAINAPP CONFIG] esAdmin: false
   - Check (currentUser.esAdmin): false

❌ "Acceso Denegado" en Configuraciones
```

---

## 🆘 El Problema Real

**NO es el código. Es los DATOS en la BD.**

- ✅ Código está bien (login endpoint, client, storage, checks)
- ❌ Base de datos NO tiene los perfiles
- ❌ Por eso siempre retorna `es_admin: false`

---

## 🔧 Solución: Crear Perfiles en BD

Necesitas ejecutar en Supabase SQL Editor:

```sql
-- Crear perfil para usuario existente
INSERT INTO profiles (
  id, 
  email, 
  nombre, 
  es_admin, 
  activo
) VALUES (
  '056d09e0-d584-412e-bcd1-8ae472207792',  -- El UUID real del usuario
  'test_1541535136@example.com',
  'Usuario Prueba',
  true,  -- ADMIN
  true
);

-- Repetir para cada usuario en auth.users
```

O copia exactamente los UUIDs de `auth.users`:

```sql
-- Primero, ve qué usuarios tienes:
SELECT id, email FROM auth.users;

-- Luego crea sus perfiles:
INSERT INTO profiles (id, email, nombre, es_admin, activo)
SELECT 
  id, 
  email, 
  email as nombre,  -- O algún nombre
  false,  -- O true si quieres admin
  true
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);
```

---

## 📊 Resumen de Logs Esperados

**Si el usuario EXISTE en profiles con es_admin=true:**

```
✅ [LOGIN] Datos del perfil obtenidos desde BD
✅ [LOGIN] es_admin: true

✅ [CLIENTE] data.user.es_admin = true
💾 [CLIENTE] esAdmin en token: true

🔐 [MAINAPP CONFIG] esAdmin: true
✅ Acceso Permitido a Configuraciones
```

**Si el usuario NO existe en profiles:**

```
❌ [LOGIN] Perfil NO encontrado en BD
❌ [LOGIN] Creando respuesta con datos mínimos (es_admin=false)

🔐 [CLIENTE] data.user.es_admin = false
💾 [CLIENTE] esAdmin en token: false

❌ "Acceso Denegado"
```

---

## 📝 Qué Verificar

### En Supabase Console:

```sql
-- ¿Cuántos perfiles tenemos?
SELECT COUNT(*) FROM profiles;

-- ¿Cuántos usuarios de auth tenemos?
SELECT COUNT(*) FROM auth.users;

-- ¿Hay admins?
SELECT id, email, es_admin FROM profiles WHERE es_admin = true;

-- ¿Nuestro usuario específico existe?
SELECT id, email, es_admin FROM profiles 
WHERE id = '0006b3f6-2a4d-427a-be89-f3ab4122e4db';
```

---

## 🚀 Próximos Pasos

**Opción A: Crear perfil admin para usuario existente**

1. Copia el UUID de uno de los usuarios en auth.users
2. Ejecuta en Supabase SQL:
   ```sql
   INSERT INTO profiles (id, email, nombre, es_admin, activo)
   VALUES (
     'UUID_DEL_USUARIO',
     'email@del.usuario',
     'Nombre',
     true,
     true
   );
   ```
3. Haz login de nuevo
4. Intenta Configuraciones

**Opción B: Debuggear con los logs**

1. Corre los pasos 1-5 de arriba
2. Captura TODOS los logs (Ctrl+A, Ctrl+C)
3. Pégalos en el chat
4. Veré exactamente dónde se pierde `esAdmin`

---

## 📌 Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `app/api/auth/login/route.ts` | Logs detallados de búsqueda en BD |
| `app/page.tsx` | Logs de login fresco y session restoration |
| `components/MainApp.tsx` | Logs del check de esAdmin |
| `README/DEBUG_LOGS_GUIDE.md` | Guía completa de debugging |

---

💡 **AHORA:** Elige una opción arriba y ejecuta. Los logs te dirán exactamente qué está pasando.
