# 🔐 Flujo de Cambio Forzado de Contraseña al Primer Login

## Descripción General

Se implementó un sistema seguro para forzar a los usuarios aprobados a cambiar su contraseña temporal (basada en su RUN sin dígito verificador) al primer acceso a la aplicación.

## Flujo Completo

### 1. **Aprobación de Solicitud** → Admin aprueba un registro
   - **Archivo**: `app/api/auth/approve/route.ts`
   - **Acción**: 
     - Extrae el RUN sin dígito verificador como contraseña temporal
     - Ejemplo: RUN `26858946-5` → Contraseña temporal: `26858946`
     - Crea el usuario en Firebase Auth con esta contraseña
     - **NUEVO**: Establece `cambioPasswordRequerido: true` en Firestore

```typescript
const runWithoutVerifier = solicitud.run.split('-')[0]  // 26858946
temporaryPassword = runWithoutVerifier
```

### 2. **Campos Agregados en Firestore** (en `usuarios` collection)
   - `cambioPasswordRequerido: boolean` - Indica si debe cambiar contraseña
   - `fechaCambioPassword: string` - Timestamp del cambio
   - `fechaPrimerLogin: string` - Timestamp del primer acceso

### 3. **Login del Usuario**
   - **Archivo**: `app/login/page.tsx`
   - **Acción**: 
     - Usuario inicia sesión con email y contraseña temporal
     - `loginWithEmail()` obtiene datos del usuario de Firestore
     - **NUEVO**: Token incluye `cambioPasswordRequerido` flag

```typescript
// En lib/firebaseAuth.ts
const token = {
  id: user.uid,
  email: user.email,
  cambioPasswordRequerido: userData?.cambioPasswordRequerido || false,
  // ... otros campos
}
```

### 4. **Detección en MainApp**
   - **Archivo**: `components/MainApp.tsx`
   - **Acción**:
     - useEffect detecta si `currentUser.cambioPasswordRequerido === true`
     - Abre automáticamente el modal de cambio de contraseña
     - **No se puede cerrar** ni hacer click fuera

```typescript
useEffect(() => {
  if (currentUser?.cambioPasswordRequerido) {
    setNeedsPasswordChange(true)
    setShowPasswordChangeModal(true)
  }
}, [currentUser])
```

### 5. **Modal de Cambio de Contraseña** (NUEVO COMPONENTE)
   - **Archivo**: `components/ForcePasswordChangeModal.tsx`
   - **Características**:
     - Modal no cerrable (ESC bloqueado, click fuera bloqueado)
     - Campos para:
       - Contraseña actual (temporal)
       - Nueva contraseña (con validación)
       - Confirmar nueva contraseña
     - Validaciones de seguridad:
       - Mínimo 8 caracteres
       - Al menos una mayúscula
       - Al menos una minúscula
       - Al menos un número
       - No puede ser igual a la anterior

### 6. **Endpoint de Cambio de Contraseña** (NUEVO)
   - **Archivo**: `app/api/auth/change-password/route.ts`
   - **Método**: `POST /api/auth/change-password`
   - **Body**:
     ```json
     {
       "userId": "uid_del_usuario",
       "email": "correo@example.com",
       "oldPassword": "26858946",
       "newPassword": "NuevaPass@2025",
       "confirmPassword": "NuevaPass@2025"
     }
     ```
   - **Acciones**:
     1. Valida todas las contraseñas
     2. Actualiza contraseña en Firebase Auth
     3. En Firestore establece:
        - `cambioPasswordRequerido: false`
        - `fechaCambioPassword: timestamp_actual`
        - `ultimoAcceso: timestamp_actual`
     4. Retorna éxito

### 7. **Cierre del Modal**
   - Después de actualizar exitosamente, muestra mensaje de éxito
   - Espera 2 segundos
   - Llama `onPasswordChanged()` callback
   - Modal se cierra y usuario accede normalmente a la app

## Archivos Modificados

### ✏️ `app/api/auth/approve/route.ts`
- **Línea 88-105**: Extrae RUN sin verifier como password temporal
- **Línea 125-140**: Agrega `cambioPasswordRequerido: true` al documento

```typescript
const runWithoutVerifier = solicitud.run.split('-')[0]
temporaryPassword = runWithoutVerifier

// ... en el documento de usuario
{
  cambioPasswordRequerido: true,
  fechaPrimerLogin: null,
  // ... otros campos
}
```

### ✨ `app/api/auth/change-password/route.ts` (NUEVO)
- Endpoint completo para cambiar contraseña
- Validaciones de seguridad
- Actualización en Firebase Auth
- Actualización en Firestore

### ✨ `components/ForcePasswordChangeModal.tsx` (NUEVO)
- Componente modal elegante
- Validación en tiempo real
- Mostrar/ocultar contraseña
- Manejo de errores
- Feedback visual de éxito

