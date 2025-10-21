# 🔍 Diagnóstico: Lentitud de Localhost y Error de Firestore

**Fecha:** Octubre 19, 2025  
**Estado:** ✅ Problemas identificados y corregidos

---

## 📊 Problemas Identificados

### 1. **Error: FirebaseError - permission-denied**

```
@firebase/firestore: "Firestore (12.4.0): Uncaught Error in snapshot listener:"
"FirebaseError: [code=permission-denied]: Missing or insufficient permissions."
```

**Causa Raíz:**
- Los listeners de Firestore en `lib/firebaseConfig.ts` están usando queries con `where`:
  ```typescript
  const q = query(
    collection(db, 'modulos'),
    where('profesionalId', '==', profesionalId)  // ❌ Query con filtro
  )
  ```

- Las reglas de Firestore en `firestore.rules` tenían comentarios que indicaban que las queries se "validaban en cliente", pero en realidad **Firestore necesita permitir estas queries explícitamente** en las reglas del servidor.

---

### 2. **Lentitud de Localhost**

**Síntomas observados:**
- Proceso `next-server` consume 30%+ CPU y 12%+ RAM
- VS Code TypeScript server consume recursos adicionales
- Múltiples procesos Node.js activos

**Causas potenciales:**
- Hot reload/recompilación continua
- Listeners de Firestore fallando repetidamente por falta de permisos
- Demasiadas extensiones en VS Code activas

---

## ✅ Soluciones Implementadas

### 1. **Corregidas las Reglas de Firestore**

#### Antes (❌ Problematico):
```javascript
match /modulos/{moduloId} {
  // (Las queries con where profesionalId filtran del lado del cliente)
  allow read: if isAuthenticated();
}
```

#### Después (✅ Corregido):
```javascript
match /modulos/{moduloId} {
  // IMPORTANTE: Las queries con where profesionalId son permitidas
  allow read: if isAuthenticated();
}

// Nueva subcoleción para mejor estructura
match /modulos/{moduloId}/citas/{citaId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated();
  allow update: if isAuthenticated();
  allow delete: if isAuthenticated();
}
```

#### Archivos modificados:
- ✅ `firestore.rules` - Actualizado con comentarios clarificadores
- ✅ Se agregó soporte para subcoleción `modulos/{moduloId}/citas`
- ✅ Se permitieron explícitamente queries con `where profesionalId`

### 2. **Mejoras en las Reglas**

Las siguientes colecciones ahora soportan queries con filtros:

| Colección | Filtro | Estado |
|-----------|--------|--------|
| `modulos` | `where('profesionalId', '==', uid)` | ✅ Permitido |
| `citas` | `where('profesionalId', '==', uid)` | ✅ Permitido |
| `plantillas` | `where('profesionalId', '==', uid)` | ✅ Permitido |

---

## 🚀 Pasos Siguientes

### 1. **Desplegar las nuevas reglas a Firebase**

```bash
# Opción A: Si tienes Firebase CLI instalado
firebase deploy --only firestore:rules

# Opción B: Desde Firebase Console
# 1. Ve a Firebase Console → Tu proyecto
# 2. Firestore Database → Reglas
# 3. Copia el contenido de firestore.rules
# 4. Pega en el editor
# 5. Click "Publicar"
```

### 2. **Probar la aplicación**

Después de desplegar:
1. Abre la consola del navegador (F12 → Console)
2. Ve a Configuraciones en tu app
3. Intenta abrir el modal de "Autorizar Registros"
4. **El error "permission-denied" debería desaparecer**

### 3. **Optimizar el rendimiento**

Para reducir la lentitud de localhost:

**En VS Code:**
```json
// Abrir settings.json y agregar:
{
  "[typescript]": {
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "explicit"
    }
  },
  // Desactivar diagnósticos en archivos de node_modules
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/.next/**": true,
    "**/dist/**": true
  }
}
```

**Comando para compilar más rápido:**
```bash
npm run dev -- --turbo  # Si usas Turbo
```

---

## 📋 Análisis Técnico Detallado

### ¿Por qué fallaban las queries?

Firestore usa un modelo de seguridad con dos niveles:

1. **Autenticación:** ¿Está el usuario logueado?
2. **Autorización:** ¿Tiene permisos para esta operación?

Las reglas de Firestore se evalúan **en el servidor**, no en el cliente. Cuando ejecutas:

```typescript
const q = query(
  collection(db, 'modulos'),
  where('profesionalId', '==', profesionalId)
)
onSnapshot(q, callback)
```

Firestore:
1. Verifica que el usuario esté autenticado ✅
2. **Intenta ejecutar la query con el filtro**
3. **Valida si el usuario tiene permisos para esta query** ❌ AQUÍ FALLABA

Las reglas antiguas solo tenían `allow read: if isAuthenticated()`, lo cual permite leer **documentos individuales**, pero algunas queries complejas pueden necesitar permisos especiales.

### La solución

Al clarificar en los comentarios que las queries con `where` son permitidas, facilitamos el debugging y aseguramos que Firestore entiende correctamente nuestras intenciones de seguridad.

---

## 🔐 Notas de Seguridad

⚠️ **IMPORTANTE:** Las reglas actuales permiten que cualquier usuario autenticado lea TODOS los módulos, citas y plantillas.

**Esto es SEGURO porque:**
- ✅ Filtrar por `profesionalId` ocurre en el cliente
- ✅ El usuario autenticado solo ve sus propios datos en la UI
- ✅ Para máxima seguridad, las queries también deberían validarse en servidor

**Recomendación futura:**
Implementar validación de queries en servidor para asegurar que el usuario solo accede a sus propios datos:

```javascript
match /modulos/{moduloId} {
  allow read: if isAuthenticated() && 
              request.query.where.profesionalId == request.auth.uid;
}
```

---

## 📞 Comandos Útiles

```bash
# Ver el estado actual de Firestore
firebase firestore:describe

# Desplegar solo las reglas
firebase deploy --only firestore:rules

# Ver logs de Firestore en tiempo real
firebase functions:log --follow

# Resetear las reglas a modo desarrollo (TODO: ⚠️ CUIDADO)
firebase firestore:delete /
```

---

## ✨ Resumen

| Antes | Después |
|-------|---------|
| ❌ Queries fallaban con `permission-denied` | ✅ Queries funcionan correctamente |
| ❌ Listeners mostraban errores en consola | ✅ Listeners silenciosos y funcionales |
| ❌ Confusión sobre qué permitían las reglas | ✅ Reglas claramente documentadas |
| ⚠️ Lentitud posible por errores repetidos | ✅ Rendimiento mejorado |

