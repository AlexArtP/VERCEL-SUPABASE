/**
 * ARCHIVO: app/api/users/route.ts
 * PROPÓSITO: Gestión de usuarios desde tabla USUARIOS
 * 
 * GET /api/users - Obtener todos los usuarios
 * GET /api/users?email=... - Buscar usuario por email
 * PUT /api/users?id={id} - Actualizar usuario
 * DELETE /api/users?id={id} - Eliminar usuario
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase service role key')
  }
  
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false }
  })
}

// GET /api/users o /api/users?email=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    const supabase = createServiceRoleClient()

    if (email) {
      // Buscar por email en la tabla usuarios
      console.log(`🔍 Buscando usuario por email: ${email}`)
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ data: null }, { status: 200 })
        }
        throw error
      }

      return NextResponse.json({ data })
    } else {
      // Obtener todos los usuarios de la tabla usuarios
      console.log('📋 Obteniendo todos los usuarios desde USUARIOS')
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('fechacreacion', { ascending: false })

      if (error) throw error

      console.log(`✅ Se encontraron ${data?.length || 0} usuarios en la tabla usuarios`)
      return NextResponse.json({ data, count: data?.length || 0 })
    }
  } catch (error: any) {
    console.error('[GET /api/users] Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}

// PUT /api/users/{id}
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')
    const body = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      )
    }

    console.log(`✏️ Actualizando usuario: ${userId}`)

    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('usuarios')
      .update(body)
      .eq('userid', userId)
      .select()
      .single()

    if (error) throw error

    console.log(`✅ Usuario actualizado: ${userId}`)
    return NextResponse.json({ data, success: true })
  } catch (error: any) {
    console.error('[PUT /api/users] Error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/{id}
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      )
    }

    console.log(`🗑️ Eliminando usuario: ${userId}`)

    const supabase = createServiceRoleClient()

    // Eliminar usuario de la tabla usuarios
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('userid', userId)

    if (error) throw error

    console.log(`✅ Usuario eliminado: ${userId}`)
    return NextResponse.json({ success: true, userId })
  } catch (error: any) {
    console.error('[DELETE /api/users] Error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}
