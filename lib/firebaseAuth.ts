/**
 * ARCHIVO: lib/firebaseAuth.ts
 * PROPÓSITO: Manejo de autenticación con Firebase Authentication
 * 
 * Funciones principales:
 * - loginWithEmail: Login con email/contraseña
 * - logoutUser: Cerrar sesión
 * - onAuthChange: Escuchar cambios de autenticación
 * - getCurrentUser: Obtener usuario actual
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  getAuth,
} from 'firebase/auth'
import { db } from './firebaseConfig'
import { getDoc, setDoc, doc } from 'firebase/firestore'

// Obtener instancia de Firebase Auth
export const auth = getAuth()

/**
 * Login con Firebase Authentication
 * @param email - Email del usuario
 * @param password - Contraseña del usuario
 * @returns Objeto con { success, user, userData, error }
 */
export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Obtener datos adicionales del usuario de Firestore
    let userData: any = null
    try {
      const userDoc = await getDoc(doc(db, 'usuarios', user.uid))
      userData = userDoc.data()

      // Si el usuario no existe en Firestore, crearlo automáticamente
      if (!userData) {
        console.log('⚠️ Usuario no encontrado en Firestore, creando automáticamente...')
        userData = {
          id: user.uid,
          email: user.email,
          nombre: user.displayName || 'Usuario',
          apellidos: '',
          rol: 'profesional',
          esAdmin: false,
          activo: true,
          fechaRegistro: new Date().toISOString(),
        }
        // Guardar en Firestore
        await setDoc(doc(db, 'usuarios', user.uid), userData)
        console.log('✅ Usuario creado en Firestore')
      }
    } catch (error: any) {
      console.warn('⚠️ Error al obtener/crear usuario en Firestore:', error.message)
      // Crear usuario básico si hay error
      userData = {
        id: user.uid,
        email: user.email,
        nombre: user.displayName || 'Usuario',
        apellidos: '',
        rol: 'profesional',
        esAdmin: false,
        activo: true,
      }
    }

    // Crear token con información del usuario
    const token = {
      id: user.uid,
      email: user.email,
      nombre: userData?.nombre || user.displayName || 'Usuario',
      apellidos: userData?.apellidos || '',
      rol: userData?.rol || 'profesional',
      esAdmin: userData?.esAdmin || false,
      cambioPasswordRequerido: userData?.cambioPasswordRequerido || false,
      timestamp: Date.now(),
    }

    // Guardar en localStorage para SPA
    localStorage.setItem('sistema_auth_token', JSON.stringify(token))
    localStorage.setItem('usuario_id', user.uid)

    console.log('✅ Login exitoso:', token.email)
    return { success: true, user, userData: token }
  } catch (error: any) {
    console.error('❌ Error en login:', error.code, error.message)
    
    // Mapear errores de Firebase a mensajes legibles
    let errorMessage = 'Error al iniciar sesión'
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Usuario no encontrado. Por favor, verifica tu email.'
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Contraseña incorrecta. Por favor, intenta de nuevo.'
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido.'
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'Esta cuenta ha sido deshabilitada.'
    }

    return { success: false, error: errorMessage, rawError: error }
  }
}

/**
 * Crear nuevo usuario en Firebase Authentication
 * @param email - Email del nuevo usuario
 * @param password - Contraseña del nuevo usuario
 * @returns Objeto con { success, user, error }
 */
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    console.log('✅ Usuario creado:', user.email)
    return { success: true, user }
  } catch (error: any) {
    console.error('❌ Error en registro:', error.code, error.message)

    let errorMessage = 'Error al crear usuario'
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Este email ya está registrado.'
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido.'
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'La contraseña es muy débil (mínimo 6 caracteres).'
    }

    return { success: false, error: errorMessage, rawError: error }
  }
}

/**
 * Logout/Cerrar sesión
 * @returns Objeto con { success, error }
 */
export const logoutUser = async () => {
  try {
    // Limpiar localStorage
    localStorage.removeItem('sistema_auth_token')
    localStorage.removeItem('usuario_id')

    // Cerrar sesión en Firebase
    await signOut(auth)

    console.log('✅ Logout exitoso')
    return { success: true }
  } catch (error: any) {
    console.error('❌ Error en logout:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Escuchar cambios en el estado de autenticación
 * @param callback - Función que se llama cuando cambia el estado
 * @returns Función para dejar de escuchar
 */
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('👤 Usuario autenticado:', user.email)
    } else {
      console.log('🚪 Usuario desautenticado')
    }
    callback(user)
  })
}

/**
 * Obtener usuario actual de Firebase Auth
 * @returns Usuario actual o null
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser
}

/**
 * Obtener token del usuario actual desde localStorage
 * @returns Token del usuario o null
 */
export const getStoredToken = () => {
  if (typeof window === 'undefined') return null
  const token = localStorage.getItem('sistema_auth_token')
  if (token) {
    try {
      return JSON.parse(token)
    } catch {
      return null
    }
  }
  return null
}

/**
 * Verificar si el usuario está autenticado
 * @returns true si está autenticado
 */
export const isAuthenticated = (): boolean => {
  return !!getCurrentUser() || !!getStoredToken()
}

/**
 * Verificar si el usuario actual es administrador
 * @returns true si es admin
 */
export const isAdmin = (): boolean => {
  const token = getStoredToken()
  return token?.esAdmin === true
}

/**
 * Obtener ID del usuario actual
 * @returns ID del usuario o null
 */
export const getCurrentUserId = (): string | null => {
  const currentUser = getCurrentUser()
  if (currentUser) return currentUser.uid

  const token = getStoredToken()
  if (token) return token.id

  return null
}

/**
 * Obtener email del usuario actual
 * @returns Email del usuario o null
 */
export const getCurrentUserEmail = (): string | null => {
  const currentUser = getCurrentUser()
  if (currentUser) return currentUser.email || null

  const token = getStoredToken()
  if (token) return token.email

  return null
}
