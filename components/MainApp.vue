<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { DEMO_DATA, PERMISSIONS } from '../data/demoData'
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import Chart from 'chart.js/auto'
// import { useFirebaseModules } from '../composables/useFirebaseModules' // Removed to fix lint error

// ========== PROPS & EMITS (must be first) ==========
const props = defineProps({
  currentUser: { type: Object, required: true }
})
const emit = defineEmits(['logout'])

// ========== COMPOSABLES (must be called immediately after props/emits) ==========
// const {
//   moduleDefinitions,
//   scheduledModulos,
//   fetchModuleDefinitions,
//   fetchScheduledModulos,
//   addModuleDefinition,
//   addScheduledModulo,
//   deleteModuleDefinition,
//   deleteScheduledModulo,
//   updateModuleDefinition,
//   updateScheduledModulo
// } = useFirebaseModules() // Removed to fix lint error

// ========== STATE (after composables) ==========
const sidebarCollapsed = ref(false)
const isDarkMode = ref(false)
const currentView = ref('dashboard') // iniciar en 'dashboard' para evitar mostrar la vista "Mi Perfil" antigua por defecto
const configView = ref('users') // 'users' | 'database' | 'registros' | 'admin'
const showConfigSubmenu = ref(false)

const directorySearch = ref('')
const patientsSearch = ref('') // Variable undeclared, fix applied

const usuariosDemo = ref([...DEMO_DATA.usuarios_demo])
const profesionales = ref([...DEMO_DATA.profesionales])
const pacientes = ref([...DEMO_DATA.pacientes])
const categorias = ref([...DEMO_DATA.categorias])
const citas = ref([...DEMO_DATA.citas])
const especialidades = ref([...DEMO_DATA.especialidades])

// Modal states
const showAppointmentModal = ref(false)
const showModuleModal = ref(false)
const showAssignModuleModal = ref(false)
const showDeleteConfirmModal = ref(false)
const showDeleteRangeModal = ref(false)

// Forms
const appointmentForm = ref({
  pacienteId: '',
  profesionalId: '',
  categoria: '',
  fecha: '', // YYYY-MM-DD
  hora: '',  // HH:MM
  duracionMin: 30,
  titulo: '',
  notas: '',
  moduloId: null,
  moduloFechaInicio: null,
  moduloFechaFin: null
})

const moduleForm = ref({ 
  nombre: '', 
  motivo: '', 
  estamento: '', 
  fecha: '', 
  hora: '', 
  duracionMin: 60, 
  color: '#7c4dff' 
})

const selectedModuleDefId = ref('')
const assignRange = ref({ start: '', end: '' })
const deleteRange = ref({ start: '', end: '' })

// Calendar & UI state
const calendarEl = ref(null)
let calendarInstance = null
const categoriesChartRef = ref(null)
let categoriesChart = null

const contextMenu = ref({ visible: false, x: 0, y: 0, event: null, kind: null })
const selectedModuleIds = ref([])
const multiSelectMode = ref(false)
const tooltip = ref({ visible: false, x: 0, y: 0, data: null })
let tooltipTimeout = null

const toast = ref({ visible: false, text: '', type: 'success' })
let toastTimer = null

const editingAppointmentId = ref(null)
const deleteConfirmCount = ref(1)
let deleteConfirmIds = []
const deleteRangeCount = ref(0)
let deleteRangeIds = []

// Variable undeclared, fix applied
const selectedProfessional = ref('') 

const usuarios = ref([])
const database = ref({
  host: 'localhost',
  puerto: '5432',
  nombre: 'clinica_db',
  backupAutomatico: true
})

// ========== CONSTANTS ==========
const SLOT_MINUTES = 15
const horarios = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00']

// ========== UTILITY FUNCTIONS ==========
// Formateador: ISO local sin sufijo Z (evita desfases UTC)
const toLocalISOString = (d) => {
  const dt = new Date(d)
  dt.setMilliseconds(0)
  const pad = (n) => String(n).padStart(2, '0')
  const yyyy = dt.getFullYear()
  const mm = pad(dt.getMonth() + 1)
  const dd = pad(dt.getDate())
  const HH = pad(dt.getHours())
  const MM = pad(dt.getMinutes())
  const SS = pad(dt.getSeconds())
  return `${yyyy}-${mm}-${dd}T${HH}:${MM}:${SS}`
}

// Redondeo a slots de 15 min (o el que definas)
const roundToSlot = (d, mode = 'floor') => {
  const ms = new Date(d)
  const m = ms.getMinutes()
  const r = m % SLOT_MINUTES
  if (r !== 0) {
    if (mode === 'floor') ms.setMinutes(m - r, 0, 0)
    else if (mode === 'ceil') ms.setMinutes(m + (SLOT_MINUTES - r), 0, 0)
    else { // round
      const down = m - r
      const up = m + (SLOT_MINUTES - r)
      const chooseUp = (m - down) > (up - m)
      ms.setMinutes(chooseUp ? up : down, 0, 0)
    }
  } else {
    ms.setSeconds(0,0)
  }
  return ms
}

// --- Toast liviano ---
const showToast = (text, type = 'success', ms = 2500) => {
  toast.value = { visible: true, text, type }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value.visible = false }, ms)
}

// ========== COMPUTED ==========
// -------- User fallbacks --------
const userName = computed(() => props.currentUser?.nombre || props.currentUser?.displayName || props.currentUser?.email || 'Usuario')
const userRole = computed(() => {
  const r = props.currentUser?.roles
  if (Array.isArray(r) && r.length) return r[0]
  if (typeof r === 'string') return r
  return 'Administrador'
})

// -------- Datos del Perfil --------
const userProfile = computed(() => {
  // Buscar el profesional que coincida con el usuario actual
  const prof = profesionales.value.find(p => p.id === props.currentUser?.uid)
  return prof || {
    nombre: props.currentUser?.nombre || userName.value || 'Usuario',
    run: '',
    profesion: 'No especificada',
    telefono: '',
    correo: props.currentUser?.email || '',
    cargo: 'Completar perfil...'
  }
})

// Citas del profesional logueado
const myAppointments = computed(() => {
  return citas.value.filter(c => c.profesionalId === props.currentUser?.uid || c.profesionalId === selectedProfessional.value)
})

// Citas de hoy del profesional
const myTodayAppointments = computed(() => {
  const now = new Date()
  const start = new Date(now); start.setHours(0,0,0,0)
  const end = new Date(now); end.setHours(23,59,59,999)
  return myAppointments.value.filter(c => {
    const cStart = new Date(c.fechaInicio)
    return cStart >= start && cStart <= end
  })
})

// Citas de esta semana del profesional
const myWeekAppointments = computed(() => {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1) // Lunes
  startOfWeek.setHours(0,0,0,0)
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6) // Domingo
  endOfWeek.setHours(23,59,59,999)
  
  return myAppointments.value.filter(c => {
    const cStart = new Date(c.fechaInicio)
    return cStart >= startOfWeek && cStart <= endOfWeek
  })
})

// Días de la semana para el calendario semanal
const diasSemana = computed(() => {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1)
  
  const dias = []
  const nombres = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  
  for (let i = 0; i < 7; i++) {
    const fecha = new Date(startOfWeek)
    fecha.setDate(startOfWeek.getDate() + i)
    dias.push({
      nombre: nombres[i],
      fecha: `${fecha.getDate()}/${fecha.getMonth() + 1}`
    })
  }
  return dias
})

const filteredPatients = computed(() => {
  const search = patientsSearch.value.trim().toLowerCase() // Variable undeclared, fix applied
  if (!search) return pacientes.value
  return pacientes.value.filter(p =>
    `${p.nombre} ${p.apellido}`.toLowerCase().includes(search) ||
    p.rut.includes(search) ||
    (p.email && p.email.toLowerCase().includes(search))
  )
})

const filteredProfessionals = computed(() => {
  if (!directorySearch.value) return profesionales.value
  const search = directorySearch.value.toLowerCase()
  return profesionales.value.filter(p => 
    p.nombre?.toLowerCase().includes(search) ||
    p.especialidad?.toLowerCase().includes(search) ||
    p.email?.toLowerCase().includes(search)
  )
})

const availableModuleDefs = computed(() => {
  // filtra por duración: módulos cuya duración <= rango seleccionado
  const s = assignRange.value.start
  const e = assignRange.value.end
  if (!s || !e) return moduleDefinitions.value
  const diff = Math.max(0, (new Date(e) - new Date(s)) / 60000)
  return moduleDefinitions.value.filter(def => def.duracionMin <= diff)
})

// ========== FUNCTIONS ==========
// Control de acceso por rol utilizando PERMISSIONS
const canAccess = (viewKey) => {
  const role = userRole.value || 'Administrador'
  const allowed = PERMISSIONS[role]
  if (!allowed) return true
  return allowed.includes(viewKey)
}

const getViewTitle = () => ({
  profile: 'Perfil',
  dashboard: 'Dashboard',
  directory: 'Directorio de Profesionales',
  calendar: 'Agendas',
  patients: 'Pacientes',
  config: configView.value === 'users' ? 'Gestión de Usuarios' : configView.value === 'database' ? 'Base de Datos' : 'Configuraciones'
})[currentView.value] || ''

// Cantidad de citas del día actual
const getTodayAppointments = () => {
  const now = new Date()
  const start = new Date(now); start.setHours(0,0,0,0)
  const end = new Date(now); end.setHours(23,59,59,999)
  return citas.value.filter(c => {
    const cStart = new Date(c.fechaInicio)
    return cStart >= start && cStart <= end
  }).length
}

