/**
 * Utilidades para generación de contraseñas seguras
 * Cumple con requisitos: 1 mayúscula, 1 número, mínimo 6 caracteres
 */

/**
 * Genera una contraseña temporal segura
 * Requisitos:
 * - Mínimo 6 caracteres
 * - Al menos 1 letra mayúscula
 * - Al menos 1 número
 * - Caracteres aleatorios
 * 
 * @returns Contraseña temporal segura
 */
export function generateTemporaryPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%&'
  
  // Garantizar al menos 1 mayúscula y 1 número
  const requiredChars = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
  ]
  
  // Resto de caracteres aleatorios (mínimo 4 más para llegar a 6)
  const allChars = uppercase + lowercase + numbers + special
  const remainingLength = Math.max(6 - requiredChars.length, 4)
  
  for (let i = 0; i < remainingLength; i++) {
    requiredChars.push(allChars[Math.floor(Math.random() * allChars.length)])
  }
  
  // Mezclar (shuffle) los caracteres para que no siempre empiece con mayúscula
  return requiredChars.sort(() => Math.random() - 0.5).join('')
}

/**
 * Copia texto al portapapeles
 * @param text Texto a copiar
 * @returns true si fue exitoso, false si falló
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Error al copiar al portapapeles:', err)
    // Fallback para navegadores antiguos
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch (fallbackErr) {
      console.error('Fallback de portapapeles también falló:', fallbackErr)
      return false
    }
  }
}
