/**
 * ARCHIVO: app/admin/check-user/page.tsx
 * PROPÓSITO: Página para verificar el estado de un usuario
 */

'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle, Loader } from 'lucide-react'

export default function CheckUserPage() {
  const [email, setEmail] = useState('a.arteaga02@ufromail.cl')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCheck = async () => {
    if (!email) {
      setError('Email requerido')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error)
        return
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🔍 Verificar Estado del Usuario</h1>
        <p className="text-gray-600 mb-8">Revisa dónde está creado el usuario y su configuración</p>

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button
              onClick={handleCheck}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center gap-2"
            >
              {loading && <Loader className="w-5 h-5 animate-spin" />}
              {loading ? 'Buscando...' : 'Verificar'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Firebase Auth Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">Firebase Authentication</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-600">UID</p>
                    <p className="font-mono text-blue-600">{result.auth.uid}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-600">Email</p>
                    <p className="font-mono">{result.auth.email}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-600">Email Verificado</p>
                    <p className="font-mono">{result.auth.emailVerified ? '✅ Sí' : '❌ No'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-600">Deshabilitado</p>
                    <p className="font-mono">{result.auth.disabled ? '🔒 Sí' : '✅ No'}</p>
                  </div>
                  <div className="col-span-2 bg-gray-50 p-3 rounded">
                    <p className="text-gray-600">Creado</p>
                    <p className="font-mono text-sm">{new Date(result.auth.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Firestore Section */}
            {result.firestoreExists ? (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Firestore (usuarios collection)</h2>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-gray-600">Nombre</p>
                      <p className="font-mono">{result.firestore.nombre}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-gray-600">Email</p>
                      <p className="font-mono">{result.firestore.email}</p>
                    </div>
                    <div className={`bg-gray-50 p-3 rounded ${result.firestore.esAdmin ? 'border-2 border-purple-400' : ''}`}>
                      <p className="text-gray-600">esAdmin</p>
                      <p className="font-mono text-lg">{result.firestore.esAdmin ? '👑 ADMIN' : '👤 Usuario Normal'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-gray-600">Activo</p>
                      <p className="font-mono">{result.firestore.activo ? '✅ Sí' : '❌ No'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-gray-600">Rol</p>
                      <p className="font-mono">{result.firestore.rol || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-gray-600">Profesión</p>
                      <p className="font-mono">{result.firestore.profesion || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900">⚠️ Usuario NO existe en Firestore</p>
                  <p className="text-yellow-700 text-sm mt-1">
                    El usuario existe en Firebase Auth pero no en la colección usuarios de Firestore
                  </p>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-semibold text-blue-900 mb-2">📊 Resumen:</p>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>✅ Usuario existe en Firebase Auth</li>
                <li>{result.firestoreExists ? '✅' : '❌'} Usuario existe en Firestore</li>
                <li>{result.sync.adminStatus ? '👑' : '👤'} {result.sync.adminStatus ? 'Es ADMIN' : 'No es admin'}</li>
              </ul>
            </div>

            {/* Action Links */}
            <div className="flex gap-4">
              {result.sync.adminStatus && (
                <a
                  href="/admin/reset-user-password"
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition"
                >
                  🔐 Resetear Contraseña
                </a>
              )}
              <a
                href="/?login=1"
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition"
              >
                ← Volver a Login
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
