# 🔧 Resumen de Cambios - Arreglo de Autenticación Firebase

**Fecha**: 21 de octubre de 2025
**Problema**: Usuarios registrados no podían iniciar sesión (error `auth/invalid-credential`)

## 🎯 Causa Raíz

El flujo anterior generaba una contraseña **temporal aleatoria** al aprobar, en lugar de usar la contraseña que el usuario ingresó al registrarse. Esto causaba que:
1. Usuario ingresaba contraseña `MiContraseña123` en registro
2. Se aprobaba y se generaba temporal `P4bX9qL7` 
3. Firebase Auth se creaba con la temporal
4. Usuario intentaba login con `MiContraseña123` → Fallaba ❌

## 📝 Cambios Implementados

### 1. **`app/api/auth/register/route.ts`** 

**Antes:**
```typescript
passwordHash: hashPassword(password),  // Solo guardaba el hash
```

**Después:**
```typescript
password: password,  // Guarda contraseña descifrada (temporal, para aprobación)
// Comentario explicativo sobre seguridad
// 🔐 IMPORTANTE: Guardar CONTRASEÑA DESCIFRADA (no hasheada)
// Esto es necesario para poder crear el usuario en Firebase Auth al aprobar
// Firestore está protegido con reglas de seguridad, solo admins pueden leer esto
```

**Cambios adicionales:**
- Removida la función `hashPassword()` que ya no se usa
- Removido import de `crypto` (ya no necesario para hashing)

---

### 2. **`app/api/auth/approve/route.ts`**

**Antes:**
```typescript
// Generaba contraseña temporal aleatoria
let password = crypto.randomBytes(8).toString('hex').toUpperCase().slice(0, 10)
if (!/[A-Z]/.test(password)) password = 'P' + password
if (!/[0-9]/.test(password)) password = password + '9'

// Luego retornaba como "contraseña temporal"
temporaryPassword: password,
```

**Después:**
```typescript
// Valida que existe contraseña en la solicitud
if (!solicitud.password) {
  return NextResponse.json({
    success: false,
    message: 'No se encontró contraseña en la solicitud...'
  }, { status: 400 })
}

// Usa la contraseña original del usuario
password = solicitud.password

// Crea usuario en Firebase Auth con esa contraseña
const userRecord = await adminAuth.createUser({
  email: solicitud.email,
  password: password,  // ← Contraseña original
  displayName: `${solicitud.nombre} ${solicitud.apellidoPaterno}`,
  disabled: false,
})

// Respuesta actualizada (sin temporaryPassword)
{
  success: true,
  message: `Usuario aprobado exitosamente...`,
  userId,
  email: solicitud.email,
  instructions: `✅ Usuario aprobado exitosamente.\n\n📧 Email: ${solicitud.email}\n🔑 El usuario puede usar la contraseña que registró al solicitar acceso.`
}
```

**Cambios en la lógica:**
- ✅ Valida que exista `solicitud.password`
- ✅ Usa la contraseña original (no genera temporal)
- ✅ Firebase Auth se crea con contraseña correcta
- ✅ Actualiza flag `cambioPasswordRequerido: true` para primer cambio (opcional)

---

### 3. **`app/api/auth/reset-password/route.ts`** (Mantiene su función)

Este endpoint sigue siendo útil para:
- **Después de aprobación**: Admin puede regenerar si usuario olvida su contraseña
- Genera una temporal ALEATORIA
- Usuario debe cambiarla en próximo login

```typescript
// Genera temporal segura
let temporaryPassword = crypto.randomBytes(8).toString('hex').toUpperCase().slice(0, 10)
// Asegurar formato
if (!/[A-Z]/.test(temporaryPassword)) temporaryPassword = 'P' + temporaryPassword
if (!/[0-9]/.test(temporaryPassword)) temporaryPassword = temporaryPassword + '9'

// Actualiza Firebase Auth
await adminAuth.updateUser(userId, { password: temporaryPassword })

// Establece flag de cambio obligatorio
await adminDb.collection('usuarios').doc(userId).update({
  cambioPasswordRequerido: true,
  ultimaRegenertacionPassword: new Date().toISOString(),
})
```

---

### 4. **`components/MainApp.tsx`** (UI del botón)

**Antes:**
```typescript
handleGenerateAndCopyPassword() // Generaba localmente
temporaryPassword: password    // Mostraba temporal
```

