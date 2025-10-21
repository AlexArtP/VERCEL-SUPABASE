# 📋 Matriz de Operaciones y Permisos en Firestore

## Resumen Ejecutivo

Las reglas de Firestore permiten todas las operaciones del sistema de forma segura. Esta matriz muestra exactamente qué puede hacer cada rol en cada colección.

## Matriz de Permisos por Rol

| Colección | Anónimo | Usuario | Profesional | Admin | Notas |
|-----------|---------|---------|-------------|-------|-------|
| `config` | ❌ | ✅ R | ✅ R | ✅ RW | Solo lectura para autenticados |
| `usuarios` | ❌ | ✅ R (propio) | ✅ R (propio) | ✅ RW | Cada uno ve su perfil, admin ve todos |
| `registro_solicitudes` | ✅ C | ✅ C | ✅ C | ✅ RWD | Cualquiera puede crear solicitud, admin autoriza |
| `citas` | ❌ | ✅ CUD (propias) | ✅ CUD (propias) | ✅ RWD | Dueños pueden gestionar sus citas |
| `modulos` | ❌ | ✅ R | ✅ R | ✅ RWD | Todos ven módulos, solo admin edita |
| `plantillas` | ❌ | ✅ R | ✅ R | ✅ RWD | Plantillas de citas solo editable por admin |
| `pacientes` | ❌ | ✅ CU (propio) | ✅ CU (propios) | ✅ RWD | Profesionales ven sus pacientes |
| `logs` | ❌ | ❌ | ❌ | ✅ R | Solo admin lee auditoría |

**Leyenda:** R=Read, W=Write, C=Create, U=Update, D=Delete, RW=ReadWrite, RWD=All, ✅=Permitido, ❌=Denegado

## Operaciones por Colección

### 1. `registro_solicitudes` - Flujo de Registro

```
FLUJO COMPLETO:
┌─────────────────────────────────────────────────────────┐
│ 1. Usuario anónimo crea solicitud (POST /api/auth/register) │
│    ✅ PERMITIDO - Cualquiera puede crear solicitud      │
│                                                         │
│ 2. Formulario valida datos del usuario                  │
│    ✅ PERMITIDO - Firestore escribe documento           │
│                                                         │
│ 3. Admin lee solicitudes (GET /api/auth/solicitudes)    │
│    ✅ PERMITIDO - Admin lee la colección               │
│                                                         │
│ 4. Admin aprueba (POST /api/auth/approve)               │
│    ✅ PERMITIDO - Admin actualiza documento            │
│    ✅ PERMITIDO - Se crea documento en 'usuarios'      │
│                                                         │
│ 5. Usuario rechazado puede ver su solicitud             │
│    ✅ PERMITIDO - Ve su propia solicitud               │
│                                                         │
│ 6. Usuario aprobado accede a la app                     │
│    ✅ PERMITIDO - Ya es usuario autenticado            │
└─────────────────────────────────────────────────────────┘
```

### 2. `usuarios` - Perfiles de Usuarios

```
PERMISOS:
- Usuario SOLO VE su propio perfil
  ✅ isOwner(userId) permite lectura
  
- Usuario SOLO EDITA su propio perfil
  ✅ isOwner(userId) permite actualización
  
- Admin VE TODOS los perfiles
  ✅ isAdmin() permite lectura de cualquier usuario
  
- Admin EDITA CUALQUIER perfil (incluyendo rol/esAdmin)
  ✅ isAdmin() permite actualización
```

### 3. `citas` - Agendamientos

```
PERMISOS:
- Profesional crea cita
  ✅ Agrega profesionalId = su UID
  
- Paciente ve cita
  ✅ Lee si pacienteId = su UID
  
- Profesional actualiza cita
  ✅ Actualiza si profesionalId = su UID
  
- Paciente cancela su cita
  ✅ Elimina si pacienteId = su UID
  
- Admin gestiona todas las citas
  ✅ Lee/edita/elimina cualquier cita
```

