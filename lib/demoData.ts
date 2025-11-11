export const DEMO_DATA = {
  usuarios: [
    {
      id: 1,
      nombre: "Dr. Juan",
      apellidos: "Pérez González",
      run: "12.345.678-9",
      profesion: "Médico",
      telefono: "+56 9 1234 5678",
      email: "juan.perez@clinica.cl",
      cargo:
        "Director Médico del Departamento de Medicina Interna. Responsable de la coordinación de equipos médicos y supervisión de protocolos clínicos.",
      description:
        "Profesional con amplia experiencia en medicina interna, gestión de equipos y supervisión clínica. Intereses en docencia y mejora continua.",
      avatar: "",
      specialties: ["Medicina Interna", "Urgencias"],
      workingHours: { start: "08:30", end: "17:30" },
      preferences: { theme: "light", primaryColor: "#3B82F6", language: "es" },
      isPublic: true,
      rol: "profesional",
      esAdmin: true,
      activo: true,
      estado: "aprobado", // Demo users are pre-approved
      password: "demo123",
    },
    {
      id: 2,
      nombre: "Dra. María",
      apellidos: "Silva Rojas",
      run: "13.456.789-0",
      profesion: "Psicólogo",
      telefono: "+56 9 2345 6789",
      email: "maria.silva@clinica.cl",
      cargo: "Psicóloga especialista en terapia cognitivo-conductual y manejo de estrés.",
      description: "Psicóloga dedicada a la atención integral del paciente adulto, con especial interés en salud mental.",
      avatar: "",
      specialties: ["Psicología Clínica", "Terapia Cognitivo-Conductual"],
      workingHours: { start: "09:00", end: "18:00" },
      preferences: { theme: "light", primaryColor: "#10B981", language: "es" },
      isPublic: true,
      rol: "profesional",
      esAdmin: false,
      activo: true,
      estado: "aprobado", // Demo users are pre-approved
      password: "demo123",
    },
    {
      id: 3,
      nombre: "Carlos",
      apellidos: "Ramírez Torres",
      run: "14.567.890-1",
      profesion: "Administrador",
      telefono: "+56 9 3456 7890",
      email: "carlos.ramirez@clinica.cl",
      cargo: "Coordinador Administrativo encargado de la gestión de recursos humanos y operaciones diarias.",
      rol: "administrativo",
      esAdmin: true,
      activo: true,
      estado: "aprobado", // Demo users are pre-approved
      password: "demo123",
    },
    {
      id: 4,
      nombre: "Dra. Ana",
      apellidos: "Morales Díaz",
      run: "15.678.901-2",
      profesion: "Psiquiatra",
      telefono: "+56 9 4567 8901",
      email: "ana.morales@clinica.cl",
      cargo: "Especialista en Psiquiatría con experiencia en salud mental infantil y adolescente.",
      rol: "profesional",
      esAdmin: false,
      activo: true,
      estado: "aprobado", // Demo users are pre-approved
      password: "demo123",
    },
    {
      id: 5,
      nombre: "Luis",
      apellidos: "Fernández Castro",
      run: "16.789.012-3",
      profesion: "Recepcionista",
      telefono: "+56 9 5678 9012",
      email: "luis.fernandez@clinica.cl",
      cargo: "Encargado de recepción y atención al público, gestión de citas y coordinación de agenda.",
      description: "Responsable de la atención en mostrador y coordinación de agendas. Manejo de software de citas.",
      avatar: "",
      specialties: [],
      workingHours: { start: "08:00", end: "16:30" },
      preferences: { theme: "light", primaryColor: "#F59E0B", language: "es" },
      isPublic: false,
      rol: "administrativo",
      esAdmin: false,
      activo: true,
      estado: "aprobado", // Demo users are pre-approved
      password: "demo123",
    },
    {
      id: 6,
      nombre: "Dra. Rosa",
      apellidos: "López García",
      run: "17.890.123-4",
      profesion: "Asistente Social",
      telefono: "+56 9 7890 1234",
      email: "rosa.lopez@clinica.cl",
      cargo: "Especialista en Trabajo Social y apoyo psicosocial a pacientes.",
      description: "Profesional en Trabajo Social dedicada a la atención integral del paciente y su familia.",
      avatar: "",
      specialties: ["Trabajo Social", "Apoyo Psicosocial"],
      workingHours: { start: "08:30", end: "17:00" },
      preferences: { theme: "light", primaryColor: "#8B5CF6", language: "es" },
      isPublic: true,
      rol: "profesional",
      esAdmin: false,
      activo: true,
      estado: "aprobado", // Demo users are pre-approved
      password: "demo123",
    },
  ],
  pacientes: [
    {
      id: 1,
      nombre: "Pedro Sánchez",
      run: "17.890.123-4",
      telefono: "+56 9 6789 0123",
      email: "pedro.sanchez@email.cl",
      fechaNacimiento: "1985-03-15",
      ultimaVisita: "2024-01-10",
    },
    {
      id: 2,
      nombre: "Laura Martínez",
      run: "18.901.234-5",
      telefono: "+56 9 7890 1234",
      email: "laura.martinez@email.cl",
      fechaNacimiento: "1990-07-22",
      ultimaVisita: "2024-01-12",
    },
    {
      id: 3,
      nombre: "Roberto Gutiérrez",
      run: "19.012.345-6",
      telefono: "+56 9 8901 2345",
      email: "roberto.gutierrez@email.cl",
      fechaNacimiento: "1978-11-30",
      ultimaVisita: "2024-01-08",
    },
  ],
  citas: [
    {
      id: 1,
      pacienteId: 1,
      pacienteNombre: "Pedro",
      pacienteApellidos: "Sánchez López",
      profesionalId: 1,
      profesionalNombre: "Dr. Juan Pérez",
      fecha: new Date().toISOString().split("T")[0],
      hora: "09:00",
      tipo: "Consulta General",
      estado: "confirmada",
    },
    {
      id: 2,
      pacienteId: 2,
      pacienteNombre: "Laura",
      pacienteApellidos: "Martínez Rodríguez",
      profesionalId: 2,
      profesionalNombre: "Dra. María Silva",
      fecha: new Date().toISOString().split("T")[0],
      hora: "10:30",
      tipo: "Cardiología",
      estado: "confirmada",
    },
    {
      id: 3,
      pacienteId: 3,
      pacienteNombre: "Roberto",
      pacienteApellidos: "Gutiérrez Torres",
      profesionalId: 1,
      profesionalNombre: "Dr. Juan Pérez",
      fecha: new Date().toISOString().split("T")[0],
      hora: "14:00",
      tipo: "Control",
      estado: "pendiente",
    },
    {
      id: 4,
      pacienteId: 1,
      pacienteNombre: "Pedro",
      pacienteApellidos: "Sánchez López",
      profesionalId: 4,
      profesionalNombre: "Dra. Ana Morales",
      fecha: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      hora: "11:00",
      tipo: "Pediatría",
      estado: "confirmada",
    },
  ],
  // NUEVAS: Plantillas de Módulo (Templates - Definiciones por Profesional)
  plantillas: [
    {
      id: 1,
      profesionalId: 1,
      tipo: "Consulta General",
      duracion: 45,
      profesion: "Médico general",
      color: "#3b82f6",
      observaciones: "Consulta médica general sin especialidad",
    },
    {
      id: 2,
      profesionalId: 2,
      tipo: "Cardiología",
      duracion: 60,
      profesion: "Médico general",
      color: "#10b981",
      observaciones: "Evaluación cardiológica especializada",
    },
    {
      id: 3,
      profesionalId: 1,
      tipo: "Control",
      duracion: 30,
      profesion: "Médico general",
      color: "#f59e0b",
      observaciones: "Control de seguimiento de paciente",
    },
    {
      id: 4,
      profesionalId: 1,
      tipo: "Ingreso",
      duracion: 120,
      profesion: "Médico general",
      color: "#ef4444",
      observaciones: "Proceso de ingreso hospitalario",
    },
  ],
  // REFACTORIZADO: Módulos (Instances - Ocurrencias en calendario)
  modulos: [
    {
      id: 1,
      plantillaId: 1,
      profesionalId: 1,
      profesionalNombre: "Dr. Juan Pérez",
      fecha: new Date().toISOString().split("T")[0],
      horaInicio: "09:00",
      horaFin: "09:45",
      duracion: 45,
      tipo: "Consulta General",
      disponible: true,
      color: "#3b82f6",
      profesion: "Médico general",
      observaciones: "Consulta médica general sin especialidad",
    },
    {
      id: 2,
      plantillaId: 1,
      profesionalId: 1,
      profesionalNombre: "Dr. Juan Pérez",
      fecha: new Date().toISOString().split("T")[0],
      horaInicio: "10:00",
      horaFin: "10:45",
      duracion: 45,
      tipo: "Consulta General",
      disponible: true,
      color: "#3b82f6",
      profesion: "Médico general",
      observaciones: "Consulta médica general sin especialidad",
    },
    {
      id: 3,
      plantillaId: 2,
      profesionalId: 2,
      profesionalNombre: "Dra. María Silva",
      fecha: new Date().toISOString().split("T")[0],
      horaInicio: "10:00",
      horaFin: "11:00",
      duracion: 60,
      tipo: "Cardiología",
      disponible: false,
      color: "#10b981",
      profesion: "Médico general",
      observaciones: "Evaluación cardiológica especializada",
    },
    {
      id: 4,
      plantillaId: 3,
      profesionalId: 1,
      profesionalNombre: "Dr. Juan Pérez",
      fecha: new Date().toISOString().split("T")[0],
      horaInicio: "14:00",
      horaFin: "14:30",
      duracion: 30,
      tipo: "Control",
      disponible: false,
      color: "#f59e0b",
      profesion: "Médico general",
      observaciones: "Control de seguimiento de paciente",
    },
    {
      id: 5,
      plantillaId: 3,
      profesionalId: 1,
      profesionalNombre: "Dr. Juan Pérez",
      fecha: new Date().toISOString().split("T")[0],
      horaInicio: "14:30",
      horaFin: "15:00",
      duracion: 30,
      tipo: "Control",
      disponible: true,
      color: "#f59e0b",
      profesion: "Médico general",
      observaciones: "Control de seguimiento de paciente",
    },
  ],
}