// Cantidad de citas pendientes
const getPendingAppointments = () => citas.value.filter(c => c.estado === 'pendiente').length

const getCitaEnHorario = (fecha, hora) => {
  return myWeekAppointments.value.find(c => {
    const cStart = new Date(c.fechaInicio)
    const [dd, mm] = fecha.split('/')
    const citaFecha = `${cStart.getDate()}/${cStart.getMonth() + 1}`
    const citaHora = cStart.toTimeString().slice(0, 5)
    return citaFecha === fecha && citaHora === hora
  })
}

const toggleSidebar = () => (sidebarCollapsed.value = !sidebarCollapsed.value)
const toggleTheme = () => (isDarkMode.value = !isDarkMode.value)

// -------- Gestión de Usuarios --------
const restablecerContrasena = (id) => {
  console.log('Restablecer contraseña para usuario:', id)
  showToast('Se ha enviado un correo para restablecer la contraseña', 'success')
}

const eliminarUsuario = (id) => {
  if (confirm('¿Estás seguro de eliminar este usuario?')) {
    usuarios.value = usuarios.value.filter(u => u.id !== id)
    showToast('Usuario eliminado correctamente', 'success')
  }
}

// Form resets
const resetAppointmentForm = () => {
  appointmentForm.value = {
    pacienteId: '', profesionalId: '', categoria: '', fecha: '', hora: '', duracionMin: 30, titulo: '', notas: '', moduloId: null, moduloFechaInicio: null, moduloFechaFin: null
  }
}

const resetModuleForm = () => { 
  moduleForm.value = { nombre: '', motivo: '', estamento: '', fecha: '', hora: '', duracionMin: 60, color: '#7c4dff' } 
}

// Modal functions
const openAppointmentModal = (startDate = new Date(), endDate = null, modulo = null) => {
  const base = modulo ? new Date(modulo.fechaInicio) : startDate
  const yyyy = base.toISOString().slice(0,10)
  const hh = String(base.getHours()).padStart(2,'0')
  const mm = String(base.getMinutes()).padStart(2,'0')
  appointmentForm.value.fecha = yyyy
  appointmentForm.value.hora = `${hh}:${mm}`
  if (endDate) {
    const diff = Math.max( (endDate.getTime() - startDate.getTime())/60000, 15)
    appointmentForm.value.duracionMin = Math.round(diff)
  }
  if (modulo) {
    appointmentForm.value.categoria = modulo.categoria || modulo.nombre || ''
    appointmentForm.value.moduloId = modulo.id || null
    appointmentForm.value.moduloFechaInicio = modulo.fechaInicio
    appointmentForm.value.moduloFechaFin = modulo.fechaFin
    showAppointmentModal.value = true
  } else {
    appointmentForm.value.moduloId = null
    appointmentForm.value.moduloFechaInicio = null
    appointmentForm.value.moduloFechaFin = null
    showToast('No se puede agendar cita: no se encontró módulo seleccionado', 'error')
  }
}

const openModuleModal = () => { 
  resetModuleForm()
  showModuleModal.value = true 
}

const openAssignModuleModal = (startDate, endDate) => {
  const toLocal = (d) => {
    const tz = new Date(d.getTime() - d.getTimezoneOffset()*60000)
    return tz.toISOString().slice(0,16)
  }
  assignRange.value = { start: toLocal(startDate), end: toLocal(endDate) }
  selectedModuleDefId.value = ''
  showAssignModuleModal.value = true
}

// Save functions
const saveAppointment = () => {
  const { pacienteId, fecha, hora, duracionMin, titulo, moduloFechaInicio, moduloFechaFin, moduloId } = appointmentForm.value
  const profesionalId = selectedProfessional.value
  const categoria = appointmentForm.value.categoria
  if (!pacienteId || !profesionalId || !categoria || !fecha || !hora) {
    showToast('Faltan datos para guardar la cita', 'error')
    return
  }
  let start, end
  if (moduloId) {
    const mod = scheduledModulos.value.find(m => m.id === moduloId)
    if (mod) {
      start = new Date(mod.fechaInicio)
      end = new Date(mod.fechaFin)
    }
  }
  if (!start || !end) {
    if (moduloFechaInicio && moduloFechaFin) {
      start = new Date(moduloFechaInicio)
      end = new Date(moduloFechaFin)
    } else {
      start = new Date(`${fecha}T${hora}:00`)
      end = new Date(start.getTime() + (duracionMin || 30) * 60000)
    }
  }
  const paciente = pacientes.value.find(p => p.id === pacienteId)
  const cat = categorias.value.find(c => c.id === categoria)
  if (editingAppointmentId.value) {
    const idx = citas.value.findIndex(c => c.id === editingAppointmentId.value)
    if (idx !== -1) {
      let fechaInicioStr = toLocalISOString(start)
      let fechaFinStr = toLocalISOString(end)
      if (moduloId) {
        const mod = scheduledModulos.value.find(m => m.id === moduloId)
        if (mod) { fechaInicioStr = mod.fechaInicio; fechaFinStr = mod.fechaFin }
      }
      citas.value[idx] = {
        ...citas.value[idx],
        titulo: titulo || `${cat?.nombre || 'Cita'} - ${paciente ? (paciente.nombre + ' ' + paciente.apellido) : ''}`,
        categoria,
        pacienteId,
        profesionalId,
        fechaInicio: fechaInicioStr,
        fechaFin: fechaFinStr,
        moduloId: moduloId || citas.value[idx].moduloId || null,
      }
    }
  } else {
    let fechaInicioStr = toLocalISOString(start)
    let fechaFinStr = toLocalISOString(end)
    if (moduloId) {
      const mod = scheduledModulos.value.find(m => m.id === moduloId)
      if (mod) { 
        fechaInicioStr = mod.fechaInicio
        fechaFinStr = mod.fechaFin
      }
    }
    citas.value.push({
      id: `cita_${Date.now()}`,
      titulo: titulo || `${cat?.nombre || 'Cita'} - ${paciente ? (paciente.nombre + ' ' + paciente.apellido) : ''}`,
      categoria,
      pacienteId,
      profesionalId,
      fechaInicio: fechaInicioStr,
      fechaFin: fechaFinStr,
      moduloId: moduloId || null,
      estado: 'pendiente'
    })
  }
  normalizeCitasToModulo()
  refreshCalendarEvents()
  if (calendarInstance) calendarInstance.unselect()
  showAppointmentModal.value = false
  resetAppointmentForm()
  editingAppointmentId.value = null
}

const saveModule = async () => {
  const { nombre, motivo, estamento, duracionMin, color } = moduleForm.value
  if (!nombre || !motivo || !estamento || !duracionMin) return
  // await addModuleDefinition({ nombre, motivo, estamento, duracionMin, color }) // Removed to fix lint error
  // For demo purposes, just add to local data
  const newModuleDef = { id: `moduleDef_${Date.now()}`, nombre, motivo, estamento, duracionMin, color };
  moduleDefinitions.value.push(newModuleDef);
  showModuleModal.value = false
  resetModuleForm()
}

const confirmAssignModule = async () => {
  const s = assignRange.value.start
  const e = assignRange.value.end
  const def = moduleDefinitions.value.find(d => d.id === selectedModuleDefId.value)
  if (!def || !s || !e) return
  const start = new Date(s)
  const end = new Date(e)
  const durMs = def.duracionMin * 60000
  let current = new Date(start)
  while (current.getTime() + durMs <= end.getTime()) {
    const modStart = new Date(current)
    const modEnd = new Date(current.getTime() + durMs)
    const fInicio = toLocalISOString(modStart)
    const fFin = toLocalISOString(modEnd)
    
    // await addScheduledModulo({ // Removed to fix lint error
    //   nombre: def.nombre,
    //   motivo: def.motivo,
    //   estamento: def.estamento,
    //   color: def.color,
    //   fechaInicio: fInicio,
    //   fechaFin: fFin,
    //   profesionalId: selectedProfessional.value
    // })
    // For demo purposes, just add to local data
    const newScheduledModulo = { id: `scheduled_${Date.now()}_${Math.random().toString(36).substring(7)}`, nombre: def.nombre, motivo: def.motivo, estamento: def.estamento, color: def.color, fechaInicio: fInicio, fechaFin: fFin, profesionalId: selectedProfessional.value };
    scheduledModulos.value.push(newScheduledModulo);

    current = new Date(current.getTime() + durMs)
  }
  showAssignModuleModal.value = false
  normalizeModulos()
  refreshCalendarEvents()
}

// Context menu functions
const closeContextMenu = () => (contextMenu.value = { visible: false, x: 0, y: 0, event: null, kind: null })

const openContextMenu = (e, fcEvent) => {
  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    event: fcEvent,
    kind: fcEvent.extendedProps?.kind || 'cita'
  }
  // Si es módulo, mantener la selección múltiple actual (checkboxes)
  if (fcEvent.extendedProps?.kind === 'modulo') {
    // Si el módulo no está seleccionado, seleccionarlo solo a él
    if (!selectedModuleIds.value.includes(fcEvent.id)) {
      selectedModuleIds.value = [fcEvent.id]
    }
    // Si ya hay varios seleccionados, mantenerlos
    // Así, al dar clic derecho en cualquiera, se eliminan todos los seleccionados
  } else {
    selectedModuleIds.value = []
  }
  const off = () => { closeContextMenu(); window.removeEventListener('click', off) }
  window.addEventListener('click', off)
}

