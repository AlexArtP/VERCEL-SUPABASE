import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import type { Modulo } from "../../types";

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

export function useSupabaseModulos(profesionalId?: string | null, startISO?: string, endISO?: string, refetchTrigger: number = 0) {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profesionalId || !startISO || !endISO) {
      setModulos([]);
      setLoading(false);
      return;
    }
    let isMounted = true;

    async function fetchModulos() {
      setLoading(true);
      console.log(`📊 [useSupabaseModulos] Fetching modulos para profesionalId=${profesionalId}, rango=${startISO} a ${endISO}`)
      
      try {
        // Usar el endpoint API para leer (service-role bypassa RLS)
        const params = new URLSearchParams({
          profesionalId: profesionalId || '',
          startDate: startISO || '',
          endDate: endISO || '',
        })
        
        const response = await fetch(`/api/modulos/fetch?${params}`)
        const result = await response.json()
        
        if (!isMounted) return
        
        if (!response.ok) {
          console.error(`❌ [useSupabaseModulos] Error fetching:`, result.error)
          setError(result.error);
          setModulos([]);
        } else {
          const data = result.data || []
          console.log(`✅ [useSupabaseModulos] Fetched ${data?.length ?? 0} modulos`)
          if (data && data.length > 0) {
            console.log(`  - Keys del primer item:`, Object.keys(data[0]))
            console.log(`  - Todos los items (resumen):`, data.map((d: any) => ({
              id: d.id ?? d.moduloid,
              profesional_id: d.profesional_id ?? d.profesionalid,
              fecha: d.fecha,
              hora_inicio: d.hora_inicio,
              hora_fin: d.hora_fin,
              tipo: d.tipo ?? d.nombre
            })))
          } else {
            console.log(`  ⚠️ Sin datos. Esto significa que la query no encontró coincidencias.`)
          }
          // Normalizar a la forma esperada por CalendarView (camelCase)
          const normalized: Modulo[] = (data as any[])
            .map((r: any) => {
              const id = String(r.id ?? r.moduloid ?? '')
              const profesionalId = String(r.profesional_id ?? r.profesionalid ?? r.profesionalId ?? '')
              const horaInicio = r.hora_inicio ?? r.horainicio ?? r.horaInicio
              const horaFin = r.hora_fin ?? r.horafin ?? r.horaFin
              const tipo = r.tipo ?? r.nombre ?? ''
              // ✅ El color viene desde modulo_definitions via el tipo (no de modulos directamente)
              const color = normalizeColor('#3b82f6') // Default, se actualizará con el JOIN
              const profesion = r.profesion ?? r.configuracion?.profesion
              const observaciones = r.observaciones ?? r.descripcion
              const profesionalNombre = r.profesional_nombre ?? r.profesionalNombre
              // Log defensivo si faltan horas (causa clásica de no renderizar en FullCalendar)
              if (!horaInicio || !horaFin) {
                console.warn('⚠️ [useSupabaseModulos] Registro sin horas válidas. Será ignorado por FullCalendar:', { id, fecha: r.fecha, hora_inicio: r.hora_inicio, hora_fin: r.hora_fin })
              }
              return {
                // conservar campos originales por compatibilidad/debug
                ...r,
                // sobrescribir con la forma canónica para la UI
                id,
                profesionalId,
                fecha: r.fecha,
                horaInicio,
                horaFin,
                tipo,
                color,
                profesion,
                observaciones,
                profesionalNombre,
              } as Modulo
            })
            // ✅ Filtrar módulos sin ID válido (evita pasar null/undefined al backend)
            .filter((m, idx) => {
              const isValid = m.id && m.id.trim() && m.id !== 'null' && m.id !== 'undefined'
              if (!isValid) {
                console.warn(`[useSupabaseModulos] Filtrando módulo inválido [${idx}]:`, { id: m.id, fecha: m.fecha, tipo: m.tipo })
              }
              return isValid
            })
          
          // 🔗 Obtener colores desde modulo_definitions usando el tipo
          try {
            const { data: definitions, error: defError } = await supabase
              .from('modulo_definitions')
              .select('tipo, color')
              .eq('profesionalId', profesionalId)
            
            if (!defError && definitions) {
              // Mapear color por tipo
              const colorByTipo = new Map(definitions.map((d: any) => [d.tipo, normalizeColor(d.color)]))
              // Actualizar módulos con el color correcto
              normalized.forEach((m) => {
                if (colorByTipo.has(m.tipo)) {
                  m.color = colorByTipo.get(m.tipo) || '#3b82f6'
                }
              })
              console.log(`✅ [useSupabaseModulos] Mapeados colores desde modulo_definitions:`, Object.fromEntries(colorByTipo))
            }
          } catch (colorErr) {
            console.warn('[useSupabaseModulos] Advertencia al obtener colores de modulo_definitions:', colorErr)
          }
          
          console.log(`✅ [useSupabaseModulos] Después de filtro: ${normalized.length} módulos válidos`)
          setModulos(normalized)
          setError(null);
        }
      } catch (err: any) {
        if (!isMounted) return
        console.error(`❌ [useSupabaseModulos] Exception:`, err.message)
        setError(err.message);
        setModulos([]);
      }
      setLoading(false);
    }

    fetchModulos();

    // Suscribirse a cambios en tiempo real (opcional, puede ser costoso)
    // Por ahora solo usamos la lectura inicial y el refetch trigger
    
    return () => {
      isMounted = false;
    };
  }, [profesionalId, startISO, endISO, refetchTrigger]);

  return { modulos, loading, error };
}
