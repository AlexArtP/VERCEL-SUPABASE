const postgres = require('postgres');

async function run() {
  const defaultLocal = 'postgresql://postgres:postgres@localhost:54322/postgres';
  const DATABASE_URL = process.env.DATABASE_URL || defaultLocal;
  console.log('Usando DATABASE_URL:', DATABASE_URL.startsWith('postgresql://') ? DATABASE_URL.replace(/:(.*?)@/, ':*****@') : DATABASE_URL);
  const sql = postgres(DATABASE_URL, { max: 1 });
  try {
    const res = await sql`select count(*)::int as cnt from public.solicitudes`;
    if (res && res[0]) {
      console.log('Filas en public.solicitudes =', res[0].cnt);
    } else {
      console.log('Tabla public.solicitudes no encontrada o consulta vacía');
    }
  } catch (err) {
    console.error('Error consultando public.solicitudes:', err.message || err);
    process.exit(2);
  } finally {
    await sql.end();
  }
}

run();
