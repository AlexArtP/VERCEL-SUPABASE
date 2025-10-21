# 🔍 EXPLICACIÓN LÍNEA POR LÍNEA
## Entiende cada parte del código

---

## ARCHIVO 1: `lib/firebaseConfig.ts`

```typescript
// ============================================
// LÍNEA 1-2: Importar herramientas
// ============================================

import { initializeApp } from 'firebase/app'
//      ↑
//      Una función que "abre la puerta" a Firebase

import { getFirestore, collection, onSnapshot, query, where, QueryConstraint } from 'firebase/firestore'
//      ↑
//      Herramientas para trabajar con la base de datos Firestore


// ============================================
// LÍNEA 5-13: Credenciales
// ============================================

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  //      ↑
  //      Lee la variable de entorno .env.local
  //      process.env = "Lee archivos de configuración"
  //      NEXT_PUBLIC_ = "Visible al cliente (navegador)"
  
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}


// ============================================
// LÍNEA 17: Inicializar Firebase
// ============================================

const app = initializeApp(firebaseConfig)
//    ↑
//    "app" es la conexión establecida a Firebase
//    Ahora podemos usar Firebase en nuestra app


// ============================================
// LÍNEA 21: Obtener acceso a Firestore
// ============================================

export const db = getFirestore(app)
//     ↑
//     "db" es la base de datos
//     "export" = otros archivos pueden usar esto
//     Ejemplo: import { db } from '@/lib/firebaseConfig'


// ============================================
// LÍNEA 30-55: Funciones que "vigilan"
// ============================================

export function setupModulosListener(
  profesionalId: number,
  //            ↑
  //            El ID del profesional (ej: 1, 2, 3)
  //            "Vigila solo módulos de este profesional"
  
  callback: (modulos: any[]) => void
  //                           ↑
  //                           Función que se ejecuta cuando hay cambios
  //                           Recibe los módulos actualizados
) {
  // Crear consulta: "Dame todos los módulos de este profesional"
  const q = query(
    collection(db, 'modulos'),
    //         ↑
    //         Colección "modulos" en Firestore
    //         Como una tabla en SQL
    
    where('profesionalId', '==', profesionalId)
    //     ↑
    //     Filtro: donde profesionalId sea IGUAL a el del parámetro
    //     '==' significa "igual a"
  )

  // Activar listener
  return onSnapshot(q, (snapshot) => {
    //      ↑
    //      "Escuchar cambios en tiempo real"
    //      Cada vez que Firestore cambia, esto se ejecuta
    
    // Convertir documentos a objetos
    const modulos = snapshot.docs.map(doc => ({
      //  ↑
      //  snapshot.docs = todos los documentos que coinciden
      //  .map() = transformar cada uno
      //  doc = cada documento
      
      id: doc.id,
      //    ↑
      //    El ID del documento (automático de Firestore)
      
      ...doc.data()
      //  ↑
      //  Esparcir datos: si doc tiene {tipo, duracion, color}
      //  Ahora devolvemos {id: "123", tipo: "...", duracion: 45, color: "..."}
    }))
    
    // Ejecutar callback con datos nuevos
    callback(modulos)
    //       ↑
    //       Pasar los módulos actualizados a quien llamó esta función
  })
  
  // Retornar función para dejar de escuchar
  // Uso: const unsubscribe = setupModulosListener(...)
  //      unsubscribe() para detener
}
```

---

## ARCHIVO 2: `contexts/DataContext.tsx`

