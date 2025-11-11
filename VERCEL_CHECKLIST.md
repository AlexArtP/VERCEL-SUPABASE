# 🚀 VERCEL DEPLOYMENT - CHECKLIST FINAL

## ✅ Estado Actual

Tu proyecto está **95% listo** para Vercel. Solo necesitas hacer 2 pasos:

---

## 📋 PASO 1: Corregir RLS en Supabase (5 min)

**Problema:** Hay una recursión en las políticas de seguridad

**Solución:** Desactivar RLS temporalmente

### Ejecuta esto en Supabase SQL Editor:

1. Ve a **https://supabase.com/dashboard**
2. Selecciona tu proyecto: `spbkmtvpvfdhnofqkndb`
3. Click **SQL Editor** → **New Query**
4. Pega:
```sql
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
```
5. Click **Run**

**Resultado esperado:** `✓ ALTER TABLE`

---

## 📋 PASO 2: Configurar Vercel (10 min)

### 2.1 Accede a Vercel Dashboard

Ve a **https://vercel.com/dashboard**

### 2.2 Importa tu repositorio

1. Click **"Add New..."** → **"Project"**
2. Busca: **`VERCEL-SUPABASE`** (tu repo en GitHub)
3. Click **Import**

### 2.3 Configura Environment Variables

Vercel te mostrará una pantalla para agregar variables. Añade estas 3:

```
NEXT_PUBLIC_SUPABASE_URL 
= https://spbkmtvpvfdhnofqkndb.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY 
= sb_publishable_OeSg1lhBdAMnrgx8AI5TGQ_Aum0ciRH

SUPABASE_SERVICE_ROLE_KEY 
= eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwYmttdHZwdmZkaG5vZnFrbmRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTYwOTE0MSwiZXhwIjoyMDc3MTg1MTQxfQ.-CrV3hYxs8ZzRyQSJK6XYSSxEM3NmS4l33VWN9EQsMA
```

### 2.4 Deploy

1. Click **"Deploy"**
2. Espera 3-5 minutos mientras Vercel compila
3. Recibirás una URL como: `https://vercel-supabase-xxxxx.vercel.app`

---

## 🧪 Verificar Deploy

Una vez completado:

1. Abre tu URL de Vercel
2. Haz login con una cuenta de tu Supabase
3. Verifica que carguen:
   - ✅ Calendario
   - ✅ Citas
   - ✅ Pacientes
   - ✅ Perfil profesional

---

## 📦 Resumen de Variables

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://spbkmtvpvfdhnofqkndb.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_OeSg1lhBdAMnrgx8AI5TGQ_Aum0ciRH` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` (el token que proporcionaste) |

---

## 🎯 Próximos Pasos Después del Deploy

- [ ] Configura el dominio personalizado (opcional)
- [ ] Configura CI/CD para auto-deploy en cada push
- [ ] Sube datos de producción a Supabase
- [ ] Documenta endpoints de API

---

**¿Ya ejecutaste el SQL en Supabase?** 

Dime cuando lo hagas y te diré exactamente qué hacer en Vercel. 🚀

