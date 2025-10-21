# Configuración de Sincronización en Tiempo Real

## 📋 Resumen
Para que cambios en módulos y citas se reflejen **en tiempo real** entre usuarios (diferentes sesiones), necesitas:

1. **Backend con Firestore listeners** (lecturas reactivas)
2. **Actualización de estado global** (Context/Zustand)
3. **Listeners en componentes clave** (CalendarView, MainApp)
4. **Autosave en operaciones** (crear, editar, eliminar)

---

## 🏗️ Arquitectura Propuesta

```
Usuario A (Sesión 1)          Usuario B (Sesión 2)
     ↓                               ↓
  React App                      React App
     ↓                               ↓
useDataContext()              useDataContext()
     ↓                               ↓
  ┌─────────────────────────────────────┐
  │     Firebase Realtime Updates       │
  │  (onSnapshot listeners en Firestore)│
  └─────────────────────────────────────┘
     ↓                               ↓
CalendarView actualiza         CalendarView actualiza
  en tiempo real                 en tiempo real
```

---

## 🔧 Pasos de Implementación

### 1️⃣ Instalar Firebase Admin SDK y actualizaciones

Tu `package.json` ya tiene Firebase. Verifica que tengas:
```json
{
  "dependencies": {
    "firebase": "^11.0.0",  // ✅ Ya está
    "firebase-admin": "^12.0.0"  // Para backend (opcional)
  }
}
```

### 2️⃣ Crear servicio Firebase con Firestore Listeners

**Archivo: `lib/firebaseConfig.ts`** (CREAR)
```typescript
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, onSnapshot, query, where } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// Listeners para sincronización en tiempo real
export function setupModulosListener(
  profesionalId: number,
  callback: (modulos: any[]) => void
) {
  const q = query(
    collection(db, 'modulos'),
    where('profesionalId', '==', profesionalId)
  )
  
  return onSnapshot(q, (snapshot) => {
    const modulos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(modulos)
  })
}

export function setupCitasListener(
  profesionalId: number,
  callback: (citas: any[]) => void
) {
  const q = query(
    collection(db, 'citas'),
    where('profesionalId', '==', profesionalId)
  )
  
  return onSnapshot(q, (snapshot) => {
    const citas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(citas)
  })
}

export function setupPlantillasListener(
  profesionalId: number,
  callback: (plantillas: any[]) => void
) {
  const q = query(
    collection(db, 'plantillas'),
    where('profesionalId', '==', profesionalId)
  )
  
  return onSnapshot(q, (snapshot) => {
    const plantillas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(plantillas)
  })
}
```

### 3️⃣ Crear Context Global para Datos Sincronizados

**Archivo: `contexts/DataContext.tsx`** (CREAR)
```typescript
'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Modulo, Cita, PlantillaModulo } from '@/lib/demoData'
import {
  setupModulosListener,
  setupCitasListener,
  setupPlantillasListener,
  db
} from '@/lib/firebaseConfig'
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'

interface DataContextType {
  modulos: Modulo[]
  citas: Cita[]
  plantillas: PlantillaModulo[]
  loading: boolean
  error: string | null
  addModulo: (modulo: Omit<Modulo, 'id'>) => Promise<void>
  updateModulo: (id: number, updates: Partial<Modulo>) => Promise<void>
  deleteModulo: (id: number) => Promise<void>
  addCita: (cita: Omit<Cita, 'id'>) => Promise<void>
  updateCita: (id: number, updates: Partial<Cita>) => Promise<void>
  deleteCita: (id: number) => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children, profesionalId }: { children: React.ReactNode; profesionalId: number }) {
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [citas, setCitas] = useState<Cita[]>([])
  const [plantillas, setPlantillas] = useState<PlantillaModulo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Listeners en tiempo real
  useEffect(() => {
    setLoading(true)
    const unsubModulos = setupModulosListener(profesionalId, setModulos)
    const unsubCitas = setupCitasListener(profesionalId, setCitas)
    const unsubPlantillas = setupPlantillasListener(profesionalId, setPlantillas)

    return () => {
      unsubModulos()
      unsubCitas()
      unsubPlantillas()
    }
  }, [profesionalId])

  // Funciones CRUD con autosave a Firestore
  const addModulo = useCallback(async (modulo: Omit<Modulo, 'id'>) => {
    try {
      await addDoc(collection(db, 'modulos'), {
        ...modulo,
        createdAt: new Date(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear módulo')
      throw err
    }
  }, [])

  const updateModulo = useCallback(async (id: number, updates: Partial<Modulo>) => {
    try {
      const docRef = doc(db, 'modulos', id.toString())
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar módulo')
      throw err
    }
  }, [])

  const deleteModulo = useCallback(async (id: number) => {
    try {
      await deleteDoc(doc(db, 'modulos', id.toString()))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar módulo')
      throw err
    }
  }, [])

  const addCita = useCallback(async (cita: Omit<Cita, 'id'>) => {
    try {
      await addDoc(collection(db, 'citas'), {
        ...cita,
        createdAt: new Date(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear cita')
      throw err
    }
  }, [])

  const updateCita = useCallback(async (id: number, updates: Partial<Cita>) => {
    try {
      const docRef = doc(db, 'citas', id.toString())
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar cita')
      throw err
    }
  }, [])

  const deleteCita = useCallback(async (id: number) => {
    try {
      await deleteDoc(doc(db, 'citas', id.toString()))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar cita')
      throw err
    }
  }, [])

  return (
    <DataContext.Provider
      value={{
        modulos,
        citas,
        plantillas,
        loading,
        error,
        addModulo,
        updateModulo,
        deleteModulo,
        addCita,
        updateCita,
        deleteCita,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData debe usarse dentro de DataProvider')
  }
  return context
}
```

