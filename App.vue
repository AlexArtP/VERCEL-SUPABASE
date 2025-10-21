<script setup>
import { ref, reactive } from 'vue'
import MainApp from './components/MainApp.vue'
import { DEMO_DATA } from './data/demoData'

const isAuthenticated = ref(false)
const isLoading = ref(false)
const loginForm = reactive({ email: '', password: '' })
const loginError = ref('')
const currentUser = ref(null)

const showRequestAccountModal = ref(false)
const requestAccount = reactive({ nombre: '', apellidos: '', run: '', email: '', profesion: '' })

const login = async () => {
  isLoading.value = true
  loginError.value = ''
  try {
    await new Promise(r => setTimeout(r, 200))
    const found = DEMO_DATA.usuarios_demo.find(u => u.email === loginForm.email && u.password === loginForm.password)
    if (!found) {
      loginError.value = 'Credenciales inválidas'
    } else {
      isAuthenticated.value = true
      currentUser.value = { id: found.id, nombre: `${found.nombre}`, roles: found.roles }
      loginForm.email = ''
      loginForm.password = ''
    }
  } catch (e) {
    console.error(e)
    loginError.value = 'Error inesperado'
  } finally {
    isLoading.value = false
  }
}

const logout = () => { isAuthenticated.value = false; currentUser.value = null }
</script>

<template>
  <div class="app-root">
    <div v-if="!isAuthenticated" class="login-bg">
      <div class="login-container">
        <div class="login-left">
          <h2>Bienvenido</h2>
          <p>Accede a tu cuenta para continuar</p>
        </div>
        <div class="login-right">
          <form @submit.prevent="login" class="login-form-modern">
            <h1>Iniciar Sesión</h1>
            <div class="input-group">
              <label for="email">Correo electrónico</label>
              <input id="email" v-model="loginForm.email" type="email" required placeholder="Ingresa tu correo" />
            </div>
            <div class="input-group">
              <label for="password">Contraseña</label>
              <input id="password" v-model="loginForm.password" type="password" required placeholder="Ingresa tu contraseña" />
            </div>
            <button type="submit" :disabled="isLoading">{{ isLoading ? 'Ingresando...' : 'Ingresar' }}</button>
            <div v-if="loginError" class="error">{{ loginError }}</div>
          </form>
          <button class="secondary" @click="showRequestAccountModal = true">Solicitar cuenta</button>
        </div>
      </div>
    </div>

    <div v-else class="main-screen">
      <MainApp :current-user="currentUser" @logout="logout" />
    </div>

    <div class="modal" v-if="showRequestAccountModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Solicitar nueva cuenta</h3>
          <button @click="showRequestAccountModal = false">Cerrar</button>
        </div>
        <form class="modal-form" @submit.prevent="showRequestAccountModal = false">
          <label>Nombre</label>
          <input v-model="requestAccount.nombre" type="text" />
          <label>Apellidos</label>
          <input v-model="requestAccount.apellidos" type="text" />
          <label>RUN</label>
          <input v-model="requestAccount.run" type="text" />
          <label>Correo</label>
          <input v-model="requestAccount.email" type="email" />
          <label>Profesión</label>
          <input v-model="requestAccount.profesion" type="text" />
          <button type="submit">Enviar solicitud</button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-root {
  font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
  min-height: 100vh;
  background: #f4f6fb;
}
.login-bg {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(120deg, #1976d2 0%, #42a5f5 100%);
}
.login-container {
  display: flex;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.10);
  overflow: hidden;
  max-width: 800px;
  width: 100%;
  min-height: 400px;
}
.login-left {
  background: #1976d2;
  color: #fff;
  flex: 1 1 40%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
}
.login-left h2 {
  font-size: 2.2rem;
  margin-bottom: 12px;
}
.login-left p {
  font-size: 1.1rem;
  opacity: 0.9;
}
.login-right {
  flex: 1 1 60%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
}
.login-form-modern {
  width: 100%;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.login-form-modern h1 {
  font-size: 1.6rem;
  margin-bottom: 8px;
  color: #1976d2;
}
.input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.input-group label {
  font-size: 0.98rem;
  color: #333;
}
.input-group input {
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #bfc9d9;
  font-size: 1rem;
  outline: none;
  transition: border 0.2s;
}
.input-group input:focus {
  border: 1.5px solid #1976d2;
}
button[type="submit"] {
  padding: 12px 0;
  border-radius: 6px;
  border: none;
  background: #1976d2;
  color: #fff;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.2s;
}
button[type="submit"]:hover:not(:disabled) {
  background: #125ea7;
}
.secondary {
  background: #6c757d;
  color: #fff;
  margin-top: 18px;
  padding: 10px 0;
  border-radius: 6px;
  border: none;
  width: 100%;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.secondary:hover {
  background: #565e64;
}
.error {
  color: #b00020;
  margin-top: 8px;
  font-size: 0.98rem;
}
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #fff;
  padding: 24px 20px;
  border-radius: 10px;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 2px 16px rgba(0,0,0,0.10);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.modal-header h3 {
  margin: 0;
  font-size: 1.2rem;
}
.modal-header button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.modal-form input {
  padding: 8px 10px;
  border-radius: 5px;
  border: 1px solid #bfc9d9;
  font-size: 1rem;
}
.modal-form button[type="submit"] {
  background: #1976d2;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 10px 0;
  font-size: 1rem;
  margin-top: 8px;
  cursor: pointer;
}
.modal-form button[type="submit"]:hover {
  background: #125ea7;
}
@media (max-width: 700px) {
  .login-container {
    flex-direction: column;
    min-height: unset;
    max-width: 98vw;
  }
  .login-left, .login-right {
    padding: 28px 10px;
  }
}
</style>
