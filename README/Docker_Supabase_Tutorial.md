# Tutorial: Docker Desktop, Supabase CLI y conexión a la base de datos

Este documento explica paso a paso cómo preparar tu entorno de desarrollo local para trabajar con Supabase en este proyecto.
Incluye la instalación y verificación de Docker Desktop (requisito para `supabase start`), la instalación/uso del Supabase CLI y los comandos PowerShell necesarios para vincular, iniciar y probar la base de datos localmente.

IMPORTANTE: Nunca comitees archivos con secretos. Añade las claves en `.env.local` y/o en los secretos del hosting/CI.

---

## Resumen rápido

- Docker Desktop: ejecuta contenedores locales (Postgres, Realtime, Storage) que `supabase start` utiliza.
- Supabase CLI: herramienta para levantar el stack local, aplicar migraciones, generar tipos y desplegar funciones.
- Conexión a la DB: puedes usar la `DATABASE_URL` (cadena Postgres) para scripts o usar la CLI para migraciones.

---

## Requisitos previos

- Windows 10/11 con virtualización habilitada (VT-x / AMD-V).
- Permisos de administrador para instalar componentes y habilitar características del sistema.
- Docker Desktop instalado y funcionando (uso de WSL2 recomendado).

---

## 1) Docker Desktop — qué es y por qué lo necesitamos

- ¿Qué es? Docker Desktop instala Docker Engine y una interfaz para gestionar contenedores.
- ¿Para qué lo usamos en este proyecto? `supabase start` levanta servicios (Postgres, Realtime, Storage, GoTrue, etc.) en contenedores Docker. Sin Docker no podrás emular el entorno Supabase localmente.

Beneficios:
- Entorno reproducible para desarrollo y pruebas.
- Permite ejecutar la base de datos Postgres localmente con la misma versión que en Supabase.

Más info: https://docs.docker.com/desktop

### Instalación (PowerShell)

Opción A — Winget (recomendado si lo tienes):

```powershell
winget install --id Docker.DockerDesktop -e
```

Opción B — Descargar e instalar manualmente:

1. Abrir https://docs.docker.com/desktop
2. Descargar el instalador para Windows y ejecutarlo.

Opción C — Scoop (opcional):

```powershell
# Instalar Scoop si no tienes
iwr -useb get.scoop.sh | iex
scoop bucket add extras
scoop install docker-desktop
```

### Habilitar WSL2 (si no lo tienes)

```powershell
# Ejecutar en PowerShell con privilegios de administrador
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
# Reinicia si es necesario y sigue instrucciones en https://aka.ms/wsl2kernel si te solicita instalar el kernel
```

### Verificar que Docker está corriendo

```powershell
# Ver proceso Docker Desktop
Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue

# Ver versión de docker
docker --version

docker info

# Comprobar si el pipe está disponible (Windows)
Test-Path '\\.\\pipe\\docker_engine'
```

Si `docker info` falla, abre Docker Desktop (menú Inicio) y espera a que el servicio se inicie.

---

## 2) Supabase CLI — instalación y utilidad

La CLI te permite:

- `supabase start` — levantar servicios locales (requiere Docker).
- `supabase link` — asociar el directorio local con un proyecto Supabase remoto.
- `supabase db push` / `supabase db reset` — aplicar migraciones o resetear la DB local.
- `supabase gen types` — generar tipos TypeScript a partir del schema.

### Métodos de instalación (Windows)

1) Usar el binario proporcionado en este repositorio (si existe)

Este repo incluye `supabase\supabase.exe`. Puedes invocarlo directamente desde la raíz:

```powershell
& '.\\supabase\\supabase.exe' --version
```

2) Descargar el binario desde releases de GitHub

Ir a: https://github.com/supabase/cli/releases y descargar el `supabase_x.y.z_windows_amd64.zip`. Extraer `supabase.exe` a una carpeta permanente (p. ej. `C:\tools\supabase`) y añadir esa carpeta al PATH (ver abajo).

3) Instalar con Scoop/Chocolatey/Winget (si está disponible)

```powershell
# Scoop
scoop install supabase

# Winget (si existe paquete)
winget install supabase
```

### Añadir al PATH (persistente) desde PowerShell

