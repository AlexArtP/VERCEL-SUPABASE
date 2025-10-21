/**
 * ARCHIVO: app/admin/init-database/page.tsx
 * PROPÓSITO: Panel de inicialización de base de datos (SOLO ADMIN)
 * 
 * Esta página permite inicializar la base de datos desde la interfaz
 * IMPORTANTE: Solo debe ser accesible para administradores
 * 
 * NOTA: Las operaciones se realizan vía API endpoints (server-side)
 * para evitar problemas de compilación de Webpack en el cliente
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { DEMO_DATA } from '@/lib/demoData'

/**
 * Función auxiliar: Obtener token almacenado
 */
function getStoredToken() {
  if (typeof window === 'undefined') return null
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

export default function InitDatabasePage() {
  const router = useRouter()
  const [token, setToken] = useState<any>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [stats, setStats] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [showWipeConfirm, setShowWipeConfirm] = useState(false)

  // Verificar autenticación al cargar
  useEffect(() => {
    const storedToken = getStoredToken()
    if (!storedToken) {
      // Redirigir a login
      router.push('/login')
      return
    }
    
    // Verificar si es admin (buscar en DEMO_DATA para verificar esAdmin)
    const usuario = DEMO_DATA.usuarios.find((u: any) => u.email === storedToken.email)
    const isAdmin = usuario?.esAdmin === true
    
    if (!isAdmin) {
      setError('No tienes permiso para acceder a esta página. Solo administradores.')
      setIsCheckingAuth(false)
      return
    }

    setToken(storedToken)
    setIsCheckingAuth(false)
  }, [router])

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  if (error && error.includes('permiso')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 mb-2">{error}</p>
                <Link href="/">
                  <Button variant="outline" size="sm">
                    Volver al inicio
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-amber-300 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900 mb-2">
                  Debes iniciar sesión para acceder
                </p>
                <Link href="/login">
                  <Button className="w-full">Ir a login</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  /**
   * FUNCIÓN: Inicializar base de datos (llamando a API endpoint)
   */
  const handleInitialize = async () => {
    try {
      setLoading(true)
      setError('')
      setMessage('Inicializando base de datos...')

      const response = await fetch('/api/admin/init-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token?.email}`,
        },
      })

      const result = await response.json()

      if (!response.ok) {
        setError(`⚠️ Error: ${result.error || 'Error desconocido'}`)
        return
      }

      if (result.success) {
        setMessage(`✅ ${result.message}`)
        
        // Obtener estadísticas actualizadas
        await new Promise(resolve => setTimeout(resolve, 1500))
        const statsResponse = await fetch('/api/admin/stats')
        const statsData = await statsResponse.json()
        setStats(statsData)
      } else {
        setError(`⚠️ ${result.message}`)
        if (result.errors?.length > 0) {
          setError(prev => prev + '\n' + result.errors.join('\n'))
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(`❌ Error: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  /**
   * FUNCIÓN: Obtener estadísticas actuales (desde API endpoint)
   */
  const handleCheckStats = async () => {
    try {
      setLoading(true)
      const statsResponse = await fetch('/api/admin/stats')
      const currentStats = await statsResponse.json()
      
      if (!statsResponse.ok) {
        setError(`Error obteniendo estadísticas: ${currentStats.error}`)
      } else {
        setStats(currentStats)
        setMessage('📊 Estadísticas actualizadas')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(`Error obteniendo estadísticas: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  /**
   * FUNCIÓN: Limpiar base de datos (solo con confirmación)
   */
  const handleWipeDatabase = async () => {
    try {
      setLoading(true)
      setError('')
      setMessage('⚠️ Limpiando base de datos...')

      const response = await fetch('/api/admin/wipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token?.email}`,
        },
        body: JSON.stringify({ confirm: true }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(`Error limpiando BD: ${result.error}`)
        return
      }

      setMessage('✅ Base de datos limpiada')
      setShowWipeConfirm(false)

      // Actualizar estadísticas
      const statsResponse = await fetch('/api/admin/stats')
      const updatedStats = await statsResponse.json()
      setStats(updatedStats)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(`Error limpiando BD: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🔧 Panel de Administración
          </h1>
          <p className="text-gray-600">
            Inicialización de Base de Datos Firebase
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Autenticado como: <span className="font-mono font-bold">{token?.email}</span>
          </p>
        </div>

        {/* Alerta de error */}
        {error && (
          <Alert className="mb-6 bg-red-50 border-red-300">
            <AlertDescription className="text-red-800 whitespace-pre-line">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Mensaje de estado */}
        {message && !error && (
          <Alert className="mb-6 bg-blue-50 border-blue-300">
            <AlertDescription className="text-blue-800">
              {message}
            </AlertDescription>
          </Alert>
        )}

        {/* Tarjeta principal */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Inicializar Base de Datos</CardTitle>
            <CardDescription>
              Crea automáticamente todas las colecciones e importa los datos iniciales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Esta acción:
            </p>
            <ul className="text-sm text-gray-600 space-y-2 ml-4">
              <li>✓ Crea usuarios con autenticación Firebase</li>
              <li>✓ Importa pacientes a la base de datos</li>
              <li>✓ Crea plantillas de módulos (templates)</li>
              <li>✓ Importa módulos (slots de calendario)</li>
              <li>✓ Importa citas agendadas</li>
              <li>⚠️ Solo se ejecuta UNA VEZ (por seguridad)</li>
            </ul>

            <Button
              onClick={handleInitialize}
              disabled={loading}
              className="w-full mt-6 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {loading ? '⏳ Inicializando...' : '🚀 Inicializar Base de Datos'}
            </Button>
          </CardContent>
        </Card>

        {/* Tarjeta de estadísticas */}
        {stats && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>📊 Estadísticas Actuales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600">Usuarios</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.usuarios}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600">Pacientes</p>
                  <p className="text-2xl font-bold text-green-600">{stats.pacientes}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600">Citas</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.citas}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600">Módulos</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.modulos}</p>
                </div>
                <div className="bg-pink-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600">Plantillas</p>
                  <p className="text-2xl font-bold text-pink-600">{stats.plantillas}</p>
                </div>
              </div>

              <Button
                onClick={handleCheckStats}
                disabled={loading}
                variant="outline"
                className="w-full mt-4"
              >
                {loading ? '⏳ Actualizando...' : '🔄 Actualizar Estadísticas'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tarjeta peligrosa - Limpiar BD */}
        <Card className="bg-red-50 border-red-300">
          <CardHeader>
            <CardTitle className="text-red-700">⚠️ Zona de Peligro</CardTitle>
            <CardDescription>
              Acciones destructivas que no se pueden deshacer
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showWipeConfirm ? (
              <Button
                onClick={() => setShowWipeConfirm(true)}
                variant="destructive"
                className="w-full"
              >
                🗑️ Limpiar Toda la Base de Datos
              </Button>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-red-700 font-semibold">
                  ⚠️ ADVERTENCIA: Esto eliminará TODOS los datos. No se puede deshacer.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleWipeDatabase}
                    disabled={loading}
                    variant="destructive"
                    className="flex-1"
                  >
                    {loading ? '⏳ Borrando...' : '🗑️ Confirmar Eliminación'}
                  </Button>
                  <Button
                    onClick={() => setShowWipeConfirm(false)}
                    variant="outline"
                    disabled={loading}
                    className="flex-1"
                  >
                    ❌ Cancelar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instrucciones */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">📖 Instrucciones</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-700 space-y-3">
            <p>
              <strong>1. Primera vez:</strong> Haz clic en "Inicializar Base de Datos"
            </p>
            <p>
              <strong>2. Verificación:</strong> Las estadísticas mostrarán cuántos datos se importaron
            </p>
            <p>
              <strong>3. Próximas veces:</strong> La inicialización detectará que ya existe y no hará nada
            </p>
            <p>
              <strong>Limpiar BD:</strong> Solo si necesitas empezar de cero (DESTRUCTIVO)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
