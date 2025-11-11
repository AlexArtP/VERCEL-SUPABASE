import { useState } from 'react'
import { supabase } from '../supabaseClient'
import type { Paciente } from '../../types'
import { formatearRun, validarRun, calculateAge } from '../validators'

type AddPacienteArgs = Omit<Paciente, 'id' | 'edad'> & { run?: string }

export function useAddPaciente() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function addPaciente(input: AddPacienteArgs): Promise<Paciente> {
    setLoading(true)
    setError(null)
    try {
      // Validaciones básicas
      if (!input.nombre || input.nombre.trim().length === 0) throw new Error('Nombre es obligatorio')
      if (input.run && !validarRun(input.run)) throw new Error('RUN inválido')

      const formattedRun = input.run ? formatearRun(input.run) : undefined
      const edad = input.fechaNacimiento ? calculateAge(input.fechaNacimiento as any) : undefined

      const payload: any = {
        nombre: input.nombre,
        apellidos: (input as any).apellidos || null,
        run: formattedRun || null,
        fecha_nacimiento: (input as any).fechaNacimiento || null,
        telefono: (input as any).telefono || null,
        email: (input as any).email || null,
        profesionales: (input as any).profesionales || null,
      }

      const { data, error } = await supabase.from('pacientes').insert([payload]).select().single()
      if (error) throw error

      const created: Paciente = {
        id: data.id,
        nombre: data.nombre,
        apellidos: data.apellidos,
        run: data.run,
        fechaNacimiento: data.fecha_nacimiento,
        edad: edad ?? undefined,
        profesionales: data.profesionales,
        ...data,
      }
      setLoading(false)
      return created
    } catch (err: any) {
      setError(err?.message || String(err))
      setLoading(false)
      throw err
    }
  }

  return { addPaciente, loading, error } as const
}
