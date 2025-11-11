/**
 * ARCHIVO: lib/useFirestoreUsers.ts (REFACTORIZADO - Supabase Realtime)
 * PROPÓSITO: Hook para obtener y sincronizar usuarios via Realtime listeners
 * Cambio: polling cada 5s → Supabase Realtime (eventos push, economía optimizada)
 */

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface FirestoreUser {
  id: string
  userid?: string
  email: string
  nombre: string
  apellidos?: string
  apellido_paterno?: string
  apellido_materno?: string
  run?: string
  telefono?: string
  profesion?: string
  rol?: string
  esAdmin?: boolean
  es_admin?: boolean
  esadmin?: boolean
  activo?: boolean
  activ?: boolean
  estado?: string
  fechaRegistro?: string
  created_at?: string
  updated_at?: string
  estamento?: string | null  // DEPRECATED: Use 'profesion' instead
  sobre_ti?: string | null
  cargo_actual?: string | null
  profesional?: boolean
  direccion?: string | null
  foto_perfil?: string | null
}

export interface UseFirestoreUsersReturn {
  usuarios: FirestoreUser[]
  loading: boolean
  error: string | null
  updateUser: (userId: string, updates: Partial<FirestoreUser>) => Promise<void>
  deleteUser: (userId: string) => Promise<void>
  toggleUserActive: (userId: string) => Promise<void>
  toggleUserAdmin: (userId: string) => Promise<void>
  changeUserRole: (userId: string, newRole: string) => Promise<void>
  changeUserStatus: (userId: string, estado: 'pendiente' | 'aprobado' | 'rechazado') => Promise<void>
}

export function useFirestoreUsers(): UseFirestoreUsersReturn {
  const [usuarios, setUsuarios] = useState<FirestoreUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const DEBUG = false

  useEffect(() => {
    let isMounted = true
    const DEBUG_REALTIME = false

    // Fetch inicial de usuarios
    async function fetchInitialUsuarios() {
      try {
        const { data, error: err } = await supabase
          .from('usuarios')
          .select('*')

        if (err) throw err
        if (isMounted) {
          setUsuarios((data as FirestoreUser[]) || [])
          setLoading(false)
          if (DEBUG_REALTIME) console.log(`📌 Usuarios iniciales cargados: ${(data || []).length}`)
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('❌ Error cargando usuarios iniciales:', err)
          setError(err.message)
          setLoading(false)
        }
      }
    }

    // Setup del listener Realtime
    function setupRealtimeListener() {
      if (DEBUG_REALTIME) console.log(`� [Realtime] Iniciando listener para usuarios`)

      const subscription = supabase
        .channel('usuarios:all')
        .on<FirestoreUser>(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'usuarios',
          },
          (payload: any) => {
            if (!isMounted) return
            const DEBUG_EVENT = false
            if (DEBUG_EVENT) {
              console.log(`🔔 [Realtime] Evento usuarios:`, {
                event: payload.eventType,
                new: payload.new,
              })
            }

            setUsuarios((prev) => {
              if (payload.eventType === 'INSERT') {
                return [...prev, payload.new as FirestoreUser]
              } else if (payload.eventType === 'UPDATE') {
                return prev.map((u) => (u.id === payload.new.id ? (payload.new as FirestoreUser) : u))
              } else if (payload.eventType === 'DELETE') {
                return prev.filter((u) => u.id !== payload.old.id)
              }
              return prev
            })
          }
        )
        .subscribe((status) => {
          if (DEBUG_REALTIME) console.log(`🔌 [Realtime] Usuarios listener status:`, status)
        })

      return subscription
    }

    // Cargar datos iniciales
    fetchInitialUsuarios()

    // Setup listener
    const subscription = setupRealtimeListener()

    return () => {
      isMounted = false
      subscription.unsubscribe()
      if (DEBUG_REALTIME) console.log('🛑 [Realtime] Listener de usuarios detenido')
    }
  }, [])

  const updateUser = async (userId: string, updates: Partial<FirestoreUser>) => {
    try {
      if (DEBUG) console.log(`✏️ Actualizando usuario: ${userId}`, updates)
      
      // Convertir nombres de campos camelCase a snake_case si es necesario
      const payload: Record<string, any> = {}
      
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined && value !== null) {
          // Mapeo de nombres de campos
          switch (key) {
            case 'apellidoPaterno':
              payload.apellido_paterno = value
              break
            case 'apellidoMaterno':
              payload.apellido_materno = value
              break
            default:
              payload[key] = value
          }
        }
      }

      const { data, error: err } = await supabase
        .from('usuarios')
        .update(payload)
        .eq('id', userId)
        .select()

      if (err) throw err
      
      if (DEBUG) console.log(`✅ Usuario actualizado:`, data)
    } catch (err: any) {
      if (DEBUG) console.error(`❌ Error actualizando usuario:`, err)
      throw err
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      const { error: err } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', userId)

      if (err) throw err
    } catch (err: any) {
      throw err
    }
  }

  const toggleUserActive = async (userId: string) => {
    const user = usuarios.find(u => u.id === userId)
    if (user) await updateUser(userId, { activo: !user.activo })
  }

  const toggleUserAdmin = async (userId: string) => {
    const user = usuarios.find(u => u.id === userId)
    if (user) await updateUser(userId, { esAdmin: !user.esAdmin })
  }

  const changeUserRole = async (userId: string, newRole: string) => {
    await updateUser(userId, { rol: newRole })
  }

  const changeUserStatus = async (userId: string, estado: 'pendiente' | 'aprobado' | 'rechazado') => {
    await updateUser(userId, { estado })
  }

  return { usuarios, loading, error, updateUser, deleteUser, toggleUserActive, toggleUserAdmin, changeUserRole, changeUserStatus }
}

