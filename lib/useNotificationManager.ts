/**
 * ARCHIVO: lib/useNotificationManager.ts (REFACTORIZADO - Supabase Realtime)
 * PROPÓSITO: Hook para obtener notificaciones via listeners en tiempo real
 * 
 * Cambio: polling cada 10s → Supabase Realtime (eventos push, economía optimizada)
 */

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useNotifications } from '@/contexts/NotificationContext'

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  read: boolean
  createdAt: string
  data?: Record<string, any>
}

/**
 * Hook que obtiene notificaciones del usuario actual via Supabase Realtime
 * @param userId - ID del usuario
 */
export function useNotificationManager(userId: string | null) {
  const { addNotification } = useNotifications()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const DEBUG = false

  useEffect(() => {
    if (!userId) {
      setNotifications([])
      setLoading(false)
      return
    }

    let isMounted = true
    const DEBUG_REALTIME = false

    // Fetch inicial de notificaciones
    async function fetchInitialNotifications() {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) throw error
        if (isMounted) {
          setNotifications((data as Notification[]) || [])
          setLoading(false)
          if (DEBUG_REALTIME) console.log(`📌 Notificaciones iniciales cargadas: ${(data || []).length}`)
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('❌ Error cargando notificaciones iniciales:', err)
          setLoading(false)
        }
      }
    }

    // Setup del listener Realtime
    function setupRealtimeListener() {
      if (DEBUG_REALTIME) console.log(`🔔 [Realtime] Iniciando listener para notificaciones de usuario: ${userId}`)

      const subscription = supabase
        .channel(`notifications:userId:${userId}`)
        .on<Notification>(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload: any) => {
            if (!isMounted) return
            const DEBUG_EVENT = false
            if (DEBUG_EVENT) {
              console.log(`🔔 [Realtime] Evento notificaciones:`, {
                event: payload.eventType,
                new: payload.new,
              })
            }

            setNotifications((prev) => {
              if (payload.eventType === 'INSERT') {
                // Agregar al inicio (más reciente primero)
                return [payload.new as Notification, ...prev]
              } else if (payload.eventType === 'UPDATE') {
                return prev.map((n) => (n.id === payload.new.id ? (payload.new as Notification) : n))
              } else if (payload.eventType === 'DELETE') {
                return prev.filter((n) => n.id !== payload.old.id)
              }
              return prev
            })
          }
        )
        .subscribe((status) => {
          if (DEBUG_REALTIME) console.log(`🔌 [Realtime] Notificaciones listener status:`, status)
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
      if (DEBUG_REALTIME) console.log('🛑 [Realtime] Listener de notificaciones detenido')
    }
  }, [userId])

  return {
    notifications,
    loading,
  }
}
