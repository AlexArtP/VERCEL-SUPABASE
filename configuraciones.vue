<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Panel de Configuración</h1>
      
      <!-- Tabs -->
      <div class="bg-white rounded-lg shadow-sm mb-6">
        <div class="border-b border-gray-200">
          <nav class="flex -mb-px">
            <button
              v-for="tab in filteredTabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              <component :is="tab.icon" class="w-5 h-5" />
              {{ tab.label }}
            </button>
          </nav>
        </div>
      </div>

      <!-- ================================================ -->
      <!-- PERFIL TAB: INFORMACIÓN PERSONAL Y CALENDARIO -->
      <!-- ================================================ -->
      <div v-if="activeTab === 'perfil'" class="space-y-8">
        <!-- Información Personal -->
        <div class="bg-white rounded-lg shadow-md border border-gray-300 p-8">
          <div class="flex items-center justify-between mb-8">
            <div>
              <h2 class="text-3xl font-bold text-gray-900">{{ perfil.nombre }} {{ perfil.apellidos }}</h2>
              <p class="text-lg text-gray-600 mt-1">{{ perfil.profesion }}</p>
            </div>
            <button class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              ✎ Editar Perfil
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">Nombre y Apellidos</label>
              <input
                v-model="perfil.nombre"
                type="text"
                class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nombre completo"
              />
            </div>

            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">RUN</label>
              <input
                v-model="perfil.run"
                type="text"
                class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="12.345.678-9"
              />
            </div>

            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">Profesión</label>
              <input
                v-model="perfil.profesion"
                type="text"
                class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Médico General"
              />
            </div>

            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">Teléfono</label>
              <input
                v-model="perfil.telefono"
                type="tel"
                class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+56 9 1234 5678"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-bold text-gray-700 mb-2">Correo Electrónico</label>
              <input
                v-model="perfil.correo"
                type="email"
                class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-bold text-gray-700 mb-2">Cargo Actual</label>
              <textarea
                v-model="perfil.cargo"
                rows="4"
                class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Describe tu cargo actual y responsabilidades..."
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Calendario Semanal -->
        <div class="bg-white rounded-lg shadow-md border border-gray-300 p-8">
          <h3 class="text-2xl font-bold text-gray-900 mb-6">📅 Citas de esta Semana</h3>
          
          <div class="overflow-x-auto">
            <div class="min-w-full">
              <!-- Encabezados de días -->
              <div class="grid grid-cols-8 gap-2 mb-2">
                <div class="text-sm font-bold text-gray-600 p-2">Hora</div>
                <div
                  v-for="dia in diasSemana"
                  :key="dia.fecha"
                  class="text-center p-2 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div class="text-sm font-bold text-gray-900">{{ dia.nombre }}</div>
                  <div class="text-xs text-gray-600">{{ dia.fecha }}</div>
                </div>
              </div>

              <!-- Filas de horarios -->
              <div class="space-y-1">
                <div
                  v-for="hora in horarios"
                  :key="hora"
                  class="grid grid-cols-8 gap-2"
                >
                  <div class="text-sm text-gray-700 p-2 font-semibold">{{ hora }}</div>
                  <div
                    v-for="dia in diasSemana"
                    :key="dia.fecha + hora"
                    class="relative"
                  >
                    <div
                      v-if="getCita(dia.fecha, hora)"
                      class="bg-blue-200 border-2 border-blue-400 rounded p-2 text-xs hover:bg-blue-300 transition-colors cursor-pointer"
                    >
                      <div class="font-bold text-blue-900">{{ getCita(dia.fecha, hora).paciente }}</div>
                      <div class="text-blue-800">{{ getCita(dia.fecha, hora).tipo }}</div>
                    </div>
                    <div
                      v-else
                      class="border-2 border-gray-200 rounded p-2 h-full hover:bg-gray-50 transition-colors cursor-pointer"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
            </div>

      <!-- ================================================ -->
      <!-- CONFIGURACIONES TAB: ACCESOS RÁPIDOS + USUARIOS -->
      <!-- ================================================ -->
      <div v-if="activeTab === 'configuraciones'" class="space-y-8">
        <!-- TARJETAS DE ACCESO RÁPIDO -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- CARD 1: AUTORIZAR SOLICITUDES -->
          <div class="bg-gradient-to-br from-purple-100 via-purple-50 to-pink-50 rounded-xl border-2 border-purple-300 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div class="p-8 flex flex-col h-full">
              <div class="mb-6">
                <div class="text-5xl mb-4">👥</div>
                <h3 class="text-3xl font-bold text-purple-900 mb-2">Autorizar Solicitudes</h3>
                <p class="text-base text-purple-800 leading-relaxed">
                  Revisa, autoriza y rechaza solicitudes de acceso de nuevos usuarios. Asigna permisos de administrador si es necesario.
                </p>
              </div>
              <ul class="space-y-3 mb-8 flex-1">
                <li class="flex items-center gap-3 text-purple-900">
                  <span class="text-2xl">✓</span>
                  <span class="text-base font-medium">Ver solicitudes pendientes</span>
                </li>
                <li class="flex items-center gap-3 text-purple-900">
                  <span class="text-2xl">✓</span>
                  <span class="text-base font-medium">Aprobar/Rechazar acceso</span>
                </li>
                <li class="flex items-center gap-3 text-purple-900">
                  <span class="text-2xl">✓</span>
                  <span class="text-base font-medium">Asignar permisos admin</span>
                </li>
              </ul>
              <button
                @click="activeTab = 'registros'; showAuthorizationsModal = true"
                class="w-full px-6 py-3 bg-purple-600 text-white font-bold text-lg rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-all duration-200 shadow-md hover:shadow-lg"
                type="button"
              >
                Abrir Panel →
              </button>
            </div>
          </div>

          <!-- CARD 2: PANEL ADMINISTRACIÓN -->
          <div class="bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-50 rounded-xl border-2 border-blue-300 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div class="p-8 flex flex-col h-full">
              <div class="mb-6">
                <div class="text-5xl mb-4">🚀</div>
                <h3 class="text-3xl font-bold text-blue-900 mb-2">Panel Administración</h3>
                <p class="text-base text-blue-800 leading-relaxed">
                  Configura Firebase, inicializa la base de datos y visualiza estadísticas en tiempo real del sistema.
                </p>
              </div>
              <ul class="space-y-3 mb-8 flex-1">
                <li class="flex items-center gap-3 text-blue-900">
                  <span class="text-2xl">✓</span>
                  <span class="text-base font-medium">Crear colecciones Firebase</span>
                </li>
                <li class="flex items-center gap-3 text-blue-900">
                  <span class="text-2xl">✓</span>
                  <span class="text-base font-medium">Importar datos iniciales</span>
                </li>
                <li class="flex items-center gap-3 text-blue-900">
                  <span class="text-2xl">✓</span>
                  <span class="text-base font-medium">Ver estadísticas del sistema</span>
                </li>
              </ul>
              <button
                @click="activeTab = 'admin'"
                class="w-full px-6 py-3 bg-blue-600 text-white font-bold text-lg rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
                type="button"
              >
                Abrir Panel →
              </button>
            </div>
          </div>
        </div>

        <!-- TABLA DE GESTIÓN DE USUARIOS -->
        <div class="bg-white rounded-lg shadow-md border border-gray-300">
          <div class="p-6 border-b-2 border-gray-200 bg-gray-50">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-2xl font-bold text-gray-900">👨‍💼 Gestión de Usuarios</h2>
                <p class="text-sm text-gray-600 mt-1">Administra los usuarios del sistema</p>
              </div>
              <button class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                <UserPlus class="w-5 h-5" />
                Nuevo Usuario
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Usuario</th>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">RUN</th>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Contacto</th>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Rol</th>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Admin</th>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Estado</th>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="usuario in usuarios" :key="usuario.id" class="hover:bg-gray-100 transition-colors">
                  <td class="px-6 py-4">
                    <div class="text-sm font-semibold text-gray-900">{{ usuario.nombre }} {{ usuario.apellidos }}</div>
                    <div class="text-xs text-gray-500">{{ usuario.profesion }}</div>
                  </td>
                  <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ usuario.run }}</td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">{{ usuario.correo }}</div>
                    <div class="text-xs text-gray-500">{{ usuario.telefono }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <select
                      v-model="usuario.rol"
                      class="text-sm border-2 border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                    >
                      <option value="profesional">Profesional</option>
                      <option value="administrativo">Administrativo</option>
                    </select>
                  </td>
                  <td class="px-6 py-4">
                    <input
                      v-model="usuario.esAdmin"
                      type="checkbox"
                      class="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td class="px-6 py-4">
                    <button
                      @click="usuario.activo = !usuario.activo"
                      :class="[
                        'px-3 py-1 rounded-full text-xs font-bold transition-colors',
                        usuario.activo
                          ? 'bg-green-200 text-green-800 hover:bg-green-300'
                          : 'bg-red-200 text-red-800 hover:bg-red-300'
                      ]"
                    >
                      {{ usuario.activo ? '✓ Activo' : '✗ Inactivo' }}
                    </button>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <button
                        @click="restablecerContrasena(usuario.id)"
                        class="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors font-bold"
                        title="Restablecer contraseña"
                      >
                        <Key class="w-5 h-5" />
                      </button>
                      <button
                        @click="eliminarUsuario(usuario.id)"
                        class="p-2 text-red-600 hover:bg-red-100 rounded transition-colors font-bold"
                        title="Eliminar usuario"
                      >
                        <Trash2 class="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Base de Datos Tab -->
      <div v-if="activeTab === 'database'" class="space-y-6">
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Configuración de Base de Datos</h2>
          
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Host</label>
              <input
                v-model="database.host"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="localhost"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Puerto</label>
                <input
                  v-model="database.puerto"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5432"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Nombre de BD</label>
                <input
                  v-model="database.nombre"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="mi_base_datos"
                />
              </div>
            </div>

            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 class="text-sm font-medium text-gray-900">Backups Automáticos</h3>
                <p class="text-sm text-gray-500">Realizar copias de seguridad diarias</p>
              </div>
              <button
                @click="database.backupAutomatico = !database.backupAutomatico"
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  database.backupAutomatico ? 'bg-blue-600' : 'bg-gray-300'
                ]"
              >
                <span
                  :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    database.backupAutomatico ? 'translate-x-6' : 'translate-x-1'
                  ]"
                />
              </button>
            </div>

            <div class="flex gap-4">
              <button class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Probar Conexión
              </button>
              <button class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Autorizar Registros Tab (Solo Admins) -->
  <div v-if="activeTab === 'registros'" class="bg-white rounded-lg shadow-sm p-6">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-2">👥 Autorizar Registros de Usuarios</h2>
          <p class="text-gray-600">Revisa y autoriza las solicitudes de acceso de nuevos usuarios. También puedes habilitar permisos de administrador.</p>
        </div>
        <button 
          @click="showAuthorizationsModal = true"
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          🔓 Abrir Panel de Autorizaciones
        </button>
      </div>

      <!-- Administración Tab (Solo Admins) -->
      <div v-if="activeTab === 'admin'" class="bg-white rounded-lg shadow-sm p-6">
        <AdminPanel key="admin-panel" />
      </div>

      <!-- Modal de Autorizaciones -->
      <AuthorizeRegistrationsModal 
        :isOpen="showAuthorizationsModal"
        @close="showAuthorizationsModal = false"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { User, Settings, Database, UserPlus, Key, Trash2, Wrench } from 'lucide-vue-next'
