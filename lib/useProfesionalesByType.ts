'use client'

import { useFirestoreUsers } from './useFirestoreUsers'
import { useMemo } from 'react'

export interface Profesional {
  id: string
  nombre: string
  apellido_paterno?: string
  profesion: string
  email?: string
}

export function useProfesionalesByType() {
  const { usuarios } = useFirestoreUsers()

  const psicologos = useMemo(
    () =>
      (usuarios || [])
        .filter((u: any) => (u.profesion || u.rol || '').toLowerCase().includes('psicolog'))
        .map((u: any) => ({
          id: u.id || '',
          nombre: u.nombre || '',
          apellido_paterno: u.apellido_paterno,
          profesion: u.profesion || u.rol || '',
          email: u.email,
        })),
    [usuarios]
  )

  const psiquiatras = useMemo(
    () =>
      (usuarios || [])
        .filter((u: any) => (u.profesion || u.rol || '').toLowerCase().includes('psiquiatr'))
        .map((u: any) => ({
          id: u.id || '',
          nombre: u.nombre || '',
          apellido_paterno: u.apellido_paterno,
          profesion: u.profesion || u.rol || '',
          email: u.email,
        })),
    [usuarios]
  )

  const asistentes = useMemo(
    () =>
      (usuarios || [])
        .filter((u: any) => (u.profesion || u.rol || '').toLowerCase().includes('asistente'))
        .map((u: any) => ({
          id: u.id || '',
          nombre: u.nombre || '',
          apellido_paterno: u.apellido_paterno,
          profesion: u.profesion || u.rol || '',
          email: u.email,
        })),
    [usuarios]
  )

  return {
    psicologos,
    psiquiatras,
    asistentes,
  }
}
