# 🧪 Fase 7: E2E Testing con Playwright

## Descripción General

Este documento describe la suite de E2E testing creada con Playwright para validar el flujo completo de autenticación y operaciones de usuario en Agenda_Vercel.

---

## 📁 Estructura de Tests

```
tests/
├── auth.spec.ts          # Test suite principal de autenticación
├── helpers.ts            # Funciones auxiliares reutilizables
└── README.md             # Este archivo
```

---

## 🚀 Ejecución de Tests

### Ejecutar todos los tests
```bash
npm run test:e2e
```

### Ejecutar con UI interactivo
```bash
npm run test:e2e:ui
```

### Ejecutar con debug
```bash
npm run test:e2e:debug
```

### Ver reporte HTML
```bash
npm run test:e2e:report
```

### Ejecutar un test específico
```bash
npx playwright test tests/auth.spec.ts -g "Debería permitir registro"
```

---

## 📋 Test Suite: Authentication Flow

### 1. **REGISTRO** (3 tests)

#### ✅ Debería permitir registro de nuevo usuario
- Navega a `/register`
- Llena formulario con datos válidos
- Verifica que se mostró mensaje de éxito

**Validación:**
- Formulario está visible
- Campos se rellenan correctamente
- Mensaje de éxito aparece

#### ✅ Debería rechazar email duplicado
- Intenta registrar con un email ya existente
- Verifica que se muestra error

**Validación:**
- Error message se muestra
- No se crea usuario duplicado

#### ✅ Debería validar contraseña débil
- Intenta registrar con contraseña muy corta
- Verifica validación

**Validación:**
- Error de validación aparece
- Usuario no se registra

---

### 2. **LOGIN** (2 tests)

#### ✅ Debería permitir login con credenciales correctas
- Registra usuario primero
- Hace logout
- Hace login con las credenciales correctas
- Verifica token en localStorage

**Validación:**
- Token se guarda en localStorage
- Navegación permitida

#### ✅ Debería rechazar credenciales incorrectas
- Intenta login con email/password incorrecto
- Verifica error

**Validación:**
- Error message aparece
- No se genera token

---

### 3. **TOKEN & SESIÓN** (2 tests)

#### ✅ Debería guardar token en localStorage
- Registra usuario
- Verifica que token existe en localStorage
- Verifica que token tiene longitud válida

**Validación:**
- Token existe
- Token tiene formato válido (> 10 caracteres)

#### ✅ Debería limpiar token en logout
- Registra usuario
- Verifica token antes de logout
- Hace logout
- Verifica que token se eliminó

**Validación:**
- Token presente después de registro
- Token ausente después de logout

---

### 4. **DATA PERSISTENCE** (1 test)

#### ✅ Debería persistir usuario en BD después de registro
- Registra usuario
- Hace logout
- Intenta login nuevamente
- Verifica que login es exitoso

**Validación:**
- Usuario persiste en base de datos
- Datos se recuperan correctamente

---

### 5. **UI & NAVIGATION** (2 tests)

#### ✅ Debería mostrar formulario de registro
- Navega a `/register`
- Verifica que campos estén visibles

**Validación:**
- Email input visible
- Password input visible
- Nombre input visible
- Submit button visible

#### ✅ Debería mostrar página de login
- Navega a `/`
- Busca botón de login
- Verifica que formulario se abre

**Validación:**
- Botón de login existe
- Formulario es accesible

---

### 6. **EDGE CASES** (2 tests)

#### ✅ Debería manejar email vacío
- Intenta registrar sin email
- Verifica que se bloquea o muestra error

**Validación:**
- Botón deshabilitado O error message

#### ✅ Debería manejar email inválido
- Intenta registrar con "not-an-email"
- Verifica validación

**Validación:**
- Error de validación aparece

---

## 📚 Funciones Auxiliares (`helpers.ts`)

### `registerUser(page, userData)`
Registra un nuevo usuario completando el formulario de registro.

**Parámetros:**
```typescript
userData: {
  email: string
  password: string
  nombre: string
  apellido_paterno: string
  apellido_materno?: string
  profesion?: string
}
```

### `loginUser(page, email, password)`
Realiza login con email y contraseña.

### `expectUserLoggedIn(page)`
Verifica que hay un token válido en localStorage y lo retorna.

**Retorna:** Token string

### `logout(page)`
Realiza logout buscando el botón de logout.

