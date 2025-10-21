/**
 * ARCHIVO: lib/useFirestoreCitas.ts
 * PROPÓSITO: Hook para obtener citas de un profesional desde Firestore
 */

'use client'

import { useState, useEffect } from 'react'
import { db } from './firebaseConfig'
import { collection, query, where, onSnapshot } from 'firebase/firestore'

export interface Cita {
  id: string
  profesionalId: string
  pacienteId: string
  pacienteNombre: string
  fecha: string
  horaInicio: string
  horaFin: string
  tipo: string
  estado: 'confirmada' | 'pendiente' | 'cancelada'
  notas?: string
  esOverbooking?: boolean
  createdAt?: string
}

export interface UseFirestoreCitasReturn {
  citas: Cita[]
  loading: boolean
  error: string | null
  addCita: (cita: Omit<Cita, 'id'>) => Promise<void>
  updateCita: (citaId: string, updates: Partial<Cita>) => Promise<void>
  deleteCita: (citaId: string) => Promise<void>
}

export function useFirestoreCitas(profesionalId: string | null): UseFirestoreCitasReturn {
  const [citas, setCitas] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profesionalId) {
      setCitas([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const q = query(
        collection(db, 'citas'),
        where('profesionalId', '==', profesionalId)
      )

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const citasList: Cita[] = []
          snapshot.forEach((doc) => {
            citasList.push({
              id: doc.id,
              ...doc.data(),
            } as Cita)
          })
          console.log(`✅ Citas cargadas: ${citasList.length}`)
          setCitas(citasList)
          setLoading(false)
        },
        (err) => {
          console.error('❌ Error al cargar citas:', err.code, err.message)
          
          let errorMessage = err.message
          if (err.code === 'permission-denied') {
            errorMessage = 'Permiso denegado al leer citas'
          }
          
          setError(errorMessage)
          setLoading(false)
        }
      )

      return () => unsubscribe()
    } catch (err: any) {
      console.error('❌ Error en useFirestoreCitas:', err.message)
      setError(err.message)
      setLoading(false)
    }
  }, [profesionalId])

  const addCita = async (cita: Omit<Cita, 'id'>) => {
    try {
      // En el futuro: usar el endpoint /api/citas/create
      console.log('📝 Crear cita:', cita)
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updateCita = async (citaId: string, updates: Partial<Cita>) => {
    try {
      // En el futuro: usar el endpoint /api/citas/update
      console.log('✏️ Actualizar cita:', citaId, updates)
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const deleteCita = async (citaId: string) => {
    try {
      // En el futuro: usar el endpoint /api/citas/delete
      console.log('🗑️ Eliminar cita:', citaId)
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  return {
    citas,
    loading,
    error,
    addCita,
    updateCita,
    deleteCita
  }
}