### 4. `pacientes` - Información de Pacientes

```
PERMISOS:
- Paciente VE su propio perfil
  ✅ isOwner(pacienteId) permite lectura
  
- Paciente EDITA su propio perfil
  ✅ isOwner(pacienteId) permite actualización
  
- Profesional VE sus pacientes
  ✅ Si tiene rol 'profesional' o 'profesional_salud'
  
- Profesional EDITA datos de sus pacientes
  ✅ Para actualizar historial, diagnóstico, etc.
  
- Admin VE/EDITA TODOS los pacientes
  ✅ isAdmin() permite acceso completo
```

## Cambios Implementados Hoy

| Archivo | Cambio | Impacto |
|---------|--------|--------|
| `firestore.rules` | Creado con reglas completas | Activa seguridad en Firestore |
| `firebase.json` | Añadida sección firestore | Facilita despliegue automático |
| `scripts/deploy-firestore-rules.sh` | Script de despliegue | Simplifica publicación de reglas |
| `README/02-FIREBASE-INIT/FIRESTORE_RULES.md` | Documentación | Guía de implementación |

## Próximos Pasos

### 1. **URGENTE - Desplegar Reglas**

```bash
# Opción A: Manual (recomendado primero)
# - Copia firestore.rules
# - Ve a Firebase Console → Firestore → Rules
# - Pega el contenido
# - Click en Publish

# Opción B: Firebase CLI
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

### 2. **Verificar que funciona**

Abre la app en http://localhost:3000 y verifica:

✅ Puedes registrarte sin errores de permisos
✅ El admin ve las solicitudes sin errores
✅ Puedes crear citas sin errores
✅ No hay errores "permission-denied" en consola

### 3. **Monitorear en Firebase Console**

- Ve a **Firestore Database** → **Rules** → **Timeline**
- Verifica que tus cambios aparecen
- Haz clic en historial para ver cuándo se publicaron

## Troubleshooting

### "Error: Permission denied" sigue apareciendo

**Causa:** Las reglas aún no se han publicado o hay caché

**Solución:**
1. Abre consola (F12)
2. Ve a **Application** → **Cache Storage**
3. Limpia todos los caches
4. Recarga la página (Ctrl+F5)
5. Verifica en Firebase Console que las reglas se publicaron

### "Firestore rules are being updated"

**Causa:** Firebase está publicando las reglas (proceso normal)

**Solución:** Espera 1-2 minutos y recarga la app

### Las reglas muestran error de sintaxis

**Causa:** Espacios en blanco o caracteres especiales corruptos

**Solución:**
1. Copia el archivo `firestore.rules` desde este repo
2. No pegues desde editor con formato
3. Verifica que no hay caracteres unicode ocultos

## Conceptos Clave

### Custom Claims (Reclamaciones Personalizadas)

Cuando el admin aprueba un usuario en `/api/auth/approve`, se asignan custom claims:

```typescript
await adminAuth.setCustomUserClaims(userId, {
  isAdmin: habilitarAdmin,
  rol: habilitarAdmin ? 'administrador' : 'usuario',
})
```

Luego, en las reglas de Firestore, se usan así:

```javascript
function isAdmin() {
  return request.auth.token.isAdmin == true || 
         request.auth.token.rol == 'administrador';
}
```

### Ciclo de Verificación

```
1. Usuario intenta operación en Firestore
   ↓
2. Firebase revisa las reglas que aplican
   ↓
3. Evalúa condiciones (isAuthenticated(), isAdmin(), etc.)
   ↓
4. Si cumple → ✅ Operación permitida
   Si no cumple → ❌ Error: permission-denied
```

---

**Ver también:**
- [`firestore.rules`](../../firestore.rules) - Archivo de reglas
- [`FIRESTORE_RULES.md`](./FIRESTORE_RULES.md) - Documentación detallada
- [`ADMIN_SDK_SETUP.md`](./ADMIN_SDK_SETUP.md) - Configuración de Admin SDK
