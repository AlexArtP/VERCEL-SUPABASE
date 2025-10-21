/**
 * ARCHIVO: lib/authHelpers.ts
 * PROPÓSITO: Funciones auxiliares para autenticación segura
 */

/**
 * Genera una contraseña temporal segura
 * Formato: 12 caracteres con mayúsculas, minúsculas, números y símbolos
 */
export function generateTemporaryPassword(): string {
  const chars = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*',
  }

  const allChars = Object.values(chars).join('')

  let password = ''
  // Asegurar al menos un carácter de cada tipo
  password += chars.uppercase[Math.floor(Math.random() * chars.uppercase.length)]
  password += chars.lowercase[Math.floor(Math.random() * chars.lowercase.length)]
  password += chars.numbers[Math.floor(Math.random() * chars.numbers.length)]
  password += chars.symbols[Math.floor(Math.random() * chars.symbols.length)]

  // Rellenar el resto aleatoriamente
  for (let i = password.length; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Mezclar la contraseña
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

/**
 * Valida si una contraseña cumple con los requisitos mínimos
 */
export function isValidPassword(password: string): boolean {
  return !!password && password.length >= 8
}

/**
 * Valida si un email tiene formato correcto
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
