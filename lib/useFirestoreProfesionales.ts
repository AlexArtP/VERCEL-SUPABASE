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

    try {
      // Verificar si hay usuario en localStorage (sesion HTTP)
      const usuarioGuardado = typeof window !== 'undefined' ? localStorage.getItem('sistema_auth_token') : null
      
      if (!usuarioGuardado) {
        console.log('No hay sesion activa en localStorage. Retornando lista vacia.')
        setProfesionales([])
        setError('No autenticado. Por favor, inicia sesion.')
        setLoading(false)
        return
      }

      try {
        const usuario = JSON.parse(usuarioGuardado)
        console.log('Usuario encontrado en sesion: ' + usuario.email)
      } catch (e) {
        console.error('Error parseando datos del usuario:', e)
        setError('Error en la sesion del usuario')
        setLoading(false)
        return
      }

      console.log('Buscando profesionales desde Firestore...')

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
            console.log('Profesional encontrado:')
            console.log('   - UID: ' + doc.id)
            console.log('   - Nombre: ' + data.nombre)
            console.log('   - Email: ' + data.email)
            console.log('   - Rol: ' + data.rol)
            console.log('   - Activo: ' + data.activo)
            
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
          
          console.log('Total de profesionales cargados desde Firestore: ' + profesionalesList.length)
          profesionalesList.forEach(p => {
            console.log('   - ' + p.nombre + ' ' + (p.apellidoPaterno || '') + ' ' + (p.apellidoMaterno || '') + ' (' + p.email + ') - UID: ' + p.id)
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
          
          console.error('Detalles del error: ' + errorMessage)
          setError(errorMessage)
          setLoading(false)
        }
      )
    } catch (err: any) {
      console.error('Error en useFirestoreProfesionales:', err)
      setError(err.message)
      setLoading(false)
    }

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
