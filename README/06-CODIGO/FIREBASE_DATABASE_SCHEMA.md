# 📊 ESTRUCTURA DE BASE DE DATOS - FIREBASE INIT

**Visualización de colecciones, documentos y relaciones**

---

## 🏗️ ESTRUCTURA GENERAL

```
Firestore Database
│
├── users/ (Collection)
│   ├── usuario-1 (Document)
│   ├── usuario-2 (Document)
│   ├── usuario-3 (Document)
│   ├── usuario-4 (Document)
│   └── usuario-5 (Document)
│
├── pacientes/ (Collection)
│   ├── paciente-1 (Document)
│   ├── paciente-2 (Document)
│   └── paciente-3 (Document)
│
├── plantillas/ (Collection)
│   ├── plantilla-1 (Document)
│   ├── plantilla-2 (Document)
│   ├── plantilla-3 (Document)
│   └── plantilla-4 (Document)
│
├── modulos/ (Collection)
│   ├── modulo-1 (Document)
│   ├── modulo-2 (Document)
│   ├── modulo-3 (Document)
│   ├── modulo-4 (Document)
│   └── modulo-5 (Document)
│
├── citas/ (Collection)
│   ├── cita-1 (Document)
│   ├── cita-2 (Document)
│   ├── cita-3 (Document)
│   └── cita-4 (Document)
│
└── config/ (Collection)
    └── initialized (Document)


Firebase Authentication
│
├── usuario-1: juan.perez@clinica.cl
├── usuario-2: maria.silva@clinica.cl
├── usuario-3: carlos.ramirez@clinica.cl
├── usuario-4: ana.morales@clinica.cl
└── usuario-5: luis.fernandez@clinica.cl
```

---

## 📋 DETALLE DE COLECCIONES

### 1️⃣ USERS / - Usuarios del Sistema

```json
{
  "usuario-1": {
    "id": 1,
    "nombre": "Dr. Juan",
    "apellidos": "Pérez González",
    "run": "12.345.678-9",
    "profesion": "Médico General",
    "telefono": "+56 9 1234 5678",
    "email": "juan.perez@clinica.cl",
    "cargo": "Director Médico del Departamento...",
    "description": "Profesional con amplia experiencia...",
    "avatar": "",
    "specialties": ["Medicina Interna", "Urgencias"],
    "workingHours": {
      "start": "08:30",
      "end": "17:30"
    },
    "preferences": {
      "theme": "light",
      "primaryColor": "#3B82F6",
      "language": "es"
    },
    "isPublic": true,
    "rol": "profesional",        // IMPORTANTE: profesional | administrativo
    "esAdmin": true,            // IMPORTANTE: true | false
    "activo": true,
    "uid": "usuario-1",         // ID de Firebase Auth
    "createdAt": "2025-10-18T10:30:00.000Z",
    "updatedAt": "2025-10-18T10:30:00.000Z"
  }
}
```

**Registros:**
```
usuario-1: Dr. Juan Pérez (admin, profesional)
usuario-2: Dra. María Silva (profesional)
usuario-3: Carlos Ramírez (admin, administrativo)
usuario-4: Dra. Ana Morales (profesional, inactivo)
usuario-5: Luis Fernández (administrativo)
```

**Índices necesarios:**
```
- email (para búsquedas rápidas)
- rol (para filtrar por tipo)
- esAdmin (para rutas protegidas)
- activo (para no mostrar usuarios inactivos)
```

---

### 2️⃣ PACIENTES / - Pacientes

```json
{
  "paciente-1": {
    "id": 1,
    "nombre": "Pedro Sánchez",
    "run": "17.890.123-4",
    "telefono": "+56 9 6789 0123",
    "email": "pedro.sanchez@email.cl",
    "fechaNacimiento": "1985-03-15",
    "ultimaVisita": "2024-01-10",
    "activo": true,
    "createdAt": "2025-10-18T10:30:00.000Z",
    "updatedAt": "2025-10-18T10:30:00.000Z"
  }
}
```

**Registros:**
```
paciente-1: Pedro Sánchez (1985-03-15)
paciente-2: Laura Martínez (1990-07-22)
paciente-3: Roberto Gutiérrez (1978-11-30)
```

**Índices necesarios:**
```
- run (búsqueda por identificación)
- email (búsqueda por correo)
- ultimaVisita (ordenar por más recientes)
```

---

### 3️⃣ PLANTILLAS / - Templates de Módulos

```json
{
  "plantilla-1": {
    "id": 1,
    "profesionalId": 1,        // FK a users.usuario-1
    "tipo": "Consulta General",
    "duracion": 45,            // minutos
    "estamento": "Médico General",
    "color": "#3b82f6",
    "observaciones": "Consulta médica general sin especialidad",
    "createdAt": "2025-10-18T10:30:00.000Z",
    "updatedAt": "2025-10-18T10:30:00.000Z"
  }
}
```

