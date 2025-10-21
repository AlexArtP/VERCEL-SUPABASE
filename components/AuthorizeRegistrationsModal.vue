/**
 * COMPONENTE: components/AuthorizeRegistrationsModal.vue
 * PROPÓSITO: Modal Vue para autorizar/rechazar solicitudes de registro
 */

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Overlay -->
    <div 
      class="fixed inset-0 bg-black bg-opacity-50"
      @click="$emit('close')"
    ></div>

    <!-- Modal -->
    <div class="flex items-center justify-center min-h-screen p-4">
      <div class="relative bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold text-gray-900">👥 Autorizar Registros de Usuarios</h2>
              <p class="text-gray-600 text-sm mt-1">Revisa y autoriza las solicitudes de acceso de nuevos usuarios</p>
            </div>
            <button 
              @click="$emit('close')"
              class="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <!-- Contenido -->
        <div class="p-6 space-y-4">
          <!-- Filtros -->
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="f in ['todos', 'pendiente', 'aprobado', 'rechazado']"
              :key="f"
              @click="filter = f; selectedIds = []"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                filter === f 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              <span v-if="f === 'todos'">📋 Todos</span>
              <span v-else-if="f === 'pendiente'">⏳ Pendientes</span>
              <span v-else-if="f === 'aprobado'">✓ Aprobados</span>
              <span v-else>✗ Rechazados</span>
            </button>
          </div>

          <!-- Lista de solicitudes -->
          <div class="space-y-3 max-h-[400px] overflow-y-auto">
            <div v-if="filteredRegistrations.length === 0" class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center text-yellow-800">
              <p class="text-sm">
                <span v-if="filter === 'pendiente'">No hay solicitudes pendientes</span>
                <span v-else>No hay solicitudes {{ filter }}</span>
              </p>
            </div>

            <div 
              v-for="reg in filteredRegistrations"
              :key="reg.id"
              class="border border-gray-200 rounded-lg p-4"
            >
              <div class="flex gap-4 items-start">
                <!-- Checkbox -->
                <div class="pt-2">
                  <input 
                    type="checkbox"
                    :checked="selectedIds.includes(reg.id)"
                    @change="toggleSelect(reg.id)"
                    :disabled="reg.estado !== 'pendiente'"
                    class="w-4 h-4 rounded"
                  />
                </div>

                <!-- Información -->
                <div class="flex-1">
                  <div class="flex items-start justify-between mb-2">
                    <div>
                      <h4 class="font-semibold text-gray-900">
                        {{ reg.nombre }} {{ reg.apellidoPaterno }} {{ reg.apellidoMaterno }}
                      </h4>
                      <p class="text-xs text-gray-500 mt-1">RUN: {{ reg.run }}</p>
                    </div>
                    <span :class="['text-xs font-semibold px-2 py-1 rounded', getStatusClass(reg.estado)]">
                      {{ getStatusText(reg.estado) }}
                    </span>
                  </div>

                  <div class="grid grid-cols-2 gap-3 text-sm my-3">
                    <div>
                      <p class="text-xs font-medium text-gray-600">Profesión</p>
                      <p class="text-gray-900">{{ reg.profesion }}</p>
                    </div>
                    <div>
                      <p class="text-xs font-medium text-gray-600">Cargo</p>
                      <p class="text-gray-900">{{ reg.cargoActual }}</p>
                    </div>
                    <div>
                      <p class="text-xs font-medium text-gray-600">📧 Email</p>
                      <p class="text-gray-900 truncate">{{ reg.email }}</p>
                    </div>
                    <div v-if="reg.telefono">
                      <p class="text-xs font-medium text-gray-600">📱 Teléfono</p>
                      <p class="text-gray-900">{{ reg.telefono }}</p>
                    </div>
                  </div>

                  <div v-if="reg.sobreTi" class="my-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                    <p class="text-xs font-medium text-gray-600 mb-1">Sobre sí</p>
                    <p class="line-clamp-2">{{ reg.sobreTi }}</p>
                  </div>

                  <!-- Checkbox Admin -->
                  <div v-if="reg.estado === 'aprobado'" class="mt-3 flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <input 
                      type="checkbox"
                      :id="`admin-${reg.id}`"
                      :checked="reg.adminEnabled"
                      @change="toggleAdmin(reg.id)"
                      class="w-4 h-4 rounded"
                    />
                    <label :for="`admin-${reg.id}`" class="text-sm text-gray-700 cursor-pointer">
                      ✨ Habilitar como Administrador
                    </label>
                  </div>

                  <p class="text-xs text-gray-500 mt-2">
                    Solicitado: {{ new Date(reg.solicitadoEn).toLocaleDateString('es-CL') }}
                  </p>
                </div>

                <!-- Botón eliminar -->
                <button 
                  v-if="reg.estado !== 'pendiente'"
                  @click="deleteRegistration(reg.id)"
                  class="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>

          <!-- Acciones -->
          <div v-if="filter === 'pendiente' && selectedIds.length > 0" class="flex gap-2 justify-end pt-4 border-t">
            <button 
              @click="selectedIds = []"
              :disabled="loading"
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Desmarcar
            </button>
            <button 
              @click="handleReject"
              :disabled="loading"
              class="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              ✗ Rechazar ({{ selectedIds.length }})
            </button>
            <button 
              @click="handleApprove"
              :disabled="loading"
              class="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              ✓ Aprobar ({{ selectedIds.length }})
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close'])

