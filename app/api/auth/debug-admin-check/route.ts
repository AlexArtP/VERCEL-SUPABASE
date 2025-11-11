/**
 * ARCHIVO: app/api/auth/debug-admin-check/route.ts
 * MIGRADO: De Firebase Admin SDK a Supabase Admin API
 * 
 * PROPÓSITO: Endpoint para debuguear verificación de admin
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserProfile, createSupabaseAdminClient } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId requerido' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseAdminClient()

    console.log('[DEBUG ADMIN CHECK] UserId:', userId)
    console.log('='.repeat(60))

    // 1. Verificar que el usuario existe en Supabase Auth
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers()
    const userAuth = authUsers?.find(u => u.id === userId)

    if (!userAuth) {
      console.log('[ERROR] Usuario NO encontrado en Supabase Auth')
      return NextResponse.json({
        error: 'Usuario ' + userId + ' no existe en Supabase Auth',
        debug: {
          step: 'supabase_auth_lookup',
          userId,
          found: false
        }
      }, { status: 404 })
    }

    console.log('[SUCCESS] Usuario encontrado en Supabase Auth')
    console.log('[INFO] Email:', userAuth.email)
    console.log('[INFO] UUID:', userAuth.id)

    // 2. Verificar que el usuario existe en profiles
    try {
      const userData = await getUserProfile(userId)

      if (!userData) {
        console.log('[WARNING] Usuario NO tiene perfil en profiles')
        return NextResponse.json({
          error: 'Usuario ' + userId + ' no tiene perfil en profiles',
          debug: {
            step: 'profiles_lookup',
            userId,
            found: false,
            auth_found: true
          }
        }, { status: 404 })
      }

      console.log('[SUCCESS] Usuario encontrado en profiles')
      console.log('[INFO] Datos del perfil:')
      console.log('[INFO] email:', userData.email)
      console.log('[INFO] full_name:', userData.full_name)
      console.log('[INFO] is_admin:', userData.is_admin)

      // 3. Verificar si is_admin está en true
      if (userData.is_admin !== true) {
        console.log('[ERROR] Usuario NO es admin')
        return NextResponse.json({
          error: 'Usuario ' + userId + ' no es administrador',
          debug: {
            step: 'admin_check',
            userId,
            isAdmin: false,
            role: userData.role
          }
        }, { status: 403 })
      }

      console.log('[SUCCESS] Usuario ES admin')
      console.log('='.repeat(60))

      return NextResponse.json({
        success: true,
        message: 'Usuario es administrador',
        user: {
          userId,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
          is_admin: userData.is_admin
        }
      })

    } catch (err: any) {
      console.error('[ERROR] Error accediendo a profiles:', err.message)
      return NextResponse.json({
        error: 'Error verificando perfil: ' + err.message,
        debug: {
          step: 'profiles_error',
          userId,
          isAdmin: false
        }
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('[ERROR] Error en debug-admin-check:', error.message)
    return NextResponse.json(
      { 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
