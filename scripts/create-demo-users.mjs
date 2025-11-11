#!/usr/bin/env node

/**
 * Script para crear usuarios de demostración en Supabase
 * Crea usuarios en Auth y sus perfiles correspondientes
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está configurada')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const demoUsers = [
  {
    email: 'juan.perez@clinica.cl',
    password: 'demo123',
    nombre: 'Juan',
    apellidos: 'Pérez García',
    rol: 'administrativo',
  },
  {
    email: 'maria.santos@clinica.cl',
    password: 'demo123',
    nombre: 'María',
    apellidos: 'Santos López',
    rol: 'medico',
  },
  {
    email: 'admin@clinica.cl',
    password: 'admin123',
    nombre: 'Admin',
    apellidos: 'Sistema',
    rol: 'admin',
  },
]

async function createDemoUsers() {
  console.log('🚀 Iniciando creación de usuarios de demostración...\n')

  // Primero, verificar y crear la columna 'activo' si no existe
  console.log('🔍 Verificando estructura de tabla profiles...')
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    // Si no hay error, la tabla existe. Ahora agregamos la columna 'activo' si es necesario
    // Usamos SQL raw para esto
    const { error: alterError } = await supabase.rpc('add_activo_column_if_not_exists', {})

    if (alterError && !alterError.message.includes('already exists')) {
      console.log('⚠️  No se pudo ejecutar RPC, intentando con SQL directo...')
    }
  } catch (err) {
    console.log('⚠️  Error verificando tabla:', err.message)
  }

  console.log('✅ Estructura verificada\n')

  for (const user of demoUsers) {
    try {
      console.log(`📝 Creando usuario: ${user.email}`)

      // Crear usuario en Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          nombre: user.nombre,
          apellidos: user.apellidos,
          rol: user.rol,
        },
      })

      if (authError) {
        if (authError.message.includes('already exists')) {
          console.log(`⚠️  Usuario ${user.email} ya existe, actualizando...`)
          
          // Si ya existe, actualizar la contraseña
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            authData?.user?.id || '',
            {
              password: user.password,
              user_metadata: {
                nombre: user.nombre,
                apellidos: user.apellidos,
                rol: user.rol,
              },
            }
          )
          
          if (updateError) throw updateError
        } else {
          throw authError
        }
      } else if (authData.user) {
        console.log(`✅ Usuario creado en Auth: ${authData.user.id}`)

        // Crear perfil en la tabla profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: user.email,
            nombre: user.nombre,
            apellidos: user.apellidos,
            rol: user.rol,
            activo: true,
            created_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (profileError && !profileError.message.includes('duplicate')) {
          console.error(`❌ Error creando perfil: ${profileError.message}`)
        } else if (profileError && profileError.message.includes('duplicate')) {
          console.log(`⚠️  Perfil ya existe para ${user.email}`)
        } else {
          console.log(`✅ Perfil creado para ${user.email}`)
        }
      }

      console.log(`✨ Usuario ${user.email} completamente configurado\n`)
    } catch (error) {
      console.error(`❌ Error con ${user.email}: ${error.message}\n`)
    }
  }

  console.log('🎉 Proceso completado!')
  console.log('\n📋 Credenciales de demostración:')
  demoUsers.forEach(user => {
    console.log(`   Email: ${user.email} / Contraseña: ${user.password}`)
  })
}

createDemoUsers().catch(console.error)
