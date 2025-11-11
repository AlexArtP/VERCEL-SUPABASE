const postgres = require('postgres');

(async ()=>{
  const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres';
  const sql = postgres(DATABASE_URL, { max: 1 });
  try{
    console.log('Usando DATABASE_URL:', DATABASE_URL.startsWith('postgresql://') ? DATABASE_URL.replace(/:(.*?)@/, ':*****@') : DATABASE_URL);

    const tables = [
      'public.profesionales',
      'public.profesionales_config',
      'public.pacientes',
      'public.modulos',
      'public.citas',
      'public.calendario_dia',
      'public.audit_logs',
      'auth.users'
    ];

    for (const t of tables) {
      const [schema, name] = t.split('.')
      const exists = await sql`SELECT to_regclass(${t}) IS NOT NULL AS exists`;
      const isExists = exists[0] && exists[0].exists;
      if (!isExists) {
        console.log(`${t}: NO EXISTE`);
        continue;
      }
      const [{ count }] = await sql`SELECT count(*)::int AS count FROM ${sql(t)}`.catch(e=>[{count:'error'}]);
      console.log(`${t}: existe — filas: ${count}`);
    }

    await sql.end();
    process.exit(0);
  }catch(e){
    console.error('Error check_tables:', e);
    try{ await sql.end(); }catch(_){ }
    process.exit(2);
  }
})();