```powershell
# Ejecutar desde la raíz del proyecto si el binario está en .\\supabase
$folder = (Resolve-Path .\\supabase).ProviderPath
$old = [Environment]::GetEnvironmentVariable('Path','User')
if ($old -notlike "*$folder*"){
  $new = if ($old) { "$old;$folder" } else { $folder }
  [Environment]::SetEnvironmentVariable('Path',$new,'User')
  Write-Host "Added $folder to user PATH. Close/open terminals to apply."
} else { Write-Host "Folder already in PATH" }
```

### Verificar instalación

```powershell
# Si quedó en PATH
supabase --version
# O ejecutar el binario local
& '.\\supabase\\supabase.exe' --version
```

---

## 3) Flujo recomendado: link, start, migraciones y pruebas

Ejecuta los siguientes pasos desde la raíz del proyecto en PowerShell (asegúrate de que Docker Desktop esté corriendo):

1) (Opcional) Linkear tu proyecto local con el proyecto remoto Supabase

```powershell
# Reemplaza <project_ref> por el project ref de tu proyecto Supabase
& '.\\supabase\\supabase.exe' link --project-ref spbkmtvpvfdhnofqkndb
```

2) Iniciar el stack local

```powershell
# Levanta contenedores locales (Postgres, Realtime, Storage, etc.)
& '.\\supabase\\supabase.exe' start
```

3) Aplicar migraciones (si tienes migraciones en `supabase/migrations`)

```powershell
# Aplica el schema a la DB local
& '.\\supabase\\supabase.exe' db push

# O para resetear la db local (cuidado: borra datos)
& '.\\supabase\\supabase.exe' db reset
```

4) Generar tipos TypeScript (opcional)

```powershell
& '.\\supabase\\supabase.exe' gen types typescript --schema public --out-file types/supabase.ts
```

5) Probar desde la app / scripts

- Asegúrate de que `.env.local` contiene las variables necesarias (no subir al repo):

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key> # solo si es necesario server-side
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.spbkmtvpvfdhnofqkndb.supabase.co:5432/postgres
```

- Test rápido desde Node (usa `db.js` incluido en el repo):

```powershell
node --input-type=module -e "import sql from './db.js'; (async()=>{ const r = await sql`SELECT 1 as ok`; console.log(r); await sql.end(); })()"
```

- Reinicia el servidor de desarrollo Next.js y prueba endpoints server-side:

```powershell
npm run dev
# En otra terminal
Invoke-RestMethod -Uri "http://localhost:3000/api/profile?id=1" -Method GET -TimeoutSec 15
```

Si la respuesta proviene de la DB real (no demo data), la conexión y el flow están configurados correctamente.

---

## 4) Conexión directa con `DATABASE_URL` (cuando usarla)

- Útil para scripts, backfills y procesos ETL puntuales.
- Pega la cadena Postgres en `.env.local` como `DATABASE_URL`. Usa `db.js` para ejecutar queries desde Node.

Ejemplo:

```javascript
// db.js (ya incluido)
import postgres from 'postgres'
const connectionString = process.env.DATABASE_URL
const sql = postgres(connectionString)
export default sql
```

Y el test Node ya mostrado arriba.

---

## 5) Seguridad y buenas prácticas

- Nunca comitees `.env.local` ni archivos con claves.
- `SUPABASE_SERVICE_ROLE_KEY` debe vivir solo en entornos server/CI (Vercel secrets/GitHub secrets).
- Para trabajo local, puedes usar la service role en `.env.local`, pero recuerda rotarla y no publicarla.
- Si no quieres usar `DATABASE_URL` directamente, usa la API de Supabase con la service role en server-side endpoints.

---

## 6) Troubleshooting rápido

- Error: `failed to inspect service: ... docker engine` → Docker Desktop no está corriendo o el pipe `\\.\pipe\\docker_engine` no está disponible. Abre Docker Desktop, espera a que termine de inicializar y reintenta.
- Error: `supabase start` pide privilegios → abre PowerShell como administrador e intenta de nuevo.
- `docker info` falla → comprueba WSL2 y que Virtual Machine Platform esté habilitado.

---

Si quieres, puedo:

- Ejecutar `& '.\\supabase\\supabase.exe' start` aquí y monitorizar la salida (si Docker Desktop está corriendo en esta máquina). 
- O guiarte paso a paso mientras ejecutas los comandos en tu terminal y me pegas la salida para diagnosticar.

Fin del tutorial.
