/**
 * ENDPOINT: GET /api/admin/get-users
 * MIGRADO: De Firebase Admin SDK a Supabase Admin API
 * 
 * Propósito: Obtener lista de usuarios desde profiles table
 * Uso: Para Gestión de Usuarios en el dashboard (requiere ser admin o dev)
 */

import { NextRequest, NextResponse } from 'next/server'
import { listAllUsers, getUserProfile } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    console.log('📄 GET /api/admin/get-users')

    // Obtener todos los usuarios de Auth
    const { users: authUsers } = await listAllUsers(1000)

    if (!authUsers || authUsers.length === 0) {
      console.log('⚠️  No se encontraron usuarios en Supabase Auth')
      return NextResponse.json({
        success: true,
        usuarios: [],
        count: 0,
      })
    }

    // Enriquecer con datos del perfil
    const usuarios = await Promise.all(
      authUsers.map(async (authUser) => {
        try {
          const profile = await getUserProfile(authUser.id)
          return {
            id: authUser.id,
            email: authUser.email,
            full_name: profile?.full_name,
            role: profile?.role,
            is_admin: profile?.is_admin,
            created_at: authUser.created_at,
            ...profile,
          }
        } catch (err) {
          return {
            id: authUser.id,
            email: authUser.email,
            created_at: authUser.created_at,
          }
        }
      })
    )

    console.log(`✅ ${usuarios.length} usuarios obtenidos desde Supabase`)

    return NextResponse.json({
      success: true,
      usuarios,
      count: usuarios.length,
    })
  } catch (error: any) {
    console.error('❌ Error obteniendo usuarios:', error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error obteniendo usuarios',
      },
      { status: 500 }
    )
  }
}
