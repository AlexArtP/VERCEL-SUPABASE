import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import type { Profesional } from "../../types";

export function useSupabaseProfesionales() {
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Evitar errores de WebSocket cuando la URL de Supabase apunta a localhost/127.0.0.1 sin Realtime
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const realtimeDisabledByUrl = /localhost|127\.0\.0\.1/.test(SUPABASE_URL)
  const realtimeDisabledByFlag = (process.env.NEXT_PUBLIC_SUPABASE_REALTIME || '').toLowerCase() === 'off'
  const shouldSubscribeRealtime = !(realtimeDisabledByUrl || realtimeDisabledByFlag)

  useEffect(() => {
    let isMounted = true;

    async function fetchProfesionales() {
      setLoading(true);
      // ✅ SELECT minimalista - solo campos básicos
      // Sin order by para evitar errores
      const { data, error } = await supabase
        .from("usuarios")
        .select("*");

      if (!isMounted) return;
      if (error) {
        setError(error.message);
        setProfesionales([]);
      } else {
        // Filtrar por nombre para ordenar en cliente
        const sorted = (data as any[])?.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
        
        setProfesionales(sorted?.map((r) => ({
          id: r.userid,
          nombre: r.nombre,
          apellidos: [r.apellido_paterno, r.apellido_materno].filter(Boolean).join(' ') || undefined,
          email: r.email,
          telefono: r.telefono,
          profesion: r.profesion,
          rol: r.rol,
          profesional: !!r.profesional,
          esAdmin: !!r.esadmin,
          fotoperfil: r.fotoperfil,
          fechacreacion: r.fechacreacion,
          // Campos opcionales (pueden no existir en BD)
          agendaDisabled: r.agenda_disabled ? !!r.agenda_disabled : false,
          agendaDisabledReason: r.agenda_disabled_reason || null,
          run: r.run || null,
          estado: r.estado || null,
          activo: r.activo !== undefined ? !!r.activo : true,
          ...r,
        })));
        setError(null);
      }
      setLoading(false);
    }

    fetchProfesionales();

    let channel: ReturnType<typeof supabase.channel> | null = null
    if (shouldSubscribeRealtime) {
      channel = supabase
        .channel("public:usuarios_profesionales")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "usuarios", filter: `profesional=eq.true` },
          () => {
            // simple refetch on changes
            fetchProfesionales();
          }
        )
        .subscribe();
    } else {
      // Como alternativa mínima, hacer un refetch periódico liviano
      const interval = setInterval(() => {
        fetchProfesionales();
      }, 15000);
      // Guardar limpiador en propiedad del efecto
      (fetchProfesionales as any).__poller = interval
    }

    return () => {
      isMounted = false;
      try {
        if (shouldSubscribeRealtime && channel) {
          void supabase.removeChannel(channel);
        } else if ((fetchProfesionales as any).__poller) {
          clearInterval((fetchProfesionales as any).__poller)
        }
      } catch (e) {
        // ignore
      }
    };
  }, []);

  return { profesionales, loading, error } as const;
}
