/**
 * ARCHIVO: lib/validations.ts
 * PROPÓSITO: Funciones de validación para formularios
 */

/**
 * Valida un RUN chileno usando la regla de los 11
 * @param run - RUN sin formato (solo números)
 * @returns true si el RUN es válido
 */
export const validateRUN = (run: string): boolean => {
  // Limpiar y validar formato
  const cleanRun = run.replace(/[^0-9-]/g, '')
  const parts = cleanRun.split('-')

  if (parts.length !== 2) return false

  const runNumber = parts[0]
  const verifier = parts[1]

  if (runNumber.length !== 8 || verifier.length !== 1) return false

  // Calcular dígito verificador
  let sum = 0
  let multiplier = 2

  for (let i = runNumber.length - 1; i >= 0; i--) {
    sum += parseInt(runNumber[i]) * multiplier
    multiplier++
    if (multiplier > 7) multiplier = 2
  }

  const remainder = sum % 11
  let calculatedVerifier: string | number = 11 - remainder

  if (calculatedVerifier === 11) calculatedVerifier = 0
  if (calculatedVerifier === 10) calculatedVerifier = 'K'

  const expectedVerifier =
    calculatedVerifier === 'K' ? 'K' : (calculatedVerifier as number).toString()

  return verifier.toUpperCase() === expectedVerifier
}

/**
 * Formatea un RUN a la estructura correcta: 12345678-9
 * @param run - RUN sin formato o parcialmente formateado
 * @returns RUN formateado
 */
export const formatRUN = (run: string): string => {
  // Limpiar todo excepto números
  const cleanRun = run.replace(/[^0-9Kk]/g, '')

  if (cleanRun.length === 0) return ''

  // Si tiene menos de 8 números, solo mostrar sin guion
  if (cleanRun.length <= 8) return cleanRun

  // Si tiene 8-9 caracteres, formatear con guion
  const runPart = cleanRun.substring(0, 8)
  const verifierPart = cleanRun.substring(8, 9).toUpperCase()

  return `${runPart}-${verifierPart}`
}

/**
 * Valida contraseña con requisitos: al menos 1 mayúscula y 1 número
 * @param password - Contraseña a validar
 * @returns true si cumple requisitos
 */
export const validatePassword = (password: string): boolean => {
  const hasUpperCase = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasMinLength = password.length >= 8

  return hasUpperCase && hasNumber && hasMinLength
}

/**
 * Valida email
 * @param email - Email a validar
 * @returns true si es válido
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida teléfono chileno
 * @param phone - Teléfono a validar
 * @returns true si es válido
 */
export const validatePhone = (phone: string): boolean => {
  if (phone === '') return true // Opcional
  const phoneRegex = /^[+]?56?[\s]?9[\s]?\d{4}[\s]?\d{4}$/
  return phoneRegex.test(phone)
}

/**
 * Lista de profesiones disponibles
 */
export const PROFESIONES = [
  'Psiquiatra Infanto Juvenil',
  'Médico residente Psiq. Infanto Juvenil',
  'Médico general',
  'Asistente social',
  'Psicologo(a)',
  'Terapeuta ocupacional',
  'Fonoaudiologo(a)',
  'Enfermero(a)',
  'Tecn. Enfermería',
  'Administrativo(a)',
  'Pediatra',
]
