/**
 * ARCHIVO: lib/useFirestoreProfesionales.ts
 * PROPOSITO: Hook para obtener profesionales de Firestore en tiempo real
 * BUSQUEDA: Por UID en colección 'usuarios' donde rol='profesional' y activo=true
 * AUTENTICACION: Verifica sesión desde localStorage
 */

'use client'

import { useState, useEffect } from 'react'
import { db, onAuthStateChange, getCurrentUser } from './firebaseConfig'
import { collection, query, where, onSnapshot } from 'firebase/firestore'

export interface Profesional {
  id: string
  email: string
  nombre: string
  apellidoPaterno?: string
  apellidoMaterno?: string
  profesion?: string
  telefono?: string
  rol: string
  esAdmin?: boolean
  activo: boolean
  avatar?: string
  specialties?: string[]
}

export interface UseFirestoreProfesionalesReturn {
  profesionales: Profesional[]
  loading: boolean
  error: string | null
}

export function useFirestoreProfesionales(): UseFirestoreProfesionalesReturn {
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    let unsubscribeQuery: (() => void) | null = null
    let unsubscribeAuth: (() => void) | null = null

    function startQuery() {
      // Evitar duplicados
      if (unsubscribeQuery) {
        try { unsubscribeQuery() } catch {}
        unsubscribeQuery = null
      }

      console.log('Buscando profesionales desde Firestore (autenticado)...')
      const qRef = query(
        collection(db, 'usuarios'),
        where('rol', '==', 'profesional'),
        where('activo', '==', true)
      )

      unsubscribeQuery = onSnapshot(
        qRef,
        (snapshot) => {
          const profesionalesList: Profesional[] = []
          snapshot.forEach((doc) => {
            const data = doc.data() as any
            profesionalesList.push({
              id: doc.id,
              email: data.email || '',
              nombre: data.nombre || '',
              apellidoPaterno: data.apellidoPaterno,
              apellidoMaterno: data.apellidoMaterno,
              profesion: data.profesion,
              telefono: data.telefono,
              rol: data.rol,
              esAdmin: data.esAdmin || false,
              activo: data.activo !== false,
              avatar: data.avatar,
              specialties: data.specialties,
            })
          })

          console.log('✅ Profesionales cargados: ' + profesionalesList.length)
          setProfesionales(profesionalesList.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '')))
          setError(null)
          setLoading(false)
        },
        (err: any) => {
          console.error('❌ Error al cargar profesionales desde Firestore:', err?.code, err?.message)
          let errorMessage = err?.message || 'Error desconocido'
          if (err?.code === 'permission-denied') {
            errorMessage = 'Permiso denegado al leer profesionales (verifica reglas y autenticación)'
          }
          setError(errorMessage)
          setLoading(false)
        }
      )
    }

    try {
      const current = getCurrentUser()
      if (current) {
        console.log('✅ Usuario autenticado en Firebase:', current.email)
        startQuery()
      } else {
        console.log('⏳ Esperando autenticación de Firebase...')
        unsubscribeAuth = onAuthStateChange((user) => {
          if (user) {
            console.log('✅ Usuario autenticado en Firebase (listener):', user.email)
            startQuery()
          } else {
            console.log('❌ No autenticado todavía')
            setProfesionales([])
            setLoading(false)
            setError('No autenticado')
          }
        })
      }
    } catch (err: any) {
      console.error('❌ Error inicializando listener de profesionales:', err)
      setError(err.message)
      setLoading(false)
    }

    return () => {
      try { if (typeof unsubscribeQuery === 'function') unsubscribeQuery() } catch {}
      try { if (typeof unsubscribeAuth === 'function') unsubscribeAuth() } catch {}
    }
  }, [])

  return { profesionales, loading, error }
}
