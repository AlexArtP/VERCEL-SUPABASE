'use client'

import { useState } from 'react'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'

export default function InitDemoAdmin() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleCreateDemoAdmin = async () => {
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const demoAdmin = {
        id: 'demo-admin-juan',
        nombre: 'Dr. Juan',
        apellidos: 'Pérez González',
        email: 'juan.perez@clinica.cl',
        run: '12.345.678-9',
        profesion: 'Médico General',
        telefono: '+56 9 1234 5678',
        cargo:
          'Director Médico del Departamento de Medicina Interna. Responsable de la coordinación de equipos médicos y supervisión de protocolos clínicos.',
        description:
          'Profesional con amplia experiencia en medicina interna, gestión de equipos y supervisión clínica. Intereses en docencia y mejora continua.',
        avatar: '',
        specialties: ['Medicina Interna', 'Urgencias'],
        workingHours: { start: '08:30', end: '17:30' },
        preferences: { theme: 'light', primaryColor: '#3B82F6', language: 'es' },
        isPublic: true,
        rol: 'profesional',
        esAdmin: true,
        activo: true,
        password: 'demo123',
        fechaRegistro: new Date().toISOString(),
      }

      await setDoc(doc(db, 'usuarios', 'demo-admin-juan'), demoAdmin)

      setMessage(
        `✅ Usuario demo administrador creado exitosamente!\n\nEmail: ${demoAdmin.email}\nRol: Administrador\n\nAhora puedes hacer login con:\nEmail: juan.perez@clinica.cl\nContraseña: demo123`
      )
    } catch (err: any) {
      console.error('Error:', err)
      setError(`❌ Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Inicializar Demo Admin</h1>
        <p className="text-gray-600 mb-6">
          Crea el usuario demo administrador en Firestore para poder acceder con credenciales de demo.
        </p>

        <button
          onClick={handleCreateDemoAdmin}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition mb-4"
        >
          {loading ? 'Creando...' : '✅ Crear Usuario Demo Admin'}
        </button>

        {message && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-green-800 whitespace-pre-wrap font-mono text-sm">{message}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 whitespace-pre-wrap font-mono text-sm">{error}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 mb-2">Instrucciones:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Haz clic en "Crear Usuario Demo Admin"</li>
            <li>Espera el mensaje de confirmación</li>
            <li>Recarga la página</li>
            <li>Haz login con las credenciales demo</li>
            <li>Dirígete a Configuraciones → Autorizar Registros</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
