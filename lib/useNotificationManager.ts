import { useEffect, useCallback } from 'react';
import { onSnapshot, query, collection, where, DocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useNotifications } from '@/contexts/NotificationContext';

export interface SolicitudRegistro {
  id: string;
  email: string;
  nombre: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  run?: string;
  telefono?: string;
  fechaRegistro?: string;
  rol?: string;
}

/**
 * Hook que escucha solicitudes de registro pendientes en Firestore
 * y genera notificaciones automáticas para administradores
 * @param isAdmin - boolean para saber si el usuario actual es admin
 */
export function useNotificationManager(isAdmin: boolean) {
  const { addNotification, removeNotification } = useNotifications();

  // Rastrear IDs de notificaciones para cada solicitud
  // para poder eliminarlas cuando la solicitud cambie de estado
  const notificationMapRef = new Map<string, string>();

  useEffect(() => {
    if (!isAdmin) {
      console.log('⏭️  Usuario no es admin, no escuchando solicitudes');
      return;
    }

    console.log('🔔 Iniciando listener de solicitudes pendientes...');

    let unsubscribe: (() => void) | null = null;

    try {
      // Query: obtener todas las solicitudes con estado 'pendiente'
      const q = query(
        collection(db, 'solicitudRegistro'),
        where('estado', '==', 'pendiente')
      );

      // Listener en tiempo real
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log(`📋 Snapshot recibido: ${snapshot.docs.length} solicitudes pendientes`);

          // Procesar cambios (agregadas, modificadas, removidas)
          snapshot.docChanges().forEach((change) => {
            const solicitud = change.doc.data() as SolicitudRegistro;
            const solicitudId = change.doc.id;
            const nombreCompleto = `${solicitud.nombre} ${solicitud.apellidoPaterno || ''} ${solicitud.apellidoMaterno || ''}`.trim();

            if (change.type === 'added') {
              console.log(`✅ Nueva solicitud pendiente: ${nombreCompleto}`);

              // Crear notificación
              const notifId = `solicitud_${solicitudId}`;
              const notification = {
                type: 'solicitud' as const,
                title: '📝 Nueva solicitud de registro',
                message: `${nombreCompleto} desea registrarse en el sistema.`,
                data: {
                  solicitudId,
                  email: solicitud.email,
                  nombre: nombreCompleto,
                },
              };

              addNotification(notification);
              notificationMapRef.set(solicitudId, notifId);
            } else if (change.type === 'modified') {
              // Si una solicitud cambió de estado (aprobada/rechazada)
              // eliminar la notificación asociada
              if (solicitud.estado !== 'pendiente') {
                console.log(`🗑️  Solicitud ${solicitudId} ya no está pendiente, limpiando notificación`);
                const notifId = notificationMapRef.get(solicitudId);
                if (notifId) {
                  removeNotification(notifId);
                  notificationMapRef.delete(solicitudId);
                }
              }
            } else if (change.type === 'removed') {
              // Si se elimina una solicitud, remover notificación
              console.log(`🗑️  Solicitud ${solicitudId} eliminada`);
              const notifId = notificationMapRef.get(solicitudId);
              if (notifId) {
                removeNotification(notifId);
                notificationMapRef.delete(solicitudId);
              }
            }
          });
        },
        (error) => {
          console.error('❌ Error escuchando solicitudes:', error);
        }
      );
    } catch (error) {
      console.error('❌ Error configurando listener:', error);
    }

    // Cleanup: remover listener al desmontar o cambiar isAdmin
    return () => {
      console.log('🛑 Deteniendo listener de solicitudes');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isAdmin, addNotification, removeNotification]);
}
