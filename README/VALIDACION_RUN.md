# 🔐 Validación de RUN y Detección de Duplicados

## Descripción

Se implementó un sistema robusto de validación y detección de duplicados para el campo **RUN** (Rol Único Nacional) en el formulario de registro.

## Características

### ✅ Validación de RUN

1. **Formato Obligatorio**: `xxxxxxxx-x`
   - 8 dígitos numéricos
   - Guion (-)
   - 1 dígito verificador (0-9 o K)
   - Ejemplo: `12345678-9` o `19876543-K`

2. **Formateo Automático**
   - El usuario puede ingresar: `12345678 9`, `123456789`, `12.345.678-9`, etc.
   - El sistema formatea automáticamente a: `12345678-9`
   - Se eliminan espacios, guiones extras y puntos
   - Se convierte a mayúsculas (K → K)

3. **Regla de Importancia**: El RUN NUNCA se debe repetir
   - Es el identificador único de cada persona en Chile
   - Será validado contra:
     - Solicitudes pendientes (tabla `solicitudes`)
     - Usuarios aprobados (tabla `usuarios`)

### 🔍 Detección de Duplicados

Se verifican **dos colecciones** en Firestore:

#### 1. **Solicitudes Pendientes**
```javascript
// Buscar RUN en solicitudes
query(
  collection(db, 'solicitudes'),
  where('run', '==', runFormateado)
)
```
- ❌ Error: "Este RUN ya tiene una solicitud registrada"
- Previene múltiples registros de la misma persona

#### 2. **Usuarios Aprobados**
```javascript
// Buscar RUN en usuarios
query(
  collection(db, 'usuarios'),
  where('run', '==', runFormateado)
)
```
- ❌ Error: "Este RUN ya está registrado en el sistema como usuario activo"
- Previene que alguien se registre si ya es usuario

## Códigos de Error

| Código | Mensaje | Causa |
|--------|---------|-------|
| 400 | "RUN inválido. Debe ser en formato xxxxxxxx-x" | Formato no válido |
| 400 | "Este RUN ya tiene una solicitud registrada" | RUN existe en `solicitudes` |
| 400 | "Este RUN ya está registrado en el sistema como usuario activo" | RUN existe en `usuarios` |

## Flujo de Validación

```
Usuario ingresa RUN
        ↓
¿Está vacío?
├─ Sí → Error: "RUN requerido" (validación frontend)
└─ No ↓
    
Formatear RUN
    ↓
¿Formato válido (xxxxxxxx-x)?
├─ No → ❌ Error 400
└─ Sí ↓

Buscar en "solicitudes"
├─ Existe → ❌ Error 400
└─ No existe ↓

Buscar en "usuarios"
├─ Existe → ❌ Error 400
└─ No existe ↓

✅ Guardar solicitud con RUN formateado
```

## Ejemplos de Entrada y Formateo

| Entrada del Usuario | Formateo | Válido | Notas |
|-------------------|----------|--------|-------|
| `12345678-9` | `12345678-9` | ✅ | Ya formateado |
| `123456789` | `12345678-9` | ✅ | Sin guion |
| `12345678 9` | `12345678-9` | ✅ | Con espacio |
| `12.345.678-9` | `12345678-9` | ✅ | Con puntos |
| `12.345.678-k` | `12345678-K` | ✅ | Letra minúscula |
| `1234567-9` | `null` | ❌ | Solo 7 dígitos |
| `123456789-0` | `null` | ❌ | 9 dígitos antes del guion |
| `12345678-AB` | `null` | ❌ | Dos verificadores |
| `12345678` | `null` | ❌ | Falta verificador |

## Implementación en Frontend

### En el componente de Registro (`RegisterForm.tsx`)

```typescript
// 1. Estado del RUN
const [run, setRun] = useState('')
const [runError, setRunError] = useState('')

// 2. Validación en tiempo real (opcional)
const handleRunChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  let value = e.target.value.toUpperCase()
  
  // Formateo automático
  value = value.replace(/[\s\-\.]/g, '')
  if (value.length > 8) {
    value = value.slice(0, 8) + '-' + value.slice(8, 9)
  }
  
  setRun(value)
}

// 3. Mostrar error si es duplicado
if (error?.includes('RUN')) {
  setRunError(error)
}
```

### En el HTML

```tsx
<input
  type="text"
  placeholder="ej: 12345678-9"
  value={run}
  onChange={handleRunChange}
  maxLength="10"
/>
{runError && <span className="text-red-600">{runError}</span>}
```

## Implementación en Backend

### Archivo: `app/api/auth/register/route.ts`

