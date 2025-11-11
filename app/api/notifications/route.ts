/**
 * ARCHIVO: app/api/notifications/route.ts
 * PROPÓSITO: Reemplazar listeners de Firestore - Notificaciones en polling
 * 
 * GET /api/notifications - Obtener notificaciones pendientes
 * GET /api/notifications?userId=... - Notificaciones de un usuario
 * POST /api/notifications - Crear notificación
 * PUT /api/notifications/{id} - Marcar como leída
 * DELETE /api/notifications/{id} - Eliminar notificación
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

// GET /api/notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const supabase = createServiceRoleClient()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      )
    }

    console.log(`📬 Obteniendo notificaciones de: ${userId}`)

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })

    if (error) {
      // Table might not exist yet
      if (error.code === 'PGRST116') {
        return NextResponse.json({ data: [], count: 0 })
      }
      throw error
    }

    return NextResponse.json({ data, count })
  } catch (error: any) {
    console.error('[GET /api/notifications] Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener notificaciones' },
      { status: 500 }
    )
  }
}

// POST /api/notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('📝 Creando notificación')

    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        ...body,
        read: false,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      // Table might not exist yet
      if (error.code === 'PGRST116') {
        console.warn('⚠️ notifications table no existe aún')
        return NextResponse.json({ success: true, data: null })
      }
      throw error
    }

    console.log(`✅ Notificación creada: ${data.id}`)
    return NextResponse.json({ data, success: true })
  } catch (error: any) {
    console.error('[POST /api/notifications] Error:', error)
    return NextResponse.json(
      { error: 'Error al crear notificación' },
      { status: 500 }
    )
  }
}

// PUT /api/notifications/{id} - Marcar como leída
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')
    const body = await request.json()

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId es requerido' },
        { status: 400 }
      )
    }

    console.log(`✏️ Actualizando notificación: ${notificationId}`)

    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('notifications')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select()
      .single()

    if (error) throw error

    console.log(`✅ Notificación actualizada: ${notificationId}`)
    return NextResponse.json({ data, success: true })
  } catch (error: any) {
    console.error('[PUT /api/notifications] Error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar notificación' },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications/{id}
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId es requerido' },
        { status: 400 }
      )
    }

    console.log(`🗑️ Eliminando notificación: ${notificationId}`)

    const supabase = createServiceRoleClient()

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) throw error

    console.log(`✅ Notificación eliminada: ${notificationId}`)
    return NextResponse.json({ success: true, notificationId })
  } catch (error: any) {
    console.error('[DELETE /api/notifications] Error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar notificación' },
      { status: 500 }
    )
  }
}
