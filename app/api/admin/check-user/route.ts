/**
 * ARCHIVO: app/api/admin/check-user/route.ts
 * PROPÓSITO: Verificar el estado de un usuario en Supabase Auth y profiles
 * 
 * MIGRADO: De Firebase Admin SDK a Supabase Admin API
 * 
 * POST /api/admin/check-user
 * Body: { email: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, getUserProfile } from '@/lib/supabaseAdmin'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'email requerido' },
        { status: 400 }
      )
    }

    console.log(`\n🔍 CHECK USER - Email: ${email}`)
    console.log('='.repeat(60))

    // 1. Verificar en Supabase Auth
    let authUser: any = null
    try {
      authUser = await getUserByEmail(email)
      
      if (!authUser) {
        console.log(`❌ Usuario NO encontrado en Supabase Auth`)
        return NextResponse.json({
          error: `Usuario ${email} no encontrado en Supabase Auth`,
          authExists: false
        }, { status: 404 })
      }

      console.log(`✅ Usuario encontrado en Supabase Auth`)
      console.log(`   UUID: ${authUser.id}`)
      console.log(`   Email: ${authUser.email}`)
      console.log(`   Email Verificado: ${authUser.email_confirmed_at ? 'Sí' : 'No'}`)
      console.log(`   Deshabilitado: ${authUser.deleted_at ? 'Sí' : 'No'}`)
      console.log(`   Creado: ${new Date(authUser.created_at).toLocaleString()}`)
    } catch (err: any) {
      console.log(`❌ Error verificando usuario en Auth:`, err.message)
      return NextResponse.json({
        error: `Error verificando usuario: ${err.message}`,
        authExists: false
      }, { status: 500 })
    }

    // 2. Verificar en profiles table
    let profileData: any = null
    try {
      profileData = await getUserProfile(authUser.id)
      
      if (profileData) {
        console.log(`✅ Usuario encontrado en profiles`)
        console.log(`   Email: ${profileData.email}`)
        console.log(`   Nombre: ${profileData.full_name}`)
        console.log(`   esAdmin: ${profileData.is_admin}`)
        console.log(`   Rol: ${profileData.role}`)
      } else {
        console.log(`⚠️ Usuario NO encontrado en profiles (uuid: ${authUser.id})`)
      }
    } catch (err: any) {
      console.log(`⚠️ Error verificando perfil:`, err.message)
    }

    console.log('='.repeat(60))

    return NextResponse.json({
      success: true,
      auth: {
        uuid: authUser.id,
        email: authUser.email,
        emailVerified: !!authUser.email_confirmed_at,
        disabled: !!authUser.deleted_at,
        createdAt: new Date(authUser.created_at).toISOString()
      },
      profile: profileData ? {
        email: profileData.email,
        full_name: profileData.full_name,
        is_admin: profileData.is_admin,
        role: profileData.role,
        profession: profileData.profession
      } : null,
      profileExists: !!profileData,
      sync: {
        bothExist: !!profileData,
        adminStatus: profileData?.is_admin || false
      }
    })

  } catch (error: any) {
    console.error('❌ Error en /api/admin/check-user:', error.message)
    return NextResponse.json(
      { 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
