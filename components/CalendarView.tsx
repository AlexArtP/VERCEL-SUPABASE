"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { getWeekModules, getWeekCitas } from "@/lib/supabaseHelpers"
import { calcularInstancias } from "@/lib/utils"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import type { Modulo, Cita, Paciente } from "@/types"
import type { PlantillaModulo } from "@/lib/demoData"
import { X, Plus, Edit, Trash2, UserPlus, Check, AlertCircle } from "lucide-react"
import { ConfirmModal } from "./ConfirmAlertModals"
import { DEMO_DATA } from "@/lib/demoData"
import { PROFESIONES } from "@/lib/validations"
import { ModuloListModal } from "./ModuloListModal"
import { PlantillaListModal } from "./PlantillaListModal"
import { useSupabaseProfesionales } from "@/lib/hooks/useSupabaseProfesionales"
import { useData } from "@/contexts/DataContext"
import { useSupabaseCitas } from "@/lib/hooks/useSupabaseCitas"
// TimePickerClock removed: no longer used in this modal

// Plantillas predefinidas para crear módulos rápidamente
const PLANTILLAS_PREDEFINIDAS = [
  {
    id: "ingreso",
    nombre: "Ingreso",
    tipo: "Ingreso",
    duracion: 60,
    observaciones: "Ingreso de paciente nuevo",
    color: "#3498db", // Azul
  },
  {
    id: "control",
    nombre: "Control",
    tipo: "Control",
    duracion: 45,
    observaciones: "Control de paciente",
    color: "#f39c12", // Naranja
  },
]

// Función para determinar si el color es claro u oscuro (retorna texto blanco o negro)
function getContrastTextColor(hexColor: string): string {
  // Remover el # si existe
  const hex = hexColor.replace("#", "");
  // Convertir a RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Calcular luminancia (fórmula estándar)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  // Si es claro (luminancia > 0.5), usar texto oscuro; si es oscuro, usar texto claro
  return luminance > 0.5 ? "#222222" : "#ffffff";
}

