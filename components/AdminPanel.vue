<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">🔧 Panel de Administración</h2>
        <p class="text-gray-600 mt-1">Inicializar y gestionar la base de datos Firebase</p>
      </div>
    </div>

    <!-- Status Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Database Status -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Estado Base de Datos</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats?.totalDocuments || 0 }}</p>
            <p class="text-xs text-gray-500 mt-1">documentos</p>
          </div>
          <div class="text-3xl">📊</div>
        </div>
      </div>

      <!-- Collections -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Colecciones</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats?.collections?.length || 0 }}</p>
            <p class="text-xs text-gray-500 mt-1">activas</p>
          </div>
          <div class="text-3xl">🗂️</div>
        </div>
      </div>

      <!-- Last Update -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Última actualización</p>
            <p class="text-lg font-bold text-gray-900 mt-1">{{ lastUpdate || 'Nunca' }}</p>
            <p class="text-xs text-gray-500 mt-1">sincronización</p>
          </div>
          <div class="text-3xl">⏱️</div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
      <h3 class="text-lg font-semibold text-blue-900 mb-4">Operaciones Disponibles</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Initialize Button -->
        <button
          @click="handleInitialize"
          :disabled="loading"
          class="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <span v-if="!loading">✨ Inicializar BD</span>
          <span v-else>Inicializando...</span>
        </button>

        <!-- Check Stats Button -->
        <button
          @click="handleCheckStats"
          :disabled="loading"
          class="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <span v-if="!loading">📊 Verificar Estadísticas</span>
          <span v-else>Verificando...</span>
        </button>

        <!-- Wipe Database Button -->
        <button
          @click="handleWipeConfirm"
          :disabled="loading"
          class="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <span v-if="!loading">🗑️ Limpiar BD</span>
          <span v-else>Limpiando...</span>
        </button>
      </div>
    </div>

    <!-- Messages -->
    <div v-if="message" class="bg-green-50 border border-green-200 rounded-lg p-4">
      <p class="text-green-800 text-sm">✓ {{ message }}</p>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-800 text-sm">✕ {{ error }}</p>
    </div>

    <!-- Collections List -->
    <div v-if="stats?.collections?.length" class="bg-white rounded-lg border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Colecciones Inicializadas</h3>
      <div class="space-y-2">
        <div v-for="col in stats.collections" :key="col" class="flex items-center gap-2 text-gray-700">
          <span class="text-green-600">✓</span>
          <span>{{ col }}</span>
        </div>
      </div>
    </div>

    <!-- Wipe Confirmation Modal -->
    <div v-if="showWipeConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg p-6 max-w-sm w-full">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Confirmar eliminación</h3>
        <p class="text-gray-600 mb-6">¿Está seguro de que desea limpiar toda la base de datos? Esta acción no se puede deshacer.</p>
        <div class="flex gap-4">
          <button
            @click="handleWipeDatabase"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Sí, limpiar BD
          </button>
          <button
            @click="showWipeConfirm = false"
            class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const loading = ref(false)
const message = ref('')
const error = ref('')
const stats = ref(null)
const showWipeConfirm = ref(false)
const lastUpdate = ref('')

const handleInitialize = async () => {
  console.log('📊 Iniciando inicialización de BD...')
  loading.value = true
  error.value = ''
  message.value = ''

  try {
    const response = await fetch('/api/admin/init-database', { method: 'POST' })
    if (!response.ok) throw new Error('Error en inicialización')
    
    message.value = 'Base de datos inicializada correctamente'
    lastUpdate.value = new Date().toLocaleTimeString('es-CL')
    console.log('✅ BD inicializada')
    await handleCheckStats()
  } catch (err) {
    console.error('❌ Error en inicialización:', err)
    error.value = err.message || 'Error al inicializar'
  } finally {
    loading.value = false
  }
}

const handleCheckStats = async () => {
  console.log('📈 Obteniendo estadísticas...')
  loading.value = true
  error.value = ''

  try {
    const response = await fetch('/api/admin/stats')
    if (!response.ok) throw new Error('Error al obtener estadísticas')
    
    const data = await response.json()
    stats.value = data
    console.log('✅ Estadísticas obtenidas:', data)
  } catch (err) {
    console.error('❌ Error al obtener estadísticas:', err)
    error.value = err.message || 'Error al obtener estadísticas'
  } finally {
    loading.value = false
  }
}

const handleWipeConfirm = () => {
  showWipeConfirm.value = true
}

const handleWipeDatabase = async () => {
  loading.value = true
  error.value = ''
  message.value = ''
  showWipeConfirm.value = false

  try {
    const response = await fetch('/api/admin/wipe', { method: 'POST' })
    if (!response.ok) throw new Error('Error al limpiar BD')
    
    message.value = 'Base de datos limpiada correctamente'
    stats.value = null
    lastUpdate.value = new Date().toLocaleTimeString('es-CL')
  } catch (err) {
    error.value = err.message || 'Error al limpiar'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  console.log('🔧 AdminPanel montado correctamente')
  handleCheckStats()
})
</script>
