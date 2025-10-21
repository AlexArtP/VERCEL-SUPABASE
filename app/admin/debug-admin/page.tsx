/**
 * ARCHIVO: app/admin/debug-admin/page.tsx
 * PROPÓSITO: Página para debuguear estado de admin
 */

'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function DebugAdminPage() {
  const { user } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkAdminStatus = async () => {
    if (!user) {
      setError('No estás autenticado')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/debug-admin-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid })
      })

      const data = await response.json()
      setDebugInfo(data)

      if (!response.ok) {
        setError(data.error)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 Debug Admin Status</h1>

        {/* Current User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">👤 Usuario Actual</h2>
          {user ? (
            <div className="space-y-2 text-sm">
              <p><strong>UID:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{user.uid}</code></p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Autenticado:</strong> ✅ Sí</p>
            </div>
          ) : (
            <p className="text-red-600">❌ No autenticado</p>
          )}
        </div>

        {/* Check Admin Button */}
        <button
          onClick={checkAdminStatus}
          disabled={loading || !user}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg mb-6 transition"
        >
          {loading ? '⏳ Verificando...' : '🔎 Verificar Estado Admin en Firestore'}
        </button>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 font-semibold">❌ Error:</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Debug Info */}
        {debugInfo && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {debugInfo.success ? '✅ Admin Status OK' : '❌ No es Admin'}
            </h2>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Instrucciones</h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Inicia sesión con tu cuenta</li>
            <li>Haz clic en "Verificar Estado Admin en Firestore"</li>
            <li>Si ves ❌, el usuario NO es admin en Firestore</li>
            <li>Si ves ✅, el usuario ES admin y debería poder acceder</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