function eventContent(arg: any) {
  const event = arg?.event
  const title = event?._def?.title ?? ""
  if (event?.extendedProps?.type === "cita") {
    const cita = event.extendedProps.data as Cita
    const tipoModulo = cita.tipo || "Control"
    const pacienteRun = (cita as any).pacienteRun || (cita as any).paciente_run || ""
    const pacienteTelefono = (cita as any).pacienteTelefono || (cita as any).paciente_telefono || ""
    const pacienteNombreCompleto = cita.pacienteNombre || ""
    
    return (
      <div className="relative w-full h-full flex flex-col text-xs p-1 gap-0.5">
        {/* Header: Agendado + Tipo de módulo + Estado en una línea */}
        <div className="flex gap-1 items-center justify-between">
          <div className="flex gap-1 items-center min-w-0 flex-1">
            <div className="bg-green-500 text-white rounded px-2 py-0.5 font-bold text-xs flex-shrink-0">Agendado</div>
            <div className="text-blue-900 font-semibold truncate">
              {tipoModulo}
            </div>
          </div>
          {cita?.esSobrecupo ? (
            <span className="px-1.5 py-0.5 text-xs rounded bg-red-500 text-white flex items-center gap-0.5 flex-shrink-0">
              <AlertCircle className="w-3 h-3" />
            </span>
          ) : cita?.estado === 'confirmada' ? (
            <span className="px-1.5 py-0.5 text-xs rounded bg-blue-600 text-white flex items-center gap-0.5 flex-shrink-0">
              <Check className="w-3 h-3" />
            </span>
          ) : cita?.estado === 'pendiente' ? (
            <span className="px-1.5 py-0.5 text-xs rounded bg-red-600 text-white font-bold flex-shrink-0">P</span>
          ) : null}
        </div>
        
        {/* Nombre del paciente */}
        <div className="font-semibold text-gray-900 truncate">
          {pacienteNombreCompleto}
        </div>
        
        {/* RUN */}
        {pacienteRun && <div className="text-gray-600 truncate">RUN: {pacienteRun}</div>}
        
        {/* Hora */}
        <div className="text-gray-800 font-medium">
          🕐 {cita.hora}
        </div>
      </div>
    )
  }
  if (event?.extendedProps?.type === "modulo") {
    const modulo = event.extendedProps.data as Modulo;
    // Acceso a window.selectedModulos para saber si hay selección múltiple
    let isSelected = false;
    if (typeof window !== "undefined" && Array.isArray((window as any).selectedModulos)) {
      isSelected = (window as any).selectedModulos.includes(modulo.id);
    }
    // Calcular color de texto basado en el color de fondo del módulo
    const backgroundColor = modulo.color || "#3b82f6";
    const textColor = getContrastTextColor(backgroundColor);
    
    return (
      <div className="w-full h-full flex flex-col justify-between text-xs relative" style={{ color: textColor }}>
        {/* Checkbox de selección múltiple interactivo */}
        {Array.isArray((window as any).selectedModulos) && (window as any).selectedModulos.length > 0 && (
          <span
            className="absolute z-20 bg-white bg-opacity-90 rounded shadow"
            style={{ top: 2, left: 2, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            onClick={e => {
              e.stopPropagation();
              if (typeof window !== 'undefined' && window.dispatchEvent) {
                const evt = new CustomEvent('toggleModuloCheck', { detail: modulo.id });
                window.dispatchEvent(evt);
                // Seleccionar el módulo inmediatamente
                const evt2 = new CustomEvent('selectModuloFromCheck', { detail: modulo });
                window.dispatchEvent(evt2);
              }
            }}
          >
            <input
              type="checkbox"
              checked={isSelected}
              readOnly
              className="w-4 h-4 align-middle cursor-pointer"
              style={{ pointerEvents: 'auto', margin: 0 }}
              tabIndex={-1}
            />
          </span>
        )}
        <span className="font-semibold pr-6 block truncate" style={{ color: textColor }}>{title}</span>
        {/* Mostrar rango de horas: horaInicio-horaFin */}
        <span className="font-semibold text-sm" style={{ color: textColor }}>
          {modulo.horaInicio && modulo.horaFin ? `${modulo.horaInicio.substring(0, 5)}-${modulo.horaFin.substring(0, 5)}` : ''}
        </span>
        {modulo.profesion && <span className="truncate font-semibold" style={{ color: textColor, display: 'inline-block', maxWidth: '100%' }}>{modulo.profesion}</span>}
        {modulo.observaciones && <span className="truncate italic" style={{ color: textColor, opacity: 0.9 }}>{modulo.observaciones}</span>}
      </div>
    );
  }
  return <span>{title}</span>
}

interface CalendarViewProps {
  modulos: Modulo[]
  citas: Cita[]
  pacientes: Paciente[]
  plantillas: any[]
  currentUser: any
  onModuloCreate: (modulo: Omit<Modulo, "id">) => void
  onModulosCreateBatch?: (modulos: Omit<Modulo, "id">[]) => void
  onModuloUpdate: (id: string, modulo: Partial<Modulo>) => void
  onModuloDelete: (ids: string[]) => void
  onCitaCreate: (cita: Omit<Cita, "id">) => void
  onCitaUpdate: (id: string, cita: Partial<Cita>) => void
  onCitaDelete: (id: string) => void
  onPlantillaCreate: (plantilla: any) => void
  onPlantillaUpdate: (id: string, plantilla: any) => void
  onPlantillaDelete: (id: string) => void
  onVisibleRangeChange?: (startISO: string, endISO: string) => void
}

export function CalendarView(props: CalendarViewProps) {
  // Estilos para deshabilitar y colorear el domingo
  // Puedes mover esto a un archivo CSS si lo prefieres
  const style = `
    .fc-domingo-disabled, .fc-day-sun, .fc-col-header-cell.fc-day-sun {
      background: #ffe4ef !important;
      pointer-events: none !important;
      opacity: 0.7;
    }
    .fc-timegrid-col.fc-day-sun {
      background: #ffe4ef !important;
      pointer-events: none !important;
      opacity: 0.7;
    }
    /* Permitir que los tooltips y popovers de FullCalendar salgan del contenedor */
    .fc {
      overflow: visible !important;
    }
    .fc-popover {
      position: fixed !important;
      z-index: 9999 !important;
      overflow: visible !important;
    }
    .fc-popover-body {
      overflow: visible !important;
      max-height: none !important;
    }
    /* Contenedor debe permitir popovers */
    .fc-daygrid-dot-container,
    .fc-timegrid {
      position: relative;
    }
  `;
  // Seleccionar el módulo inmediatamente al hacer clic en el checklist
  useEffect(() => {
    function handleSelectModuloFromCheck(e: any) {
      setSelectedModulo(e.detail);
    }
    window.addEventListener('selectModuloFromCheck', handleSelectModuloFromCheck);
    return () => window.removeEventListener('selectModuloFromCheck', handleSelectModuloFromCheck);
  }, []);
  // Permitir que el checkbox de selección múltiple sea interactivo
  useEffect(() => {
    function handleToggleModuloCheck(e: any) {
      const id = e.detail;
      setSelectedModulos((prev) => prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]);
    }
    window.addEventListener('toggleModuloCheck', handleToggleModuloCheck);
    return () => window.removeEventListener('toggleModuloCheck', handleToggleModuloCheck);
  }, []);
  const {
    modulos,
    citas,
    pacientes,
    plantillas,
    currentUser,
    onModuloCreate,
    onModulosCreateBatch,
    onModuloUpdate,
    onModuloDelete,
    onCitaCreate,
    onCitaUpdate,
    onCitaDelete,
    onPlantillaCreate,
    onPlantillaUpdate,
    onPlantillaDelete,
    onVisibleRangeChange,
  } = props

  // Declarar selectedModulos y sincronizar con window al inicio
  const [selectedModulos, setSelectedModulos] = useState<string[]>([]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).selectedModulos = selectedModulos;
    }
    return () => {
      if (typeof window !== "undefined") {
        (window as any).selectedModulos = [];
      }
    };
  }, [selectedModulos]);

  // ✅ Comentado: ya no usar profesionales demo
  // const profesionales = DEMO_DATA.usuarios.filter((u: any) => u.rol === "profesional")
  const calendarRef = useRef<any>(null)
  const calendarContainerRef = useRef<HTMLDivElement>(null)
  const [selectedProfesionalId, setSelectedProfesionalId] = useState<string | null>(null)

  // Conectar con DataContext para propagar la selección global
  const dataContext = useData()

  // No preseleccionar ningún profesional por defecto.
  // El profesional debe ser seleccionado por el usuario desde el select.
  // Si un componente exterior (DataContext) establece `activeProfesionalId`,
  // éste se sincroniza en el siguiente useEffect.

  // Si DataContext tiene activeProfesionalId, sincronizar el selector local con él
  useEffect(() => {
    if (dataContext?.activeProfesionalId) {
      setSelectedProfesionalId(String(dataContext.activeProfesionalId))
    }
  }, [dataContext?.activeProfesionalId])

  // 🔥 NUEVO: Obtener profesionales y citas desde Supabase (anon client + RLS)
  const { profesionales: profesionalesSupabase, loading: profesionalesLoading, error: profesionalesError } = useSupabaseProfesionales()
  const { citas: citasSupabase, loading: citasLoading, error: citasError } = useSupabaseCitas(selectedProfesionalId || null)

  // ✅ Usar SOLO profesionales registrados desde Supabase (profesional: true)
  // No usar fallback a DEMO_DATA, solo profesionales reales registrados
  const profesionalesActuales = profesionalesSupabase && profesionalesSupabase.length > 0 
    ? profesionalesSupabase.filter((u: any) => u.profesional === true)
    : []
  
  const selectedProfesional = selectedProfesionalId
    ? (profesionalesActuales.find((u: any) => u.id === selectedProfesionalId) || null)
    : null
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; event: any; type: "modulo" | "cita" } | null>(null)
  const [showModuloModal, setShowModuloModal] = useState(false)
  const [showCitaModal, setShowCitaModal] = useState(false)
  const [sobrecupoMode, setSobrecupoMode] = useState(false)
  const [selectedModulo, setSelectedModulo] = useState<Modulo | null>(null)
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null)
  const [slotInfo, setSlotInfo] = useState<{ start: Date; end: Date; fecha: string; horaInicio: string; horaFin: string } | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; cita?: Cita; modulo?: Modulo } | null>(null)
  const tooltipTimeout = useRef<NodeJS.Timeout | null>(null)
  const [liveSelection, setLiveSelection] = useState<{ open: boolean; x: number; y: number; fecha?: string; horaInicio?: string; horaFin?: string; minutes?: number } | null>(null)
  const [slotTooltip, setSlotTooltip] = useState<{ x: number; y: number; time: string } | null>(null)
  const [dropRejectInfo, setDropRejectInfo] = useState<any | null>(null)
  const selectingRef = useRef<{ startDate?: Date; startY?: number; colIndex?: number; dateStr?: string } | null>(null)
  const slotTooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  // Estado para previsualización dinámica mientras se arrastra un módulo
  const [dragModuloPreview, setDragModuloPreview] = useState<{ id: string; fecha: string; horaInicio: string; horaFin: string; durationMin: number; collisionModulo: boolean; collisionCita: boolean; x: number; y: number } | null>(null)
  // Posición del cursor mientras se arrastra (para ubicar tooltip)
  const dragCursorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  
  // Función auxiliar para calcular posición relativa al contenedor del calendario
  const getRelativePosition = (clientX: number, clientY: number) => {
    if (!calendarContainerRef.current) return { x: clientX, y: clientY };
    const rect = calendarContainerRef.current.getBoundingClientRect();
    // calcular posición relativa
    let x = clientX - rect.left;
    let y = clientY - rect.top;
    // hacer clamping para que el tooltip no salga del contenedor
    // asumimos tamaño aproximado del tooltip: width ~ 200, height ~ 80 (ajustable)
    const tooltipW = 220;
    const tooltipH = 90;
    const padding = 8;
    const minX = padding;
    const minY = padding;
    const maxX = Math.max(0, rect.width - tooltipW - padding);
    const maxY = Math.max(0, rect.height - tooltipH - padding);
    if (x < minX) x = minX;
    if (x > maxX) x = maxX;
    if (y < minY) y = minY;
    if (y > maxY) y = maxY;
    return { x, y };
  }

  // Posición en pantalla (para tooltips fixed) acotada al rectángulo del calendario
  const getClampedFixedPosition = (clientX: number, clientY: number) => {
    if (!calendarContainerRef.current) return { x: clientX, y: clientY }
    const rect = calendarContainerRef.current.getBoundingClientRect()
    const tooltipW = 160 // tamaño aprox del tooltip azul de hora
    const tooltipH = 52
    const padding = 8
    let x = clientX
    let y = clientY
    const minX = rect.left + padding
    const minY = rect.top + padding
    const maxX = rect.right - tooltipW - padding
    const maxY = rect.bottom - tooltipH - padding
    if (x < minX) x = minX
    if (x > maxX) x = maxX
    if (y < minY) y = minY
    if (y > maxY) y = maxY
    return { x, y }
  }
  
  // limpiar selectingRef cuando se abre modal de cita (evita que mouseup posterior actúe)
  useEffect(() => {
    if (showCitaModal) selectingRef.current = null
  }, [showCitaModal])
  
  const [citaAEliminar, setCitaAEliminar] = useState<{ id: string } | null>(null)
  // ahora almacenamos el id del documento de Firestore (string) o null
  const [moduloAEliminar, setModuloAEliminar] = useState<string | null>(null)
  // States para el modal de crear módulo
  const [selectedPlantillaTemplate, setSelectedPlantillaTemplate] = useState<{ id: string; nombre?: string; tipo: string; duracion: number; observaciones: string; color: string } | null>(null)
  const [showGestionModulosModal, setShowGestionModulosModal] = useState(false)
  const [showPlantillaListModal, setShowPlantillaListModal] = useState(false)
  const [editingCita, setEditingCita] = useState<Cita | null>(null)
  const [openModuloForEdit, setOpenModuloForEdit] = useState(false)
  const [moduloExistenteId, setModuloExistenteId] = useState<string | null>(null)
  const [editingPlantilla, setEditingPlantilla] = useState<PlantillaModulo | null>(null)
  const [showPlantillaEditModal, setShowPlantillaEditModal] = useState(false)
  const [plantillaConfirmPropagation, setPlantillaConfirmPropagation] = useState<{ open: boolean; plantilla: PlantillaModulo; instanceCount: number } | null>(null)
  const [confirmEliminarSeleccionados, setConfirmEliminarSeleccionados] = useState(false)
  const [confirmEliminarSemana, setConfirmEliminarSemana] = useState<{ open: boolean; ids: string[] } | null>(null)
  // Modal para copiar estructura de semana
  const [copiarSemanaModal, setCopiarSemanaModal] = useState<{ open: boolean; originMonday: Date; profesionalId: string | null } | null>(null)
  const [copiarSemanaSourceModulos, setCopiarSemanaSourceModulos] = useState<Modulo[]>([])
  const [weekPickerMonth, setWeekPickerMonth] = useState<Date>(new Date())
  // Selecciones de semanas destino (ISO YYYY-MM-DD del lunes de cada semana)
  const [copiarSemanaTargets, setCopiarSemanaTargets] = useState<string[]>([])
  // Modal y selecciones para eliminar módulos por semana
  const [eliminarSemanaModal, setEliminarSemanaModal] = useState<{ open: boolean; profesionalId: string | number } | null>(null)
  const [eliminarSemanaTargets, setEliminarSemanaTargets] = useState<string[]>([])

  // Cargar módulos de la semana origen cuando se abre el modal de copiar, incluso si está fuera del rango visible
  useEffect(() => {
    const run = async () => {
      if (!copiarSemanaModal?.open || !copiarSemanaModal.profesionalId) {
        setCopiarSemanaSourceModulos([])
        return
      }
      try {
        const fromMonday = new Date(copiarSemanaModal.originMonday)
        const fromSunday = new Date(fromMonday)
        fromSunday.setDate(fromMonday.getDate() + 6)
        const startISO = toISODate(fromMonday)
        const endISO = toISODate(fromSunday)
        const list = await getWeekModules(String(copiarSemanaModal.profesionalId), startISO, endISO)
        setCopiarSemanaSourceModulos(list as any)
      } catch (e) {
        console.error('Error cargando módulos de la semana origen:', e)
        setCopiarSemanaSourceModulos([])
      }
    }
    run()
  }, [copiarSemanaModal?.open, copiarSemanaModal?.profesionalId, copiarSemanaModal?.originMonday])
  // Preview de módulos excluidos antes de confirmar eliminación masiva
  const [excludedPreview, setExcludedPreview] = useState<{ open: boolean; excluded: { id: string; tipo?: string; fecha: string; horaInicio: string }[]; toDelete: string[] } | null>(null)
  // Estado para rango modificado en "Asignar módulo"
  const [rangoModificado, setRangoModificado] = useState<{ horaInicio: string; horaFin: string } | null>(null)

  // ✅ Ocultar tooltip de hora cuando se abre cualquier modal
  useEffect(() => {
    const anyModalOpen = showModuloModal || showCitaModal || showGestionModulosModal || 
                         showPlantillaListModal || showPlantillaEditModal || 
                         copiarSemanaModal?.open || eliminarSemanaModal?.open || 
                         excludedPreview?.open || confirmEliminarSeleccionados || 
                         !!confirmEliminarSemana?.open || !!plantillaConfirmPropagation?.open;
    
    if (anyModalOpen) {
      setSlotTooltip(null);
      if (slotTooltipTimeoutRef.current) {
        clearTimeout(slotTooltipTimeoutRef.current);
      }
    }
  }, [showModuloModal, showCitaModal, showGestionModulosModal, showPlantillaListModal, 
      showPlantillaEditModal, copiarSemanaModal?.open, eliminarSemanaModal?.open, 
      excludedPreview?.open, confirmEliminarSeleccionados, confirmEliminarSemana?.open, 
      plantillaConfirmPropagation?.open])

  const plantillaSeleccionada = moduloExistenteId != null ? (plantillas.find((p: PlantillaModulo) => String((p as any).id) === moduloExistenteId) ?? null) : null
  // Calcular instancias según rango y duración de plantilla
  const instanciasCalculadas = useMemo(() => {
    if (!plantillaSeleccionada || !slotInfo) return [] as { horaInicio: string; horaFin: string }[];
    const horaIni = rangoModificado?.horaInicio ?? slotInfo.horaInicio;
    const horaF = rangoModificado?.horaFin ?? slotInfo.horaFin;
    return calcularInstancias(horaIni, horaF, Number(plantillaSeleccionada.duracion));
  }, [rangoModificado, slotInfo, plantillaSeleccionada]);

  function normalizeCitaToModulo(cita: any, modulo: any | undefined) {
    let horaInicio = cita.hora
    let horaFin = modulo ? modulo.horaFin : cita.hora
    if (modulo) {
      if (horaInicio < modulo.horaInicio) horaInicio = modulo.horaInicio
      if (horaFin > modulo.horaFin) horaFin = modulo.horaFin
    }
    return { horaInicio, horaFin }
  }

  const modulosFiltrados = useMemo(() => {
    if (!selectedProfesionalId) return modulos
    const mf = modulos.filter((m) => String((m as any).profesionalId) === selectedProfesionalId)
    if (mf.length === 0 && modulos.length > 0) {
      // DEBUG: imprimir información que ayuda a diagnosticar mismatch entre
      // selectedProfesionalId y los valores guardados en modulos[].profesionalId
      try {
  console.groupCollapsed('⚠️ Filtro por profesional vacío. DEBUG filtro profesional')
  console.warn('⚠️ Filtro por profesional vacío. No se mostrarán módulos hasta resolver mismatch UID/fuente de datos.')
        console.log('DEBUG selectedProfesionalId (raw):', selectedProfesionalId)
        console.log('DEBUG selectedProfesionalId (type):', typeof selectedProfesionalId)
        // Mostrar hasta 20 módulos para inspección rápida
        const sample = modulos.slice(0, 20).map((m: any) => ({ id: m.id, profesionalId: m.profesionalId, typeof_profesionalId: typeof m.profesionalId, profesionalNombre: m.profesionalNombre }))
        console.table(sample)
        // También buscar coincidencias por conversión laxa (solo para diagnóstico)
        const fuzzy = modulos.filter((m) => String(m.profesionalId) === String(selectedProfesionalId))
        console.log('DEBUG coincidencias por String(...) (count):', fuzzy.length)
        console.groupEnd()
      } catch (e) {
        console.warn('DEBUG: error imprimiendo información del filtro:', e)
      }
      // Seguridad: si no hay coincidencias claras, no mostramos módulos de otros profesionales
      return []
    }
    return mf
  }, [modulos, selectedProfesionalId])

  // ✅ NUEVO: Preferir citas del DataContext (que están sincronizadas en tiempo real)
  // Fallback a citasSupabase solo si DataContext no tiene nada
  const citasSource = (citas && citas.length > 0) ? citas : (citasSupabase && citasSupabase.length > 0) ? citasSupabase : []

  const citasFiltradas = useMemo(() => {
    if (!selectedProfesionalId) return citasSource
    const cf = citasSource.filter((c) => String((c as any).profesionalId) === selectedProfesionalId)
    if (cf.length === 0 && citasSource.length > 0) {
      console.warn('⚠️ Filtro por profesional en citas vacío. Usando todas las citas.')
      return citasSource
    }
    return cf
  }, [citasSource, selectedProfesionalId])

  // Handlers para mostrar rango dinámico mientras se arrastra un módulo
  // Nota: deben estar en el ámbito del componente (no dentro de handleEventDrop)
  // para que puedan referenciarse desde las props de FullCalendar.
  const syntheticDropRef = useRef<{ id: string; ts: number } | null>(null)

  const handleEventDragStart = (info: any) => {
    if (info.event.extendedProps.type !== 'modulo') return
    try { console.log('[CalendarView] eventDragStart ->', { id: info.event.id, start: info.event.start, end: info.event.end }) } catch {}
    // Guardar estado inicial para comparación en el fallback
    try {
      (dragCursorRef as any).startMeta = {
        id: info.event.id,
        start: new Date(info.event.start?.getTime?.() || Date.now()),
        end: info.event.end ? new Date(info.event.end.getTime()) : null,
      }
    } catch {}
    // Capturar posición de cursor inicial
    dragCursorRef.current = { x: info.jsEvent?.clientX || 0, y: info.jsEvent?.clientY || 0 }
    // Crear preview inicial
    try {
      const ev = info.event
      const pad = (n: number) => String(n).padStart(2, '0')
      const fecha = `${ev.start.getFullYear()}-${pad(ev.start.getMonth()+1)}-${pad(ev.start.getDate())}`
      const horaInicio = ev.start.toTimeString().slice(0,5)
      const horaFin = ev.end ? ev.end.toTimeString().slice(0,5) : horaInicio
      const durationMin = Math.max(5, Math.round(((ev.end?.getTime?.() || ev.start.getTime()) - ev.start.getTime()) / 60000))
      setDragModuloPreview({ id: String((ev.extendedProps.data as any).id), fecha, horaInicio, horaFin, durationMin, collisionModulo: false, collisionCita: false, x: dragCursorRef.current.x, y: dragCursorRef.current.y })
    } catch {}
  }

  const handleEventDragStop = (info: any) => {
    if (info.event.extendedProps.type !== 'modulo') return
    try { console.log('[CalendarView] eventDragStop ->', { id: info.event.id, start: info.event.start, end: info.event.end }) } catch {}
    // Fallback: si eventDrop no se dispara, usamos el último preview para calcular el destino
    try {
      const startMeta = (dragCursorRef as any).startMeta
      const pv = dragModuloPreview
      if (pv && startMeta && startMeta.id === info.event.id) {
        const pad = (n: number) => String(n).padStart(2, '0')
        // Construir fechas desde el preview
        const targetStartRaw = `${pv.fecha}T${pv.horaInicio}`
        const targetEndRaw = `${pv.fecha}T${pv.horaFin}`
        const targetStart = new Date(targetStartRaw)
        const targetEnd = new Date(targetEndRaw)
        // Normalizar a múltiplos de 5 y clamp en 08:00-20:00
        const clampTime = (d: Date) => {
          const minutes = d.getHours() * 60 + d.getMinutes()
          const rounded = Math.round(minutes / 5) * 5
          const hh = Math.floor(rounded / 60)
          const mm = rounded % 60
          const nd = new Date(d)
          nd.setHours(hh, mm, 0, 0)
          return nd
        }
        const checkedStart = clampTime(targetStart)
        const checkedEnd = clampTime(targetEnd)
        const dayMin = new Date(`${pv.fecha}T08:00`)
        const dayMax = new Date(`${pv.fecha}T20:00`)
        if (checkedStart < dayMin) checkedStart.setTime(dayMin.getTime())
        if (checkedEnd > dayMax) checkedEnd.setTime(dayMax.getTime())

        // Comparar con el inicio original
        const origDate = `${startMeta.start.getFullYear()}-${pad(startMeta.start.getMonth()+1)}-${pad(startMeta.start.getDate())}`
        const origHM = `${pad(startMeta.start.getHours())}:${pad(startMeta.start.getMinutes())}`
        const newHM = `${pad(checkedStart.getHours())}:${pad(checkedStart.getMinutes())}`
        const changed = pv.fecha !== origDate || newHM !== origHM

        if (changed) {
          // Validar colisiones igual que en handleEventDrop
          const collidingModulos = modulosFiltrados.filter((m) => {
            if (String(m.id) === String((info.event.extendedProps.data as any).id)) return false
            const mFecha = String(m.fecha).slice(0, 10)
            if (mFecha !== pv.fecha) return false
            const mStart = new Date(`${mFecha}T${m.horaInicio}`)
            const mEnd = new Date(`${mFecha}T${m.horaFin}`)
            return checkedStart < mEnd && checkedEnd > mStart
          })
          const collidingCitas = citasFiltradas.filter((c) => {
            try {
              const cFecha = String(c.fecha).slice(0, 10)
              if (cFecha !== pv.fecha) return false
              const maybeHora = (c as any).hora || (c as any).horaInicio || (c as any).hora_inicio || null
              const maybeHoraFin = (c as any).horaFin || (c as any).hora_fin || (c as any).horaFin || null
              if (!maybeHora && !maybeHoraFin) return false
              let cStartStr: string | null = maybeHora
              let cEndStr: string | null = maybeHoraFin
              if (!cStartStr && cEndStr) cStartStr = cEndStr
              if (!cEndStr && cStartStr) cEndStr = cStartStr
              if (!cStartStr || !cEndStr) return false
              const cStart = new Date(`${cFecha}T${cStartStr}`)
              const cEnd = new Date(`${cFecha}T${cEndStr}`)
              return checkedStart < cEnd && checkedEnd > cStart
            } catch {
              return false
            }
          })
          if (collidingModulos.length === 0 && collidingCitas.length === 0) {
            // Aplicar de inmediato en UI
            const api = calendarRef.current?.getApi?.()
            try {
              const ev = api?.getEventById(info.event.id)
              ev?.setStart(checkedStart)
              ev?.setEnd(checkedEnd)
            } catch {}
            // Persistir
            const fecha = pv.fecha
            const horaInicio = `${pad(checkedStart.getHours())}:${pad(checkedStart.getMinutes())}`
            const horaFin = `${pad(checkedEnd.getHours())}:${pad(checkedEnd.getMinutes())}`
            try { console.log('[CalendarView] fallbackDragStop -> onModuloUpdate()', { id: (info.event.extendedProps.data as any).id, fecha, horaInicio, horaFin }) } catch {}
            try { syntheticDropRef.current = { id: String(info.event.id), ts: Date.now() } } catch {}
            onModuloUpdate((info.event.extendedProps.data as any).id, { fecha, horaInicio, horaFin })
          } else {
            try { console.warn('[CalendarView] fallbackDragStop -> cancelado por colisión') } catch {}
          }
        } else {
          try { console.log('[CalendarView] fallbackDragStop -> sin cambios, no persiste') } catch {}
        }
      }
    } catch {}
    setDragModuloPreview(null)
  }

  // Actualizar posición y rango del tooltip de arrastre para que siga al cursor y calcule horas dinámicamente
  useEffect(() => {
    if (!dragModuloPreview) return
    const onMove = (e: MouseEvent) => {
      dragCursorRef.current = { x: e.clientX, y: e.clientY }
      const pad = (n: number) => String(n).padStart(2,'0')
      // Detectar columna (día)
      const container = document.querySelector('.fc-timegrid') as HTMLElement | null
      const cols = container ? Array.from(container.querySelectorAll('.fc-timegrid-col')) as HTMLElement[] : []
      const headerCells = Array.from(document.querySelectorAll('.fc-col-header-cell')) as HTMLElement[]
      let colIndex = -1
      for (let i = 0; i < cols.length; i++) {
        const rect = cols[i].getBoundingClientRect()
        if (e.clientX >= rect.left && e.clientX <= rect.right) { colIndex = i; break }
      }
      const dateStr = colIndex >= 0 ? (cols[colIndex]?.getAttribute('data-date') || headerCells[colIndex]?.getAttribute('data-date') || dragModuloPreview.fecha) : dragModuloPreview.fecha
      // Parámetros configurados (slotMin/slotMax) - mantener hardcode si no disponibles
      const slotMin = 8 * 60
      const slotMax = 20 * 60
      // Usar filas reales de slots para mapear Y -> minutos (más preciso que altura total visible)
      const slotsEl = document.querySelector('.fc-timegrid-slots') as HTMLElement | null
      const slotRows = slotsEl ? Array.from(slotsEl.querySelectorAll('.fc-timegrid-slot')) as HTMLElement[] : []
      // Helper para convertir HH:MM(:SS) a minutos
      const timeToMin = (t: string) => {
        const [hh, mm] = t.split(':').map(Number)
        return hh * 60 + mm
      }
      let minutesFromY: number | null = null
      if (slotRows.length > 1) {
        // Encontrar la fila en la que está el cursor
        for (let i = 0; i < slotRows.length; i++) {
          const r = slotRows[i].getBoundingClientRect()
            // Añadimos pequeño margen inferior para incluir el borde
          if (e.clientY >= r.top && e.clientY < r.bottom + 0.5) {
            const currentTimeAttr = slotRows[i].getAttribute('data-time')
            // Buscar siguiente fila con data-time para interpolar
            let nextTimeAttr: string | null = null
            for (let j = i + 1; j < slotRows.length; j++) {
              const nt = slotRows[j].getAttribute('data-time')
              if (nt) { nextTimeAttr = nt; break }
            }
            if (currentTimeAttr) {
              const currentMin = timeToMin(currentTimeAttr)
              const nextMin = nextTimeAttr ? timeToMin(nextTimeAttr) : currentMin + 30 // fallback 30m
              const proportion = Math.max(0, Math.min(1, (e.clientY - r.top) / (r.height)))
              minutesFromY = currentMin + proportion * (nextMin - currentMin)
              break
            }
          }
        }
      }
      // Fallback si no se pudo mapear con filas
      if (minutesFromY === null) {
        const colEl = colIndex >= 0 ? cols[colIndex] : null
        const headerRect = colIndex >= 0 ? headerCells[colIndex]?.getBoundingClientRect() : null
        const colRect = colEl?.getBoundingClientRect() || null
        const top = headerRect ? headerRect.bottom : (colRect ? colRect.top : e.clientY)
        const bottom = colRect ? colRect.bottom : e.clientY
        const height = Math.max(1, (bottom - top))
        const rel = Math.max(0, Math.min(1, (e.clientY - top) / height))
        minutesFromY = slotMin + rel * (slotMax - slotMin)
      }
      // Redondeo y clamping
      const clamp = (m: number) => Math.max(slotMin, Math.min(slotMax, m))
      const startMin = clamp(Math.round(minutesFromY / 5) * 5)
      const endMin = clamp(startMin + dragModuloPreview.durationMin)
      const hm = (m: number) => `${pad(Math.floor(m/60))}:${pad(m%60)}`
      const horaInicio = hm(startMin)
      const horaFin = hm(endMin)
      // Colisiones preliminares usando nuevo rango
      const startDate = new Date(`${dateStr}T${horaInicio}`)
      const endDate = new Date(`${dateStr}T${horaFin}`)
      const collisionModulo = modulosFiltrados.some(m => {
        if (String(m.id) === dragModuloPreview.id) return false
        if (String(m.fecha).slice(0,10) !== dateStr) return false
        const mStart = new Date(`${m.fecha}T${m.horaInicio}`)
        const mEnd = new Date(`${m.fecha}T${m.horaFin}`)
        return startDate < mEnd && endDate > mStart
      })
      const collisionCita = citasFiltradas.some(c => {
        if (String(c.fecha).slice(0,10) !== dateStr) return false
        const maybeHora = (c as any).hora || (c as any).horaInicio || (c as any).hora_inicio || null
        const maybeHoraFin = (c as any).horaFin || (c as any).hora_fin || (c as any).horaFin || null
        if (!maybeHora && !maybeHoraFin) return false
        let cStartStr: string | null = maybeHora
        let cEndStr: string | null = maybeHoraFin
        if (!cStartStr && cEndStr) cStartStr = cEndStr
        if (!cEndStr && cStartStr) cEndStr = cStartStr
        if (!cStartStr || !cEndStr) return false
        const cStart = new Date(`${c.fecha}T${cStartStr}`)
        const cEnd = new Date(`${c.fecha}T${cEndStr}`)
        return startDate < cEnd && endDate > cStart
      })
      setDragModuloPreview(prev => prev ? { ...prev, x: e.clientX, y: e.clientY, fecha: dateStr, horaInicio, horaFin, collisionModulo, collisionCita } : prev)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [dragModuloPreview, modulosFiltrados, citasFiltradas])
  
  // DEBUG (comentados): logs de depuración que ya no usamos para reducir ruido en la consola
  // console.log('🔍 selectedProfesionalId:', selectedProfesionalId)
  // console.log('🔍 modulos.length:', modulos.length)
  // console.log('🔍 modulosFiltrados.length:', modulosFiltrados.length)
  
  const moduloIdsConCita = new Set(citasFiltradas.map((c) => c.moduloId))

  const events = [
    ...modulosFiltrados.filter((m) => !moduloIdsConCita.has(m.id)).map((modulo) => ({
      id: `modulo-${modulo.id}`,
      title: modulo.profesionalNombre ? `${modulo.tipo} - ${modulo.profesionalNombre}` : modulo.tipo,
      start: `${modulo.fecha}T${modulo.horaInicio}`,
      end: `${modulo.fecha}T${modulo.horaFin}`,
      backgroundColor: modulo.color,
      borderColor: modulo.color,
      extendedProps: { type: "modulo", data: modulo },
      editable: true,
      durationEditable: true,
    })),
    ...citasFiltradas.map((cita) => {
      const modulo = modulosFiltrados.find((m) => m.id === cita.moduloId)
      const { horaInicio, horaFin } = normalizeCitaToModulo(cita, modulo)
      const paciente = pacientes.find((p) => p.id === cita.pacienteId)
      const pacienteRun = paciente?.run || ""
      const title = `${cita.pacienteNombre} - ${pacienteRun}`
      // color según estado: pendiente -> amarillo, sobrecupo -> rojo, confirmado -> verde
      const bg = cita.estado === 'pendiente' ? '#f59e0b' : (cita.esSobrecupo ? '#ef4444' : '#10b981')
      const border = cita.estado === 'pendiente' ? '#b45309' : (cita.esSobrecupo ? '#dc2626' : '#059669')
      return {
        id: `cita-${cita.id}`,
        title,
        start: `${cita.fecha}T${horaInicio}`,
        end: `${cita.fecha}T${horaFin}`,
        backgroundColor: bg,
        borderColor: border,
        extendedProps: { type: "cita", data: cita },
        editable: false,
        display: "block",
        classNames: cita.esSobrecupo ? ["cita-sobrecupo"] : ["cita-agendada"],
      }
    }),
  ]

  const handleEventDrop = (info: any) => {
    const { event } = info
    const type = event.extendedProps.type
    const data = event.extendedProps.data
    try {
      if (syntheticDropRef.current && syntheticDropRef.current.id === String(event.id) && Date.now() - syntheticDropRef.current.ts < 2000) {
        console.log('[CalendarView] eventDrop skip -> ya manejado por fallbackDragStop')
        return
      }
    } catch {}
    try { console.log('[CalendarView] eventDrop fired', { id: event.id, type, start: event.start, end: event.end, dataId: data?.id }) } catch {}
    if (type === "modulo") {
  // Tomar horas desde el evento, pero usaremos versiones normalizadas/clamp para persistir
  const newStartRaw = event.start.toTimeString().slice(0, 5)
  const newEndRaw = event.end.toTimeString().slice(0, 5)
  // Nueva fecha (usar fecha local para evitar desfases UTC)
  const evStart = event.start
  const evEnd = event.end
  const pad = (n: number) => String(n).padStart(2, '0')
  const newFecha = `${evStart.getFullYear()}-${pad(evStart.getMonth() + 1)}-${pad(evStart.getDate())}`

  // Construir rangos Date para comprobar colisiones (local times)
  const startDate = new Date(`${newFecha}T${newStartRaw}`)
  const endDate = new Date(`${newFecha}T${newEndRaw}`)

  // Normalizar a múltiplos de 5 minutos y clamping al rango permitido (08:00 - 20:00)
  const clampTime = (d: Date) => {
    const minutes = d.getHours() * 60 + d.getMinutes()
    // redondear al múltiplo de 5 más cercano
    const rounded = Math.round(minutes / 5) * 5
    const hh = Math.floor(rounded / 60)
    const mm = rounded % 60
    const nd = new Date(d)
    nd.setHours(hh, mm, 0, 0)
    return nd
  }

  const startClamped = clampTime(startDate)
  const endClamped = clampTime(endDate)
  const dayMin = new Date(`${newFecha}T08:00`)
  const dayMax = new Date(`${newFecha}T20:00`)
  if (startClamped < dayMin) startClamped.setTime(dayMin.getTime())
  if (endClamped > dayMax) endClamped.setTime(dayMax.getTime())
  // reemplazar usados para chequeos
  const checkedStart = startClamped
  const checkedEnd = endClamped
  // Generar strings HH:MM normalizados para guardar
  const toHM = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
  const newStart = toHM(checkedStart)
  const newEnd = toHM(checkedEnd)

      // Comprobar colisión con otros módulos (excluir el propio)
      // DEBUG: informar rangos y módulos/citas del día para diagnosticar reverts
      try {
        console.debug('[handleEventDrop] debug pre-check', {
          dataId: data.id,
          newFecha,
          newStartRaw,
          newEndRaw,
          checkedStart: checkedStart.toISOString(),
          checkedEnd: checkedEnd.toISOString(),
          dayMin: dayMin.toISOString(),
          dayMax: dayMax.toISOString(),
          modulosEnDia: modulosFiltrados.filter(m => String(m.fecha).slice(0,10) === newFecha).map(m => ({ id: m.id, fecha: m.fecha, horaInicio: m.horaInicio, horaFin: m.horaFin })),
          citasEnDia: citasFiltradas.filter(c => String(c.fecha).slice(0,10) === newFecha).map(c => ({ id: c.id, fecha: c.fecha, hora: (c as any).hora || (c as any).hora_inicio || null, horaFin: (c as any).horaFin || (c as any).hora_fin || null }))
        })
      } catch (e) {
        // ignore
      }
      const collidingModulos = modulosFiltrados.filter((m) => {
        if (String(m.id) === String(data.id)) return false
        // Normalizar fecha a YYYY-MM-DD (algunos registros pueden traer time)
        const mFecha = String(m.fecha).slice(0, 10)
        if (mFecha !== newFecha) return false
        const mStart = new Date(`${mFecha}T${m.horaInicio}`)
        const mEnd = new Date(`${mFecha}T${m.horaFin}`)
        return checkedStart < mEnd && checkedEnd > mStart
      })
      const collisionModulo = collidingModulos.length > 0

      // Comprobar colisión con citas existentes (por fecha y horas).
      // Intentar usar hora/horaFin de la cita; si no están, usar el módulo relacionado.
      const collidingCitas = citasFiltradas.filter((c) => {
        try {
          const cFecha = String(c.fecha).slice(0, 10)
          if (cFecha !== newFecha) return false
          // Soportar variantes de nombre de campo: hora, horaInicio, hora_inicio
          const maybeHora = (c as any).hora || (c as any).horaInicio || (c as any).hora_inicio || null
          const maybeHoraFin = (c as any).horaFin || (c as any).hora_fin || (c as any).horaFin || null
          // Si la cita no tiene horas explícitas, no la consideramos para bloquear el movimiento.
          if (!maybeHora && !maybeHoraFin) return false
          let cStartStr: string | null = maybeHora
          let cEndStr: string | null = maybeHoraFin
          // Si falta alguno, rellenar conservadoramente con el otro (o con el mismo)
          if (!cStartStr && cEndStr) cStartStr = cEndStr
          if (!cEndStr && cStartStr) cEndStr = cStartStr
          if (!cStartStr || !cEndStr) return false
          const cStart = new Date(`${cFecha}T${cStartStr}`)
          const cEnd = new Date(`${cFecha}T${cEndStr}`)
          return checkedStart < cEnd && checkedEnd > cStart
        } catch (e) {
          console.warn('[handleEventDrop] Error evaluando cita para colisión', c, e)
          return false
        }
      })
      const collisionCita = collidingCitas.length > 0

      if (collisionModulo || collisionCita) {
        const rejectPayload = {
          collisionModulo,
          collisionCita,
          newFecha,
          newStart,
          newEnd,
          collidingModulos: collidingModulos.map((m) => ({ id: m.id, fecha: m.fecha, horaInicio: m.horaInicio, horaFin: m.horaFin })),
          collidingCitas: collidingCitas.map((c) => ({ id: c.id, fecha: c.fecha, hora: (c as any).hora || (c as any).hora_inicio || (c as any).horaInicio, horaFin: (c as any).horaFin || (c as any).hora_fin || null, moduloId: c.moduloId }))
        }
        // Log en consola
        console.warn('[CalendarView] handleEventDrop -> Movimiento cancelado por colisión', rejectPayload)
        // Guardar payload accesible desde consola para QA
        try { (window as any).__lastDropReject = rejectPayload } catch (e) { /* ignore */ }
        // Mostrar mensaje visual breve para ayudar al debugging en entorno de QA
        try {
          setDropRejectInfo({ title: 'Movimiento cancelado', details: rejectPayload })
          // Limpiar después de 10s para dar tiempo a copiar en entornos lentos
          setTimeout(() => setDropRejectInfo(null), 10000)
        } catch (e) {
          // ignore
        }
        // Devolver el evento a su posición anterior
        try { info.revert() } catch (e) { console.error('[handleEventDrop] Error al revertir:', e) }
        return
      }

  // Si no hay colisiones, aplicar cambios usando horas normalizadas/clamp
  try {
    // Actualizar el evento en la UI inmediatamente usando la API de FullCalendar
    const api = calendarRef.current?.getApi?.()
    if (api) {
      try {
        const ev = api.getEventById(event.id)
        if (ev) {
          ev.setStart(checkedStart)
          ev.setEnd(checkedEnd)
        }
      } catch (e) {
        // ignore
      }
      // No forzar refetch inmediato: puede revertir visualmente al estado previo
      // si los props aún no se han actualizado. Dejamos el setStart/setEnd y
      // confiamos en la actualización optimista + refetch de datos del Provider.
    }
  } catch (e) {
    // ignore
  }
  try { console.log('[CalendarView] handleEventDrop -> onModuloUpdate()', { id: data.id, fecha: newFecha, horaInicio: newStart, horaFin: newEnd }) } catch {}
  onModuloUpdate(data.id, { horaInicio: newStart, horaFin: newEnd, fecha: newFecha })
    }
    if (type === "cita") {
      const newStart = event.start.toTimeString().slice(0, 5)
      const newEnd = event.end ? event.end.toTimeString().slice(0, 5) : newStart
      const moduloDestino = modulos.find((m) => {
        return (
          m.fecha === event.start.toISOString().slice(0, 10) &&
          newStart >= m.horaInicio &&
          newEnd <= m.horaFin
        )
      })
      if (moduloDestino) {
        let horaCita = newStart
        if (horaCita < moduloDestino.horaInicio) horaCita = moduloDestino.horaInicio
        if (horaCita > moduloDestino.horaFin) horaCita = moduloDestino.horaFin
        onCitaUpdate(data.id, { moduloId: moduloDestino.id, fecha: moduloDestino.fecha, hora: horaCita })
      } else {
        info.revert()
      }
    }
  }

  const handleEventResize = (info: any) => {
    const { event } = info
    const type = event.extendedProps.type
    const data = event.extendedProps.data
    if (type === "modulo") {
      const newEnd = event.end.toTimeString().slice(0, 5)
      const duration = Math.round((event.end.getTime() - event.start.getTime()) / 60000)
      onModuloUpdate(data.id, { horaFin: newEnd, duracion: duration })
    }
  }

  const handleEventMouseEnter = (info: any) => {
    const type = info.event.extendedProps.type
    if (type === "cita") {
      const cita = info.event.extendedProps.data
      tooltipTimeout.current = setTimeout(() => {
        setTooltip({ x: info.jsEvent.clientX, y: info.jsEvent.clientY, cita })
      }, 1000)
    }
    if (type === "modulo") {
      const modulo = info.event.extendedProps.data as Modulo
      // Mostrar tooltip solo si el módulo está vacío (no tiene cita asignada)
      if (!moduloIdsConCita.has(modulo.id)) {
        tooltipTimeout.current = setTimeout(() => {
          setTooltip({ x: info.jsEvent.clientX, y: info.jsEvent.clientY, modulo })
        }, 600)
      }
    }
  }
  const handleEventMouseLeave = () => { if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current); setTooltip(null) }

  // Utilidades de fechas
  // Formato ISO local (YYYY-MM-DD) sin desfase UTC
  const toISODate = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  const getMonday = (d: Date) => {
    const x = new Date(d)
    const day = x.getDay() // 0=Domingo, 1=Lunes
    const diffToMonday = (day + 6) % 7
    x.setDate(x.getDate() - diffToMonday)
    x.setHours(0, 0, 0, 0)
    return x
  }
  const daysBetween = (a: Date, b: Date) => {
    const ms = 24 * 60 * 60 * 1000
    const aa = new Date(a); aa.setHours(0, 0, 0, 0)
    const bb = new Date(b); bb.setHours(0, 0, 0, 0)
    return Math.round((bb.getTime() - aa.getTime()) / ms)
  }
  const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
  const startOfMonth = (d: Date) => { const x = new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x }
  const endOfMonth = (d: Date) => { const x = new Date(d); x.setMonth(x.getMonth()+1, 0); x.setHours(23,59,59,999); return x }
  const getWeekNumber = (d: Date) => {
    // ISO week number: semana que comienza en lunes
    const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    // Jueves determina la semana ISO
    const dayNum = (tmp.getUTCDay() + 6) % 7
    tmp.setUTCDate(tmp.getUTCDate() - dayNum + 3)
    const firstThursday = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 4))
    const diff = (tmp.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000)
    return 1 + Math.floor(diff)
  }

  // Copiar estructura de módulos de una semana a otra (por profesional)
  const copyWeekStructure = (fromMonday: Date, toMonday: Date, profesionalId: string | number) => {
    const created: Omit<Modulo, "id">[] = []
    const fromSunday = new Date(fromMonday)
    fromSunday.setDate(fromMonday.getDate() + 6)

    // Usar módulos precargados de la semana origen si existen; de lo contrario, caer al estado global
    const sourceMods = (copiarSemanaSourceModulos && copiarSemanaSourceModulos.length > 0) ? copiarSemanaSourceModulos : modulos

    // Todos los módulos del profesional dentro de la semana [fromMonday..fromSunday]
    const weekMods = sourceMods.filter((m) => {
      if (String((m as any).profesionalId) !== String(profesionalId)) return false
      const f = new Date(m.fecha + 'T00:00:00')
      return f >= fromMonday && f <= fromSunday
    })

    for (const m of weekMods) {
      const baseTipo = (m.tipo || '').split(' - ')[0].trim()
      const f = new Date(m.fecha + 'T00:00:00')
      const offset = daysBetween(fromMonday, f)
      const target = new Date(toMonday)
      target.setDate(toMonday.getDate() + offset)
      // Saltar domingo destino si existiera
      if (target.getDay() === 0) continue

      const targetISO = toISODate(target)

      // Evitar duplicados exactos en destino (mismo profesional, fecha, hora y tipo base)
      const exists = modulos.some((mm) => {
        if (String((mm as any).profesionalId) !== String(profesionalId)) return false
        if (mm.fecha !== targetISO) return false
        if (mm.horaInicio !== m.horaInicio || mm.horaFin !== m.horaFin) return false
        const baseTipoExisting = (mm.tipo || '').split(' - ')[0].trim()
        return baseTipoExisting === baseTipo
      })
      if (exists) continue

      const nuevo: Omit<Modulo, "id"> = {
        tipo: baseTipo,
        profesionalId: (m as any).profesionalId,
        profesionalNombre: m.profesionalNombre,
        fecha: targetISO,
        horaInicio: m.horaInicio,
        horaFin: m.horaFin,
        duracion: m.duracion,
        disponible: true,
        color: m.color,
        profesion: m.profesion,
        observaciones: m.observaciones || "",
      }
      created.push(nuevo)
    }

    // Crear en lote (usar batch si disponible para ser más eficiente)
    if (onModulosCreateBatch && created.length > 0) {
      onModulosCreateBatch(created)
    } else {
      created.forEach(onModuloCreate)
    }
    return created.length
  }

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    document.addEventListener("click", handleClick)
    // Forzar que la semana inicie en lunes por si el locale o configuración lo sobrescribe
    const api = calendarRef.current?.getApi?.()
    if (api?.setOption) {
      try { api.setOption('firstDay', 1) } catch {}
    }
    return () => document.removeEventListener("click", handleClick)
  }, [])

  // 🔥 NUEVO: Actualizar eventos en FullCalendar cuando cambien modulos o citas
  useEffect(() => {
    const api = calendarRef.current?.getApi?.()
    if (!api) return

  // console.log('🔄 Actualizando eventos en FullCalendar con', modulos.length, 'módulos')
  // console.log('📋 Events array contiene:', events.length, 'eventos totales')
  // console.log('📅 Vista actual:', api.view.type, 'Rango:', api.view.activeStart, 'a', api.view.activeEnd)
  
  // Mostrar detalles de los primeros eventos (comentado para reducir ruido)
  // events.slice(0, 3).forEach((e, i) => {
  //   console.log(`  Event ${i}:`, e.title, 'Fecha:', e.start)
  // })
    
    // En lugar de remover/agregar, actualizar la fuente de eventos directamente
    try {
      const schedule = (fn: () => void) => {
        if (typeof queueMicrotask === 'function') queueMicrotask(fn)
        else setTimeout(fn, 0)
      }
      schedule(() => {
        api.setOption('events', events)
  // console.log('✅ Eventos actualizados en FullCalendar')
      })
    } catch (err) {
      console.error('Error actualizando eventos:', err)
    }
  }, [modulos, citas, events])

  // Mouse handlers para selección "en vivo" sobre timeGrid
  useEffect(() => {
    const container = document.querySelector('.fc-timegrid') as HTMLElement | null
    if (!container) return

    const slotMin = 8 * 60 // coincidente con slotMinTime "08:00"
    const slotMax = 20 * 60 // "20:00"
    const totalMinutes = slotMax - slotMin

    function getColIndexAndDateFromEvent(ev: MouseEvent) {
      // columnas de day/timegrid
      const cols = container ? Array.from(container.querySelectorAll('.fc-timegrid-col')) as HTMLElement[] : []
      const headerCells = Array.from(document.querySelectorAll('.fc-col-header-cell')) as HTMLElement[]
      for (let i = 0; i < cols.length; i++) {
        const rect = cols[i].getBoundingClientRect()
        if (ev.clientX >= rect.left && ev.clientX <= rect.right) {
          // Preferir la fecha directamente del elemento de la columna para evitar desalineaciones con el header
          const dateFromCol = cols[i]?.getAttribute('data-date') || undefined
          const dateFromHeader = headerCells[i]?.getAttribute('data-date') || undefined
          const dateStr = dateFromCol || dateFromHeader
          return { index: i, dateStr, cols, headerCells }
        }
      }
      return { index: -1, dateStr: undefined, cols: [], headerCells: [] }
    }

    function yToTimeByIndex(cols: HTMLElement[], headerCells: HTMLElement[], index: number, y: number) {
      const colEl = cols[index]
      if (!colEl) return { minutes: slotMin, timeStr: `${String(Math.floor(slotMin/60)).padStart(2,'0')}:${String(slotMin%60).padStart(2,'0')}` }
      // calcular top del área de horas usando el bottom del header correspondiente
      const headerRect = headerCells[index]?.getBoundingClientRect()
      const colRect = colEl.getBoundingClientRect()
      const top = headerRect ? headerRect.bottom : colRect.top
      const bottom = colRect.bottom
      const height = Math.max(1, bottom - top)
      const rel = Math.max(0, Math.min(1, (y - top) / height))
      const minutes = Math.round((slotMin + rel * totalMinutes) / 5) * 5 // redondeo a 5 minutos
      const hh = Math.floor(minutes / 60).toString().padStart(2, '0')
      const mm = (minutes % 60).toString().padStart(2, '0')
      return { minutes, timeStr: `${hh}:${mm}` }
    }

    function onMouseDown(e: MouseEvent) {
      if (e.button !== 0) return
      // solo en vistas timeGrid
      const api = calendarRef.current?.getApi?.()
      const viewType = api?.view?.type
      if (viewType !== 'timeGridWeek' && viewType !== 'timeGridDay') return
      // no iniciar selección si no hay profesional seleccionado
      if (selectedProfesionalId === null) return
      // no iniciar selección si el clic proviene de un evento ya existente o del header
      const targetEl = e.target as HTMLElement
      if (targetEl.closest('.fc-event') || targetEl.closest('.fc-col-header-cell') || targetEl.closest('.fc-daygrid-day')) return
      // no iniciar selección si está abierto el modal de cita
      if (showCitaModal) return
  const colInfo = getColIndexAndDateFromEvent(e)
  if (colInfo.index < 0) return
  const cols = colInfo.cols
  const headerCells = colInfo.headerCells
  const { minutes, timeStr } = yToTimeByIndex(cols, headerCells, colInfo.index, e.clientY)
      selectingRef.current = { startDate: new Date(), startY: e.clientY, colIndex: colInfo.index, dateStr: colInfo.dateStr }
      const relPos = getRelativePosition(e.clientX, e.clientY);
      setLiveSelection({ open: true, x: relPos.x + 8, y: relPos.y - 24, fecha: colInfo.dateStr, horaInicio: timeStr, horaFin: timeStr, minutes: 0 })
    }
    function onMouseMove(e: MouseEvent) {
      // Si hay modales abiertos, no mostrar tooltip
      if (
        showModuloModal || showCitaModal || showGestionModulosModal || showPlantillaListModal ||
        showPlantillaEditModal || copiarSemanaModal || eliminarSemanaModal || excludedPreview?.open || plantillaConfirmPropagation?.open
      ) {
        setSlotTooltip(null)
        return
      }
      if (!selectingRef.current) {
        // No hay selección en curso, mostrar tooltip simple al pasar sobre slots (solo dentro del área de timeGrid)
  const gridRect = container ? container.getBoundingClientRect() : null
        const targetEl = e.target as HTMLElement
        // Evitar header/toolbar/botones
        if (
          !gridRect ||
          targetEl.closest('.fc-toolbar') ||
          targetEl.closest('.fc-col-header') ||
          e.clientX < gridRect.left || e.clientX > gridRect.right ||
          e.clientY < gridRect.top || e.clientY > gridRect.bottom
        ) {
          setSlotTooltip(null)
          if (slotTooltipTimeoutRef.current) clearTimeout(slotTooltipTimeoutRef.current)
          return
        }
        const colInfo = getColIndexAndDateFromEvent(e)
        if (colInfo.index < 0) {
          setSlotTooltip(null)
          if (slotTooltipTimeoutRef.current) clearTimeout(slotTooltipTimeoutRef.current)
          return
        }
        
        const cols = colInfo.cols
        const headerCells = colInfo.headerCells
        const { timeStr, minutes } = yToTimeByIndex(cols, headerCells, colInfo.index, e.clientY)

        // Evitar mostrar si el cursor está sobre un evento (módulo o cita)
        if (targetEl.closest('.fc-event')) {
          setSlotTooltip(null)
          if (slotTooltipTimeoutRef.current) clearTimeout(slotTooltipTimeoutRef.current)
          return
        }

        // Si no tenemos fecha de columna, no mostrar
        const dateStr = colInfo.dateStr
        if (!dateStr) {
          setSlotTooltip(null)
          if (slotTooltipTimeoutRef.current) clearTimeout(slotTooltipTimeoutRef.current)
          return
        }

        // Comprobar colisiones con módulos y citas en ese instante (ventana corta de 5 min)
        const startISO = `${dateStr}T${timeStr}:00`
        const startDate = new Date(startISO)
        const endDate = new Date(startDate.getTime() + 5 * 60 * 1000)

        const slotHasModulo = modulosFiltrados.some((m) => {
          if (m.fecha !== dateStr) return false
          const mStart = new Date(`${m.fecha}T${m.horaInicio}`)
          const mEnd = new Date(`${m.fecha}T${m.horaFin}`)
          return startDate < mEnd && endDate > mStart
        })

        const slotHasCita = citasFiltradas.some((c) => {
          const modulo = modulosFiltrados.find((m) => m.id === c.moduloId)
          if (!modulo) return false
          if (c.fecha !== dateStr) return false
          const cStart = new Date(`${c.fecha}T${modulo.horaInicio}`)
          const cEnd = new Date(`${c.fecha}T${modulo.horaFin}`)
          return startDate < cEnd && endDate > cStart
        })

        // Limpiar timeout anterior
        if (slotTooltipTimeoutRef.current) clearTimeout(slotTooltipTimeoutRef.current)

        // Mostrar tooltip sólo si el slot está vacío (sin módulo ni cita)
        if (slotHasModulo || slotHasCita) {
          setSlotTooltip(null)
          return
        }

        // Mostrar tooltip después de 200ms de estar parado
        slotTooltipTimeoutRef.current = setTimeout(() => {
          const p = getClampedFixedPosition(e.clientX + 10, e.clientY - 30)
          setSlotTooltip({ x: p.x, y: p.y, time: timeStr })
        }, 200)
        return
      }

      // Ya hay selección en curso, mostrar el rango de selección
  const cols = container ? Array.from(container.querySelectorAll('.fc-timegrid-col')) as HTMLElement[] : []
  const headerCells = Array.from(document.querySelectorAll('.fc-col-header-cell')) as HTMLElement[]
  const colIndex = selectingRef.current.colIndex ?? 0
  if (!cols[colIndex]) return
  const start = selectingRef.current.startY ?? e.clientY
  const startInfo = yToTimeByIndex(cols, headerCells, colIndex, start)
  const endInfo = yToTimeByIndex(cols, headerCells, colIndex, e.clientY)
      const startMinutes = startInfo.minutes
      const endMinutes = endInfo.minutes
      const s = Math.min(startMinutes, endMinutes)
      const eM = Math.max(startMinutes, endMinutes)
      const minutes = Math.max(5, eM - s)
      const hhS = Math.floor(s / 60).toString().padStart(2, '0')
      const mmS = (s % 60).toString().padStart(2, '0')
      const hhE = Math.floor(eM / 60).toString().padStart(2, '0')
      const mmE = (eM % 60).toString().padStart(2, '0')
      const relPos = getRelativePosition(e.clientX, e.clientY);
      setLiveSelection({ open: true, x: relPos.x + 8, y: relPos.y - 24, fecha: selectingRef.current.dateStr, horaInicio: `${hhS}:${mmS}`, horaFin: `${hhE}:${mmE}`, minutes })
    }

    function onMouseUp(e: MouseEvent) {
      if (!selectingRef.current) return
  const cols = container ? Array.from(container.querySelectorAll('.fc-timegrid-col')) as HTMLElement[] : []
  const headerCells = Array.from(document.querySelectorAll('.fc-col-header-cell')) as HTMLElement[]
  const colIndex = selectingRef.current.colIndex ?? 0
  if (!cols[colIndex]) { selectingRef.current = null; setLiveSelection(null); return }
  const startY = selectingRef.current.startY ?? e.clientY
  const startInfo = yToTimeByIndex(cols, headerCells, colIndex, startY)
  const endInfo = yToTimeByIndex(cols, headerCells, colIndex, e.clientY)
      const s = Math.min(startInfo.minutes, endInfo.minutes)
      const eM = Math.max(startInfo.minutes, endInfo.minutes)
      // construir slotInfo (evitar toISOString que usa UTC y puede cambiar el día)
      const dateStr = selectingRef.current.dateStr || (() => {
        const d = new Date()
        const y = d.getFullYear()
        const m = String(d.getMonth()+1).padStart(2,'0')
        const dd = String(d.getDate()).padStart(2,'0')
        return `${y}-${m}-${dd}`
      })()
      const hhS = Math.floor(s / 60).toString().padStart(2, '0')
      const mmS = (s % 60).toString().padStart(2, '0')
      const hhE = Math.floor(eM / 60).toString().padStart(2, '0')
      const mmE = (eM % 60).toString().padStart(2, '0')
      // limpiar
      selectingRef.current = null
      setLiveSelection(null)
      // validar dia domingo
      const fechaDate = new Date(dateStr + 'T00:00:00')
      if (fechaDate.getDay() === 0) return
      if (selectedProfesionalId === null) return
      // Comprobar colisiones con modulos/citas
      const startISO = `${dateStr}T${hhS}:${mmS}`
      const endISO = `${dateStr}T${hhE}:${mmE}`
      const startDate = new Date(startISO)
      const endDate = new Date(endISO)
      const slotHasModulo = modulosFiltrados.some((m) => {
        const mStart = new Date(`${m.fecha}T${m.horaInicio}`)
        const mEnd = new Date(`${m.fecha}T${m.horaFin}`)
        return startDate < mEnd && endDate > mStart
      })
      const slotHasCita = citasFiltradas.some((c) => {
        const modulo = modulosFiltrados.find((m) => m.id === c.moduloId)
        if (!modulo) return false
        const cStart = new Date(`${c.fecha}T${modulo.horaInicio}`)
        const cEnd = new Date(`${c.fecha}T${modulo.horaFin}`)
        return startDate < cEnd && endDate > cStart
      })
      if (!slotHasModulo && !slotHasCita) {
        setSlotInfo({ start: startDate, end: endDate, fecha: dateStr, horaInicio: `${hhS}:${mmS}`, horaFin: `${hhE}:${mmE}` })
        setShowModuloModal(true)
      }
    }

    window.addEventListener('mouseup', onMouseUp)
    container.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)

    return () => {
      window.removeEventListener('mouseup', onMouseUp)
      container.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      container.removeEventListener('mouseleave', () => {
        setSlotTooltip(null)
        if (slotTooltipTimeoutRef.current) clearTimeout(slotTooltipTimeoutRef.current)
      })
    }
  }, [selectedProfesionalId, modulosFiltrados, citasFiltradas])

  // Limpiar tooltip cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (slotTooltipTimeoutRef.current) clearTimeout(slotTooltipTimeoutRef.current)
      setSlotTooltip(null)
    }
  }, [])

  // Ocultar inmediatamente el tooltip de hora cuando haya cualquier modal abierto
  useEffect(() => {
    const anyModalOpen =
      !!(showModuloModal || showCitaModal || showGestionModulosModal || showPlantillaListModal ||
      showPlantillaEditModal || copiarSemanaModal || eliminarSemanaModal || excludedPreview?.open || plantillaConfirmPropagation?.open)

    if (anyModalOpen) {
      if (slotTooltipTimeoutRef.current) clearTimeout(slotTooltipTimeoutRef.current)
      setSlotTooltip(null)
    }
  }, [showModuloModal, showCitaModal, showGestionModulosModal, showPlantillaListModal, showPlantillaEditModal, copiarSemanaModal, eliminarSemanaModal, excludedPreview, plantillaConfirmPropagation])

  const handleSelectModulo = () => {
    if (contextMenu?.type === "modulo") {
      const raw = String(contextMenu.event.id).replace("modulo-", "")
      const moduloId = Number.parseInt(raw)
      // Convertir a string para trabajar con ambos tipos (number y string IDs)
      const idAsString = Number.isNaN(moduloId) ? raw : String(moduloId)
      setSelectedModulos((prev) => prev.includes(idAsString) ? prev.filter((id) => id !== idAsString) : [...prev, idAsString])
    }
    setContextMenu(null)
  }
  const handleEditModulo = () => { if (contextMenu?.type === "modulo") { const modulo = contextMenu.event.extendedProps.data as Modulo; setOpenModuloForEdit(true); setSelectedModulo(modulo); } setContextMenu(null) }
  const handleDeleteModulo = () => {
    if (contextMenu?.type === "modulo") {
      const raw = String(contextMenu.event.id).replace("modulo-", "")
      // Intentar parsear por compatibilidad, pero almacenamos siempre el raw string
      setModuloAEliminar(raw)
    }
    setContextMenu(null)
  }
  const handleAgendarPaciente = () => { if (contextMenu?.type === "modulo") { const moduloDelEvento = contextMenu.event.extendedProps.data as Modulo; const moduloActual = modulos.find(m => m.id === moduloDelEvento.id) || moduloDelEvento; setOpenModuloForEdit(false); setSelectedModulo(moduloActual); setShowCitaModal(true) } setContextMenu(null) }
  const handleDeleteSelectedModulos = () => { if (selectedModulos.length > 0) { setConfirmEliminarSeleccionados(true) } }

  useEffect(() => {
    function handleEditModuloFromListEvt(e: any) { setOpenModuloForEdit(true); setSelectedModulo(e.detail); }
    window.addEventListener("editModuloFromList", handleEditModuloFromListEvt)
    return () => window.removeEventListener("editModuloFromList", handleEditModuloFromListEvt)
  }, [])

  // Abrir el modal de edición solo cuando selectedModulo esté disponible y se haya solicitado editar
  useEffect(() => {
    if (selectedModulo && openModuloForEdit) {
      setShowModuloModal(true)
      // reset flag
      setOpenModuloForEdit(false)
    }
  }, [selectedModulo, openModuloForEdit])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
  onClick={() => {
    setSelectedModulo(null);
    setShowModuloModal(true);
  }}
  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
  disabled={selectedProfesionalId === null}
