/**
 * ARCHIVO: contexts/AuthContext.tsx
 * PROPÓSITO: Gestionar el estado de autenticación globalmente
 * 
 * Este contexto proporciona:
 * - Usuario actual autenticado
 * - Funciones de login/logout
 * - Estado de carga
 * - Errores de autenticación
 */

'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from 'firebase/auth'


/**
 * INTERFAZ: Forma del contexto de autenticación
 */
interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

/**
 * CREAR contexto
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * PROVEEDOR: AuthProvider
 * 
 * Envuelve la aplicación y proporciona autenticación a todos los componentes
 * 
 * Ejemplo de uso en app/layout.tsx:
 *   <AuthProvider>
 *     {children}
 *   </AuthProvider>
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Efecto: Escuchar cambios en autenticación
   * 
   * Se ejecuta cuando la aplicación carga
   * Configura un listener que detecta cuando el usuario inicia/cierra sesión
   */
  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    // Lazy-load firebase helpers only when needed (reduces initial bundle)
    import('@/lib/firebaseConfig')
      .then((mod) => {
        try {
          const currentUser = mod.getCurrentUser()
          setUser(currentUser)

          // Escuchar cambios futuros
          unsubscribe = mod.onAuthStateChange((firebaseUser: User | null) => {
            setUser(firebaseUser)
            setLoading(false)
          })
        } catch (e) {
          setLoading(false)
        }
      })
      .catch(() => {
        setLoading(false)
      })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  /**
   * FUNCIÓN: Login
   * 
   * Intenta iniciar sesión con email y contraseña
   */
  const handleLogin = async (email: string, password: string) => {
    try {
      setError(null)
      setLoading(true)
      // Lazy-import the login function
      const mod = await import('@/lib/firebaseConfig')
      await mod.loginUser(email, password)
      setLoading(false)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMsg)
      setLoading(false)
      throw err
    }
  }

  /**
   * FUNCIÓN: Logout
   * 
   * Cierra la sesión del usuario
   */
  const handleLogout = async () => {
    try {
      setError(null)
      const mod = await import('@/lib/firebaseConfig')
      await mod.logoutUser()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMsg)
      throw err
    }
  }

  // Valor que se proporciona a todos los componentes
  const value: AuthContextType = {
    user,
    loading,
    error,
    login: handleLogin,
    logout: handleLogout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * HOOK: useAuth
 * 
 * Permite a cualquier componente acceder al contexto de autenticación
 * 
 * Ejemplo de uso:
 *   function MyComponent() {
 *     const { user, login, logout } = useAuth()
 *     
 *     if (user) {
 *       return <p>Hola {user.displayName}</p>
 *     }
 *     return <button onClick={() => login(email, password)}>Login</button>
 *   }
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error(
      'useAuth debe ser usado dentro de un AuthProvider. Verifica que tu componente está dentro de <AuthProvider> en app/layout.tsx'
    )
  }
  return context
}
