/**
 * ARCHIVO: app/admin/reset-user-password/page.tsx
 * PROPÓSITO: Página para resetear contraseña de un usuario
 */

'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle, Loader } from 'lucide-react'

export default function ResetUserPasswordPage() {
  const [email, setEmail] = useState('a.arteaga02@ufromail.cl')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !newPassword) {
      setMessage({ type: 'error', text: 'Email y contraseña requeridos' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword })
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Error al resetear contraseña' })
        return
      }

      setMessage({ 
        type: 'success', 
        text: `✅ Contraseña actualizada para ${email}. Ahora puedes iniciar sesión.` 
      })
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">🔐 Resetear Contraseña</h1>
        <p className="text-gray-600 text-sm mb-6">Ingresa una nueva contraseña para el usuario</p>

        <form onSubmit={handleReset} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="usuario@example.com"
              disabled={loading}
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Mínimo 6 caracteres"
              disabled={loading}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Repite la contraseña"
              disabled={loading}
            />
          </div>

          {/* Message */}
          {message && (
            <div className={`flex gap-2 p-3 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            {loading && <Loader className="w-5 h-5 animate-spin" />}
            {loading ? 'Resetando...' : 'Resetear Contraseña'}
          </button>
        </form>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 text-sm mb-2">📋 Instrucciones:</h3>
          <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
            <li>Ingresa el email del usuario (ya está pre-rellenado)</li>
            <li>Escribe una nueva contraseña segura (mín. 6 caracteres)</li>
            <li>Confirma la contraseña</li>
            <li>Haz clic en "Resetear Contraseña"</li>
            <li>El usuario puede iniciar sesión con la nueva contraseña</li>
          </ol>
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <a href="/?login=1" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            ← Volver a Login
          </a>
        </div>
      </div>
    </div>
  )
}
