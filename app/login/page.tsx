/**
 * ARCHIVO: app/login/page.tsx
 * PROPÓSITO: Página de login simple para acceder al sistema
 * 
 * Permite a los usuarios iniciar sesión con:
 * - Email y contraseña de demostración (almacenadas localmente)
 * - Redirige a /admin/init-database para admin
 * - Redirige a / para usuarios normales
 * 
 * NOTA: En producción, esto debería autenticar contra Firebase Auth
 * Por ahora, usamos autenticación local con localStorage para demostración
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DEMO_DATA } from '@/lib/demoData'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Mail, AlertCircle } from 'lucide-react'

/**
 * Función auxiliar: Validar credenciales contra datos de demostración
 */
function validateDemoCredentials(email: string, password: string): any | null {
  const usuario = DEMO_DATA.usuarios.find((u: any) => u.email === email)
  if (usuario && password === 'demo123') {
    return usuario
  }
  return null
}

/**
 * Función auxiliar: Crear y almacenar token
 */
function createAndStoreToken(usuario: any) {
  const token = {
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    rol: usuario.rol,
    timestamp: Date.now()
  }
  localStorage.setItem('sistema_auth_token', JSON.stringify(token))
  localStorage.setItem('usuario_id', usuario.id.toString())
  return token
}

/**
 * Función auxiliar: Verificar si hay token guardado
 */
function getStoredToken() {
  const token = localStorage.getItem('sistema_auth_token')
  if (token) {
    try {
      return JSON.parse(token)
    } catch {
      return null
    }
  }
  return null
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('juan.perez@clinica.cl')
  const [password, setPassword] = useState('demo123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Verificar si ya está autenticado
  useEffect(() => {
    const token = getStoredToken()
    if (token) {
      // Ya está autenticado, redirigir
      const isAdmin = token.rol === 'administrador' || token.rol === 'recepcionista'
      if (isAdmin && email === 'juan.perez@clinica.cl') {
        router.push('/admin/init-database')
      } else {
        router.push('/')
      }
    }
    setIsCheckingAuth(false)
  }, [router])

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')
  setLoading(true)

  try {
    // Intentar login con Supabase Auth via endpoint
    console.log('🔐 Intentando login con Supabase Auth...')
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const { success, userData, error: apiError } = await loginResponse.json()

    if (success && userData) {
      console.log('✅ Login Supabase exitoso')
      // Guardar token en localStorage
      localStorage.setItem('sistema_auth_token', JSON.stringify(userData.token || userData))
      
      // Redirigir según rol
      const isAdmin = userData?.is_admin === true || userData?.esAdmin === true
      if (isAdmin) {
        router.push('/admin/init-database')
      } else {
        router.push('/')
      }
      return
    }

    // Fallback: Intentar con credenciales de demostración
    console.log('⚠️ Supabase Auth falló, intentando con demo...')
    const demoUser = validateDemoCredentials(email, password)
    
    if (demoUser) {
      console.log('✅ Login demo exitoso')
      createAndStoreToken(demoUser)
      
      // Redirigir según rol
      const isAdmin = demoUser.rol === 'administrador' || demoUser.rol === 'recepcionista'
      if (isAdmin && demoUser.email === 'juan.perez@clinica.cl') {
        router.push('/admin/init-database')
      } else {
        router.push('/')
      }
    } else {
      setError(apiError || 'Email o contraseña incorrectos')
    }
  } catch (err) {
    console.error('❌ Error en handleLogin:', err)
    setError(err instanceof Error ? err.message : 'Error desconocido')
  } finally {
    setLoading(false)
  }
}

  const handleDemoLogin = async (demoUser: any) => {
    setError('')
    setLoading(true)

    try {
      // Crear y guardar token
      createAndStoreToken(demoUser)

      // Redirigir según rol
      const isAdmin = demoUser.rol === 'administrador' || demoUser.rol === 'recepcionista'
      if (isAdmin && demoUser.email === 'juan.perez@clinica.cl') {
        router.push('/admin/init-database')
      } else {
        router.push('/')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <p className="text-gray-600">Verificando autenticación...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Encabezado */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🗓️ Agendamiento</h1>
          <p className="text-gray-600">Sistema de citas online</p>
        </div>

        {/* Tarjeta de login */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>
              Usa las credenciales de demostración para acceder
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error general */}
            {error && (
              <Alert className="bg-red-50 border-red-300">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Formulario */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="juan.perez@clinica.cl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="demo123"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Botón login */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {loading ? '⏳ Iniciando sesión...' : '🔓 Iniciar Sesión'}
              </Button>
            </form>

            {/* Divisor */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">O prueba con</span>
              </div>
            </div>

            {/* Botones de usuarios demo */}
            <div className="grid grid-cols-2 gap-2">
              {DEMO_DATA.usuarios.slice(0, 4).map((usuario: any) => (
                <Button
                  key={usuario.id}
                  type="button"
                  variant="outline"
                  onClick={() => handleDemoLogin(usuario)}
                  disabled={loading}
                  className="text-xs"
                  size="sm"
                >
                  {usuario.nombre}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Información de demostración */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="space-y-3 text-sm text-gray-700">
              <p className="font-semibold text-blue-900">📋 Usuarios de demostración:</p>
              <ul className="space-y-1 text-xs">
                <li>
                  <strong>Admin:</strong> juan.perez@clinica.cl<br />
                  <span className="text-gray-600">Contraseña: demo123</span>
                </li>
                <li>
                  <strong>Admin:</strong> carlos.ramirez@clinica.cl<br />
                  <span className="text-gray-600">Contraseña: demo123</span>
                </li>
                <li>
                  <strong>Profesional:</strong> maria.silva@clinica.cl<br />
                  <span className="text-gray-600">Contraseña: demo123</span>
                </li>
              </ul>
              <p className="text-xs text-gray-600 pt-2">
                Todos usan la misma contraseña: <code className="bg-white px-2 py-1 rounded">demo123</code>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-600">
          <p>Sistema de agendamiento • Versión Beta</p>
          <p className="mt-3">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              Solicita acceso aquí
            </Link>
          </p>
        </div>
      </div>
      {/* Versión en esquina inferior derecha */}
      <div style={{ position: 'fixed', right: 12, bottom: 8, zIndex: 100, pointerEvents: 'none' }}>
        <span className="text-xs text-gray-400 select-none">V 1.1.1</span>
      </div>
    </div>
  )
}
