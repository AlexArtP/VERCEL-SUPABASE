/**
 * ARCHIVO: app/api/auth/reject/route.ts
 * MIGRADO: De Firebase Admin SDK a Supabase Admin API
 * 
 * PROPÓSITO: Endpoint para rechazar solicitudes de registro
 * 
 * POST /api/auth/reject
 * Body: {
 *   solicitudId: string,
 *   razon?: string,
 *   adminId?: string (uuid del admin que rechaza)
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('📍 [/api/auth/reject] Iniciando...')
    
    const body = await request.json()
    const { solicitudId, razon = '', adminId } = body

    console.log('📥 [/api/auth/reject] Body recibido:', { solicitudId, razon, adminId })

    if (!solicitudId) {
      console.error('❌ [/api/auth/reject] solicitudId no proporcionado')
      return NextResponse.json(
        { success: false, message: 'solicitudId es requerido' },
        { status: 400 }
      )
    }

    // Inicializar Supabase Admin
    console.log('🔧 [/api/auth/reject] Inicializando Supabase Admin...')
    const supabase = createSupabaseAdminClient()
    console.log('✅ [/api/auth/reject] Admin client inicializado')

    // Obtener solicitud desde tabla solicitudregistro
    console.log('🔍 [/api/auth/reject] Buscando solicitud:', solicitudId)
    const { data: solicitud, error: fetchError } = await supabase
      .from('solicitudregistro')
      .select('*')
      .eq('id', solicitudId)
      .single()

    if (fetchError || !solicitud) {
      console.error('❌ [/api/auth/reject] Solicitud no encontrada:', solicitudId)
      return NextResponse.json(
        { success: false, message: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }

    console.log('✅ [/api/auth/reject] Solicitud encontrada:', { id: solicitudId, estado: solicitud.estado })

    // Validar estado
    if (solicitud.estado !== 'pendiente') {
      console.error('❌ [/api/auth/reject] Solicitud no está pendiente:', solicitud.estado)
      return NextResponse.json(
        { success: false, message: `Solicitud ya está ${solicitud.estado}` },
        { status: 400 }
      )
    }

    console.log('🗑️  [/api/auth/reject] Actualizando estado a rechazada...')
    // Actualizar estado a "rechazada"
    const { error: updateError } = await supabase
      .from('solicitudregistro')
      .update({
        estado: 'rechazada',
        razon_rechazo: razon,
        admin_id: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', solicitudId)

    if (updateError) {
      throw updateError
    }

    console.log(`✅ [/api/auth/reject] Solicitud rechazada: ${solicitudId}`)

    return NextResponse.json(
      {
        success: true,
        message: 'Solicitud rechazada exitosamente.',
        solicitudId,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ [/api/auth/reject] Error:', error?.message || error)
    console.error('Stack:', error?.stack)
    return NextResponse.json(
      { success: false, message: error.message || 'Error al rechazar solicitud' },
      { status: 500 }
    )
  }
}
