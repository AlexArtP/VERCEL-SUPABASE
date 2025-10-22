"use client"

import { useState, useRef, useEffect } from "react"
// import { DEMO_DATA } from "@/lib/demoData"  // ❌ COMENTADO: Usando Firestore en lugar de datos demo
import { useData } from "@/contexts/DataContext"
import { useFirestoreUsers } from "@/lib/useFirestoreUsers"
import { useNotificationManager } from "@/lib/useNotificationManager"
import { useAppointmentNotifications } from "@/lib/useAppointmentNotifications"
import { useNotifications } from "@/contexts/NotificationContext"
import { generateTemporaryPassword, copyToClipboard } from "@/lib/passwordUtils"
import {
  CalendarIcon,
  Users,
  Settings,
  LogOut,
  Home,
  UserCircle,
  Search,
  Trash2,
  Key,
  Database,
  Clock,
  Phone,
  Mail,
  Briefcase,
  FileText,
  Activity,
  Edit,
  ChevronDown,
  Copy,
} from "lucide-react"
import { CalendarView } from "./CalendarView"
import { ModuloListModal } from "./ModuloListModal"
import { SolicitudesAuthorizationList } from "./SolicitudesAuthorizationList"
import { ForcePasswordChangeModal } from "./ForcePasswordChangeModal"
import { EditUserModal } from "./EditUserModal"
import { NotificationBell } from "./NotificationBell"
import type { Modulo } from "@/lib/demoData"
import ProfilePanel from './ProfilePanel'

interface MainAppProps {
  currentUser: any
  onLogout: () => void
}