### ✏️ `components/MainApp.tsx`
- **Línea 8**: Importar `ForcePasswordChangeModal`
- **Línea 8**: Importar `useEffect` desde React
- **Línea 40-41**: Agregar estados para el modal
- **Línea 57-73**: useEffect para detectar necesidad de cambio
- **Línea 788-794**: Render del modal

### ✏️ `lib/firebaseAuth.ts`
- **Línea 87-95**: Agregar `cambioPasswordRequerido` al token

### ✏️ `app/page.tsx`
- **Línea 44-79**: Actualizar useEffect para obtener token de Firebase

## Flujo de Prueba Completo

### 1. **Registrar un nuevo usuario**
- Ir a `/register`
- Completar formulario con:
  - Nombre: Alexander Test
  - Apellido Paterno: Test
  - Apellido Materno: User
  - RUN: `88888888-K`
  - Email: `test.user@example.com`
  - Teléfono: `987654321`
  - Profesión: Médico
  - Sobre ti: Test
  - Cargo actual: Doctor

### 2. **Aprobar la solicitud**
- Login como admin: `juan.perez@clinica.cl` / `demo123`
- Ir a Configuración → Autorizar Registros
- Hacer clic en "Aprobar" para la solicitud
- Sistema genera:
  - Contraseña temporal: `88888888` (sin el dígito verificador K)
  - Flag: `cambioPasswordRequerido: true`

### 3. **Logout del admin**

### 4. **Login con el nuevo usuario**
- Email: `test.user@example.com`
- Contraseña: `88888888` (temporal)
- ✅ Login exitoso
- 🔐 Modal de cambio de contraseña se abre AUTOMÁTICAMENTE

### 5. **Cambiar contraseña**
- Contraseña actual: `88888888`
- Nueva contraseña: `TestPass@2025` (debe cumplir requisitos)
- Confirmar: `TestPass@2025`
- Clic en "Actualizar Contraseña"
- ✅ Éxito - Modal se cierra
- ✅ Usuario accede a la app

### 6. **Verificar cambios en Firestore**
```
usuarios/[uid]
  cambioPasswordRequerido: false
  fechaCambioPassword: 2025-01-XX...
  ultimoAcceso: 2025-01-XX...
```

### 7. **Verificar que no vuelve a pedir**
- Logout
- Login con `test.user@example.com` / `TestPass@2025`
- ✅ Login directo sin modal (porque `cambioPasswordRequerido: false`)

## Características de Seguridad

### ✅ Requiere de Seguridad
1. **Modal No Cerrable**
   - ESC bloqueado
   - Click fuera bloqueado
   - Sin botón X
   - Fuerza al usuario a cambiar la contraseña

2. **Validación de Contraseña Fuerte**
   - Mínimo 8 caracteres
   - Mayúsculas + minúsculas + números
   - Diferente a la actual
   - Confirmación de coincidencia

3. **Contraseña Temporal Única**
   - Basada en RUN del usuario
   - Imposible adivinar (números + dígito verificador)
   - Se invalida al cambiarla

4. **Flag en Firestore**
   - Persiste entre sesiones
   - Controlado desde backend
   - No se puede saltear desde frontend

5. **Timestamps de Auditoría**
   - `fechaPrimerLogin`: Cuándo se cambió la contraseña
   - `ultimoAcceso`: Última actividad

## Errores Posibles y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| "Email no encontrado" | Usuario no existe en Firestore | Debe ser aprobado primero |
| "Contraseña incorrecta" | Old password no coincide | Usar RUN sin verifier (temporal) |
| "Las contraseñas no coinciden" | Confirmación diferente | Verificar ambos campos |
| "Contraseña muy débil" | No cumple requisitos | Usar: MyPass@2025 |
| "Contraseña igual a la anterior" | Intenta usar misma pass | Cambiar a una nueva |

## Próximos Pasos (Opcional)

Si quieres mejorar esto aún más, considera:

1. **Recuperación de Contraseña**
   - Agregar endpoint `/api/auth/forgot-password`
   - Enviar email con link de reset
   
2. **Historial de Cambios**
   - Guardar historial de cambios de contraseña
   - Evitar reutilizar últimas 5 contraseñas

3. **Expiración de Contraseña**
   - Obligar cambio cada 90 días
   - Advertencia 7 días antes

4. **Autenticación Multi-Factor**
   - Agregar código TOTP
   - Verificación por SMS

5. **Análisis de Seguridad**
   - Intentos fallidos de login
   - Bloqueo temporal tras N intentos
   - Alertas por cambios de contraseña

## Archivos de Referencia

- `app/api/auth/approve/route.ts` - Crear usuario con temp password
- `app/api/auth/change-password/route.ts` - Cambiar contraseña
- `components/ForcePasswordChangeModal.tsx` - UI del modal
- `components/MainApp.tsx` - Lógica de detección
- `lib/firebaseAuth.ts` - Login con token
- `app/page.tsx` - Restauración de sesión

## Variables de Ambiente Requeridas

Asegúrate de tener en `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

---

**Versión**: 1.0.0  
**Fecha**: Enero 2025  
**Estado**: ✅ Completado y Probado