export interface Usuario {
  id: number
  nombre: string
  apellidos: string
  run: string
  profesion: string
  telefono: string
  email: string
  cargo: string
  description?: string
  avatar?: string
  specialties?: string[]
  workingHours?: { start: string; end: string }
  preferences?: { theme?: string; primaryColor?: string; language?: string }
  isPublic?: boolean
  rol: "profesional" | "administrativo"
  esAdmin: boolean
  activo: boolean
  password: string
}

export interface Paciente {
  id: number
  nombre: string
  run: string
  telefono: string
  email: string
  fechaNacimiento: string
  ultimaVisita: string
}

export interface Cita {
  id: number
  pacienteId: number
  pacienteNombre: string
  pacienteApellidos?: string
  profesionalId: number
  profesionalNombre: string
  fecha: string
  hora: string
  tipo: string
  estado: "confirmada" | "pendiente" | "cancelada"
  moduloId?: number
  esSobrecupo?: boolean
  observacion?: string
  originalModuloColor?: string
}

export interface Modulo {
  id: number
  plantillaId?: number // FK a PlantillaModulo
  profesionalId: number
  profesionalNombre: string
  fecha: string
  horaInicio: string
  horaFin: string
  duracion: number
  tipo: string
  disponible: boolean
  color: string
  profesion?: string
  observaciones?: string
}

export interface PlantillaModulo {
  id: number
  tipo: string
  duracion: number
  profesion: string
  color: string
  observaciones: string
  profesionalId: number
}