**Registros:**
```
plantilla-1: Consulta General (45 min) - Dr. Juan
plantilla-2: Cardiología (60 min) - Dra. María
plantilla-3: Control (30 min) - Dr. Juan
plantilla-4: Ingreso (120 min) - Dr. Juan
```

**Relación:** Cada plantilla pertenece a UN profesional

**Índices necesarios:**
```
- profesionalId (obtener templates de un profesional)
- tipo (búsqueda por tipo)
```

---

### 4️⃣ MODULOS / - Slots del Calendario

```json
{
  "modulo-1": {
    "id": 1,
    "plantillaId": 1,          // FK a plantillas.plantilla-1
    "profesionalId": 1,        // FK a users.usuario-1
    "profesionalNombre": "Dr. Juan Pérez",
    "fecha": "2025-10-18",     // ISO string
    "horaInicio": "09:00",     // HH:MM
    "horaFin": "09:45",        // HH:MM
    "duracion": 45,            // minutos
    "tipo": "Consulta General",
    "disponible": true,        // true = sin paciente, false = ocupado
    "color": "#3b82f6",
    "estamento": "Médico General",
    "observaciones": "Consulta médica general sin especialidad",
    "pacienteId": null,        // null = disponible, ID = asignado
    "createdAt": "2025-10-18T10:30:00.000Z",
    "updatedAt": "2025-10-18T10:30:00.000Z"
  }
}
```

**Registros:**
```
modulo-1: Consulta General - 09:00-09:45 (disponible)
modulo-2: Consulta General - 10:00-10:45 (disponible)
modulo-3: Cardiología - 10:00-11:00 (NO disponible - ocupado)
modulo-4: Control - 14:00-14:30 (NO disponible - ocupado)
modulo-5: Control - 14:30-15:00 (disponible)
```

**Relaciones:**
```
modulo → plantilla (template reference)
modulo → profesional (asignación)
modulo → paciente (opcional, si está ocupado)
```

**Índices necesarios:**
```
- profesionalId (obtener módulos de un profesional)
- fecha (obtener módulos de una fecha)
- disponible (filtrar disponibles vs ocupados)
- pacienteId (buscar módulo por paciente)
```

**Query ejemplo:**
```typescript
// Obtener módulos disponibles de mañana
const q = query(
  collection(db, 'modulos'),
  where('profesionalId', '==', 1),
  where('fecha', '==', '2025-10-19'),
  where('disponible', '==', true)
)
```

---

### 5️⃣ CITAS / - Citas Agendadas

```json
{
  "cita-1": {
    "id": 1,
    "pacienteId": 1,           // FK a pacientes.paciente-1
    "pacienteNombre": "Pedro Sánchez",
    "profesionalId": 1,        // FK a users.usuario-1
    "profesionalNombre": "Dr. Juan Pérez",
    "fecha": "2025-10-18",     // ISO string
    "hora": "09:00",           // HH:MM
    "tipo": "Consulta General",
    "estado": "confirmada",    // confirmada | pendiente | cancelada
    "moduloId": null,          // FK opcional a modulos.modulo-1
    "esSobrecupo": false,
    "observacion": "Paciente con alergias conocidas",
    "originalModuloColor": "#3b82f6",
    "createdAt": "2025-10-18T10:30:00.000Z",
    "updatedAt": "2025-10-18T10:30:00.000Z"
  }
}
```

**Registros:**
```
cita-1: Pedro Sánchez con Dr. Juan - 09:00 (confirmada)
cita-2: Laura Martínez con Dra. María - 10:30 (confirmada)
cita-3: Roberto Gutiérrez con Dr. Juan - 14:00 (pendiente)
cita-4: Pedro Sánchez con Dra. Ana - 11:00 (confirmada)
```

**Estados:**
```
confirmada = Cita lista, paciente notificado
pendiente = Espera confirmación
cancelada = Cita cancelada, no mostrar
```

**Relaciones:**
```
cita → paciente (quién se cita)
cita → profesional (con quién)
cita → módulo (slot si está en calendario, opcional si es sobrecupo)
```

**Índices necesarios:**
```
- pacienteId (citas de un paciente)
- profesionalId (citas de un profesional)
- fecha (citas por fecha)
- estado (filtrar por estado)
```

**Query ejemplo:**
```typescript
// Obtener citas de un paciente para hoy
const q = query(
  collection(db, 'citas'),
  where('pacienteId', '==', 1),
  where('fecha', '==', '2025-10-18'),
  where('estado', 'in', ['confirmada', 'pendiente'])
)
```

---

### 6️⃣ CONFIG / - Metadatos

