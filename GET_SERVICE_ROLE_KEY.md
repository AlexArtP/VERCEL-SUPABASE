# 🔑 Obtener Service Role Key de Supabase

## Paso 1: Accede a tu Dashboard

1. Ve a **https://supabase.com/dashboard**
2. Login con tu cuenta
3. Selecciona tu proyecto: **`spbkmtvpvfdhnofqkndb`**

## Paso 2: Encuentra la Service Role Key

1. En el menú izquierdo, ve a **Settings** (engranaje)
2. Click en **API** (en el submenu)
3. Verás dos secciones:
   - **Project API keys** (arriba)
   - **Service Role Key** (abajo)

```
┌─────────────────────────────────────────┐
│  API Key (Anon Key)                     │
│  sb_publishable_OeSg1lhB...             │
│                                         │
│  Service Role Key (COPIA ESTO)          │
│  sb_secret_xxxxxxxxxxxxxxxxx            │
│                                         │
│  JWT Secret                             │
│  xxxxxxxxxxxxxxxxxxxxxxxx               │
└─────────────────────────────────────────┘
```

## Paso 3: Copia el Service Role Key

- Haz click en el icono de copiar (📋) junto a **Service Role Key**
- Este es el valor que necesitas para `SUPABASE_SERVICE_ROLE_KEY`

## Paso 4: Actualiza tu .env.local (LOCAL)

```bash
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxxxxxxxxxxxxxx
```

## Paso 5: Luego actualiza Vercel

Una vez que tengas el Service Role Key:
1. Ve a **https://vercel.com/dashboard**
2. Selecciona el proyecto **VERCEL-SUPABASE**
3. **Settings** → **Environment Variables**
4. Añade:
   ```
   SUPABASE_SERVICE_ROLE_KEY = [Tu Service Role Key]
   ```

---

## ⚠️ IMPORTANTE - Problema RLS Policies

**Parece que hay un problema en las RLS policies de tu Supabase:**

```
Error: infinite recursion detected in policy for relation "usuarios"
```

### Solución:

1. Ve a **SQL Editor** en tu Supabase Dashboard
2. Ejecuta esto para desactivar RLS temporalmente:

```sql
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
```

3. Verifica que funcione

Si necesitas RLS (recomendado para producción):
1. Ve a **Authentication** → **Policies**
2. Revisa la tabla `usuarios`
3. Elimina o corrige la política que causa recursión

---

**Una vez que proporciones el Service Role Key, Vercel estará completamente configurado. ¿Lo tienes a mano?**

