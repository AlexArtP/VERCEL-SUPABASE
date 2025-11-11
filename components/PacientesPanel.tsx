'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, X } from 'lucide-react'

interface Paciente {
  id?: string
  nombre: string
  apellido_paterno: string
  apellido_materno?: string
  run: string
  fecha_nacimiento: string
  edad?: number
  email: string
  telefono: string
  psicologo_id?: string
  psiquiatra_id?: string
  asistente_social_id?: string
}

interface Profesional {
  id: string
  nombre: string
  profesion: string
  estamento?: string
  activo?: boolean
  rol?: string
}

export function PacientesPanel({
  profesionales,
}: {
  profesionales: Profesional[]
}) {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState<Paciente>({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    run: '',
    fecha_nacimiento: '',
    email: '',
    telefono: '+56',
    psicologo_id: '',
    psiquiatra_id: '',
    asistente_social_id: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Cargar pacientes
  useEffect(() => {
    fetchPacientes()
  }, [])

  const fetchPacientes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/pacientes/list')
      const result = await response.json()
      if (response.ok) {
        setPacientes(result.data || [])
      }
    } catch (err) {
      console.error('Error cargando pacientes:', err)
    } finally {
      setLoading(false)
    }
  }

  // Formatear RUN automáticamente (xxxxxxxx-x)
  const formatRUN = (value: string): string => {
    const cleaned = value.replace(/[^0-9kK]/g, '').toUpperCase()
    if (cleaned.length <= 1) return cleaned
    const body = cleaned.slice(0, -1)
    const dv = cleaned.slice(-1)
    return `${body}-${dv}`
  }

  // Validar email
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // Validar RUN (formato: xxxxxxxx-x sin puntos)
  const isValidRUN = (run: string): boolean => {
    return /^\d{1,8}-[0-9kK]$/.test(run)
  }

  // Calcular edad
  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) newErrors.nombre = 'Nombre requerido'
    if (!formData.apellido_paterno.trim()) newErrors.apellido_paterno = 'Apellido paterno requerido'
    if (!formData.run.trim()) newErrors.run = 'RUN requerido'
    if (formData.run && !isValidRUN(formData.run)) newErrors.run = 'RUN inválido (formato: xxxxxxxx-x)'
    if (!formData.fecha_nacimiento) newErrors.fecha_nacimiento = 'Fecha de nacimiento requerida'
    // Email es OPCIONAL, solo validar si se proporcionó
    if (formData.email && !isValidEmail(formData.email)) newErrors.email = 'Email inválido'
    if (!formData.telefono || formData.telefono === '+56') newErrors.telefono = 'Teléfono requerido'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Registrar paciente
  const handleRegistrar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      const response = await fetch('/api/pacientes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          edad: calculateAge(formData.fecha_nacimiento),
        }),
      })

      const result = await response.json()
      if (response.ok) {
        setPacientes([result.data[0], ...pacientes])
        setShowModal(false)
        setFormData({
          nombre: '',
          apellido_paterno: '',
          apellido_materno: '',
          run: '',
          fecha_nacimiento: '',
          email: '',
          telefono: '+56',
          psicologo_id: '',
          psiquiatra_id: '',
          asistente_social_id: '',
        })
        setErrors({})
      } else {
        setErrors({ submit: result.error || 'Error al registrar paciente' })
      }
    } catch (err) {
      setErrors({ submit: 'Error al registrar paciente' })
      console.error(err)
    }
  }

  // Filtrar pacientes
  const filteredPacientes = pacientes.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.run.includes(searchTerm)
  )

  // Filtrar profesionales por profesión y que estén activos
  const psicologos = profesionales.filter((p) => 
    (p.activo !== false) && 
    ((p.profesion || p.estamento)?.toLowerCase().includes('psicolog'))
  )
  const psiquiatras = profesionales.filter((p) => 
    (p.activo !== false) && 
    ((p.profesion || p.estamento)?.toLowerCase().includes('psiquiatr'))
  )
  const asistentes = profesionales.filter((p) => 
    (p.activo !== false) && 
    ((p.profesion || p.estamento)?.toLowerCase().includes('asistente social'))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Pacientes</h2>
          <p className="text-gray-600 mt-1">Listado de pacientes registrados</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Registrar Paciente
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Cargando...</div>
        ) : filteredPacientes.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {pacientes.length === 0 ? 'No hay pacientes registrados' : 'No se encontraron resultados'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">RUN</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Edad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Teléfono</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPacientes.map((paciente) => (
                  <tr key={paciente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {paciente.nombre} {paciente.apellido_paterno} {paciente.apellido_materno || ''}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{paciente.run}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{paciente.edad || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{paciente.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{paciente.telefono}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold">Registrar Paciente</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegistrar} className="p-6 space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg ${errors.nombre ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
              </div>

              {/* Apellidos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Paterno *</label>
                  <input
                    type="text"
                    value={formData.apellido_paterno}
                    onChange={(e) => setFormData({ ...formData, apellido_paterno: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${errors.apellido_paterno ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.apellido_paterno && <p className="text-red-500 text-sm mt-1">{errors.apellido_paterno}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Materno</label>
                  <input
                    type="text"
                    value={formData.apellido_materno}
                    onChange={(e) => setFormData({ ...formData, apellido_materno: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* RUN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RUN *</label>
                <input
                  type="text"
                  value={formData.run}
                  onChange={(e) => setFormData({ ...formData, run: formatRUN(e.target.value) })}
                  placeholder="xxxxxxxx-x"
                  className={`w-full px-3 py-2 border rounded-lg ${errors.run ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.run && <p className="text-red-500 text-sm mt-1">{errors.run}</p>}
              </div>

              {/* Fecha Nacimiento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento *</label>
                  <input
                    type="date"
                    value={formData.fecha_nacimiento}
                    onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${errors.fecha_nacimiento ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.fecha_nacimiento && <p className="text-red-500 text-sm mt-1">{errors.fecha_nacimiento}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Edad</label>
                  <input
                    type="number"
                    value={calculateAge(formData.fecha_nacimiento) || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => {
                    let val = e.target.value
                    if (!val.startsWith('+56')) val = '+56' + val.replace(/\D/g, '').replace(/^56/, '')
                    setFormData({ ...formData, telefono: val })
                  }}
                  className={`w-full px-3 py-2 border rounded-lg ${errors.telefono ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.telefono && <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>}
              </div>

              {/* Tratantes */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold text-gray-700 mb-4">Tratantes</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Psicólogo(a)</label>
                    <select
                      value={formData.psicologo_id || ''}
                      onChange={(e) => setFormData({ ...formData, psicologo_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Seleccionar...</option>
                      {psicologos.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Psiquiatra</label>
                    <select
                      value={formData.psiquiatra_id || ''}
                      onChange={(e) => setFormData({ ...formData, psiquiatra_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Seleccionar...</option>
                      {psiquiatras.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asistente Social</label>
                    <select
                      value={formData.asistente_social_id || ''}
                      onChange={(e) => setFormData({ ...formData, asistente_social_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Seleccionar...</option>
                      {asistentes.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                  {errors.submit}
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
