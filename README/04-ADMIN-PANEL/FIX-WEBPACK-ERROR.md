/**
 * ARCHIVO: README/04-ADMIN-PANEL/FIX-WEBPACK-ERROR.md
 * 
 * SOLUCIÓN: Error "Cannot read properties of undefined (reading 'call')" 
 *           en página /admin/init-database
 */

## 🐛 Error Encontrado

### Error Completo
```
Runtime TypeError: Cannot read properties of undefined (reading 'call')

at __webpack_exec__ (.next/server/app/admin/init-database/page.js:532:39)
...

Next.js version: 15.5.5 (Webpack)
```

### Causa
El problema ocurría porque:

1. La página `/admin/init-database/page.tsx` estaba marcada como `'use client'` (componente cliente)
2. Pero importaba directamente funciones de Firebase: `initializeDatabase()`, `getDatabaseStats()`, `wipeDatabase()`
3. Estas funciones son de servidor (usan Firebase Admin SDK/Firestore)
4. Webpack intentaba compilarlas para ejecutarse en el navegador
5. Esto causaba que las dependencias de Node.js/Firebase no estuvieran disponibles
6. Resultado: Error al intentar acceder a funciones undefined

### Problema Adicional
El proyecto estaba configurado con `output: 'export'` en `next.config.mjs`, lo que genera un sitio estático sin capacidad de API routes dinámicos.

---

## ✅ Solución Implementada

### Paso 1: Cambiar Configuración de Next.js
**Archivo:** `next.config.mjs`

```diff
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
- output: 'export',  // ❌ Static export - no permite API routes
+ // output: 'export',  // ✅ Comentado para permitir API routes dinámicos
}
```

**Por qué:** El `output: 'export'` fuerza a Next.js a generar un sitio completamente estático sin capacidad de servidor. Necesitamos comentarlo para permitir API routes dinámicos.

### Paso 2: Crear API Routes (Server-Side)

#### 2a. `/app/api/admin/init-database/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/firebase-init'

export const dynamic = 'force-dynamic'  // ⚠️ Importante

export async function POST(request: NextRequest) {
  // Verificar autenticación
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: '...' }, { status: 401 })

  // Ejecutar inicialización en el SERVIDOR (no en cliente)
  const result = await initializeDatabase()
  return NextResponse.json(result, { status: 200 })
}
```

#### 2b. `/app/api/admin/stats/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getDatabaseStats } from '@/lib/firebase-init'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const stats = await getDatabaseStats()
  return NextResponse.json(stats, { status: 200 })
}
```

#### 2c. `/app/api/admin/wipe/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { wipeDatabase } from '@/lib/firebase-init'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Verificar confirmación
  const body = await request.json()
  if (body.confirm !== true) {
    return NextResponse.json({ error: 'Confirmación requerida' }, { status: 400 })
  }

  await wipeDatabase()
  return NextResponse.json({ message: 'Base de datos limpiada' }, { status: 200 })
}
```

### Paso 3: Actualizar Página Admin (Client-Side)

**Archivo:** `app/admin/init-database/page.tsx`

**ANTES:**
```typescript
'use client'
import { initializeDatabase, wipeDatabase, getDatabaseStats } from '@/lib/firebase-init'

const handleInitialize = async () => {
  const result = await initializeDatabase()  // ❌ Intenta ejecutar en cliente
}
```

**DESPUÉS:**
```typescript
'use client'
// ✅ NO importar funciones de Firebase directamente

