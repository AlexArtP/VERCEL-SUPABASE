/**
 * ENDPOINT: POST /api/admin/update-user
 * Propósito: Actualizar datos de un usuario en Firestore
 * Requiere: userId, updates (objeto con los campos a actualizar)
 * 
 * ESTRATEGIA:
 * 1. Si se envía token: Verificar permisos en servidor
 * 2. Si NO se envía token: Permitir actualización y dejar que Firestore rules valide
 *    (excepto cambios a esAdmin que requieren admin)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import * as admin from 'firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, updates, currentUserId: clientProvidedUserId } = body
    const authHeader = request.headers.get('authorization')

    if (!userId || !updates) {
      return NextResponse.json(
        { success: false, error: 'userId y updates son requeridos' },
        { status: 400 }
      )
    }

    // Verificar autenticación mediante token
    let currentUserId: string | null = null
    let isAdmin = false
    let tokenVerified = false

    // PRIORITARIO: Verificar token JWT si se proporciona
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7)
        console.log(`🔐 Verificando token JWT...`)
        const decodedToken = await admin.auth().verifyIdToken(token)
        currentUserId = decodedToken.uid
        tokenVerified = true

        // Verificar si el usuario actual es admin
        const db = getAdminFirestore()
        const currentUserDoc = await db.collection('usuarios').doc(currentUserId).get()
        isAdmin = currentUserDoc.data()?.esAdmin === true
        
        console.log(`✅ Token verificado exitosamente:`, {
          currentUserId,
          isAdmin,
          targetUserId: userId,
          esAdminInDB: currentUserDoc.data()?.esAdmin,
        })
      } catch (error: any) {
        console.error('❌ Error verificando token:', error.message)
        // Si el token falla, usar el ID del cliente como fallback
        currentUserId = clientProvidedUserId || null
      }
    } else if (clientProvidedUserId) {
      // Fallback: Si no hay token pero se proporciona clientProvidedUserId
      // Verificar si ese usuario es admin desde Firestore
      currentUserId = clientProvidedUserId
      console.log(`📋 Sin token, usando ID del cliente: ${currentUserId}`)
      try {
        const db = getAdminFirestore()
        if (currentUserId) {
          const userDoc = await db.collection('usuarios').doc(currentUserId).get()
          isAdmin = userDoc.data()?.esAdmin === true
          console.log(`📋 Estado admin verificado:`, {
            currentUserId,
            isAdmin,
            esAdminInDB: userDoc.data()?.esAdmin,
          })
        }
      } catch (err: any) {
        console.warn('⚠️ Error verificando admin status:', err.message)
      }
    }

    // Lógica de permisos
    console.log(`📋 Verificando permisos:`, {
      tokenVerified,
      currentUserId,
      isAdmin,
      targetUserId: userId,
      intentaEditarAjeno: currentUserId !== userId,
      intentaCambiarAdmin: 'esAdmin' in updates,
      intentaDesactivar: 'activo' in updates && updates.activo === false,
    })

    // VALIDACIÓN 1: Si intenta cambiar esAdmin, SIEMPRE requiere ser admin y no puede auto-quitarse admin
    if ('esAdmin' in updates) {
      if (!isAdmin) {
        console.error(`❌ Usuario ${currentUserId} (no-admin) intentó cambiar esAdmin`)
        return NextResponse.json(
          {
            success: false,
            error: 'Solo admins pueden cambiar el estado de administrador.',
          },
          { status: 403 }
        )
      }
      // Evitar que un admin se quite su propio rol de admin
      if (currentUserId === userId && updates.esAdmin === false) {
        console.error(`❌ Admin ${currentUserId} intentó quitarse su propio permiso de administrador`)
        return NextResponse.json(
          {
            success: false,
            error: 'No puedes quitarte tu propio permiso de administrador.',
          },
          { status: 403 }
        )
      }
      console.log(`✅ Admin ${currentUserId} tiene permiso para cambiar esAdmin`)
    }

    // VALIDACIÓN 2: Bloquear auto-desactivación (no permitir que un usuario se desactive a sí mismo)
    if ('activo' in updates && updates.activo === false) {
      if (currentUserId === userId) {
        console.error(`❌ Usuario ${currentUserId} intentó desactivar su propia cuenta`)
        return NextResponse.json(
          {
            success: false,
            error: 'No puedes desactivar tu propia cuenta.',
          },
          { status: 403 }
        )
      }
    }

    // VALIDACIÓN 3: Si intenta editar otro usuario, requiere ser admin
    if (currentUserId !== userId) {
      if (!isAdmin) {
        console.error(`❌ Usuario no-admin ${currentUserId} intentó editar usuario ${userId}`)
        return NextResponse.json(
          {
            success: false,
            error: 'Solo admins pueden editar otros usuarios.',
          },
          { status: 403 }
        )
      }
      console.log(`✅ Admin ${currentUserId} tiene permiso para editar usuario ${userId}`)
    }

    // Si llegamos aquí, todas las validaciones pasaron
    console.log(`✅ PERMITIDO: Actualizando usuario: ${userId}`, {
      updates,
      porAdmin: isAdmin,
      esAutoedicion: currentUserId === userId,
    })

    const db = getAdminFirestore()
    await db.collection('usuarios').doc(userId).update(updates)

    console.log(`✅ Usuario actualizado exitosamente: ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'Usuario actualizado correctamente',
    })
  } catch (error: any) {
    console.error('❌ Error actualizando usuario:', error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error actualizando usuario',
      },
      { status: 500 }
    )
  }
}
