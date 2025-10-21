# 🚀 CALENDARIO INTEGRADO CON PROFESIONALES DE FIRESTORE

## ✅ Lo Que Se Ha Hecho

### 1. **Hook: `useFirestoreProfesionales`**
Obtiene en tiempo real de Firestore:
- ✅ Todos los usuarios con `rol: "profesional"`
- ✅ Que están `activo: true`
- ✅ Ordenados alfabéticamente por nombre
- ✅ Con sincronización en tiempo real via `onSnapshot`

```typescript
const { profesionales, loading, error } = useFirestoreProfesionales()
// profesionales: Profesional[]
// - id, email, nombre, apellidoPaterno, apellidoMaterno, profesion, etc.
```

### 2. **Hook: `useFirestoreCitas`**
Obtiene en tiempo real las citas de un profesional:
- ✅ Todas las citas donde `profesionalId === selectedProfesionalId`
- ✅ Sincronización en tiempo real
- ✅ Soporte para CRUD (crear, actualizar, eliminar)

```typescript
const { citas, loading, error } = useFirestoreCitas(profesionalId)
// citas: Cita[]
// - id, profesionalId, pacienteNombre, fecha, horaInicio, horaFin, estado
```

### 3. **Componente: `CalendarViewV2`**
Nuevo calendario que:
- ✅ Muestra dropdown con profesionales de Firestore
- ✅ Carga citas del profesional seleccionado
- ✅ Muestra calendario con FullCalendar
- ✅ Color código por estado (confirmada, pendiente, cancelada)
- ✅ Estadísticas de citas
- ✅ Información del profesional seleccionado

---

## 📊 Arquitectura

```
┌─────────────────────────────────────────────────────┐
│         MainApp.tsx (componente principal)          │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│      CalendarViewV2 (nuevo componente)              │
│  ┌───────────────────────────────────────────────┐  │
│  │ 1. Obtener profesionales de Firestore        │  │
│  │    useFirestoreProfesionales()                │  │
│  │                                               │  │
│  │ 2. Mostrar dropdown con profesionales        │  │
│  │    <select> con lista de profesionales       │  │
│  │                                               │  │
│  │ 3. Al seleccionar, obtener citas             │  │
│  │    useFirestoreCitas(selectedProfesionalId)  │  │
│  │                                               │  │
│  │ 4. Convertir citas a eventos de calendario   │  │
│  │    citas → eventos FullCalendar              │  │
│  │                                               │  │
│  │ 5. Renderizar calendario con citas           │  │
│  │    <FullCalendar events={events} />          │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
         ┌──────────────────────────────┐
         │   Firestore Database         │
         │  ┌────────────────────────┐  │
         │  │ Colección: usuarios    │  │
         │  │ - rol: "profesional"   │  │
         │  │ - activo: true         │  │
         │  └────────────────────────┘  │
         │  ┌────────────────────────┐  │
         │  │ Colección: citas       │  │
         │  │ - profesionalId        │  │
         │  │ - pacienteNombre       │  │
         │  │ - fecha, horaInicio    │  │
         │  │ - estado               │  │
         │  └────────────────────────┘  │
         └──────────────────────────────┘
```

---

## 🔧 Estructura de Datos

### Colección: `usuarios`
```typescript
{
  id: "GfxIulCeHjh3EapnLJi5mLBmh582",
  email: "medico@example.com",
  nombre: "Juan",
  apellidoPaterno: "García",
  apellidoMaterno: "López",
  rol: "profesional",
  profesion: "Médico General",
  telefono: "9123456789",
  esAdmin: false,
  activo: true,
  avatar: "https://..."
}
```

### Colección: `citas`
```typescript
{
  id: "cita-001",
  profesionalId: "GfxIulCeHjh3EapnLJi5mLBmh582",
  pacienteId: "paciente-123",
  pacienteNombre: "Carlos Martínez",
  fecha: "2025-10-20",
  horaInicio: "09:00",
  horaFin: "09:30",
  tipo: "Consulta",
  estado: "confirmada",
  notas: "Revisión de presión arterial",
  esOverbooking: false
}
```

---

