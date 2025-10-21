# Migración de Perfil a React/Next.js — Resumen

**Fecha**: 2025-10-18  
**Objetivo**: Migrar la vista de perfil de usuario de Vue a React/Next.js como stack principal del proyecto.

---

## ✅ Tareas Completadas

### 1. Decisión de Stack Principal
- **Decisión**: React + Next.js App Router (proyecto base)
- **Justificación**: Mayor soporte para SSR/SSG, App Router moderno, consistencia con el resto del proyecto.

### 2. Inventario de Código
**Archivos React/Next (mantenidos)**:
- `app/profile/[id]/page.tsx` — Server Component
- `app/profile/[id]/ProfilePageClient.tsx` — Client wrapper
- `components/ProfileView.tsx` — UI principal
- `components/ProfileCalendar.tsx` — Calendario interactivo
- `components/ProfilePanel.tsx` — Wrapper para SPA
- `lib/profileHelpers.ts` — Helpers de validación/formateo
- `app/api/profile/route.ts` — API REST (GET/PUT)

**Archivos Vue (deshabilitados/archivados)**:
- `components/MainApp.vue` — Sección de perfil comentada (línea ~1318)
- `configuraciones.vue` — Vista antigua (mantener por compatibilidad con otras secciones)

### 3. Unificación de Helpers y API
- ✅ Helpers consolidados en `lib/profileHelpers.ts`
  - `validateProfile()` — Valida RUN, email, teléfono
  - `normalizeRun()` — Formatea RUN chileno
  - `formatWorkingHours()` — Formatea horarios
  - `parseLocalDateTime()` — Parser sin timezone issues
- ✅ API documentada con JSDoc en `app/api/profile/route.ts`
  - GET `/api/profile?id={userId}` → Obtiene perfil
  - PUT `/api/profile` → Actualiza perfil (campos permitidos)

### 4. Eliminación de UI Antigua
- ✅ Comentada sección de perfil en `MainApp.vue` (líneas 1318-1414)
- ✅ Eliminado bloque duplicado "Mi Perfil" en `MainApp.tsx` (líneas 319-414)
- ✅ Solo queda activo `ProfilePanel` que usa la nueva implementación React

### 5. Actualización de Navegación
- ✅ Menú Vue ajustado para navegar a `/profile/:id` (window.location.href)
- ✅ Menú React usa `setActiveView("profile")` que monta `ProfilePanel`
- ✅ Ambos flujos apuntan a la nueva implementación

### 6. Client Components Verificados
- ✅ `ProfileView` usa "use client" y dynamic imports
- ✅ `ProfileCalendar` usa dynamic con `ssr: false`
- ✅ `ProfilePageClient` wrapper con "use client"
- ✅ No hay uso incorrecto de `dynamic()` en Server Components

### 7. Pruebas y Validación
- ✅ Build exitoso: `next build` compila sin errores
- ✅ API GET/PUT probada con curl (funcionan correctamente)
- ✅ Script E2E creado: `scripts/test-profile-api.sh`
  - Prueba GET, PUT, persistencia, validaciones y HTML
  - Todas las pruebas pasan ✅

### 8. Build y Chequeos de Calidad
- ✅ `next build` — Compilación exitosa
- ✅ Routes generadas:
  - `/` (Static)
  - `/profile/[id]` (SSG) — IDs: 1, 2, 4
  - `/api/profile` (Dynamic)
- ✅ No se detectaron errores de compilación o tipos

### 9. Documentación y Rollback Plan
- ✅ README actualizado con:
  - Nueva arquitectura de perfil
  - Instrucciones de pruebas locales
  - Scripts E2E documentados
  - Plan de rollback (descomenta MainApp.vue línea 1318)
- ✅ API documentada con JSDoc (contrato completo)

### 10. Integración SPA Interna ✅ **COMPLETADA**
- ✅ `ProfilePanel` integrado en `MainApp.tsx` (línea 307-324)
- ✅ Menú "Mi Perfil" abre la vista internamente (sin cambiar URL)
- ✅ Datos cargados correctamente desde `DEMO_DATA`
- ✅ Script de verificación creado: `scripts/verify-spa-integration.sh`
- ✅ Todas las pruebas de integración pasaron exitosamente

