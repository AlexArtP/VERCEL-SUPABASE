# 🎯 VERIFICACIÓN: Directorio de Profesionales

## Estado Actual

✅ **Sistema Lista**: El código ya está preparado para leer de la tabla `usuarios`

---

## 📊 Dónde se muestran los profesionales:

### 1. **CalendarView.tsx** (Calendario Principal)
- Hook: `useSupabaseProfesionales()`
- Tabla: `public.usuarios`
- Filtro: `profesional = true`
- Muestra: Selector "Profesionales registrados"

### 2. **PacientesPanel.tsx** (Filtro de Tratantes)
- Hook: `useSupabaseProfesionales()`
- Filtro por estamento:
  - **Psicólogos**: `estamento.startsWith('psicolog')`
  - **Psiquiatras**: `estamento.includes('psiquiatr')`
  - **Asistentes Sociales**: `estamento === 'asistente social'`

### 3. **Endpoint API**
- GET `/api/profesionales`
- Tabla: `public.usuarios`
- Filtro: `profesional = true`
- Orden: Por nombre (A-Z)

---

## ✅ Lo que necesitas hacer:

### Paso 1: Ejecutar Script 006 (Crear tabla)
En Supabase Studio SQL Editor:
```sql
-- Copia y ejecuta: migrations/006_create_usuarios_table.sql
```

### Paso 2: Ejecutar Script 007 (Insertar usuarios)
```sql
-- Copia y ejecuta: migrations/007_insert_demo_usuarios.sql
```

### Paso 3: Verificar (Ejecutar VERIFY_usuarios.sql)
```sql
-- Copia y ejecuta: migrations/VERIFY_usuarios.sql
-- Verifica que:
-- ✓ Tabla existe
-- ✓ 5 usuarios creados
-- ✓ 5 usuarios con profesional=true
-- ✓ Estamentos correctos
```

### Paso 4: Iniciar la app
```bash
npm run dev
```

### Paso 5: Verificar en la UI
- **Calendario**: Debe mostrar selector con 5 profesionales
- **Registro de Pacientes**: Debe mostrar Tratantes filtrados por estamento

---

## 📋 Los 5 profesionales que aparecerán:

| Nombre | Profesión | Estamento | Email |
|--------|-----------|-----------|-------|
| Juan García | Psicologo(a) | Psicólogo | psicolo.juan@clinica.cl |
| María Silva | Psiquiatra Infanto Juvenil | Psiquiatra | psiquiatra.maria@clinica.cl |
| Carlos Mendez | Médico general | (ninguno) | medico.carlos@clinica.cl |
| Rosa Fernández | Asistente social | Asistente Social | trabajosocial.rosa@clinica.cl |
| Ana Ramírez | Pediatra | (ninguno) | pediatra.ana@clinica.cl |

---

## 🔍 Cómo verificar si funciona:

1. En el navegador, abre: **http://localhost:3000**
2. Ve a la **sección de Profesionales** (según tu UI)
3. Deberías ver una lista con **5 profesionales**
4. Al registrar un paciente, el selector "Tratantes" debe mostrar los 3 relevantes:
   - Juan García (Psicólogo)
   - María Silva (Psiquiatra)
   - Rosa Fernández (Asistente Social)

---

## 📌 Resumen de Configuración

| Componente | Tabla | Fuente | Estado |
|-----------|-------|--------|--------|
| CalendarView | usuarios | Supabase local | ✅ Configurado |
| PacientesPanel | usuarios | Supabase local | ✅ Configurado |
| API profesionales | usuarios | Supabase local | ✅ Configurado |
| Hook useSupabase | usuarios | Supabase local | ✅ Listo |

**→ Todo apunta a `public.usuarios` en localhost:54321 ✅**

---

## ⚠️ Si NO ves los profesionales:

1. **Verifica que ejecutaste los scripts SQL** en Supabase Studio
2. **Abre DevTools** (F12) y revisa Console por errores
3. **Ejecuta VERIFY_usuarios.sql** para confirmar que la tabla existe y tiene datos
4. **Reinicia el servidor** (npm run dev)
5. **Limpia caché del navegador** (Ctrl+Shift+Delete)

---

✅ **Confirmación**: Todo está listo en código. Solo necesitas ejecutar los 3 scripts SQL en Supabase Studio.
