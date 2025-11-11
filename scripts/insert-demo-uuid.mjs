import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

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
    console.log('📝 Insertando 5 usuarios demo con UUID...\n');

    let insertados = 0;
    let errores = 0;

    for (const user of demoUsers) {
      const usuario = { ...user, userid: randomUUID() };
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .insert([usuario])
          .select();

        if (error) {
          console.error(`❌ ${usuario.nombre}: ${error.message}`);
          errores++;
        } else {
          console.log(`✅ ${usuario.nombre} (${usuario.email})`);
          insertados++;
        }
      } catch (e) {
        console.error(`❌ ${usuario.nombre}: ${e.message}`);
        errores++;
      }
    }

    console.log(`\n📊 Resultado: ${insertados} insertados, ${errores} errores\n`);

    // Verify
    const { data: finalData } = await supabase
      .from('usuarios')
      .select('nombre, email, profesion')
      .order('fechacreacion', { ascending: false });

    console.log(`Total usuarios: ${finalData.length}\n`);
    finalData.forEach((u, i) => {
      console.log(`${i + 1}. ${u.nombre} (${u.email}) - ${u.profesion}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