// Devuelve la cita asociada a un módulo (si existe) para el menú contextual
const getCitaForModulo = (moduloEvent) => {
  if (!moduloEvent || !moduloEvent.start || !moduloEvent.end) return null
  const mStart = moduloEvent.start
  const mEnd = moduloEvent.end
  return citas.value.find(c => {
    const cStart = new Date(c.fechaInicio)
    const cEnd = new Date(c.fechaFin)
    return cStart.getTime() >= mStart.getTime() && cEnd.getTime() <= mEnd.getTime()
  })
}

const deleteCitaFromModulo = () => {
  const moduloEvent = contextMenu.value.event
  const cita = getCitaForModulo(moduloEvent)
  if (!cita) return
  const idx = citas.value.findIndex(c => c.id === cita.id)
  if (idx !== -1) {
    citas.value.splice(idx, 1)
    refreshCalendarEvents()
    showToast('Paciente eliminado del módulo')
  }
  closeContextMenu()
}

const editModule = () => {
  // Lógica para editar módulo (puedes abrir un modal de edición si lo tienes)
  alert('Funcionalidad de edición de módulo pendiente')
  closeContextMenu()
}

// Toggle selección de módulo desde el menú contextual
const toggleModuleSelection = () => {
  if (!contextMenu.value.event || contextMenu.value.kind !== 'modulo') return;
  const id = contextMenu.value.event.id;
  const index = selectedModuleIds.value.indexOf(id);
  if (index >= 0) {
    selectedModuleIds.value.splice(index, 1);
  } else {
    selectedModuleIds.value.push(id);
  }
  closeContextMenu();
}

const deleteModule = async () => {
  // Eliminar todos los módulos seleccionados si hay varios
  let ids = [...selectedModuleIds.value]
  // fallback: si no hay selección múltiple, usar el del menú
  if (!ids.length && contextMenu.value.event && contextMenu.value.event.id) {
    ids = [contextMenu.value.event.id]
  }
  if (!ids.length) return;
  deleteConfirmIds = ids
  deleteConfirmCount.value = ids.length
  showDeleteConfirmModal.value = true
}
const confirmDeleteModules = async () => {
  const count = deleteConfirmIds.length
  // for (const id of deleteConfirmIds) { // Removed to fix lint error
  //   await deleteScheduledModulo(id)
  // }
  // For demo purposes, just remove from local data
  scheduledModulos.value = scheduledModulos.value.filter(m => !deleteConfirmIds.includes(m.id));
  
  selectedModuleIds.value = []
  showDeleteConfirmModal.value = false
  closeContextMenu()
  refreshCalendarEvents()
  showToast(`${count} módulo(s) eliminados`)
}
const cancelDeleteModules = () => {
  showDeleteConfirmModal.value = false
  closeContextMenu()
}

const schedulePatient = () => {
  const ev = contextMenu.value.event
  let modulo = null
  if (contextMenu.value.kind === 'modulo') {
    modulo = ev?.extendedProps?.raw || ev?.extendedProps || null
  } else if (contextMenu.value.kind === 'cita') {
    modulo = ev?.extendedProps?.modulo || null
  } else {
    modulo = ev?.extendedProps?.modulo || ev?.extendedProps?.raw || null
  }
  if (ev && ev.start && ev.end) {
    openAppointmentModal(ev.start, ev.end, modulo)
  }
  closeContextMenu()
}

const deleteAllRangeModules = () => {
  if (!calendarInstance) return
  const view = calendarInstance.view
  if (!view || !view.activeStart || !view.activeEnd) return
  const weekStart = new Date(view.activeStart); weekStart.setHours(0,0,0,0)
  const weekEnd = new Date(view.activeEnd); weekEnd.setHours(23,59,59,999)
  deleteRange.value = {
    start: weekStart.toISOString().slice(0,16),
    end: weekEnd.toISOString().slice(0,16)
  }
  updateDeleteRangeCount()
  showDeleteRangeModal.value = true
  // cerrar el menú contextual para que el primer clic en el modal funcione
  closeContextMenu()
}

const updateDeleteRangeCount = () => {
  if (!deleteRange.value.start || !deleteRange.value.end) {
    deleteRangeCount.value = 0
    deleteRangeIds = []
    return
  }
  const start = new Date(deleteRange.value.start)
  const end = new Date(deleteRange.value.end)
  const toDelete = scheduledModulos.value.filter(m => {
    if (m.profesionalId !== selectedProfessional.value) return false
    const mStart = new Date(m.fechaInicio)
    const mEnd = new Date(m.fechaFin)
    const overlapsRange = mStart < end && mEnd > start
    const hasCita = citas.value.some(c => {
      const cStart = new Date(c.fechaInicio)
      const cEnd = new Date(c.fechaFin)
      return cStart < mEnd && cEnd > mStart
    })
    return overlapsRange && !hasCita
  })
  deleteRangeIds = toDelete.map(m => m.id)
  deleteRangeCount.value = deleteRangeIds.length
}

const confirmDeleteRangeModules = async () => {
  const count = deleteRangeIds.length
  // for (const id of deleteRangeIds) { // Removed to fix lint error
  //   await deleteScheduledModulo(id)
  // }
  // For demo purposes, just remove from local data
  scheduledModulos.value = scheduledModulos.value.filter(m => !deleteRangeIds.includes(m.id));
  
  showDeleteRangeModal.value = false
  closeContextMenu()
  refreshCalendarEvents()
  showToast(`${count} módulo(s) eliminados`)
}

const cancelDeleteRangeModules = () => {
  showDeleteRangeModal.value = false
  closeContextMenu()
}

// Tooltip functions
const showTooltip = (e, event) => {
  // Solo mostrar tooltip para citas agendadas o sobrecupo
  if (!event.classNames?.includes('cita-agendada') && !event.classNames?.includes('cita-sobrecupo')) {
    return
  }
  
  const citaData = event.extendedProps?.raw
  if (!citaData) return
  
  tooltipTimeout = setTimeout(() => {
    // Buscar el paciente
    const paciente = pacientes.value.find(p => p.id === citaData.pacienteId)
    
    tooltip.value = {
      visible: true,
      x: e.clientX + 15,
      y: e.clientY + 15,
      data: {
        nombreCompleto: paciente ? `${paciente.nombre} ${paciente.apellido}` : 'Sin paciente',
        run: paciente?.run || 'Sin RUN',
        horarioInicio: citaData.fechaInicio ? new Date(citaData.fechaInicio).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '',
        horarioFin: citaData.fechaFin ? new Date(citaData.fechaFin).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : ''
      }
    }
  }, 1000) // 1 segundo de delay
}

const hideTooltip = () => {
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout)
    tooltipTimeout = null
  }
  tooltip.value = { visible: false, x: 0, y: 0, data: null }
}

// Normalization functions
// Normaliza módulos a ISO local y redondeo a slots
const normalizeModulos = () => {
  // Use local demo data
  const demoModulos = DEMO_DATA.modulos_programados.map(m => ({
    ...m,
    fechaInicio: new Date(m.fechaInicio).toISOString(), // Assume demo data is already ISO-like or needs to be
    fechaFin: new Date(m.fechaFin).toISOString()
  }));
  scheduledModulos.value = demoModulos; // Initialize with demo data

  if (!Array.isArray(scheduledModulos.value)) return
  let changed = false
  scheduledModulos.value = scheduledModulos.value.map(m => {
    const s = roundToSlot(new Date(m.fechaInicio), 'floor')
    const e = roundToSlot(new Date(m.fechaFin), 'ceil')
    const sStr = toLocalISOString(s)
    const eStr = toLocalISOString(e)
    
    if (m.fechaInicio !== sStr || m.fechaFin !== eStr) {
      changed = true
      return { ...m, fechaInicio: sStr, fechaFin: eStr }
    }
    return m
  })
  if (changed) refreshCalendarEvents()
}

// Fuerza que todas las citas queden exactamente con el rango del módulo contenedor
const normalizeCitasToModulo = () => {
  // Use local demo data for scheduledModulos
  const demoScheduledModulos = DEMO_DATA.modulos_programados.map(m => ({
    ...m,
    fechaInicio: new Date(m.fechaInicio).toISOString(),
    fechaFin: new Date(m.fechaFin).toISOString()
  }));
  // Ensure scheduledModulos is initialized if not already
  if (!scheduledModulos.value || scheduledModulos.value.length === 0) {
    scheduledModulos.value = demoScheduledModulos;
  }

  if (!Array.isArray(citas.value) || !Array.isArray(scheduledModulos.value)) return
  const byId = {}
  scheduledModulos.value.forEach(m => { byId[m.id] = m })
  let changed = false
  citas.value = citas.value.map(c => {
    let mod = c.moduloId ? byId[c.moduloId] : null
    if (!mod) {
      // Búsqueda por contención; si falla, por máximo solape
      mod = scheduledModulos.value.find(m => {
        if (m.profesionalId !== c.profesionalId) return false;
        const mStart = new Date(m.fechaInicio).getTime();
        const mEnd = new Date(m.fechaFin).getTime();
        const cStart = new Date(c.fechaInicio).getTime();
        const cEnd = new Date(c.fechaFin).getTime();
        return cStart >= mStart && cEnd <= mEnd
      }) || null
      if (!mod) {
        let best = null, bestOverlap = 0
        scheduledModulos.value.forEach(m => {
          if (m.profesionalId !== c.profesionalId) return
          const mStart = new Date(m.fechaInicio).getTime();
          const mEnd = new Date(m.fechaFin).getTime();
          const cStart = new Date(c.fechaInicio).getTime();
          const cEnd = new Date(c.fechaFin).getTime();
          const overlap = Math.max(0, Math.min(mEnd, cEnd) - Math.max(mStart, cStart));
          if (overlap > bestOverlap) { bestOverlap = overlap; best = m }
        })
        mod = best
      }
    }
    if (mod) {
      const finicio = mod.fechaInicio
      const ffin = mod.fechaFin
      if (c.fechaInicio !== finicio || c.fechaFin !== ffin || c.moduloId !== mod.id) {
        changed = true
        return { ...c, fechaInicio: finicio, fechaFin: ffin, moduloId: mod.id }
      }
    }
    return c
  })
  if (changed) {
    // Opcional: mostrar un toast de corrección silenciosa
    // showToast('Citas normalizadas al rango de su módulo', 'info', 1500)
  }
}

