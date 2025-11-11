/**
 * ARCHIVO: app/api/auth/reset-password/route.ts
 * PROPÓSITO: Endpoint para enviar enlace de reset de contraseña
 * 
 * POST /api/auth/reset-password
 * Body: { 
 *   email: string
 * }
 * 
 * Nota: Requiere configuración de email en Supabase (SMTP)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  
  if (!url || !publishableKey) {
    throw new Error('Missing Supabase public key')
  }
  
  return createClient(url, publishableKey)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      )
    }

    console.log(`\n� RESET PASSWORD REQUEST - Email: ${email}`)
    console.log('='.repeat(60))

    const supabase = createPublicClient()

    // Enviar enlace de reset de contraseña
    console.log('� Enviando enlace de reset...')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/reset-password`,
    })

    if (error) {
      console.error(`❌ Error enviando reset: ${error.message}`)
      return NextResponse.json(
        { error: error.message || 'Error al enviar enlace de reset' },
        { status: 400 }
      )
    }

    console.log(`✅ Enlace de reset enviado a ${email}`)
    console.log('='.repeat(60))

    return NextResponse.json({
      success: true,
      message: 'Enlace de reset enviado al correo',
      email
    })
  } catch (error: any) {
    console.error('[reset-password] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
