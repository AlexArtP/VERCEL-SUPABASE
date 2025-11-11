/**
 * ARCHIVO: app/api/admin/reset-password/route.ts
 * PROPÓSITO: Resetear contraseña de un usuario (admin only)
 * 
 * MIGRADO: De Firebase Admin SDK a Supabase Admin API
 * 
 * POST /api/admin/reset-password
 * Body: { email: string } O { userId: string }
 * 
 * Envía enlace de recuperación de contraseña al usuario
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendPasswordResetEmail, getUserByEmail, getUserProfile } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { email, userId } = await request.json()

    if (!email && !userId) {
      return NextResponse.json(
        { error: 'email o userId requerido' },
        { status: 400 }
      )
    }

    console.log('[RESET PASSWORD REQUEST]')
    console.log('='.repeat(60))
    console.log('[EMAIL]', email || 'N/A')
    console.log('[USERID]', userId || 'Por determinar')

    // 1. Encontrar el usuario
    let authUser = null
    if (email) {
      try {
        authUser = await getUserByEmail(email)
        if (!authUser) {
          console.log('[ERROR] Usuario NO encontrado en Supabase Auth con email:', email)
          return NextResponse.json(
            { 
              error: `Usuario ${email} no encontrado en Supabase Auth`,
              solution: 'El usuario debe existir en Supabase Auth primero'
            },
            { status: 404 }
          )
        }
        console.log('[SUCCESS] Usuario encontrado:', authUser.id)
      } catch (err: any) {
        console.error('[ERROR] Error buscando usuario:', err.message)
        return NextResponse.json(
          { error: err.message },
          { status: 500 }
        )
      }
    } else if (userId) {
      console.log('[INFO] Usando userId proporcionado:', userId)
    }

    const targetEmail = email || (authUser?.email)
    if (!targetEmail) {
      return NextResponse.json(
        { error: 'No se pudo determinar el email del usuario' },
        { status: 400 }
      )
    }

    // 2. Enviar enlace de recuperación de contraseña
    try {
      console.log('[SENDING] Enlace de recuperación de contraseña a:', targetEmail)
      
      const result = await sendPasswordResetEmail(targetEmail)
      
      console.log('[SUCCESS] Enlace de recuperación enviado exitosamente')
      
      return NextResponse.json({
        success: true,
        message: 'Enlace de recuperación de contraseña enviado a ' + targetEmail,
        email: targetEmail,
        recoveryLink: process.env.NODE_ENV === 'development' ? result.recoveryLink : undefined
      })
      
    } catch (err: any) {
      console.error('[ERROR] Error al enviar enlace de recuperación:', err.message)
      return NextResponse.json(
        { 
          error: 'No se pudo enviar enlace de recuperación: ' + err.message,
          code: err.code
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('[ERROR] Error en /api/admin/reset-password:', error.message)
    return NextResponse.json(
      { 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
