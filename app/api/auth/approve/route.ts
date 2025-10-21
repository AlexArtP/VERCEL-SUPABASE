/**
 * ARCHIVO: app/api/auth/approve/route.ts
 * PROPÓSITO: Endpoint para aprobar solicitudes de registro (Server-side con Firebase Admin SDK)
 * 
 * POST /api/auth/approve
 * Body: {
 *   solicitudId: string,
 *   habilitarAdmin?: boolean,
 *   adminId?: string (uid del admin que aprueba)
 * }
 * 
 * Acciones:
 * 1. Actualiza estado a "aprobado" en registro_solicitudes
 * 2. Crea usuario en Firebase Auth usando Admin SDK (seguro server-side)
 * 3. Asigna custom claims (rol, isAdmin)
 * 4. Copia datos a colección usuarios
 * 5. Habilita como admin si se selecciona
 * 6. Retorna { success, message, userId }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { initializeFirebaseAdmin } from '@/lib/firebaseAdmin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('📍 [/api/auth/approve] Iniciando...')
    
    const admin = initializeFirebaseAdmin()
    const adminAuth = getAuth(admin.app())
    const adminDb = getFirestore(admin.app())

    console.log('✅ [/api/auth/approve] Admin SDK inicializado')

    const body = await request.json()
    const { solicitudId, habilitarAdmin = false, adminId } = body

    console.log('📥 [/api/auth/approve] Body recibido:', { solicitudId, habilitarAdmin, adminId })

    if (!solicitudId) {
      console.error('❌ [/api/auth/approve] solicitudId no proporcionado')
      return NextResponse.json(
        { success: false, message: 'solicitudId es requerido' },
        { status: 400 }
      )
    }

    console.log('🔍 [/api/auth/approve] Buscando solicitud:', solicitudId)
    
    // Obtener solicitud de Firestore (usando Admin SDK)
    const solicitudSnap = await adminDb.collection('solicitudes').doc(solicitudId).get()

    if (!solicitudSnap.exists) {
      console.error('❌ [/api/auth/approve] Solicitud no encontrada:', solicitudId)
      return NextResponse.json(
        { success: false, message: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }

    const solicitud = solicitudSnap.data() as any

    if (!solicitud) {
      console.error('❌ [/api/auth/approve] Solicitud vacía')
      return NextResponse.json(
        { success: false, message: 'Solicitud vacía' },
        { status: 400 }
      )
    }

    console.log('✅ [/api/auth/approve] Solicitud encontrada:', { id: solicitudId, email: solicitud.email })

    // Validar que no esté ya procesada
    if (solicitud.estado !== 'pendiente') {
      console.error('❌ [/api/auth/approve] Solicitud no está pendiente:', solicitud.estado)
      return NextResponse.json(
        { success: false, message: `Solicitud ya está ${solicitud.estado}` },
        { status: 400 }
      )
    }

    // Crear usuario en Firebase Auth usando ADMIN SDK (seguro server-side)
    let userId: string
    let password: string = ''
    try {
      // Usar la contraseña guardada directamente en la solicitud
      if (!solicitud.password) {
        console.error('❌ [/api/auth/approve] No se encontró contraseña en la solicitud')
        return NextResponse.json(
          { success: false, message: 'No se encontró contraseña en la solicitud. Por favor, solicita un nuevo registro.' },
          { status: 400 }
        )
      }

      // Usar la contraseña original del usuario (guardada en Firestore)
      password = solicitud.password

      const userRecord = await adminAuth.createUser({
        email: solicitud.email,
        password: password,
        displayName: `${solicitud.nombre} ${solicitud.apellidoPaterno}`,
        disabled: false,
      })

      userId = userRecord.uid
      console.log(`✅ Usuario creado en Firebase Auth: ${userId}`)
      console.log(`🔐 Contraseña establecida: [OCULTA]`)

      // Asignar custom claims (rol, isAdmin)
      await adminAuth.setCustomUserClaims(userId, {
        isAdmin: habilitarAdmin,
        rol: habilitarAdmin ? 'administrador' : 'usuario',
      })

      console.log(`✅ Custom claims asignados al usuario: ${userId}`)
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        console.warn(`⚠️ Email ya existe: ${solicitud.email}`)
        // Si ya existe, obtener el UID existente
        const existingUser = await adminAuth.getUserByEmail(solicitud.email)
        userId = existingUser.uid
      } else {
        throw error
      }
    }

    // Crear documento en colección usuarios
    await adminDb.collection('usuarios').doc(userId).set(
      {
        id: userId,
        nombre: solicitud.nombre,
        apellidoPaterno: solicitud.apellidoPaterno,
        apellidoMaterno: solicitud.apellidoMaterno,
        run: solicitud.run,
        profesion: solicitud.profesion,
        sobreTi: solicitud.sobreTi || '',
        cargoActual: solicitud.cargoActual || '',
        email: solicitud.email,
        telefono: solicitud.telefono || '',
        // Campos extras del usuario DEMO (inicialmente vacíos, se pueden editar después)
        cargo: '',  // Descripción del cargo
        description: '',  // Descripción del usuario
        avatar: '',  // Avatar/foto
        specialties: [],  // Especialidades
        workingHours: { start: '08:30', end: '17:30' },  // Horas de trabajo por defecto
        preferences: { theme: 'light', primaryColor: '#3B82F6', language: 'es' },  // Preferencias
        isPublic: false,  // No visible públicamente por defecto
        // Información de estado
        estado: 'activo',
        esAdmin: habilitarAdmin,
        rol: habilitarAdmin ? 'administrador' : 'profesional',
        activo: true,
        // Flag de cambio de contraseña - IMPORTANTE
        cambioPasswordRequerido: true,  // Requiere cambio de contraseña al primer login
        fechaPrimerLogin: null,  // Se establece al primer login
        // Información de auditoría
        fechaAprobacion: new Date().toISOString(),
        aprobadoPor: adminId || 'sistema',
      },
      { merge: true }
    )

    console.log(`✅ Documento de usuario creado: ${userId}`)

    // Eliminar solicitud de la colección solicitudes
    await adminDb.collection('solicitudes').doc(solicitudId).delete()
    console.log(`✅ Solicitud eliminada de la colección: ${solicitudId}`)

    return NextResponse.json(
      {
        success: true,
        message: `Usuario aprobado exitosamente${habilitarAdmin ? ' como administrador' : ''}. Usuario creado y solicitud procesada.`,
        userId,
        email: solicitud.email,
        instructions: `✅ Usuario aprobado exitosamente.\n\n📧 Email: ${solicitud.email}\n� El usuario puede usar la contraseña que registró al solicitar acceso.\n\nℹ️ Al primer login, puede cambiar su contraseña si lo desea.`,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ [/api/auth/approve] Error:', error?.message || error)
    console.error('Stack:', error?.stack)
    return NextResponse.json(
      { success: false, message: error.message || 'Error al aprobar usuario' },
      { status: 500 }
    )
  }
}