## 🎨 Características de CalendarViewV2

### 1. **Selector de Profesional**
- Dropdown con lista de profesionales activos
- Muestra: nombre, apellidos, profesión
- Estado de carga mientras se obtienen profesionales
- Mensaje si no hay profesionales disponibles

### 2. **Panel de Información**
- Datos del profesional seleccionado
- Profesión, email, teléfono
- Diseño visual atractivo

### 3. **Calendario**
- Vista por semana (predeterminada)
- Permite cambiar a mes o día
- Colores por estado:
  - 🟢 Verde: Confirmada
  - 🟡 Amarillo: Pendiente
  - 🔴 Rojo: Cancelada

### 4. **Estadísticas**
- Contador de citas confirmadas, pendientes, canceladas
- Se actualiza en tiempo real

### 5. **Manejo de Errores**
- Muestra mensaje si falla cargar profesionales
- Muestra mensaje si falla cargar citas
- Estado de carga claro

---

## 📱 Cómo Usarlo

### En MainApp.tsx
```typescript
import { CalendarViewV2 } from "@/components/CalendarViewV2"

export function MainApp() {
  return (
    <div>
      {/* ... otras vistas ... */}
      {activeView === "calendar" && <CalendarViewV2 />}
    </div>
  )
}
```

---

## 🚀 Próximas Mejoras

1. **Crear citas desde el calendario**
   - Click en slot → abrir modal
   - Seleccionar paciente
   - Guardar en Firestore

2. **Editar citas**
   - Click en cita → abrir modal
   - Cambiar hora, estado, notas
   - Actualizar en Firestore

3. **Eliminar citas**
   - Botón derecho o ícono
   - Confirmación
   - Eliminar de Firestore

4. **Sincronización de módulos**
   - Obtener módulos disponibles
   - Mostrar en calendario
   - Mezclar con citas

5. **Notificaciones**
   - Alertas cuando se crea/modifica cita
   - Push notifications
   - Email notificaciones

6. **Exportar agenda**
   - Descargar como PDF, Excel
   - Enviar por email
   - Compartir con pacientes

---

## 🔒 Seguridad en Firestore

Reglas ya configuradas:

```firestore
match /citas/{citaId} {
  // Leer: usuarios autenticados
  allow read: if isAuthenticated();
  
  // Crear: usuarios autenticados
  allow create: if isAuthenticated();
  
  // Actualizar: profesional, paciente, o admin
  allow update: if isAdminFromFirestore() ||
                   (isAuthenticated() &&
                    (request.auth.uid == resource.data.profesionalId ||
                     request.auth.uid == resource.data.pacienteId));
  
  // Eliminar: solo admin
  allow delete: if isAdminFromFirestore();
}
```

---

## ✅ Checklist de Implementación

- ✅ Hook `useFirestoreProfesionales` - obtiene profesionales
- ✅ Hook `useFirestoreCitas` - obtiene citas
- ✅ Componente `CalendarViewV2` - UI del calendario
- ✅ Dropdown de profesionales
- ✅ Sincronización en tiempo real
- ✅ Color código por estado
- ✅ Estadísticas
- ✅ Manejo de errores
- ✅ Compilación sin errores
- ⏳ Integración en MainApp (próximo paso)
- ⏳ Crear/editar citas desde calendario
- ⏳ Módulos integrados

---

## 📝 Notas

1. **Datos en Firestore**: Asegúrate que haya:
   - Usuarios con `rol: "profesional"`
   - Citas con `profesionalId` válido

2. **Autenticación**: Usuario debe estar autenticado para ver citas

3. **Permisos**: Solo admin puede eliminar citas; profesional/paciente solo suyo

4. **Sincronización**: Los cambios en Firestore se reflejan automáticamente

---

## 📂 Archivos Creados

| Archivo | Propósito |
|---------|-----------|
| `lib/useFirestoreProfesionales.ts` | Hook para obtener profesionales |
| `lib/useFirestoreCitas.ts` | Hook para obtener citas |
| `components/CalendarViewV2.tsx` | Nuevo componente de calendario |

---

**¿Necesitas ayuda para integrar esto en MainApp?** 🚀
