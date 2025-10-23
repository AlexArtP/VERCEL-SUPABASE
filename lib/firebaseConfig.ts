/**
 * ARCHIVO: lib/firebaseConfig.ts
 * PROPÓSITO: Configuración central de Firebase con Firestore + Authentication
 * 
 * Este archivo conecta tu app con Firebase en la nube y proporciona:
 * - Firestore: Base de datos para guardar datos
 * - Authentication: Sistema para login de usuarios
 * - Listeners: Para sincronización en tiempo real
 */

import { initializeApp, getApps } from 'firebase/app'
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  where,
  QueryConstraint,
  addDoc,
  setDoc,
  doc,
  getDocs,
} from 'firebase/firestore'
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth'

// PASO 1: Credenciales de Firebase
// Estos valores vienen del archivo .env.local
const firebaseConfig = {
  apiKey: "AIzaSyB8kRSzHD_H1_NhF8Rr-yF2gFPukpZJ5rM",
  authDomain: "agendacecosam.firebaseapp.com",
  projectId: "agendacecosam",
  storageBucket: "agendacecosam.appspot.com",
  messagingSenderId: "66728286123",
  appId: "1:66728286123:web:287a51b05cb848644ea4ee"
}

// PASO 2: Inicializar Firebase (evitar duplicados en Next.js build)
// Usa getApps() para detectar si ya existe una app inicializada
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)

// PASO 3: Obtener acceso a Firestore (base de datos)
export const db = getFirestore(app)

// PASO 4: Obtener acceso a Authentication (login)
export const auth = getAuth(app)

// PASO 4: Funciones para "escuchar" cambios en tiempo real
// Cuando algo cambia en Firebase, estas funciones te lo notifican

/**
 * Escucha cambios en módulos en tiempo real
 *
 * ¿Cómo funciona?
 * - Firebase vigila todos los módulos del profesional
 * - Cuando algo cambia, llama a la función "callback"
 * - La función callback recibe los módulos actualizados
 *
 * Ejemplo:
 *   setupModulosListener(1, (modulos) => {
 *     console.log('Nuevos módulos:', modulos)
 *     setModulos(modulos)  // Actualizar estado
 *   })
 */
export function setupModulosListener(
  profesionalId: string | number,
  callback: (modulos: any[]) => void,
  startISO?: string,
  endISO?: string,
) {
  // Crear consulta: Módulos del profesional y opcionalmente dentro de un rango de fecha visible (YYYY-MM-DD)
  const constraints: QueryConstraint[] = [
    where('profesionalId', '==', String(profesionalId))
  ]
  if (startISO) constraints.push(where('fecha', '>=', startISO))
  if (endISO) constraints.push(where('fecha', '<=', endISO))

  const q = query(
    collection(db, 'modulos'),
    ...constraints
  )

  console.log('📡 setupModulosListener: escuchando módulos del profesional:', profesionalId)

  // onSnapshot = "escuchar cambios en tiempo real"
  // Retorna una función para dejar de escuchar
  return onSnapshot(q, (snapshot) => {
    const modulos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    console.log('📦 setupModulosListener UPDATE: Se recibieron', modulos.length, 'módulos')
    // Llamar al callback con los datos nuevos
    callback(modulos)
  }, (error) => {
    console.error('❌ Error en setupModulosListener:', error)
  })
}

/**
 * Escucha cambios en citas en tiempo real
 */
export function setupCitasListener(
  profesionalId: string | number,
  callback: (citas: any[]) => void,
  startISO?: string,
  endISO?: string,
) {
  const constraints: QueryConstraint[] = [
    where('profesionalId', '==', String(profesionalId))
  ]
  if (startISO) constraints.push(where('fecha', '>=', startISO))
  if (endISO) constraints.push(where('fecha', '<=', endISO))

  const q = query(
    collection(db, 'citas'),
    ...constraints
  )

  return onSnapshot(q, (snapshot) => {
    const citas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(citas)
  })
}

/**
 * Escucha cambios en plantillas en tiempo real
 * Nota: obtiene TODAS las plantillas sin filtrar por estamento.
 * El filtrado por profesional se hace en el componente que las consume.
 */