import AdminPanel from '@/components/AdminPanel.vue'
import AuthorizeRegistrationsModal from '@/components/AuthorizeRegistrationsModal.vue'

const activeTab = ref('perfil')

// Obtener token de usuario actual
const usuarioActual = ref(null)

// Cargar usuario en montar
onMounted(() => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('sistema_auth_token')
    if (token) {
      try {
        usuarioActual.value = JSON.parse(token)
        console.log('✅ Usuario cargado desde token:', usuarioActual.value)
      } catch (e) {
        console.error('❌ Error al parsear token:', e)
        usuarioActual.value = null
      }
    }
  }
})

// Verificar si es admin - usando computed para reactividad
const esAdmin = computed(() => {
  if (!usuarioActual.value) {
    console.warn('⚠️ usuarioActual es null')
    return false
  }
  const u = usuarioActual.value
  console.log('� Verificando admin. usuarioActual:', u)
  // 1) Flag directo
  if (u.esAdmin === true) return true
  // 2) Rol textual (como en la lista "Carlos Ramírez Torres: Administrador")
  if (typeof u.rol === 'string' && u.rol.toLowerCase().includes('admin')) return true
  // 3) Coincidencia con usuarios demo marcados admin
  const esAdminEnLista = usuarios.value?.some(x => x.esAdmin && (x.nombre === u.nombre || x.correo === u.correo))
  return !!esAdminEnLista
})

