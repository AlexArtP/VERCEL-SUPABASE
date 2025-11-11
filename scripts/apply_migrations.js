const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

async function run() {
  try {
    const migrationsDir = path.resolve(__dirname, '..', 'migrations');
    // Ejecutar todas las migraciones .sql en el directorio, en orden alfabético
    const allFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    if (allFiles.length === 0) {
      console.error(`No se encontraron migraciones en ${migrationsDir}`);
      process.exit(1);
    }

    const sqlFiles = allFiles.map(f => path.join(migrationsDir, f));

    // DB URL: prefer env var, otherwise fallback to local Supabase default
    const defaultLocal = 'postgresql://postgres:postgres@localhost:54322/postgres';
    const DATABASE_URL = process.env.DATABASE_URL || defaultLocal;

    console.log('Usando DATABASE_URL:', DATABASE_URL.startsWith('postgresql://') ? DATABASE_URL.replace(/:(.*?)@/, ':*****@') : DATABASE_URL);

    const sql = postgres(DATABASE_URL, { max: 1 });

    for (const f of sqlFiles) {
      const content = fs.readFileSync(f, 'utf8');
      console.log(`Ejecutando migración: ${path.basename(f)} ...`);
      // Ejecutar como un batch
      try {
        await sql.unsafe(content);
        console.log(`Migración ${path.basename(f)} aplicada.`);
      } catch (err) {
        const msg = err && (err.message || err.toString && err.toString()) || '';
        // Si la migración ya está aplicada (objeto existe), loguear y continuar
        if (/already exists|duplicate_table|42710|42P07/i.test(msg)) {
          console.warn(`Advertencia: migración ${path.basename(f)} parece ya aplicada: ${msg}`);
          continue;
        }
        console.error(`Error aplicando migración ${path.basename(f)}:`, msg);
        await sql.end();
        process.exit(2);
      }
    }

    await sql.end();
    console.log('Todas las migraciones aplicadas correctamente.');
    process.exit(0);
  } catch (err) {
    console.error('Error aplicando migraciones:', err);
    process.exit(2);
  }
}

run();