const registrations = ref([])

// Cargar solicitudes reales desde la API al montar
const loadRegistrations = async () => {
  try {
    const res = await fetch('/api/auth/solicitudes')
    if (!res.ok) {
      console.warn('No fue posible cargar solicitudes, usando demo data')
      // mantener vacío para mostrar mensaje de no hay solicitudes
      registrations.value = []
      return
    }
    const data = await res.json()
    if (data && data.success && Array.isArray(data.data)) {
      registrations.value = data.data.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        apellidoPaterno: r.apellidoPaterno,
        apellidoMaterno: r.apellidoMaterno,
        run: r.run,
        profesion: r.profesion,
        email: r.email,
        telefono: r.telefono,
        cargoActual: r.cargoActual,
        sobreTi: r.sobreTi,
        solicitadoEn: r.fechaSolicitud || r.solicitadoEn || new Date().toISOString(),
        estado: r.estado || 'pendiente',
        adminEnabled: r.esAdmin || false,
      }))
    } else {
      registrations.value = []
    }
  } catch (err) {
    console.error('Error cargando solicitudes:', err)
    registrations.value = []
  }
}

// Cargar al inicio
loadRegistrations()

const selectedIds = ref([])
const loading = ref(false)
const filter = ref('pendiente')

const filteredRegistrations = computed(() => {
  return registrations.value.filter(reg => {
    if (filter.value === 'todos') return true
    return reg.estado === filter.value
  })
})

const getStatusClass = (estado) => {
  if (estado === 'aprobado') return 'text-green-700 bg-green-100'
  if (estado === 'rechazado') return 'text-red-700 bg-red-100'
  return 'text-yellow-700 bg-yellow-100'
}

const getStatusText = (estado) => {
  if (estado === 'aprobado') return '✓ Aprobado'
  if (estado === 'rechazado') return '✗ Rechazado'
  return '⏳ Pendiente'
}

const toggleSelect = (id) => {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

const toggleAdmin = (id) => {
  const reg = registrations.value.find(r => r.id === id)
  if (reg) {
    reg.adminEnabled = !reg.adminEnabled
  }
}

const handleApprove = async () => {
  loading.value = true
  try {
    // Llamar API de aprobación para cada solicitud
    for (const solicitudId of selectedIds.value) {
      const reg = registrations.value.find(r => r.id === solicitudId)
      if (reg) {
        const response = await fetch('/api/auth/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            solicitudId,
            habilitarAdmin: reg.adminEnabled || false,
          }),
        })

        if (response.ok) {
          // Actualizar en la UI
          reg.estado = 'aprobado'
        } else {
          const error = await response.json()
          console.error('Error al aprobar:', error)
          alert(`Error al aprobar ${reg.nombre}: ${error.message}`)
        }
      }
    }
    // refrescar lista desde API
    await loadRegistrations()
    selectedIds.value = []
  } finally {
    loading.value = false
  }
}

const handleReject = async () => {
  loading.value = true
  try {
    // Llamar API de rechazo para cada solicitud
    for (const solicitudId of selectedIds.value) {
      const reg = registrations.value.find(r => r.id === solicitudId)
      if (reg) {
        const response = await fetch('/api/auth/reject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            solicitudId,
            razon: 'Rechazada por administrador',
          }),
        })

        if (response.ok) {
          // Actualizar en la UI
          reg.estado = 'rechazado'
        } else {
          const error = await response.json()
          console.error('Error al rechazar:', error)
          alert(`Error al rechazar ${reg.nombre}: ${error.message}`)
        }
      }
    }
    await loadRegistrations()
    selectedIds.value = []
  } finally {
    loading.value = false
  }
}

const deleteRegistration = (id) => {
  registrations.value = registrations.value.filter(reg => reg.id !== id)
  selectedIds.value = selectedIds.value.filter(sid => sid !== id)
}
</script>
