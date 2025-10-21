import { useEffect, useRef } from 'react';
import { onSnapshot, query, collection, where, DocumentSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useNotifications } from '@/contexts/NotificationContext';

export interface Cita {
  id: string;
  profesionalId: string;
  pacienteNombre: string;
  tipo: string;
  fecha: string;
  hora: string;
  estado: string;
  notas?: string;
  createdAt?: number | string; // puede ser timestamp de Firebase o string ISO
  createdBy?: string;
}

/**
 * Hook que escucha nuevas citas creadas para el profesional actual
 * y genera notificaciones automáticas
 * @param profesionalId - ID del profesional actual
 * @param enabled - boolean para habilitar/deshabilitar el listener
 */
export function useAppointmentNotifications(profesionalId: string | null, enabled: boolean = true) {
  const { addNotification, removeNotification } = useNotifications();
  
  // Rastrear IDs de citas que ya hemos notificado
  const notifiedCitasRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (!profesionalId || !enabled) {
      console.log('⏭️  No hay profesionalId o notificaciones deshabilitadas');
      return;
    }

    console.log(`🔔 Iniciando listener de citas para profesional: ${profesionalId}`);

    let unsubscribe: (() => void) | null = null;

    try {
      // Query: obtener todas las citas del profesional
      // No usamos orderBy para evitar problemas con campos faltantes
      const q = query(
        collection(db, 'citas'),
        where('profesionalId', '==', profesionalId)
      );

      // Listener en tiempo real
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log(`📋 Snapshot recibido: ${snapshot.docs.length} citas para profesional`);

          // En el primer load, solo marcamos como vistas (no notificamos)
          if (isInitialLoadRef.current) {
            console.log('📦 Carga inicial: registrando citas existentes sin notificar');
            snapshot.docs.forEach((doc) => {
              notifiedCitasRef.current.add(doc.id);
            });
            isInitialLoadRef.current = false;
            return;
          }

          // Procesar cambios (agregadas, modificadas, removidas)
          snapshot.docChanges().forEach((change) => {
            const cita = change.doc.data() as Cita;
            const citaId = change.doc.id;

            if (change.type === 'added') {
              // Solo notificar si es realmente una cita nueva (no la hemos visto antes)
              if (!notifiedCitasRef.current.has(citaId)) {
                console.log(`✅ Nueva cita creada: ${cita.pacienteNombre} - ${cita.hora}`);

                // Crear notificación
                const notification = {
                  type: 'info' as const,
                  title: '📅 Nueva cita programada',
                  message: `${cita.pacienteNombre} tiene una cita ${cita.tipo} el ${cita.fecha} a las ${cita.hora}`,
                  data: {
                    citaId,
                    pacienteNombre: cita.pacienteNombre,
                    fecha: cita.fecha,
                    hora: cita.hora,
                    tipo: cita.tipo,
                  },
                };

                addNotification(notification);
                notifiedCitasRef.current.add(citaId);
              }
            } else if (change.type === 'modified') {
              console.log(`🔄 Cita modificada: ${citaId}`);
              // Podrías agregar notificaciones de cambios de citas aquí
            } else if (change.type === 'removed') {
              console.log(`🗑️  Cita eliminada: ${citaId}`);
              notifiedCitasRef.current.delete(citaId);
            }
          });
        },
        (error) => {
          console.error('❌ Error escuchando citas:', error);
        }
      );
    } catch (error) {
      console.error('❌ Error configurando listener de citas:', error);
    }

    // Cleanup: remover listener al desmontar
    return () => {
      console.log('🛑 Deteniendo listener de citas');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [profesionalId, enabled, addNotification, removeNotification]);
}