const handleInitialize = async () => {
  // ✅ Llamar a API endpoint en lugar de función directa
  const response = await fetch('/api/admin/init-database', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token?.email}`,
    },
  })
  const result = await response.json()
}

const handleCheckStats = async () => {
  // ✅ Obtener estadísticas desde endpoint
  const statsResponse = await fetch('/api/admin/stats')
  const currentStats = await statsResponse.json()
}

const handleWipeDatabase = async () => {
  // ✅ Llamar a endpoint de limpieza
  const response = await fetch('/api/admin/wipe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirm: true }),
  })
}
```

---

## 🔑 Puntos Clave

### Configuración `export const dynamic = 'force-dynamic'`
- **Propósito:** Indicar a Next.js que esta ruta NO es estática, sino dinámica
- **Razón:** Necesitamos ejecutar código en el servidor en tiempo real
- **Obligatorio:** Para cualquier API route que use bases de datos o lógica dinámica

### Arquitectura Cliente-Servidor
```
Cliente (Browser)                  Servidor (Node.js)
┌──────────────────┐              ┌─────────────────────┐
│ Componente React │              │  API Route          │
│ (use client)     │  ──HTTP──>   │  (route.ts)         │
│                  │  <──JSON──   │                     │
│ fetch('/api/...') │             │ Firebase SDK        │
└──────────────────┘             │ (funciona aquí)      │
                                  └─────────────────────┘
```

### Por Qué Funciona Ahora
1. ✅ Las funciones de Firebase se ejecutan EN EL SERVIDOR
2. ✅ El cliente solo hace HTTP requests (que sí funcionan en navegador)
3. ✅ Webpack no necesita compilar código de Firebase para el cliente
4. ✅ No hay conflictos de dependencias

---

## 🧪 Pruebas

### Verificar Compilación
```bash
npm run build
# Debe completar sin errores
```

### Verificar Funcionamiento
1. Ir a http://localhost:3000/admin/init-database
2. Iniciar sesión con credenciales admin
3. Hacer clic en "Inicializar Base de Datos"
4. Debe procesar exitosamente sin errores de Webpack

### Verificar Endpoints
```bash
# Stats
curl http://localhost:3000/api/admin/stats

# Init (con header de autorización)
curl -X POST http://localhost:3000/api/admin/init-database \
  -H "Authorization: Bearer admin@test.com" \
  -H "Content-Type: application/json"
```

---

## 📝 Cambios de Archivos

| Archivo | Cambio | Razón |
|---------|--------|-------|
| `next.config.mjs` | Comentar `output: 'export'` | Permitir API routes dinámicos |
| `app/admin/init-database/page.tsx` | Remover importaciones de firebase-init | Evitar compilación en cliente |
| `app/admin/init-database/page.tsx` | Cambiar a `fetch()` de endpoints | Comunicación cliente-servidor |
| `app/api/admin/init-database/route.ts` | **CREAR** | API endpoint para inicialización |
| `app/api/admin/stats/route.ts` | **CREAR** | API endpoint para estadísticas |
| `app/api/admin/wipe/route.ts` | **CREAR** | API endpoint para limpieza |

---

## ⚠️ Nota Importante

Este fix cambia la arquitectura del proyecto de:
- **Antes:** SPA estática (`output: 'export'`)
- **Después:** Full-stack con servidor Node.js

Esto significa que el proyecto ahora NECESITA un servidor Node.js para ejecutarse, no puede ser un sitio estático puro.

### Ventajas
✅ Puede usar API routes dinámicas  
✅ Puede acceder a Firebase desde servidor  
✅ Mejor seguridad (credenciales no en cliente)  
✅ Mejor performance (lógica en servidor)  

### Desventajas
❌ No puede ser deployado como sitio estático  
❌ Necesita un servidor corriendo (Vercel, AWS Lambda, etc.)  
❌ Más costos de hosting (aunque Vercel es gratis para usar)  

---

## 🚀 Deployment

Para deployar este proyecto:

1. **Vercel (Recomendado - Gratis)**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Docker/Node.js**
   ```bash
   npm run build
   npm run start
   ```

3. **AWS/Google Cloud/Azure**
   - Usar Next.js deployment guides
   - Configurar variables de entorno (.env.local)

---

**Fecha de Fix:** Octubre 18, 2025  
**Versión Next.js:** 15.5.5  
**Versión Node.js:** 18+
