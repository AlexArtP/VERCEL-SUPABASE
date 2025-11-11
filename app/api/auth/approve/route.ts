/**
 * ARCHIVO: app/api/auth/approve/route.ts
 * PROPÓSITO: Aprobar solicitud de registro y crear usuario en Supabase
 * 
 * POST /api/auth/approve
 * Body: {
 *   solicitudId: string,
 *   habilitarAdmin?: boolean,
 *   adminId?: string
 * }
 * 
 * Acciones:
 * 1. Obtiene solicitud de tabla solicitudregistro
 * 2. Crea usuario en Supabase Auth
 * 3. Crea perfil en tabla usuarios con estado 'aprobado'
 * 4. Actualiza solicitud a estado 'aprobada'
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAuthUser, createUserProfile, createSupabaseAdminClient } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient()
    const body = await request.json()
    const { solicitudId, habilitarAdmin = false, adminId } = body

    if (!solicitudId) {
      return NextResponse.json({ success: false, message: 'solicitudId requerido' }, { status: 400 })
    }

    const { data: solicitud } = await supabase
      .from('solicitudregistro')
      .select('*')
      .eq('id', solicitudId)
      .single()

    if (!solicitud || solicitud.estado !== 'pendiente') {
      return NextResponse.json({ success: false, message: 'Solicitud no válida' }, { status: 400 })
    }

    if (!solicitud.password) {
      return NextResponse.json({ success: false, message: 'Sin contraseña en solicitud' }, { status: 400 })
    }

    const result = await createAuthUser(
      solicitud.email,
      solicitud.password,
      `${solicitud.nombre || ''} ${solicitud.apellido_paterno || ''}`.trim()
    )

    // 🆕 Crear perfil con estado 'aprobado' en tabla usuarios
    const userData = {
      userid: result.userId,
      email: solicitud.email,
      nombre: solicitud.nombre || '',
      apellidos: `${solicitud.apellido_paterno || ''} ${solicitud.apellido_materno || ''}`.trim(),
      run: solicitud.run || null,
      telefono: solicitud.telefono || null,
      profesion: solicitud.profesion || null,
      cargo_actual: solicitud.cargo_actual || null,
      sobre_ti: solicitud.sobre_ti || null,
      rol: habilitarAdmin ? 'administrativo' : 'profesional',
      esadmin: habilitarAdmin ? true : false,
      activo: true,
      estado: 'aprobado', // 🆕 Guardar estado de aprobación
      fechacreacion: new Date().toISOString(),
    }

    const { error: userError } = await supabase
      .from('usuarios')
      .insert([userData])

    if (userError) {
      console.error('❌ Error creando usuario en tabla usuarios:', userError)
      throw userError
    }

    // Actualizar solicitud
    await supabase
      .from('solicitudregistro')
      .update({ estado: 'aprobada', approved_at: new Date().toISOString() })
      .eq('id', solicitudId)

    console.log(`✅ Usuario aprobado: ${solicitud.email} con estado "aprobado"`)

    return NextResponse.json({
      success: true,
      message: 'Usuario aprobado',
      userId: result.userId,
      email: solicitud.email,
    })
  } catch (error: any) {
    console.error('❌ Error aprobando solicitud:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