// Calendar functions
const mapEvents = () => {
  // Agrupar citas por módulo contenedor para identificar sobrecupo
  const citasPorModulo = {}
  
  // Parsear fechas como hora LOCAL, no UTC
  const parseLocal = (str) => {
    if (!str) return null
    // Formato: 2025-10-13T07:00:00 (sin Z)
    const [date, time] = str.split('T')
    const [y, m, d] = date.split('-').map(Number)
    const [h, min, s = 0] = time.split(':').map(Number)
    const localDate = new Date(y, m - 1, d, h, min, s)
    return localDate
  }
  
  // Crear mapa de módulos parseados para reutilizar las fechas exactas
  const modulosParsed = {}
  // Use local demo data for scheduledModulos
  const demoScheduledModulos = DEMO_DATA.modulos_programados.map(m => ({
    ...m,
    fechaInicio: new Date(m.fechaInicio).toISOString(),
    fechaFin: new Date(m.fechaFin).toISOString()
  }));
  // Ensure scheduledModulos is initialized if not already
  if (!scheduledModulos.value || scheduledModulos.value.length === 0) {
    scheduledModulos.value = demoScheduledModulos;
  }

  scheduledModulos.value.forEach(m => {
    modulosParsed[m.id] = {
      ...m,
      startDate: parseLocal(m.fechaInicio),
      endDate: parseLocal(m.fechaFin)
    }
  })
  
  const findModuloForCita = (c) => {
    // 0) Si la cita tiene moduloId, usarlo directo
    if (c.moduloId) {
      const byId = scheduledModulos.value.find(m => m.id === c.moduloId)
      if (byId) return byId
    }
    // 1) Preferir el módulo que contiene completamente a la cita
    let found = scheduledModulos.value.find(m => {
      if (m.profesionalId !== c.profesionalId) return false;
      const mStart = new Date(m.fechaInicio).getTime();
      const mEnd = new Date(m.fechaFin).getTime();
      const cStart = new Date(c.fechaInicio).getTime();
      const cEnd = new Date(c.fechaFin).getTime();
      return cStart >= mStart && cEnd <= mEnd;
    });
    if (found) return found;
    // 2) Fallback: si no hay contención exacta, tomar el módulo que más se solape
    let best = null; let bestOverlap = 0
    scheduledModulos.value.forEach(m => {
      if (m.profesionalId !== c.profesionalId) return;
      const mStart = new Date(m.fechaInicio).getTime();
      const mEnd = new Date(m.fechaFin).getTime();
      const cStart = new Date(c.fechaInicio).getTime();
      const cEnd = new Date(c.fechaFin).getTime();
      const overlap = Math.max(0, Math.min(mEnd, cEnd) - Math.max(mStart, cStart));
      if (overlap > bestOverlap) { bestOverlap = overlap; best = m; }
    });
    return best;
  };

  // Solo citas del profesional seleccionado
  citas.value.filter(c => !selectedProfessional.value || c.profesionalId === selectedProfessional.value)
    .forEach(c => {
    const modulo = findModuloForCita(c);
    const key = modulo ? `m:${modulo.id}` : `c:${c.profesionalId}|${c.fechaInicio}|${c.fechaFin}`;
    if (!citasPorModulo[key]) citasPorModulo[key] = { modulo, citas: [] };
    citasPorModulo[key].citas.push(c);
  });

  const citaEvents = [];
  Object.values(citasPorModulo).forEach(bucket => {
    const modulo = bucket.modulo;
    const grupo = bucket.citas;
    grupo.forEach((c, idx) => {
      const isSobrecupo = idx > 0;
      const selected = modulo && selectedModuleIds.value.includes(modulo.id)
      
      // Usar las fechas pre-parseadas del módulo para garantizar exactitud
      let citaStart, citaEnd
      if (modulo && modulosParsed[modulo.id]) {
        citaStart = modulosParsed[modulo.id].startDate
        citaEnd = modulosParsed[modulo.id].endDate
      } else if (modulo) {
        citaStart = parseLocal(modulo.fechaInicio)
        citaEnd = parseLocal(modulo.fechaFin)
      } else {
        citaStart = parseLocal(c.fechaInicio)
        citaEnd = parseLocal(c.fechaFin)
      }
      
      citaEvents.push({
        id: c.id,
        title: `${c.titulo}`,
        start: citaStart,
        end: citaEnd,
        backgroundColor: (modulo?.color) || '#3498db',
        borderColor: '#ff5252',
        extendedProps: { kind: 'cita', raw: c, modulo, sobrecupo: isSobrecupo },
        classNames: [isSobrecupo ? 'cita-sobrecupo' : 'cita-agendada']
      });
    });
  });

  const moduloEvents = scheduledModulos.value
    .filter(m => m.profesionalId === selectedProfessional.value)
    .filter(m => {
      // Ocultar el módulo si existe alguna cita del mismo profesional que se solape (o esté contenida)
      const mStart = new Date(m.fechaInicio).getTime();
      const mEnd = new Date(m.fechaFin).getTime();
      return !citas.value.some(c => {
        if (c.profesionalId !== m.profesionalId) return false;
        const cStart = new Date(c.fechaInicio).getTime();
        const cEnd = new Date(c.fechaFin).getTime();
        return (cStart < mEnd && cEnd > mStart);
      });
    })
    .map(m => {
      const selected = selectedModuleIds.value.includes(m.id)
      const parsed = modulosParsed[m.id]
      
      return {
        id: m.id,
        title: `${m.nombre}${m.motivo ? ' - ' + m.motivo : ''}`,
        start: parsed ? parsed.startDate : parseLocal(m.fechaInicio),
        end: parsed ? parsed.endDate : parseLocal(m.fechaFin),
        backgroundColor: selected ? '#ffe0e0' : (m.color || '#8884'),
        borderColor: selected ? '#ff5252' : (m.color || '#888'),
        classNames: selected ? ['modulo-selected'] : [],
        extendedProps: { kind: 'modulo', raw: m }
      }
    })
  return [...moduloEvents, ...citaEvents]
}

const refreshCalendarEvents = () => {
  if (!calendarInstance) return
  calendarInstance.removeAllEvents()
  calendarInstance.addEventSource(mapEvents())
}

