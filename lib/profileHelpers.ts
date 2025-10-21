// Helpers reutilizables para la UI de perfil
// Objetivo: funciones puras para parseo y formateo de fechas, RUN y horas
//
// Notas:
// - Este archivo agrupa utilidades usadas por `ProfileView` y componentes relacionados.
// - Algunas partes de la UI se renderizan sólo en cliente (por ejemplo el calendario FullCalendar)
//   por eso verás `dynamic(..., { ssr: false })` en componentes marcados con "use client".
// - En entorno de desarrollo Next el dev overlay puede mostrar mensajes sobre "bail out to CSR"
//   o advertencias de los devtools; eso es normal cuando se combinan componentes server y client
//   (no es un error funcional si la página se carga y el cliente monta la parte dinámica).
//
// Ejemplo de uso:
//  import { parseLocalDateTime, formatDateTime, normalizeRun } from '@/lib/profileHelpers'
//  const d = parseLocalDateTime('2025-10-18', '09:00')
//  console.log(formatDateTime(d))

export type TimeString = `${number}${string}`

// parseLocalDateTime: recibe "YYYY-MM-DD" y "HH:MM" y devuelve Date en zona local
export function parseLocalDateTime(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [hh, mm] = (timeStr || '00:00').split(':').map(Number)
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0)
}

export function formatTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatDateTime(date: Date): string {
  return `${date.toLocaleDateString()} ${formatTime(date)}`
}

export function ensureTime(t?: string): string {
  if (!t) return '00:00'
  const parts = t.split(':')
  if (parts.length === 1) return `${parts[0].padStart(2, '0')}:00`
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
}

export function normalizeRun(run: string): string {
  if (!run) return ''
  return run.replace(/[^0-9kK]/g, '').toUpperCase()
}

export function formatRun(run: string): string {
  const r = normalizeRun(run)
  if (!r) return ''
  const body = r.slice(0, -1)
  const dv = r.slice(-1)
  return `${body}-${dv}`
}

export function formatWorkingHours(start: string, end: string): string {
  return `${ensureTime(start)} - ${ensureTime(end)}`
}

export function validateProfile(p: any) {
  const errs: Record<string, string> = {}
  if (!p.nombre || String(p.nombre).trim().length < 2) errs.nombre = 'Nombre obligatorio (mínimo 2 caracteres)'
  if (!p.apellidos || String(p.apellidos).trim().length < 2) errs.apellidos = 'Apellidos obligatorios'
  if (!p.profesion || String(p.profesion).trim().length < 2) errs.profesion = 'Profesión obligatoria'
  if (!p.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email)) errs.email = 'Correo inválido'
  if (p.telefono && !/^\+?\d[\d\s\-()+]{6,}$/.test(p.telefono)) errs.telefono = 'Teléfono con formato inválido'
  return errs
}
