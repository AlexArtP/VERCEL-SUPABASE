export type Profesional = {
  id: string
  nombre?: string
  apellidos?: string
  email?: string
  telefono?: string
  profesion?: string
  cargo?: string
  run?: string
  rol?: string
  activo?: boolean
  esAdmin?: boolean
  specialties?: string[]
  agendaDisabled?: boolean
  agendaDisabledReason?: string | null
  preferences?: Record<string, any>
  [key: string]: any
}

export type Paciente = {
  id: string
  nombre: string
  apellidos?: string
  run?: string
  fechaNacimiento?: string
  telefono?: string
  email?: string
  edad?: number
  profesionales?: string[]
  [key: string]: any
}

export type Modulo = {
  id: string
  profesionalId: string
  fecha: string
  horaInicio: string
  horaFin: string
  duracion?: number
  tipo?: string
  observaciones?: string
  color?: string
  [key: string]: any
}

export type Cita = {
  id: string
  profesionalId: string
  pacienteId?: string
  pacienteNombre?: string
  pacienteRun?: string
  pacienteTelefono?: string
  fecha: string
  hora: string
  horaFin?: string
  start?: string
  end?: string
  moduloId?: string | number
  tipo?: string
  estado?: 'pendiente' | 'confirmada' | 'cancelada'
  esSobrecupo?: boolean
  [key: string]: any
}

export type ID = string
