# Sistema de Agendamiento — Resumen de cambios y despliegue

Este repositorio contiene la aplicación "Sistema de Gestión Médica" (Next.js + React) y la configuración de CI/CD para desplegar en Firebase Hosting.

## Cambios recientes (2025-10-16)
- CalendarView:
  - Soporta selección múltiple de semanas para copiar la estructura semanal (modal "COPIAR").
  - Nuevo flujo para "Eliminación de módulos" con la misma interfaz: selección múltiple de semanas y confirmación. Antes de eliminar se muestra un preview con los módulos que serían excluidos.
  - Integración con `ConfirmModal` para confirmaciones finales; los módulos que tienen citas asociadas se excluyen automáticamente y se muestran en el preview.
  - UI: indica visualmente las semanas seleccionadas en el mini-calendario y muestra la etiqueta "Esta semana" en la parte inferior con tamaño reducido.
- CI/CD (GitHub Actions):
  - Añadido workflow para construir y desplegar a Firebase Hosting (`.github/workflows/deploy-firebase.yml`).
  - El workflow soporta dos métodos de autenticación:
    1. `FIREBASE_SERVICE_ACCOUNT` (recomendado): JSON de cuenta de servicio con permisos de Hosting.
    2. `FIREBASE_TOKEN` (fallback rápido): token obtenido con `firebase login:ci`.
  - El workflow compila con `next build` y prepara salida estática (si existe) copiando `.next/output/export` → `out/` para cumplir con `firebase.json` (public: out).
- Documentación: agregado este `README.md`.

## Cómo desarrollar localmente
Requisitos:
- Node.js 18+ (recomendado usar la versión que coincida con la del runner, aunque el proyecto funciona con Node 18 en CI).
- npm

Comandos útiles:

```bash
# instalar dependencias
npm ci

# modo desarrollo
npm run dev

# build de producción
npm run build

# iniciar servidor en modo producción (si usas next start, requiere despliegue server)
npm run start
```

El proyecto usa Next.js 15 y Tailwind. Revisa `package.json` para scripts y dependencias.

## Deploy actual (estado)
- Deploy exitoso realizado vía GitHub Actions usando `FIREBASE_TOKEN` en Secrets.
- URL pública: https://agendacecosamlautaro.web.app

Advertencias detectadas en CI:
- firebase-tools mostró un warning deprecatorio sobre `--token`; recomiendan usar credenciales de cuenta de servicio.
- Durante `npm ci` hubo advertencias de engine: varios paquetes de Firebase indican Node >= 20 en sus engines. Con Node 18 el build se completó correctamente, pero considera actualizar a Node 20 si planeas mantener dependencias actualizadas.

## Recomendación: migrar a Service Account (recomendado)
Usar una cuenta de servicio es más seguro y estable a largo plazo (no caduca como un token). Pasos sugeridos:

1. En Google Cloud Console / Firebase Console crea una cuenta de servicio con permiso de `Firebase Hosting Admin` o rol equivalente (o selecciona el rol `Firebase Admin` que incluya hosting).
2. Genera y descarga la clave JSON (service account key).
3. Ve a tu repositorio en GitHub → Settings → Secrets and variables → Actions → New repository secret.
   - Nombre: `FIREBASE_SERVICE_ACCOUNT`
   - Valor: pega el contenido completo del JSON (la acción en el workflow lo usará).
4. Asegúrate de que `.github/workflows/deploy-firebase.yml` esté configurado para usar `FIREBASE_SERVICE_ACCOUNT` cuando esté presente (el workflow incluido ya intenta usarla y cae al fallback `FIREBASE_TOKEN` si no existe).
5. Haz push y verifica el run; el deploy debería autenticarse usando la cuenta de servicio.

Consejos de seguridad:
- No subas la clave JSON al repositorio.
- Restringe la cuenta de servicio a solo los permisos necesarios.

## Notas adicionales y siguientes pasos posibles
- Podemos mejorar el workflow para forzar el uso de `FIREBASE_SERVICE_ACCOUNT` en ramas protegidas o en `main`, y permitir `FIREBASE_TOKEN` solo para pruebas en ramas no protegidas.
- Añadir tests e2e para verificar las funcionalidades claves del calendario (copiar semanas, eliminar semanas con preview).
- Revisar dependencias que piden Node >= 20 y planear actualización a Node 20 si corresponde.

Si quieres, implemento la guía paso a paso para crear la Service Account y añadir el secret en GitHub, o actualizo el workflow para forzar su uso en `main`.

## Profile view — Arquitectura migrada a React/Next (2025-10-18)

La sección de "Perfil" ha sido **migrada completamente a React/Next.js**. La implementación anterior en Vue (MainApp.vue) ha sido deshabilitada.

### Arquitectura actual

**Stack principal**: React + Next.js App Router (el proyecto base es Next.js).