const tabs = [
  { id: 'perfil', label: 'Perfil', icon: User },
  { id: 'configuraciones', label: 'Configuraciones', icon: Settings },
  { id: 'database', label: 'Base de Datos', icon: Database },
  { id: 'registros', label: '👥 Autorizar Registros', icon: UserPlus, adminOnly: true },
  { id: 'admin', label: '🔧 Administración', icon: Wrench, adminOnly: true }
]

// Filtrar tabs para excluir "configuraciones"
const filteredTabs = computed(() => {
  return tabs.filter(tab => tab.id !== 'configuraciones')
})

const perfil = ref({
  nombre: 'Juan Carlos',
  apellidos: 'González Pérez',
  run: '12.345.678-9',
  profesion: 'Médico General',
  telefono: '+56 9 8765 4321',
  correo: 'juan.gonzalez@clinica.cl',
  cargo: 'Director Médico del Departamento de Medicina Interna. Responsable de coordinar el equipo de profesionales, supervisar la atención de pacientes y gestionar los protocolos clínicos del área.'
})

const showAuthorizationsModal = ref(false)

const diasSemana = [
  { nombre: 'Lun', fecha: '13/01' },
  { nombre: 'Mar', fecha: '14/01' },
  { nombre: 'Mié', fecha: '15/01' },
  { nombre: 'Jue', fecha: '16/01' },
  { nombre: 'Vie', fecha: '17/01' },
  { nombre: 'Sáb', fecha: '18/01' },
  { nombre: 'Dom', fecha: '19/01' }
]

