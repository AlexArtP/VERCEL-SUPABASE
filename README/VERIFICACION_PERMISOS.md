# 🧪 Checklist de Verificación de Permisos Firebase

**Propósito:** Guía rápida para verificar que los permisos están funcionando correctamente

---

## ✅ Verificación Paso a Paso

### 1️⃣ Verificar Listeners (Sin Errores de Permiso)

**Ubicación:** DevTools Console → Network/Console

**Señales de Éxito:**
```
✅ "🔔 Iniciando listener de solicitudes pendientes..."
✅ "🔔 Iniciando listener de citas para profesional: <uid>"
✅ No hay "FirebaseError: Missing or insufficient permissions"
```

**Si ves errores:**
```
❌ "❌ Error escuchando solicitudes: FirebaseError: Missing or insufficient permissions."
❌ "❌ Error escuchando citas: FirebaseError: Missing or insufficient permissions."
```

Acción: Verificar que las reglas tienen `allow read: if true;` en las colecciones

---

### 2️⃣ Test: Crear Cita (Profesional)

**Pasos:**
1. Login como usuario profesional
2. Ir a calendario
3. Crear nueva cita
4. Llenar datos: paciente, fecha, hora, tipo

**Esperado:**
```
✅ Cita creada exitosamente
✅ Aparece en el calendario
✅ Console: "✅ Cita creada exitosamente"
```

**Si falla:**
```
❌ "Error al crear cita: Missing or insufficient permissions"
```

**Diagnóstico:**
- Verificar que se incluye `profesionalId: <uid>` en los datos
- Revisar la regla CREATE en citas

---

### 3️⃣ Test: Profesional NO Puede Crear Cita para Otro

**Pasos:**
1. Login como usuario profesional A
2. Intentar crear cita con `profesionalId` = usuario B
3. Enviar formulario

**Esperado:**
```
❌ "Permission denied - Cannot create appointment for another professional"
```

**Si pasa (Mal Señal):**
```
✅ Cita creada (ESTO ES UN PROBLEMA)
```

**Diagnóstico:**
- La validación NO está funcionando
- Revisar regla CREATE en citas: debe tener `request.resource.data.profesionalId == request.auth.uid`

---

### 4️⃣ Test: Administrativo Puede Crear Cita para Cualquiera

**Pasos:**
1. Login como usuario administrativo
2. Crear cita con `profesionalId` = cualquier usuario
3. Enviar formulario

**Esperado:**
```
✅ Cita creada exitosamente
✅ Aparece para el profesional especificado
```

**Si falla:**
```
❌ "Permission denied"
```

**Diagnóstico:**
- Revisar que el usuario tiene `rol: 'administrativo'`
- Revisar que `isAdministrativo()` está siendo evaluado correctamente

---

### 5️⃣ Test: NO Se Puede Cambiar esAdmin

**Pasos:**
1. Login como usuario normal
2. Abrir DevTools Console
3. Ejecutar:
```javascript
const { doc, updateDoc } = await import('firebase/firestore');
const { db } = await import('/lib/firebaseConfig.ts');
const userDoc = doc(db, 'usuarios', '<tu-uid>');
await updateDoc(userDoc, { esAdmin: true });
```

**Esperado:**
```
❌ FirebaseError: Missing or insufficient permissions
```

**Si funciona (Mal Señal):**
```
✅ esAdmin actualizado (ESTO ES UN PROBLEMA DE SEGURIDAD)
```

**Diagnóstico:**
- La regla UPDATE debe bloquear cambios a `esAdmin`
- Revisar: `!('esAdmin' in request.resource.data.diff(resource.data).affectedKeys())`

---

### 6️⃣ Test: Profesional Puede Eliminar Su Propio Módulo

**Pasos:**
1. Login como profesional
2. Ver lista de módulos
3. Hacer clic en "Eliminar" en su propio módulo
4. Confirmar

**Esperado:**
```
✅ Módulo eliminado exitosamente
✅ Desaparece de la lista
```

**Si falla:**
```
❌ "Permission denied"
```

**Diagnóstico:**
- Verificar que la regla DELETE en modulos permite a profesional eliminar módulos propios
- Revisar: `isProfesional() && resource.data.profesionalId == request.auth.uid`

---

### 7️⃣ Test: Profesional NO Puede Eliminar Módulo de Otro

**Pasos:**
1. Login como profesional A
2. Intentar encontrar módulo de profesional B
3. Hacer clic en "Eliminar"
4. Verificar que falla

**Esperado:**
```
❌ "Permission denied"
```

**Si funciona (Mal Señal):**
```
✅ Módulo eliminado (ESTO ES UN PROBLEMA)
```

**Diagnóstico:**
- La validación de propiedad NO está funcionando
- Revisar regla DELETE

---

### 8️⃣ Test: Crear Plantilla (Profesional)

**Pasos:**
1. Login como profesional
2. Crear nueva plantilla
3. Llenar datos y guardar

**Esperado:**
```
✅ Plantilla creada exitosamente
```

**Si falla:**
```
❌ "Permission denied"
```

