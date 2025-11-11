import { useEffect, useState } from "react";

export function useSupabaseUsuarios() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchUsuarios() {
      setLoading(true);
      try {
        const response = await fetch('/api/usuarios');
        if (!isMounted) return;
        
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Error al cargar usuarios');
          setUsuarios([]);
          return;
        }

        const { data } = await response.json();
        if (Array.isArray(data)) {
          // Normalizar datos: snake_case → camelCase
          setUsuarios(data.map((r: any) => {
            // Combinar apellido_paterno y apellido_materno
            const apellidos = [r.apellido_paterno, r.apellido_materno]
              .filter(Boolean)
              .join(' ')
              .trim() || null;
            
            return {
              id: r.userid,  // Mapear userid a id para compatibilidad
              userid: r.userid,
              nombre: r.nombre,
              apellidos: apellidos,
              apellido_paterno: r.apellido_paterno || null,
              apellido_materno: r.apellido_materno || null,
              run: r.run || null,
              email: r.email || null,
              telefono: r.telefono || null,
              rol: r.rol || 'profesional',
              esadmin: r.esadmin || false,
              profesion: r.profesion || null,
              activo: r.activo !== false,
              estado: r.estado || 'aprobado',
              ...r,
            };
          }));
          setError(null);
        } else {
          setError('Formato de respuesta inválido');
          setUsuarios([]);
        }
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        setUsuarios([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchUsuarios();

    return () => {
      isMounted = false;
    };
  }, []);

  // Función para refrescar la lista de usuarios
  const refetchUsuarios = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/usuarios');
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Error al cargar usuarios');
        return;
      }

      const { data } = await response.json();
      if (Array.isArray(data)) {
        setUsuarios(data.map((r: any) => {
          const apellidos = [r.apellido_paterno, r.apellido_materno]
            .filter(Boolean)
            .join(' ')
            .trim() || null;
          
          return {
            id: r.userid,
            userid: r.userid,
            nombre: r.nombre,
            apellidos: apellidos,
            apellido_paterno: r.apellido_paterno || null,
            apellido_materno: r.apellido_materno || null,
            run: r.run || null,
            email: r.email || null,
            telefono: r.telefono || null,
            rol: r.rol || 'profesional',
            esadmin: r.esadmin || false,
            profesion: r.profesion || null,
            activo: r.activo !== false,
            estado: r.estado || 'aprobado',
            ...r,
          };
        }));
        setError(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return { usuarios, loading, error, refetchUsuarios };
}
