# 🚀 Guía de Deploy a Vercel

## Paso 1: Obtén tus Credenciales de Supabase

Ve a **https://supabase.com/dashboard** y:

1. Selecciona tu proyecto: `spbkmtvpvfdhnofqkndb`
2. Navega a **Settings** → **API**
3. Copia las siguientes credenciales:

### 📋 Variables Necesarias

```
NEXT_PUBLIC_SUPABASE_URL=https://spbkmtvpvfdhnofqkndb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_OeSg1lhBdAMnrgx8AI5TGQ_Aum0ciRH
SUPABASE_SERVICE_ROLE_KEY=[OBTÉN ESTO DE TU DASHBOARD]
```

**⚠️ IMPORTANTE:** 
- `NEXT_PUBLIC_*` = Públicas (safe para frontend)
- `SUPABASE_SERVICE_ROLE_KEY` = Privada (SOLO para servidor, NUNCA expongas)

---

## Paso 2: Deploy a Vercel

1. Ve a **https://vercel.com/dashboard**
2. Click en **"Add New..."** → **"Project"**
3. Importa tu repositorio: **`AlexArtP/VERCEL-SUPABASE`**
4. Vercel detectará que es Next.js automáticamente

### Configurar Environment Variables en Vercel:

En la pantalla de configuración del proyecto:

```
NEXT_PUBLIC_SUPABASE_URL = https://spbkmtvpvfdhnofqkndb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_OeSg1lhBdAMnrgx8AI5TGQ_Aum0ciRH
SUPABASE_SERVICE_ROLE_KEY = [Tu Service Role Key aquí]
```

5. Click **"Deploy"**

---

## Paso 3: Verifica la Conexión

Después de que Vercel compile (toma ~3-5 minutos):

1. Vercel te dará una URL tipo: `https://vercel-supabase-xxxxx.vercel.app`
2. Haz login con una cuenta de tu Supabase
3. Verifica que carguen tus datos de citas, pacientes, etc.

---

## 🔍 Troubleshooting

### Error: "Environment Variable not found"
- Verifica que las variables están correctas en Vercel Dashboard
- Re-deploy después de añadir variables (puede que necesite refresh)

### Error: "SUPABASE_SERVICE_ROLE_KEY is undefined"
- Confirma que está en Vercel Environment Variables
- Asegúrate que NO tenga espacios en blanco

### Error: "Connection refused"
- La URL de Supabase está mal o el proyecto está en pausa
- Verifica en Supabase Dashboard que tu proyecto esté activo

---

## 📌 Próximos Pasos

Después del primer deploy:
- [ ] Probar login en la URL de Vercel
- [ ] Crear una cita de prueba
- [ ] Verificar notificaciones
- [ ] Celebrar 🎉

