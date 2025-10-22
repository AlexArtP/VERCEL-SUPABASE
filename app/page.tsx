"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MainApp } from "@/components/MainApp"
import { NotificationProvider } from "@/contexts/NotificationContext"
import dynamic from 'next/dynamic'

// Lazy-load the registration modal wrapper on client only to avoid
// shipping its bundle on initial page load (improves TTI/hydration)
const RegistrationModalSuspense = dynamic(
  () => import('@/components/RegistrationModalWrapper').then(mod => mod.RegistrationModalSuspense),
  { ssr: false, loading: () => null }
)
import { DEMO_DATA } from "@/lib/demoData"
import { loginUser as firebaseLoginUser } from "@/lib/firebaseConfig"
import { User, Lock, Mail, AlertCircle } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const TOKEN_KEY = "sistema_auth_token"

  const createAndStoreToken = (userId: number) => {
    const token = Math.random().toString(36).slice(2) + "." + Date.now().toString(36)
    const expiry = Date.now() + 8 * 60 * 60 * 1000 // 8 horas
    const obj = { token, expiry, userId }
    try {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(obj))
    } catch (e) {
      // Si localStorage no está disponible, ignorar (ej. SSR)
    }
    return obj
  }

  const clearStoredToken = () => {
    try { localStorage.removeItem(TOKEN_KEY) } catch {}
  }
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [error, setError] = useState("")

  // Al montar, revisar si existe token válido y restaurar sesión
  useEffect(() => {
    try {
      // Intentar obtener el token del login de Firebase (nuevo formato)
      const firebaseToken = localStorage.getItem('sistema_auth_token')
      if (firebaseToken) {
        try {
          const token = JSON.parse(firebaseToken)
          if (token && token.id && token.email) {
            // Es un token del login de Firebase
            const user = {
              id: token.id,
              email: token.email,
              nombre: token.nombre,
              apellidos: token.apellidos,
              rol: token.rol,
              esAdmin: token.esAdmin,
              cambioPasswordRequerido: token.cambioPasswordRequerido || false,
              activo: true,
              password: 'N/A', // No se guarda en el token
              password_hash: '', // No aplica
            }
            setCurrentUser(user)
            setIsAuthenticated(true)
            return
          }
        } catch (e) {
          console.log('Token de Firebase no válido, intentando token antiguo...')
        }
      }

      // Fallback: Token antiguo
      const raw = localStorage.getItem(TOKEN_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (!parsed || !parsed.expiry || !parsed.userId) { localStorage.removeItem(TOKEN_KEY); return }
      if (parsed.expiry > Date.now()) {
        const user = DEMO_DATA.usuarios.find((u: any) => u.id === parsed.userId && u.activo)
        if (user) {
          setCurrentUser(user)
          setIsAuthenticated(true)
        } else {
          localStorage.removeItem(TOKEN_KEY)
        }
      } else {
        // token expirado
        localStorage.removeItem(TOKEN_KEY)
      }
    } catch (e) {
      // parsing error -> limpiar
      try { localStorage.removeItem(TOKEN_KEY) } catch {}
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Primero intentar login con Firebase Auth (nuevo sistema)
    if (loginForm.email && loginForm.password) {
      try {
        const response = await fetch('/api/auth/firebase-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: loginForm.email,
            password: loginForm.password
          })
        })

        const data = await response.json()

        if (response.ok && data.user) {
          console.log('✅ Login exitoso con Firebase Auth')
          console.log('🔐 Data recibida del servidor:', data)
          console.log('🔐 cambioPasswordRequerido:', data.user.cambioPasswordRequerido)
          // Iniciar sesión también en Firebase Auth del cliente para habilitar request.auth en Firestore rules
          try {
            await firebaseLoginUser(loginForm.email, loginForm.password)
            console.log('✅ Sesión creada en Firebase Auth (cliente)')
          } catch (e) {
            console.warn('⚠️ No se pudo autenticar en Firebase Auth del cliente. Firestore puede fallar por permisos.', e)
          }
          setCurrentUser({
            id: data.user.uid,
            email: data.user.email,
            nombre: data.user.nombre || data.user.email,
            apellidoPaterno: data.user.apellidoPaterno || '',
            apellidoMaterno: data.user.apellidoMaterno || '',
            profesion: data.user.profesion || '',
            rol: data.user.rol || 'administrativo',
            esAdmin: data.user.esAdmin || false,
            activo: data.user.activo !== false,
            cambioPasswordRequerido: data.user.cambioPasswordRequerido || false
          })
          setIsAuthenticated(true)
          try { 
            localStorage.setItem('sistema_auth_token', JSON.stringify({
              token: data.token,
              userId: data.user.uid,
              id: data.user.uid,
              email: data.user.email,
              nombre: data.user.nombre,
              apellidoPaterno: data.user.apellidoPaterno,
              apellidoMaterno: data.user.apellidoMaterno,
              profesion: data.user.profesion || '',
              rol: data.user.rol || 'administrativo',
              esAdmin: data.user.esAdmin,
              cambioPasswordRequerido: data.user.cambioPasswordRequerido,
              expiry: Date.now() + 8 * 60 * 60 * 1000
            }))
          } catch {}
          return
        } else {
          // Si falla con Firebase, mostrar error específico
          const errorMsg = data.error || "Error al iniciar sesión"
          console.log('❌ Login fallido:', errorMsg)
          setError(errorMsg)
          return
        }
      } catch (err: any) {
        console.log('⚠️ Firebase login fallió, intentando con datos demo...')
        // Si falla Firebase, intentar con datos demo como fallback
      }
    }

    // Fallback a datos demo (para desarrollo)
    const user = DEMO_DATA.usuarios.find(
      (u) => u.email === loginForm.email && u.password === loginForm.password && u.activo,
    )

    if (user) {
      console.log('✅ Login exitoso con DEMO_DATA')
      setCurrentUser(user)
      setIsAuthenticated(true)
      try { createAndStoreToken(user.id) } catch {}
    } else {
      setError("Credenciales incorrectas o usuario inactivo")
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentUser(null)
    setLoginForm({ email: "", password: "" })
    try { clearStoredToken() } catch {}
  }

  if (isAuthenticated && currentUser) {
    return (
      <NotificationProvider>
        <MainApp currentUser={currentUser} onLogout={handleLogout} />
      </NotificationProvider>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 flex-col justify-between text-white">
        <div>
          <h1 className="text-4xl font-bold mb-4">Sistema de Gestión Médica</h1>
          <p className="text-xl text-blue-100">
            Plataforma integral para la administración de consultas, pacientes y profesionales de la salud
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Gestión de Profesionales</h3>
              <p className="text-blue-100">Administra tu equipo médico y sus horarios de manera eficiente</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Calendario Integrado</h3>
              <p className="text-blue-100">Visualiza y gestiona todas las citas en un solo lugar</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Historial Clínico</h3>
              <p className="text-blue-100">Accede al historial completo de cada paciente de forma segura</p>
            </div>
          </div>
        </div>

        <div className="text-sm text-blue-200">© 2025 Sistema de Gestión Médica. Todos los derechos reservados.</div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Iniciar Sesión</h2>
            <p className="text-gray-600">Ingresa tus credenciales para acceder al sistema</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="tu@email.cl"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Iniciar Sesión
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
                onClick={() => router.push('/?register=1')}
                // Prefetch modal chunk on hover/focus to make opening feel instant
                onMouseEnter={() => import('@/components/RegistrationModalWrapper')}
                onFocus={() => import('@/components/RegistrationModalWrapper')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                ¿No tienes cuenta? Solicita acceso
              </button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">Credenciales de prueba:</p>
            <p className="text-xs text-blue-700">Email: juan.perez@clinica.cl</p>
            <p className="text-xs text-blue-700">Contraseña: demo123</p>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <RegistrationModalSuspense />
    </div>
  )
}
