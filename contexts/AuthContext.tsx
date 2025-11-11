/**
 * ARCHIVO: contexts/AuthContext.tsx
 * PROPÓSITO: Gestionar el estado de autenticación globalmente
 * 
 * Este contexto proporciona:
 * - Usuario actual autenticado
 * - Estado de carga
 * - Errores de autenticación
 * 
 * NOTA: El login/logout ahora se manejan en app/page.tsx con Supabase Auth
 * Este contexto puede usarse para persistencia de sesión en el futuro
 */

'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

/**
 * INTERFAZ: Forma del contexto de autenticación
 */
interface AuthContextType {
  user: any | null
  loading: boolean
  error: string | null
}

/**
 * CREAR contexto
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * PROVEEDOR: AuthProvider
 * 
 * Envuelve la aplicación y proporciona estado de autenticación a todos los componentes
 * 
 * Ejemplo de uso en app/layout.tsx:
 *   <AuthProvider>
 *     {children}
 *   </AuthProvider>
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Efecto: Restaurar sesión desde localStorage
   * 
   * Se ejecuta cuando la aplicación carga
   * Intenta restaurar el usuario desde el token guardado en localStorage
   */
  useEffect(() => {
    try {
      const TOKEN_KEY = 'sistema_auth_token'
      const storedToken = localStorage.getItem(TOKEN_KEY)

      if (storedToken) {
        const tokenData = JSON.parse(storedToken)
        
        // Verificar que el token no está expirado
        if (tokenData.expiry && tokenData.expiry > Date.now()) {
          // Restaurar datos del usuario desde el token
          setUser({
            id: tokenData.id,
            email: tokenData.email,
            nombre: tokenData.nombre,
            esAdmin: tokenData.esAdmin
          })
        } else {
          // Token expirado, limpiar
          localStorage.removeItem(TOKEN_KEY)
        }
      }
    } catch (err) {
      console.warn('Error restaurando sesión desde localStorage:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Valor que se proporciona a todos los componentes
  const value: AuthContextType = {
    user,
    loading,
    error,
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
 *     const { user, loading } = useAuth()
 *     
 *     if (loading) return <p>Cargando...</p>
 *     if (user) {
 *       return <p>Hola {user.nombre}</p>
 *     }
 *     return <p>No autenticado</p>
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
