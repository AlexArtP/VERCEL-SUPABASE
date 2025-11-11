const postgres = require('postgres');

// Usage: node check_local_db_connection.js [DATABASE_URL]
const dbUrl = process.argv[2] || process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

function isLocal(url) {
  return /localhost|127\.0\.0\.1/.test(url);
}

(async () => {
  const opts = { connectionString: dbUrl };
  // postgres lib accepts { ssl: { rejectUnauthorized: false } } but for local we skip SSL
  if (isLocal(dbUrl)) {
    opts.ssl = false;
  }
  const sql = postgres(opts);
  try {
    const res = await sql`select now() as now`;
    console.log('Connected OK - server time:', res[0].now);
    await sql.end({ timeout: 1 });
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err.message || err);
    if (err.stack) console.error(err.stack);
    try { await sql.end({ timeout: 1 }); } catch (e) { }
    process.exit(2);
  }
})();
