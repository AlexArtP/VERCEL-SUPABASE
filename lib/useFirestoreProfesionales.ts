/**
 * ARCHIVO: lib/useFirestoreProfesionales.ts (REFACTORIZADO - Supabase Polling)
 * PROPÓSITO: Hook para obtener profesionales via polling (sin listeners Firebase)
 * 
 * Cambio: onSnapshot (Firestore listener) → setInterval (polling /api/profesionales)
 */

'use client'

import { useState, useEffect } from 'react'

export interface Profesional {
  id: string
  uid?: string | null
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
  agendaDisabled?: boolean
  agendaDisabledReason?: string | null
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

  // Fetch profesionales desde endpoint (polling)
  const fetchProfesionales = async () => {
    try {
      setError(null)
      const response = await fetch('/api/profesionales')
      
      if (!response.ok) {
        throw new Error(`Error fetching profesionales: ${response.statusText}`)
      }

      const { data, count } = await response.json()
      
      if (Array.isArray(data)) {
        setProfesionales(data as Profesional[])
        console.log(`✅ ${count || data.length} profesionales sincronizados`)
      }
      
      setLoading(false)
    } catch (err: any) {
      console.error('❌ Error obteniendo profesionales:', err)
      setError(err.message || 'Error al obtener profesionales')
      setLoading(false)
    }
  }

  // Poll profesionales cada 5 segundos
  useEffect(() => {
    console.log(`👨‍⚕️ Iniciando polling de profesionales`)
    
    // Fetch inicial
    fetchProfesionales()

    // Polling cada 5 segundos
    const interval = setInterval(() => {
      fetchProfesionales()
    }, 5000)

    return () => {
      clearInterval(interval)
      console.log('🛑 Polling de profesionales detenido')
    }
  }, [])

  return {
    profesionales,
    loading,
    error
  }
}
