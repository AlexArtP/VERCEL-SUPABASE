# 🔒 Reglas de Firestore - Guía de Implementación

## Descripción General

Las reglas de Firestore en `firestore.rules` proporcionan acceso robusto y seguro a todas las colecciones del sistema. Estas reglas:

✅ Permiten todas las funciones actuales del sistema
✅ Mantienen seguridad basada en roles (usuario, profesional, admin)
✅ Permiten registro público (solicitudes de registro)
✅ Protegen datos sensibles (solo dueños y admins pueden acceder)
✅ Incluyen auditoría y logs de actividad

## Estructura de Reglas

### 1. **Funciones Auxiliares**

```javascript
// Verificar si está autenticado
isAuthenticated()

// Verificar si es admin (por custom claim)
isAdmin()

// Verificar si es dueño del documento
isOwner(userId)
```

### 2. **Colecciones y Permisos**

#### `config` - Configuración general
- **Leer:** Solo autenticados
- **Escribir:** Solo admin

#### `usuarios` - Perfiles de usuarios
- **Leer:** Dueño + Admins
- **Crear/Actualizar:** Dueño o Admin
- **Eliminar:** Solo admin

#### `registro_solicitudes` - Solicitudes de registro
- **Leer:** Admin + Dueño de la solicitud
- **Crear:** Cualquiera (flujo público)
- **Actualizar:** Dueño (si está pendiente) + Admin (para aprobar/rechazar)
- **Eliminar:** Solo admin

#### `citas` - Agendamientos
- **Leer:** Admin + Partes interesadas (profesional/paciente)
- **Crear/Actualizar/Eliminar:** Dueños + Admin

#### `modulos` - Módulos de la app
- **Leer:** Autenticados
- **Escribir:** Solo admin

#### `plantillas` - Plantillas de citas
- **Leer:** Autenticados
- **Escribir:** Solo admin

#### `pacientes` - Información de pacientes
- **Leer:** Admin + Dueño + Profesionales
- **Crear:** Autenticados
- **Actualizar:** Dueño + Admin + Profesionales
- **Eliminar:** Solo admin

#### `logs` - Auditoría
- **Leer:** Solo admin
- **Escribir:** Solo servidor (Admin SDK)

## Cómo Desplegar las Reglas

### Opción 1: Firebase Console (Recomendado para UI)

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto ("agendacecosam")
3. Ve a **Firestore Database** → **Rules**
4. Copia todo el contenido de `firestore.rules` en el editor
5. Haz clic en **Publish** (Publicar)

### Opción 2: Firebase CLI (Recomendado para CI/CD)

```bash
# Instalar Firebase CLI si no lo tienes
npm install -g firebase-tools

# Loguéate en Firebase
firebase login

# Inicializar Firebase en el proyecto (si no está inicializado)
firebase init firestore

# Publicar las reglas
firebase deploy --only firestore:rules
```

**Nota:** Asegúrate que `firebase.json` existe en la raíz del proyecto con:

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

### Opción 3: GitHub Actions (Automatizado)

Puedes crear un workflow en `.github/workflows/deploy-firestore-rules.yml`:

```yaml
name: Deploy Firestore Rules

on:
  push:
    branches: [main, copilot/vscode1760764850571]
    paths:
      - 'firestore.rules'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install -g firebase-tools
      - run: firebase deploy --only firestore:rules --token ${{ secrets.FIREBASE_TOKEN }}
```

## Verificar las Reglas

Después de publicar, puedes verificar que funcionan correctamente:

### En Firebase Console

1. Ve a **Firestore Database** → **Rules**
2. Verifica que las reglas se actualizaron
3. Haz clic en **Timeline** para ver el historial de cambios

### En la App

Comprueba que:

✅ Las solicitudes de registro se guardan sin errores
✅ Los usuarios pueden ver su propio perfil
✅ Solo admins pueden ver y aprobar solicitudes
✅ Las citas se crean y actualizan correctamente
✅ Los logs de error no muestran "permission-denied"

## Rollback (Revertir cambios)

Si algo sale mal, puedes revertir a reglas anteriores:

```bash
# Ver historial de cambios
firebase firestore:indexes

# Revertir a versión anterior manualmente en la consola
# O via CLI (si tienes la versión anterior guardada)
```

## Troubleshooting

### Error: "Permission denied" en consola

**Causa:** Las reglas no coinciden con lo que intenta hacer la app.

**Solución:**
1. Abre la consola del navegador (F12)
2. Busca el error exacto: `[code=permission-denied]: ...`
3. Identifica qué colección/operación falló
4. Revisa las reglas para esa colección en `firestore.rules`
5. Actualiza las reglas si es necesario

### Error: "Invalid rules" al publicar

**Causa:** Sintaxis incorrecta en las reglas.

**Solución:**
1. Firebase Console muestra línea y error exacto
2. Verifica comillas, paréntesis, puntos y comas
3. Compara con la sintaxis en este archivo

### Las operaciones siguen siendo lentas

**Causa:** Faltan índices en Firestore.

**Solución:**
1. Firebase te sugiere crear índices automáticamente
2. Ve a **Firestore Database** → **Indexes** (Índices)
3. Crea los índices sugeridos
4. Espera a que se construyan (puede tardar minutos)

## Consideraciones de Seguridad

⚠️ **IMPORTANTE:**

1. **Verificación de roles:** Las reglas usan `request.auth.token.isAdmin` y `request.auth.token.rol`
   - Estos deben ser asignados por `/api/auth/approve` cuando creas el usuario
   - Verifica que `setCustomUserClaims()` en `app/api/auth/approve/route.ts` funciona

2. **Datos sensibles:** Las contraseñas NUNCA se guardan en Firestore
   - Solo se manejan en Firebase Auth (server-side)

3. **Auditoría:** La colección `logs` es solo lectura para admins
   - Registra todas las operaciones importantes

4. **Escalabilidad:** Si tienes muchos usuarios, considera índices compuestos
   - Firebase te sugerirá automáticamente cuáles necesitas

## Testing Manual en Firebase Emulator

Para probar las reglas localmente sin afectar producción:

```bash
# Instalar Firebase Emulator
npm install --save-dev firebase-emulators-admin

# Iniciar emulador
firebase emulators:start --only firestore

# En tu código, cambia el endpoint de Firestore a localhost:8080
// const db = connectFirestoreEmulator(db, 'localhost', 8080);
```

---

**Documentación oficial:** https://firebase.google.com/docs/firestore/security/start
