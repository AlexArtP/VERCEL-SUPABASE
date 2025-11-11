/**
 * ARCHIVO: app/api/admin/list-users/route.ts
 * PROPÓSITO: Listar todos los usuarios de Supabase Auth + profiles (para debugging)
 * 
 * MIGRADO: De Firebase Admin SDK a Supabase Admin API
 */

import { NextRequest, NextResponse } from 'next/server'
import { listAllUsers, getUserProfile } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Listando todos los usuarios de Supabase...')

    // Obtener usuarios de Auth
    const { users: authUsers } = await listAllUsers(1000)

    // Enriquecer con datos del perfil
    const usuarios = await Promise.all(
      authUsers.map(async (authUser) => {
        try {
          const profile = await getUserProfile(authUser.id)
          return {
            id: authUser.id,
            email: authUser.email,
            nombre: profile?.full_name || authUser.user_metadata?.display_name || 'N/A',
            esAdmin: profile?.is_admin || false,
            activo: !authUser.deleted_at,
            rol: profile?.role || 'paciente',
            profesion: profile?.profession || null,
            createdAt: authUser.created_at,
          }
        } catch (err) {
          console.warn(`⚠️ Error obteniendo perfil para ${authUser.email}:`, err)
          return {
            id: authUser.id,
            email: authUser.email,
            nombre: authUser.user_metadata?.display_name || 'N/A',
            esAdmin: false,
            activo: !authUser.deleted_at,
            rol: 'paciente',
            profesion: null,
            createdAt: authUser.created_at,
          }
        }
      })
    )

    console.log(`✅ ${usuarios.length} usuarios encontrados`)

    return NextResponse.json({
      success: true,
      totalUsuarios: usuarios.length,
      usuarios: usuarios.sort((a, b) => (a.esAdmin ? -1 : 1))
    })

  } catch (error: any) {
    console.error('❌ Error en /api/admin/list-users:', error.message)
    return NextResponse.json(
      { 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
