/**
 * COMPONENTE: components/AuthorizeRegistrationsModal.tsx
 * PROPÓSITO: Modal para autorizar/rechazar solicitudes de registro de nuevos usuarios
 * Se conecta a Firestore para cargar y actualizar solicitudes reales
 */

'use client'

import React, { useState, useEffect } from 'react'
import supabase from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertCircle,
  Trash2,
  User,
  Mail,
  Phone,
} from 'lucide-react'

interface RegistrationRequest {
  id: string
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  run: string
  profesion: string
  email: string
  telefono?: string
  cargoActual: string
  sobreTi: string
  fechaSolicitud: string
  estado: 'pendiente' | 'aprobado' | 'rechazado'
  esAdmin?: boolean
}

interface AuthorizeRegistrationsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthorizeRegistrationsModal({
  isOpen,
  onClose,
}: AuthorizeRegistrationsModalProps) {
  const [registrations, setRegistrations] = useState<RegistrationRequest[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [filter, setFilter] = useState<'todos' | 'pendiente' | 'aprobado' | 'rechazado'>(
    'pendiente'
  )
  const [error, setError] = useState<string | null>(null)

  // Cargar solicitudes de Firestore al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadRegistrations()
    }
  }, [isOpen])

  const loadRegistrations = async () => {
    setInitialLoading(true)
    setError(null)
    try {
      // Leer desde Supabase
      const { data: rows, error } = await supabase
        .from('solicitudes')
        .select('*')
        .order('fechaSolicitud', { ascending: false })

      if (error) throw error

      const data: RegistrationRequest[] = (rows || []).map((r: any) => ({
        id: r.id,
        nombre: r.nombre || '',
        apellidoPaterno: r.apellidoPaterno || '',
        apellidoMaterno: r.apellidoMaterno || '',
        run: r.run || '',
        profesion: r.profesion || '',
        email: r.email || '',
        telefono: r.telefono || '',
        cargoActual: r.cargoActual || '',
        sobreTi: r.sobreTi || '',
        fechaSolicitud: r.fechaSolicitud || new Date().toISOString(),
        estado: (r.estado as 'pendiente' | 'aprobado' | 'rechazado') || 'pendiente',
        esAdmin: r.esAdmin || false,
      }))

      setRegistrations(data)
    } catch (err) {
      console.error('Error cargando solicitudes:', err)
      setError('Error al cargar las solicitudes. Intenta más tarde.')
    } finally {
      setInitialLoading(false)
    }
  }

  const filteredRegistrations = registrations.filter((reg) => {
    if (filter === 'todos') return true
    return reg.estado === filter
  })

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter((sid) => sid !== id))
    }
  }

  const updateRegistrations = async (ids: string[], newState: 'aprobado' | 'rechazado') => {
    setLoading(true)
    try {
      // Actualización en lote con Supabase
      const { error } = await supabase
        .from('solicitudes')
        .update({ estado: newState })
        .in('id', ids)

      if (error) throw error

      // Actualizar estado local
      setRegistrations(
        registrations.map((reg) =>
          ids.includes(reg.id) ? { ...reg, estado: newState } : reg
        )
      )
      setSelectedIds([])
    } catch (err) {
      console.error('Error actualizando solicitudes:', err)
      setError('Error al actualizar solicitudes.')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = () => {
    updateRegistrations(selectedIds, 'aprobado')
  }

  const handleReject = () => {
    updateRegistrations(selectedIds, 'rechazado')
  }

  const handleToggleAdmin = async (id: string) => {
    try {
      const reg = registrations.find((r) => r.id === id)
      if (!reg) return

      const { error } = await supabase
        .from('solicitudes')
        .update({ esAdmin: !reg.esAdmin })
        .eq('id', id)

      if (error) throw error

      setRegistrations(
        registrations.map((r) =>
          r.id === id ? { ...r, esAdmin: !r.esAdmin } : r
        )
      )
    } catch (err) {
      console.error('Error actualizando admin:', err)
      setError('Error al actualizar estado de admin.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar esta solicitud?')) return

    try {
      const { error } = await supabase
        .from('solicitudes')
        .delete()
        .eq('id', id)

      if (error) throw error

      setRegistrations(registrations.filter((reg) => reg.id !== id))
      setSelectedIds(selectedIds.filter((sid) => sid !== id))
    } catch (err) {
      console.error('Error eliminando solicitud:', err)
      setError('Error al eliminar solicitud.')
    }
  }

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'aprobado':
        return (
          <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">
            ✓ Aprobado
          </span>
        )
      case 'rechazado':
        return (
          <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded">
            ✗ Rechazado
          </span>
        )
      default:
        return (
          <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
            ⏳ Pendiente
          </span>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Autorizar Registros de Usuarios
          </DialogTitle>
          <DialogDescription>
            Revisa y autoriza las solicitudes de acceso de nuevos usuarios
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert className="bg-red-50 border-red-300">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex gap-2 flex-wrap">
            {(['todos', 'pendiente', 'aprobado', 'rechazado'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setFilter(f)
                  setSelectedIds([])
                }}
                className="capitalize"
                disabled={initialLoading}
              >
                {f === 'todos' && '📋 Todos'}
                {f === 'pendiente' && '⏳ Pendientes'}
                {f === 'aprobado' && '✓ Aprobados'}
                {f === 'rechazado' && '✗ Rechazados'}
              </Button>
            ))}
          </div>

          {/* Loading state */}
          {initialLoading && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Cargando solicitudes...</AlertDescription>
            </Alert>
          )}

          {/* Lista de solicitudes */}
          {!initialLoading && (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {filteredRegistrations.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {filter === 'pendiente'
                      ? 'No hay solicitudes pendientes'
                      : `No hay solicitudes ${filter}`}
                  </AlertDescription>
                </Alert>
              ) : (
                filteredRegistrations.map((reg) => (
                  <Card key={reg.id} className="p-4">
                    <div className="flex gap-4 items-start">
                      {/* Checkbox */}
                      <div className="pt-2">
                        <Checkbox
                          checked={selectedIds.includes(reg.id)}
                          onCheckedChange={(checked) =>
                            handleSelectOne(reg.id, checked as boolean)
                          }
                          disabled={reg.estado !== 'pendiente' || loading}
                        />
                      </div>

                      {/* Información */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {reg.nombre} {reg.apellidoPaterno} {reg.apellidoMaterno}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">RUN: {reg.run}</p>
                          </div>
                          {getStatusBadge(reg.estado)}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm my-3">
                          <div>
                            <p className="text-xs font-medium text-gray-600">Profesión</p>
                            <p className="text-gray-900">{reg.profesion}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-600">Cargo</p>
                            <p className="text-gray-900">{reg.cargoActual}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <p className="text-gray-900 truncate">{reg.email}</p>
                          </div>
                          {reg.telefono && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-500" />
                              <p className="text-gray-900">{reg.telefono}</p>
                            </div>
                          )}
                        </div>

                        {reg.sobreTi && (
                          <div className="my-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                            <p className="text-xs font-medium text-gray-600 mb-1">Sobre sí</p>
                            <p className="line-clamp-2">{reg.sobreTi}</p>
                          </div>
                        )}

                        {/* Checkbox Admin */}
                        {reg.estado === 'aprobado' && (
                          <div className="mt-3 flex items-center gap-2 p-2 bg-blue-50 rounded">
                            <Checkbox
                              id={`admin-${reg.id}`}
                              checked={reg.esAdmin || false}
                              onCheckedChange={() => handleToggleAdmin(reg.id)}
                              disabled={loading}
                            />
                            <label
                              htmlFor={`admin-${reg.id}`}
                              className="text-sm text-gray-700 cursor-pointer"
                            >
                              ✨ Habilitar como Administrador
                            </label>
                          </div>
                        )}

                        <p className="text-xs text-gray-500 mt-2">
                          Solicitado: {new Date(reg.fechaSolicitud).toLocaleDateString('es-CL')}
                        </p>
                      </div>

                      {/* Botón eliminar */}
                      {reg.estado !== 'pendiente' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(reg.id)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Acciones */}
          {filter === 'pendiente' && selectedIds.length > 0 && !initialLoading && (
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setSelectedIds([])}
                disabled={loading}
              >
                Desmarcar
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={loading}
              >
                ✗ Rechazar ({selectedIds.length})
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                disabled={loading}
              >
                ✓ Aprobar ({selectedIds.length})
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
