## Resumen rápido

Breve guía para agentes AI que trabajan en este repositorio (Agenda_Vercel).
Apunta a los archivos y patrones que son necesarios para hacer cambios seguros y productivos.

## Arquitectura y flujos clave
- Framework: Next.js (v15), TypeScript + React (archivos en `app/` y `components/`).
- Autenticación: backend + Firebase. El frontend llama a `/api/auth/firebase-login` y además intenta iniciar sesión en Firebase cliente (`lib/firebaseConfig`) para que `request.auth` funcione en reglas de Firestore (ver `app/page.tsx`).
- Estado/global: `AuthProvider` y `DataProvider` envuelven la app en `app/layout.tsx`.
- Datos persistentes: Firestore. Colecciones observadas: `users`, `profesionales`, `pacientes`, `citas`, `modulos`, `plantillas`, `config` (documento `initialized`) — ver `lib/firebase-init.ts`.

## Convenciones importantes (proyect-specific)
- Demostraciones y carga inicial de datos: la importación de demo está **opt-in** mediante la variable de entorno `ENABLE_DEMO_DATA='true'`. No ejecutar o modificar `lib/firebase-init.ts` sin respetar esta bandera.
- Token cliente: la UI usa la clave de localStorage `sistema_auth_token` y tiene compatibilidad con dos formatos (token propio y token de Firebase). Ver `app/page.tsx` para los flujos de login/logout y el fallback a `DEMO_DATA`.
- Lazy-loading: ciertos componentes grandes (p. ej. `RegistrationModalWrapper`) se cargan con `next/dynamic({ ssr: false })`; respeta SSR/SSG/cliente al mover código.
- Mezcla de dependencias: el proyecto contiene paquetes tanto para React/TSX como referencias a `vue` en package.json; para cambios de UI prefiera los componentes en `components/` (TSX/TSXX/ Vue coexistente) y siga el patrón existente (por ejemplo `MainApp` y `ProfileView`).

## Comandos y workflows de desarrollo
- Desarrollo: `npm run dev` (Next dev). Hay una tarea de VS Code disponible: "Run Next.js dev server".
- Build/Producción: `npm run build` y `npm start`.
- Lint: `npm run lint` (eslint).
- Tests: Playwright está en devDependencies (`@playwright/test`); ejecutar los tests de E2E requiere configurar Playwright antes de correr.

## Puntos sensibles y reglas de seguridad a respetar
- `lib/firebase-init.ts` está diseñado para ejecutarse una vez y marca la BD con un doc `config/initialized`. No reescribir o forzar importaciones de demo sin `ENABLE_DEMO_DATA`.
- `next.config.mjs` contiene ajustes para Windows (deshabilita cache webpack y establece `outputFileTracingRoot`) — evita cambiar esa sección sin validar en Windows.
- `next.config.mjs` también silencia errores de TypeScript y ESLint durante build (`ignoreDuringBuilds`, `ignoreBuildErrors`); no asumir que la ausencia de errores locales implica seguridad en producción.

## Dónde buscar ejemplos concretos
- Login / token: `app/page.tsx` (manejo de `sistema_auth_token`, llamadas a `/api/auth/firebase-login`).
- Inicialización Firestore y demo data: `lib/firebase-init.ts` (funciones: `initializeDatabase`, `markAsInitialized`, `IMPORT opt-in`).
- Configuración Next/Windows quirks: `next.config.mjs`.
- Providers globales: `app/layout.tsx` (AuthProvider, DataProvider).

## Cómo proponer cambios (para agentes)
- Prefiere cambios incrementales y crea PRs pequeños. En la descripción del PR referencia los archivos clave afectados (ej: `lib/firebase-init.ts`, `app/layout.tsx`).
- Si el cambio toca inicialización de BD o scripts que alteran datos, añade una nota que confirme que `ENABLE_DEMO_DATA` no se activará en producción.

## Ejemplos rápidos que puedes citar
- "Para evitar sobrescribir datos reales, `lib/firebase-init.ts` sólo importa `DEMO_DATA` cuando `process.env.ENABLE_DEMO_DATA==='true'`."
- "El login cliente guarda/lee `sistema_auth_token` en localStorage; ver `app/page.tsx` para el formato esperado."

Si algo no está claro o quieres que amplíe alguna sección (por ejemplo, añadir ejemplos de PRs o plantillas de tests), dímelo y la ajusto.