**Componentes clave**:
- `app/profile/[id]/page.tsx` — Server Component que obtiene datos de `DEMO_DATA` y renderiza `ProfilePageClient`.
- `app/profile/[id]/ProfilePageClient.tsx` — Client Component wrapper que carga `ProfileView` con `dynamic(..., { ssr: false })` para evitar SSR mismatch.
- `components/ProfileView.tsx` — UI principal del perfil (hero, stats, editor, calendario). Usa helpers de validación y formateo.
- `components/ProfileCalendar.tsx` — Calendario interactivo FullCalendar (client-only) que muestra citas y módulos.
- `components/ProfilePanel.tsx` — Wrapper usado en la SPA React (`MainApp.tsx`) para montar el perfil internamente.
- `lib/profileHelpers.ts` — Utilidades puras (parse/format/validate RUN, fechas, horas).
- `app/api/profile/route.ts` — API REST (GET/PUT) para leer y actualizar perfil (en memoria, DEMO_DATA).

**Flujo de navegación**:
- Desde el menú (Vue o React), al hacer clic en "Perfil" se navega a `/profile/:id` (ruta Next.js).
- La página renderiza el perfil del usuario con opción de editar y guardar (PUT a `/api/profile`).
- Si PUT falla, el perfil se guarda en localStorage como fallback.

**Estado de la migración**:
- ✅ Implementación React completa y funcional.
- ✅ Vista antigua en `MainApp.vue` deshabilitada (comentada).
- ✅ Duplicado en `MainApp.tsx` eliminado (solo queda `ProfilePanel`).
- ✅ API documentada con JSDoc (contrato GET/PUT).
- ⏳ Pendiente: tests unitarios para helpers y end-to-end para la API.

### Cómo probar localmente

```bash
# iniciar dev server
npm run dev

# abrir en navegador
# http://localhost:3000/profile/1
```

### Pruebas de API (curl)

```bash
# GET perfil usuario id=1
curl -s "http://127.0.0.1:3000/api/profile?id=1" | jq

# PUT actualizar perfil
curl -s -X PUT -H 'content-type: application/json' \
  -d '{"id":1,"nombre":"Nuevo Nombre","email":"nuevo@example.com"}' \
  "http://127.0.0.1:3000/api/profile" | jq
```

### Script E2E automatizado

Ejecuta todas las pruebas de la API automáticamente:

```bash
# Asegúrate de que el servidor dev esté corriendo
npm run dev

# En otra terminal, ejecuta el script de pruebas
./scripts/test-profile-api.sh

# O especifica un puerto diferente
./scripts/test-profile-api.sh 3002
```

El script prueba:
- ✅ GET de perfil existente
- ✅ PUT para actualizar perfil
- ✅ Verificación de persistencia
- ✅ Validación de errores (400 cuando falta id)
- ✅ Renderizado HTML de `/profile/[id]`

### Rollback plan

Si necesitas revertir a la vista Vue antigua:
1. Ve a `components/MainApp.vue` línea ~1318.
2. Descomenta el bloque `<div v-if="currentView === 'profile'" class="profile-view">`.
3. Ajusta el enlace del menú para establecer `currentView = 'profile'` en lugar de navegar a `/profile/:id`.

### Próximos pasos recomendados

1. **Tests**: Agregar tests unitarios para `validateProfile` y otros helpers en `lib/profileHelpers.ts`.
2. **E2E**: Probar el flujo completo (login → menú → perfil → editar → guardar → verificar API).
3. **Producción**: Reemplazar `DEMO_DATA` por base de datos real (Firestore, Postgres, etc.).
4. **Monitoreo**: Añadir logging/telemetría (Sentry, Datadog) para errores en cliente/servidor.

---

## Profile view (legacy — referencia histórica)

<details>
<summary>Implementación anterior (Vue, deshabilitada)</summary>

La sección de "Perfil" estaba implementada como una mezcla de Server Components (página que carga datos desde `DEMO_DATA`) y Client Components
para las partes que requieren DOM/tiempo real (por ejemplo el calendario FullCalendar). Detalles importantes:

- `app/profile/[id]/page.tsx` es la página (Server) que obtiene datos y renderiza un wrapper cliente `ProfilePageClient`.
- `app/profile/[id]/ProfilePageClient.tsx` usa `dynamic(..., { ssr: false })` para cargar `ProfileView` en cliente y evitar hydration mismatch.
- `components/ProfileView.tsx` contiene la UI principal (hero, próximas citas, editor) y llama a `lib/profileHelpers.ts` para formateo/validación.
- `lib/profileHelpers.ts` contiene utilidades (parse/format/validate) y un `validateProfile` usado por el formulario.

Nota de desarrollo: en modo `next dev` verás avisos en el overlay y en el log sobre "bail out to CSR" o errores de devtools. Eso es normal
cuando partes de la página deben montarse en cliente; si la página se carga y el cliente monta correctamente la parte dinámica no es un fallo funcional.

Para probar rápidamente:

```bash
# iniciar dev server
npm run dev

# abrir en navegador: http://localhost:3000/profile/1
```

Para pruebas automáticas en la terminal (ejemplo):

```bash
curl -s -D - "http://127.0.0.1:3000/api/profile?id=1" | sed -n '1,120p'    # GET
curl -s -X PUT -H 'content-type: application/json' -d '{"id":1,"nombre":"Nuevo Nombre"}' "http://127.0.0.1:3000/api/profile" | jq
```

</details>

