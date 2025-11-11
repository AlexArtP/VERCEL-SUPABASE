/**
 * ARCHIVO: lib/useFirestoreCitas.ts (REFACTORIZADO - Supabase Polling)
 * PROPÓSITO: Hook para obtener citas via polling (sin listeners Firebase)
 * 
 * Cambio: onSnapshot (Firestore listener) → setInterval (polling /api/citas)
 */

'use client'

import { useState, useEffect } from 'react'

export interface Cita {
  id: string
  profesional_id?: string
  profesionalId?: string
  paciente_id?: string
  pacienteId?: string
  paciente_nombre?: string
  pacienteNombre?: string
  fecha: string
  hora_inicio?: string
  horaInicio?: string
  hora_fin?: string
  horaFin?: string
  tipo: string
  estado: 'confirmada' | 'pendiente' | 'cancelada'
  notas?: string
  esOverbooking?: boolean
  created_at?: string
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

  // Fetch citas desde endpoint (polling)
  const fetchCitas = async () => {
    if (!profesionalId) {
      setCitas([])
      setLoading(false)
      return
    }

    try {
      setError(null)
      const response = await fetch(`/api/citas?profesionalId=${profesionalId}`)
      
      if (!response.ok) {
        throw new Error(`Error fetching citas: ${response.statusText}`)
      }

      const { data, count } = await response.json()
      
      if (Array.isArray(data)) {
        // Mapear campos de Supabase a la interfaz Cita
        const citasMapeadas = data.map((cita: any) => ({
          id: cita.id || cita.citaid,
          profesional_id: cita.profesional_id || cita.profesionalid,
          profesionalId: cita.profesional_id || cita.profesionalid,
          paciente_id: cita.paciente_id || cita.pacienteid,
          pacienteId: cita.paciente_id || cita.pacienteid,
          paciente_nombre: cita.paciente_nombre_cache || cita.paciente_nombre || cita.pacienteNombre,
          pacienteNombre: cita.paciente_nombre_cache || cita.paciente_nombre || cita.pacienteNombre,
          fecha: cita.fecha,
          hora_inicio: cita.hora_inicio,
          horaInicio: cita.hora_inicio,
          hora_fin: cita.hora_fin,
          horaFin: cita.hora_fin,
          tipo: cita.tipo || cita.tipocita,
          estado: cita.estado,
          notas: cita.observaciones || cita.motivo || cita.notas,
          observacion: cita.observaciones || cita.motivo || cita.notas,
          esOverbooking: cita.esOverbooking || cita.esSobrecupo,
          created_at: cita.created_at,
          createdAt: cita.created_at,
          ...cita
        }))
        setCitas(citasMapeadas as Cita[])
        console.log(`✅ ${count || data.length} citas sincronizadas para profesional ${profesionalId}`)
      }
      
      setLoading(false)
    } catch (err: any) {
      console.error('❌ Error obteniendo citas:', err)
      setError(err.message || 'Error al obtener citas')
      setLoading(false)
    }
  }

  // Poll citas cada 5 segundos
  useEffect(() => {
    console.log(`📅 Iniciando polling de citas para profesional: ${profesionalId}`)
    
    // Fetch inicial
    fetchCitas()

    // Polling cada 5 segundos
    const interval = setInterval(() => {
      fetchCitas()
    }, 5000)

    return () => {
      clearInterval(interval)
      console.log('🛑 Polling de citas detenido')
    }
  }, [profesionalId])

  // Añadir cita
  const addCita = async (cita: Omit<Cita, 'id'>) => {
    try {
      console.log('📝 Creando nueva cita')
      
      const response = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cita)
      })

      if (!response.ok) {
        throw new Error('Error creando cita')
      }

      // Refetch para sincronizar
      await fetchCitas()
      console.log(`✅ Cita creada`)
    } catch (err: any) {
      console.error('❌ Error creando cita:', err)
      throw err
    }
  }

  // Actualizar cita
  const updateCita = async (citaId: string, updates: Partial<Cita>) => {
    try {
      console.log(`✏️ Actualizando cita: ${citaId}`)
      
      const response = await fetch(`/api/citas?id=${citaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Error actualizando cita')
      }

      // Refetch para sincronizar
      await fetchCitas()
      console.log(`✅ Cita actualizada: ${citaId}`)
    } catch (err: any) {
      console.error('❌ Error actualizando cita:', err)
      throw err
    }
  }

  // Eliminar cita
  const deleteCita = async (citaId: string) => {
    try {
      console.log(`🗑️ Eliminando cita: ${citaId}`)
      
      const response = await fetch(`/api/citas?id=${citaId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error eliminando cita')
      }

      // Refetch para sincronizar
      await fetchCitas()
      console.log(`✅ Cita eliminada: ${citaId}`)
    } catch (err: any) {
      console.error('❌ Error eliminando cita:', err)
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
