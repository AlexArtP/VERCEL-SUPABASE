/**
 * ARCHIVO: app/api/admin/set-admin/route.ts
 * PROPÓSITO: Endpoint para establecer admin en la tabla profiles
 * Uso: http://localhost:3000/api/admin/set-admin?secret=fix-now&email=a.arteaga02@ufromail.cl
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

export async function GET(request: NextRequest) {
  try {
    // Verificación de seguridad - solo en localhost
    const isLocalhost = request.headers.get('host')?.includes('localhost') || 
                       request.headers.get('host')?.includes('127.0.0.1')
    
    if (!isLocalhost) {
      return NextResponse.json(
        { error: 'Este endpoint solo está disponible en localhost' },
        { status: 403 }
      )
    }
    
    // Requiere parámetro secret para activación
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    const email = searchParams.get('email')
    
    if (secret !== 'fix-now') {
      return NextResponse.json(
        { error: 'Parámetro secret requerido: ?secret=fix-now' },
        { status: 400 }
      )
    }
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email requerido: ?email=user@example.com' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()
    
    console.log(`🔧 Estableciendo admin para email: ${email}`)
    
    // Actualizar la tabla usuarios directamente con el nombre correcto: esadmin (todo en minúsculas)
    const { data: usuariosData, error: usuariosError } = await supabase
      .from('usuarios')
      .update({ 
        esadmin: true
      })
      .eq('email', email)
      .select()
      .single()

    if (usuariosError) {
      console.warn(`⚠️  Error actualizando tabla usuarios: ${usuariosError.message}`)
      
      // Si no está en usuarios, intentar en auth.users para obtener el ID
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) {
        throw new Error(`Error listando usuarios: ${authError.message}`)
      }
      
      const authUser = authUsers.users.find(u => u.email === email)
      
      if (!authUser) {
        return NextResponse.json(
          { error: `Usuario con email ${email} no encontrado` },
          { status: 404 }
        )
      }
      
      console.log(`ℹ️  Usuario encontrado en auth.users pero no en usuarios tabla`)
      
      // Intentar crear en usuarios tabla con el campo correcto
      const { data: newUser, error: createError } = await supabase
        .from('usuarios')
        .insert({
          userid: authUser.id,
          email: email,
          nombre: authUser.email?.split('@')[0] || 'User',
          esadmin: true
        })
        .select()
        .single()
        
      if (createError) {
        throw new Error(`Error creando usuario: ${createError.message}`)
      }
      
      console.log(`✅ Usuario creado en tabla usuarios:`, newUser)
      return NextResponse.json({
        success: true,
        message: 'Usuario creado con admin = true',
        usuario: newUser
      })
    }

    console.log(`✅ Usuario actualizado en tabla usuarios:`, usuariosData)
    console.log(`✅ Admin establecido para ${email}`)
    
    return NextResponse.json({
      success: true,
      message: `Admin establecido para ${email}`,
      usuario: usuariosData
    })
  } catch (error: any) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      { 
        error: 'Error en la operación', 
        details: error.message
      },
      { status: 500 }
    )
  }
}
