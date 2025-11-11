const postgres = require('postgres');

async function run() {
  const defaultLocal = 'postgresql://postgres:postgres@localhost:54322/postgres';
  const DATABASE_URL = process.env.DATABASE_URL || defaultLocal;
  console.log('Usando DATABASE_URL:', DATABASE_URL.startsWith('postgresql://') ? DATABASE_URL.replace(/:(.*?)@/, ':*****@') : DATABASE_URL);
  const sql = postgres(DATABASE_URL, { max: 1 });
  try {
    const tables = await sql`
      select table_name from information_schema.tables 
      where table_schema='public' and table_name in ('profiles', 'solicitudes', 'auth.users')
      order by table_name
    `;
    console.log('\n✓ Tablas verificadas:');
    tables.forEach(t => console.log(`  - ${t.table_name}`));

    const profileCols = await sql`
      select column_name, data_type from information_schema.columns 
      where table_schema='public' and table_name='profiles'
      order by ordinal_position
    `;
    console.log('\n✓ Columnas en public.profiles:');
    profileCols.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type}`));

    const policyCount = await sql`
      select count(*) as cnt from information_schema.constraint_table_usage
      where table_schema='public' and table_name='profiles'
    `;
    console.log('\n✓ RLS habilitado en profiles:', policyCount[0]?.cnt > 0 ? 'sí' : 'verificar manualmente');
  } catch (err) {
    console.error('Error:', err.message || err);
  } finally {
    await sql.end();
  }
}

run();
