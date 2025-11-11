import { useState } from "react";
import { supabase } from "../supabaseClient";
import type { Cita } from "../../types";

export function useMoverCita() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function moverCita(citaId: string, updates: Partial<Cita>) {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('citas')
        .update({
          fecha: updates.fecha,
          hora: updates.hora,
          modulo_id: updates.moduloId,
          paciente_id: updates.pacienteId,
          estado: updates.estado,
        })
        .eq('id', citaId)
        .select()
        .single();

      if (error) throw error;
      setLoading(false);
      return data as Cita;
    } catch (err: any) {
      setError(err?.message || String(err));
      setLoading(false);
      throw err;
    }
  }

  return { moverCita, loading, error } as const;
}
