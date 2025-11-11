'use client'

import { useState, useCallback, useEffect } from 'react'

export interface Paciente {
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
  created_at?: string
}

export function usePacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar lista de pacientes
  const fetchPacientes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/pacientes/list')
      const result = await response.json()
      
      if (response.ok) {
        setPacientes(result.data || [])
      } else {
        setError(result.error || 'Error al cargar pacientes')
      }
    } catch (err) {
      console.error('Error fetching pacientes:', err)
      setError('Error al cargar pacientes')
    } finally {
      setLoading(false)
    }
  }, [])

  // Crear paciente
  const createPaciente = useCallback(async (paciente: Paciente): Promise<Paciente | null> => {
    try {
      setError(null)
      const response = await fetch('/api/pacientes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paciente),
      })

      const result = await response.json()
      if (response.ok && result.data && result.data.length > 0) {
        const newPaciente = result.data[0]
        setPacientes((prev) => [newPaciente, ...prev])
        return newPaciente
      } else {
        setError(result.error || 'Error al crear paciente')
        return null
      }
    } catch (err) {
      console.error('Error creating paciente:', err)
      setError('Error al crear paciente')
      return null
    }
  }, [])

  // Cargar pacientes al montar
  useEffect(() => {
    fetchPacientes()
  }, [fetchPacientes])

  return {
    pacientes,
    loading,
    error,
    fetchPacientes,
    createPaciente,
  }
}
