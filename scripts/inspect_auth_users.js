const postgres = require('postgres');
(async ()=>{
  const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres';
  const sql = postgres(DATABASE_URL, { max: 1 });
  try{
    const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' ORDER BY ordinal_position`;
    console.log('auth.users columns:');
    console.table(cols);
  }catch(e){
    console.error('Error:', e);
  }finally{
    await sql.end();
  }
})();
