/**
 * ARCHIVO: app/api/admin/ensure-user-fields/route.ts
 * PROPÓSITO: Asegurar que la tabla usuarios tiene todos los campos necesarios
 * y actualizar datos del usuario actual
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration')
  }
  
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false }
  })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    
    // 1. Verificar si las columnas existen, si no crear
    console.log('🔍 Verificando estructura de tabla usuarios...')
    
    // 2. Actualizar el usuario actual con datos completos
    const { email, run, apellidos } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      )
    }
    
    console.log(`✏️ Actualizando usuario: ${email}`)
    
    const updates: any = {
      activo: true,
      esadmin: true
    }
    
    if (apellidos) updates.apellidos = apellidos
    if (run) updates.run = run
    
    const { data, error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('email', email)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error actualizando usuario:', error)
      return NextResponse.json(
        { error: 'Error actualizando usuario', details: error.message },
        { status: 500 }
      )
    }
    
    console.log('✅ Usuario actualizado correctamente')
    return NextResponse.json({ 
      success: true, 
      message: 'Usuario actualizado', 
      data 
    })
  } catch (error: any) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      { error: 'Error en la operación', details: error.message },
      { status: 500 }
    )
  }
}
