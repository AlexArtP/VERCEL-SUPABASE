import React, { useState, useEffect } from 'react'
import supabase from '@/lib/supabaseClient'
import { Check, X, Loader } from 'lucide-react'

interface Solicitud {
  id: string
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  email: string
  profesion: string
  estado: string
  fechaSolicitud: string
}

export function SolicitudesAuthorizationList() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Cargar solicitudes pendientes de Supabase
  useEffect(() => {
    const loadSolicitudes = async () => {
      try {
        setLoading(true)
        const { data: rows, error } = await supabase
          .from('solicitudregistro')
          .select('*')
          .eq('estado', 'pendiente')
          .order('fechaSolicitud', { ascending: false })

        if (error) throw error

        const data: Solicitud[] = (rows || []).map((r: any) => ({ id: r.id, ...r }))
        setSolicitudes(data)
      } catch (error) {
        console.error('❌ Error cargando solicitudes:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSolicitudes()
  }, [])

  const handleApprove = async (id: string, email: string) => {
    try {
      setProcessingId(id)
      const response = await fetch('/api/auth/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitudId: id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error aprobando solicitud')
      }

      setSolicitudes(solicitudes.filter(s => s.id !== id))
      alert(`✅ Solicitud de ${email} aprobada.\n\nUsuario creado en la colección de usuarios.`)
    } catch (error: any) {
      console.error('Error aprobando:', error)
      alert(`❌ Error: ${error.message}`)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: string, email: string) => {
    try {
      setProcessingId(id)
      const response = await fetch('/api/auth/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitudId: id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error rechazando solicitud')
      }

      setSolicitudes(solicitudes.filter(s => s.id !== id))
      alert(`❌ Solicitud de ${email} rechazada y eliminada.`)
    } catch (error: any) {
      console.error('Error rechazando:', error)
      alert(`❌ Error: ${error.message}`)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Solicitudes Pendientes de Aprobación
        </h3>
        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
          {solicitudes.length} pendiente{solicitudes.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      )}

      {/* Empty State */}
      {!loading && solicitudes.length === 0 && (
        <div className="text-center p-8 bg-gray-50 rounded-lg text-gray-500">
          No hay solicitudes pendientes de aprobación
        </div>
      )}

      {/* Lista */}
      {!loading && solicitudes.length > 0 && (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profesión</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {solicitudes.map((sol) => (
                <tr key={sol.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm">
                    <p className="font-medium text-gray-900">
                      {sol.nombre} {sol.apellidoPaterno} {sol.apellidoMaterno}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{sol.email}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{sol.profesion}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {new Date(sol.fechaSolicitud).toLocaleDateString('es-CL')}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(sol.id, sol.email)}
                        disabled={processingId === sol.id}
                        className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Aprobar solicitud"
                      >
                        {processingId === sol.id ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(sol.id, sol.email)}
                        disabled={processingId === sol.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Rechazar solicitud"
                      >
                        {processingId === sol.id ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      
    </div>
  )
}
