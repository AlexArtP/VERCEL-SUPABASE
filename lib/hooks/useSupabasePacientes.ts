import { useEffect, useState } from "react";
import type { Paciente } from "../../types";

export function useSupabasePacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchPacientes() {
      setLoading(true);
      try {
        const response = await fetch('/api/pacientes/list');
        if (!isMounted) return;
        
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Error al cargar pacientes');
          setPacientes([]);
          return;
        }

        const { data } = await response.json();
        if (Array.isArray(data)) {
          // Normalizar datos: snake_case → camelCase
          setPacientes(data.map((r) => {
            // Combinar apellido_paterno y apellido_materno en un campo apellidos
            const apellidos = [r.apellido_paterno, r.apellido_materno]
              .filter(Boolean)
              .join(' ')
              .trim() || null;
            
            return {
              id: r.id,
              nombre: r.nombre,
              apellidos: apellidos,
              apellidoPaterno: r.apellido_paterno || null,
              apellidoMaterno: r.apellido_materno || null,
              run: r.run || null,
              fechaNacimiento: r.fecha_nacimiento || null,
              edad: r.edad || null,
              email: r.email || null,
              telefono: r.telefono || null,
              psicologo_id: r.psicologo_id || null,
              psiquiatra_id: r.psiquiatra_id || null,
              asistente_social_id: r.asistente_social_id || null,
              ...r,
            };
          }));
          setError(null);
        } else {
          setError('Respuesta inválida del servidor');
          setPacientes([]);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error desconocido');
          setPacientes([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchPacientes();
    
    // Polling cada 30 segundos para mantener datos sincronizados
    const interval = setInterval(fetchPacientes, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { pacientes, loading, error } as const;
}
