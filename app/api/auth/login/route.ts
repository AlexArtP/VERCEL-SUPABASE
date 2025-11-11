/**
 * ARCHIVO: app/api/auth/login/route.ts
 * PROPÓSITO: Endpoint para login usando Supabase Auth
 * 
 * POST /api/auth/login
 * Body: { email: string, password: string }
 * 
 * Este endpoint autentica contra Supabase Auth y retorna los datos del usuario (metadata desde profiles)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Crear cliente Supabase para autenticación (clave pública/anon)
function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false }
  })
}

// Crear cliente Supabase con service role (para leer profiles sin restricción RLS)
function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase service role key')
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false }
  })
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      console.error('[login] Missing email or password')
      return NextResponse.json(
        { error: 'Email y contraseña requeridos' },
        { status: 400 }
      )
    }

    console.log(`\n🔐 LOGIN REQUEST - Email: ${email}`)
    console.log('='.repeat(60))

    const supabase = createSupabaseClient()

    // Intentar autenticar con Supabase Auth
    let authData
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error(`❌ Autenticación fallida: ${error.message}`)
        let errorMessage = 'Credenciales incorrectas'
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email o contraseña incorrectos'
        } else if (error.message.includes('User not found')) {
          errorMessage = 'El usuario no existe'
        }
        return NextResponse.json(
          { error: errorMessage },
          { status: 401 }
        )
      }

      authData = data
      console.log(`✅ Autenticación exitosa - UID: ${authData.user.id}`)
    } catch (err: any) {
      console.error(`❌ Error de autenticación: ${err.message}`)
      return NextResponse.json(
        { error: 'Error al procesar autenticación' },
        { status: 500 }
      )
    }

    // Obtener datos del usuario desde la tabla profiles usando service role (sin restricción RLS)
    console.log(`📄 Obteniendo datos del perfil...`)
    console.log(`🔍 [LOGIN] Buscando perfil para usuario: ${authData.user.id}`)
    console.log(`🔍 [LOGIN] Email del auth.user: ${authData.user.email}`)
    
    // Usar service role para evitar RLS durante login (el servidor es de confianza)
    const serviceSupabase = createSupabaseServiceClient()
    
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      console.warn(`❌ [LOGIN] Perfil NO encontrado en BD`)
      console.warn(`❌ [LOGIN] Error: ${profileError?.message}`)
      console.warn(`⚠️  [LOGIN] Intentando obtener datos de tabla usuarios...`)
      
      // Si no hay profile, intentar obtener datos de la tabla usuarios
      const { data: usuariosData, error: usuariosError } = await serviceSupabase
        .from('usuarios')
        .select('*')
        .eq('email', authData.user.email)
        .single()
      
      if (usuariosError || !usuariosData) {
        console.warn(`❌ [LOGIN] Tampoco encontrado en usuarios: ${usuariosError?.message}`)
        console.warn(`❌ [LOGIN] Creando respuesta con datos mínimos (es_admin=false)`)
        // El usuario existe en auth.users pero no en profiles ni usuarios
        // Retornamos datos mínimos y el cliente/admin pueden actualizar después
        return NextResponse.json({
          success: true,
          token: authData.session?.access_token,
          session: authData.session,
          user: {
            id: authData.user.id,
            email: authData.user.email,
            nombre: '',
            apellidoPaterno: '',
            apellidoMaterno: '',
            es_admin: false,
            estado: 'activo'
          }
        })
      }
      
      // ✅ Encontrado en tabla usuarios
      console.log(`✅ [LOGIN] Datos encontrados en tabla usuarios`)
      console.log(`✅ [LOGIN] Email: ${usuariosData.email}`)
      console.log(`✅ [LOGIN] Nombre: ${usuariosData.nombre}`)
      
      const usuariosEsAdmin = (usuariosData as any).esadmin === true || 
                              (usuariosData as any).es_admin === true || 
                              (usuariosData as any).esAdmin === true
      
      console.log(`✅ [LOGIN] esadmin: ${usuariosEsAdmin}`)
      console.log(`✅ [LOGIN] TODAS LAS PROPIEDADES:`)
      console.log(JSON.stringify(usuariosData, null, 2))
      
      console.log('='.repeat(60))
      console.log(`✅ Login completado exitosamente\n`)
      
      const responseUser = {
        id: authData.user.id,
        email: usuariosData.email,
        nombre: usuariosData.nombre,
        apellidoPaterno: usuariosData.apellidoPaterno || usuariosData.apellido_paterno || '',
        apellidoMaterno: usuariosData.apellidoMaterno || usuariosData.apellido_materno || '',
        es_admin: usuariosEsAdmin,
        activo: usuariosData.activo !== false,
        run: usuariosData.run,
        telefono: usuariosData.telefono
      }
      
      console.log(`✅ [LOGIN] ENVIANDO RESPUESTA AL CLIENTE (desde usuarios):`)
      console.log(`   - es_admin: ${responseUser.es_admin}`)
      console.log(`   - Tipo: ${typeof responseUser.es_admin}`)
      console.log(JSON.stringify(responseUser, null, 2))
      
      return NextResponse.json({
        success: true,
        token: authData.session?.access_token,
        session: authData.session,
        user: responseUser
      })
    }

    console.log(`✅ [LOGIN] Datos del perfil obtenidos desde BD`)
    console.log(`✅ [LOGIN]   Email: ${profile.email}`)
    console.log(`✅ [LOGIN]   Nombre: ${profile.nombre}`)
  const loggedIsAdmin = (profile as any).es_admin ?? (profile as any).is_admin
  console.log(`✅ [LOGIN]   es_admin|is_admin: ${loggedIsAdmin}`)
  console.log(`✅ [LOGIN]   Tipo: ${typeof loggedIsAdmin}`)
    console.log(`✅ [LOGIN]   activo: ${profile.activo}`)
    console.log(`✅ [LOGIN]   TODAS LAS PROPIEDADES DEL PERFIL:`)
    console.log(JSON.stringify(profile, null, 2))

    // Verificar si el usuario está activo (profiles usa 'activo' boolean, no 'estado')
    if (profile.activo === false) {
      console.log(`❌ Usuario no activo (activo: ${profile.activo})`)
      return NextResponse.json(
        { error: `Usuario inactivo. Contacta al administrador.` },
        { status: 403 }
      )
    }

    // NUEVA LÓGICA: También revisar tabla usuarios para obtener esadmin (es la fuente principal)
    console.log(`📋 [LOGIN] Revisando tabla usuarios para esadmin...`)
    const { data: usuariosData, error: usuariosError } = await serviceSupabase
      .from('usuarios')
      .select('esadmin, es_admin, esAdmin')
      .eq('email', authData.user.email)
      .single()

    let usuariosEsAdmin = false
    if (usuariosError) {
      console.warn(`⚠️  [LOGIN] No encontrado en tabla usuarios: ${usuariosError.message}`)
    } else if (usuariosData) {
      usuariosEsAdmin = (usuariosData as any).esadmin === true || 
                        (usuariosData as any).es_admin === true || 
                        (usuariosData as any).esAdmin === true
      console.log(`✅ [LOGIN] Encontrado en usuarios tabla - esadmin: ${usuariosEsAdmin}`)
      console.log(`✅ [LOGIN] Datos usuarios: ${JSON.stringify(usuariosData)}`)
    }

    console.log('='.repeat(60))
    console.log(`✅ Login completado exitosamente\n`)

    // Usar el valor de esadmin de la tabla usuarios como fuente principal
    const isAdminValue = usuariosEsAdmin || ((profile as any).es_admin ?? (profile as any).is_admin ?? false)
    const responseUser = {
      id: authData.user.id,
      email: profile.email,
      nombre: profile.nombre,
      apellidoPaterno: profile.apellido_paterno,
      apellidoMaterno: profile.apellido_materno,
      es_admin: Boolean(isAdminValue),
      activo: profile.activo !== false,
      run: profile.run,
      telefono: profile.telefono
    }

    console.log(`✅ [LOGIN] ENVIANDO RESPUESTA AL CLIENTE:`)
    console.log(`   - es_admin: ${responseUser.es_admin}`)
    console.log(`   - Tipo: ${typeof responseUser.es_admin}`)
    console.log(JSON.stringify(responseUser, null, 2))

    return NextResponse.json({
      success: true,
      token: authData.session?.access_token,
      session: authData.session,
      user: responseUser
    })
  } catch (error: any) {
    console.error('[login] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
