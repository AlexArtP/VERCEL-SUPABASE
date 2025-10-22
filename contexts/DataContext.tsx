// Archivo: contexts/DataContext.tsx
// Propósito: Mantener datos sincronizados en tiempo real
// Es como el "corazón" de la aplicación

'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Modulo, Cita, PlantillaModulo } from '@/lib/demoData'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebaseConfig'
import { collection, addDoc, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore'


// ============================================
// 1️⃣ DEFINIR TIPOS DE DATOS
// ============================================

/**
 * Interface: ¿Qué funciones y datos tiene el Context?
 * 
 * Es como un "contrato" que dice:
 * "El Context siempre tendrá estos datos y estas funciones"
 */
interface DataContextType {
  // DATOS
  modulos: Modulo[]
  citas: Cita[]
  plantillas: PlantillaModulo[]
  loading: boolean
  error: string | null

  // FUNCIONES para MÓDULOS
  addModulo: (modulo: Omit<Modulo, 'id'>) => Promise<void>
  addModulosBatch?: (modulos: Omit<Modulo, 'id'>[]) => Promise<void>
  updateModulo: (id: number, updates: Partial<Modulo>) => Promise<void>
  deleteModulo: (id: number) => Promise<void>

  // FUNCIONES para CITAS
  addCita: (cita: Omit<Cita, 'id'>) => Promise<void>
  updateCita: (id: number, updates: Partial<Cita>) => Promise<void>
  deleteCita: (id: number) => Promise<void>

  // FUNCIONES para PLANTILLAS
  addPlantilla: (plantilla: Omit<PlantillaModulo, 'id'>) => Promise<void>
  updatePlantilla: (id: number, updates: Partial<PlantillaModulo>) => Promise<void>
  deletePlantilla: (id: number) => Promise<void>

  // CONTROL DE RANGO VISIBLE (para optimizar lecturas)
  setVisibleRange: (startISO: string, endISO: string) => void
}

// ============================================
// 2️⃣ CREAR EL CONTEXT
// ============================================

/**
 * Creamos el Context (lugar donde guardar datos compartidos)
 * 
 * Es como una "caja mágica" que todos los componentes pueden ver
 */
const DataContext = createContext<DataContextType | undefined>(undefined)

// ============================================
// 3️⃣ CREAR EL PROVIDER (Proveedor)
// ============================================

/**
 * DataProvider: El "guardián" que mantiene todo sincronizado
 * 
 * Props:
 *   - children: Componentes que quieren acceder a los datos
 *   - profesionalId: El ID del profesional (para filtrar datos)
 */
export function DataProvider({
  children,
  profesionalId,
}: {
  children: React.ReactNode
  profesionalId: number
}) {
  // ============================================
  // ESTADO (datos que se guardan)
  // ============================================

  const [modulos, setModulos] = useState<Modulo[]>([])
  const [citas, setCitas] = useState<Cita[]>([])
  const [plantillas, setPlantillas] = useState<PlantillaModulo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Rango visible (YYYY-MM-DD). Se inicia con semana actual para no traer todo.
  const [visibleStart, setVisibleStart] = useState<string>(() => {
    const d = new Date(); const day = d.getDay(); const diffToMon = (day + 6) % 7; d.setDate(d.getDate() - diffToMon); d.setHours(0,0,0,0)
    const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0')
    return `${y}-${m}-${dd}`
  })
  const [visibleEnd, setVisibleEnd] = useState<string>(() => {
    const d = new Date(); const day = d.getDay(); const diffToMon = (day + 6) % 7; d.setDate(d.getDate() - diffToMon + 6); d.setHours(0,0,0,0)
    const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0')
    return `${y}-${m}-${dd}`
  })

  // Estado de autenticación (para no montar listeners sin credenciales)
  const { user, loading: authLoading } = useAuth()

  // ============================================
  // EFECTO: Activar listeners en tiempo real
  // ============================================

  /**
   * useEffect: Se ejecuta cuando el componente se monta
   * 
   * ¿Qué hace?
   * 1. Activa los listeners de Firebase
   * 2. Escucha cambios en modulos, citas y plantillas
   * 3. Cuando algo cambia, actualiza el estado
   * 4. Limpia los listeners cuando el componente se desmonta
   */
  useEffect(() => {
    // Esperar a que termine la carga de autenticación y que exista usuario
    if (authLoading) {
      setLoading(true)
      return
    }
    if (!user) {
      // Sin usuario: limpiar datos y no montar listeners
      setModulos([])
      setCitas([])
      setPlantillas([])
      setLoading(false)
      // console.log('⏸️ Listeners no montados: usuario no autenticado')
      return
    }

    setLoading(true)
    // console.log('📡 Activando listeners para profesional:', profesionalId, 'Usuario:', user.uid)

    let unsubModulos: (() => void) | undefined
    let unsubCitas: (() => void) | undefined
    let unsubPlantillas: (() => void) | undefined

    // Lazy-import listeners and db utilities
    import('@/lib/firebaseConfig')
      .then((mod) => {
        // Usar user.uid (string) en lugar de profesionalId para que coincida con lo guardado en Firestore
        unsubModulos = mod.setupModulosListener(user.uid, (nuevosModulos: any[]) => {
          setModulos(nuevosModulos)
          setLoading(false)
        }, visibleStart, visibleEnd)

        unsubCitas = mod.setupCitasListener(user.uid, (nuevasCitas: any[]) => {
          setCitas(nuevasCitas)
          setLoading(false)
        }, visibleStart, visibleEnd)

        // NUEVO: Obtener estamento del usuario (profesion)
        // Se pasará al listener de plantillas para filtrar por estamento coincidente
        const estamentoUsuario = (user as any)?.profesion || 'Otro'
        unsubPlantillas = mod.setupPlantillasListener(estamentoUsuario, (nuevasPlantillas: any[]) => {
          setPlantillas(nuevasPlantillas)
          setLoading(false)
        })
      })
      .catch((err) => {
        console.warn('No se pudieron cargar listeners de firebase:', err)
        setLoading(false)
      })

    // LIMPIAR: Cuando el componente se desmonta o cambia el usuario/profesionalId
    return () => {
      console.log('🛑 Deteniendo listeners')
      if (unsubModulos) unsubModulos()
      if (unsubCitas) unsubCitas()
      if (unsubPlantillas) unsubPlantillas()
    }
  }, [authLoading, user, profesionalId, visibleStart, visibleEnd])

  // ============================================
  // FUNCIONES: CREAR, EDITAR, ELIMINAR
  // ============================================

  /**
   * Agregar nuevo módulo a Firebase
   * 
   * Flujo:
   * 1. Usuario hace clic en "Crear módulo"
   * 2. Llama a addModulo()
   * 3. Se guarda en Firebase
   * 4. Firebase notifica a todos los clientes
   * 5. Listener actualiza setModulos()
   * 6. CalendarView se re-renderiza
   */
  /**
   * Agregar nuevo módulo a Firebase
   * * Flujo:
   * 1. Usuario hace clic en "Crear módulo"
   * 2. Llama a addModulo()
   * 3. Se guarda en Firebase
   * 4. Firebase notifica a todos los clientes
   * 5. Listener actualiza setModulos()
   * 6. CalendarView se re-renderiza
   */
  const addModulo = useCallback(
    async (modulo: Omit<Modulo, 'id'>) => {
      // 1. VERIFICAR AUTENTICACIÓN
      //    (Ahora 'user' está actualizado gracias al array de dependencias)
      if (!user) {
        const errorMsg = 'Usuario no autenticado. No se puede crear el módulo.'
        console.error('❌ Error:', errorMsg)
        setError(errorMsg)
        throw new Error(errorMsg)
      }

      try {
        // 2. CONSTRUIR EL OBJETO CORRECTO
        //    Ignoramos cualquier 'profesionalId' que venga en 'modulo'
        //    y forzamos el 'profesionalId' del usuario autenticado.
        const moduloParaGuardar = {
          ...modulo,
          profesionalId: user.uid, // <-- LA CORRECCIÓN CLAVE
          createdAt: new Date().toISOString(),
        }
        
        console.log('➕ Creando módulo:', moduloParaGuardar)

        const mod = await import('@/lib/firebaseConfig')
        const { collection, addDoc } = await import('firebase/firestore')
        
        await addDoc(collection(mod.db, 'modulos'), moduloParaGuardar)
        
        console.log('✅ Módulo creado exitosamente')
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al crear módulo'
        console.error('❌ Error:', errorMsg)
        setError(errorMsg)
        throw err
      }
    },
    [user] // 3. AÑADIR 'user' A LAS DEPENDENCIAS
         //    Esto asegura que la función se "re-crea"
         //    cuando 'user' cambia (de null a logueado).
  )

  /**
   * Crear múltiples módulos en una sola operación (batch) para reducir el número de escrituras.
   */
  const addModulosBatch = useCallback(
    async (lista: Omit<Modulo, 'id'>[]) => {
      if (!user) {
        const errorMsg = 'Usuario no autenticado. No se pueden crear módulos.'
        console.error('❌ Error:', errorMsg)
        setError(errorMsg)
        throw new Error(errorMsg)
      }
      if (!Array.isArray(lista) || lista.length === 0) return

      try {
        const mod = await import('@/lib/firebaseConfig')
        const batch = writeBatch(mod.db)
        const colRef = collection(mod.db, 'modulos')

        lista.forEach((m) => {
          const docRef = doc(colRef) // ID auto-generado
          batch.set(docRef, {
            ...m,
            profesionalId: user.uid, // forzar pertenencia al usuario autenticado
            createdAt: new Date().toISOString(),
          })
        })

        console.log(`➕ Creando ${lista.length} módulo(s) en lote...`)
        await batch.commit()
        console.log('✅ Lote de módulos creado exitosamente')
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error en creación en lote de módulos'
        console.error('❌ Error:', errorMsg)
        setError(errorMsg)
        throw err
      }
    },
    [user]
  )

  /**
   * Editar módulo existente
   */
  const updateModulo = useCallback(
    async (id: number, updates: Partial<Modulo>) => {
      try {
        console.log('✏️ Actualizando módulo:', id, updates)
        const mod = await import('@/lib/firebaseConfig')
        const { doc, updateDoc } = await import('firebase/firestore')
        const docRef = doc(mod.db, 'modulos', id.toString())
        await updateDoc(docRef, {
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        console.log('✅ Módulo actualizado')
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al actualizar módulo'
        console.error('❌ Error:', errorMsg)
        setError(errorMsg)
        throw err
      }
    },
    []
  )

  /**
   * Eliminar módulo
   */
  const deleteModulo = useCallback(async (id: number) => {
    try {
      console.log('🗑️ Eliminando módulo:', id)
      const mod = await import('@/lib/firebaseConfig')
      const { doc, deleteDoc } = await import('firebase/firestore')
      await deleteDoc(doc(mod.db, 'modulos', id.toString()))
      console.log('✅ Módulo eliminado')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al eliminar módulo'
      console.error('❌ Error:', errorMsg)
      setError(errorMsg)
      throw err
    }
  }, [])

  // FUNCIONES SIMILARES PARA CITAS
  const addCita = useCallback(
    async (cita: Omit<Cita, 'id'>) => {
      try {
        console.log('➕ Creando cita:', cita)
        const mod = await import('@/lib/firebaseConfig')
        const { collection, addDoc } = await import('firebase/firestore')
        await addDoc(collection(mod.db, 'citas'), {
          ...cita,
          createdAt: Date.now(), // Usar timestamp numérico para queries eficientes
        })
        console.log('✅ Cita creada exitosamente')
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al crear cita'
        console.error('❌ Error:', errorMsg)
        setError(errorMsg)
        throw err
      }
    },
    []
  )

  const updateCita = useCallback(
    async (id: number, updates: Partial<Cita>) => {
      try {
        console.log('✏️ Actualizando cita:', id, updates)
        const mod = await import('@/lib/firebaseConfig')
        const { doc, updateDoc } = await import('firebase/firestore')
        const docRef = doc(mod.db, 'citas', id.toString())
        await updateDoc(docRef, {
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        console.log('✅ Cita actualizada')
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al actualizar cita'
        console.error('❌ Error:', errorMsg)
        setError(errorMsg)
        throw err
      }
    },
    []
  )

  const deleteCita = useCallback(async (id: number) => {
    try {
      console.log('🗑️ Eliminando cita:', id)
      const mod = await import('@/lib/firebaseConfig')
      const { doc, deleteDoc } = await import('firebase/firestore')
      await deleteDoc(doc(mod.db, 'citas', id.toString()))
      console.log('✅ Cita eliminada')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al eliminar cita'
      console.error('❌ Error:', errorMsg)
      setError(errorMsg)
      throw err
    }
  }, [])

  // FUNCIONES PARA PLANTILLAS
  const addPlantilla = useCallback(
    async (plantilla: Omit<PlantillaModulo, 'id'>) => {
      try {
        console.log('➕ Creando plantilla en moduloDefinitions:', plantilla)
        await addDoc(collection(db, 'moduloDefinitions'), {
          ...plantilla,
          createdAt: new Date().toISOString(),
        })
        console.log('✅ Plantilla creada en moduloDefinitions')
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al crear plantilla'
        console.error('❌ Error:', errorMsg)
        setError(errorMsg)
        throw err
      }
    },
    []
  )

  const updatePlantilla = useCallback(
    async (id: number, updates: Partial<PlantillaModulo>) => {
      try {
        console.log('✏️ Actualizando plantilla en moduloDefinitions:', id, updates)
        const docRef = doc(db, 'moduloDefinitions', id.toString())
        await updateDoc(docRef, {
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        console.log('✅ Plantilla actualizada en moduloDefinitions')
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al actualizar plantilla'
        console.error('❌ Error:', errorMsg)
        setError(errorMsg)
        throw err
      }
    },
    []
  )

  const deletePlantilla = useCallback(async (id: number) => {
    try {
      console.log('🗑️ Eliminando plantilla de moduloDefinitions:', id)
      await deleteDoc(doc(db, 'moduloDefinitions', id.toString()))
      console.log('✅ Plantilla eliminada de moduloDefinitions')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al eliminar plantilla'
      console.error('❌ Error:', errorMsg)
      setError(errorMsg)
      throw err
    }
  }, [])

  // ============================================
  // PROVIDER: Proporcionar datos a componentes
  // ============================================

  return (
    <DataContext.Provider
      value={{
        modulos,
        citas,
        plantillas,
        loading,
        error,
        addModulo,
        addModulosBatch,
        updateModulo,
        deleteModulo,
        addCita,
        updateCita,
        deleteCita,
        addPlantilla,
        updatePlantilla,
        deletePlantilla,
        setVisibleRange: (startISO: string, endISO: string) => { setVisibleStart(startISO); setVisibleEnd(endISO) },
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

// ============================================
// 4️⃣ CREAR HOOK CUSTOM: useData()
// ============================================

/**
 * Hook: useData()
 * 
 * ¿Cómo se usa desde otros componentes?
 * 
 * import { useData } from '@/contexts/DataContext'
 * 
 * export function MiComponente() {
 *   const { modulos, addModulo } = useData()
 *   
 *   return <div>{modulos.length} módulos</div>
 * }
 */
export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error(
      '❌ useData() debe usarse dentro de <DataProvider>. ' +
      'Asegúrate de que el componente está envuelto por DataProvider en layout.tsx'
    )
  }
  return context
}
