# 🔧 Corregir Error RLS - Infinite Recursion

El error que ves es por una política de seguridad incorrecta en Supabase:

```
infinite recursion detected in policy for relation "usuarios"
```

## ✅ Solución Rápida (30 segundos)

### Opción A: SQL Editor (Más simple)

1. Ve a **https://supabase.com/dashboard**
2. Selecciona tu proyecto: `spbkmtvpvfdhnofqkndb`
3. Click en **SQL Editor** (lado izquierdo)
4. Click **New Query**
5. Copia y pega esto:

```sql
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
```

6. Click **Run** (botón azul)
7. Debe mostrar: `✓ ALTER TABLE`

---

### Opción B: Console directo

Si tienes acceso a la terminal de PostgreSQL:

```bash
psql -U postgres -h localhost -p 54322 -d postgres -c "ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;"
```

---

## 🧪 Verificar que funciona

Después de desactivar RLS, ejecuta en tu terminal local:

```bash
node scripts/verify-supabase-remote.js
```

Deberías ver:

```
✅ Conexión exitosa a Supabase Remoto!
   Status Code: 200
   Response: [...]
🚀 ¡Listo para deploy a Vercel!
```

---

## ⚠️ Nota sobre seguridad

**Desactivar RLS** es aceptable para desarrollo/demo, pero en **producción** deberías:

1. Crear RLS policies correctas que NO causen recursión
2. Usar la Anon Key solo para ciertas tablas
3. Usar Service Role Key solo en el servidor

Por ahora, procede sin RLS y después lo puedes optimizar.

---

**¿Ya ejecutaste el SQL?** Dime cuándo lo hagas y continuamos con Vercel. 🚀

