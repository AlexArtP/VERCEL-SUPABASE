## Conectar el proyecto a Supabase

Pasos rápidos para conectar esta app a tu proyecto Supabase recién creado (asumiendo que ya ejecutaste las migraciones y seeds).

1) Copia el archivo de ejemplo de variables de entorno:

   - Renombra `.env.local.example` a `.env.local` y completa los valores:

     NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>
     SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>  # guardar solo en CI/host

   En PowerShell:

   Copy-Item .env.local.example .env.local
   # Edita .env.local con tu editor y pega las keys

2) Aplicar migraciones (si no lo hiciste via SQL Editor):

   Opción A — SQL Editor (recomendado si prefieres UI)
   - Abre Supabase Console → SQL Editor → pega `migrations/001_init.sql` y ejecuta.
   - Pega `migrations/002_seed.sql` y ejecuta.

   Opción B — CLI / psql:

   # usando supabase CLI (requiere login):
   supabase db remote set "postgresql://postgres:<password>@<host>:5432/postgres"
   supabase db push --file migrations/001_init.sql
   supabase db push --file migrations/002_seed.sql

   # o usando psql directamente (reemplaza la connection string):
   # psql "host=... port=5432 dbname=postgres user=postgres sslmode=require" -f migrations/001_init.sql
   # psql "..." -f migrations/002_seed.sql

3) Agregar `SUPABASE_SERVICE_ROLE_KEY` a CI/hosting

   - En Vercel / Netlify / GitHub Actions: Añade `SUPABASE_SERVICE_ROLE_KEY` como secreto de entorno.
   - No pongas la service role key en `.env.local` en repositorios públicos.

4) Probar localmente

   npm run dev
   # Navega a http://localhost:3000 y prueba editar perfil, crear pacientes, etc.

5) Notas de seguridad

   - Las funciones definidas con `SECURITY DEFINER` usan la service role para backfills y triggers; asegúrate que el service-role key esté solo en server-side.
   - Revisa políticas RLS en `migrations/001_init.sql` y ajusta según tu modelo de auth.