const horarios = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00']

const citas = ref([
  { fecha: '13/01', hora: '09:00', paciente: 'María López', tipo: 'Consulta' },
  { fecha: '13/01', hora: '11:00', paciente: 'Pedro Sánchez', tipo: 'Control' },
  { fecha: '14/01', hora: '10:00', paciente: 'Ana Martínez', tipo: 'Consulta' },
  { fecha: '15/01', hora: '14:00', paciente: 'Carlos Ruiz', tipo: 'Seguimiento' },
  { fecha: '16/01', hora: '09:00', paciente: 'Laura Torres', tipo: 'Consulta' },
  { fecha: '17/01', hora: '15:00', paciente: 'Diego Vargas', tipo: 'Control' }
])

const getCita = (fecha, hora) => {
  return citas.value.find(c => c.fecha === fecha && c.hora === hora)
}

const usuarios = ref([
  {
    id: 1,
    nombre: 'María',
    apellidos: 'Rodríguez Silva',
    run: '18.234.567-8',
    profesion: 'Enfermera',
    telefono: '+56 9 1234 5678',
    correo: 'maria.rodriguez@clinica.cl',
    rol: 'profesional',
    esAdmin: false,
    activo: true
  },
  {
    id: 2,
    nombre: 'Carlos',
    apellidos: 'Muñoz Pérez',
    run: '16.789.012-3',
    profesion: 'Médico Cirujano',
    telefono: '+56 9 8765 4321',
    correo: 'carlos.munoz@clinica.cl',
    rol: 'profesional',
    esAdmin: true,
    activo: true
  },
  {
    id: 3,
    nombre: 'Ana',
    apellidos: 'Fernández López',
    run: '19.456.789-0',
    profesion: 'Secretaria',
    telefono: '+56 9 5555 6666',
    correo: 'ana.fernandez@clinica.cl',
    rol: 'administrativo',
    esAdmin: false,
    activo: true
  },
  {
    id: 4,
    nombre: 'Luis',
    apellidos: 'Contreras Díaz',
    run: '17.123.456-7',
    profesion: 'Kinesiólogo',
    telefono: '+56 9 7777 8888',
    correo: 'luis.contreras@clinica.cl',
    rol: 'profesional',
    esAdmin: false,
    activo: false
  }
])

const restablecerContrasena = (id) => {
  console.log('Restablecer contraseña para usuario:', id)
  alert('Se ha enviado un correo para restablecer la contraseña')
}

const eliminarUsuario = (id) => {
  if (confirm('¿Estás seguro de eliminar este usuario?')) {
    usuarios.value = usuarios.value.filter(u => u.id !== id)
  }
}

const database = ref({
  host: 'localhost',
  puerto: '5432',
  nombre: 'clinica_db',
  backupAutomatico: true
})
</script>
