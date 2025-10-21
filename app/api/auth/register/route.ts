/**
 * ARCHIVO: app/api/auth/register/route.ts
 * PROPÓSITO: Endpoint para registrar nuevos usuarios
 * 
 * POST /api/auth/register
 * Body: {
 *   nombre, apellidoPaterno, apellidoMaterno, run, profesion,
 *   sobreTi, cargoActual, email, telefono, password, confirmPassword
 * }
 * 
 * Acciones:
 * 1. Valida datos enviados
 * 2. Guarda registro de solicitud en Firestore (colección: solicitudes)
 * 3. Retorna respuesta con estado
 */

import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore'
import * as crypto from 'crypto'

// Inicializar Firebase (Web SDK para servidor)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)

/**
 * Formatea un RUN al formato estándar: xxxxxxxx-x
 * @param run - RUN a formatear (puede venir sin guion o con espacios)
 * @returns RUN formateado o null si es inválido
 */
function formatearRun(run: string): string | null {
  if (!run) return null

  // Remover espacios y guiones
  const runLimpio = run.replace(/[\s\-\.]/g, '').toUpperCase()

  // Validar que sea 8 dígitos + 1 carácter
  if (!/^\d{8}[0-9K]$/.test(runLimpio)) {
    return null
  }

  // Formatear como xxxxxxxx-x
  return `${runLimpio.slice(0, 8)}-${runLimpio.slice(8, 9)}`
}

/**
 * Valida que un RUN esté en formato correcto
 * @param run - RUN a validar
 * @returns true si es válido
 */
function validarRun(run: string): boolean {
  // Debe ser xxxxxxxx-x
  return /^\d{8}-[0-9K]$/.test(run)
}

/**
 * Hashea una contraseña usando SHA-256 (solo para almacenamiento)
 * En producción, usar bcrypt o argon2
 * @param password - Contraseña a hashear
 * @returns Contraseña hasheada en hexadecimal
 */
function hashPassword(password: string): string {
  return crypto
    .createHash('sha256')
    .update(password)
    .digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 POST /api/auth/register - Iniciando...')
    const body = await request.json()
    console.log('📦 Body recibido:', { ...body, password: '***' })

    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      run,
      profesion,
      sobreTi,
      cargoActual,
      email,
      telefono,
      password,
      confirmPassword,
    } = body

    // Validaciones básicas
    if (!nombre || !email || !password) {
      console.warn('❌ Campos faltantes:', { nombre: !!nombre, email: !!email, password: !!password })
      return NextResponse.json(
        { success: false, message: 'Faltan campos requeridos: nombre, email, password' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      console.warn('❌ Contraseñas no coinciden:', { passwordLen: password?.length, confirmLen: confirmPassword?.length })
      return NextResponse.json(
        { success: false, message: 'Las contraseñas no coinciden' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      console.warn('❌ Contraseña muy corta')
      return NextResponse.json(
        { success: false, message: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    // Validación de email formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.warn('❌ Email inválido:', email)
      return NextResponse.json(
        { success: false, message: 'Email inválido' },
        { status: 400 }
      )
    }

    // Validación y formateo de RUN
    console.log('🔍 Validando RUN:', run)
    const runFormateado = formatearRun(run)
    if (!runFormateado) {
      console.warn('❌ RUN inválido:', run)
      return NextResponse.json(
        { success: false, message: 'RUN inválido. Debe ser en formato xxxxxxxx-x (ej: 12345678-9)' },
        { status: 400 }
      )
    }
    console.log('✅ RUN formateado:', runFormateado)

    // Verificar si el email ya existe en solicitudes
    console.log('🔍 Verificando si email existe en Firebase...')
    try {
      const q = query(collection(db, 'solicitudes'), where('email', '==', email))
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        console.warn('❌ Email ya tiene solicitud:', email)
        return NextResponse.json(
          { success: false, message: 'Este email ya tiene una solicitud pendiente' },
          { status: 400 }
        )
      }
    } catch (fbError: any) {
      console.warn('⚠️ No se pudo verificar email en Firebase:', fbError.message)
      // Continuar de todas formas
    }

    // Verificar si el RUN ya existe en solicitudes
    console.log('🔍 Verificando si RUN ya existe en solicitudes...')
    try {
      const qRun = query(collection(db, 'solicitudes'), where('run', '==', runFormateado))
      const snapshotRun = await getDocs(qRun)

      if (!snapshotRun.empty) {
        console.warn('❌ RUN ya tiene solicitud:', runFormateado)
        return NextResponse.json(
          { success: false, message: 'Este RUN ya tiene una solicitud registrada. Si crees que es un error, contacta al administrador.' },
          { status: 400 }
        )
      }
    } catch (fbError: any) {
      console.warn('⚠️ No se pudo verificar RUN en solicitudes:', fbError.message)
      // Continuar de todas formas
    }

    // Verificar si el RUN ya existe en usuarios (aprobados)
    console.log('🔍 Verificando si RUN ya existe en usuarios aprobados...')
    try {
      const qRunUsuarios = query(collection(db, 'usuarios'), where('run', '==', runFormateado))
      const snapshotRunUsuarios = await getDocs(qRunUsuarios)

      if (!snapshotRunUsuarios.empty) {
        console.warn('❌ RUN ya existe como usuario aprobado:', runFormateado)
        return NextResponse.json(
          { success: false, message: 'Este RUN ya está registrado en el sistema como usuario activo.' },
          { status: 400 }
        )
      }
    } catch (fbError: any) {
      console.warn('⚠️ No se pudo verificar RUN en usuarios:', fbError.message)
      // Continuar de todas formas
    }

    // Datos de la solicitud - Usar tipos compatibles con Firestore
    const solicitudData = {
      nombre: nombre || '',
      apellidoPaterno: apellidoPaterno || '',
      apellidoMaterno: apellidoMaterno || '',
      run: runFormateado,  // Usar RUN formateado
      profesion: profesion || '',
      sobreTi: sobreTi || '',
      cargoActual: cargoActual || '',
      email: email || '',
      telefono: telefono || '',
      // 🔐 IMPORTANTE: Guardar CONTRASEÑA DESCIFRADA (no hasheada)
      // Esto es necesario para poder crear el usuario en Firebase Auth al aprobar
      // Firestore está protegido con reglas de seguridad, solo admins pueden leer esto
      password: password,
      estado: 'pendiente',
      esAdmin: false,
      fechaSolicitud: Timestamp.now(),
      fechaAprobacion: null,
      aprobadoPor: null,
    }

    // Guardar en Firestore
    console.log('💾 Guardando solicitud en Firestore...')
    try {
      const docRef = await addDoc(collection(db, 'solicitudes'), solicitudData)
      console.log('✅ Solicitud guardada exitosamente:', docRef.id)

      return NextResponse.json(
        {
          success: true,
          message: 'Solicitud registrada exitosamente. Un administrador revisará tu solicitud pronto.',
          solicitudId: docRef.id,
          email,
        },
        { status: 201 }
      )
    } catch (fbSaveError: any) {
      console.error('❌ Error guardando en Firebase:', fbSaveError.message)
      return NextResponse.json(
        { success: false, message: 'No se pudo guardar la solicitud. Por favor intenta más tarde.' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('❌ Error general en /api/auth/register:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}