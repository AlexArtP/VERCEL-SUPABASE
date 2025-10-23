/**
 * ARCHIVO: lib/useFirestoreProfesionales.ts
 * PROPOSITO: Hook para obtener profesionales de Firestore en tiempo real
 * BUSQUEDA: Por UID en colección 'usuarios' donde rol='profesional' y activo=true
 * AUTENTICACION: Verifica sesión desde localStorage
 */

'use client'

import { useState, useEffect } from 'react'
import { db } from './firebaseConfig'
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
    let unsubscribe: (() => void) | null = null

    // Chequeo de autenticación real de Firebase Auth
    import('firebase/auth').then(({ getAuth }) => {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) {
        console.warn('No hay usuario autenticado en Firebase Auth. Mostrando mensaje de error.')
        setProfesionales([])
        setError('No autenticado en Firebase. Por favor, inicia sesión desde el login principal.')
        setLoading(false)
        return
      }

      // (Opcional) Log extra para depuración
      console.log('Usuario autenticado en Firebase:', user.email, user.uid)

      // Crear la consulta a Firestore
      const q = query(
        collection(db, 'usuarios'),
        where('rol', '==', 'profesional'),
        where('activo', '==', true)
      )

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const profesionalesList: Profesional[] = []
          snapshot.forEach((doc) => {
            const data = doc.data()
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
            } as Profesional)
          })
          setProfesionales(profesionalesList.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '')))
          setError(null)
          setLoading(false)
        },
        (err: any) => {
          console.error('Error al cargar profesionales desde Firestore:', err.code, err.message)
          let errorMessage = err.message
          if (err.code === 'permission-denied') {
            errorMessage = 'Permiso denegado: Verifica las reglas de Firestore para la coleccion usuarios'
          } else if (err.code === 'unauthenticated') {
            errorMessage = 'No autenticado: Tu sesion ha expirado'
          }
          setError(errorMessage)
          setLoading(false)
        }
      )
    })

    return () => {
      try {
        if (typeof unsubscribe === 'function') {
          unsubscribe()
        }
      } catch (e) {
        console.warn('Error limpiando listener:', e)
      }
    }
  }, [])

  return { profesionales, loading, error }
}
