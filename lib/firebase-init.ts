/**
 * ARCHIVO: lib/firebase-init.ts
 * PROPÓSITO: Sistema de inicialización automática de Firebase Firestore
 * 
 * Este archivo contiene todas las funciones necesarias para:
 * 1. Crear las colecciones en Firestore
 * 2. Importar datos iniciales (usuarios, pacientes, citas, etc.)
 * 3. Configurar índices y reglas de seguridad
 * 4. Verificar que todo esté correcto
 * 
 * ¿Por qué existe?
 * - Cuando despliegas tu app online, Firestore empieza vacío
 * - Este archivo se encarga de llenar todo automáticamente
 * - Solo se ejecuta UNA VEZ (por seguridad)
 */

import {
  db,
  addUserWithAuth,
  updateUserProfile,
} from './firebaseConfig'
import {
  collection,
  addDoc,
  setDoc,
  doc,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore'

// Importar los datos de demostración
// Nota: DEMO_DATA ya no se importa automáticamente.
// La importación se hará solo si la variable de entorno ENABLE_DEMO_DATA está activada.
// Esto evita que la inicialización sobreescriba o inserte datos de ejemplo en bases
// de datos reales que ya contengan información.
import type {
  Usuario,
  Paciente,
  Cita,
  Modulo,
  PlantillaModulo,
} from './demoData'

// Variable que se rellenará dinámicamente si ENABLE_DEMO_DATA=true
let DEMO_DATA: any = undefined

/**
 * INTERFAZ: Resultado de inicialización
 * Nos ayuda a saber si todo salió bien o hubo errores
 */
export interface InitializationResult {
  success: boolean
  message: string
  stats: {
    usuariosCreados: number
    pacientesCreados: number
    citasCreadas: number
    modulosCreados: number
    plantillasCreadas: number
  }
  errors: string[]
}

/**
 * FUNCIÓN: Inicializar toda la base de datos
 * 
 * Esto es el "punto de entrada" principal.
 * Llama a todas las otras funciones en el orden correcto.
 * 
 * Ejemplo de uso:
 *   const resultado = await initializeDatabase()
 *   if (resultado.success) {
 *     console.log('Base de datos lista!')
 *   }
 */
export async function initializeDatabase(): Promise<InitializationResult> {
  console.log('🚀 INICIANDO CONFIGURACIÓN DE FIREBASE...')

  const result: InitializationResult = {
    success: true,
    message: '',
    stats: {
      usuariosCreados: 0,
      pacientesCreados: 0,
      citasCreadas: 0,
      modulosCreados: 0,
      plantillasCreadas: 0,
    },
    errors: [],
  }

  try {
    // PASO 1: Verificar si ya está inicializado
    console.log('📋 Verificando si la BD ya está configurada...')
    const yaExiste = await checkIfInitialized()
    if (yaExiste) {
      result.message =
        '✅ La base de datos ya está configurada. No se requiere inicialización.'
      console.log(result.message)
      return result
    }

    // Si la base de datos NO está marcada como inicializada, comprobamos si ya
    // existen documentos en las colecciones objetivo. Si existen, asumimos que
    // la BD contiene datos reales y NO ejecutamos la importación de demo.
    const existingCollections = ['users', 'pacientes', 'citas', 'modulos', 'plantillas', 'usuarios', 'moduloDefinitions']
    for (const colName of existingCollections) {
      try {
        const snap = await getDocs(collection(db, colName))
        if (!snap.empty) {
          result.message = `ℹ️ La colección "${colName}" ya contiene datos. Se omite la importación de demo.`
          console.log(result.message)
          // Marcar como inicializado para no volver a intentar (evita sobrescrituras)
          await markAsInitialized()
          return result
        }
      } catch (err) {
        // Si la colección no existe o hay error, ignorar y continuar
      }
    }

    // A partir de aquí: la base de datos no está inicializada y no contiene datos
    // de las colecciones objetivo. La importación de DEMO_DATA se hará SOLO si
    // la variable de entorno ENABLE_DEMO_DATA está establecida a 'true'. Esto
    // evita que demos se inserten accidentalmente en entornos reales.
    if (process.env.ENABLE_DEMO_DATA !== 'true') {
      result.message = 'ℹ️ Importación de demo deshabilitada (ENABLE_DEMO_DATA != true). No se realizaron cambios.'
      console.log(result.message)
      // Marcamos como inicializado para evitar ejecuciones repetidas en setups
      await markAsInitialized()
      return result
    }

    // IMPORTACIÓN OPT-IN: Cargar DEMO_DATA dinámicamente sólo cuando esté permitido
    console.log('⚠️ ENABLE_DEMO_DATA=true -> importando datos de demostración')
  const demoModule = await import('./demoData')
  DEMO_DATA = demoModule.DEMO_DATA

    // PASO 2: Crear usuarios con autenticación
    console.log('👥 Creando usuarios con autenticación...')
    const usuariosStats = await importarUsuarios(result.errors)
    result.stats.usuariosCreados = usuariosStats

    // PASO 3: Crear pacientes
    console.log('🏥 Importando pacientes...')
    const pacientesStats = await importarPacientes(result.errors)
    result.stats.pacientesCreados = pacientesStats

    // PASO 4: Crear plantillas (templates)
    console.log('📝 Importando plantillas de módulos...')
    const plantillasStats = await importarPlantillas(result.errors)
    result.stats.plantillasCreadas = plantillasStats

    // PASO 5: Crear módulos (instancias)
    console.log('📅 Importando módulos (citas disponibles)...')
    const modulosStats = await importarModulos(result.errors)
    result.stats.modulosCreados = modulosStats

    // PASO 6: Crear citas
    console.log('✏️ Importando citas agendadas...')
    const citasStats = await importarCitas(result.errors)
    result.stats.citasCreadas = citasStats

    // PASO 7: Crear marca de inicialización
    console.log('🔒 Marcando base de datos como inicializada...')
    await markAsInitialized()

    // Mensaje final
    if (result.errors.length === 0) {
      result.message = '✅ Base de datos inicializada exitosamente'
    } else {
      result.message = `⚠️ Inicialización completada con ${result.errors.length} advertencias`
      result.success = false
    }

    console.log(result.message)
    console.log('📊 ESTADÍSTICAS:', result.stats)
    console.log('✨ INICIALIZACIÓN COMPLETADA')

    return result
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
    result.success = false
    result.message = `❌ Error durante inicialización: ${errorMsg}`
    result.errors.push(errorMsg)
    console.error(result.message, error)
    return result
  }
}

/**
 * FUNCIÓN: Verificar si la BD ya está inicializada
 * 
 * Buscamos un documento especial "initialized" en la colección "config"
 * Si existe, significa que ya corrimos este script antes
 */
async function checkIfInitialized(): Promise<boolean> {
  try {
    const configDoc = await getDocs(
      query(collection(db, 'config'), where('type', '==', 'initialized'))
    )
    return !configDoc.empty
  } catch (error) {
    console.log('Primer acceso a Firestore, continuando...')
    return false
  }
}

/**
 * FUNCIÓN: Marcar base de datos como inicializada
 * 
 * Crea un documento especial que nos indica que ya pasamos por aquí
 */
async function markAsInitialized(): Promise<void> {
  try {
    await setDoc(doc(collection(db, 'config'), 'initialized'), {
      type: 'initialized',
      fecha: new Date(),
      version: '1.0',
    })
  } catch (error) {
    console.warn('No se pudo marcar como inicializado:', error)
  }
}

/**
 * FUNCIÓN: Importar usuarios
 * 
 * Crea cada usuario en tres lugares:
 * 1. Firebase Authentication (para login)
 * 2. Firestore collection "users" (para perfil)
 * 3. Firestore collection "profesionales" (para profesionales)
 */
async function importarUsuarios(errors: string[]): Promise<number> {
  let count = 0
  // Si se importó DEMO_DATA (opt-in), usarla
  if (DEMO_DATA && Array.isArray(DEMO_DATA.usuarios)) {
    for (const usuario of DEMO_DATA.usuarios) {
      try {
        // Solo crear cuenta Auth si viene password y la importación de demo está habilitada
        if (usuario.password && process.env.ENABLE_DEMO_DATA === 'true') {
          await addUserWithAuth({
            uid: `usuario-${usuario.id}`,
            email: usuario.email,
            password: usuario.password,
            nombreCompleto: `${usuario.nombre} ${usuario.apellidos}`,
          })
        }

        const usuarioData = {
          ...usuario,
          uid: `usuario-${usuario.id}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        await setDoc(doc(db, 'users', `usuario-${usuario.id}`), usuarioData)

        if (usuario.rol === 'profesional') {
          await setDoc(doc(db, 'profesionales', `usuario-${usuario.id}`), usuarioData)
        }

        count++
        console.log(`  ✓ Usuario DEMO procesado: ${usuario.nombre} ${usuario.apellidos}`)
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error desconocido'
        errors.push(`Usuario ${usuario.nombre}: ${msg}`)
        console.warn(`  ✗ Error con usuario ${usuario.nombre}:`, msg)
      }
    }
    return count
  }

  // Si no hay DEMO_DATA, intentar leer desde la colección real 'usuarios'
  try {
    const snap = await getDocs(collection(db, 'usuarios'))
    if (snap.empty) return 0

    for (const docSnap of snap.docs) {
      try {
        const usuario = docSnap.data() as any
        // Se espera que cada profesional tenga un campo 'id' y 'run' formateado
        const uid = usuario.id ? String(usuario.id) : docSnap.id

        const usuarioData = {
          ...usuario,
          uid,
          createdAt: usuario.createdAt ? usuario.createdAt : new Date(),
          updatedAt: new Date(),
        }

        await setDoc(doc(db, 'users', uid), usuarioData)

        if (usuario.rol === 'profesional') {
          await setDoc(doc(db, 'profesionales', uid), usuarioData)
        }

        count++
        console.log(`  ✓ Usuario importado desde Firestore: ${uid}`)
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error desconocido'
        errors.push(`Usuario doc ${docSnap.id}: ${msg}`)
        console.warn(`  ✗ Error con usuario doc ${docSnap.id}:`, msg)
      }
    }
  } catch (error) {
    console.warn('  ✗ No se pudo leer la colección "usuarios":', error)
  }

  return count

  return count
}

/**
 * FUNCIÓN: Importar pacientes
 * 
 * Cada paciente se guarda en la colección "pacientes"
 * Incluye datos personales, contacto, y historial
 */
async function importarPacientes(errors: string[]): Promise<number> {
  let count = 0

  if (DEMO_DATA && Array.isArray(DEMO_DATA.pacientes)) {
    for (const paciente of DEMO_DATA.pacientes) {
      try {
        const pacienteData = {
          ...paciente,
          createdAt: new Date(),
          updatedAt: new Date(),
          activo: true,
        }

        await setDoc(doc(db, 'pacientes', `paciente-${paciente.id}`), pacienteData)

        count++
        console.log(`  ✓ Paciente DEMO procesado: ${paciente.nombre}`)
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error desconocido'
        errors.push(`Paciente ${paciente.nombre}: ${msg}`)
        console.warn(`  ✗ Error con paciente ${paciente.nombre}:`, msg)
      }
    }
    return count
  }

  // Si no hay DEMO_DATA, leer desde la colección real 'pacientes' y asegurarnos de que existan
  try {
    const snap = await getDocs(collection(db, 'pacientes'))
    for (const docSnap of snap.docs) {
      // No clonamos ni sobrescribimos, solo contamos y aseguramos timestamps mínimos
      count++
    }
    console.log(`  ℹ️ Encontrados ${count} paciente(s) en la colección 'pacientes'`)
  } catch (error) {
    console.warn('  ✗ No se pudo leer la colección "pacientes":', error)
  }

  return count

  return count
}

/**
 * FUNCIÓN: Importar plantillas de módulos
 * 
 * Las plantillas son "templates" o definiciones de tipo de cita
 * Cada profesional tiene sus propias plantillas
 * Ejemplo: "Consulta General", "Cardiología", "Control", etc.
 */
async function importarPlantillas(errors: string[]): Promise<number> {
  let count = 0

  if (DEMO_DATA && Array.isArray(DEMO_DATA.plantillas)) {
    for (const plantilla of DEMO_DATA.plantillas) {
      try {
        const plantillaData = {
          ...plantilla,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        await setDoc(doc(db, 'plantillas', `plantilla-${plantilla.id}`), plantillaData)

        count++
        console.log(`  ✓ Plantilla DEMO procesada: ${plantilla.tipo}`)
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error desconocido'
        errors.push(`Plantilla ${plantilla.tipo}: ${msg}`)
        console.warn(`  ✗ Error con plantilla ${plantilla.tipo}:`, msg)
      }
    }
    return count
  }

  // Si no hay DEMO_DATA, intentar leer desde 'moduloDefinitions' o 'plantillas'
  try {
    const sourceCol = (await getDocs(collection(db, 'moduloDefinitions'))).size > 0 ? 'moduloDefinitions' : 'plantillas'
    const snap = await getDocs(collection(db, sourceCol))
    for (const docSnap of snap.docs) {
      try {
        const plantilla = docSnap.data()
        const id = docSnap.id
        await setDoc(doc(db, 'plantillas', id), {
          ...plantilla,
          createdAt: plantilla.createdAt ? plantilla.createdAt : new Date(),
          updatedAt: new Date(),
        })
        count++
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error desconocido'
        errors.push(`Plantilla doc ${docSnap.id}: ${msg}`)
      }
    }
    console.log(`  ℹ️ Procesadas ${count} plantilla(s) desde '${sourceCol}'`)
  } catch (error) {
    console.warn('  ✗ No se pudo leer la colección de plantillas:', error)
  }

  return count

  return count
}

/**
 * FUNCIÓN: Importar módulos
 * 
 * Los módulos son "instancias" o "slots" de tiempo en el calendario
 * Son los horarios donde los pacientes pueden agendar
 * Ejemplo: "Lunes 09:00 a 09:45" es un módulo
 */
async function importarModulos(errors: string[]): Promise<number> {
  let count = 0

  if (DEMO_DATA && Array.isArray(DEMO_DATA.modulos)) {
    for (const modulo of DEMO_DATA.modulos) {
      try {
        const moduloData = {
          ...modulo,
          createdAt: new Date(),
          updatedAt: new Date(),
          pacienteId: null,
        }

        await setDoc(doc(db, 'modulos', `modulo-${modulo.id}`), moduloData)

        count++
        console.log(`  ✓ Módulo DEMO procesado: ${modulo.tipo} - ${modulo.horaInicio}`)
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error desconocido'
        errors.push(`Módulo ${modulo.tipo}: ${msg}`)
        console.warn(`  ✗ Error con módulo ${modulo.tipo}:`, msg)
      }
    }
    return count
  }

  // Si no hay DEMO_DATA, contar/asegurar módulos existentes
  try {
    const snap = await getDocs(collection(db, 'modulos'))
    console.log(`  ℹ️ Encontrados ${snap.size} módulo(s) en 'modulos'`)
    count = snap.size
  } catch (error) {
    console.warn('  ✗ No se pudo leer la colección "modulos":', error)
  }

  return count

  return count
}

/**
 * FUNCIÓN: Importar citas
 * 
 * Las citas son "reservas" de un paciente con un profesional
 * Están asociadas a un módulo (si está confirmada)
 * Estados: confirmada, pendiente, cancelada
 */
async function importarCitas(errors: string[]): Promise<number> {
  let count = 0

  if (DEMO_DATA && Array.isArray(DEMO_DATA.citas)) {
    for (const cita of DEMO_DATA.citas) {
      try {
        const citaData = {
          ...cita,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        await setDoc(doc(db, 'citas', `cita-${cita.id}`), citaData)

        count++
        console.log(`  ✓ Cita DEMO procesada: ${cita.pacienteNombre} - ${cita.hora}`)
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error desconocido'
        errors.push(`Cita ${cita.pacienteNombre}: ${msg}`)
        console.warn(`  ✗ Error con cita ${cita.pacienteNombre}:`, msg)
      }
    }
    return count
  }

  // Si no hay DEMO_DATA, contar citas existentes
  try {
    const snap = await getDocs(collection(db, 'citas'))
    console.log(`  ℹ️ Encontradas ${snap.size} cita(s) en 'citas'`)
    count = snap.size
  } catch (error) {
    console.warn('  ✗ No se pudo leer la colección "citas":', error)
  }

  return count

  return count
}

/**
 * FUNCIÓN: Limpiar toda la base de datos
 * 
 * ⚠️ PELIGROSO - Borra todo
 * Solo usar durante desarrollo, NO en producción
 */
export async function wipeDatabase(): Promise<void> {
  console.warn('⚠️ LIMPIANDO TODA LA BASE DE DATOS...')

  const collections = ['users', 'pacientes', 'citas', 'modulos', 'plantillas']

  for (const colName of collections) {
    try {
      const snapshot = await getDocs(collection(db, colName))
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref)
      }
      console.log(`  ✓ Colección "${colName}" limpiada`)
    } catch (error) {
      console.warn(`  ✗ Error limpiando "${colName}":`, error)
    }
  }

  console.warn('⚠️ BASE DE DATOS LIMPIADA')
}

/**
 * FUNCIÓN: Obtener estadísticas de la BD
 * 
 * Muestra cuántos documentos hay en cada colección
 * Útil para verificar que todo está bien
 */
export async function getDatabaseStats(): Promise<{
  usuarios: number
  pacientes: number
  citas: number
  modulos: number
  plantillas: number
}> {
  const stats = {
    usuarios: 0,
    pacientes: 0,
    citas: 0,
    modulos: 0,
    plantillas: 0,
  }

  try {
    stats.usuarios = (await getDocs(collection(db, 'users'))).size
    stats.pacientes = (await getDocs(collection(db, 'pacientes'))).size
    stats.citas = (await getDocs(collection(db, 'citas'))).size
    stats.modulos = (await getDocs(collection(db, 'modulos'))).size
    stats.plantillas = (await getDocs(collection(db, 'plantillas'))).size
  } catch (error) {
    console.warn('Error obteniendo estadísticas:', error)
  }

  return stats
}