```typescript
// ============================================
// LÍNEA 1: Modo cliente
// ============================================

'use client'
//  ↑
//  "Ejecuta este código en el navegador del cliente"
//  No en el servidor de Next.js
//  Necesario para hooks como useState, useContext


// ============================================
// LÍNEA 3-10: Importes
// ============================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
//              ↑                  ↑                  ↑        ↑           ↑
//              Crea contexto      Lee contexto     Se ejecuta    Estado   Función memoizada


// ============================================
// LÍNEA 28: Definir tipos
// ============================================

interface DataContextType {
  //       ↑
  //       "Interface" = contrato que define qué tiene el Context
  //       Como un "manual de instrucciones"
  //       Dice: "Este Context SIEMPRE tendrá estos datos y funciones"
  
  modulos: Modulo[]
  //       ↑
  //       Array de módulos
  
  addModulo: (modulo: Omit<Modulo, 'id'>) => Promise<void>
  //         ↑
  //         Función que recibe un módulo (sin id)
  //         Omit<Modulo, 'id'> = Todo de Modulo EXCEPTO id
  //         => Promise<void> = devuelve una promesa (para async/await)
}


// ============================================
// LÍNEA 57: Crear Context
// ============================================

const DataContext = createContext<DataContextType | undefined>(undefined)
//     ↑
//     Caja mágica donde guardar datos compartidos
//     <DataContextType | undefined>
//      ↑
//      Puede ser DataContextType o undefined (si no existe)


// ============================================
// LÍNEA 62: Provider (El guardián)
// ============================================

export function DataProvider({ children, profesionalId }: { ... }) {
  //     ↑                       ↑
  //     Función que envuelve        "children" = componentes dentro
  //     el componente               "profesionalId" = filtro para datos
  
  // ============================================
  // Estado: Dónde guardar datos
  // ============================================

  const [modulos, setModulos] = useState<Modulo[]>([])
  //     ↑                      ↑
  //     Variable de estado     Empieza vacío []
  //     Cuando cambia, componentes se re-renderizan


  // ============================================
  // useEffect: Se ejecuta al montar componente
  // ============================================

  useEffect(() => {
    //  ↑
    //  "Cuando el componente carga, ejecuta esto"
    
    setLoading(true)
    
    // Activar listener
    const unsubModulos = setupModulosListener(profesionalId, (nuevosModulos) => {
      //                                                      ↑
      //                                                      Callback
      //                                                      Cuando Firestore cambia:
      
      console.log('✅ Módulos actualizados:', nuevosModulos)
      setModulos(nuevosModulos)
      //         ↑
      //         Actualizar estado con nuevos datos
      //         Esto causa que componentes se re-renderizen
      
      setLoading(false)
    })

    // Cleanup: Dejar de escuchar cuando el componente se desmonta
    return () => {
      //     ↑
      //     "Cuando el componente se destruye, ejecuta esto"
      
      unsubModulos()
      //  ↑
      //  Detener listener para no gastar memoria
    }
  }, [profesionalId])
  //     ↑
  //     Dependencias: Si profesionalId cambia, re-ejecutar useEffect


  // ============================================
  // Función: Crear módulo
  // ============================================

  const addModulo = useCallback(
    async (modulo: Omit<Modulo, 'id'>) => {
      //      ↑
      //      Función asíncrona (usa await)
      
      try {
        // Guardar en Firebase
        await addDoc(collection(db, 'modulos'), {
          //   ↑
          //   addDoc = agregar documento
          //   collection = ir a colección "modulos"
          //   {} = datos que guardar
          
          ...modulo,
          //  ↑
          //  Esparcir: si modulo = {tipo, duracion}, ahora es {tipo, duracion, ...}
          
          createdAt: new Date().toISOString(),
          //         ↑
          //         Marca de tiempo: cuándo se creó
          //         .toISOString() = formato estándar
        })
      } catch (err) {
        //     ↑
        //     Si hay error, catch lo captura
        
        const errorMsg = err instanceof Error ? err.message : 'Error'
        setError(errorMsg)
        throw err
        //     ↑
        //     Relanzar error para que MainApp lo maneje
      }
    },
    []
    //  ↑
    //  Dependencias vacías = esta función nunca cambia
    //  useCallback = evitar re-crear función innecesariamente
  )


  // ============================================
  // Provider: Proporcionar datos
  // ============================================

  return (
    <DataContext.Provider
      value={{
        //    ↑
        //    Qué datos/funciones proporcionar
        //    Todos los componentes dentro pueden acceder
        
        modulos,
        addModulo,
        updateModulo,
        deleteModulo,
        // ... etc
      }}
    >
      {children}
      //     ↑
      //     Componentes que pueden usar useData()
    </DataContext.Provider>
  )
}


// ============================================
// Hook: useData()
// ============================================

export function useData() {
  //         ↑
  //         "Hook" = función que accede a datos compartidos
  
  const context = useContext(DataContext)
  //              ↑
  //              Leer el Context
  //              Devuelve el value que pasamos en Provider
  
  if (!context) {
    //  ↑
    //  Si context es undefined = no está dentro de Provider
    
    throw new Error('useData() debe usarse dentro de <DataProvider>')
    //     ↑
    //     Lanzar error (es un error de programación)
  }
  
  return context
  //     ↑
  //     Devolver { modulos, addModulo, ... }
  //     Ahora el componente puede usar estos datos
}
```

---

## ARCHIVO 3: `app/layout.tsx` (Modificado)

```typescript
import { DataProvider } from '@/contexts/DataContext'
//                    ↑
//                    Importar el Provider

export default function RootLayout({ children }: { ... }) {
  //                                 ↑
  //                                 Componentes hijos (toda la app)
  
  const profesionalId = 1
  //     ↑
  //     TODO: Obtener del usuario autenticado
  //     Por ahora, usamos 1 como ejemplo
  
  return (
    <html lang="en">
      <body>
        {/* Envolver toda la app con DataProvider */}
        <DataProvider profesionalId={profesionalId}>
          //            ↑
          //            Pasar profesionalId
          //            Todos los componentes dentro pueden usar useData()
          
          {children}
          //          ↑
          //          Toda la app está aquí
          //          page.tsx, MainApp, CalendarView, etc.
        </DataProvider>
      </body>
    </html>
  )
}
```

---

## ARCHIVO 4: `components/MainApp.tsx` (Modificado)

