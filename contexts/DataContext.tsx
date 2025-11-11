// Archivo: contexts/DataContext.tsx
// Propósito: Mantener datos sincronizados en tiempo real
// Es como el "corazón" de la aplicación

'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import type { PlantillaModulo } from '@/lib/demoData'
import type { Modulo, Cita } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { useSupabaseModulos } from '@/lib/hooks/useSupabaseModulos'
import { useSupabaseCitas } from '@/lib/hooks/useSupabaseCitas'
import { useSupabasePlantillas } from '@/lib/hooks/useSupabasePlantillas'
import { useMoverCita } from '@/lib/hooks/useMoverCita'


// ============================================
// 1️⃣ DEFINIR TIPOS DE DATOS
// ============================================

/**
 * Interface: ¿Qué funciones y datos tiene el Context?
 * 
 * Es como un "contrato" que dice:
 * "El Context siempre tendrá estos datos y estas funciones"
 */
interface DataContextType {
  // DATOS
  modulos: Modulo[]
  citas: Cita[]
  plantillas: PlantillaModulo[]
  loading: boolean
  error: string | null

  // FUNCIONES para MÓDULOS
  addModulo: (modulo: Omit<Modulo, 'id'>) => Promise<void>
  addModulosBatch?: (modulos: Omit<Modulo, 'id'>[]) => Promise<void>
  updateModulo: (id: string | number, updates: Partial<Modulo>) => Promise<void>
  deleteModulo: (id: string | number) => Promise<void>
  refreshModulos?: () => Promise<void>

  // FUNCIONES para CITAS
  addCita: (cita: Omit<Cita, 'id'>) => Promise<void>
  updateCita: (id: string | number, updates: Partial<Cita>) => Promise<void>
  deleteCita: (id: string | number) => Promise<void>

  // FUNCIONES para PLANTILLAS
  addPlantilla: (plantilla: Omit<PlantillaModulo, 'id'>) => Promise<void>
  updatePlantilla: (id: string | number, updates: Partial<PlantillaModulo>) => Promise<void>
  deletePlantilla: (id: string | number) => Promise<void>

  // CONTROL DE RANGO VISIBLE (para optimizar lecturas)
  setVisibleRange: (startISO: string, endISO: string) => void
  // Identificador del profesional actualmente activo (puede cambiar en la UI)
  activeProfesionalId?: string | null
  // Permite a componentes cambiar el profesional activo (por ejemplo, un selector en CalendarView)
  setActiveProfesional?: (id?: string | null) => void
}

// ============================================
// 2️⃣ CREAR EL CONTEXT
// ============================================

/**
 * Creamos el Context (lugar donde guardar datos compartidos)
 * 
 * Es como una "caja mágica" que todos los componentes pueden ver
 */
const DataContext = createContext<DataContextType | undefined>(undefined)

// ============================================
// 3️⃣ CREAR EL PROVIDER (Proveedor)
// ============================================

/**
 * DataProvider: El "guardián" que mantiene todo sincronizado
 * 
 * Props:
 *   - children: Componentes que quieren acceder a los datos
 *   - profesionalId: El ID del profesional (para filtrar datos)
 */