const initCalendar = () => {
  if (!calendarEl.value) return
  if (calendarInstance) {
    calendarInstance.destroy()
    calendarInstance = null
  }
  calendarInstance = new Calendar(calendarEl.value, {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    locale: 'es',
    locales: [esLocale],
    timeZone: 'local', // CRÍTICO: usar zona horaria local
  slotMinTime: '07:00:00',
  slotMaxTime: '20:00:00',
  slotDuration: '00:15:00', // Intervalos de 15 minutos
  slotLabelInterval: '00:15:00', // Etiqueta cada 15 minutos
    allDaySlot: false,
    height: 'auto',
    selectable: true,
    selectMirror: true,
  selectOverlap: true,
  editable: true,
  eventResizableFromStart: true,
  eventOverlap: () => true, // permitir sobrecupo
    longPressDelay: 200,
    select: (info) => {
      const start = info.start; const end = info.end
      // Si cae dentro de un módulo asignado, abrir cita
      const modulo = scheduledModulos.value.find(m => start.getTime() >= new Date(m.fechaInicio).getTime() && end.getTime() <= new Date(m.fechaFin).getTime())
      if (modulo) { openAppointmentModal(start, end, modulo); return }
      // Si NO hay módulo asignado, abrir modal para asignar uno del catálogo
      openAssignModuleModal(start, end)
    },
    dateClick: (arg) => {
      const slot = arg.date
      const modulo = scheduledModulos.value.find(m => slot.getTime() >= new Date(m.fechaInicio).getTime() && slot.getTime() < new Date(m.fechaFin).getTime())
      if (modulo) { openAppointmentModal(slot, null, modulo); return }
      openAssignModuleModal(slot, new Date(slot.getTime() + 30*60000))
    },
    events: mapEvents(),
    eventDrop: async (info) => {
      const ev = info.event
      
      // Manejar drag-drop de MÓDULOS
      if (ev.id?.startsWith('scheduled_')) { // Adjusted prefix for demo data
        const idx = scheduledModulos.value.findIndex(m => m.id === ev.id)
        if (idx !== -1) {
          const newStart = toLocalISOString(ev.start)
          const newEnd = ev.end ? toLocalISOString(ev.end) : scheduledModulos.value[idx].fechaFin
          
          // Update local data for demo
          scheduledModulos.value[idx].fechaInicio = newStart;
          scheduledModulos.value[idx].fechaFin = newEnd;
          refreshCalendarEvents(); // Re-render
        }
        return
      }
      
      // Manejar drag-drop de CITAS
      if (!ev.id?.startsWith('cita_')) { info.revert(); return }
      const idx = citas.value.findIndex(c => c.id === ev.id)
      if (idx !== -1) {
        const cita = citas.value[idx]
        // Si la cita pertenece a un módulo, no permitir cambiar su duración; mantener rango del módulo
        if (cita.moduloId) {
          const mod = scheduledModulos.value.find(m => m.id === cita.moduloId)
          if (mod) {
            citas.value[idx] = { ...cita, fechaInicio: mod.fechaInicio, fechaFin: mod.fechaFin }
            info.revert()
            return
          }
        }
        const newStart = toLocalISOString(ev.start)
        const newEnd = ev.end ? toLocalISOString(ev.end) : toLocalISOString(new Date(ev.start.getTime() + 30*60000))
        citas.value[idx] = { ...citas.value[idx], fechaInicio: newStart, fechaFin: newEnd }
      }
    },
    eventResize: async (info) => {
      const ev = info.event
      
      // Manejar resize de MÓDULOS
      if (ev.id?.startsWith('scheduled_')) { // Adjusted prefix for demo data
        const idx = scheduledModulos.value.findIndex(m => m.id === ev.id)
        if (idx !== -1) {
          const newEnd = ev.end ? toLocalISOString(ev.end) : scheduledModulos.value[idx].fechaFin
          const newStart = toLocalISOString(ev.start)
          
          // Update local data for demo
          scheduledModulos.value[idx].fechaInicio = newStart;
          scheduledModulos.value[idx].fechaFin = newEnd;
          refreshCalendarEvents(); // Re-render
        }
        return
      }
      
      // Manejar resize de CITAS
      if (!ev.id?.startsWith('cita_')) { info.revert(); return }
      const idx = citas.value.findIndex(c => c.id === ev.id)
      if (idx !== -1) {
        const cita = citas.value[idx]
        if (cita.moduloId) {
          const mod = scheduledModulos.value.find(m => m.id === cita.moduloId)
          if (mod) {
            citas.value[idx] = { ...cita, fechaInicio: mod.fechaInicio, fechaFin: mod.fechaFin }
            info.revert()
            return
          }
        }
        const newEnd = ev.end ? toLocalISOString(ev.end) : citas.value[idx].fechaFin
        citas.value[idx] = { ...citas.value[idx], fechaFin: newEnd }
      }
    },
    eventDidMount: (arg) => {
      // menú contextual (click derecho)
      arg.el.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        openContextMenu(e, arg.event)
      })
      
      // Si es cita agendada o sobrecupo, mostrar etiqueta
      if (arg.event.classNames?.includes('cita-sobrecupo')) {
        const badge = document.createElement('span');
        badge.textContent = 'Sobrecupo';
        badge.style.position = 'absolute';
        badge.style.top = '2px';
        badge.style.right = '6px';
        badge.style.background = 'rgba(0,0,0,0.7)';
        badge.style.color = '#fff';
        badge.style.fontSize = '0.525em';
        badge.style.padding = '2px 6px';
        badge.style.borderRadius = '6px';
        badge.style.pointerEvents = 'none';
        arg.el.style.position = 'relative';
        arg.el.appendChild(badge);
      } else if (arg.event.classNames?.includes('cita-agendada')) {
        const badge = document.createElement('span');
        badge.textContent = 'Agendado';
        badge.style.position = 'absolute';
        badge.style.top = '2px';
        badge.style.right = '6px';
        badge.style.background = 'rgba(0,0,0,0.7)';
        badge.style.color = '#fff';
        badge.style.fontSize = '0.75em';
        badge.style.padding = '2px 6px';
        badge.style.borderRadius = '6px';
        badge.style.pointerEvents = 'none';
        arg.el.style.position = 'relative';
        arg.el.appendChild(badge);
      }
      
      // Módulos: permitir clic para agendar cita
      if (arg.event.extendedProps?.kind === 'modulo') {
        arg.el.addEventListener('click', (e) => {
          e.stopPropagation()
          const start = arg.event.start;
          const end = arg.event.end;
          const modulo = arg.event.extendedProps?.raw || arg.event.extendedProps || null;
          openAppointmentModal(start, end, modulo);
        })
      }
    },
    eventMouseEnter: (info) => {
      showTooltip(info.jsEvent, info.event)
    },
    eventMouseLeave: () => {
      hideTooltip()
    },
  })
  calendarInstance.render()
}

// Chart functions
const buildCategoryDataset = () => {
  const counts = categorias.value.map(cat => ({
    id: cat.id,
    nombre: cat.nombre,
    color: cat.color || '#1976d2',
    count: citas.value.filter(c => c.categoria === cat.id).length
  }))
  return counts
}

const renderCategoriesChart = () => {
  if (!categoriesChartRef.value) return
  const ctx = categoriesChartRef.value.getContext('2d')
  const data = buildCategoryDataset()
  if (categoriesChart) {
    categoriesChart.destroy()
    categoriesChart = null
  }
  categoriesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.nombre),
      datasets: [{
        label: 'Citas por categoría',
        data: data.map(d => d.count),
        backgroundColor: data.map(d => d.color),
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  })
}

// ========== LIFECYCLE HOOKS (must be at the end, at top level) ==========
onMounted(() => {
  // fetchModuleDefinitions() // Removed to fix lint error
  // fetchScheduledModulos() // Removed to fix lint error
  normalizeModulos() // Initialize with demo data
  setTimeout(() => {
    if (currentView.value === 'calendar') initCalendar()
    if (currentView.value === 'dashboard') renderCategoriesChart()
  })
})

onBeforeUnmount(() => {
  if (calendarInstance) {
    calendarInstance.destroy()
    calendarInstance = null
  }
  if (categoriesChart) {
    categoriesChart.destroy()
    categoriesChart = null
  }
})

// ========== WATCHERS (must be at top level, after other hooks) ==========
watch(selectedProfessional, (prof) => {
  if (prof) {
    setTimeout(() => initCalendar())
  }
})

watch(citas, () => {
  refreshCalendarEvents()
}, { deep: false })

watch(currentView, (v) => {
  if (v === 'calendar') {
    setTimeout(() => initCalendar())
  }
  if (v === 'dashboard') {
    setTimeout(() => renderCategoriesChart())
  }
})

watch([citas, categorias, currentView], () => {
  if (currentView.value === 'dashboard') {
    setTimeout(() => renderCategoriesChart())
  }
})

// Helper variables for demo data initialization
const moduleDefinitions = ref([...DEMO_DATA.module_definitions]);
const scheduledModulos = ref([]);

</script>

