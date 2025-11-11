import { Page, expect } from '@playwright/test'

/**
 * Helpers para tests E2E
 */

/**
 * Helper para registrar un nuevo usuario
 */
export async function registerUser(
  page: Page,
  userData: {
    email: string
    password: string
    nombre: string
    apellido_paterno: string
    apellido_materno?: string
    profesion?: string
  }
) {
  // Ir a página de registro
  await page.goto('/register')
  
  // Llenar formulario
  await page.fill('input[name="email"]', userData.email)
  await page.fill('input[name="password"]', userData.password)
  await page.fill('input[name="nombre"]', userData.nombre)
  await page.fill('input[name="apellido_paterno"]', userData.apellido_paterno)
  
  if (userData.apellido_materno) {
    await page.fill('input[name="apellido_materno"]', userData.apellido_materno)
  }
  
  if (userData.profesion) {
    await page.fill('input[name="profesion"]', userData.profesion)
  }
  
  // Enviar formulario
  await page.click('button[type="submit"]')
  
  // Esperar respuesta
  await page.waitForLoadState('networkidle')
}

/**
 * Helper para login
 */
export async function loginUser(
  page: Page,
  email: string,
  password: string
) {
  await page.goto('/')
  
  // Click en login si es necesario
  const loginButton = page.locator('button:has-text("Iniciar Sesión")')
  if (await loginButton.isVisible()) {
    await loginButton.click()
  }
  
  // Llenar credenciales
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  
  // Click submit
  await page.click('button[type="submit"]')
  
  // Esperar a que se complete el login
  await page.waitForLoadState('networkidle')
}

/**
 * Helper para verificar que el usuario está autenticado
 */
export async function expectUserLoggedIn(page: Page) {
  // Verificar que hay un token en localStorage
  const token = await page.evaluate(() => {
    return localStorage.getItem('sistema_auth_token')
  })
  
  expect(token).toBeTruthy()
  return token
}

/**
 * Helper para hacer logout
 */
export async function logout(page: Page) {
  // Buscar botón de logout
  const logoutButton = page.locator('button:has-text("Cerrar Sesión"), button:has-text("Logout")')
  if (await logoutButton.isVisible()) {
    await logoutButton.click()
  }
  
  await page.waitForLoadState('networkidle')
}

/**
 * Helper para verificar que se mostró un error
 */
export async function expectErrorMessage(page: Page, errorText?: string) {
  // Buscar elemento con error
  const errorElement = page.locator('[role="alert"], .error, .alert-danger')
  await expect(errorElement).toBeVisible()
  
  if (errorText) {
    await expect(errorElement).toContainText(errorText)
  }
}

/**
 * Helper para verificar que se mostró un éxito
 */
export async function expectSuccessMessage(page: Page, successText?: string) {
  const successElement = page.locator('[role="status"], .success, .alert-success')
  await expect(successElement).toBeVisible()
  
  if (successText) {
    await expect(successElement).toContainText(successText)
  }
}

/**
 * Helper para esperar por un endpoint API
 */
export async function waitForApiCall(
  page: Page,
  method: string,
  pathname: string,
  timeout = 5000
) {
  return page.waitForResponse(
    response => 
      response.request().method() === method && 
      response.url().includes(pathname),
    { timeout }
  )
}

/**
 * Helper para llamar un endpoint API directamente
 */
export async function callApi(
  page: Page,
  method: string,
  path: string,
  body?: any,
  token?: string
) {
  const response = await page.evaluate(
    async ({ method, path, body, token }) => {
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const res = await fetch(path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })
      
      return {
        status: res.status,
        data: await res.json(),
      }
    },
    { method, path, body, token }
  )
  
  return response
}