export function DataProvider({
  children,
  profesionalId,
}: {
  children: React.ReactNode
  // profesionalId puede venir desde la UI (admin seleccionando otro profesional)
  // o no venir (en cuyo caso usamos el usuario autenticado)
  profesionalId?: string | null
}) {
  // ============================================
  // ESTADO (datos que se guardan)
  // ============================================

  const [modulos, setModulos] = useState<Modulo[]>([])
  const [citas, setCitas] = useState<Cita[]>([])
  const [plantillas, setPlantillas] = useState<PlantillaModulo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Mapa de sobrescrituras optimistas para evitar que un refetch temporal
  // "reviva" valores antiguos después de un drag. TTL corto por seguridad.
  const optimisticModulosRef = useRef<Record<string, { updates: Partial<Modulo>; expiresAt: number }>>({})
  // Rango visible (YYYY-MM-DD). Se inicia con semana actual para no traer todo.
  const [visibleStart, setVisibleStart] = useState<string>(() => {
    const d = new Date(); const day = d.getDay(); const diffToMon = (day + 6) % 7; d.setDate(d.getDate() - diffToMon); d.setHours(0,0,0,0)
    const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0')
    return `${y}-${m}-${dd}`
  })
  const [visibleEnd, setVisibleEnd] = useState<string>(() => {
    const d = new Date(); const day = d.getDay(); const diffToMon = (day + 6) % 7; d.setDate(d.getDate() - diffToMon + 6); d.setHours(0,0,0,0)
    const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0')
    return `${y}-${m}-${dd}`
  })

  // Estado interno que representa el profesional seleccionado en la UI.
  // Se inicializa desde la prop `profesionalId` si se proporciona.
  const [activeProfesionalId, setActiveProfesionalId] = useState<string | null>(() => (
    profesionalId ? String(profesionalId) : null
  ))
  
  // Ref para rastrear si ya inicializamos activeProfesionalId con el user
  const initializedRef = useRef(false)

  // Si la prop `profesionalId` cambia (p. ej. el layout la provee), sincronizarla.
  useEffect(() => {
    if (profesionalId) {
      setActiveProfesionalId(String(profesionalId))
      initializedRef.current = true
    }
  }, [profesionalId])

  // Estado de autenticación (para no montar listeners sin credenciales)
  const { user: authUser, loading: authLoading } = useAuth()
  
  // 🔐 Obtener usuario del localStorage como fallback si AuthContext aún no ha cargado
  // Esto evita timing issues donde user es null aunque esté autenticado
  const [userFromStorage, setUserFromStorage] = useState<any | null>(null)
  
  useEffect(() => {
    try {
      const TOKEN_KEY = 'sistema_auth_token'
      const storedToken = localStorage.getItem(TOKEN_KEY)
      if (storedToken) {
        const tokenData = JSON.parse(storedToken)
        if (tokenData.expiry && tokenData.expiry > Date.now()) {
          setUserFromStorage({
            id: tokenData.id || tokenData.userId,
            uid: tokenData.id || tokenData.userId,
            email: tokenData.email,
            nombre: tokenData.nombre,
            esAdmin: tokenData.esAdmin
          })
        }
      }
    } catch (err) {
      // Ignorar silenciosamente
    }
  }, [])
  
  // Usar primero authUser de AuthContext, sino del localStorage
  const user = authUser || userFromStorage

  // Solo sincronizar activeProfesionalId con user UNA VEZ al inicializar
  useEffect(() => {
    if (!initializedRef.current && !activeProfesionalId && user) {
      setActiveProfesionalId(user.uid || (user as any).id)
      initializedRef.current = true
    }
  }, [user])

  // ============================================
  // EFECTO: Usar hooks de Supabase para modulos y citas
  // ============================================
  // calcular id efectivo: usar la selección (profesionalId) si está presente,
  // si no, usar el usuario autenticado (user.uid)
  const effectiveProfesionalId = activeProfesionalId ? String(activeProfesionalId) : (user ? (user.uid || (user as any).id) : null)

  // Estado para forzar refetch de módulos (cuando se insertan nuevos)
  const [refetchTrigger, setRefetchTrigger] = useState(0)
  const [refetchCitasTrigger, setRefetchCitasTrigger] = useState(0)

  // Obtener módulos y citas desde Supabase usando hooks: pasamos el profesional activo
  const { modulos: modulosSupabase, loading: modulosLoading } = useSupabaseModulos(effectiveProfesionalId, visibleStart, visibleEnd, refetchTrigger)
  const { citas: citasSupabase, loading: citasLoading } = useSupabaseCitas(effectiveProfesionalId || null, refetchCitasTrigger)
  const { plantillas: plantillasSupabase, loading: plantillasLoading } = useSupabasePlantillas()

  // Callback para forzar refetch de módulos (se llamará después de insertar en lote)
  const refreshModulos = useCallback(async () => {
    console.log('🔄 [DataContext] Triggering modulos refetch...')
    setRefetchTrigger(prev => prev + 1)
  }, [])

  // Sincronizar el estado local con los datos de Supabase pero respetando
  // sobrescrituras optimistas aún vigentes (para que no se revierta el drag).
  useEffect(() => {
    const remote = modulosSupabase || []
    const now = Date.now()
    // Limpiar entradas expiradas y construir merge
    const merged = remote.map((m: Modulo) => {
      const key = String((m as any).id)
      const opt = optimisticModulosRef.current[key]
      if (opt && opt.expiresAt > now) {
        return { ...m, ...opt.updates }
      }
      return m
    })
    // Purga ligera de expirados para que el mapa no crezca
    for (const [k, v] of Object.entries(optimisticModulosRef.current)) {
      if (!v || v.expiresAt <= now) delete optimisticModulosRef.current[k]
    }
    setModulos(merged)
  }, [modulosSupabase])

  // DEBUG: Exponer estado en window para QA rápido (solo en desarrollo)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        // @ts-ignore
        window.__modulos = modulos
        // @ts-ignore
        window.__citas = citas
      }
    } catch (e) {
      // ignore
    }
  }, [modulos, citas])

  useEffect(() => {
    setCitas(citasSupabase || [])
  }, [citasSupabase])

  // Plantillas desde Supabase (modulo_definitions)
  useEffect(() => {
    setPlantillas(plantillasSupabase || [])
  }, [plantillasSupabase])

  useEffect(() => {
    // Mantener plantillas desde Firestore por ahora (migración posterior)
    setLoading(modulosLoading || citasLoading || plantillasLoading || authLoading)
  }, [modulosLoading, citasLoading, plantillasLoading, authLoading])

  // Verificación ligera: (silenciada) comprobar existencia de plantilla "Ingreso"
  useEffect(() => {
    // Si se desea, habilitar logs con un flag local
    const DEBUG = false
    if (DEBUG && plantillasSupabase && plantillasSupabase.length > 0) {
      const ingreso = plantillasSupabase.find((p: any) => (p.tipo || p.nombre) === 'Ingreso')
      if (ingreso) {
        console.info('✅ Plantilla "Ingreso" encontrada en DB:', {
          id: ingreso.id,
          duracion: ingreso.duracion,
          color: ingreso.color,
          profesion: ingreso.profesion,
        })
      } else {
        console.warn('ℹ️ Aún no hay plantilla "Ingreso" en modulo_definitions')
      }
    }
  }, [plantillasSupabase])

  // Hook para mover/actualizar citas (mutación simple con Supabase)
  const { moverCita } = useMoverCita()

  // ============================================
  // FUNCIONES: CREAR, EDITAR, ELIMINAR
  // ============================================

  /**
   * Agregar nuevo módulo a Firebase
   * 
   * Flujo:
   * 1. Usuario hace clic en "Crear módulo"
   * 2. Llama a addModulo()
   * 3. Se guarda en Firebase
   * 4. Firebase notifica a todos los clientes
   * 5. Listener actualiza setModulos()
   * 6. CalendarView se re-renderiza
   */
  /**
   * Agregar nuevo módulo a Firebase
   * * Flujo:
   * 1. Usuario hace clic en "Crear módulo"
   * 2. Llama a addModulo()
   * 3. Se guarda en Firebase
   * 4. Firebase notifica a todos los clientes
   * 5. Listener actualiza setModulos()
   * 6. CalendarView se re-renderiza
   */
  const addModulo = useCallback(
    async (modulo: Omit<Modulo, 'id'>) => {
      // Intentar obtener token desde AuthContext o localStorage
      const getAuthHeaderValue = () => {
        try {
          // Preferir token guardado en localStorage (formato del proyecto)
          const raw = typeof window !== 'undefined' ? localStorage.getItem('sistema_auth_token') : null
          if (!raw) return null
          try {
            const parsed = JSON.parse(raw)
            // Si hay un token tipo JWT/ID token, usarlo
            const candidate = parsed?.access_token || parsed?.token
            if (candidate && typeof candidate === 'string' && candidate.length > 20) {
              return candidate
            }
            // Si no hay token válido, devolver el JSON completo como fallback dev
            // para que el endpoint pueda extraer userId/id
            return raw
          } catch (e) {
            // Si no se puede parsear, enviar tal cual (puede ser un UUID simple)
            return raw
          }
        } catch (e) {
          return null
        }
      }

      const authHeaderValue = getAuthHeaderValue()

      try {
        const targetProfesionalId = activeProfesionalId ? String(activeProfesionalId) : (profesionalId ? String(profesionalId) : user.uid)
        // Validar que el id del profesional tenga formato UUID (evita errores en BD y en triggers)
        const isUUID = (s?: string | null) => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
        if (!isUUID(targetProfesionalId)) {
          const msg = `El profesionalId proporcionado no tiene formato UUID: "${String(targetProfesionalId)}". Cancelando inserción.`
          console.error('❌ Error:', msg)
          setError(msg)
          throw new Error(msg)
        }

        // Mapear los campos al esquema real de la tabla `modulos`
        const payload: Record<string, any> = {
          profesionalid: targetProfesionalId,
          // Algunos triggers/funciones esperan el campo con guion bajo
          // (profesional_id). Incluir ambos nombres evita problemas de triggers
          // que lean la clave con otro nombre.
          profesional_id: targetProfesionalId,
          fecha: modulo.fecha,
          // Aceptar formatos "HH:MM" o "HH:MM:SS" según lo entregue la UI
          hora_inicio: (modulo.horaInicio && modulo.horaInicio.length === 5) ? `${modulo.horaInicio}:00` : modulo.horaInicio,
          hora_fin: (modulo.horaFin && modulo.horaFin.length === 5) ? `${modulo.horaFin}:00` : modulo.horaFin,
          nombre: modulo.tipo ?? null,
          descripcion: modulo.observaciones ?? null,
          fechacreacion: new Date().toISOString(),
          tipo: modulo.tipo ?? null,
        }

        console.warn('➕ Creando módulo (profesionalid):', payload.profesionalid)

        // Siempre usar endpoint server-side para respetar RLS
        const headers: Record<string,string> = { 'Content-Type': 'application/json' }
        if (authHeaderValue) headers['Authorization'] = `Bearer ${authHeaderValue}`
        const resp = await fetch('/api/modulos/batch', {
          method: 'POST',
          headers,
          body: JSON.stringify({ modulos: [payload] }),
        })
        const j = await resp.json()
        if (!resp.ok) {
          const msg = j?.error || 'Error al crear módulo (server)'
          throw new Error(msg)
        }
        console.log('✅ Módulo creado exitosamente (server)', j.data)
        
        // ✨ NUEVO: Actualizar estado inmediatamente con el módulo creado
        if (j.data && Array.isArray(j.data) && j.data.length > 0) {
          const nuevoModulo = j.data[0]
          const moduloConCamelCase: Modulo = {
            id: nuevoModulo.id,
            fecha: nuevoModulo.fecha,
            horaInicio: nuevoModulo.hora_inicio,
            horaFin: nuevoModulo.hora_fin,
            tipo: nuevoModulo.tipo,
            observaciones: nuevoModulo.descripcion,
            color: nuevoModulo.configuracion?.color ?? '#3b82f6', // Color viene de configuracion JSON
            profesionalId: nuevoModulo.profesionalid,
          }
          setModulos(prev => [...prev, moduloConCamelCase])
        }
        
        // 🔄 Luego refetch para mantener sincronización
        setRefetchTrigger(prev => prev + 1)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al crear módulo'
        console.error('❌ Error:', errorMsg)
        setError(errorMsg)
        throw err
      }
    },
    [user, profesionalId, activeProfesionalId]
  )

  /**
   * Crear múltiples módulos en una sola operación (batch) para reducir el número de escrituras.
   */
  const addModulosBatch = useCallback(
    async (lista: Omit<Modulo, 'id'>[]) => {
      // Intentar obtener token desde AuthContext o localStorage
      const getAuthHeaderValue = () => {
        try {
          const raw = typeof window !== 'undefined' ? localStorage.getItem('sistema_auth_token') : null
          if (!raw) {
            console.warn('[addModulosBatch] No hay sistema_auth_token en localStorage')
            return null
          }
          try {
            const parsed = JSON.parse(raw)
            console.log('[addModulosBatch] Token parseado desde localStorage:', {
              tiene_access_token: !!parsed?.access_token,
              tiene_token: !!parsed?.token,
              tiene_id: !!parsed?.id,
              tiene_userId: !!parsed?.userId,
              tiene_email: !!parsed?.email,
              keys: Object.keys(parsed)
            })
            const candidate = parsed?.access_token || parsed?.token
            if (candidate && typeof candidate === 'string' && candidate.length > 20) {
              console.log('[addModulosBatch] Usando access_token/token largo:', { length: candidate.length })
              return candidate
            }
            // Si no hay token largo, devolver el JSON completo para que el servidor lo parsee
            const jsonStr = JSON.stringify(parsed)
            console.log('[addModulosBatch] Usando JSON del token completo:', { length: jsonStr.length })
            return jsonStr
          } catch (e) {
            console.warn('[addModulosBatch] Error parseando token:', e)
            return raw
          }
        } catch (e) {
          console.warn('[addModulosBatch] Error en getAuthHeaderValue:', e)
          return null
        }
      }

      const authHeaderValue = getAuthHeaderValue()
      if (!authHeaderValue) {
        console.error('[addModulosBatch] ❌ No hay autenticación disponible (no hay token)')
      }
      if (!Array.isArray(lista) || lista.length === 0) return

      try {
        const targetProfesionalId = activeProfesionalId ? String(activeProfesionalId) : (profesionalId ? String(profesionalId) : user.uid)
        // Validar UUID antes de crear en lote
        const isUUID = (s?: string | null) => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
        if (!isUUID(targetProfesionalId)) {
          const msg = `El profesionalId proporcionado no tiene formato UUID: "${String(targetProfesionalId)}". Cancelando inserción en lote.`
          console.error('❌ Error:', msg)
          setError(msg)
          throw new Error(msg)
        }
        console.warn(`➕ Creando ${lista.length} módulo(s) en lote... (usando profesionalid: ${targetProfesionalId})`)

        const payload = lista.map((m) => ({
          profesionalid: targetProfesionalId,
          profesional_id: targetProfesionalId,
          fecha: m.fecha,
          hora_inicio: (m.horaInicio && m.horaInicio.length === 5) ? `${m.horaInicio}:00` : m.horaInicio,
          hora_fin: (m.horaFin && m.horaFin.length === 5) ? `${m.horaFin}:00` : m.horaFin,
          nombre: m.tipo ?? null,
          descripcion: m.observaciones ?? null,
          fechacreacion: new Date().toISOString(),
          tipo: m.tipo ?? null,
        }))

        // Usar endpoint server-side que inserta con service role (evita RLS desde cliente)
        const headers: Record<string,string> = { 'Content-Type': 'application/json' }
        if (authHeaderValue) {
          headers['Authorization'] = `Bearer ${authHeaderValue}`
          console.log('[addModulosBatch] Enviando Authorization header:', {
            length: authHeaderValue.length,
            preview: authHeaderValue.slice(0, 30),
            startsWith: authHeaderValue[0]
          })
        }
        
        console.log('[addModulosBatch] Enviando POST a /api/modulos/batch con payload:', {
          modulosCount: payload.length,
          headersKeys: Object.keys(headers)
        })
        
        const res = await fetch('/api/modulos/batch', {
          method: 'POST',
          headers,
          body: JSON.stringify({ modulos: payload }),
        })
        
        console.log('[addModulosBatch] Respuesta del servidor:', { status: res.status, statusText: res.statusText })
        
        const result = await res.json()
        if (!res.ok) {
          console.error('[addModulosBatch] ❌ Respuesta NO OK:', result)
          throw new Error(result?.error || 'Error al crear módulos')
        }
        const { data } = result
        console.warn('✅ Lote de módulos creado exitosamente', data)
        
        // ✨ NUEVO: Actualizar estado inmediatamente con los módulos creados
        if (Array.isArray(data) && data.length > 0) {
          const modulosConCamelCase: Modulo[] = data.map((m: any) => ({
            id: m.id,
            fecha: m.fecha,
            horaInicio: m.hora_inicio,
            horaFin: m.hora_fin,
            tipo: m.tipo,
            observaciones: m.descripcion,
            color: m.configuracion?.color ?? '#3b82f6', // Color viene de configuracion JSON
            profesionalId: m.profesionalid,
          }))
          setModulos(prev => [...prev, ...modulosConCamelCase])
        }
        
        // 🔄 Luego refetch de módulos para que aparezcan en el calendario
        console.log('[addModulosBatch] Triggering refetch after successful insert...')
        setRefetchTrigger(prev => prev + 1)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error en creación en lote de módulos'
        console.error('❌ Error:', errorMsg)
        setError(errorMsg)
        throw err
      }
    },
    [user, profesionalId, activeProfesionalId]
  )

  /**
   * Editar módulo existente
   */
  const updateModulo = useCallback(
    async (id: string | number, updates: Partial<Modulo>) => {
      try {
        console.log('[updateModulo] Actualizando módulo:', id, updates)
        // Actualizar inmediatamente en estado local
        const idStr = String(id)
        setModulos(prev => prev.map(m => String(m.id) === idStr ? { ...m, ...updates } : m))
        console.log('[updateModulo] Módulo actualizado en estado local')
        // Registrar sobrescritura optimista con TTL (p. ej. 6s)
        optimisticModulosRef.current[idStr] = {
          updates,
          expiresAt: Date.now() + 6000,
        }
        // LOG: Estado actual de modulos antes de update
        console.log('[updateModulo] Estado actual de modulos:', JSON.stringify(modulos, null, 2))
        // LOG: Estado de sobrescrituras optimistas
        console.log('[updateModulo] optimisticModulosRef:', JSON.stringify(optimisticModulosRef.current, null, 2))
        // LOG: Usuario actual
        console.log('[updateModulo] Usuario:', user)
        // LOG: Profesional activo
        console.log('[updateModulo] activeProfesionalId:', activeProfesionalId)
        // LOG: visibleStart/visibleEnd:', visibleStart, visibleEnd)
        // LOG: Payload antes de enviar a supabase
        const payload: Record<string, any> = { fechacreacion: new Date().toISOString() }
        const ensureHMSS = (v?: string | null) => {
          if (!v && v !== '') return v
          const s = String(v)
          if (/^\d{2}:\d{2}$/.test(s)) return `${s}:00`
          return s
        }
        if (updates.fecha !== undefined) payload.fecha = String(updates.fecha)
        if ((updates as any).horaInicio !== undefined) payload.hora_inicio = ensureHMSS((updates as any).horaInicio)
        if ((updates as any).horaFin !== undefined) payload.hora_fin = ensureHMSS((updates as any).horaFin)
        if (updates.tipo !== undefined) payload.tipo = updates.tipo
        if (updates.observaciones !== undefined) payload.descripcion = updates.observaciones
        if ((updates as any).nombre !== undefined) payload.nombre = (updates as any).nombre
        for (const k of Object.keys(updates)) {
          if (!['fecha','horaInicio','horaFin','duracion','tipo','observaciones','color','id','profesionalId','nombre'].includes(k)) {
            payload[k] = (updates as any)[k]
          }
        }
        console.log('[updateModulo] Payload enviado a supabase:', payload)
        const t0 = performance.now()
        const { data, error } = await supabase.from('modulos').update(payload).eq('id', id).select('id,fecha,hora_inicio,hora_fin,tipo,descripcion,profesionalid,profesional_id')
        const t1 = performance.now()
        console.log('[updateModulo] Duración update supabase (ms):', (t1 - t0).toFixed(1))
        if (error) {
          console.error('[updateModulo] Error supabase:', error)
          throw new Error(error.message)
        }
        console.log('[updateModulo] Respuesta update supabase:', { rowsUpdated: Array.isArray(data as any) ? (data as any).length : data, data })
        // LOG: Estado de modulos después de update supabase
        console.log('[updateModulo] Estado de modulos post-supabase:', JSON.stringify(modulos, null, 2))
        // Éxito cliente: ya no necesitamos sobrescritura optimista
        try { delete optimisticModulosRef.current[idStr] } catch {}
        // Si la actualización cliente no devolvió filas, intentar fallback server-side
        const rowsAffected = !data ? 0 : (Array.isArray(data as any) ? (data as any).length : 1)
        if (rowsAffected === 0) {
          const warn = `[updateModulo] Atención: la actualización cliente no devolvió filas para id=${id}. Intentando fallback server-side (/api/modulos/update). Esto puede indicar RLS.`
          console.warn(warn)
          setError(warn)
          try {
            const bodyForServer: Record<string, any> = { id: String(id) }
            if (payload.fecha !== undefined) bodyForServer.fecha = payload.fecha
            if (payload.hora_inicio !== undefined) bodyForServer.horaInicio = payload.hora_inicio
            if (payload.hora_fin !== undefined) bodyForServer.horaFin = payload.hora_fin
            if (payload.tipo !== undefined) bodyForServer.tipo = payload.tipo
            if (payload.descripcion !== undefined) bodyForServer.descripcion = payload.descripcion
            if (payload.nombre !== undefined) bodyForServer.nombre = payload.nombre
            let headers: Record<string,string> = { 'Content-Type': 'application/json' }
            try {
              const raw = typeof window !== 'undefined' ? localStorage.getItem('sistema_auth_token') : null
              if (raw) {
                try {
                  const parsed = JSON.parse(raw)
                  const candidate = parsed?.access_token || parsed?.token
                  if (candidate && typeof candidate === 'string' && candidate.length > 20) {
                    headers['Authorization'] = `Bearer ${candidate}`
                  } else {
                    headers['Authorization'] = raw
                  }
                } catch (e) {
                  headers['Authorization'] = raw
                }
              }
            } catch (e) {}
            console.log('[updateModulo] Llamando fallback /api/modulos/update con body:', bodyForServer)
            const f0 = performance.now()
            const resp = await fetch('/api/modulos/update', {
              method: 'POST',
              headers,
              body: JSON.stringify(bodyForServer),
            })
            const jr = await resp.json()
            const f1 = performance.now()
            console.log('[updateModulo] Duración fallback fetch (ms):', (f1 - f0).toFixed(1), 'status=', resp.status)
            if (!resp.ok) {
              console.error('[updateModulo] Fallback server error:', jr)
              setError(jr?.error || 'Fallback server update failed')
            } else {
              console.log('[updateModulo] Fallback server response:', jr)
              if (jr && jr.data && Array.isArray(jr.data) && jr.data.length > 0) {
                const updated = jr.data[0]
                setModulos(prev => prev.map(m => String(m.id) === String(id) ? {
                  ...m,
                  fecha: updated.fecha ?? m.fecha,
                  horaInicio: updated.hora_inicio ?? m.horaInicio,
                  horaFin: updated.hora_fin ?? m.horaFin,
                  tipo: updated.tipo ?? m.tipo,
                  observaciones: updated.descripcion ?? m.observaciones,
                } : m))
                console.log('[updateModulo] Estado local actualizado con respuesta server-side')
                try { delete optimisticModulosRef.current[idStr] } catch {}
              }
            }
          } catch (fallbackErr) {
            console.error('[updateModulo] Error en fallback server-side:', fallbackErr)
            setError(String(fallbackErr))
          }
        }
        // Forzar refetch para asegurar sincronización
        console.log('[updateModulo] Triggering modulos refetch')
        setRefetchTrigger(prev => prev + 1)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al actualizar módulo'
        console.error('[updateModulo] Error:', errorMsg)
        setError(errorMsg)
        setRefetchTrigger(prev => prev + 1)
        throw err
      }
    },
    [modulos, user, activeProfesionalId, visibleStart, visibleEnd]
  )

  /**
   * Eliminar módulo
   */
  const deleteModulo = useCallback(async (id: string | number) => {
    try {
      // ✅ Validar que el ID sea válido
      if (!id || String(id).trim() === '' || String(id).toLowerCase() === 'null') {
        console.error('[deleteModulo] ID inválido:', id);
        throw new Error('ID de módulo inválido: ' + id);
      }
      
      console.log('[deleteModulo] Eliminando módulo:', id)

      // Eliminar inmediatamente del estado local para reflejar cambios en UI
      const idStr = String(id)
      setModulos(prev => prev.filter(m => String(m.id) !== idStr))
      console.log('[deleteModulo] Módulo removido del estado local')

      // Llamar al endpoint server-side para borrar con service-role (evitar RLS)
      try {
        const resp = await fetch('/api/modulos/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: idStr }),
        })
        const result = await resp.json()
        if (!resp.ok) {
          console.error('[deleteModulo] Error en API /api/modulos/delete:', result)
          throw new Error(result?.error || 'Error deleting módulo (server)')
        }
        const deleted = result.data
        if (!deleted || (Array.isArray(deleted) && (deleted as any).length === 0)) {
          const msg = `[deleteModulo] No se eliminaron filas en BD para id/moduloid=${idStr} (server)`
          console.warn(msg)
          setError(msg)
          setRefetchTrigger(prev => prev + 1)
          return
        }
        console.log('[deleteModulo] Módulo(s) eliminado(s) de BD (server):', (deleted as any).length)
      } catch (serverErr) {
        console.error('[deleteModulo] Error al llamar al endpoint de borrado server-side:', serverErr)
        throw serverErr
      }

      // Forzar refetch para asegurar sincronización
      console.log('[deleteModulo] Triggering modulos refetch')
      setRefetchTrigger(prev => prev + 1)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al eliminar módulo'
      console.error('[deleteModulo] Error:', errorMsg)
      setError(errorMsg)
      // Forzar refetch para re-sincronizar y revertir visualmente si hace falta
      setRefetchTrigger(prev => prev + 1)
      throw err
    }
  }, [])

  // FUNCIONES SIMILARES PARA CITAS
  const addCita = useCallback(
    async (cita: Omit<Cita, 'id'>) => {
      try {
        console.log('[addCita] Creando cita:', cita)
        
        // Usar API endpoint con service-role en lugar de cliente directo
        // Campos en tabla citas: id, profesional_id, paciente_id, modulo_id, fecha, hora_inicio, hora_fin, estado, paciente_nombre_cache, created_at
        const response = await fetch('/api/citas/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // Solo enviar campos que existen en la tabla
            moduloId: (cita as any).moduloId ?? null,
            profesionalId: cita.profesionalId,
            pacienteId: (cita as any).pacienteId ?? null,
            fecha: cita.fecha,
            hora: (cita as any).hora ?? '00:00',
            horaFin: (cita as any).horaFin ?? null,
            estado: (cita as any).estado ?? 'pendiente',
            pacienteNombre: (cita as any).pacienteNombre ?? null,
            pacienteRun: (cita as any).pacienteRun ?? null,
            pacienteTelefono: (cita as any).pacienteTelefono ?? null,
            observacion: (cita as any).observacion ?? null,
            tipo: (cita as any).tipo ?? null,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const { data } = await response.json()
        console.log('[addCita] Cita creada exitosamente en BD')
        
        // Agregar a estado local inmediatamente para reflejar en UI
        if (data && Array.isArray(data) && data[0]) {
          const nuevaCita: Cita = {
            id: data[0].id,
            pacienteId: (data[0] as any).paciente_id || (cita as any).pacienteId,
            profesionalId: (data[0] as any).profesional_id || cita.profesionalId,
            moduloId: (data[0] as any).modulo_id || (cita as any).moduloId,
            fecha: (data[0] as any).fecha || cita.fecha,
            hora: (data[0] as any).hora_inicio || (cita as any).hora,
            horaFin: (data[0] as any).hora_fin || (cita as any).horaFin,
            estado: (data[0] as any).estado || (cita as any).estado,
            pacienteNombre: (data[0] as any).paciente_nombre_cache || (cita as any).pacienteNombre,
            observacion: (data[0] as any).observaciones || (cita as any).observacion,
            tipo: (data[0] as any).tipocita || (cita as any).tipo || 'Control',
            ...(data[0] as any)
          }
          setCitas(prev => [...prev, nuevaCita])
          console.log('[addCita] Cita agregada al estado local')
        }
        
        // Forzar refetch para asegurar sincronización
        console.log('[addCita] Triggering citas refetch')
        setRefetchCitasTrigger(prev => prev + 1)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al crear cita'
        console.error('[addCita] Error:', errorMsg)
        setError(errorMsg)
        throw err
      }
    },
    []
  )

  const updateCita = useCallback(
    async (id: string | number, updates: Partial<Cita>) => {
      try {
        console.log('[updateCita] Actualizando cita:', id, updates)
        
        // Actualizar inmediatamente en estado local
        const idStr = String(id)
        setCitas(prev => prev.map(c => 
          String(c.id) === idStr ? { ...c, ...updates } : c
        ))
        console.log('[updateCita] Cita actualizada en estado local')
        
        // Solo actualizar campos que existen en la tabla citas
        const payload: Record<string, any> = {}
        
        // Mapear campos camelCase a snake_case
        if ((updates as any).estado !== undefined) payload.estado = (updates as any).estado
        if ((updates as any).pacienteId !== undefined) payload.paciente_id = (updates as any).pacienteId
        if ((updates as any).pacienteNombre !== undefined) payload.paciente_nombre_cache = (updates as any).pacienteNombre
        if ((updates as any).hora !== undefined) payload.hora_inicio = (updates as any).hora
        if ((updates as any).horaFin !== undefined) payload.hora_fin = (updates as any).horaFin
        if ((updates as any).fecha !== undefined) payload.fecha = (updates as any).fecha
        if ((updates as any).moduloId !== undefined) payload.modulo_id = (updates as any).moduloId
        if ((updates as any).profesionalId !== undefined) payload.profesional_id = (updates as any).profesionalId

        console.log('[updateCita] Payload para actualizar:', payload)
        const { data, error } = await supabase.from('citas').update(payload).eq('id', id)
        if (error) throw new Error(error.message)
        console.log('[updateCita] Cita actualizada en BD')
        
        // Forzar refetch para asegurar sincronización
        console.log('[updateCita] Triggering citas refetch')
        setRefetchCitasTrigger(prev => prev + 1)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al actualizar cita'
        console.error('[updateCita] Error:', errorMsg)
        setError(errorMsg)
        // Revertir cambio local si hay error
        setRefetchCitasTrigger(prev => prev + 1)
        throw err
      }
    },
    []
  )

  const deleteCita = useCallback(async (id: string | number) => {
    try {
      console.log('[deleteCita] Eliminando cita:', id)

      // Eliminar inmediatamente del estado local para reflejar cambios en UI
      const idStr = String(id)
      setCitas(prev => prev.filter(c => String(c.id) !== idStr))
      console.log('✅ [deleteCita] Cita removida del estado local (UI actualizada inmediatamente)')

      // Llamar al endpoint server-side para borrar la cita (service-role) en background
      // Sin await para que no bloquee la UI
      fetch('/api/citas/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: idStr }),
      })
        .then(resp => resp.json())
        .then(result => {
          if (!result.ok && result.error) {
            console.error('[deleteCita] Error en API /api/citas/delete:', result)
            // Re-sincronizar si hay error en el servidor
            setRefetchCitasTrigger(prev => prev + 1)
          } else {
            const deleted = result.data
            if (!deleted || (Array.isArray(deleted) && (deleted as any).length === 0)) {
              const msg = `[deleteCita] No se eliminaron filas en BD para id/citaid=${idStr} (server)`
              console.warn(msg)
              setError(msg)
              // Re-sincronizar si no se eliminó nada
              setRefetchCitasTrigger(prev => prev + 1)
            } else {
              console.log('✅ [deleteCita] Cita(s) eliminado(s) de BD (server):', (deleted as any).length)
            }
          }
        })
        .catch(serverErr => {
          console.error('[deleteCita] Error al llamar al endpoint de borrado server-side:', serverErr)
          // Re-sincronizar si hay error de conexión
          setRefetchCitasTrigger(prev => prev + 1)
        })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al eliminar cita'
      console.error('[deleteCita] Error:', errorMsg)
      setError(errorMsg)
      throw err
    }
  }, [])

  // FUNCIONES PARA PLANTILLAS
  const addPlantilla = useCallback(
    async (plantilla: Omit<PlantillaModulo, 'id'>) => {
      try {
        console.log('➕ Creando plantilla en modulo_definitions (Supabase):', plantilla)
        // ✅ Solo incluir campos que tengan valores válidos
        const payload: Record<string, any> = {
          created_at: new Date().toISOString(),
        }
        
        // Añadir campos solo si tienen valores válidos
        if ((plantilla as any).tipo) {
          payload.tipo = (plantilla as any).tipo
          // Mapear 'nombre' desde 'tipo' para cumplir NOT NULL en BD
          payload.nombre = (plantilla as any).tipo
        }
        if ((plantilla as any).duracion) payload.duracion = (plantilla as any).duracion
        if ((plantilla as any).profesion) payload.profesion = (plantilla as any).profesion
        if ((plantilla as any).observaciones) payload.observaciones = (plantilla as any).observaciones
        if ((plantilla as any).color) payload.color = (plantilla as any).color
        
        // Añadir otros campos dinámicamente
        for (const k of Object.keys(plantilla)) {
          if (!['tipo','duracion','profesion','observaciones','color','id'].includes(k)) {
            const value = (plantilla as any)[k]
            if (value) {
              payload[k] = value
            }
          }
        }

        const { data, error } = await supabase.from('modulo_definitions').insert([payload]).select()
        if (error) throw new Error(error.message)
        console.log('✅ Plantilla creada en modulo_definitions', data)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al crear plantilla'
        console.error('❌ Error:', errorMsg)
        setError(errorMsg)
        throw err
      }
    },
    []
  )

  const updatePlantilla = useCallback(
    async (id: string | number, updates: Partial<PlantillaModulo>) => {
      try {
        console.log('✏️ Actualizando plantilla en modulo_definitions:', id, updates)
        const payload: Record<string, any> = { updated_at: new Date().toISOString() }
        if ((updates as any).tipo !== undefined) {
          payload.tipo = (updates as any).tipo
          // Mantener 'nombre' sincronizado con 'tipo'
          payload.nombre = (updates as any).tipo
        }
        if ((updates as any).duracion !== undefined) payload.duracion = (updates as any).duracion
        if ((updates as any).profesion !== undefined) payload.profesion = (updates as any).profesion
        if ((updates as any).observaciones !== undefined) payload.observaciones = (updates as any).observaciones
        if ((updates as any).color !== undefined) payload.color = (updates as any).color
        // Incluir otros campos dinámicos
        for (const k of Object.keys(updates)) {
          if (!['tipo','duracion','profesion','observaciones','color','id'].includes(k)) {
            // @ts-ignore
            payload[k] = (updates as any)[k]
          }
        }
        const { data, error } = await supabase.from('modulo_definitions').update(payload).eq('id', id)
        if (error) throw new Error(error.message)
        console.log('✅ Plantilla actualizada en modulo_definitions', data)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al actualizar plantilla'
        console.error('❌ Error:', errorMsg)
        setError(errorMsg)
        throw err
      }
    },
    []
  )

  const deletePlantilla = useCallback(async (id: string | number) => {
    try {
      console.log('🗑️ Eliminando plantilla de modulo_definitions (Supabase):', id)
      const { data, error } = await supabase.from('modulo_definitions').delete().eq('id', id)
      if (error) throw new Error(error.message)
      console.log('✅ Plantilla eliminada de modulo_definitions', data)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al eliminar plantilla'
      console.error('❌ Error:', errorMsg)
      setError(errorMsg)
      throw err
    }
  }, [])

  // ============================================
  // PROVIDER: Proporcionar datos a componentes
  // ============================================

  return (
    <DataContext.Provider
      value={{
        modulos,
        citas,
        plantillas,
        loading,
        error,
        addModulo,
        addModulosBatch,
        updateModulo,
        deleteModulo,
        addCita,
        updateCita,
        deleteCita,
        addPlantilla,
        updatePlantilla,
        deletePlantilla,
        refreshModulos,
        setVisibleRange: (startISO: string, endISO: string) => { setVisibleStart(startISO); setVisibleEnd(endISO) },
        activeProfesionalId,
        setActiveProfesional: (id?: string | null) => setActiveProfesionalId(id ?? null),
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

// ============================================
// 4️⃣ CREAR HOOK CUSTOM: useData()
// ============================================

/**
 * Hook: useData()
 * 
 * ¿Cómo se usa desde otros componentes?
 * 
 * import { useData } from '@/contexts/DataContext'
 * 
 * export function MiComponente() {
 *   const { modulos, addModulo } = useData()
 *   
 *   return <div>{modulos.length} módulos</div>
 * }
 */
export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error(
      '❌ useData() debe usarse dentro de <DataProvider>. ' +
      'Asegúrate de que el componente está envuelto por DataProvider en layout.tsx'
    )
  }
  return context
}