### `expectErrorMessage(page, errorText?)`
Verifica que se muestra un mensaje de error (opcional: con texto específico).

### `expectSuccessMessage(page, successText?)`
Verifica que se muestra un mensaje de éxito (opcional: con texto específico).

### `waitForApiCall(page, method, pathname, timeout?)`
Espera por una llamada a API específica.

**Ejemplo:**
```typescript
const response = await waitForApiCall(page, 'POST', '/api/auth/register')
```

### `callApi(page, method, path, body?, token?)`
Llama un endpoint API directamente desde el test.

**Ejemplo:**
```typescript
const response = await callApi(page, 'GET', '/api/admin/list-users', null, token)
```

---

## 🔧 Configuración (`playwright.config.ts`)

```typescript
{
  testDir: './tests',              // Ubicación de tests
  fullyParallel: false,            // Tests secuenciales
  workers: 1,                      // Un worker
  baseURL: 'http://localhost:3000',// URL base
  use: {
    trace: 'on-first-retry',       // Trace en fallos
    screenshot: 'only-on-failure', // Screenshots en fallos
    video: 'retain-on-failure',    // Video en fallos
  },
  webServer: {
    command: 'npm run dev',        // Inicia servidor
    url: 'http://localhost:3000',
    reuseExistingServer: true,     // Reutiliza si está corriendo
  }
}
```

---

## ✅ Checklist Antes de Correr Tests

- [ ] Supabase local está corriendo: `supabase start`
- [ ] Base de datos está inicializada
- [ ] Variables de entorno están configuradas (`.env.local`)
- [ ] Next.js dev server puede iniciarse: `npm run dev`
- [ ] No hay otros procesos en puerto 3000

---

## 🐛 Solución de Problemas

### Error: "connection refused on localhost:3000"
**Solución:** El servidor Next.js no arrancó. Ejecuta:
```bash
npm run dev
```

### Error: "supabaseKey is required"
**Solución:** Falta variable de entorno. Agrega a `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

### Tests timeout
**Solución:** Aumenta timeout en `playwright.config.ts`:
```typescript
use: {
  navigationTimeout: 10000,
  actionTimeout: 10000,
}
```

### Elemento no encontrado
**Solución:** Revisa que los selectores coincidan con los elementos del DOM. Usa:
```bash
npm run test:e2e:ui
```
Para inspeccionar elementos en tiempo real.

---

## 📊 Reportes

Los reportes se guardan en `playwright-report/`:

```bash
npm run test:e2e:report
```

Esto abre un HTML interactivo con:
- ✅ Tests que pasaron
- ❌ Tests que fallaron
- 🖼️ Screenshots de fallos
- 🎬 Videos de fallos
- 📍 Traces detallados

---

## 🔄 CI/CD Integration

Para ejecutar en GitHub Actions, agrega a `.github/workflows/test.yml`:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Build
        run: npm run build
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📝 Notas Importantes

### Para Desarrolladores

1. **Siempre usar helpers:** No escribas selectores directamente en tests
2. **Datos dinámicos:** Genera emails únicos con `Date.now()` para evitar conflictos
3. **Esperar correctamente:** Usa `waitForLoadState('networkidle')` después de acciones
4. **Errores vs Éxito:** Valida ambos casos en cada test
5. **Independencia:** Los tests pueden correr en cualquier orden

### Mejores Prácticas

```typescript
// ✅ BUENO
test('Debería hacer algo', async ({ page }) => {
  const uniqueEmail = `test-${Date.now()}@example.com`
  await registerUser(page, { email: uniqueEmail, ... })
  await expectSuccessMessage(page)
})

// ❌ MAL
test('Debería hacer algo', async ({ page }) => {
  await registerUser(page, { email: 'admin@example.com', ... })
  // ^ Email fijo puede causar fallos si el usuario ya existe
})
```

---

## 🚀 Próximos Pasos

1. **Extender Admin Tests:** Agregar tests para endpoints admin
2. **Tests de Operaciones:** Crear citas, gestionar pacientes, etc.
3. **Performance Testing:** Medir tiempos de respuesta
4. **Load Testing:** Usar Playwright para carga
5. **Visual Regression:** Capturar cambios visuales no esperados

---

## 📞 Soporte

Para preguntas o problemas, revisa:
- [Documentación oficial Playwright](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- Logs en `playwright-report/`