export function setupPlantillasListener(
  estamento: string,
  callback: (plantillas: any[]) => void
) {
  // Leer TODAS las plantillas definidas desde la colección "moduloDefinitions"
  // Sin filtro de estamento para que "Gestionar Módulos" pueda mostrar todas las del profesional
  const q = query(collection(db, 'moduloDefinitions'))

  return onSnapshot(q, (snapshot) => {
    const plantillas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(plantillas)
  })
}

// =====================================
// FUNCIONES DE AUTENTICACIÓN
// =====================================

/**
 * INTERFAZ: Datos para crear usuario
 */
export interface CreateUserData {
  uid: string
  email: string
  password: string
  nombreCompleto: string
}

/**
 * FUNCIÓN: Crear usuario con autenticación
 * 
 * Crea un usuario en Firebase Authentication
 * Luego lo guarda en Firestore
 * 
 * Retorna el ID del usuario
 */
export async function addUserWithAuth(
  userData: CreateUserData
): Promise<string> {
  try {
    // Crear usuario en Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    )

    const user = userCredential.user

    // Actualizar perfil con nombre completo
    await updateProfile(user, {
      displayName: userData.nombreCompleto,
    })

    console.log('✓ Usuario creado en Authentication:', user.uid)
    return user.uid
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error creando usuario:', msg)
    throw error
  }
}

/**
 * FUNCIÓN: Login de usuario
 * 
 * Autentica un usuario con email y contraseña
 * Retorna los datos del usuario
 */
export async function loginUser(
  email: string,
  password: string
): Promise<User | null> {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    )
    console.log('✓ Usuario autenticado:', userCredential.user.email)
    return userCredential.user
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en login:', msg)
    throw error
  }
}

/**
 * FUNCIÓN: Logout
 * 
 * Cierra la sesión del usuario actual
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth)
    console.log('✓ Usuario desconectado')
  } catch (error) {
    console.error('Error en logout:', error)
    throw error
  }
}

/**
 * FUNCIÓN: Actualizar perfil de usuario
 * 
 * Actualiza los datos del usuario en Firestore
 */
export async function updateUserProfile(
  userId: string,
  updates: any
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    await setDoc(userRef, updates, { merge: true })
    console.log('✓ Perfil actualizado')
  } catch (error) {
    console.error('Error actualizando perfil:', error)
    throw error
  }
}

/**
 * FUNCIÓN: Listener para estado de autenticación
 * 
 * Se ejecuta cada vez que el usuario inicia/cierra sesión
 * Útil para mostrar/ocultar componentes según si está autenticado
 */
export function onAuthStateChange(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback)
}

/**
 * FUNCIÓN: Obtener usuario actual
 */
export function getCurrentUser(): User | null {
  return auth.currentUser
}

/**
 * FUNCIÓN: Obtener módulos de una semana específica (consulta puntual, no listener)
 * Útil para cargar dinámicamente módulos de semanas fuera del rango visible
 */
export async function getWeekModules(
  profesionalId: string | number,
  startISO: string,
  endISO: string,
): Promise<any[]> {
  try {
    const q = query(
      collection(db, 'modulos'),
      where('profesionalId', '==', String(profesionalId)),
      where('fecha', '>=', startISO),
      where('fecha', '<=', endISO),
    )
    
    const snapshot = await getDocs(q)
    const modulos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    console.log('📦 getWeekModules: Se obtuvieron', modulos.length, 'módulos para', startISO, '-', endISO)
    return modulos
  } catch (error) {
    console.error('❌ Error en getWeekModules:', error)
    return []
  }
}

/**
 * FUNCIÓN: Obtener citas de una semana específica (consulta puntual)
 */
export async function getWeekCitas(
  profesionalId: string | number,
  startISO: string,
  endISO: string,
): Promise<any[]> {
  try {
    const q = query(
      collection(db, 'citas'),
      where('profesionalId', '==', String(profesionalId)),
      where('fecha', '>=', startISO),
      where('fecha', '<=', endISO),
    )
    const snapshot = await getDocs(q)
    const citas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    console.log('📦 getWeekCitas:', citas.length, 'citas para', startISO, '-', endISO)
    return citas
  } catch (error) {
    console.error('❌ Error en getWeekCitas:', error)
    return []
  }
}

