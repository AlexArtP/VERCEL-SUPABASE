import { createClient } from '@supabase/supabase-js';

const url = 'http://127.0.0.1:54321';
const key = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const supabase = createClient(url, key);

(async () => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .insert([{
        email: 'a.arteaga02@ufromail.cl',
        nombre: 'Alexander',
        apellido_paterno: '',
        apellido_materno: '',
        run: '26858946-5',
        profesion: 'Médico Residente Psiquiatría Infantil',
        rol: 'profesional',
        profesional: true,
        esadmin: true,
        activo: true,
        telefono: null,
        direccion: null,
        estado: 'Aprobado',
      }])
      .select();

    if (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    } else {
      console.log('✅ Alexander recuperado exitosamente');
      console.log(`   Email: ${data[0].email}`);
      console.log(`   Nombre: ${data[0].nombre}`);
      console.log(`   Admin: ${data[0].esadmin}`);
    }
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
