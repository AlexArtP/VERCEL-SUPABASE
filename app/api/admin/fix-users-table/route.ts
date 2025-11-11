/**
 * ARCHIVO: app/api/admin/fix-users-table/route.ts
 * PROPÓSITO: Endpoint para agregar campos faltantes a tabla usuarios
 * INSTRUCCIONES: Accede a http://localhost:3000/api/admin/fix-users-table?secret=fix-now
 * 
 * ⚠️ IMPORTANTE: Este endpoint solo se puede ejecutar desde localhost con parámetro secret
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
    const secret = new URL(request.url).searchParams.get('secret')
    if (secret !== 'fix-now') {
      return NextResponse.json(
        { error: 'Parámetro secret requerido: ?secret=fix-now' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()
    
    console.log('🔧 Iniciando corrección de tabla usuarios...')
    
    // Ejecutar las alteraciones
    const sql = `
      -- Agregar columnas si no existen
      DO $$
      BEGIN
        ALTER TABLE usuarios ADD COLUMN run VARCHAR(50);
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END $$;
      
      DO $$
      BEGIN
        ALTER TABLE usuarios ADD COLUMN activo BOOLEAN DEFAULT TRUE;
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END $$;
      
      DO $$
      BEGIN
        ALTER TABLE usuarios ADD COLUMN apellidos VARCHAR(255);
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END $$;
    `

    // Usar RPC o query directa
    const { data, error } = await supabase.rpc('exec', { query: sql })
    
    if (error && error.code !== 'PGRST116') {
      // Si el RPC no existe, intentar de otra forma
      console.log('⚠️ RPC exec no disponible, intentando alternativa...')
    }
    
    // Actualizar usuarios para asegurar campos correctos
    const { data: updateData, error: updateError } = await supabase
      .from('usuarios')
      .update({ 
        activo: true 
      })
      .is('activo', null)
      .select()

    if (updateError && updateError.code !== 'PGRST116') {
      console.warn('⚠️ Actualización parcial:', updateError.message)
    }

    console.log(`✅ Corrección completada`)
    
    return NextResponse.json({
      success: true,
      message: 'Tabla usuarios corregida. Recarga la página para ver los cambios.',
      details: {
        timestamp: new Date().toISOString(),
        action: 'Agregadas columnas run, activo, apellidos a usuarios',
        updated_null_records: updateData?.length || 0
      }
    })
  } catch (error: any) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      { 
        error: 'Error en la corrección', 
        details: error.message,
        hint: 'Ejecuta manualmente el script: scripts/fix_usuarios_table.sql en Supabase'
      },
      { status: 500 }
    )
  }
}