export function MainApp({ currentUser, onLogout }: MainAppProps) {
  const [activeView, setActiveView] = useState("dashboard")
  const [searchTerm, setSearchTerm] = useState("")
  // ❌ REMOVIDO: const [pacientes] = useState(DEMO_DATA.pacientes)
  // ❌ REMOVIDO: const [citas, setCitas] = useState(DEMO_DATA.citas)
  const [pacientes, setPacientes] = useState<any[]>([]) // Será llenado desde Firestore
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showModuloListModal, setShowModuloListModal] = useState(false)
  const [showConfigMenu, setShowConfigMenu] = useState(false)
  const [configView, setConfigView] = useState("users")
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false)
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [copiedPasswordUserId, setCopiedPasswordUserId] = useState<string | null>(null)
  const [temporaryPasswords, setTemporaryPasswords] = useState<Map<string, string>>(new Map())
  // 🔥 NUEVO: Obtener usuarios de Firestore en tiempo real
  const {
    usuarios: usuariosFirestore,
    loading: usuariosLoading,
    error: usuariosError,
    updateUser,
    deleteUser: deleteUserFirestore,
    toggleUserActive,
    toggleUserAdmin,
    changeUserRole,
  } = useFirestoreUsers()

  // 🔔 NUEVO: Hook de notificaciones para escuchar solicitudes pendientes
  useNotificationManager(currentUser?.esAdmin || false)

  // 🔔 NUEVO: Hook de notificaciones para nuevas citas creadas en agenda del profesional
  useAppointmentNotifications(currentUser?.id || null, true)

  // 🔥 NUEVO: Obtener datos sincronizados de Firebase
  const { 
    modulos, 
    addModulo, 
    addModulosBatch,
    updateModulo, 
    deleteModulo,
    addCita,
    updateCita,
    deleteCita,
    citas,  // 🔥 Citas ahora viene del DataContext (Firestore)
    plantillas, // 🔥 Plantillas (módulos definidos) desde moduloDefinitions
    addPlantilla,
    updatePlantilla,
    deletePlantilla,
    setVisibleRange,
  } = useData()

  // Usar usuarios de Firestore si están disponibles, sino array vacío
  const usuarios = usuariosFirestore.length > 0 ? usuariosFirestore : []

  // Verificar si el usuario necesita cambiar su contraseña
  useEffect(() => {
    console.log('🔐 MainApp useEffect - Verificando cambioPasswordRequerido')
    console.log('   currentUser:', currentUser)
    console.log('   cambioPasswordRequerido:', currentUser?.cambioPasswordRequerido)
    
    if (currentUser?.cambioPasswordRequerido) {
      console.log('🔓 Mostrando modal de cambio de contraseña')
      setNeedsPasswordChange(true)
      setShowPasswordChangeModal(true)
    }
  }, [currentUser])

  // Manejar cierre del modal cuando se cambia la contraseña
  const handlePasswordChanged = () => {
    setNeedsPasswordChange(false)
    setShowPasswordChangeModal(false)
  }

  // 🔔 NUEVO: Funciones para manejar aprobación/rechazo de solicitudes desde notificaciones
  const handleApproveSolicitud = async (solicitudId: string) => {
    try {
      const response = await fetch('/api/auth/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitudId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error aprobando solicitud')
      }

      console.log('✅ Solicitud aprobada:', solicitudId)
    } catch (error: any) {
      console.error('❌ Error aprobando solicitud:', error)
      throw error
    }
  }

  const handleRejectSolicitud = async (solicitudId: string) => {
    try {
      const response = await fetch('/api/auth/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitudId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error rechazando solicitud')
      }

      console.log('✅ Solicitud rechazada:', solicitudId)
    } catch (error: any) {
      console.error('❌ Error rechazando solicitud:', error)
      throw error
    }
  }

  // Get today's appointments
  const today = new Date().toISOString().split("T")[0]
  const citasHoy = citas.filter((c) => c.fecha === today)

  // Get this week's appointments for current user
  const getWeekDates = () => {
    const dates = []
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getWeekDates()
  const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

  const getCitasForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return citas.filter((c) => c.fecha === dateStr && c.profesionalId === currentUser.id)
  }

  const resetPassword = (userId: string) => {
    alert("Se ha enviado un correo para restablecer la contraseña")
  }

  // 🔐 Función para regenerar y copiar contraseña temporal
  const handleRegenerateAndCopyPassword = async (userId: string) => {
    try {
      // Llamar al endpoint de regeneración
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error regenerando contraseña')
      }

      const tempPassword = data.temporaryPassword
      
      // Guardar la contraseña temporal en el estado
      setTemporaryPasswords(prev => new Map(prev).set(userId, tempPassword))
      
      // Copiar al portapapeles
      const copied = await copyToClipboard(tempPassword)
      
      if (copied) {
        // Mostrar feedback visual
        setCopiedPasswordUserId(userId)
        
        // Limpiar después de 3 segundos
        setTimeout(() => {
          setCopiedPasswordUserId(null)
        }, 3000)
        
        console.log(`✅ Contraseña regenerada y copiada para usuario ${userId}: ${tempPassword}`)
      } else {
        alert(`Nueva contraseña temporal:\n${tempPassword}\n\nNo se pudo copiar automáticamente. Por favor cópiala manualmente.`)
      }
    } catch (error) {
      console.error('Error regenerando contraseña:', error)
      alert(error instanceof Error ? error.message : 'Error al regenerar contraseña')
    }
  }

  // Función para abrir el modal de edición
  const handleOpenEditUser = (usuario: any) => {
    setEditingUser(usuario)
    setShowEditUserModal(true)
  }

  // Función para cerrar el modal de edición
  const handleCloseEditUser = () => {
    setShowEditUserModal(false)
    setEditingUser(null)
  }

  // Función para guardar cambios del usuario
  const handleSaveEditUser = async (userId: string, updates: any) => {
    try {
      await updateUser(userId, updates)
    } catch (error: any) {
      throw new Error(error.message || 'Error al actualizar el usuario')
    }
  }

  // Función para obtener nombre completo del usuario
  const getNombreCompleto = (usuario: any) => {
    if (usuario.apellidoPaterno && usuario.apellidoMaterno) {
      return `${usuario.nombre} ${usuario.apellidoPaterno} ${usuario.apellidoMaterno}`
    }
    return `${usuario.nombre} ${usuario.apellidos || ''}`
  }

  const filteredUsuarios = usuarios.filter(
    (u) => {
      const nombreCompleto = getNombreCompleto(u)
      return (
        nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
  )

  const filteredProfesionales = usuarios.filter((u) => u.rol === "profesional")

  // Handler para editar desde el modal de lista
  const handleEditModuloFromList = (modulo: Modulo) => {
    setActiveView("calendar")
    setTimeout(() => {
      // Espera a que CalendarView esté visible
      const evt = new CustomEvent("editModuloFromList", { detail: modulo })
      window.dispatchEvent(evt)
    }, 100)
    setShowModuloListModal(false)
  }

  // Handler para eliminar desde el modal de lista
  const handleDeleteModuloFromList = (id: number) => {
    // 🔥 NUEVO: Eliminar de Firebase
    deleteModulo(id).catch(console.error)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h1 className={`text-xl font-bold text-gray-900 transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Sistema Médico</h1>
            <p className={`text-sm text-gray-600 mt-1 transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>{currentUser.nombre} {currentUser.apellidos}</p>
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="ml-2 p-2 rounded hover:bg-gray-100 focus:outline-none"
            title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {/* Icono hamburguesa simple */}
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-menu"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveView("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeView === "dashboard" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className={`font-medium transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveView("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeView === "profile" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <UserCircle className="w-5 h-5" />
            <span className={`font-medium transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Perfil</span>
          </button>

          <button
            onClick={() => setActiveView("professionals")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeView === "professionals" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Users className="w-5 h-5" />
            <span className={`font-medium transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Profesionales</span>
          </button>

          <button
            onClick={() => setActiveView("calendar")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeView === "calendar" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <CalendarIcon className="w-5 h-5" />
            <span className={`font-medium transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Calendario</span>
          </button>

          <button
            onClick={() => setActiveView("patients")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeView === "patients" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className={`font-medium transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Pacientes</span>
          </button>
          {/* Configuraciones - Solo botón simple */}
          <button
            onClick={() => setActiveView("config")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeView === "config" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className={`font-medium transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
              Configuraciones
            </span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className={`font-medium transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Top Navbar with Notifications */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-end sticky top-0 z-40">
          {currentUser?.esAdmin && (
            <NotificationBell
              onApproveSolicitud={handleApproveSolicitud}
              onRejectSolicitud={handleRejectSolicitud}
            />
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
          {/* Dashboard View */}
          {activeView === "dashboard" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
                <p className="text-gray-600 mt-1">Resumen de actividades de hoy</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Citas de Hoy</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{citasHoy.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Pacientes</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{pacientes.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Profesionales</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{filteredProfesionales.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Activity className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's Appointments */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Citas de Hoy</h3>
                </div>
                <div className="p-6">
                  {citasHoy.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No hay citas programadas para hoy</p>
                  ) : (
                    <div className="space-y-4">
                      {citasHoy.map((cita) => (
                        <div key={cita.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <Clock className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{cita.pacienteNombre}</p>
                              <p className="text-sm text-gray-600">{cita.tipo}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">{cita.hora}</p>
                            <span
                              className={`inline-block px-2 py-1 text-xs rounded-full ${
                                cita.estado === "confirmada"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {cita.estado}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Profile View (SPA integrado) */}
          {activeView === "profile" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Mi Perfil</h2>
                <p className="text-gray-600 mt-1">Información personal y profesional</p>
              </div>
              <ProfilePanel
                professional={usuarios.find(u => u.id === currentUser.id) || currentUser}
                citas={citas
                  .filter(c => c.profesionalId === currentUser.id)
                  .map(c => ({ ...c, estado: c.estado === 'confirmada' || c.estado === 'pendiente' || c.estado === 'cancelada' ? c.estado : 'confirmada' }))}
                modulos={modulos.filter(m => m.profesionalId === currentUser.id)}
              />
            </div>
          )}

          {/* Professionals Directory */}
          {activeView === "professionals" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Directorio de Profesionales</h2>
                  <p className="text-gray-600 mt-1">Profesionales registrados en el sistema</p>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar profesional..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {filteredProfesionales.map((prof) => (
                    <div key={prof.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <UserCircle className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {getNombreCompleto(prof)}
                              </h3>
                              <p className="text-sm text-gray-600">{prof.profesion || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="ml-15 space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FileText className="w-4 h-4" />
                              <span>RUN: {prof.run || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span>{prof.telefono || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4" />
                              <span>{prof.email || 'N/A'}</span>
                            </div>
                            {prof.profesion && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Briefcase className="w-4 h-4" />
                                <span>{prof.profesion}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 text-xs rounded-full ${
                              prof.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {prof.activo ? "Activo" : "Inactivo"}
                          </span>
                          {prof.esAdmin && (
                            <span className="px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-700">Admin</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Calendar View */}
          {activeView === "calendar" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Calendario</h2>
                <p className="text-gray-600 mt-1">Vista de todas las citas programadas</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <CalendarView
                  modulos={modulos}
                  citas={citas.map((cita) => ({
                    ...cita,
                    estado:
                      cita.estado === "confirmada" || cita.estado === "pendiente" || cita.estado === "cancelada"
                        ? cita.estado
                        : "confirmada",
                  }))}
                  pacientes={pacientes}
                  plantillas={plantillas}
                  currentUser={currentUser}
                  onModuloCreate={(modulo) => {
                    // 🔥 NUEVO: Guardar en Firebase (se sincroniza automáticamente)
                    addModulo(modulo).catch(console.error)
                  }}
                  onModulosCreateBatch={(lista: Omit<Modulo, 'id'>[]) => {
                    if (addModulosBatch) {
                      addModulosBatch(lista).catch(console.error)
                    } else {
                      // Fallback
                      lista.forEach((m: Omit<Modulo,'id'>) => addModulo(m).catch(console.error))
                    }
                  }}
                  onModuloUpdate={(id, modulo) => {
                    // 🔥 NUEVO: Actualizar en Firebase
                    updateModulo(id, modulo).catch(console.error)
                  }}
                  onModuloDelete={(ids) => {
                    // 🔥 NUEVO: Eliminar de Firebase
                    ids.forEach(id => deleteModulo(id).catch(console.error))
                  }}
                  onCitaCreate={(cita) => {
                    // 🔥 NUEVO: Guardar cita en Firebase
                    addCita(cita).catch(console.error)
                  }}
                  onCitaUpdate={(id, cita) => {
                    // 🔥 NUEVO: Actualizar cita en Firebase
                    updateCita(id, cita).catch(console.error)
                  }}
                  onCitaDelete={(id) => {
                    // 🔥 NUEVO: Eliminar cita de Firebase
                    deleteCita(id).catch(console.error)
                  }}
                  onPlantillaCreate={(plantilla) => {
                    // 🔥 NUEVO: Guardar plantilla en moduloDefinitions
                    addPlantilla(plantilla).catch(console.error)
                  }}
                  onPlantillaUpdate={(id, plantilla) => {
                    // 🔥 NUEVO: Actualizar plantilla en moduloDefinitions
                    updatePlantilla(id, plantilla).catch(console.error)
                  }}
                  onPlantillaDelete={(id) => {
                    // 🔥 NUEVO: Eliminar plantilla de moduloDefinitions
                    deletePlantilla(id).catch(console.error)
                  }}
                  onVisibleRangeChange={(startISO, endISO) => {
                    try { setVisibleRange(startISO, endISO) } catch {}
                  }}
                />
              </div>
            </div>
          )}

          {/* Patients View */}
          {activeView === "patients" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Pacientes</h2>
                <p className="text-gray-600 mt-1">Listado de pacientes registrados</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar paciente..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RUN</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Última Visita
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {pacientes.map((paciente) => (
                        <tr key={paciente.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{paciente.nombre}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{paciente.run}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{paciente.telefono}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{paciente.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{paciente.ultimaVisita}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Config View */}
          {activeView === "config" && currentUser.esAdmin && (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900">⚙️ Centro de Configuración</h2>
                <p className="text-gray-600 mt-1">Selecciona una opción para gestionar el sistema</p>
              </div>

              {/* Tarjeta Grid - 4 Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Users */}
                <div
                  onClick={() => setConfigView("users")}
                  className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                    configView === "users"
                      ? "border-purple-500 bg-purple-50 shadow-lg"
                      : "border-gray-200 bg-white hover:border-purple-300 hover:shadow-md hover:-translate-y-1"
                  }`}
                >
                  <div className="text-4xl mb-3 text-center">👥</div>
                  <h3 className="font-semibold text-gray-900 text-center mb-1">Gestión de Usuarios</h3>
                  <p className="text-sm text-gray-600 text-center mb-3">Administra usuarios del sistema</p>
                  <div className="space-y-1 mb-4">
                    <div className="text-xs text-gray-600">✓ Crear y editar usuarios</div>
                    <div className="text-xs text-gray-600">✓ Cambiar roles y permisos</div>
                    <div className="text-xs text-gray-600">✓ Activar/desactivar cuentas</div>
                  </div>
                  <button className="w-full px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors">
                    Abrir →
                  </button>
                </div>

                {/* Card 2: Database */}
                <div
                  onClick={() => setConfigView("database")}
                  className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                    configView === "database"
                      ? "border-blue-500 bg-blue-50 shadow-lg"
                      : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md hover:-translate-y-1"
                  }`}
                >
                  <div className="text-4xl mb-3 text-center">🗄️</div>
                  <h3 className="font-semibold text-gray-900 text-center mb-1">Base de Datos</h3>
                  <p className="text-sm text-gray-600 text-center mb-3">Configura y sincroniza datos</p>
                  <div className="space-y-1 mb-4">
                    <div className="text-xs text-gray-600">✓ Backup automático</div>
                    <div className="text-xs text-gray-600">✓ Sincronizar colecciones</div>
                    <div className="text-xs text-gray-600">✓ Importar/exportar datos</div>
                  </div>
                  <button className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                    Abrir →
                  </button>
                </div>

                {/* Card 3: Registros */}
                <div
                  onClick={() => setConfigView("registros")}
                  className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                    configView === "registros"
                      ? "border-green-500 bg-green-50 shadow-lg"
                      : "border-gray-200 bg-white hover:border-green-300 hover:shadow-md hover:-translate-y-1"
                  }`}
                >
                  <div className="text-4xl mb-3 text-center">📋</div>
                  <h3 className="font-semibold text-gray-900 text-center mb-1">Autorizar Registros</h3>
                  <p className="text-sm text-gray-600 text-center mb-3">Aprueba solicitudes pendientes</p>
                  <div className="space-y-1 mb-4">
                    <div className="text-xs text-gray-600">✓ Ver solicitudes pendientes</div>
                    <div className="text-xs text-gray-600">✓ Aprobar/rechazar registros</div>
                    <div className="text-xs text-gray-600">✓ Historial de solicitudes</div>
                  </div>
                  <button className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                    Abrir →
                  </button>
                </div>

                {/* Card 4: Admin */}
                <div
                  onClick={() => setConfigView("admin")}
                  className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                    configView === "admin"
                      ? "border-orange-500 bg-orange-50 shadow-lg"
                      : "border-gray-200 bg-white hover:border-orange-300 hover:shadow-md hover:-translate-y-1"
                  }`}
                >
                  <div className="text-4xl mb-3 text-center">🔧</div>
                  <h3 className="font-semibold text-gray-900 text-center mb-1">Panel Admin</h3>
                  <p className="text-sm text-gray-600 text-center mb-3">Herramientas avanzadas</p>
                  <div className="space-y-1 mb-4">
                    <div className="text-xs text-gray-600">✓ Inicializar base de datos</div>
                    <div className="text-xs text-gray-600">✓ Estadísticas del sistema</div>
                    <div className="text-xs text-gray-600">✓ Configuración global</div>
                  </div>
                  <button className="w-full px-3 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors">
                    Abrir →
                  </button>
                </div>
              </div>

              {/* Content Sections */}
              {configView === "users" && (
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Gestión de Usuarios</h3>
                    {usuariosLoading && <p className="text-sm text-blue-600 mt-2">📥 Cargando usuarios desde Firestore...</p>}
                    {usuariosError && (
                      <div className="text-sm text-red-600 mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="font-semibold">❌ Error al cargar usuarios:</p>
                        <p className="mt-1">{usuariosError}</p>
                        <p className="mt-2 text-xs text-red-500">
                          💡 Solución: Asegúrate de que:
                          <br />• Estés autenticado como administrador
                          <br />• Tengas permisos en Firestore
                          <br />• Las reglas de Firestore permitan lectura a admins
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar usuario..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                    {usuariosLoading ? (
                      <p className="text-center text-gray-600 py-8">⏳ Cargando usuarios desde Firestore...</p>
                    ) : usuariosError ? (
                      <div className="text-center text-red-600 py-8">
                        <p className="font-semibold mb-2">❌ No se pueden cargar los usuarios</p>
                        <p className="text-sm">{usuariosError}</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">RUN</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {filteredUsuarios.map((usuario) => (
                              <tr key={usuario.id} className="hover:bg-gray-50">
                                <td className="px-4 py-4">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {getNombreCompleto(usuario)}
                                    </p>
                                    <p className="text-xs text-gray-500">{usuario.profesion || 'N/A'}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm text-gray-600">
                                    <p>{usuario.email}</p>
                                    <p>{usuario.telefono || 'N/A'}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <p className="text-sm text-gray-900">{usuario.run || 'N/A'}</p>
                                </td>
                                <td className="px-4 py-4">
                                  <select
                                    value={usuario.rol || 'profesional'}
                                    onChange={(e) => changeUserRole(String(usuario.id), e.target.value)}
                                    className="text-sm border border-gray-300 rounded px-2 py-1"
                                  >
                                    <option value="profesional">Profesional</option>
                                    <option value="administrativo">Administrativo</option>
                                    <option value="recepcionista">Recepcionista</option>
                                  </select>
                                </td>
                                <td className="px-4 py-4">
                                  {(() => {
                                    // Deshabilitar el toggle admin para el propio usuario
                                    let currentUserId: string | null = null
                                    try {
                                      const raw = typeof window !== 'undefined' ? localStorage.getItem('sistema_auth_token') : null
                                      if (raw) {
                                        try {
                                          const parsed = JSON.parse(raw as string)
                                          currentUserId = parsed.userId || parsed.id || null
                                        } catch {}
                                      }
                                      if (!currentUserId && typeof window !== 'undefined') {
                                        currentUserId = localStorage.getItem('usuario_id')
                                      }
                                    } catch {}
                                    const isSelf = String(usuario.id) === String(currentUserId)
                                    return (
                                      <input
                                        type="checkbox"
                                        checked={usuario.esAdmin || false}
                                        onChange={() => toggleUserAdmin(String(usuario.id))}
                                        disabled={isSelf}
                                        title={isSelf ? 'No puedes quitarte tu propio permiso de administrador' : 'Cambiar estado de administrador'}
                                        className="w-4 h-4 text-blue-600 rounded disabled:opacity-50"
                                      />
                                    )
                                  })()}
                                </td>
                                <td className="px-4 py-4">
                                  {(() => {
                                    // Deshabilitar la auto-desactivación para el propio usuario
                                    let currentUserId: string | null = null
                                    try {
                                      const raw = typeof window !== 'undefined' ? localStorage.getItem('sistema_auth_token') : null
                                      if (raw) {
                                        try {
                                          const parsed = JSON.parse(raw as string)
                                          currentUserId = parsed.userId || parsed.id || null
                                        } catch {}
                                      }
                                      if (!currentUserId && typeof window !== 'undefined') {
                                        currentUserId = localStorage.getItem('usuario_id')
                                      }
                                    } catch {}
                                    const isSelf = String(usuario.id) === String(currentUserId)
                                    const handleClick = () => {
                                      if (isSelf) return
                                      toggleUserActive(String(usuario.id))
                                    }
                                    return (
                                      <button
                                        onClick={handleClick}
                                        disabled={isSelf}
                                        title={isSelf ? 'No puedes desactivar tu propia cuenta' : (usuario.activo ? 'Desactivar usuario' : 'Activar usuario')}
                                        className={`px-3 py-1 text-xs rounded-full ${
                                          usuario.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                                        } ${isSelf ? 'opacity-60 cursor-not-allowed' : ''}`}
                                      >
                                        {usuario.activo ? "Activo" : "Inactivo"}
                                      </button>
                                    )
                                  })()}
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleOpenEditUser(usuario)}
                                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                      title="Editar usuario"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleRegenerateAndCopyPassword(String(usuario.id))}
                                      className={`p-1 rounded transition-all ${
                                        copiedPasswordUserId === String(usuario.id)
                                          ? 'bg-green-100 text-green-600'
                                          : 'text-blue-600 hover:bg-blue-50'
                                      }`}
                                      title="Regenerar y copiar contraseña temporal"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => deleteUserFirestore(String(usuario.id))}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                      title="Eliminar usuario"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {configView === "database" && (
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Configuración de Base de Datos</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Database className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Backup Automático</p>
                          <p className="text-sm text-gray-600">Realizar copias de seguridad diarias</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {configView === "registros" && (
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Autorizar Registros de Solicitudes</h3>
                  </div>
                  <div className="p-6">
                    <SolicitudesAuthorizationList />
                  </div>
                </div>
              )}

              {configView === "admin" && (
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">🚀 Panel Administrador</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900 font-medium">Herramientas Avanzadas</p>
                      <p className="text-xs text-blue-700 mt-2">Inicializar base de datos, sincronizar colecciones y gestionar configuración global del sistema.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {showModuloListModal && (
            <ModuloListModal
              modulos={modulos.filter((m) => m.profesionalId === currentUser.id)}
              onClose={() => setShowModuloListModal(false)}
              onEdit={handleEditModuloFromList}
              onDelete={handleDeleteModuloFromList}
            />
          )}
          {/* Modal para forzar cambio de contraseña */}
          <ForcePasswordChangeModal
            isOpen={showPasswordChangeModal}
            userEmail={currentUser?.email || ''}
            userId={currentUser?.id || ''}
            onPasswordChanged={handlePasswordChanged}
          />
          {/* Modal para editar usuario */}
          <EditUserModal
            isOpen={showEditUserModal}
            usuario={editingUser}
            onClose={handleCloseEditUser}
            onSave={handleSaveEditUser}
          />
          </div>
        </div>
      </main>
    </div>
  )
}
