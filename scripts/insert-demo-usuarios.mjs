#!/usr/bin/env node
/**
 * Script: Insertar 5 Usuarios Demo en Supabase Local
 * 
 * Uso: node scripts/insert-demo-usuarios.mjs
 * 
 * Inserta 5 usuarios profesionales con diferentes profesiones
 * directamente en la tabla usuarios de Supabase local
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

console.log(`\n🔗 Conectando a Supabase en: ${SUPABASE_URL}\n`);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// 5 Usuarios Demo
const usuariosDemo = [
  {
    email: 'psicolo.juan@clinica.cl',
    nombre: 'Juan',
    apellido_paterno: 'García',
    apellido_materno: 'López',
    run: '12345678-1',
    profesion: 'Psicólogo',
    rol: 'profesional',
    profesional: true,
    esadmin: false,
    activo: true,
    telefono: '+56 9 1111 1111',
    direccion: 'Calle Principal 123, Santiago',
    estado: 'aprobado',
  },
  {
    email: 'psiquiatra.maria@clinica.cl',
    nombre: 'María',
    apellido_paterno: 'Silva',
    apellido_materno: 'Rodríguez',
    run: '13456789-2',
    profesion: 'Psiquiatra',
    rol: 'profesional',
    profesional: true,
    esadmin: false,
    activo: true,
    telefono: '+56 9 2222 2222',
    direccion: 'Avenida Secundaria 456, Santiago',
    estado: 'aprobado',
  },
  {
    email: 'medico.carlos@clinica.cl',
    nombre: 'Carlos',
    apellido_paterno: 'Mendez',
    apellido_materno: 'Sánchez',
    run: '14567890-3',
    profesion: 'Médico General',
    rol: 'profesional',
    profesional: true,
    esadmin: true,
    activo: true,
    telefono: '+56 9 3333 3333',
    direccion: 'Pasaje Terciaria 789, Santiago',
    estado: 'aprobado',
  },
  {
    email: 'trabajosocial.rosa@clinica.cl',
    nombre: 'Rosa',
    apellido_paterno: 'Fernández',
    apellido_materno: 'González',
    run: '15678901-4',
    profesion: 'Asistente Social',
    rol: 'profesional',
    profesional: true,
    esadmin: false,
    activo: true,
    telefono: '+56 9 4444 4444',
    direccion: 'Camino Cuartario 1011, Santiago',
    estado: 'aprobado',
  },
  {
    email: 'pediatra.ana@clinica.cl',
    nombre: 'Ana',
    apellido_paterno: 'Ramírez',
    apellido_materno: 'Torres',
    run: '16789012-5',
    profesion: 'Pediatra',
    rol: 'profesional',
    profesional: true,
    esadmin: false,
    activo: true,
    telefono: '+56 9 5555 5555',
    direccion: 'Boulevard Quinto 1213, Santiago',
    estado: 'aprobado',
  },
];

async function insertarUsuarios() {
  try {
    console.log('📝 Insertando 5 usuarios demo...\n');

    let insertados = 0;
    let errores = 0;

    for (const usuario of usuariosDemo) {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .insert([usuario])
          .select();

        if (error) {
          console.error(`❌ Error insertando ${usuario.nombre}:`, error.message);
          errores++;
        } else {
          console.log(`✅ ${usuario.nombre} ${usuario.apellido_paterno} - ${usuario.profesion}`);
          insertados++;
        }
      } catch (err) {
        console.error(`❌ Error con ${usuario.nombre}:`, err.message);
        errores++;
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   ✅ Insertados: ${insertados}`);
    console.log(`   ❌ Errores: ${errores}`);

    // Verificar que se insertaron
    console.log('\n🔍 Verificando usuarios en BD...');
    const { data: allUsers, error: verifyError } = await supabase
      .from('usuarios')
      .select('email, nombre, profesion, profesional')
      .order('nombre', { ascending: true });

    if (verifyError) {
      console.error('Error verificando:', verifyError.message);
    } else {
      console.log(`\n📋 Total usuarios en BD: ${allUsers?.length || 0}`);
      allUsers?.forEach((u) => {
        console.log(`   • ${u.nombre} (${u.profesion}) - Prof: ${u.profesional}`);
      });
    }

    if (insertados === 5) {
      console.log('\n✅ ¡ÉXITO! Los 5 usuarios fueron insertados correctamente.\n');
    } else {
      console.log(`\n⚠️  Solo se insertaron ${insertados} de 5 usuarios.\n`);
    }
  } catch (error) {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  }
}

insertarUsuarios();