**Flujo de usuario verificado**:
1. Usuario hace login en `/`
2. Clic en botón "Perfil" del menú (icono UserCircle)
3. `activeView` cambia a `"profile"`
4. `ProfilePanel` se monta con datos del usuario actual
5. Vista se muestra sin recargar página (SPA pura)

---

## 📋 Pendiente (para producción)

### 11. Despliegue y Monitoreo
- [ ] Desplegar a staging
- [ ] Pruebas manuales en staging (login → perfil → editar → guardar)
- [ ] Verificar logs de servidor (Next.js)
- [ ] Monitorear errores de cliente (consola del navegador)
- [ ] Desplegar a producción
- [ ] Monitoreo 24-72h (Sentry/Datadog recomendado)

**Próximos pasos técnicos**:
- [ ] Reemplazar `DEMO_DATA` por base de datos real (Firestore/Postgres)
- [ ] Agregar tests unitarios para `validateProfile` (Jest/Vitest)
- [ ] Implementar CI/CD para ejecutar tests automáticamente
- [ ] Añadir manejo de errores con toast/notificaciones UX
- [ ] Implementar loading states en formulario de edición

---

## 🔧 Comandos Útiles

### Desarrollo local
```bash
npm run dev              # Iniciar servidor dev
npm run build            # Build de producción
npm run start            # Servidor producción (requiere build previo)
```

### Pruebas
```bash
# Script E2E automatizado
./scripts/test-profile-api.sh

# Pruebas manuales con curl
curl -s "http://localhost:3000/api/profile?id=1" | jq
curl -s -X PUT -H 'content-type: application/json' \
  -d '{"id":1,"nombre":"Test"}' \
  "http://localhost:3000/api/profile" | jq
```

### Navegación
- Login: `http://localhost:3000/`
- Perfil directo: `http://localhost:3000/profile/1`
- Perfil desde menú: Login → clic en "Perfil"

---

## 🎯 Métricas de Éxito

✅ **Build**: Compilación exitosa sin errores  
✅ **API**: GET/PUT funcionan correctamente  
✅ **Persistencia**: Cambios se reflejan en GET posterior (in-memory)  
✅ **Validación**: Errores 400/404 correctos  
✅ **UI**: Perfil se renderiza correctamente en `/profile/[id]`  
✅ **Navegación**: Menús (Vue y React) apuntan a nueva implementación  
✅ **Duplicados**: Eliminadas implementaciones antiguas  

---

## 📚 Archivos Modificados

- `components/MainApp.vue` — Comentada sección antigua
- `components/MainApp.tsx` — Eliminado bloque duplicado
- `app/api/profile/route.ts` — Documentación JSDoc añadida
- `README.md` — Actualizado con nueva arquitectura
- `scripts/test-profile-api.sh` — Script E2E creado

---

## 🔄 Plan de Rollback

Si necesitas revertir temporalmente a la vista Vue antigua:

```bash
# 1. Editar components/MainApp.vue línea ~1318
# 2. Descomentar el bloque:
#    <div v-if="currentView === 'profile'" class="profile-view">
#      [... contenido completo ...]
#    </div>
#
# 3. Ajustar el enlace del menú para establecer currentView en lugar de navegar:
#    @click.prevent="currentView = 'profile'"
#
# 4. Reiniciar servidor dev
npm run dev
```

**Nota**: la vista antigua NO tiene las mejoras de validación ni la API REST. 
Recomendamos usarla solo como respaldo temporal mientras investigas problemas.

---

## 📝 Notas Técnicas

- **In-memory storage**: La API actualiza `DEMO_DATA` en memoria; se pierde al reiniciar.
- **Fallback localStorage**: Si PUT falla, `ProfileView` guarda en localStorage como backup.
- **SSR vs CSR**: `ProfileView` usa dynamic import con `ssr: false` para evitar errores de hidratación en componentes que dependen del DOM (FullCalendar).
- **Validaciones**: `validateProfile()` valida formato de RUN, email y teléfono antes de enviar PUT.

---

**Última actualización**: 2025-10-18  
**Estado**: ✅ Migración completada — Listo para staging
