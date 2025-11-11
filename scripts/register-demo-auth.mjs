import { createClient } from '@supabase/supabase-js';

const url = 'http://127.0.0.1:54321';
const key = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const supabase = createClient(url, key);

const demoUsers = [
  { email: 'psicolo.juan@clinica.cl', nombre: 'Juan' },
  { email: 'psiquiatr.maria@clinica.cl', nombre: 'María' },
  { email: 'medico.carlos@clinica.cl', nombre: 'Carlos' },
  { email: 'asistente.rosa@clinica.cl', nombre: 'Rosa' },
  { email: 'pediatra.ana@clinica.cl', nombre: 'Ana' },
];

const password = 'demo1234';

(async () => {
  let ok = 0, fail = 0;
  for (const user of demoUsers) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password,
        email_confirm: true,
        user_metadata: { nombre: user.nombre }
      });
      if (error) {
        console.error(`❌ ${user.email}: ${error.message}`);
        fail++;
      } else {
        console.log(`✅ ${user.email} registrado en auth`);
        ok++;
      }
    } catch (e) {
      console.error(`❌ ${user.email}: ${e.message}`);
      fail++;
    }
  }
  console.log(`\n📊 Resumen: ${ok} registrados, ${fail} errores`);
})();
