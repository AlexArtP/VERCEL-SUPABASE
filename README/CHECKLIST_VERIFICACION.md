# ✅ Checklist de Verificación

## 🔄 Paso 1: Desplegar las reglas nuevas

- [ ] Abre [Firebase Console](https://console.firebase.google.com)
- [ ] Selecciona tu proyecto: `agendacecosam`
- [ ] Ve a **Firestore Database** → **Reglas**
- [ ] Haz click en **Editar reglas**
- [ ] Copia todo el contenido de `firestore.rules` de este repositorio
- [ ] Pégalo en el editor de Firebase Console
- [ ] Haz click en **Publicar**
- [ ] Espera a que aparezca el ✅ verde

**Alternativa**: Usa Firebase CLI:
```bash
cd /workspaces/sistema-agendamiento-5-v2
firebase deploy --only firestore:rules
```

---

## 🧪 Paso 2: Probar que todo funciona

### 2.1 Abrir la app
- [ ] Ve a http://localhost:3000
- [ ] Abre la consola (F12 → Console)
- [ ] **Debería estar LIMPIA sin errores rojos**

### 2.2 Probar modal de autorización
- [ ] Ve a **Configuraciones**
- [ ] Si eres admin, debería aparecer el tab **"👥 Autorizar Registros"**
- [ ] Haz click en **"Abrir Panel de Autorización"**
- [ ] ✅ El modal debería **abrirse sin errores**
- [ ] La consola debería **seguir limpia**

### 2.3 Probar que los listeners funcionan
- [ ] En la consola, ejecuta:
```javascript
// Esto debería funcionar sin errores
// Si ves "permission-denied", las reglas aún no se han desplegado
// Espera 5-10 minutos y recarga la página
```
- [ ] Crea un nuevo módulo o cita
- [ ] Debería **sincronizarse en tiempo real** sin errores

---

## 🐛 Paso 3: Debug si algo no funciona

### Si ves: `permission-denied`

**Causa más probable**: Las nuevas reglas aún no se han desplegado en Firebase

**Solución**:
1. Espera **5-10 minutos** desde que hiciste click en "Publicar"
2. Recarga la página (Ctrl+F5 para forzar cache limpio)
3. Si aún no funciona, ve a Firebase Console y verifica que las reglas tengan el cambio

### Si ves: El tab "Autorizar Registros" no aparece

**Causa más probable**: El usuario actual no tiene rol de admin

**Solución**:
1. En la consola, ejecuta:
```javascript
// Ver qué usuario está logueado y qué rol tiene
console.log('Usuario actual:', auth.currentUser)
// Esto te mostrará el usuario actual
```

2. En Firebase Console → Authentication → Users
3. Busca tu usuario
4. Verifica que tenga el custom claim `isAdmin: true`

### Si ves: La app sigue lenta

**Causas posibles**:
1. Las reglas aún no están sincronizadas (espera 10 minutos)
2. Hay demasiados listeners activos (revisa la Network tab en DevTools)
3. El servidor Next.js necesita ser reiniciado:
```bash
# Presiona Ctrl+C en la terminal donde corre npm run dev
# Luego ejecuta:
npm run dev
```

---

## 📈 Paso 4: Verificar que el rendimiento mejoró

### Antes (❌):
```
Console → Errors → 
  FirebaseError: [code=permission-denied]: Missing or insufficient permissions.
  (error repetido cada segundo)

DevTools → Performance →
  CPU: 30%+
  RAM: 12%+
```

### Después (✅):
```
Console → 
  (LIMPIA, sin errores rojos)

DevTools → Performance →
  CPU: 5-10% (cuando no estás interactuando)
  RAM: 8-10%
```

- [ ] Abre DevTools (F12)
- [ ] Ve a **Performance** tab
- [ ] Graba 10 segundos (click en el círculo rojo)
- [ ] Detén la grabación
- [ ] **Debería ver CPU baja** en las secciones de Scripting

---

## 🎉 Paso 5: Celebrar

Si todo está ✅, entonces:

- [ ] El error `permission-denied` desapareció
- [ ] Los modales abren sin problemas
- [ ] La app se siente más rápida
- [ ] La consola está limpia
- [ ] Los listeners funcionan en tiempo real

🎊 **¡Listo! El problema está resuelto.**

---

## 📞 Contacto si hay problemas

Si algo no funciona como se describe aquí:

1. **Verifica que las reglas se desplegaron**:
   - Abre Firebase Console → Firestore → Reglas
   - Busca el comentario `// IMPORTANTE: Las queries con where profesionalId son permitidas`
   - Si no lo ves, las reglas aún no se han actualizado (espera más)

2. **Revisa la documentación completa**:
   - Lee `DIAGNOSTICO_LENTITUD_Y_ERRORES.md`
   - Lee `RESUMEN_SOLUCION_FIRESTORE.md`

3. **Ejecuta comandos de debug**:
```bash
# Ver logs de Firestore en tiempo real
firebase functions:log

# Ver el estado actual de Firestore
firebase firestore:describe

# Redeploy completo si algo falla
firebase deploy --only firestore:rules
```

---

## 📊 Resumen de cambios

| Archivo | Cambio | Razón |
|---------|--------|-------|
| `firestore.rules` | Actualizar comentarios y agregar subcoleción | Hacer explícito que las queries con `where` están permitidas |
| `DIAGNOSTICO_LENTITUD_Y_ERRORES.md` | Nuevo | Documentar causa raíz y solución |
| `RESUMEN_SOLUCION_FIRESTORE.md` | Nuevo | Resumen ejecutivo para entender rápido |
| `CHECKLIST_VERIFICACION.md` | Nuevo (este archivo) | Pasos para verificar que todo funciona |

