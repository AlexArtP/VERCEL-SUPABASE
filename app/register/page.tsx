/**
 * ARCHIVO: app/register/page.tsx
 * PROPÓSITO: Redirige a la página principal con el modal de registro abierto
 * 
 * Si alguien accede directamente a /register, será redirigido a / con el modal abierto
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir a home - el modal se abrirá por parámetro
    router.replace('/?register=1')
  }, [router])

  // Mostrar loading mientras se redirige
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo...</p>
      </div>
    </div>
  )
}
