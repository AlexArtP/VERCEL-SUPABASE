import { useEffect, useState } from "react"
import { supabase } from "../supabaseClient"
import type { PlantillaModulo } from "../demoData"

export function useSupabasePlantillas() {
  const [plantillas, setPlantillas] = useState<PlantillaModulo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Evitar errores de WebSocket en local si no hay Realtime disponible
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const realtimeDisabledByUrl = /localhost|127\.0\.0\.1/.test(SUPABASE_URL)
  const realtimeDisabledByFlag = (process.env.NEXT_PUBLIC_SUPABASE_REALTIME || "").toLowerCase() === "off"
  const shouldSubscribeRealtime = !(realtimeDisabledByUrl || realtimeDisabledByFlag)

  useEffect(() => {
    let isMounted = true

    async function fetchPlantillas() {
      setLoading(true)
      const { data, error } = await supabase
        .from("modulo_definitions")
        .select("*")
        .order("created_at", { ascending: false })

      if (!isMounted) return
      if (error) {
        setError(error.message)
        setPlantillas([])
      } else {
        const mapped: PlantillaModulo[] = (data as any[]).map((r) => ({
          id: Number(r.id),
          tipo: r.tipo ?? r.nombre ?? "",
          duracion: Number(r.duracion ?? 0),
          profesion: r.profesion ?? r.estamento ?? "",
          color: r.color ?? "#3498db",
          observaciones: r.observaciones ?? "",
          // Puede venir como profesionalId o profesional_id, o no existir (global)
          profesionalId: Number(r.profesionalId ?? r.profesional_id ?? 0),
          ...r,
        }))
        setPlantillas(mapped)
        setError(null)
      }
      setLoading(false)
    }

    fetchPlantillas()

    let channel: ReturnType<typeof supabase.channel> | null = null
    if (shouldSubscribeRealtime) {
      channel = supabase
        .channel("public:modulo_definitions")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "modulo_definitions" },
          () => {
            fetchPlantillas()
          }
        )
        .subscribe()
    } else {
      const interval = setInterval(() => {
        fetchPlantillas()
      }, 15000)
      ;(fetchPlantillas as any).__poller = interval
    }

    return () => {
      isMounted = false
      try {
        if (shouldSubscribeRealtime && channel) {
          void supabase.removeChannel(channel)
        } else if ((fetchPlantillas as any).__poller) {
          clearInterval((fetchPlantillas as any).__poller)
        }
      } catch {
        // ignore
      }
    }
  }, [])

  return { plantillas, loading, error } as const
}