### 4️⃣ Envolvimiento de Componentes con Provider

**Archivo: `app/layout.tsx`** (MODIFICAR)
```typescript
import { DataProvider } from '@/contexts/DataContext'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const profesionalId = 1 // Obtener del usuario autenticado
  
  return (
    <html>
      <body>
        <DataProvider profesionalId={profesionalId}>
          {children}
        </DataProvider>
      </body>
    </html>
  )
}
```

### 5️⃣ Usar en CalendarView

**Archivo: `components/CalendarView.tsx`** (MODIFICAR)
```typescript
import { useData } from '@/contexts/DataContext'

export function CalendarView() {
  const { modulos, citas, addModulo, updateModulo, deleteModulo, addCita } = useData()
  
  // Ahora modulos y citas se actualizan automáticamente
  // y los cambios de otros usuarios aparecen en tiempo real
  
  return (
    <FullCalendar
      events={[
        ...modulos.map(m => ({
          id: m.id.toString(),
          title: m.tipo,
          start: `${m.fecha}T${m.horaInicio}`,
          end: `${m.fecha}T${m.horaFin}`,
          backgroundColor: m.color,
        })),
        ...citas.map(c => ({
          id: c.id.toString(),
          title: `${c.tipo} - ${c.pacienteNombre}`,
          start: `${c.fecha}T${c.hora}`,
        })),
      ]}
    />
  )
}
```

---

## ⚙️ Configuración de Variables de Entorno

**Archivo: `.env.local`** (CREAR)
```
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

---

## 🗄️ Estructura Firestore Recomendada

```
firestore/
├── modulos/
│   ├── modulo_1
│   │   ├── id: 1
│   │   ├── plantillaId: 1
│   │   ├── profesionalId: 1
│   │   ├── fecha: "2025-01-15"
│   │   ├── horaInicio: "09:00"
│   │   ├── horaFin: "09:45"
│   │   ├── tipo: "Consulta General"
│   │   ├── color: "#3b82f6"
│   │   └── createdAt: timestamp
│   └── modulo_2
│       └── ...
│
├── citas/
│   ├── cita_1
│   │   ├── id: 1
│   │   ├── pacienteId: 1
│   │   ├── profesionalId: 1
│   │   ├── fecha: "2025-01-15"
│   │   ├── hora: "09:00"
│   │   ├── tipo: "Consulta General"
│   │   ├── estado: "confirmada"
│   │   └── createdAt: timestamp
│   └── cita_2
│       └── ...
│
└── plantillas/
    ├── plantilla_1
    │   ├── id: 1
    │   ├── profesionalId: 1
    │   ├── tipo: "Consulta General"
    │   ├── duracion: 45
    │   ├── color: "#3b82f6"
    │   └── createdAt: timestamp
    └── plantilla_2
        └── ...
```

---

## 🔐 Reglas de Seguridad Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Cada usuario solo ve sus propios datos
    match /modulos/{doc=**} {
      allow read, write: if request.auth.uid != null && request.auth.uid == resource.data.usuarioId;
    }
    
    match /citas/{doc=**} {
      allow read, write: if request.auth.uid != null && request.auth.uid == resource.data.usuarioId;
    }
    
    match /plantillas/{doc=**} {
      allow read, write: if request.auth.uid != null && request.auth.uid == resource.data.usuarioId;
    }
  }
}
```

---

## ✅ Checklist de Implementación

- [ ] Crear `lib/firebaseConfig.ts` con listeners
- [ ] Crear `contexts/DataContext.tsx` con Provider
- [ ] Actualizar `app/layout.tsx` para envolver con DataProvider
- [ ] Actualizar `components/CalendarView.tsx` para usar `useData()`
- [ ] Configurar variables de entorno en `.env.local`
- [ ] Crear estructura de Firestore
- [ ] Configurar reglas de seguridad en Firestore console
- [ ] Pruebas: abrir 2 sesiones del navegador y verificar sincronización
- [ ] Monitorear logs de Firestore en console

---

## 🧪 Pruebas de Sincronización

### Paso 1: Abrir 2 navegadores/pestañas
```
Tab 1: http://localhost:3000/calendario  (Usuario A)
Tab 2: http://localhost:3000/calendario  (Usuario B)
```

### Paso 2: En Tab 1, crear un módulo
- Esperar a que el Context reciba el evento `onSnapshot`
- Verificar que se vea en Tab 1 ✓

### Paso 3: Verificar en Tab 2
- El módulo debe aparecer en **<1 segundo** ✓

### Si no aparece:
1. Revisar console del navegador (errores de Firebase)
2. Verificar que Firestore tiene datos
3. Confirmar que listeners están activos
4. Revisar reglas de seguridad

---

## 📊 Flujo de Datos Actual vs. Mejorado

### ❌ ANTES (Estado Local Only)
```
Usuario A crea módulo → Estado local A actualizado
Usuario B NO ve cambios (necesita refrescar)
```

### ✅ DESPUÉS (Firestore + Listeners)
```
Usuario A crea módulo → Se guarda en Firestore
                     ↓
Listener en Firestore dispara onSnapshot
                     ↓
Context actualiza estado global
                     ↓
CalendarView re-renderiza automáticamente
                     ↓
Usuario B ve cambios en <1 segundo (sin refrescar)
```

---

## 🚀 Próximos Pasos Opcionales

1. **Autenticación con Firebase Auth** (login/logout)
2. **Presencia en tiempo real** (ver quién está editando)
3. **Historial de cambios** (quién cambió qué y cuándo)
4. **Offline-first con Firestore offline persistence**
5. **Notificaciones en tiempo real** (Cloud Messaging)

