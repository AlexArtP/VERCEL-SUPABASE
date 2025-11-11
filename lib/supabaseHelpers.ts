import supabase from './supabaseClient'

/**
 * Helpers para migración: funciones que replican el comportamiento de
 * `lib/firebaseConfig.ts` pero consultando la tabla de Supabase/Postgres.
 *
 * Estas funciones devuelven arreglos de objetos con forma similar a los
 * que antes devolvía Firestore (campo `id` y resto de propiedades).
 */

// ✅ Función para normalizar colores a formato hex
function normalizeColor(color: any): string {
  if (!color) return '#3b82f6'; // Color por defecto: azul
  
  // Si ya es un hex válido (#RRGGBB), devolvelo
  if (typeof color === 'string' && /^#[0-9A-F]{6}$/i.test(color)) {
    return color;
  }
  
  // Si es RGB separado por espacios: "85 243 18" → "85,243,18" → "#55F312"
  if (typeof color === 'string') {
    // Limpiar espacios
    const cleaned = color.trim();
    
    // Formato RGB separado por espacios: "85 243 18"
    if (/^\d+\s+\d+\s+\d+$/.test(cleaned)) {
      const rgb = cleaned.split(/\s+/).map(Number);
      if (rgb.length === 3 && rgb.every(v => v >= 0 && v <= 255)) {
        const hex = rgb.map(x => x.toString(16).padStart(2, '0').toUpperCase()).join('');
        return `#${hex}`;
      }
    }
    
    // Formato RGB separado por comas: "85, 243, 18" o "85,243,18"
    if (/^\d+\s*,\s*\d+\s*,\s*\d+$/.test(cleaned)) {
      const rgb = cleaned.split(',').map(x => parseInt(x.trim(), 10));
      if (rgb.length === 3 && rgb.every(v => v >= 0 && v <= 255)) {
        const hex = rgb.map(x => x.toString(16).padStart(2, '0').toUpperCase()).join('');
        return `#${hex}`;
      }
    }
    
    // Si ya tiene formato #, devolvelo como está (aunque sea inválido, intentamos)
    if (cleaned.startsWith('#')) {
      return cleaned;
    }
  }
  
  // Color por defecto si no se puede parsear
  return '#3b82f6';
}

export async function getWeekModules(
  profesionalId: string | number,
  startISO: string,
  endISO: string
) {
  try {
    const { data, error } = await supabase
      .from('modulos')
      .select('*')
      .eq('profesionalid', String(profesionalId))
      .gte('fecha', startISO)
      .lte('fecha', endISO)
      .order('fecha', { ascending: true })
      .order('nombre', { ascending: true })

    if (error) {
      console.error('❌ supabaseHelpers.getWeekModules error:', error)
      return []
    }

    // ✅ Filtrar módulos sin ID válido y normalizar
    const result = (data || [])
      .map((r: any) => {
        const id = String(r.id ?? r.moduloid ?? '')
        const profesionalId = String(r.profesional_id ?? r.profesionalid ?? '')
        const tipo = r.tipo ?? r.nombre ?? '' // Usar tipo si existe, senó nombre
        const color = normalizeColor('#3b82f6') // Default, se actualizará desde modulo_definitions
        return {
          id,
          profesionalId,
          fecha: r.fecha,
          horaInicio: r.hora_inicio || r.horainicio,
          horaFin: r.hora_fin || r.horafin,
          nombre: r.nombre,
          tipo,
          descripcion: r.descripcion,
          color,
          configuracion: r.configuracion,
          ...r,
        }
      })
      .filter((m: any) => {
        const isValid = m.id && String(m.id).trim() && String(m.id).toLowerCase() !== 'null'
        if (!isValid) {
          console.warn('[getWeekModules] Filtrando módulo inválido:', { id: m.id, nombre: m.nombre });
        }
        return isValid
      })
    
    // 🔗 Obtener colores desde modulo_definitions
    try {
      const { data: definitions, error: defError } = await supabase
        .from('modulo_definitions')
        .select('tipo, color')
        .eq('profesionalId', profesionalId)
      
      if (!defError && definitions) {
        const colorByTipo = new Map(definitions.map((d: any) => [d.tipo, normalizeColor(d.color)]))
        result.forEach((m: any) => {
          if (colorByTipo.has(m.tipo)) {
            m.color = colorByTipo.get(m.tipo) || '#3b82f6'
          }
        })
      }
    } catch (colorErr) {
      console.warn('[getWeekModules] Advertencia al obtener colores:', colorErr)
    }
    
    console.log(`[getWeekModules] ${data?.length || 0} datos brutos → ${result.length} módulos válidos para ${startISO} a ${endISO}`);
    return result
  } catch (e) {
    console.error('❌ supabaseHelpers.getWeekModules exception:', e)
    return []
  }
}

export async function getWeekCitas(
  profesionalId: string | number,
  startISO: string,
  endISO: string
) {
  try {
    const { data, error } = await supabase
      .from('citas')
      .select('*')
      .eq('profesionalid', String(profesionalId))
      .gte('fecha', startISO)
      .lte('fecha', endISO)
      .order('fecha', { ascending: true })

    if (error) {
      console.error('❌ supabaseHelpers.getWeekCitas error:', error)
      return []
    }

    return (data || []).map((r: any) => ({
      id: r.citaid,
      profesionalId: r.profesionalid,
      pacienteId: r.pacienteid,
      fecha: r.fecha,
      duracion: r.duracionminutos,
      tipo: r.tipocita,
      estado: r.estado,
      motivo: r.motivo,
      observaciones: r.observaciones,
      ...r,
    }))
  } catch (e) {
    console.error('❌ supabaseHelpers.getWeekCitas exception:', e)
    return []
  }
}

export async function updateUserProfile(userId: string, updates: Record<string, any>) {
  try {
    // Intentamos upsert para mantener comportamiento "merge" (si existe, actualiza)
    const payload = { id: userId, ...updates }
    const { error } = await supabase.from('users').upsert(payload)
    if (error) {
      console.error('❌ supabaseHelpers.updateUserProfile error:', error)
      throw error
    }
    return true
  } catch (e) {
    console.error('❌ supabaseHelpers.updateUserProfile exception:', e)
    throw e
  }
}

export default {
  getWeekModules,
  getWeekCitas,
  updateUserProfile,
}