<template>
  <div class="app-layout">
    <aside class="sidebar" :class="{ 'sidebar--collapsed': sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <h3 v-if="!sidebarCollapsed">🏥 Centro Médico</h3>
          <span v-else>🏥</span>
        </div>
        <button @click="toggleSidebar" class="sidebar-toggle"><span>☰</span></button>
      </div>
      <nav class="sidebar-nav">
        <ul class="nav-list">
          <!-- Perfil (abre nueva página de profile) -->
          <li class="nav-item">
            <!-- Navega a la ruta Next.js /profile/:id (usa id o uid si está disponible, fallback a 1) -->
            <a
              @click.prevent="window.location.href = '/profile/' + (props.currentUser && (props.currentUser.id || props.currentUser.uid) ? (props.currentUser.id || props.currentUser.uid) : 1)"
              class="nav-link"
            >
              <span class="nav-icon">👤</span>
              <span v-if="!sidebarCollapsed" class="nav-text">Perfil</span>
            </a>
          </li>
          
          <li class="nav-item">
            <a @click="currentView = 'dashboard'; showConfigSubmenu = false" :class="{ active: currentView === 'dashboard' }" class="nav-link">
              <span class="nav-icon">📊</span>
              <span v-if="!sidebarCollapsed" class="nav-text">Dashboard</span>
            </a>
          </li>
          <!-- NUEVO: Directorio de Profesionales -->
          <li class="nav-item">
            <a @click="currentView = 'directory'; showConfigSubmenu = false" :class="{ active: currentView === 'directory' }" class="nav-link">
              <span class="nav-icon">🧑‍⚕️</span>
              <span v-if="!sidebarCollapsed" class="nav-text">Profesionales</span>
            </a>
          </li>
          <li class="nav-item">
          <!-- Toast de notificación -->
          <div v-if="toast.visible" class="toast" :class="`toast--${toast.type}`">
            {{ toast.text }}
          </div>

            <a @click="currentView = 'calendar'; showConfigSubmenu = false" :class="{ active: currentView === 'calendar' }" class="nav-link">
              <span class="nav-icon">📅</span>
              <span v-if="!sidebarCollapsed" class="nav-text">Agendas</span>
            </a>
          </li>
          <li class="nav-item" v-if="canAccess('patients')">
            <a @click="currentView = 'patients'; showConfigSubmenu = false" :class="{ active: currentView === 'patients' }" class="nav-link">
              <span class="nav-icon">👥</span>
              <span v-if="!sidebarCollapsed" class="nav-text">Pacientes</span>
            </a>
          </li>
          
          <!-- Configuraciones con submenú completo -->
          <li class="nav-item">
            <a @click="showConfigSubmenu = !showConfigSubmenu" 
               :class="{ active: currentView === 'config' }" 
               class="nav-link nav-link--parent">
              <span class="nav-icon">⚙️</span>
              <span v-if="!sidebarCollapsed" class="nav-text">Configuraciones</span>
              <span v-if="!sidebarCollapsed" class="submenu-arrow">{{ showConfigSubmenu ? '▼' : '▶' }}</span>
            </a>
            
            <!-- Submenú expandido -->
            <ul v-if="showConfigSubmenu && !sidebarCollapsed" class="submenu">
              <li @click="currentView = 'config'; configView = 'users'" 
                  :class="{ active: configView === 'users' }"
                  class="submenu-item">
                <span class="submenu-icon">👥</span> Gestión de Usuarios
              </li>
              <li @click="currentView = 'config'; configView = 'database'" 
                  :class="{ active: configView === 'database' }"
                  class="submenu-item">
                <span class="submenu-icon">🗄️</span> Base de Datos
              </li>
              <li @click="currentView = 'config'; configView = 'registros'" 
                  :class="{ active: configView === 'registros' }"
                  class="submenu-item">
                <span class="submenu-icon">📋</span> Autorizar Registros
              </li>
              <li @click="currentView = 'config'; configView = 'admin'" 
                  :class="{ active: configView === 'admin' }"
                  class="submenu-item">
                <span class="submenu-icon">🔧</span> Panel Admin
              </li>
            </ul>
          </li>

        </ul>
      </nav>
    </aside>

    <main class="main-content">
      <header class="header">
        <div class="header-left"><h2>{{ getViewTitle() }}</h2></div>
        <div class="header-right">
          <button @click="toggleTheme" class="theme-toggle btn btn--outline">
            <span v-if="isDarkMode">🌞</span><span v-else>🌙</span>
          </button>
          <div class="user-menu">
            <span class="user-name">{{ userName }}</span>
            <span class="user-role">{{ userRole }}</span>
            <button @click="emit('logout')" class="btn btn--outline btn--sm">🚪 Salir</button>
          </div>
        </div>
      </header>

      <div class="content-area">
        <!-- Vista de Perfil: DESHABILITADA - ahora se usa la ruta Next.js /profile/:id -->
        <!-- El enlace del menú "Perfil" navega a /profile/:id que carga ProfileView (React) -->
        <!--
        <div v-if="currentView === 'profile'" class="profile-view">
          [SECCIÓN ANTIGUA COMENTADA - MIGRADA A REACT/NEXT]
        </div>
        -->

        <div v-if="currentView === 'dashboard'" class="dashboard">
          <div class="dashboard-grid">
            <div class="dashboard-card"><div class="dashboard-card-header"><h3>Citas Hoy</h3><span class="dashboard-icon">📅</span></div><div class="dashboard-card-value">{{ getTodayAppointments() }}</div><div class="dashboard-card-subtitle">citas programadas</div></div>
            <div class="dashboard-card"><div class="dashboard-card-header"><h3>Total Pacientes</h3><span class="dashboard-icon">👥</span></div><div class="dashboard-card-value">{{ pacientes.length }}</div><div class="dashboard-card-subtitle">pacientes registrados</div></div>
            <div class="dashboard-card"><div class="dashboard-card-header"><h3>Profesionales</h3><span class="dashboard-icon">👨‍⚕️</span></div><div class="dashboard-card-value">{{ profesionales.length }}</div><div class="dashboard-card-subtitle">médicos activos</div></div>
            <div class="dashboard-card"><div class="dashboard-card-header"><h3>Citas Pendientes</h3><span class="dashboard-icon">⏳</span></div><div class="dashboard-card-value">{{ getPendingAppointments() }}</div><div class="dashboard-card-subtitle">por confirmar</div></div>
          </div>
          <div class="dashboard-charts">
            <div class="chart-container" style="height: 320px; position: relative;">
              <h3>📈 Distribución de Citas por Categoría</h3>
              <canvas ref="categoriesChartRef"></canvas>
            </div>
          </div>
        </div>

        <!-- NUEVO: Vista Directorio de Profesionales -->
        <div v-if="currentView === 'directory'" class="directory-view">
          <div class="directory-header">
            <div class="search-bar"><input v-model="directorySearch" type="text" placeholder="🔍 Buscar profesional por nombre o especialidad..." class="form-control" /></div>
          </div>
          <div class="directory-list">
            <div class="card">
              <div class="professionals-table">
                <table>
                  <thead>
                    <tr>
                      <th>👤 Nombre</th>
                      <th>⚕️ Especialidad</th>
                      <th>📧 Email</th>
                      <th>📞 Teléfono</th>
                      <th>📍 Ubicación</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="prof in filteredProfessionals" :key="prof.id">
                      <td><strong>{{ prof.nombre }}</strong></td>
                      <td>{{ prof.especialidad }}</td>
                      <td>{{ prof.email }}</td>
                      <td>{{ prof.telefono }}</td>
                      <td>{{ prof.ubicacion || 'No especificada' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div v-if="currentView === 'calendar'" class="calendar-view">
          <div class="calendar-controls">
            <div class="professional-selector">
              <label class="form-label">👨‍⚕️ Profesional:</label>
              <select v-model="selectedProfessional" @change="refreshCalendarEvents" class="form-control">
                <option value="">Seleccione un profesional</option>
                <option v-for="prof in profesionales" :key="prof.id" :value="prof.id">{{ prof.nombre }} - {{ prof.especialidad }}</option>
              </select>
            </div>
            <div style="display:flex; gap:8px;">
              <button class="btn btn--outline" @click="() => openModuleModal()" :disabled="!selectedProfessional">➕ Nuevo Módulo</button>
            </div>
          </div>
          <div v-if="!selectedProfessional" class="calendar-disabled-message" style="padding:40px;text-align:center;color:#888;font-size:1.2em;">Seleccione un profesional para ver y editar la agenda.</div>
          <div v-else ref="calendarEl" class="calendar-container"></div>
        </div>

        <div v-if="currentView === 'patients'" class="patients-view">
          <div class="patients-header">
            <div class="search-bar"><input v-model="patientsSearch" type="text" placeholder="🔍 Buscar pacientes..." class="form-control" /></div>
          </div>
          <div class="patients-list">
            <div class="card">
              <div class="patients-table">
                <table>
                  <thead>
                    <tr>
                      <th>👤 Nombre</th>
                      <th>🆔 RUT</th>
                      <th>📞 Teléfono</th>
                      <th>📧 Email</th>
                      <th>🏥 Previsión</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="paciente in filteredPatients" :key="paciente.id">
                      <td><strong>{{ paciente.nombre }} {{ paciente.apellido }}</strong></td>
                      <td>{{ paciente.rut }}</td>
                      <td>{{ paciente.telefono }}</td>
                      <td>{{ paciente.email }}</td>
                      <td><span class="status status--info">{{ paciente.prevision }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Vista de Configuración: Solo Tarjetas -->
        <div v-if="currentView === 'config'" class="config-view">
          <div class="config-header">
            <h1>⚙️ Centro de Configuración</h1>
            <p>Selecciona una opción para gestionar el sistema</p>
          </div>

          <!-- Grid de Tarjetas -->
          <div class="config-cards-grid">
            <!-- Tarjeta 1: Gestión de Usuarios -->
            <div class="config-card-container" @click="configView = 'users'">
              <div class="config-card-icon">👥</div>
              <div class="config-card-title">Gestión de Usuarios</div>
              <div class="config-card-description">Administra usuarios, roles y permisos del sistema</div>
              <div class="config-card-features">
                <span>✓ Ver usuarios</span>
                <span>✓ Cambiar roles</span>
                <span>✓ Gestionar permisos</span>
              </div>
              <button class="config-card-btn">Abrir →</button>
            </div>

            <!-- Tarjeta 2: Base de Datos -->
            <div class="config-card-container" @click="configView = 'database'">
              <div class="config-card-icon">🗄️</div>
              <div class="config-card-title">Base de Datos</div>
              <div class="config-card-description">Configura conexión y backups de la base de datos</div>
              <div class="config-card-features">
                <span>✓ Configurar conexión</span>
                <span>✓ Backups automáticos</span>
                <span>✓ Monitoreo</span>
              </div>
              <button class="config-card-btn">Abrir →</button>
            </div>

            <!-- Tarjeta 3: Autorizar Registros -->
            <div class="config-card-container" @click="configView = 'registros'">
              <div class="config-card-icon">📋</div>
              <div class="config-card-title">Autorizar Registros</div>
              <div class="config-card-description">Revisa y autoriza solicitudes de nuevos usuarios</div>
              <div class="config-card-features">
                <span>✓ Ver solicitudes</span>
                <span>✓ Aprobar/Rechazar</span>
                <span>✓ Asignar permisos</span>
              </div>
              <button class="config-card-btn">Abrir →</button>
            </div>

            <!-- Tarjeta 4: Panel Admin -->
            <div class="config-card-container" @click="configView = 'admin'">
              <div class="config-card-icon">🔧</div>
              <div class="config-card-title">Panel Admin</div>
              <div class="config-card-description">Inicializa y gestiona la base de datos completa</div>
              <div class="config-card-features">
                <span>✓ Crear colecciones</span>
                <span>✓ Importar datos</span>
                <span>✓ Ver estadísticas</span>
              </div>
              <button class="config-card-btn">Abrir →</button>
            </div>
          </div>

          <!-- Contenido dinámico según selección -->
          <div v-if="configView === 'users'" class="config-content">
            <div class="config-content-header">
              <h2>👥 Gestión de Usuarios</h2>
              <button class="btn btn--primary">➕ Nuevo Usuario</button>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>RUN</th>
                    <th>Contacto</th>
                    <th>Rol</th>
                    <th>Admin</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="prof in profesionales" :key="prof.id">
                    <td>
                      <div class="user-cell">
                        <div class="user-name">{{ prof.nombre }}</div>
                        <div class="user-specialty">{{ prof.especialidad }}</div>
                      </div>
                    </td>
                    <td>{{ prof.run || 'N/A' }}</td>
                    <td>
                      <div class="contact-cell">
                        <div>{{ prof.email }}</div>
                        <div class="contact-phone">{{ prof.telefono }}</div>
                      </div>
                    </td>
                    <td>
                      <select class="form-control form-control--sm">
                        <option>Profesional</option>
                        <option>Administrativo</option>
                      </select>
                    </td>
                    <td><input type="checkbox" class="checkbox" /></td>
                    <td><span class="badge badge--success">Activo</span></td>
                    <td>
                      <div class="action-buttons">
                        <button class="btn-icon" title="Resetear contraseña">🔑</button>
                        <button class="btn-icon" title="Eliminar">🗑️</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="configView === 'database'" class="config-content">
            <h2>🗄️ Configuración de Base de Datos</h2>
            <div class="form-grid">
              <div class="form-field">
                <label>Host</label>
                <input type="text" class="form-control" placeholder="localhost" />
              </div>
              <div class="form-field">
                <label>Puerto</label>
                <input type="text" class="form-control" placeholder="5432" />
              </div>
              <div class="form-field">
                <label>Nombre de BD</label>
                <input type="text" class="form-control" placeholder="mi_base_datos" />
              </div>
              <div class="form-field">
                <label style="display: flex; align-items: center; gap: 8px;">
                  <input type="checkbox" class="checkbox" />
                  Backups Automáticos
                </label>
              </div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 16px;">
              <button class="btn btn--primary">Probar Conexión</button>
              <button class="btn btn--success">Guardar Configuración</button>
            </div>
          </div>

          <div v-if="configView === 'registros'" class="config-content">
            <h2>� Autorizar Registros de Usuarios</h2>
            <p style="color: #666; margin: 16px 0;">Revisa y autoriza las solicitudes de acceso de nuevos usuarios. También puedes habilitar permisos de administrador.</p>
            <button class="btn btn--primary btn--lg">
              🔓 Abrir Panel de Autorizaciones
            </button>
          </div>

          <div v-if="configView === 'admin'" class="config-content">
            <h2>🔧 Panel de Administración</h2>
            <p style="color: #666; margin: 16px 0;">Panel avanzado para inicializar y gestionar la base de datos completa del sistema.</p>
            <div style="display: flex; gap: 12px;">
              <button class="btn btn--primary">✅ Ver Estadísticas</button>
              <button class="btn btn--success">🚀 Inicializar BD</button>
              <button class="btn btn--danger">⚠️ Limpiar BD</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>


  <!-- Menú contextual sobre eventos -->
  <div v-if="contextMenu.visible" class="context-menu" :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }">
    <ul v-if="contextMenu.kind === 'modulo'">
      <li @click="toggleModuleSelection">{{ selectedModuleIds.includes(contextMenu.event.id) ? '☑' : '☐' }} Seleccionar varios módulos</li>
      <li @click="editModule">✏️ Editar módulo</li>
      <li @click="deleteModule">
        🗑️ Eliminar módulo
        <span v-if="selectedModuleIds.length > 1" style="font-size:0.9em;color:#888;">({{ selectedModuleIds.length }})</span>
      </li>
      <li v-if="getCitaForModulo(contextMenu.event)" @click="editCitaFromModulo">✏️ Editar cita</li>
      <li v-if="getCitaForModulo(contextMenu.event)" @click="deleteCitaFromModulo">❌ Eliminar cita</li>
      <li v-if="getCitaForModulo(contextMenu.event)" @click="schedulePatient">👥 Agendar sobrecupo</li>
      <li v-if="!getCitaForModulo(contextMenu.event)" @click="schedulePatient">👤 Agendar paciente</li>
      <li @click="deleteAllRangeModules" style="color:#d32f2f;font-weight:bold;">🗑️ Eliminar todos los módulos de la semana</li>
    </ul>
    <ul v-else-if="contextMenu.kind === 'cita'">
      <li @click="editCitaFromModulo">✏️ Editar cita</li>
      <li @click="deleteCitaFromModulo">❌ Eliminar cita</li>
      <li @click="schedulePatient">👥 Agendar sobrecupo</li>
    </ul>
    <ul v-else>
      <li @click="schedulePatient">👤 Agendar paciente</li>
    </ul>
  </div>

  <!-- Tooltip para citas -->
  <div v-if="tooltip.visible" class="tooltip-cita" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
    <div class="tooltip-content">
      <div class="tooltip-row">
        <strong>Paciente:</strong> {{ tooltip.data.nombreCompleto }}
      </div>
      <div class="tooltip-row">
        <strong>RUN:</strong> {{ tooltip.data.run }}
      </div>
      <div class="tooltip-row">
        <strong>Horario:</strong> {{ tooltip.data.horarioInicio }} - {{ tooltip.data.horarioFin }}
      </div>
    </div>
  </div>

  <!-- Modal de confirmación: eliminar módulos de la semana visible (fuera del menú contextual) -->
  <div v-if="showDeleteRangeModal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Eliminar módulos de la semana</h3>
        <button @click="cancelDeleteRangeModules">✖</button>
      </div>
      <div class="modal-body">
        <p>
          Se eliminarán <b>{{ deleteRangeCount }}</b> módulo(s) <b>sin pacientes agendados</b> en la semana visible del calendario.
        </p>
        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:12px;">
          <button class="btn btn--outline" @click="cancelDeleteRangeModules">Cancelar</button>
          <button class="btn btn--danger" :disabled="!deleteRangeCount" @click="confirmDeleteRangeModules">Eliminar todos</button>
        </div>
      </div>
    </div>
  </div>


  <!-- Barra/botón para eliminar seleccionados -->
  <div v-if="selectedModuleIds.length > 0 && currentView === 'calendar'" style="position:fixed;bottom:24px;right:24px;z-index:1200;">
    <button class="btn btn--danger" @click="deleteModule">Eliminar {{ selectedModuleIds.length }} módulo(s) seleccionados</button>
  </div>

  <!-- Modal de confirmación de eliminación de módulos -->
  <div v-if="showDeleteConfirmModal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Confirmar eliminación</h3>
        <button @click="cancelDeleteModules">✖</button>
      </div>
      <div class="modal-body">
        <p v-if="deleteConfirmCount === 1">¿Seguro que deseas eliminar este módulo?</p>
        <p v-else>¿Seguro que deseas eliminar {{ deleteConfirmCount }} módulos seleccionados?</p>
        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:12px;">
          <button class="btn btn--outline" @click="cancelDeleteModules">Cancelar</button>
          <button class="btn btn--danger" @click="confirmDeleteModules">Eliminar</button>
        </div>
      </div>
    </div>
  </div>


  <!-- Modal creación de cita -->
  <div v-if="showAppointmentModal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Nueva Cita</h3>
        <button @click="showAppointmentModal=false">✖</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <label>Paciente</label>
          <select v-model="appointmentForm.pacienteId" class="form-control">
            <option value="" disabled>Seleccione...</option>
            <option v-for="p in pacientes" :key="p.id" :value="p.id">{{ p.nombre }} {{ p.apellido }}</option>
          </select>
        </div>


        <div class="form-row" style="display:flex; gap:8px;">
          <div style="flex:1">
            <label>Fecha</label>
            <input type="date" v-model="appointmentForm.fecha" class="form-control" />
          </div>
          <div style="flex:1">
            <label>Hora</label>
            <input type="time" v-model="appointmentForm.hora" class="form-control" />
          </div>
          <div style="flex:1">
            <label>Duración (min)</label>
            <input type="number" min="10" step="5" v-model.number="appointmentForm.duracionMin" class="form-control" />
          </div>
        </div>
        <div class="form-row">
          <label>Título</label>
          <input type="text" v-model="appointmentForm.titulo" class="form-control" placeholder="Ej: Control - Paciente" />
        </div>
        <div class="form-row">
          <label>Notas</label>
          <textarea v-model="appointmentForm.notas" class="form-control" rows="3"></textarea>
        </div>
        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:12px;">
          <button class="btn btn--outline" @click="showAppointmentModal=false">Cancelar</button>
          <button class="btn btn--primary" @click="saveAppointment">Guardar</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal creación de módulo (definición) -->
  <div v-if="showModuleModal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Nuevo Módulo</h3>
        <button @click="showModuleModal=false">✖</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <label>Nombre de Prestación</label>
          <input v-model="moduleForm.nombre" class="form-control" placeholder="Ej: Consulta General" />
        </div>
        <div class="form-row">
          <label>Motivo/Prestación</label>
          <input v-model="moduleForm.motivo" class="form-control" placeholder="Ej: Control, Ingreso, etc." />
        </div>
        <div class="form-row">
          <label>Estamento</label>
          <select v-model="moduleForm.estamento" class="form-control">
            <option value="" disabled>Seleccione...</option>
            <option value="Medico">Médico</option>
            <option value="Enfermeria">Enfermería</option>
            <option value="Administrativo">Administrativo</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div class="form-row" style="display:flex; gap:8px;">
          <div style="flex:1">
            <label>Rendimiento (min)</label>
            <input type="number" min="10" step="5" v-model.number="moduleForm.duracionMin" class="form-control" />
          </div>
          <div style="flex:1">
            <label>Color</label>
            <input type="color" v-model="moduleForm.color" class="form-control" />
          </div>
        </div>
        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:12px;">
          <button class="btn btn--outline" @click="showModuleModal=false">Cancelar</button>
          <button class="btn btn--primary" @click="saveModule">Guardar</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal asignación de módulo (instancia) -->
  <div v-if="showAssignModuleModal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Asignar Módulo al Rango Seleccionado</h3>
        <button @click="showAssignModuleModal=false">✖</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <label>Módulo disponible (por duración)</label>
          <select v-model="selectedModuleDefId" class="form-control">
            <option value="" disabled>Seleccione...</option>
            <option v-for="def in availableModuleDefs" :key="def.id" :value="def.id">
              {{ def.nombre }} - {{ def.motivo }} ({{ def.estamento }}) • {{ def.duracionMin }} min
            </option>
          </select>
        </div>
        <div class="form-row" style="display:flex; gap:8px;">
          <div style="flex:1">
            <label>Inicio</label>
            <input type="datetime-local" v-model="assignRange.start" class="form-control" />
          </div>
          <div style="flex:1">
            <label>Fin</label>
            <input type="datetime-local" v-model="assignRange.end" class="form-control" />
          </div>
        </div>
        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:12px;">
          <button class="btn btn--outline" @click="showAssignModuleModal=false">Cancelar</button>
          <button class="btn btn--primary" @click="confirmAssignModule">Asignar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modulo-selected {
  box-shadow: 0 0 0 3px #ff5252 !important;
  border: 2px solid #ff5252 !important;
  background: #ffe0e0 !important;
  filter: brightness(1.05);
}

/* Separación entre eventos usando clip-path para recortar visualmente */
:deep(.fc-timegrid-event-harness) {
  padding: 3px 0 !important;
}

:deep(.fc-timegrid-event) {
  border-radius: 6px !important;
  /* Ajustar la altura del evento para compensar el padding del harness */
  height: calc(100% - 6px) !important;
  box-sizing: border-box !important;
}

/* Asegurar que el contenedor interno respete el tamaño */
:deep(.fc-timegrid-event .fc-event-main) {
  height: 100% !important;
  box-sizing: border-box !important;
}

.calendar-container { background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; padding: 12px; }
.calendar-controls { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.chart-container { background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; padding: 12px; }
.context-menu { position: fixed; z-index: 1100; background:#fff; border:1px solid rgba(0,0,0,0.12); border-radius:8px; box-shadow:0 8px 20px rgba(0,0,0,0.12); }
.context-menu ul { list-style:none; margin:0; padding:6px; min-width: 160px; }
.context-menu li { padding:8px 10px; cursor:pointer; border-radius:6px; }
.context-menu li:hover { background: rgba(0,0,0,0.06); }
.modal { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; z-index: 1000; }
.modal-content { background:#fff; padding:16px; border-radius:10px; width: 100%; max-width: 560px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); }
.modal-header { display:flex; align-items:center; justify-content: space-between; margin-bottom: 8px; }
.modal-body { display:flex; flex-direction: column; gap: 10px; }
.form-row { display:flex; flex-direction: column; gap: 6px; }

/* Toast */
.toast { position: fixed; right: 24px; bottom: 24px; z-index: 2000; background: #333; color: #fff; padding: 10px 14px; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.25); }
.toast--success { background: #2e7d32; }
.toast--error { background: #c62828; }

/* Tooltip para citas */
.tooltip-cita {
  position: fixed;
  z-index: 1200;
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  max-width: 300px;
  animation: fadeIn 0.2s ease-in;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tooltip-row {
  font-size: 13px;
  line-height: 1.4;
}

.tooltip-row strong {
  font-weight: 600;
  margin-right: 6px;
  color: #ffd54f;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ========== PERFIL ========== */
.profile-view {
  padding: 20px;
}

.profile-container {
  max-width: 1200px;
  margin: 0 auto;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.profile-avatar {
  flex-shrink: 0;
}

.avatar-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.profile-info-section h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  color: #1a202c;
}

.profile-profession {
  color: #718096;
  margin: 0 0 8px 0;
  font-size: 16px;
}

.profile-email {
  color: #4a5568;
  font-size: 14px;
  margin: 0;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 8px;
}

.stat-label {
  color: #718096;
  font-size: 14px;
}

.profile-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin-bottom: 24px;
}

.profile-card-header {
  margin-bottom: 20px;
}

.profile-card-header h3 {
  margin: 0;
  font-size: 20px;
  color: #1a202c;
}

.profile-card-title {
  margin: 0 0 20px 0;
  font-size: 20px;
  color: #1a202c;
}

.profile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.profile-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.profile-field--full {
  grid-column: 1 / -1;
}

.profile-field label {
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
}

/* Calendario Semanal */
.week-calendar {
  overflow-x: auto;
}

.week-header {
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.week-hour-column {
  font-size: 12px;
  font-weight: 500;
  color: #718096;
  padding: 8px;
}

.week-day-header {
  text-align: center;
  padding: 8px;
  background: #f7fafc;
  border-radius: 8px;
}

.day-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a202c;
}

.day-date {
  font-size: 12px;
  color: #718096;
}

.week-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.week-row {
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  gap: 8px;
}

.week-hour-cell {
  font-size: 12px;
  color: #718096;
  padding: 8px;
  font-weight: 500;
}

.week-cell {
  min-height: 60px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 4px;
  transition: background 0.2s;
}

.week-cell:hover {
  background: #f7fafc;
}

.week-cell-cita {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  height: 100%;
  transition: transform 0.2s;
}

.week-cell-cita:hover {
  transform: scale(1.02);
}

.cita-paciente {
  font-weight: 600;
  font-size: 12px;
  margin-bottom: 4px;
}

.cita-tipo {
  font-size: 11px;
  opacity: 0.9;
}

/* ========== CONFIGURACIONES ========== */
.config-view {
  padding: 20px;
}

.config-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.config-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.config-card-header h2 {
  margin: 0;
  font-size: 24px;
  color: #1a202c;
}

.table-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: #f7fafc;
}

.data-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e2e8f0;
}

.data-table td {
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 14px;
}

.data-table tbody tr:hover {
  background: #f7fafc;
}

.user-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-weight: 600;
  color: #1a202c;
}

.user-specialty {
  font-size: 12px;
  color: #718096;
}

.form-control--sm {
  padding: 6px 12px;
  font-size: 13px;
}

.checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge--success {
  background: #c6f6d5;
  color: #22543d;
}

.badge--danger {
  background: #fed7d7;
  color: #742a2a;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 6px;
  font-size: 16px;
  transition: background 0.2s;
}

.btn-icon--primary:hover {
  background: #ebf4ff;
}

.btn-icon--danger:hover {
  background: #fff5f5;
}

/* Base de Datos */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-field--toggle {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f7fafc;
  border-radius: 8px;
}

.toggle-info h3 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1a202c;
}

.toggle-info p {
  margin: 0;
  font-size: 13px;
  color: #718096;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e0;
  border-radius: 24px;
  transition: 0.3s;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: #667eea;
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.config-empty {
  padding: 60px 20px;
}

.empty-state {
  text-align: center;
  max-width: 400px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: #1a202c;
  font-size: 20px;
}

.empty-state p {
  color: #718096;
  font-size: 14px;
  margin: 0;
}

/* Submenú en sidebar */
.submenu {
  list-style: none;
  padding: 0;
  margin: 8px 0 0 0;
  background: rgba(0,0,0,0.03);
  border-radius: 6px;
}

.submenu-item {
  padding: 10px 16px 10px 40px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 14px;
  color: #4a5568;
  display: flex;
  align-items: center;
  gap: 8px;
}

.submenu-item:hover {
  background: rgba(0,0,0,0.05);
  color: #1a202c;
}

.submenu-item.active {
  background: #667eea;
  color: white;
}

.submenu-icon {
  font-size: 14px;
}

.submenu-arrow {
  margin-left: auto;
  font-size: 10px;
  transition: transform 0.2s;
}

.nav-link--parent {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn--success {
  background: #48bb78;
  color: white;
}

.btn--success:hover {
  background: #38a169;
}

/* ========== DIRECTORIO DE PROFESIONALES ========== */
.directory-view {
  padding: 20px;
}

.directory-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.search-bar {
  flex-grow: 1;
  max-width: 400px;
}

.directory-list .card {
  padding: 0;
  border: none;
  box-shadow: none;
}

.professionals-table {
  width: 100%;
  border-collapse: collapse;
}

.professionals-table thead {
  background: #f7fafc;
}

.professionals-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e2e8f0;
}

/* CONFIG VIEW STYLES */
.config-view {
  padding: 24px;
}

.config-header {
  margin-bottom: 32px;
}

.config-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 8px 0;
}

.config-header p {
  color: #718096;
  margin: 0;
  font-size: 16px;
}

.config-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
}

.config-card-container {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-card-container:hover {
  border-color: #3182ce;
  box-shadow: 0 4px 16px rgba(49, 130, 206, 0.15);
  transform: translateY(-4px);
}

.config-card-icon {
  font-size: 48px;
  text-align: center;
}

.config-card-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a202c;
  text-align: center;
}

.config-card-description {
  font-size: 14px;
  color: #718096;
  text-align: center;
}

.config-card-features {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}

.config-card-features span {
  font-size: 13px;
  color: #4a5568;
}

.config-card-btn {
  background: #3182ce;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.config-card-btn:hover {
  background: #2563a6;
}

.config-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-top: 32px;
}

.config-content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
}

.config-content-header h2 {
  margin: 0;
  font-size: 24px;
  color: #1a202c;
}

.btn--lg {
  padding: 12px 24px;
  font-size: 16px;
}
}

.professionals-table td {
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 14px;
}

.professionals-table tbody tr:hover {
  background: #f7fafc;
}
</style>