**Diagnóstico:**
- Verificar que profesional tiene rol `'profesional'`
- Revisar que se incluye `profesionalId` o `createdBy`

---

### 9️⃣ Test: Usuario "Otros" NO Puede Crear Cita

**Pasos:**
1. Crear usuario con `rol: 'otros'`
2. Login como ese usuario
3. Intentar crear cita

**Esperado:**
```
❌ "Permission denied"
✅ Botón de crear deshabilitado en UI
```

**Si funciona (Mal Señal):**
```
✅ Cita creada (ESTO ES UN PROBLEMA)
```

**Diagnóstico:**
- Revisar que CREATE en citas require: `(isProfesional() || isAdministrativo())`

---

### 🔟 Test: Notifications Listeners Funcionan

**Pasos:**
1. Login como admin en navegador A
2. Abrir DevTools Console
3. Crear solicitud de registro desde navegador B
4. Verificar que navegador A recibe notificación

**Esperado:**
```
✅ Notificación aparece en tiempo real
✅ Badge counter se incrementa
✅ Console: "✅ Nueva solicitud creada..."
```

**Si no funciona:**
```
❌ No aparece notificación
❌ Console: "❌ Error escuchando solicitudes..."
```

**Diagnóstico:**
- Verificar listeners en `useNotificationManager.ts`
- Revisar permisos de lectura en `solicitudRegistro`

---

## 📊 Matriz de Verificación

| Test | Paso | Esperado | Actual | OK? |
|------|------|----------|--------|-----|
| 1. Listeners | Ver console | Sin errores | ✅ | ✅ |
| 2. Crear Cita (Propio) | Crear cita | ✅ SUCCESS | ? | ? |
| 3. Crear Cita (Otro) | Crear para otro | ❌ DENIED | ? | ? |
| 4. Crear Cita (Admin) | Admin crea para cualq. | ✅ SUCCESS | ? | ? |
| 5. Cambiar esAdmin | Ejecutar updateDoc | ❌ DENIED | ? | ? |
| 6. Eliminar Módulo (Propio) | Eliminar propio | ✅ SUCCESS | ? | ? |
| 7. Eliminar Módulo (Otro) | Eliminar ajeno | ❌ DENIED | ? | ? |
| 8. Crear Plantilla (Prof.) | Crear plantilla | ✅ SUCCESS | ? | ? |
| 9. Crear Cita (Otros) | Usuario "otros" | ❌ DENIED | ? | ? |
| 10. Notifications | Real-time updates | ✅ SUCCESS | ? | ? |

---

## 🛠️ Debug Commands (DevTools Console)

### Ver el rol del usuario actual
```javascript
const { getAuth } = await import('firebase/auth');
const auth = getAuth();
const user = auth.currentUser;
console.log('Current UID:', user?.uid);

// Si necesitas datos del usuario desde Firestore:
const { getDoc, doc } = await import('firebase/firestore');
const { db } = await import('/lib/firebaseConfig.ts');
const userData = await getDoc(doc(db, 'usuarios', user?.uid));
console.log('User data:', userData.data());
```

### Verificar que un listener está activo
```javascript
console.log('Checking listeners in NotificationContext...');
// Deberías ver logs como:
// "🔔 Iniciando listener de solicitudes pendientes..."
// "📋 Snapshot recibido: X solicitudes"
```

### Simular un error de permiso
```javascript
const { collection, query, where, onSnapshot } = await import('firebase/firestore');
const { db } = await import('/lib/firebaseConfig.ts');

// Esto debería fallar si no tienes permisos
onSnapshot(
  query(collection(db, 'usuarios'), where('esAdmin', '==', true)),
  (snapshot) => console.log('Usuarios admin:', snapshot.docs.length),
  (error) => console.error('Permission error:', error)
);
```

---

## 📱 Requisitos para Tests

- [ ] 2 navegadores o ventanas incógnito
- [ ] Usuarios creados:
  - [ ] Usuario Admin
  - [ ] Usuario Profesional (A)
  - [ ] Usuario Profesional (B)
  - [ ] Usuario Administrativo
  - [ ] Usuario "Otros"
- [ ] DevTools Console abierta
- [ ] Servidor dev corriendo en http://localhost:3000

---

## 🎯 Resultado Esperado

Al completar todos los tests, deberías tener:

| Componente | Status |
|-----------|--------|
| Listeners | ✅ Sin errores |
| Crear recursos | ✅ Con validación de rol |
| Editar recursos | ✅ Solo propios |
| Eliminar recursos | ✅ Solo propios + admin |
| Campos sensibles | ✅ Protegidos (esAdmin) |
| Notificaciones | ✅ Funcionando en tiempo real |

---

## 📞 Si Algo Falla

1. **Verificar la consola del navegador** para mensajes de error específicos
2. **Revisar firestore.rules** para reglas incorrectas
3. **Ejecutar:** `firebase deploy --only firestore:rules`
4. **Esperar 1-2 minutos** para que los cambios se propague
5. **Refrescar el navegador** (Ctrl+Shift+R para limpiar cache)

---

**Última actualización:** 20 de octubre de 2025  
**Created by:** GitHub Copilot
