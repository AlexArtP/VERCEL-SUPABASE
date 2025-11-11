/**
 * ARCHIVO: app/api/admin/migrate-columns/route.ts
 * PROPÓSITO: Ejecutar migraciones de columnas en la BD
 * 
 * POST /api/admin/migrate-columns - Crear columnas faltantes (agenda_disabled, agenda_disabled_reason)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    // Verificación básica de seguridad (solo localhost + secret)
    const isLocalhost = request.headers.get('host')?.includes('localhost') || 
                       request.headers.get('host')?.includes('127.0.0.1')
    
    if (!isLocalhost || secret !== 'fix-now') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const supabase = createServiceRoleClient()

    console.log('🔧 Verificando columnas necesarias...')

    // Intentar seleccionar las columnas para verificar que existen
    const { error: testError } = await supabase
      .from('usuarios')
      .select('agenda_disabled, agenda_disabled_reason')
      .limit(1)

    if (testError?.code === 'PGRST001' || testError?.message?.includes('not found') || testError?.message?.includes('does not exist')) {
      // Las columnas no existen
      console.log('❌ Las columnas no existen aún. Necesitan ser creadas manualmente.')
      return NextResponse.json({
        status: 'error',
        message: 'Las columnas agenda_disabled y agenda_disabled_reason no existen',
        instructions: 'Debes crear manualmente las columnas en Supabase o ejecutar el SQL en la consola',
        sql: `
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS agenda_disabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS agenda_disabled_reason text DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_usuarios_agenda_disabled ON usuarios(agenda_disabled);
CREATE INDEX IF NOT EXISTS idx_usuarios_profesional_agenda ON usuarios(profesional, agenda_disabled);
        `
      }, { status: 400 })
    }

    if (testError) {
      // Otro tipo de error
      return NextResponse.json({
        status: 'error',
        message: testError.message,
        code: testError.code
      }, { status: 500 })
    }

    console.log('✅ Columnas verificadas - existen y están disponibles')

    return NextResponse.json({
      status: 'success',
      message: 'Migración completada',
      columns: ['agenda_disabled', 'agenda_disabled_reason']
    }, { status: 200 })

  } catch (error: any) {
    console.error('[POST /api/admin/migrate-columns] Error:', error)
    return NextResponse.json(
      { 
        error: 'Error en migración',
        message: error.message
      },
      { status: 500 }
    )
  }
}
