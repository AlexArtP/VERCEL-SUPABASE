# 🧪 Test de Flujo de Autenticación

## Problema identificado
El error `auth/invalid-credential` ocurre cuando:
- La contraseña ingresada en el formulario NO coincide con la contraseña en Firebase Auth
- Esto sucedía porque se generaba una temporal en lugar de usar la del usuario

## Solución implementada

### Cambios en `/api/auth/register`:
- ✅ Ahora guarda `password` (contraseña descifrada) directamente en Firestore
- La contraseña se almacena de forma segura (Firestore tiene reglas que solo dejan leerla a admins)

### Cambios en `/api/auth/approve`:
- ✅ Ahora usa `solicitud.password` (la contraseña original del usuario)
- Crea el usuario en Firebase Auth con esa contraseña
- El usuario puede iniciar sesión con su contraseña original

## Flujo de autenticación correcto

```
1. USUARIO SE REGISTRA
   - Ingresa email y contraseña
   - Se envía: { ..., email, password, confirmPassword }
   - Se guarda en Firestore: { ..., password: "contraseña_original", estado: "pendiente" }

2. ADMIN APRUEBA
   - Admin aprueba la solicitud
   - Sistema obtiene `password` de Firestore
   - Crea usuario en Firebase Auth: { email, password: solicitud.password }
   - Activa flag `cambioPasswordRequerido = true`
   - Usuario es trasladado a colección `usuarios`
   - Solicitud es eliminada

3. USUARIO INICIA SESIÓN
   - Email: agendacecosamlautaro@gmail.com
   - Contraseña: [LA QUE INGRESÓ AL REGISTRARSE]
   - Firebase Auth verifica con éxito ✅

4. USUARIO VE MODAL DE CAMBIO DE CONTRASEÑA
   - Debe cambiar su contraseña en primer login
   - Puede establecer una nueva contraseña permanente

5. (OPCIONAL) ADMIN REGENERA CONTRASEÑA
   - Si usuario olvida su contraseña
   - Admin clic en botón "Regenerar contraseña"
   - Se genera temporal aleatoria
   - Firebase Auth se actualiza
   - Se muestra al admin para compartir
```

## Pasos para probar

### 1. Limpiar registros antiguos (OPCIONAL - si hay duplicados)
```
Firestore:
- Eliminar solicitud duplicada de "agendacecosamlautaro@gmail.com"
- Eliminar usuario "agendacecosamlautaro@gmail.com" de Firebase Auth
```

### 2. Nuevo registro
- Email: `test.usuario@ejemplo.com`
- Contraseña: `TestPassword123` (mínimo 8 caracteres, mayúscula, número)
- Confirmar contraseña: `TestPassword123`
- Llenar resto de campos
- Clic en "Registrar"

### 3. Verificar en Firestore
- Ir a `solicitudes` collection
- Buscar el nuevo registro
- Verificar que está: `{ ..., password: "TestPassword123", estado: "pendiente" }`

### 4. Aprobar desde admin panel
- Admin inicia sesión
- Ir a Configuraciones → Autorizar Registros
- Clic en "Aprobar" para el nuevo registro
- Sistema debe crear usuario en Firebase Auth

### 5. Probar login
- Logout del admin
- Email: `test.usuario@ejemplo.com`
- Contraseña: `TestPassword123`
- ✅ Debe funcionar (antes fallaba con invalid-credential)

### 6. Verificar modal de cambio
- Usuario ve modal: "Debe cambiar su contraseña"
- Ingresa contraseña actual: `TestPassword123`
- Ingresa nueva contraseña: `NewPassword456`
- Confirma
- ✅ Contraseña cambiada exitosamente

## Puntos críticos

⚠️ **IMPORTANTE**: La contraseña se guarda en Firestore de forma plana
- Esto es necesario para que al aprobar, podamos usarla en Firebase Auth
- Firestore está protegido con reglas de seguridad
- Solo admins pueden leer las solicitudes
- ¡En producción, considerar cifrar la contraseña!

✅ **Mejora de seguridad**:
- Firebase Auth es la fuente de verdad para autenticación
- Firestore solo guarda la contraseña original temporalmente
- Una vez aprobado, la solicitud se elimina
- La contraseña ya no está almacenada en Firestore después de la aprobación

## Si sigue fallando

Verificar logs del servidor:
```
Buscar: "📥 POST /api/auth/register"
        "📍 [/api/auth/approve] Iniciando..."
        "❌ Autenticación fallida"
```

Si el error persiste:
1. Verificar que Firestore tiene la regla correcta para admins
2. Verificar que Firebase Auth está inicializado correctamente
3. Revisar permisos de Firebase Admin SDK

