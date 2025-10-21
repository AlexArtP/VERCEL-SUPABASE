# Changelog

## 2025-10-16 — Mejoras de calendario: copia/elim. semanal y comprobaciones

Se han agregado varias funcionalidades al módulo de calendario para mejorar la gestión de módulos por semana y el flujo de eliminación segura.

### Nuevas funciones y cambios

- Copia de estructura semanal (multi-selección):
  - Modal "Copiar semana" con mini-calendario que permite seleccionar múltiples semanas destino (cada selección se identifica por su lunes en formato ISO yyyy-mm-dd).
  - Visualización clara de semanas seleccionadas (resaltadas) y una mini-UI que muestra la semana actual.
  - Botón "COPIAR" que aplica la función `copyWeekStructure` desde la semana origen hacia todas las semanas destino seleccionadas.
  - Evita copiar al domingo; evita duplicados exactos de módulos en destino.

- Eliminación masiva por semanas (multi-selección) con exclusiones:
  - Nuevo botón "Eliminar semana" en el header que abre un modal con mini-calendario para seleccionar múltiples semanas destino.
  - Al ejecutar la acción, se recopilan todos los módulos del profesional en las semanas seleccionadas.
  - Exclusión automática: los módulos que tienen citas asociadas se excluyen de la eliminación para evitar pérdidas de datos.
  - Preview detallado: antes de confirmar, se abre un modal con un resumen que muestra:
    - Cuántos módulos serán eliminados.
    - Lista de módulos excluidos (tipo, fecha y hora) — esto permite revisar qué no se eliminará y por qué.
  - Confirmación integrada: el modal utiliza el `ConfirmModal` interno para confirmar la eliminación final de los módulos seleccionados que no tienen citas.

- UX / visual:
  - El mini-calendario muestra la semana actual con un distintivo "Esta semana".
  - Texto y tamaños ajustados: la etiqueta "Seleccionada" fue ligeramente reducida y el badge "Esta semana" se posicionó en la parte inferior para mejor legibilidad.

### Archivos modificados relevantes

- `components/CalendarView.tsx` — mayor parte de la implementación (copiar múltiples semanas, eliminar múltiples semanas, preview de exclusiones, UI/UX tweaks).
- `lib/demoData.ts` — pequeña actualización de tipos/datos usados internamente.
- `app/page.tsx` — cambios menores relacionados con persistencia de sesión (token) realizados en iteraciones anteriores.

### Cómo probar rápidamente

1. `npm run dev` y abrir la app en `http://localhost:3001` (si 3000 está ocupado Next usará 3001).
2. Seleccionar un profesional.
3. Probar "Copiar semana": abrir el modal, seleccionar varias semanas (las seleccionadas se resaltan), pulsar "COPIAR" y verificar que los módulos fueron creados en las semanas destino.
4. Probar "Eliminar semana": abrir el modal, seleccionar semanas, pulsar "ELIMINAR". Se mostrará un preview con los módulos excluidos (si los hay) y luego el `ConfirmModal` para confirmar la eliminación.

Si quieres que el changelog detalle también los IDs de commits, o que se agregue una entrada con el PR, lo puedo añadir.
