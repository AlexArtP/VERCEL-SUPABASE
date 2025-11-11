/**
 * ARCHIVO: lib/useAppointmentNotifications.ts (REFACTORIZADO - Supabase Realtime)
 * PROPÓSITO: Hook para obtener notificaciones de citas via listeners en tiempo real
 * 
 * Cambio: polling cada 5s → Supabase Realtime (eventos push, cero GETs innecesarios)
 */

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useNotifications } from '@/contexts/NotificationContext'

export interface Cita {
  id: string
  profesionalId: string
  pacienteNombre: string
  tipo: string
  fecha: string
  hora: string
  estado: string
  notas?: string
  createdAt?: number | string
  createdBy?: string
}

/**
 * Hook que obtiene citas para el profesional actual via Supabase Realtime
 * @param profesionalId - ID del profesional actual
 * @param enabled - boolean para habilitar/deshabilitar el listener
 */
export function useAppointmentNotifications(profesionalId: string | null, enabled: boolean = true) {
  const { addNotification } = useNotifications()
  const [citas, setCitas] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)
  const DEBUG = false

  useEffect(() => {
    if (!profesionalId || !enabled) {
      setCitas([])
      setLoading(false)
      return
    }

    let isMounted = true
    const DEBUG_REALTIME = false

    // Fetch inicial de citas
    async function fetchInitialNotifications() {
      try {
        const { data, error } = await supabase
          .from('citas')
          .select('*')
          .eq('profesional_id', profesionalId)

        if (error) throw error
        if (isMounted) {
          setCitas((data as Cita[]) || [])
          setLoading(false)
          if (DEBUG_REALTIME) console.log(`📌 Citas iniciales cargadas: ${(data || []).length}`)
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('❌ Error cargando citas iniciales:', err)
          setLoading(false)
        }
      }
    }

    // Setup del listener Realtime
    function setupRealtimeListener() {
      if (DEBUG_REALTIME) console.log(`🔔 [Realtime] Iniciando listener para citas de profesional: ${profesionalId}`)

      const subscription = supabase
        .channel(`citas:profesionalId:${profesionalId}`)
        .on<Cita>(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'citas',
            filter: `profesional_id=eq.${profesionalId}`,
          },
          (payload: any) => {
            if (!isMounted) return
            const DEBUG_EVENT = false
            if (DEBUG_EVENT) {
              console.log(`🔔 [Realtime] Evento citas:`, {
                event: payload.eventType,
                new: payload.new,
                old: payload.old,
              })
            }

            setCitas((prev) => {
              if (payload.eventType === 'INSERT') {
                return [...prev, payload.new as Cita]
              } else if (payload.eventType === 'UPDATE') {
                return prev.map((c) => (c.id === payload.new.id ? (payload.new as Cita) : c))
              } else if (payload.eventType === 'DELETE') {
                return prev.filter((c) => c.id !== payload.old.id)
              }
              return prev
            })
          }
        )
        .subscribe((status) => {
          if (DEBUG_REALTIME) console.log(`🔌 [Realtime] Citas listener status:`, status)
        })

      return subscription
    }

    // Cargar datos iniciales
    fetchInitialNotifications()

    // Setup listener
    const subscription = setupRealtimeListener()

    return () => {
      isMounted = false
      subscription.unsubscribe()
      if (DEBUG_REALTIME) console.log('🛑 [Realtime] Listener de citas detenido')
    }
  }, [profesionalId, enabled])

  return {
    citas,
    loading,
  }
}