>
  <Plus className="w-4 h-4" />
  Crear Módulo
</button>
          <button onClick={() => setShowPlantillaListModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg border border-gray-300 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={selectedProfesionalId === null}>
            <span className="w-4 h-4">📋</span>
            Gestionar Módulos
          </button>
          <button onClick={() => {
            if (!selectedProfesionalId) return
            const today = new Date()
            const monday = getMonday(today)
            setWeekPickerMonth(new Date(monday))
            setCopiarSemanaTargets([])
            setCopiarSemanaModal({ open: true, originMonday: monday, profesionalId: selectedProfesionalId })
          }} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg border border-gray-300 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={selectedProfesionalId === null}>
            <span className="w-4 h-4">🗓️</span>
            Copiar semana
          </button>
          <button onClick={() => {
            if (!selectedProfesionalId) return
            const today = new Date()
            const monday = getMonday(today)
            setWeekPickerMonth(new Date(monday))
            setEliminarSemanaTargets([])
            setEliminarSemanaModal({ open: true, profesionalId: selectedProfesionalId })
          }} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg border border-red-300 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={selectedProfesionalId === null}>
            <Trash2 className="w-4 h-4" />
            Eliminar semana
          </button>
          {selectedModulos.length > 0 && (
            <button onClick={handleDeleteSelectedModulos} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Eliminar seleccionados</button>
          )}
        </div>
      </div>

      <div className="mt-4 w-full flex flex-col items-start">
        <label htmlFor="profesional-select" className="mb-1 text-sm font-semibold text-gray-700">Profesionales registrados</label>
  <select id="profesional-select" className="w-full px-4 py-3 rounded-xl border-2 border-blue-400 bg-gradient-to-r from-blue-100 via-white to-blue-100 text-blue-900 font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:border-blue-600 hover:shadow-xl" value={selectedProfesionalId ?? ""} onChange={(e) => { const val = e.target.value; setSelectedProfesionalId(val || null); setSelectedModulos([]); setSelectedModulo(null); setContextMenu(null); if (dataContext?.setActiveProfesional) dataContext.setActiveProfesional(val || null); }}>
    <option value="">Seleccione un profesional...</option>
          {profesionalesActuales.map((u: any) => {
            const apellidoPaterno = u.apellido_paterno || u.apellidoPaterno || ''
            const apellidoMaterno = u.apellido_materno || u.apellidoMaterno || ''
            const nombreCompleto = `${u.nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim()
            return (
              <option key={u.id} value={String(u.id)} className="py-2">
                {nombreCompleto} - {u.profesion}{u.cargo ? ` / ${u.cargo}` : ""}
              </option>
            )
          })}
        </select>
        <div className="mt-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => {
              setSelectedProfesionalId(null)
              setSelectedModulos([])
              setSelectedModulo(null)
              setContextMenu(null)
              if (dataContext?.setActiveProfesional) dataContext.setActiveProfesional(null)
            }}
            disabled={selectedProfesionalId === null}
            aria-label="Limpiar profesional seleccionado"
          >
            <X className="w-4 h-4" /> Limpiar selección
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ overflow: 'visible', position: 'relative' }}>
        <style>{style}</style>
        {selectedProfesionalId === null ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-600">
            <div className="text-5xl mb-4">🗓️</div>
            <h3 className="text-xl font-semibold mb-2">Seleccione un profesional para visualizar su agenda</h3>
            <p className="max-w-md">Usa la lista desplegable de arriba para elegir un profesional. Una vez seleccionado, cargaremos sus módulos y citas en el calendario.</p>
          </div>
        ) : (
          <div style={{ overflow: 'visible', position: 'relative' }} ref={calendarContainerRef}>
          {dropRejectInfo && (
            <div className="fixed z-50 right-6 top-6 max-w-md w-[360px] p-3 rounded-lg bg-red-600 text-white shadow-lg" style={{pointerEvents: 'none'}}>
              <div className="font-semibold">{dropRejectInfo.title || 'Movimiento cancelado'}</div>
              <div className="text-xs mt-1" style={{fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: 160, overflow: 'auto'}}>
                {JSON.stringify(dropRejectInfo.details, null, 2)}
              </div>
            </div>
          )}
          {/* Banner cuando la agenda del profesional está deshabilitada */}
          {selectedProfesional && (selectedProfesional as any).agendaDisabled && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <strong>Agenda deshabilitada por profesional.</strong>
              {(selectedProfesional as any).agendaDisabledReason ? (
                <span> MOTIVO: {(selectedProfesional as any).agendaDisabledReason}</span>
              ) : null}
            </div>
          )}
          <FullCalendar
            eventContent={eventContent}
            ref={calendarRef}
            plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            firstDay={1}
            headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
            views={{
              dayGridMonth: { buttonText: 'Mes' },
              timeGridWeek: {
                buttonText: 'Semana',
                firstDay: 1, // Lunes
                slotMinTime: "08:00:00",
                slotMaxTime: "20:00:00",
                allDaySlot: false,
                // Forzar rango visible: Lunes (inicio) a Domingo (fin)
                visibleRange: (currentDate: Date) => {
                  const start = new Date(currentDate);
                  const day = start.getDay(); // 0=Domingo, 1=Lunes, ...
                  const diffToMonday = (day + 6) % 7; // días desde lunes
                  start.setDate(start.getDate() - diffToMonday);
                  // Fin: siguiente lunes
                  const end = new Date(start);
                  end.setDate(start.getDate() + 7);
                  return { start, end };
                },
                dayHeaderContent: (info: any) => {
                  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
                  const nombre = dias[info.date.getDay()];
                  const numero = info.date.getDate();
                  return `${nombre} ${numero}`;
                },
                dayCellClassNames: (arg: any) => {
                  if (arg.date.getDay() === 0) return ["fc-domingo-disabled"];
                  return [];
                },
              },
              timeGridDay: {
                buttonText: 'Día',
                dayHeaderContent: (info: any) => {
                  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
                  const nombre = dias[info.date.getDay()];
                  const numero = info.date.getDate();
                  return `${nombre} ${numero}`;
                }
              }
            }}
            slotDuration="00:15:00"
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
            allDaySlot={false}
            editable={true}
            droppable={true}
            eventResizableFromStart={true}
            selectable={true}
            selectOverlap={false}
            events={events}
            eventAllow={(dropInfo: any, draggedEvent: any) => {
              // Dejamos que handleEventDrop haga el bloqueo por colisión.
              return true
            }}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            eventDragStart={handleEventDragStart}
            eventDragStop={handleEventDragStop}
            select={(info: any) => {
              // Deshabilitar selección en domingo
              if (info.start.getDay() === 0 || info.end.getDay() === 0) return;
              const calendarApi = calendarRef.current?.getApi?.()
              if (!calendarApi) return
              if (calendarApi.view.type !== 'timeGridWeek' && calendarApi.view.type !== 'timeGridDay') return
              if (selectedProfesionalId === null) return
              const slotHasModulo = modulosFiltrados.some((m) => {
                const mStart = new Date(`${m.fecha}T${m.horaInicio}`)
                const mEnd = new Date(`${m.fecha}T${m.horaFin}`)
                return info.start < mEnd && info.end > mStart
              })
              const slotHasCita = citasFiltradas.some((c) => {
                const modulo = modulosFiltrados.find((m) => m.id === c.moduloId)
                if (!modulo) return false
                const cStart = new Date(`${c.fecha}T${modulo.horaInicio}`)
                const cEnd = new Date(`${c.fecha}T${modulo.horaFin}`)
                return info.start < cEnd && info.end > cStart
              })
              if (!slotHasModulo && !slotHasCita) {
                setSlotInfo({ start: info.start, end: info.end, fecha: info.startStr.split("T")[0], horaInicio: info.startStr.split("T")[1]?.slice(0, 5) ?? '', horaFin: info.endStr.split("T")[1]?.slice(0, 5) ?? '' })
                setShowModuloModal(true)
              }
            }}
            eventClick={(info: any) => {
              // Deshabilitar clic en domingo
              if (info.event.start.getDay() === 0) return;
              if (selectedProfesionalId === null) return
              if (info.jsEvent.button !== 2) {
                if (info.event.extendedProps.type === "modulo") {
                  const modulo = info.event.extendedProps.data as Modulo
                  const citasEnModulo = citas.filter((c) => c.moduloId === modulo.id)
                  if (citasEnModulo.length === 0) { setOpenModuloForEdit(false); setSelectedModulo(modulo); setShowCitaModal(true) } else { setSelectedModulo(modulo); setShowModuloModal(true) }
                } else if (info.event.extendedProps.type === "cita") {
                  console.log('📋 Click en cita desde FullCalendar:', info.event.extendedProps.data)
                  const cita = info.event.extendedProps.data as Cita
                  setSelectedCita(cita)
                  setShowCitaModal(true)
                }
              }
            }}
            dateClick={(info: any) => { const calendarApi = calendarRef.current?.getApi?.(); if (calendarApi && calendarApi.view.type === 'dayGridMonth') { calendarApi.changeView('timeGridDay', info.dateStr) } }}
            eventDidMount={(arg: any) => { arg.el.addEventListener("contextmenu", (e: MouseEvent) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, event: arg.event, type: arg.event.extendedProps.type }) }) }}
            eventMouseEnter={handleEventMouseEnter}
            eventMouseLeave={handleEventMouseLeave}
            height="auto"
            locale="es"
            buttonText={{ today: "Hoy", month: "Mes", week: "Semana", day: "Día" }}
            slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
            eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
            datesSet={(arg: any) => {
              // arg.start inclusive, arg.end es límite exclusivo; usar end-1 día
              const start = new Date(arg.start)
              const endExclusive = new Date(arg.end)
              const endInclusive = new Date(endExclusive)
              endInclusive.setDate(endInclusive.getDate() - 1)
              const toISO = (d: Date) => {
                const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const dd = String(d.getDate()).padStart(2,'0')
                return `${y}-${m}-${dd}`
              }
              onVisibleRangeChange?.(toISO(start), toISO(endInclusive))
            }}
          />
          {/* Tooltip dinámico al arrastrar módulo */}
          {dragModuloPreview && (
            <div
              className="fixed z-[9999] pointer-events-none"
              style={{
                top: dragModuloPreview.y + 12,
                left: dragModuloPreview.x + 12,
                transform: 'translate(-50%, -50%)',
                minWidth: 180,
              }}
            >
              <div className={`rounded-lg shadow-lg px-3 py-2 text-xs font-medium border ${dragModuloPreview.collisionModulo || dragModuloPreview.collisionCita ? 'bg-red-600 text-white border-red-700' : 'bg-blue-600 text-white border-blue-700'}`}>
                <div className="font-semibold">Rango tentativo</div>
                <div>{dragModuloPreview.fecha}</div>
                <div>{dragModuloPreview.horaInicio} - {dragModuloPreview.horaFin}</div>
                {dragModuloPreview.collisionModulo || dragModuloPreview.collisionCita ? (
                  <div className="mt-1 text-[11px] font-semibold">
                    {dragModuloPreview.collisionModulo && 'Colisión módulo'}
                    {dragModuloPreview.collisionModulo && dragModuloPreview.collisionCita && ' + '}
                    {dragModuloPreview.collisionCita && 'Colisión cita'}
                  </div>
                ) : (
                  <div className="mt-1 text-[11px] opacity-80">Libre</div>
                )}
              </div>
            </div>
          )}
          </div>
        )}
      </div>

      {showModuloModal && !slotInfo && !selectedModulo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Crear Módulo</h3>
              <button onClick={() => { setShowModuloModal(false); setSelectedPlantillaTemplate(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const tipo = String(formData.get("tipo") || "");
                const duracion = Number(formData.get("duracion") || 0);
                const profesion = String(formData.get("profesion") || "");
                const color = String(formData.get("color") || "#3498db");
                const observaciones = String(formData.get("observaciones") || "");
                
                if (!tipo || duracion <= 0 || !profesion) {
                  alert("Por favor completa todos los campos. Selecciona una plantilla o ingresa la duración.");
                  return;
                }
                
                const nuevoModulo = {
                  tipo,
                  profesionalId: selectedProfesionalId ?? currentUser.id,
                  duracion,
                  color,
                  profesion,
                  observaciones,
                };
                onPlantillaCreate(nuevoModulo);
                setShowModuloModal(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de módulo</label>
                <input name="tipo" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duración (minutos)</label>
                <input 
                  id="duracion-visible"
                  name="duracion"
                  type="number" 
                  min="5" 
                  step="5" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Ej: 30, 45, 60"
                  required 
                />
              </div>

              {/* Sección de sugerencias de plantillas predefinidas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sugerencias rápidas</label>
                <div className="grid grid-cols-2 gap-3">
                  {PLANTILLAS_PREDEFINIDAS.map((plantilla) => (
                    <button
                      key={plantilla.id}
                      type="button"
                      onClick={() => {
                        setSelectedPlantillaTemplate(plantilla);
                        // Actualizar el input visible de duración
                        const duracionVisible = document.getElementById("duracion-visible") as HTMLInputElement;
                        if (duracionVisible) duracionVisible.value = String(plantilla.duracion);
                        // Actualizar campo tipo
                        const tipoInput = document.querySelector('input[name="tipo"]') as HTMLInputElement;
                        if (tipoInput) tipoInput.value = plantilla.tipo;
                        // Actualizar campo observaciones
                        const obsInput = document.querySelector('textarea[name="observaciones"]') as HTMLTextAreaElement;
                        if (obsInput) obsInput.value = plantilla.observaciones;
                        // Actualizar campo color
                        const colorInput = document.querySelector('input[name="color"]') as HTMLInputElement;
                        if (colorInput) colorInput.value = plantilla.color;
                      }}
                      className={`p-4 rounded-lg border-2 transition-all text-left cursor-pointer ${
                        selectedPlantillaTemplate?.id === plantilla.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 bg-white hover:border-gray-400"
                      }`}
                    >
                      <div className="font-semibold text-gray-900">{plantilla.nombre}</div>
                      <div className="text-sm text-gray-600 mt-1">{plantilla.duracion} minutos</div>
                      <div
                        className="inline-block w-4 h-4 rounded mt-2 border border-gray-300"
                        style={{ backgroundColor: plantilla.color }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profesión/Especialidad</label>
                {currentUser?.rol === "profesional" ? (
                  // Si es PROFESIONAL: mostrar su profesión auto-rellenada (read-only)
                  <input
                    type="text"
                    name="profesion"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    value={currentUser?.profesion || ""}
                    readOnly
                    tabIndex={-1}
                  />
                ) : (
                  // Si es ADMINISTRATIVO: mostrar la profesión del profesional seleccionado (read-only)
                  <input
                    type="text"
                    name="profesion"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    value={selectedProfesional?.profesion || ""}
                    readOnly
                    tabIndex={-1}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input name="color" type="color" className="w-16 h-8 border border-gray-300 rounded-lg" defaultValue="#3498db" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Detalle de la prestación</label>
                <textarea name="observaciones" className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={2} />
              </div>

              <div className="flex gap-2 mt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar</button>
                <button type="button" onClick={() => { setShowModuloModal(false); setSelectedPlantillaTemplate(null); }} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {excludedPreview && excludedPreview.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Resumen de eliminación</h3>
              <button onClick={() => setExcludedPreview(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="mb-4">
              {excludedPreview.toDelete.length > 0 ? (
                excludedPreview.excluded.length > 0 ? (
                  <div className="mb-3 text-sm text-gray-700">Se eliminarán <strong>{excludedPreview.toDelete.length}</strong> módulo(s), excepto los siguientes debido a que tienen cita agendada:</div>
                ) : (
                  <div className="mb-3 text-sm text-gray-700">Se eliminarán <strong>{excludedPreview.toDelete.length}</strong> módulo(s).</div>
                )
              ) : (
                <div className="mb-3 text-sm text-gray-700">No hay módulos borrables. Los siguientes módulos fueron excluidos por tener citas asociadas:</div>
              )}
              {excludedPreview.excluded.length > 0 && (
                <div className="max-h-48 overflow-auto border rounded p-2">
                  {excludedPreview.excluded.map((e) => (
                    <div key={e.id} className="text-sm border-b last:border-b-0 py-1">
                      <div className="font-semibold">{e.tipo ?? 'Módulo'}</div>
                      <div className="text-xs text-gray-500">{e.fecha} • {e.horaInicio}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setExcludedPreview(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cerrar</button>
              {excludedPreview.toDelete.length > 0 && (
                <button onClick={() => { setConfirmEliminarSemana({ open: true, ids: excludedPreview.toDelete }); setExcludedPreview(null); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Confirmar eliminación</button>
              )}
            </div>
          </div>
        </div>
      )}

      {showModuloModal && (slotInfo || selectedModulo) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{slotInfo ? "Asignar módulo de prestación" : selectedModulo ? "Editar Módulo" : "Crear Módulo"}</h3>
              <button onClick={() => { setShowModuloModal(false); setSelectedModulo(null); setSlotInfo(null); setModuloExistenteId(null) }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            {slotInfo ? (
              <form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); const selectedId = String(formData.get("moduloExistente")); const base = plantillas.find((p: PlantillaModulo) => String((p as any).id) === selectedId); if (!slotInfo || !base) return; const duracion = base.duracion; const profesion = selectedProfesional ? (selectedProfesional as any).profesion : (base.profesion || ""); const color = base.color; const observaciones = base.observaciones || ""; const horaInicio = String(formData.get("rangoInicio") || slotInfo.horaInicio); const horaFin = String(formData.get("rangoFin") || slotInfo.horaFin); const startTime = new Date(`${slotInfo.fecha}T${horaInicio}:00`); const endTime = new Date(`${slotInfo.fecha}T${horaFin}:00`); const profesionalNombreCompleto = selectedProfesional ? `${(selectedProfesional as any).nombre} ${(selectedProfesional as any).apellidoPaterno || (selectedProfesional as any).apellidos || ''}`.trim() : `${currentUser.nombre} ${currentUser.apellidos}`; const moduloBase: Omit<Modulo, "id"> = { plantillaId: (base.id as any) as string, tipo: base.tipo, profesionalId: (selectedProfesional?.id as any) ?? currentUser.id, profesionalNombre: profesionalNombreCompleto, fecha: slotInfo.fecha, horaInicio: horaInicio, horaFin: horaFin, duracion, disponible: true, color, profesion, observaciones }; const modulosACrear: Omit<Modulo, "id">[] = []; let current = new Date(startTime); while (true) { const next = new Date(current.getTime() + duracion * 60000); if (next.getTime() > endTime.getTime()) break; const modHoraInicio = current.toTimeString().slice(0, 5); const modHoraFin = next.toTimeString().slice(0, 5); modulosACrear.push({ ...moduloBase, horaInicio: modHoraInicio, horaFin: modHoraFin }); current = next } if (onModulosCreateBatch) { onModulosCreateBatch(modulosACrear); } else { modulosACrear.forEach((m) => onModuloCreate(m)); } setShowModuloModal(false); setSlotInfo(null); setModuloExistenteId(null); setRangoModificado(null) }} className="space-y-4">
                {/* Sección 1: Rango de horas (PRIMERO) */}
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    <strong>Rango de horas - {slotInfo.fecha}</strong>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Desde</label>
                      <input
                        type="time"
                        name="rangoInicio"
                        defaultValue={slotInfo.horaInicio}
                        onChange={(e) => setRangoModificado(prev => ({ ...prev, horaInicio: e.target.value } as any))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Hasta</label>
                      <input
                        type="time"
                        name="rangoFin"
                        defaultValue={slotInfo.horaFin}
                        onChange={(e) => setRangoModificado(prev => ({ ...prev, horaFin: e.target.value } as any))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Sección 2: Seleccionar plantilla (SEGUNDO) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Selecciona una plantilla de módulo</label>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {plantillas
                      .filter((p: PlantillaModulo) => selectedProfesionalId === null || String(p.profesionalId) === selectedProfesionalId)
                      .map((p) => (
                        <label
                          key={p.id}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            moduloExistenteId === String((p as any).id)
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300 bg-white hover:border-gray-400"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="moduloExistente"
                            value={String((p as any).id)}
                            checked={moduloExistenteId === String((p as any).id)}
                              onChange={(e) => {
                                setModuloExistenteId(e.target.value);
                              }}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{p.tipo}</div>
                              <div className="text-xs text-gray-600 mt-1">⏱ {p.duracion} min</div>
                              {p.observaciones && (
                                <div className="text-xs text-gray-500 mt-1 italic">{p.observaciones}</div>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <div
                                  className="w-6 h-6 rounded border border-gray-300"
                                  style={{ backgroundColor: p.color }}
                                  title={`Color: ${p.color}`}
                                />
                                <span className="text-xs text-gray-500">{p.profesion}</span>
                              </div>
                            </div>
                          </div>
                        </label>
                      ))}
                  </div>
                  {plantillas.filter((p: PlantillaModulo) => selectedProfesionalId === null || String(p.profesionalId) === selectedProfesionalId).length === 0 && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                      <p>No hay plantillas disponibles para este profesional.</p>
                    </div>
                  )}
                </div>



                <div className="flex gap-2 mt-4">
                  <button
                    type="submit"
                    disabled={!moduloExistenteId}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Asignar módulos
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModuloModal(false)
                      setSlotInfo(null)
                      setModuloExistenteId(null)
                      setRangoModificado(null)
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : selectedModulo ? (
              <form onSubmit={(e) => { e.preventDefault(); if (!selectedModulo) return; const formData = new FormData(e.currentTarget); const tipo = String(formData.get("tipo") || selectedModulo.tipo); const duracion = Number(formData.get("duracion") || selectedModulo.duracion); const profesion = String(formData.get("profesion") || selectedModulo.profesion || ""); const color = String(formData.get("color") || selectedModulo.color); const observaciones = String(formData.get("observaciones") || selectedModulo.observaciones || ""); onModuloUpdate(selectedModulo.id, { tipo, duracion, profesion, color, observaciones }); setShowModuloModal(false); setSelectedModulo(null) }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de módulo</label>
                  <input name="tipo" className="w-full px-3 py-2 border border-gray-300 rounded-lg" defaultValue={selectedModulo.tipo} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duración (minutos)</label>
                  <input name="duracion" type="number" min={5} step={5} className="w-full px-3 py-2 border border-gray-300 rounded-lg" defaultValue={selectedModulo.duracion} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profesión/Especialidad</label>
                  <input 
                    name="profesion" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" 
                    value={selectedModulo?.profesion || selectedProfesional?.profesion || currentUser?.profesion || ""} 
                    readOnly 
                    tabIndex={-1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <input name="color" type="color" className="w-12 h-10 px-1 py-1 border border-gray-300 rounded-lg" defaultValue={selectedModulo.color || "#3b82f6"} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Detalle de la prestación</label>
                  <textarea name="observaciones" className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={2} defaultValue={selectedModulo.observaciones || ""} placeholder="Detalle opcional de la prestación..." />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar</button>
                  <button type="button" onClick={() => { setShowModuloModal(false); setSelectedModulo(null) }} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancelar</button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Selecciona un módulo en el calendario para editarlo, o selecciona un rango de tiempo en la agenda para asignar un módulo existente.</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowModuloModal(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cerrar</button>
                  <button type="button" onClick={() => { setShowModuloModal(false); setShowGestionModulosModal(true) }} className="flex-1 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg border border-gray-300 hover:bg-gray-200">Gestionar módulos</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showCitaModal && selectedModulo ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Agendar Paciente</h3>
              <button onClick={() => { setShowCitaModal(false); setSelectedModulo(null); setSobrecupoMode(false) }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
      <form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); const pacienteId = String(formData.get("pacienteId")); const paciente = pacientes.find((p) => String(p.id) === pacienteId); if (!paciente || !selectedModulo) return; const pacienteRun = paciente.run; const nombreCompleto = [paciente.nombre, paciente.apellidos].filter(Boolean).join(' '); const observacion = String(formData.get("observacion") || ""); 
        
        // Calcular hora de fin basada en duración del módulo
        const [horas, minutos] = selectedModulo.horaInicio.split(':').map(Number);
        const duracion = selectedModulo.duracion || 30; // default 30 minutos
        const startTime = new Date(`2000-01-01T${selectedModulo.horaInicio}`);
        const endTime = new Date(startTime.getTime() + duracion * 60000);
        const horaFin = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}:00`;
        
        // Obtener el tipo ORIGINAL del módulo (sin modificarlo)
        const tipoModuloOriginal = selectedModulo.tipo || 'Control';
        console.log('[CalendarView] selectedModulo.tipo:', selectedModulo.tipo);
        console.log('[CalendarView] tipoModuloOriginal:', tipoModuloOriginal);
        
        if (editingCita) { onCitaUpdate(editingCita.id, { pacienteId: paciente.id, pacienteNombre: nombreCompleto, pacienteRun: paciente.run, pacienteTelefono: paciente.telefono, hora: selectedModulo.horaInicio }); } else { // crear cita como PENDIENTE y recolorear modulo a amarillo
        const originalColor = selectedModulo.color
        onModuloUpdate(selectedModulo.id, { color: '#f59e0b' })
        onCitaCreate({ moduloId: selectedModulo.id, tipo: tipoModuloOriginal, fecha: selectedModulo.fecha, hora: selectedModulo.horaInicio, horaFin, pacienteId: paciente.id, pacienteNombre: nombreCompleto, pacienteRun: paciente.run, pacienteTelefono: paciente.telefono, profesionalId: selectedModulo.profesionalId, profesionalNombre: selectedModulo.profesionalNombre, estado: "pendiente", observacion, originalModuloColor: originalColor }); } setShowCitaModal(false); setSelectedModulo(null); setSobrecupoMode(false); setEditingCita(null) }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
                <select name="pacienteId" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" defaultValue={editingCita ? String(editingCita.pacienteId) : ""}>
                  <option value="">Seleccionar paciente</option>
                  {pacientes.map((pac) => {
                    const nombreCompleto = [pac.nombre, pac.apellidos].filter(Boolean).join(' ');
                    return (<option key={pac.id} value={pac.id}>{nombreCompleto} - {pac.run}</option>);
                  })}
                </select>
              </div>
              {sobrecupoMode && (<div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">Agendando como sobrecupo</div>)}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observación</label>
                <textarea name="observacion" className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={2} placeholder="Observación opcional..." defaultValue={editingCita?.observacion ?? ''} />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar</button>
                <button type="button" onClick={() => { setShowCitaModal(false); setSelectedModulo(null); setSobrecupoMode(false) }} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showCitaModal && selectedCita && !selectedModulo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => { setShowCitaModal(false); setSelectedCita(null) }}>
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 flex items-center justify-between border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Detalles de Agendado</h2>
              <button
                onClick={() => { setShowCitaModal(false); setSelectedCita(null) }}
                className="p-1 hover:bg-blue-200 rounded-full transition-colors"
                title="Cerrar">
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Contenido */}
            <div className="px-6 py-4 space-y-4">
              {/* Paciente */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">👤 Paciente</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{selectedCita.pacienteNombre || 'N/A'}</p>
              </div>

              {/* Tipo de Cita (del módulo) */}
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">📋 Tipo</p>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  {selectedCita.tipo || 'N/A'}
                </p>
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">📅 Fecha</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">{selectedCita.fecha ? new Date(selectedCita.fecha).toLocaleDateString('es-CL') : 'N/A'}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">⏰ Hora</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">{selectedCita.hora || 'N/A'}</p>
                </div>
              </div>

              {/* Estado */}
              <div className={`rounded-lg p-3 border ${
                selectedCita.esSobrecupo 
                  ? 'bg-red-50 border-red-200' 
                  : selectedCita.estado === 'confirmada' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${
                  selectedCita.esSobrecupo 
                    ? 'text-red-700' 
                    : selectedCita.estado === 'confirmada' 
                    ? 'text-green-700' 
                    : 'text-yellow-700'
                }`}>
                  📊 Estado
                </p>
                <p className={`text-sm font-bold mt-1 ${
                  selectedCita.esSobrecupo 
                    ? 'text-red-900' 
                    : selectedCita.estado === 'confirmada' 
                    ? 'text-green-900' 
                    : 'text-yellow-900'
                }`}>
                  {selectedCita.esSobrecupo ? '⚠️ Sobrecupo' : selectedCita.estado === 'confirmada' ? '✓ Confirmada' : '⏳ Pendiente'}
                </p>
              </div>

              {/* Observaciones */}
              {selectedCita.observacion && (
                <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                  <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">📝 Observaciones</p>
                  <p className="text-sm text-gray-700 mt-2 bg-white rounded p-2">{selectedCita.observacion}</p>
                </div>
              )}
              {!selectedCita.observacion && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">📝 Observaciones</p>
                  <p className="text-sm text-gray-500 mt-2">Sin observaciones</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-3 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => { setShowCitaModal(false); setSelectedCita(null) }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {contextMenu && (
  <div className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50" style={{ left: contextMenu.x, top: contextMenu.y }}>
    {contextMenu.type === "modulo" && (
      <>
        <button onClick={handleSelectModulo} className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2">
          <input type="checkbox" checked={selectedModulos.includes(String(contextMenu.event.id).replace("modulo-", ""))} readOnly className="w-4 h-4" />
          {selectedModulos.includes(String(contextMenu.event.id).replace("modulo-", "")) ? "Deseleccionar" : "Seleccionar"} módulo
        </button>
        <button onClick={handleEditModulo} className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"><Edit className="w-4 h-4" />Editar módulo</button>
        <button onClick={handleDeleteModulo} className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-red-600"><Trash2 className="w-4 h-4" />Eliminar módulo</button>
        <button onClick={handleAgendarPaciente} className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"><UserPlus className="w-4 h-4" />Agendar paciente</button>
        <button onClick={() => {
          const modulo = contextMenu.event.extendedProps.data as Modulo;
          // ✅ Validar que el módulo tenga ID válido
          if (!modulo.id || !String(modulo.id).trim()) {
            console.error('[Eliminar semana] Módulo sin ID válido:', modulo);
            alert('Error: El módulo seleccionado no tiene un ID válido');
            setContextMenu(null);
            return;
          }
          const fecha = new Date(modulo.fecha);
          const day = fecha.getDay();
          const diffToMonday = (day === 0 ? -6 : 1) - day;
          const monday = new Date(fecha); monday.setDate(fecha.getDate() + diffToMonday);
          const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
          const modulosSemana = modulos.filter(m => {
            const f = new Date(m.fecha);
            return f >= monday && f <= sunday && m.profesionalId === modulo.profesionalId;
          });
          // ✅ Filtrar solo módulos con ID válido (no null, no undefined, no string "null")
          const idsValidos = modulosSemana
            .filter(m => m.id && String(m.id).trim() && String(m.id).toLowerCase() !== 'null' && String(m.id).toLowerCase() !== 'undefined')
            .map(m => String(m.id));
          if (idsValidos.length > 0) {
            console.log(`[Eliminar semana] Encontrados ${idsValidos.length} módulos válidos en la semana. IDs:`, idsValidos);
            setConfirmEliminarSemana({ open: true, ids: idsValidos });
          } else {
            console.warn(`[Eliminar semana] De ${modulosSemana.length} módulos en la semana, ninguno tiene ID válido`);
            alert(`No hay módulos válidos para eliminar en esta semana (encontrados: ${modulosSemana.length}, válidos: ${idsValidos.length})`);
          }
          setContextMenu(null);
        }} className="w-full px-4 py-2 text-left hover:bg-red-100 flex items-center gap-2 text-red-700"><Trash2 className="w-4 h-4" />Eliminar todos los módulos de la semana</button>
        {/* 'Copiar estructura de esta semana' movido a botón en la cabecera */}
      </>
    )}
    {contextMenu.type === "cita" && (() => {
      const citaDelEvento = contextMenu.event.extendedProps.data as Cita
      // Obtener la cita actual desde el array para que refleje cambios en tiempo real
      const cita = citas.find(c => c.id === citaDelEvento.id) || citaDelEvento
      return (
        <>
          <button onClick={() => { setEditingCita(cita); setSelectedModulo(modulos.find(m => m.id === cita.moduloId) ?? null); setShowCitaModal(true); setContextMenu(null) }} className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"><Edit className="w-4 h-4" />Editar cita</button>
          {cita.estado !== 'confirmada' && (
            <button onClick={() => { const modulo = modulos.find(m => m.id === cita.moduloId); const restoreColor = cita.originalModuloColor ?? (modulo ? modulo.color : '#3b82f6'); if (modulo) onModuloUpdate(modulo.id, { color: restoreColor }); onCitaUpdate(cita.id, { estado: 'confirmada' }); setContextMenu(null); }} className="w-full px-4 py-2 text-left hover:bg-green-50 flex items-center gap-2 text-green-600"><Check className="w-4 h-4" />Confirmar cita</button>
          )}
          {cita.estado === 'confirmada' && (
            <button onClick={() => { onCitaUpdate(cita.id, { estado: 'pendiente' }); setContextMenu(null); }} className="w-full px-4 py-2 text-left hover:bg-yellow-50 flex items-center gap-2 text-yellow-600"><AlertCircle className="w-4 h-4" />Deshacer confirmación</button>
          )}
          <button onClick={() => { setCitaAEliminar({ id: cita.id }); setContextMenu(null) }} className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-red-600"><Trash2 className="w-4 h-4" />Eliminar cita</button>
        </>
      )
    })()}
  </div>
)}

      <ConfirmModal
        open={!!citaAEliminar}
        title="Eliminar cita"
        message="¿Seguro que deseas eliminar esta cita?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        onCancel={() => setCitaAEliminar(null)}
        onConfirm={() => {
          if (citaAEliminar) {
            // Buscar la cita a eliminar
            const cita = citas.find((c) => c.id === citaAEliminar.id);
            if (cita) {
              // Restaurar el tipo original del módulo si corresponde
              const modulo = modulos.find((m) => m.id === cita.moduloId);
              if (modulo && modulo.tipo) {
                // Si el tipo tiene formato "Tipo - Paciente - RUN", dejar solo "Tipo"
                const tipoBase = modulo.tipo.split(" - ")[0].trim();
                const updatePayload: Partial<Modulo> = {}
                if (modulo.tipo !== tipoBase) {
                  updatePayload.tipo = tipoBase
                }
                // Restaurar color original si fue guardado
                if ((cita as any).originalModuloColor) {
                  updatePayload.color = (cita as any).originalModuloColor
                }
                if (Object.keys(updatePayload).length > 0) {
                  onModuloUpdate(modulo.id, updatePayload)
                }
              }
            }
            onCitaDelete(citaAEliminar.id);
          }
          setCitaAEliminar(null);
        }}
      />
      <ConfirmModal open={moduloAEliminar != null} title="Eliminar módulo" message="¿Seguro que deseas eliminar este módulo?" confirmText="Eliminar" cancelText="Cancelar" onCancel={() => setModuloAEliminar(null)} onConfirm={() => { if (moduloAEliminar != null && String(moduloAEliminar).trim()) { onModuloDelete([moduloAEliminar]); } else { console.error('[CalendarView] ID de módulo inválido:', moduloAEliminar); } setModuloAEliminar(null) }} />
      <ConfirmModal open={confirmEliminarSeleccionados} title="Eliminar módulos" message={`¿Estás seguro de eliminar ${selectedModulos.length} módulos?`} confirmText="Eliminar" cancelText="Cancelar" onCancel={() => setConfirmEliminarSeleccionados(false)} onConfirm={() => { const idsValidos = selectedModulos.filter(id => id && String(id).trim()); if (idsValidos.length > 0) { onModuloDelete(idsValidos); } else { console.error('[CalendarView] No hay IDs válidos en selectedModulos'); } setSelectedModulos([]); setConfirmEliminarSeleccionados(false) }} />
      <ConfirmModal open={!!confirmEliminarSemana?.open} title="Eliminar módulos de la semana" message={`¿Eliminar ${confirmEliminarSemana?.ids.length ?? 0} módulos de la semana?`} confirmText="Eliminar" cancelText="Cancelar" onCancel={() => setConfirmEliminarSemana(null)} onConfirm={() => { if (confirmEliminarSemana) { const idsValidos = confirmEliminarSemana.ids.filter(id => id && String(id).trim()); if (idsValidos.length > 0) { onModuloDelete(idsValidos); } else { console.error('[CalendarView] No hay IDs válidos en confirmEliminarSemana'); } } setConfirmEliminarSemana(null) }} />

      {copiarSemanaModal && copiarSemanaModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Copiar estructura de la semana</h3>
              <button onClick={() => setCopiarSemanaModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div>
              <p className="mb-2">Selecciona la semana destino en el mini calendario:</p>
              <div className="flex items-center justify-between mb-2">
                <button className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200" onClick={() => setWeekPickerMonth(addDays(startOfMonth(weekPickerMonth), -1))}>{"<"}</button>
                <div className="font-semibold">{weekPickerMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</div>
                <button className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200" onClick={() => setWeekPickerMonth(addDays(endOfMonth(weekPickerMonth), 1))}>{">"}</button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-xs text-gray-600">
                {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map((d) => (<div key={d} className="text-center font-semibold py-1">{d}</div>))}
                {(() => {
                  const cells: JSX.Element[] = [];
                  const monthStart = startOfMonth(weekPickerMonth);
                  const monthEnd = endOfMonth(weekPickerMonth);
                  const firstGridDay = getMonday(monthStart);
                  const lastGridDay = getMonday(addDays(monthEnd, 6));
                  const currentMondayIso = toISODate(getMonday(new Date()))
                  let cursor = new Date(firstGridDay);
                  while (cursor < lastGridDay) {
                    for (let i=0;i<7;i++) {
                      const day = addDays(cursor, i);
                      const inMonth = day.getMonth() === weekPickerMonth.getMonth();
                      const isSunday = day.getDay() === 0;
                      const isMonday = day.getDay() === 1;
                      const cellKey = `${day.toISOString().slice(0,10)}`;
                      // determinar si la semana (lunes) está seleccionada
                      const mondayOfWeek = toISODate(getMonday(day))
                      const selected = copiarSemanaTargets.includes(mondayOfWeek)
                      const isCurrentWeek = mondayOfWeek === currentMondayIso
                      const classes = [
                        'border','rounded','p-2','h-16','relative','cursor-pointer',
                        inMonth ? 'bg-white' : 'bg-gray-50',
                        isSunday ? 'opacity-50 pointer-events-none' : '',
                        selected ? 'bg-blue-100 ring-2 ring-blue-400' : (isCurrentWeek ? 'bg-emerald-50 ring-2 ring-emerald-300' : (isMonday ? 'ring-1 ring-blue-200' : '')),
                      ].join(' ');
                      cells.push(
                        <div key={cellKey} className={classes} onClick={() => {
                          if (!copiarSemanaModal) return;
                          if (isSunday) return;
                          // alternar selección de la semana (usar lunes como id)
                          const mondayId = toISODate(getMonday(day))
                          setCopiarSemanaTargets((prev) => prev.includes(mondayId) ? prev.filter((p) => p !== mondayId) : [...prev, mondayId])
                        }}>
                          <div className="absolute top-1 right-1 text-[10px] text-gray-400">{getWeekNumber(day)}</div>
                          <div className="text-sm font-semibold">{day.getDate()}</div>
                          {selected && (
                            <div className="absolute inset-x-0 bottom-1 text-center text-[9px] text-blue-700 font-medium">Seleccionada</div>
                          )}
                          {isCurrentWeek && (
                            <div className="absolute left-1 bottom-6 text-[9px] text-emerald-700 font-medium">Esta semana</div>
                          )}
                        </div>
                      );
                    }
                    cursor = addDays(cursor, 7);
                  }
                  return cells;
                })()}
              </div>
              <div className="text-xs text-gray-500 mt-2">Haz clic en cualquier día para seleccionar su semana (se copiará al lunes de esa semana). Domingos no permitidos.</div>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => setCopiarSemanaModal(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancelar</button>
                <button type="button" disabled={copiarSemanaTargets.length === 0} onClick={() => {
                  if (!copiarSemanaModal) return;
                  // aplicar copyWeekStructure a todas las semanas seleccionadas
                  const origin = copiarSemanaModal.originMonday
                  const profesionalId = copiarSemanaModal.profesionalId
                  let total = 0
                  const results: { target: string; created: number }[] = []
                  if (!profesionalId) {
                    window.alert("Error: No se pudo obtener el ID del profesional.")
                    return
                  }
                  copiarSemanaTargets.forEach((mondayIso) => {
                    const toMonday = new Date(mondayIso + 'T00:00:00')
                    // evitar copiar a la misma semana origen
                    if (toMonday.getTime() === origin.getTime()) return
                    const count = copyWeekStructure(origin, toMonday, profesionalId)
                    total += count
                    results.push({ target: mondayIso, created: count })
                  })
                  // mostrar resumen
                  const lines = results.map(r => `${r.created} módulos → semana ${r.target}`).join('\n')
                  window.alert(`Copiados en total ${total} módulo(s).\n\n${lines}`)
                  setCopiarSemanaModal(null)
                }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50" >COPIAR</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {eliminarSemanaModal && eliminarSemanaModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Eliminar módulos por semana</h3>
              <button onClick={() => setEliminarSemanaModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div>
              <p className="mb-2">Selecciona las semanas destino en el mini calendario (se eliminarán los módulos en esas semanas para el profesional):</p>
              <div className="flex items-center justify-between mb-2">
                <button className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200" onClick={() => setWeekPickerMonth(addDays(startOfMonth(weekPickerMonth), -1))}>{"<"}</button>
                <div className="font-semibold">{weekPickerMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</div>
                <button className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200" onClick={() => setWeekPickerMonth(addDays(endOfMonth(weekPickerMonth), 1))}>{">"}</button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-xs text-gray-600">
                {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map((d) => (<div key={d} className="text-center font-semibold py-1">{d}</div>))}
                {(() => {
                  const cells: JSX.Element[] = [];
                  const monthStart = startOfMonth(weekPickerMonth);
                  const monthEnd = endOfMonth(weekPickerMonth);
                  const firstGridDay = getMonday(monthStart);
                  const lastGridDay = getMonday(addDays(monthEnd, 6));
                  const currentMondayIso = toISODate(getMonday(new Date()))
                  let cursor = new Date(firstGridDay);
                  while (cursor < lastGridDay) {
                    for (let i=0;i<7;i++) {
                      const day = addDays(cursor, i);
                      const inMonth = day.getMonth() === weekPickerMonth.getMonth();
                      const isSunday = day.getDay() === 0;
                      const cellKey = `${day.toISOString().slice(0,10)}`;
                      const mondayOfWeek = toISODate(getMonday(day))
                      const selected = eliminarSemanaTargets.includes(mondayOfWeek)
                      const isCurrentWeek = mondayOfWeek === currentMondayIso
                      const classes = [
                        'border','rounded','p-2','h-16','relative','cursor-pointer',
                        inMonth ? 'bg-white' : 'bg-gray-50',
                        isSunday ? 'opacity-50 pointer-events-none' : '',
                        selected ? 'bg-red-100 ring-2 ring-red-400' : (isCurrentWeek ? 'bg-emerald-50 ring-2 ring-emerald-300' : '')
                      ].join(' ');
                      cells.push(
                        <div key={cellKey} className={classes} onClick={() => {
                          if (isSunday) return;
                          const mondayId = toISODate(getMonday(day))
                          setEliminarSemanaTargets((prev) => prev.includes(mondayId) ? prev.filter((p) => p !== mondayId) : [...prev, mondayId])
                        }}>
                          <div className="absolute top-1 right-1 text-[10px] text-gray-400">{getWeekNumber(day)}</div>
                          <div className="text-sm font-semibold">{day.getDate()}</div>
                          {selected && (<div className="absolute inset-x-0 bottom-1 text-center text-[9px] text-red-700 font-medium">Seleccionada</div>)}
                          {isCurrentWeek && (<div className="absolute left-1 bottom-6 text-[9px] text-emerald-700 font-medium">Esta semana</div>)}
                        </div>
                      );
                    }
                    cursor = addDays(cursor, 7);
                  }
                  return cells;
                })()}
              </div>
              <div className="text-xs text-gray-500 mt-2">Haz clic en cualquier día para seleccionar su semana. Domingos no permitidos.</div>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => setEliminarSemanaModal(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancelar</button>
                <button type="button" disabled={eliminarSemanaTargets.length === 0} onClick={async () => {
                  if (!eliminarSemanaModal) return;
                  // recopilar ids de módulos en las semanas seleccionadas para el profesional
                  const profesionalId = eliminarSemanaModal.profesionalId
                  const idsToDelete: number[] = []
                  const excluded: { id: number; fecha: string; horaInicio: string }[] = []

                  // Cargar módulos y citas de cada semana seleccionada (incluye semanas fuera del rango visible)
                  const weeksData = await Promise.all(eliminarSemanaTargets.map(async (mondayIso) => {
                    const start = new Date(mondayIso + 'T00:00:00')
                    const end = addDays(start, 6)
                    const startISO = toISODate(start)
                    const endISO = toISODate(end)
                    const [modsRemote, citasRemote] = await Promise.all([
                      getWeekModules(String(profesionalId), startISO, endISO),
                      getWeekCitas(String(profesionalId), startISO, endISO),
                    ])
                    return { start, end, startISO, endISO, modsRemote, citasRemote }
                  }))

                  for (const w of weeksData) {
                    // Combinar con datos locales para evitar misses (por si ya están cargados en estado)
                    const localMods = modulos.filter((m) => String((m as any).profesionalId) === String(profesionalId) && m.fecha >= w.startISO && m.fecha <= w.endISO)
                    const combinedModsMap = new Map<number, any>()
                    for (const m of [...w.modsRemote, ...localMods]) combinedModsMap.set((m as any).id, m)
                    const combinedMods = Array.from(combinedModsMap.values()) as any[]

                    // Para citas, quedarnos con las que referencian los módulos candidatos (unión remoto + local)
                    const moduloIdSet = new Set(combinedMods.map((m: any) => m.id))
                    const localCitas = citas.filter((c) => moduloIdSet.has((c as any).moduloId))
                    const combinedCitasMap = new Map<any, any>()
                    for (const c of [...w.citasRemote, ...localCitas]) combinedCitasMap.set((c as any).id, c)
                    const combinedCitas = Array.from(combinedCitasMap.values())

                    // Clasificar para eliminar o excluir si tiene cita
                    combinedMods.forEach((m: any) => {
                      const hasCita = combinedCitas.some((c: any) => (c as any).moduloId === m.id)
                      if (hasCita) excluded.push({ id: m.id, fecha: m.fecha, horaInicio: m.horaInicio })
                      else idsToDelete.push(m.id)
                    })
                  }
                  // eliminar duplicados y filtrar IDs nulos
                  const uniqueIds = Array.from(new Set(idsToDelete))
                    .map(String)
                    .filter(id => id && id.trim() && id.toLowerCase() !== 'null')
                  console.log(`[Eliminar semana modal] ${idsToDelete.length} IDs brutos → ${uniqueIds.length} IDs válidos`);
                  if (uniqueIds.length === 0) {
                    // No hay módulos borrables: mostrar preview de excluidos (solo información)
                    setExcludedPreview({ open: true, excluded: excluded.map(e => ({ id: String(e.id), tipo: (modulos.find(m=>String(m.id)===String(e.id))?.tipo) ?? '', fecha: e.fecha, horaInicio: e.horaInicio })), toDelete: [] })
                    setEliminarSemanaModal(null)
                    return
                  }
                  // Mostrar preview donde se listan los excluidos y los que se borrarán
                  setExcludedPreview({ open: true, excluded: excluded.map(e => ({ id: String(e.id), tipo: (modulos.find(m=>String(m.id)===String(e.id))?.tipo) ?? '', fecha: e.fecha, horaInicio: e.horaInicio })), toDelete: uniqueIds })
                  setEliminarSemanaModal(null)
                }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">ELIMINAR</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {liveSelection && liveSelection.open && (
        <div style={{ position: 'absolute', left: liveSelection.x, top: liveSelection.y, zIndex: 60, pointerEvents: 'none' }}>
          <div className="bg-white shadow rounded p-2 text-xs border border-gray-200">
            <div className="font-semibold">{liveSelection.fecha}</div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-gray-100 rounded">{liveSelection.horaInicio}</div>
              <div className="text-gray-400">→</div>
              <div className="px-2 py-1 bg-gray-100 rounded">{liveSelection.horaFin}</div>
            </div>
            <div className="text-gray-500 text-right">{liveSelection.minutes} min</div>
          </div>
        </div>
      )}
      {tooltip?.cita && (() => {
        const cita = tooltip.cita as Cita
        const pacienteObj = pacientes.find((p) => p.id === cita.pacienteId)
        const fullName = pacienteObj ? `${pacienteObj.nombre}` : (cita.pacienteNombre ?? '')
        const run = pacienteObj?.run ?? ''
        return (
          <div style={{ position: 'fixed', left: tooltip.x + 12, top: tooltip.y + 12, zIndex: 70, pointerEvents: 'none' }}>
            <div className="bg-white/90 backdrop-blur-sm rounded p-3 text-base border border-gray-200 shadow-lg max-w-xs">
                    <div className="font-semibold text-base mb-1">{fullName}</div>
                    {/* Estado de la cita */}
                    {cita.estado === 'confirmada' ? (
                      <div className="inline-block text-xs px-2 py-0.5 bg-emerald-600 text-white rounded mb-2">Cita Confirmada</div>
                    ) : (
                      <div className="inline-block text-xs px-2 py-0.5 bg-yellow-600 text-white rounded mb-2">Pendiente Confirmacion</div>
                    )}
              {run && <div className="text-sm text-gray-500 mb-1">RUN: {run}</div>}
              <div className="text-sm text-gray-500 mb-1">Fecha: {cita.fecha} • Hora: {cita.hora}</div>
              {pacienteObj?.telefono && <div className="text-sm text-gray-500 mb-1">Teléfono: {pacienteObj.telefono}</div>}
              {cita.observacion && (
                <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded"><strong>Observación:</strong> {cita.observacion}</div>
              )}
            </div>
          </div>
        )
      })()}

      {tooltip?.modulo && (() => {
        const modulo = tooltip.modulo as Modulo
        const horaModulo = `${modulo.horaInicio} - ${modulo.horaFin}`
        const detalle = modulo.observaciones ?? modulo.tipo ?? ''
        return (
          <div style={{ position: 'fixed', left: tooltip.x + 12, top: tooltip.y + 12, zIndex: 70, pointerEvents: 'none' }}>
            <div className="bg-white/90 backdrop-blur-sm rounded p-3 text-base border border-gray-200 shadow-lg max-w-xs">
              <div className="font-semibold text-base mb-1">Hora de módulo: <span className="font-normal">{horaModulo}</span></div>
              <div className="text-sm text-gray-700 mb-2"><span className="font-normal">{detalle && detalle.length > 0 ? detalle : ' '}</span></div>
              {/* Si existe una cita asociada, mostrar su estado */}
              {(() => {
                const citaAssoc = citas.find((c) => c.moduloId === modulo.id)
                if (!citaAssoc) return null
                return citaAssoc.estado === 'confirmada' ? (
                  <div className="inline-block text-xs px-2 py-0.5 bg-emerald-600 text-white rounded">Cita Confirmada</div>
                ) : (
                  <div className="inline-block text-xs px-2 py-0.5 bg-yellow-600 text-white rounded">Pendiente Confirmacion</div>
                )
              })()}
            </div>
          </div>
        )
      })()}
      {/* Modal para gestionar todos los módulos del profesional seleccionado */}
      {showGestionModulosModal && (
        <ModuloListModal
          modulos={selectedProfesionalId ? modulos.filter((m) => String(m.profesionalId) === selectedProfesionalId) : modulos}
          onClose={() => setShowGestionModulosModal(false)}
          onEdit={(modulo) => {
            // reenviar evento para abrir el modal de edición del módulo
            window.dispatchEvent(new CustomEvent("editModuloFromList", { detail: modulo }))
            setShowGestionModulosModal(false)
          }}
          onDelete={(id) => {
            // ✅ Validar que el ID sea válido antes de intentar eliminar
            if (id && String(id).trim() && String(id).toLowerCase() !== 'null') {
              onModuloDelete([id])
            } else {
              console.error('[CalendarView ModuloListModal] ID inválido:', id);
              alert('Error: No se puede eliminar un módulo con ID inválido');
            }
          }}
        />
      )}

      {/* Tooltip flotante que sigue al cursor para mostrar la hora del slot */}
      {slotTooltip && (
        <div
          className="fixed pointer-events-none z-50 bg-gradient-to-b from-blue-600 to-blue-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-semibold whitespace-nowrap border border-blue-500"
          style={{
            left: `${slotTooltip.x}px`,
            top: `${slotTooltip.y}px`,
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          <div className="flex items-center gap-2">
            <span>⏰</span>
            <span>{slotTooltip.time}</span>
          </div>
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-600 rotate-45"></div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Modal para gestionar Plantillas de Módulo */}
      {showPlantillaListModal && (
        <PlantillaListModal
          plantillas={plantillas.filter(
            (p) =>
              // Mostrar todas si no hay profesional seleccionado
              selectedProfesionalId === null ||
              // Mostrar si la plantilla no está asociada a un profesional específico (definición global)
              p.profesionalId === undefined || p.profesionalId === null || p.profesionalId === 0 ||
              // O si coincide con el profesional seleccionado
              String(p.profesionalId) === selectedProfesionalId
          )}
          modulos={modulos}
          onClose={() => setShowPlantillaListModal(false)}
          onEdit={(plantilla) => {
            setEditingPlantilla(plantilla)
            setShowPlantillaEditModal(true)
          }}
          onDelete={(plantillaId) => {
            // Eliminar plantilla usando Firebase
            try {
              onPlantillaDelete(plantillaId as string)
              // console.log("✅ Plantilla eliminada de Firebase:", plantillaId)
            } catch (err) {
              console.error("❌ Error al eliminar plantilla:", err)
            }
            setShowPlantillaListModal(false)
          }}
          currentUser={currentUser}
          selectedProfesionalId={selectedProfesionalId}
        />
      )}

      {/* Modal para editar/crear Plantilla */}
      {showPlantillaEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingPlantilla ? "Editar Plantilla" : "Nueva Plantilla"}
              </h3>
              <button
                onClick={() => {
                  setShowPlantillaEditModal(false)
                  setEditingPlantilla(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const tipo = String(formData.get("tipo") || "").trim()
                const duracion = Number(formData.get("duracion") || 0)
                const profesion = String(formData.get("profesion") || "").trim()
                const color = String(formData.get("color") || "#3498db")
                const observaciones = String(formData.get("observaciones") || "").trim()

                // ✅ Validar que tipo (nombre del módulo) no esté vacío
                if (!tipo || !duracion || !profesion) {
                  alert("⚠️ Por favor completa todos los campos requeridos (Tipo de Módulo, Duración, Profesión)")
                  return
                }

                if (editingPlantilla) {
                  // Actualizar plantilla existente
                  const updates = {
                    tipo,
                    duracion,
                    profesion,
                    color,
                    observaciones,
                  }
                  
                  try {
                    onPlantillaUpdate(editingPlantilla.id as unknown as string, updates)
                  } catch (err) {
                    console.error("❌ Error al actualizar plantilla:", err)
                  }
                } else {
                  // Crear nueva plantilla
                  const newPlantilla: Omit<PlantillaModulo, "id"> = {
                    profesionalId: selectedProfesionalId ? parseInt(selectedProfesionalId) : currentUser.id,
                    tipo,
                    duracion,
                    profesion,
                    color,
                    observaciones,
                  }
                  
                  try {
                    onPlantillaCreate(newPlantilla)
                  } catch (err) {
                    console.error("❌ Error al crear plantilla:", err)
                  }
                }

                setShowPlantillaEditModal(false)
                setEditingPlantilla(null)
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Módulo *
                </label>
                <input
                  name="tipo"
                  type="text"
                  placeholder="Ej: Ingreso, Control, Seguimiento..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  defaultValue={editingPlantilla?.tipo || ""}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duración (minutos) *
                </label>
                <input
                  name="duracion"
                  type="number"
                  min="5"
                  step="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  defaultValue={editingPlantilla?.duracion || 30}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profesión/Especialidad {editingPlantilla && "(No editable)"}
                </label>
                {editingPlantilla ? (
                  // Edición: campo read-only
                  <input
                    name="profesion"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    value={editingPlantilla?.profesion || ""}
                    readOnly
                    tabIndex={-1}
                  />
                ) : (
                  // Creación: campo editable
                  <input
                    name="profesion"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    defaultValue={""}
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  name="color"
                  type="color"
                  className="w-16 h-8 border border-gray-300 rounded-lg"
                  defaultValue={editingPlantilla?.color || "#3498db"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  name="observaciones"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                  defaultValue={editingPlantilla?.observaciones || ""}
                />
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPlantillaEditModal(false)
                    setEditingPlantilla(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación para propagar cambios de plantilla */}
      {plantillaConfirmPropagation?.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Actualizar Instancias</h3>
              <button
                onClick={() => setPlantillaConfirmPropagation(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-700">
                Esta plantilla tiene <strong>{plantillaConfirmPropagation.instanceCount}</strong> instancia
                {plantillaConfirmPropagation.instanceCount !== 1 ? "s" : ""} configuradas en el calendario.
              </p>

              <p className="text-gray-600 text-sm">
                ¿Deseas aplicar los cambios a todas las instancias existentes?
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-900">
                  <strong>Nota:</strong> Si seleccionas "No", solo se actualizará la definición de la
                  plantilla para futuras instancias.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (plantillaConfirmPropagation.plantilla && editingPlantilla) {
                      // Propagar cambios a todas las instancias
                      const affectedModulos = modulos.filter(
                        (m) => m.plantillaId === editingPlantilla.id
                      )
                      affectedModulos.forEach((m) => {
                        onModuloUpdate(m.id, {
                          tipo: plantillaConfirmPropagation.plantilla.tipo,
                          duracion: plantillaConfirmPropagation.plantilla.duracion,
                          profesion: plantillaConfirmPropagation.plantilla.profesion,
                          color: plantillaConfirmPropagation.plantilla.color,
                          observaciones: plantillaConfirmPropagation.plantilla.observaciones,
                        })
                      })
                    }
                    setPlantillaConfirmPropagation(null)
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Sí, propagar
                </button>
                <button
                  onClick={() => {
                    // Solo actualizar la plantilla sin tocar instancias
                    if (editingPlantilla && plantillaConfirmPropagation.plantilla) {
                      Object.assign(editingPlantilla, plantillaConfirmPropagation.plantilla)
                    }
                    setPlantillaConfirmPropagation(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  No, solo guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
