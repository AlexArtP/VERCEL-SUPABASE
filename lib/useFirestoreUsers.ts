/**
 * ARCHIVO: lib/useFirestoreUsers.ts
 * PROPÓSITO: Hook para obtener y sincronizar usuarios de Firestore
 */

'use client'

import { useState, useEffect } from 'react'
import { db, onAuthStateChange } from './firebaseConfig'
import { collection, query, onSnapshot, updateDoc, deleteDoc, doc, where, getDocs, getDoc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

export interface FirestoreUser {
  id: string
  email: string
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  run: string
  telefono?: string
  profesion?: string
  rol?: string
  esAdmin?: boolean
  activo?: boolean
  estado?: string
  fechaRegistro?: string
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
}

export function useFirestoreUsers(): UseFirestoreUsersReturn {
  const [usuarios, setUsuarios] = useState<FirestoreUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentAuthUser, setCurrentAuthUser] = useState<any>(null)

  // Obtener usuarios en tiempo real
  useEffect(() => {
    setLoading(true)
    setError(null)

    let unsubscribe: (() => void) | null = null

    try {
      // authUnsub podrá ser asignado dentro del IIFE
      let authUnsubLocal: (() => void) | null = null

      // Usar el helper onAuthStateChange exportado por firebaseConfig
      authUnsubLocal = onAuthStateChange(async (user) => {
        // Guardar el usuario actual para usarlo en updateUser
        setCurrentAuthUser(user)
        if (!user) {
          // No autenticado: intentar obtener usuarios desde endpoint servidor (/api/admin/get-users)
          // que usa Firebase Admin SDK para leer Firestore sin requerir cliente autenticado
          try {
            const response = await fetch('/api/admin/get-users')
            if (response.ok) {
              const data = await response.json()
              if (data.success && data.usuarios) {
                setUsuarios(data.usuarios.map((d: any) => ({ id: d.id, ...(d as any) } as FirestoreUser)))
                console.log(`✅ Usuarios cargados desde servidor: ${data.count}`)
                setLoading(false)
                return
              }
            }
          } catch (e: any) {
            console.warn('⚠️ No se pudo obtener usuarios del servidor:', e.message)
          }
          
          // Si falla el servidor, fallback a DEMO_DATA para desarrollo
          try {
            const demoUsuarios = (await import('./demoData')).DEMO_DATA.usuarios || []
            setUsuarios(demoUsuarios.map((d: any) => ({ id: d.id, ...(d as any) })))
            console.log('✅ Usando DEMO_DATA (servidor no disponible)')
          } catch (e) {
            setUsuarios([])
          }
          setLoading(false)
          return
        }

        try {
          // Leer documento del usuario para saber si es admin
          const userDocRef = doc(db, 'usuarios', user.uid)
          const userSnap = await getDoc(userDocRef)
          const isAdmin = userSnap.exists() && (userSnap.data() as any).esAdmin === true

          if (isAdmin) {
            // Admin: suscribirse a todos los usuarios
            const qAll = query(collection(db, 'usuarios'))
            unsubscribe = onSnapshot(
              qAll,
              (snapshot) => {
                const usuariosList: FirestoreUser[] = []
                snapshot.forEach((d) => usuariosList.push({ id: d.id, ...(d.data() as any) } as FirestoreUser))
                console.log(`✅ Usuarios (admin) cargados: ${usuariosList.length}`)
                setUsuarios(usuariosList)
                setLoading(false)
              },
              (err) => {
                console.error('❌ Error obteniendo usuarios (admin):', err.code, err.message)
                setError(err.message)
                setLoading(false)
              }
            )
          } else {
            // No admin: suscribirse solo a profesionales activos
            const qProf = query(collection(db, 'usuarios'), where('rol', '==', 'profesional'), where('activo', '==', true))
            unsubscribe = onSnapshot(
              qProf,
              async (snapshot) => {
                const profList: FirestoreUser[] = []
                snapshot.forEach((d) => profList.push({ id: d.id, ...(d.data() as any) } as FirestoreUser))

                // Además traer el propio usuario (para mostrar su perfil en UI) con get
                try {
                  const meSnap = await getDoc(doc(db, 'usuarios', user.uid))
                  if (meSnap.exists()) {
                    const me = { id: meSnap.id, ...(meSnap.data() as any) } as FirestoreUser
                    // Evitar duplicados
                    const exists = profList.find((p) => p.id === me.id)
                    if (!exists) profList.unshift(me)
                  }
                } catch (meErr: any) {
                  console.warn('⚠️ No se pudo obtener el perfil propio:', meErr.message)
                }

                console.log(`✅ Profesionales cargados: ${profList.length}`)
                setUsuarios(profList)
                setLoading(false)
              },
              (err) => {
                console.error('❌ Error obteniendo profesionales:', err.code, err.message)
                setError(err.message)
                setLoading(false)
              }
            )
          }
        } catch (innerErr: any) {
          console.error('❌ Error comprobando rol admin:', innerErr)
          setError(innerErr.message || String(innerErr))
          setLoading(false)
        }
      })

      // Cleanup: cancelar listeners
      return () => {
        try {
          if (typeof unsubscribe === 'function') unsubscribe()
        } catch (e) {
          console.warn('Error calling unsubscribe:', e)
        }
        try {
          if (typeof authUnsubLocal === 'function') authUnsubLocal()
        } catch (e) {
          console.warn('Error calling authUnsubLocal:', e)
        }
      }
    } catch (err: any) {
      console.error('❌ Error configurando listener:', err)
      setError(err.message)
      setLoading(false)
    }
  }, [])

  // Actualizar usuario
  const updateUser = async (userId: string, updates: Partial<FirestoreUser>) => {
    try {
      // Estrategia de obtención de usuario (en orden de preferencia):
      // 1. Desde localStorage (más confiable en cliente)
      // 2. Desde Firebase Auth
      // 3. Desde estado React
      
      let currentUserId: string | null = null
      let currentUser: any = null
      
      // Intento 1: Obtener del localStorage (almacenado en login)
      try {
        // Nuevo formato: sistema_auth_token con { token, userId, expiry } o { id, email, ... }
        const rawToken = localStorage.getItem('sistema_auth_token')
        if (rawToken) {
          try {
            const parsed = JSON.parse(rawToken)
            // Soportar ambos formatos: { userId } del login por API, o { id } del login directo
            if (parsed && (parsed.userId || parsed.id)) {
              currentUserId = parsed.userId || parsed.id
              console.log(`✅ Usuario obtenido desde sistema_auth_token: ${currentUserId}`)
            }
          } catch {
            // Ignorar si no es JSON válido
          }
        }

        // Formato antiguo: clave separada 'usuario_id'
        if (!currentUserId) {
          const storedUserId = localStorage.getItem('usuario_id')
          if (storedUserId) {
            currentUserId = storedUserId
            console.log(`✅ Usuario obtenido desde localStorage (usuario_id): ${currentUserId}`)
          }
        }
      } catch (e) {
        console.warn('⚠️ No se pudo acceder a localStorage')
      }
      
      // Intento 2: Si no está en localStorage, usar Firebase Auth
      if (!currentUserId) {
        const auth = getAuth()
        currentUser = auth.currentUser
        if (currentUser) {
          currentUserId = currentUser.uid
          console.log(`✅ Usuario obtenido desde Firebase Auth: ${currentUserId}`)
        }
      }
      
      // Intento 3: Si aún no hay usuario, usar el estado
      if (!currentUserId && currentAuthUser) {
        currentUserId = currentAuthUser.uid
        currentUser = currentAuthUser
        console.log(`✅ Usuario obtenido desde estado: ${currentUserId}`)
      }
      
      console.log(`🔐 Intentando actualizar usuario ${userId}`, {
        currentUserExists: !!currentUserId,
        currentUserId,
        updates,
      })
      
      // Si no hay usuario, es un error
      if (!currentUserId) {
        throw new Error('No hay usuario autenticado. Por favor, inicia sesión nuevamente.')
      }
      
      // Obtener el token del usuario
      let authHeader = ''
      
      // Si tenemos el objeto currentUser, obtener token de él
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken(true) // force refresh
          authHeader = `Bearer ${token}`
          console.log(`✅ Token obtenido para usuario: ${currentUserId}`)
        } catch (err: any) {
          console.warn('⚠️ No se pudo obtener token de Firebase Auth:', err.message)
          // Continuar sin token, el servidor lo puede verificar desde localStorage
        }
      } else {
        console.warn('⚠️ No hay objeto currentUser disponible, enviando sin token')
        // El servidor validará basado en currentUserId
      }

      console.log(`📤 Enviando solicitud a /api/admin/update-user`, {
        userId,
        currentUserId,
        hasToken: !!authHeader,
      })

      // Usar el endpoint del servidor que valida permisos
      const response = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader && { 'Authorization': authHeader }),
        },
        body: JSON.stringify({
          userId,
          currentUserId, // Pasar el ID del usuario actual como referencia
          updates,
        }),
      })

      const data = await response.json()

      console.log(`📥 Respuesta del servidor:`, {
        ok: response.ok,
        status: response.status,
        success: data.success,
        error: data.error,
      })

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar usuario')
      }

      console.log('✅ Usuario actualizado:', userId, updates)

      // Optimistic update: reflejar inmediatamente en el estado local
      try {
        setUsuarios((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updates } as FirestoreUser : u)))
      } catch (e) {
        console.warn('⚠️ No se pudo aplicar optimistic update en memoria')
      }

      // Refetch de respaldo: por si no hay listener activo (no-admin o auth no inicializado)
      try {
        // Pequeño retraso para evitar leer datos antiguos por consistencia eventual
        await new Promise((r) => setTimeout(r, 400))
        const refetch = await fetch('/api/admin/get-users', { cache: 'no-store' as RequestCache })
        if (refetch.ok) {
          const json = await refetch.json()
          if (json.success && json.usuarios) {
            const lista = json.usuarios.map((d: any) => ({ id: d.id, ...(d as any) } as FirestoreUser))
            setUsuarios(lista)
            console.log('🔁 Lista de usuarios actualizada desde servidor (post-update)')

            // Verificar que el cambio está reflejado; si no, reintentar una vez
            const actualizado = lista.find((u: FirestoreUser) => u.id === userId)
            const clave = Object.keys(updates)[0] as keyof FirestoreUser
            if (actualizado && clave && actualizado[clave] !== (updates as any)[clave]) {
              await new Promise((r) => setTimeout(r, 600))
              const refetch2 = await fetch('/api/admin/get-users', { cache: 'no-store' as RequestCache })
              if (refetch2.ok) {
                const json2 = await refetch2.json()
                if (json2.success && json2.usuarios) {
                  setUsuarios(json2.usuarios.map((d: any) => ({ id: d.id, ...(d as any) } as FirestoreUser)))
                  console.log('🔁 Reintento de actualización aplicado')
                }
              }
            }
          }
        }
      } catch (e) {
        // Silencioso: si falla, al menos queda el optimistic update
      }
    } catch (err: any) {
      console.error('❌ Error actualizando usuario:', err.message)
      throw new Error(err.message)
    }
  }

  // Eliminar usuario
  const deleteUser = async (userId: string) => {
    try {
      if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
        await deleteDoc(doc(db, 'usuarios', userId))
        console.log('✅ Usuario eliminado:', userId)
      }
    } catch (err: any) {
      console.error('❌ Error eliminando usuario:', err.code, err.message)
      
      let errorMessage = err.message
      if (err.code === 'permission-denied') {
        errorMessage = 'Permiso denegado. Solo admins pueden eliminar usuarios.'
      }
      
      throw new Error(errorMessage)
    }
  }

  // Toggle usuario activo/inactivo
  const toggleUserActive = async (userId: string) => {
    try {
      const usuario = usuarios.find((u) => u.id === userId)
      if (usuario) {
        await updateUser(userId, { activo: !usuario.activo })
        console.log('✅ Estado del usuario actualizado:', userId)
      }
    } catch (err: any) {
      console.error('❌ Error toggling usuario activo:', err)
      throw err
    }
  }

  // Toggle usuario admin
  const toggleUserAdmin = async (userId: string) => {
    try {
      const usuario = usuarios.find((u) => u.id === userId)
      if (usuario) {
        await updateUser(userId, { esAdmin: !usuario.esAdmin })
        console.log('✅ Estado admin del usuario actualizado:', userId)
      }
    } catch (err: any) {
      console.error('❌ Error toggling usuario admin:', err)
      throw err
    }
  }

  // Cambiar rol del usuario
  const changeUserRole = async (userId: string, newRole: string) => {
    try {
      await updateUser(userId, { rol: newRole })
      console.log('✅ Rol del usuario actualizado:', userId, newRole)
    } catch (err: any) {
      console.error('❌ Error cambiando rol:', err)
      throw err
    }
  }

  return {
    usuarios,
    loading,
    error,
    updateUser,
    deleteUser,
    toggleUserActive,
    toggleUserAdmin,
    changeUserRole,
  }
}
