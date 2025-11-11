/**
 * ENDPOINT: POST /api/admin/update-user
 * MIGRADO: De Firebase Admin SDK a Supabase Admin API
 * 
 * Propósito: Actualizar datos de un usuario en profiles table
 * Requiere: userId, updates (objeto con los campos a actualizar)
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateUserProfile } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, updates, currentUserId: clientProvidedUserId } = body

    if (!userId || !updates) {
      return NextResponse.json(
        { success: false, error: 'userId y updates son requeridos' },
        { status: 400 }
      )
    }

    const currentUserId = clientProvidedUserId

    console.log(`📋 Actualizando usuario:`, {
      currentUserId,
      targetUserId: userId,
      updates,
    })

    // VALIDACIÓN: No permitir auto-desactivación
    if ('active' in updates && updates.active === false) {
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

    console.log(`✅ PERMITIDO: Actualizando usuario: ${userId}`)

    // Actualizar en profiles table
    const result = await updateUserProfile(userId, updates)

    console.log(`✅ Usuario actualizado exitosamente: ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'Usuario actualizado correctamente',
      profile: result.profile,
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
