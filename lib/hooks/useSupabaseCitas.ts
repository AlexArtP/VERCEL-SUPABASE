import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import type { Cita } from "../../types";

export function useSupabaseCitas(profesionalId?: string | null, refetchTrigger?: number) {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profesionalId) {
      setCitas([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchCitas() {
      setLoading(true);
      // Usar columnas correctas de la tabla citas
      const { data, error } = await supabase
        .from("citas")
        .select("id, profesional_id, paciente_id, modulo_id, fecha, hora_inicio, hora_fin, estado, paciente_nombre_cache, observaciones, tipocita")
        .eq("profesional_id", profesionalId)
        .order("fecha", { ascending: true });

      if (!isMounted) return;
      if (error) {
        setError(error.message);
        setCitas([]);
      } else {
        setCitas((data as any[]).map((r) => ({
          id: r.id,
          pacienteId: r.paciente_id,
          profesionalId: r.profesional_id,
          moduloId: r.modulo_id,
          fecha: r.fecha,
          hora: r.hora_inicio,
          horaFin: r.hora_fin,
          estado: r.estado,
          pacienteNombre: r.paciente_nombre_cache,
          observacion: r.observaciones,
          tipo: r.tipocita || 'Control',
          ...r,
        })));
        setError(null);
      }
      setLoading(false);
    }

    fetchCitas();

    const channel = supabase
      .channel(`public:citas_${profesionalId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "citas", filter: `profesional_id=eq.${profesionalId}` },
        () => {
          fetchCitas();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      try {
        void supabase.removeChannel(channel);
      } catch (e) {
        // ignore errors
      }
    };
  }, [profesionalId, refetchTrigger]);

  return { citas, loading, error } as const;
}