**Después:**
```typescript
handleRegenerateAndCopyPassword() // Llama endpoint
// Llama a `/api/auth/reset-password`
// Copia la contraseña temporal retornada
// Solo para admins regenerando password olvidada
```

---

## 🔐 Diagrama del Nuevo Flujo

```
┌─────────────────────────────────────────────────────────────┐
│                    REGISTRO DE USUARIO                      │
├─────────────────────────────────────────────────────────────┤
│ 1. Usuario ingresa: email, password, etc.                   │
│ 2. POST /api/auth/register                                  │
│ 3. Firestore: { password: "MiContraseña123", estado: ... }  │
│ 4. Respuesta: "Solicitud registrada"                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  APROBACIÓN (Admin)                         │
├─────────────────────────────────────────────────────────────┤
│ 1. Admin ve solicitud                                       │
│ 2. Clic en "Aprobar"                                        │
│ 3. POST /api/auth/approve { solicitudId }                   │
│ 4. Sistema lee: password = "MiContraseña123"                │
│ 5. adminAuth.createUser({ email, password })               │
│ 6. Firebase Auth: Usuario creado ✅                         │
│ 7. Firestore usuarios: Copia de datos                       │
│ 8. Solicitud eliminada                                      │
│ 9. Admin ve: "Usuario aprobado"                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    LOGIN DEL USUARIO                        │
├─────────────────────────────────────────────────────────────┤
│ 1. Usuario: email, password (LA ORIGINAL)                   │
│ 2. Firebase.auth().signInWithEmailAndPassword()             │
│ 3. Firebase Auth verifica: ✅ COINCIDE                      │
│ 4. Usuario autenticado                                      │
│ 5. Modal: "Cambia tu contraseña" (cambioPasswordRequerido)  │
│ 6. Usuario establece nueva contraseña                       │
│ 7. Acceso al sistema ✅                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Cómo Probar

### Test 1: Nuevo Registro
```
1. Ir a http://localhost:3000
2. Clic en "¿No tienes cuenta? Solicita acceso"
3. Email: test.nuevo@ejemplo.com
4. Contraseña: TestPassword123
5. Llenar resto de datos
6. Clic en "Registrar"
7. ✅ Debe mostrar: "Solicitud registrada exitosamente"
```

### Test 2: Aprobación
```
1. Admin inicia sesión
2. Configuraciones → Autorizar Registros
3. Ver la nueva solicitud
4. Clic en "Aprobar"
5. ✅ Debe mostrar: "Usuario aprobado exitosamente"
```

### Test 3: Login del Nuevo Usuario
```
1. Logout del admin
2. Correo: test.nuevo@ejemplo.com
3. Contraseña: TestPassword123 (LA MISMA DEL REGISTRO)
4. Clic en "Iniciar Sesión"
5. ✅ DEBE FUNCIONAR (antes fallaba)
6. Ver modal "Cambiar contraseña"
7. Cambiar a nueva contraseña
8. ✅ Acceso al sistema exitoso
```

---

## ⚠️ Consideraciones de Seguridad

### Contraseña almacenada en Firestore
**Estado actual:**
- Contraseña plana guardada en Firestore
- Solo visible para admins (reglas de seguridad)
- Eliminada después de aprobación
- Temporal (~minutos)

**Mejora recomendada para producción:**
```typescript
// Encriptar contraseña antes de guardar
import bcrypt from 'bcrypt'

const hashedPassword = await bcrypt.hash(password, 10)
// Guardar hashPassword en Firestore

// Al aprobar:
// 1. Obtener contraseña original del cliente (en sitio seguro)
// 2. O hacer que el usuario la ingrese nuevamente
// 3. Crear usuario en Firebase Auth
```

---

## 📋 Checklist de Validación

- [x] Cambio 1: Register guarda contraseña original
- [x] Cambio 2: Approve usa contraseña original
- [x] Cambio 3: Reset-password sigue siendo para regeneración
- [x] Cambio 4: UI botón actualizado
- [x] Compilación sin errores
- [ ] Test: Nuevo registro (pendiente)
- [ ] Test: Aprobación (pendiente)
- [ ] Test: Login con contraseña original (pendiente)
- [ ] Test: Regeneración de contraseña olvidada (pendiente)

---

## 📞 Soporte

Si el error persiste:
1. Revisar logs del servidor (en terminal de desarrollo)
2. Verificar Firestore Rules (¿permite admin leer solicitudes?)
3. Verificar Firebase Admin SDK (¿está inicializado?)
4. Revisar error exacto en console del navegador