```json
{
  "initialized": {
    "type": "initialized",
    "fecha": "2025-10-18T10:30:00.000Z",
    "version": "1.0"
  }
}
```

**Propósito:** Marca que la inicialización ya se ejecutó

**Verificación:**
```typescript
const docSnap = await getDocs(
  query(collection(db, 'config'), where('type', '==', 'initialized'))
)
if (!docSnap.empty) {
  console.log('Base de datos ya inicializada')
}
```

---

## 🔗 DIAGRAMA DE RELACIONES

```
                    ┌──────────────┐
                    │    users     │
                    └──────────────┘
                      ▲    ▲    ▲
                      │    │    │
          ┌───────────┼────┼────┼───────────┐
          │           │    │    │           │
          │           │    │    │           │
    ┌─────┴────┐ ┌────┴───┐│ ┌──┴────┐ ┌──┴────┐
    │plantillas│ │modulos │└──│citas  │ │  ?    │
    └──────────┘ └────┬───┘   └───────┘ └───────┘
                      │
                      │ pacienteId
                      └──► pacientes

Leyenda:
─→  Foreign Key (referencia)
     
Ejemplos:
├─ plantillas.profesionalId → users.id
├─ modulos.plantillaId → plantillas.id
├─ modulos.profesionalId → users.id
├─ modulos.pacienteId → pacientes.id (opcional)
├─ citas.pacienteId → pacientes.id
├─ citas.profesionalId → users.id
└─ citas.moduloId → modulos.id (opcional)
```

---

## 📈 ESTADÍSTICAS

| Colección | Documentos | Campos | Tamaño estimado |
|-----------|-----------|--------|-----------------|
| users | 5 | ~15 | ~15 KB |
| pacientes | 3 | ~7 | ~3 KB |
| plantillas | 4 | ~7 | ~2 KB |
| modulos | 5 | ~14 | ~10 KB |
| citas | 4 | ~12 | ~5 KB |
| config | 1 | ~3 | ~1 KB |
| **TOTAL** | **22** | - | **~36 KB** |

**Costos Firebase (aproximado):**
- Lectura: 22 documentos = 22 lecturas
- Escritura: Primera vez = 22 escrituras
- Almacenamiento: ~36 KB
- **Tier gratuito: SUFICIENTE** ✓

---

## 🔍 QUERIES COMUNES

### Obtener módulos disponibles de un profesional

```typescript
const q = query(
  collection(db, 'modulos'),
  where('profesionalId', '==', 1),
  where('disponible', '==', true),
  orderBy('fecha', 'asc'),
  orderBy('horaInicio', 'asc')
)

const snapshot = await getDocs(q)
const modulos = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}))
```

### Obtener citas de un paciente

```typescript
const q = query(
  collection(db, 'citas'),
  where('pacienteId', '==', 1),
  where('estado', 'in', ['confirmada', 'pendiente']),
  orderBy('fecha', 'desc')
)

const snapshot = await getDocs(q)
```

### Obtener plantillas de un profesional

```typescript
const q = query(
  collection(db, 'plantillas'),
  where('profesionalId', '==', 1)
)

const snapshot = await getDocs(q)
```

### Obtener módulos ocupados

```typescript
const q = query(
  collection(db, 'modulos'),
  where('disponible', '==', false),
  where('profesionalId', '==', 1)
)

const snapshot = await getDocs(q)
```

---

## 🚨 CUIDADOS IMPORTANTES

### 1. Mantener consistencia

```
Si eliminas un usuario:
└─ ¿Qué pasa con sus módulos?
└─ ¿Qué pasa con sus citas?

RECOMENDACIÓN: No eliminar, solo marcar como inactivo
```

### 2. Validar Foreign Keys

```typescript
// Cuando creas una cita, valida:
const paciente = await getDoc(doc(db, 'pacientes', pacienteId))
if (!paciente.exists()) {
  throw new Error('Paciente no existe')
}

const profesional = await getDoc(doc(db, 'users', profesionalId))
if (!profesional.exists()) {
  throw new Error('Profesional no existe')
}
```

### 3. Sincronizar datos denormalizados

```typescript
// Cuando cambias nombre del profesional:
// Actualizar en 3 lugares:
├─ users/usuario-1 (nombre)
├─ modulos/* (profesionalNombre)
└─ citas/* (profesionalNombre)
```

---

## 📝 NOTAS

- **Documentos sin subcollections:** Diseño plano para queries simples
- **Denormalización:** Algunos datos se repiten (nombre profesional) para no hacer muchas queries
- **Timestamps:** Todos tienen `createdAt` y `updatedAt` para auditoría
- **IDs predictibles:** Usamos `documento-{numero}` en lugar de IDs aleatorios para claridad

---

**Próximo paso:** Obtener credenciales Firebase y ejecutar `firebase-init`
