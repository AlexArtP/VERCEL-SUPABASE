#!/usr/bin/env node

/**
 * Script para actualizar perfiles existentes con la columna activo
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

async function updateProfiles() {
  console.log('🚀 Actualizando perfiles existentes...\n')

  for (const user of demoUsers) {
    try {
      console.log(`📝 Actualizando perfil: ${user.email}`)

      // Obtener el usuario de Auth
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers()

      if (listError) throw listError

      const authUser = listData.users.find(u => u.email === user.email)

      if (!authUser) {
        console.log(`⚠️  Usuario ${user.email} no encontrado en Auth`)
        continue
      }

      console.log(`✅ Usuario encontrado en Auth: ${authUser.id}`)

      // Actualizar o crear el perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: authUser.id,
            email: user.email,
            nombre: user.nombre,
            apellidos: user.apellidos,
            rol: user.rol,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select()
        .single()

      if (profileError) {
        console.error(`❌ Error actualizando perfil: ${profileError.message}`)
      } else {
        console.log(`✅ Perfil actualizado para ${user.email}`)
        
        // Intentar actualizar la columna activo por separado si la anterior falló
        const { error: activoError } = await supabase
          .from('profiles')
          .update({ activo: true })
          .eq('id', authUser.id)
        
        if (!activoError) {
          console.log(`✅ Columna activo actualizada para ${user.email}`)
        }
      }

      console.log(`✨ Perfil ${user.email} completamente configurado\n`)
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

updateProfiles().catch(console.error)