```typescript
// 1. Función de formateo
function formatearRun(run: string): string | null {
  if (!run) return null
  
  // Remover espacios y guiones
  const runLimpio = run.replace(/[\s\-\.]/g, '').toUpperCase()
  
  // Validar formato: 8 dígitos + 1 carácter
  if (!/^\d{8}[0-9K]$/.test(runLimpio)) {
    return null
  }
  
  // Formatear como xxxxxxxx-x
  return `${runLimpio.slice(0, 8)}-${runLimpio.slice(8, 9)}`
}

// 2. Validación en endpoint
const runFormateado = formatearRun(run)
if (!runFormateado) {
  return NextResponse.json({
    success: false,
    message: 'RUN inválido. Debe ser en formato xxxxxxxx-x'
  }, { status: 400 })
}

// 3. Verificar duplicados en solicitudes
const qRun = query(
  collection(db, 'solicitudes'),
  where('run', '==', runFormateado)
)
const snapshotRun = await getDocs(qRun)
if (!snapshotRun.empty) {
  return NextResponse.json({
    success: false,
    message: 'Este RUN ya tiene una solicitud registrada'
  }, { status: 400 })
}

// 4. Verificar duplicados en usuarios
const qRunUsuarios = query(
  collection(db, 'usuarios'),
  where('run', '==', runFormateado)
)
const snapshotRunUsuarios = await getDocs(qRunUsuarios)
if (!snapshotRunUsuarios.empty) {
  return NextResponse.json({
    success: false,
    message: 'Este RUN ya está registrado en el sistema'
  }, { status: 400 })
}

// 5. Guardar con RUN formateado
const solicitudData = {
  run: runFormateado,  // ✅ Siempre formateado
  // ... otros datos
}
```

## Ventajas

✅ **Formato Consistente**: Todos los RUN en la BD tienen el mismo formato  
✅ **Búsqueda Exacta**: Queries exactas sin preocupación por variantes  
✅ **Usuario-Friendly**: Acepta múltiples formatos de entrada  
✅ **Seguridad**: Evita registros duplicados de la misma persona  
✅ **Auditoría**: Fácil rastrear historiales por RUN uniforme  

## Validación en Firestore Rules (Recomendado)

Para mayor seguridad, agregar validación en las reglas de Firestore:

```firebasestore
match /solicitudes/{doc=**} {
  // Validar formato de RUN
  allow create if 
    request.resource.data.run != null &&
    request.resource.data.run.matches('^\\d{8}-[0-9K]$');
}

match /usuarios/{doc=**} {
  // Validar formato de RUN
  allow create if 
    request.resource.data.run != null &&
    request.resource.data.run.matches('^\\d{8}-[0-9K]$');
}
```

## Pruebas

### Test 1: Formateo Correcto
```bash
POST /api/auth/register
Body: { run: "12345678 9", ... }
Expected: Solicitud guardada con run = "12345678-9"
```

### Test 2: Duplicado en Solicitudes
```bash
POST /api/auth/register
Body: { run: "12345678-9", ... }  # Mismo RUN que antes
Expected: Error 400 - "RUN ya tiene una solicitud"
```

### Test 3: Usuario Aprobado
```bash
POST /api/auth/register
Body: { run: "26858946-5", ... }  # RUN de usuario existente
Expected: Error 400 - "RUN ya está registrado en el sistema"
```

### Test 4: Formato Inválido
```bash
POST /api/auth/register
Body: { run: "1234567-X", ... }  # Muy pocos dígitos
Expected: Error 400 - "RUN inválido"
```

## Logs en Consola

```
🔍 Validando RUN: 12345678 9
✅ RUN formateado: 12345678-9
🔍 Verificando si RUN ya existe en solicitudes...
🔍 Verificando si RUN ya existe en usuarios aprobados...
💾 Guardando solicitud en Firestore...
✅ Solicitud guardada exitosamente
```

## Próximos Pasos (Opcional)

1. **Validación de Dígito Verificador**
   - Implementar el algoritmo real de validación de dígito verificador chileno
   - Rechazar RUN con verificador incorrecto

2. **Caché de RUN Duplicados**
   - Para aplicaciones con alto volumen
   - Reducir queries a Firestore

3. **Historial de Cambios**
   - Registrar cambios de RUN (en caso de correcciones)
   - Auditoría completa

4. **Sincronización con Sistema Externo**
   - Validar RUN contra Registro Civil
   - Verificar identidad en tiempo real

---

**Versión**: 1.0.0  
**Fecha**: Octubre 2025  
**Estado**: ✅ Completado y Verificado
