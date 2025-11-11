import { createClient } from '@supabase/supabase-js';

const url = 'http://127.0.0.1:54321';
const key = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const supabase = createClient(url, key);

(async () => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('fechacreacion', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } else {
    console.log(`\n✅ Total usuarios: ${data.length}\n`);
    data.forEach((u, i) => {
      console.log(`${i+1}. ${u.nombre} (${u.email})`);
      console.log(`   Profesión: ${u.profesion}`);
      console.log(`   Profesional: ${u.profesional}`);
      console.log(`   Admin: ${u.esadmin}\n`);
    });
  }
})();
