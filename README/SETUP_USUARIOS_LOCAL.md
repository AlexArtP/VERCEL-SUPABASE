# 📋 Instrucciones para Ejecutar Scripts en Supabase Studio Local

## Estado Actual
✅ Tabla `usuarios` lista en `migrations/006_create_usuarios_table.sql`
✅ 5 usuarios demo listos en `migrations/007_insert_demo_usuarios.sql`

---

## Paso 1: Crear Tabla `usuarios` (si aún no existe)

1. Abre: **http://127.0.0.1:54323** (Supabase Studio)
2. Ve a: **SQL Editor** (panel izquierdo)
3. Copia TODO el contenido de: `migrations/006_create_usuarios_table.sql`
4. Pega en el editor de Supabase Studio
5. Ejecuta: `Ctrl+Enter` o botón "Run"
6. Verifica: Deberías ver el mensaje ✅ en la consola

---

## Paso 2: Insertar 5 Usuarios Demo

1. En el mismo SQL Editor, copia TODO de: `migrations/007_insert_demo_usuarios.sql`
2. Pega debajo del script anterior (o en nueva pestaña)
3. Ejecuta: `Ctrl+Enter`
4. Verifica: Deberías ver una tabla con 5 usuarios listados

---

## Usuarios Demo Creados

| Email | Nombre | Profesión | Estamento | Rol |
|-------|--------|-----------|-----------|-----|
| psicolo.juan@clinica.cl | Juan García | Psicologo(a) | Psicólogo | profesional |
| psiquiatra.maria@clinica.cl | María Silva | Psiquiatra Infanto Juvenil | Psiquiatra | profesional |
| medico.carlos@clinica.cl | Carlos Mendez | Médico general | (ninguno) | profesional |
| trabajosocial.rosa@clinica.cl | Rosa Fernández | Asistente social | Asistente Social | profesional |
| pediatra.ana@clinica.cl | Ana Ramírez | Pediatra | (ninguno) | profesional |

---

## Verificación Post-Inserción

En Supabase Studio, ejecuta esta query para ver todos los usuarios:

```sql
SELECT 
  userid, 
  email, 
  nombre || ' ' || COALESCE(apellido_paterno, '') as nombre_completo,
  profesion,
  estamento,
  activo,
  estado
FROM public.usuarios
ORDER BY fechacreacion DESC;
```

---

## Próximo Paso

Una vez creados los usuarios en local:
1. Ejecuta: `npm run dev` (para que Next.js se conecte a localhost:54321)
2. Navega a `/register` (formulario de registro de pacientes)
3. Verifica que el selector "Tratantes" muestre los 3 profesionales relevantes:
   - **Psicólogos**: Juan García
   - **Psiquiatras**: María Silva
   - **Asistentes Sociales**: Rosa Fernández

---

## Solución de Problemas

**Si no ves los usuarios:**
- ✅ Verifica que Supabase local está corriendo: `supabase status`
- ✅ Comprueba que ejecutaste primero el script 006 (crear tabla)
- ✅ Comprueba que ejecutaste luego el script 007 (insertar usuarios)
- ✅ En Supabase Studio, ve a **Table Editor** → verifica que existe tabla `usuarios`

**Si el filtro de Tratantes no funciona:**
- ✅ Verifica que `PacientesPanel.tsx` tiene la lógica de filtrado por `estamento` y `profesion`
- ✅ Abre DevTools (F12) → Console → busca errores de red

---

¡Listo! Confirma cuando hayas ejecutado ambos scripts en Supabase Studio. 🚀