```typescript
// ============================================
// IMPORTAR useData
// ============================================

import { useData } from "@/contexts/DataContext"
//       ↑
//       Importar el hook que creamos


export function MainApp({ currentUser, onLogout }: MainAppProps) {
  
  // ============================================
  // ANTES (Estado local):
  // ============================================
  
  // const [modulos, setModulos] = useState(DEMO_DATA.modulos)
  // ❌ Datos locales - NO sincroniza con otros usuarios


  // ============================================
  // DESPUÉS (Datos sincronizados):
  // ============================================

  const { 
    modulos,              // Lee datos
    addModulo,            // Crear
    updateModulo,         // Editar
    deleteModulo,         // Eliminar
    addCita,              // Crear cita
    updateCita,           // Editar cita
    deleteCita            // Eliminar cita
  } = useData()
  //     ↑
  //     Obtener del Context
  //     Automáticamente sincronizados
  //     Cuando Firebase cambia, aquí se actualiza


  // ============================================
  // PASAR A CalendarView
  // ============================================

  <CalendarView
    modulos={modulos}
    //       ↑
    //       Pasar módulos sincronizados
    
    onModuloCreate={(modulo) => {
      //            ↑
      //            Cuando el usuario crea módulo
      
      addModulo(modulo).catch(console.error)
      //↑
      //En lugar de setModulos(), llamamos a addModulo()
      //addModulo guarda en Firebase
      //Firebase notifica a todos
      //Listeners actualizan setModulos()
      //CalendarView re-renderiza
      //¡SINCRONIZADO!
    }}
    
    onModuloUpdate={(id, modulo) => {
      updateModulo(id, modulo).catch(console.error)
      //↑
      //Actualizar en Firebase
    }}
    
    onModuloDelete={(ids) => {
      ids.forEach(id => deleteModulo(id).catch(console.error))
      //↑
      //Eliminar de Firebase
    }}
  />
}
```

---

## FLUJO COMPLETO: Línea por línea

### Paso 1: Usuario crea módulo

```typescript
// Usuario hace clic en botón "Crear"
onModuloCreate(nuevoModulo)  // Aquí
```

### Paso 2: MainApp lo captura

```typescript
onModuloCreate={(modulo) => {
  addModulo(modulo).catch(console.error)  // Aquí
}}
```

### Paso 3: DataContext guarda en Firebase

```typescript
// En contexts/DataContext.tsx:
const addModulo = async (modulo) => {
  await addDoc(collection(db, 'modulos'), modulo)  // Aquí
  // ↓ Firebase guarda
}
```

### Paso 4: Listener dispara

```typescript
// setupModulosListener ejecuta callback
setupModulosListener(profesionalId, (nuevosModulos) => {
  //                                 ↑
  //                        Firebase notificó con datos nuevos
  setModulos(nuevosModulos)  // Aquí
})
```

### Paso 5: CalendarView re-renderiza

```typescript
// MainApp tiene:
const { modulos } = useData()  // modulos cambió
// Esto causa que MainApp se re-renderice

// MainApp pasa a CalendarView:
<CalendarView modulos={modulos} />
//                      ↑
//                      Nuevos datos
```

### Paso 6: Usuario ve cambio

```
En navegador: ✨ Nuevo módulo aparece en calendar ✨
```

---

## 🧠 CONCEPTOS INTERNOS

### `useState` vs `useContext`

```typescript
// useState (Estado local):
const [modulos, setModulos] = useState([])
//     ↑
//     Solo este componente ve cambios
//     No se sincroniza con otros

// useContext (Estado compartido):
const { modulos } = useData()
//       ↑
//       Todos los componentes ven cambios
//       Se sincroniza con Firebase
```

### `callback` vs `await`

```typescript
// Callback:
setupModulosListener(id, (datos) => {
  //                      ↑
  //                      Se ejecuta cuando hay cambios
  //                      Ahora, en 1 segundo, en 1 hora, siempre
})

// Await:
const resultado = await addDoc(...)
//                 ↑
//                 Espera a que termine
//                 Luego continúa
```

### `useEffect` cleanup

```typescript
useEffect(() => {
  const unsub = setupModulosListener(...)
  
  return () => {
    //     ↑
    //     Esta función se ejecuta cuando el componente muere
    //     "Limpia" para no gastar memoria
    unsub()
  }
}, [])
```

---

## 💬 PREGUNTAS COMUNES

**P: ¿Por qué `useCallback`?**
R: Para no recrear la función `addModulo` cada vez que MainApp se renderiza

**P: ¿Por qué `async/await`?**
R: Porque guardar en Firebase toma tiempo (red)

**P: ¿Por qué `.catch(console.error)`?**
R: Si hay error, lo registramos en console

**P: ¿Por qué `Omit<Modulo, 'id'>`?**
R: Firebase genera automáticamente el id, no lo necesitamos

**P: ¿Por qué `?. |> undefined`?**
R: Porque el context podría no existir (error de programación)

---

