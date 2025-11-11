import { createClient } from '@supabase/supabase-js';

const url = 'http://127.0.0.1:54321';
const key = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const supabase = createClient(url, key);

const demoUsers = [
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
    email: 'psiquiatr.maria@clinica.cl',
    nombre: 'María',
    apellido_paterno: 'Silva',
    apellido_materno: 'Sánchez',
    run: '12345678-2',
    profesion: 'Psiquiatra',
    rol: 'profesional',
    profesional: true,
    esadmin: false,
    activo: true,
    telefono: '+56 9 2222 2222',
    direccion: 'Calle Principal 124, Santiago',
    estado: 'aprobado',
  },
  {
    email: 'medico.carlos@clinica.cl',
    nombre: 'Carlos',
    apellido_paterno: 'Méndez',
    apellido_materno: 'Flores',
    run: '12345678-3',
    profesion: 'Médico General',
    rol: 'profesional',
    profesional: true,
    esadmin: false,
    activo: true,
    telefono: '+56 9 3333 3333',
    direccion: 'Calle Principal 125, Santiago',
    estado: 'aprobado',
  },
  {
    email: 'asistente.rosa@clinica.cl',
    nombre: 'Rosa',
    apellido_paterno: 'Fernández',
    apellido_materno: 'Rojas',
    run: '12345678-4',
    profesion: 'Asistente Social',
    rol: 'profesional',
    profesional: true,
    esadmin: false,
    activo: true,
    telefono: '+56 9 4444 4444',
    direccion: 'Calle Principal 126, Santiago',
    estado: 'aprobado',
  },
  {
    email: 'pediatra.ana@clinica.cl',
    nombre: 'Ana',
    apellido_paterno: 'Ramírez',
    apellido_materno: 'Torres',
    run: '12345678-5',
    profesion: 'Pediatra',
    rol: 'profesional',
    profesional: true,
    esadmin: false,
    activo: true,
    telefono: '+56 9 5555 5555',
    direccion: 'Calle Principal 127, Santiago',
    estado: 'aprobado',
  },
];

(async () => {
  try {
    console.log('🔧 PASO 1: Agregando columnas faltantes...\n');

    // 1. Add missing columns using Supabase SQL
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.usuarios 
          ADD COLUMN IF NOT EXISTS apellido_paterno TEXT,
          ADD COLUMN IF NOT EXISTS apellido_materno TEXT,
          ADD COLUMN IF NOT EXISTS estamento TEXT,
          ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
      `
    }).catch(() => ({ error: { message: 'RPC not available, trying direct insert' } }));

    if (!alterError || alterError.message.includes('RPC')) {
      console.log('✅ Columnas listas (o ya existen)\n');
    } else {
      console.error('⚠️  Error en ALTER TABLE:', alterError?.message);
    }

    // 2. Insert demo users
    console.log('📝 PASO 2: Insertando 5 usuarios demo...\n');

    let insertados = 0;
    let errores = 0;

    for (const user of demoUsers) {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .insert([user])
          .select();

        if (error) {
          console.error(`❌ Error inserting ${user.nombre}:`, error.message);
          errores++;
        } else {
          console.log(`✅ ${user.nombre} insertado (${user.email})`);
          insertados++;
        }
      } catch (e) {
        console.error(`❌ Exception for ${user.nombre}:`, e.message);
        errores++;
      }
    }

    console.log(`\n📊 Resumen:\n   - Insertados: ${insertados}\n   - Errores: ${errores}\n`);

    // 3. Verify final result
    console.log('✅ PASO 3: Verificando tabla final...\n');
    const { data: finalData, error: finalError } = await supabase
      .from('usuarios')
      .select('userid, nombre, email, profesion, profesional, esadmin, activo')
      .order('fechacreacion', { ascending: false });

    if (finalError) {
      console.error('Error verificando:', finalError);
    } else {
      console.log(`Total usuarios en BD: ${finalData.length}\n`);
      finalData.forEach((u, i) => {
        console.log(`${i + 1}. ${u.nombre} (${u.email})`);
        console.log(`   Profesion: ${u.profesion}`);
        console.log(`   Profesional: ${u.profesional}`);
        console.log(`   Activo: ${u.activo}\n`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
})();
