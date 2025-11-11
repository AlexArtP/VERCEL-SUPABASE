# 🔧 Solución: Estados, Admin y RUN mostrando N/A

## Problema Identificado
La tabla `usuarios` en Supabase **no tiene** las columnas `run`, `activo` y `apellidos`. Esto causa:
- ❌ Campo **RUN** muestra "N/A"
- ❌ Campo **Estado** muestra "Inactivo" (por defecto)
- ❌ Campo **Admin** no se marca correctamente

## Solución Rápida (Recomendado)

### Opción 1: Usar el Dashboard de Supabase (Más Seguro)
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto `Agenda_Vercel`
3. Click en **SQL Editor** (izquierda)
4. Copia y pega el contenido de:
   ```
   scripts/fix_usuarios_table.sql
   ```
5. Click **Run** ▶️
6. Recarga la página en el navegador (F5)

### Opción 2: Usar Endpoint Auto (Solo en Localhost)
1. Asegúrate de que `npm run dev` está corriendo
2. En el navegador, visita:
   ```
   http://localhost:3000/api/admin/fix-users-table?secret=fix-now
   ```
3. Deberías ver respuesta JSON con ✅ success: true
4. Recarga la app (F5)

## Qué Hace la Migración

```sql
-- Agrega 3 nuevas columnas a la tabla usuarios
ALTER TABLE usuarios ADD COLUMN run VARCHAR(50);
ALTER TABLE usuarios ADD COLUMN activo BOOLEAN DEFAULT TRUE;
ALTER TABLE usuarios ADD COLUMN apellidos VARCHAR(255);

-- Asegura que usuarios existentes tengan activo = TRUE
UPDATE usuarios SET activo = TRUE WHERE activo IS NULL;

-- Actualiza tus datos de prueba
UPDATE usuarios SET 
  activo = TRUE,
  apellidos = 'Arteaga',
  esadmin = TRUE
WHERE email = 'a.arteaga02@ufromail.cl';
```

## Verificación Después

Después de ejecutar, debería mostrarse:

| USUARIO   | CONTACTO | RUN | ROL | ADMIN | ESTADO | ACCIONES |
|-----------|----------|-----|-----|-------|--------|----------|
| Alexander | email... | N/A | Profesional | ✅ | Activo | ... |

Si `Admin` sigue sin estar marcado, espera 5 segundos (el polling de usuarios es cada 5s).

## Estructura Actual vs Esperada

### Campos Actuales en Base (Incompletos)
```json
{
  "userid": "...",
  "nombre": "Alexander",
  "email": "a.arteaga02@ufromail.cl",
  "rol": "profesional",
  "esadmin": true,
  "estado": "pendiente"
}
```

### Campos Esperados (Después del Fix)
```json
{
  "userid": "...",
  "nombre": "Alexander",
  "apellidos": "Arteaga",
  "email": "a.arteaga02@ufromail.cl",
  "run": "XX.XXX.XXX-K",  // De tu formulario de registro
  "rol": "profesional",
  "esadmin": true,
  "activo": true,  // ← NUEVO (por defecto TRUE)
  "estado": "pendiente"
}
```

## Cambios Realizados en el Código

### 1. MainApp.tsx - Tabla de Usuarios
- ✅ Ahora muestra `apellidos` como fallback si `run` es NULL
- ✅ El checkbox de Admin lee `esadmin` (minúsculas de Supabase)
- ✅ El estado por defecto es "Activo" si `activo` no está definido

### 2. useFirestoreUsers.ts
- ✅ Interface actualizada para soportar `userid` y múltiples variaciones

## Solución a Largo Plazo

Para futuros usuarios, asegúrate de que el formulario de registro:
1. Capture el campo `run` durante el registro
2. Lo almacene en la tabla `usuarios` 
3. Tenga `activo = true` por defecto

## Troubleshooting

### Si sigue mostrando "N/A"
- [ ] Verifica que ejecutaste la SQL correctamente
- [ ] Recarga con F5 (no solo click en botón)
- [ ] Abre DevTools (F12) → Console y busca mensajes de error
- [ ] Ejecuta `npm run dev` de nuevo

### Si Admin sigue sin estar marcado
- [ ] Espera 5 segundos (es el intervalo de polling)
- [ ] Verifica el valor en Supabase: `SELECT userid, email, esadmin FROM usuarios`
- [ ] Asegúrate que `esadmin` = `true` en la base de datos

### Si ves error en API
- Revisa `/api/users` response en Network tab (F12)
- Debería devolver la información completa de usuarios

## Archivo de Migración

La migración está en:
```
supabase/migrations/20251103_add_missing_fields_to_usuarios.sql
```

Aunque por Supabase CLI normalmente se aplica automáticamente, usamos el endpoint manual para desarrollo.

---

✅ **Después de esto, tu tabla debería lucir perfecta con todos los campos:**
- RUN: Verá el valor o "N/A" si es NULL
- Admin: Checkbox marcado si esadmin = true
- Estado: Siempre "Activo" por defecto
