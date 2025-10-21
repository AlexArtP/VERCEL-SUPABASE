'use client';

import React, { useState } from 'react';
import { X, Check, XCircle, AlertCircle } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';

interface NotificationPanelProps {
  onClose: () => void;
  onApproveSolicitud?: (solicitudId: string) => Promise<void>;
  onRejectSolicitud?: (solicitudId: string) => Promise<void>;
}

export function NotificationPanel({
  onClose,
  onApproveSolicitud,
  onRejectSolicitud,
}: NotificationPanelProps) {
  const { notifications, markAsRead, markAllAsRead, clearAll, removeNotification } =
    useNotifications();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleRemove = (id: string) => {
    removeNotification(id);
  };

  const handleApproveSolicitud = async (notifId: string, solicitudId: string) => {
    if (!onApproveSolicitud) return;
    try {
      setLoadingId(notifId);
      await onApproveSolicitud(solicitudId);
      // La notificación se eliminará automáticamente cuando el listener
      // detecte que la solicitud cambió de estado
    } catch (error) {
      console.error('Error aprobando solicitud:', error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleRejectSolicitud = async (notifId: string, solicitudId: string) => {
    if (!onRejectSolicitud) return;
    try {
      setLoadingId(notifId);
      await onRejectSolicitud(solicitudId);
      // La notificación se eliminará automáticamente cuando el listener
      // detecte que la solicitud cambió de estado
    } catch (error) {
      console.error('Error rechazando solicitud:', error);
    } finally {
      setLoadingId(null);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'solicitud':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'cita':
        return <AlertCircle className="w-5 h-5 text-purple-500" />;
      case 'success':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationBgColor = (type: string, read: boolean) => {
    if (read) return 'bg-white';
    switch (type) {
      case 'solicitud':
        return 'bg-blue-50';
      case 'cita':
        return 'bg-purple-50';
      default:
        return 'bg-blue-50';
    }
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 animate-in slide-in-from-right">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-bold text-gray-900">Notificaciones</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
          aria-label="Cerrar panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2 p-3 border-b border-gray-200 bg-white">
        <Button
          onClick={markAllAsRead}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          Marcar todo como leído
        </Button>
        <Button
          onClick={clearAll}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          Limpiar todo
        </Button>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex items-center justify-center h-full p-4">
            <p className="text-center text-gray-500">
              No hay notificaciones
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 transition-colors hover:bg-gray-50 ${getNotificationBgColor(
                  notif.type,
                  notif.read
                )}`}
              >
                {/* Notification Header */}
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notif.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">
                          {notif.title}
                        </p>
                        <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemove(notif.id)}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Remover notificación"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Timestamp */}
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notif.timestamp).toLocaleString('es-CL')}
                    </p>

                    {/* Actions para notificaciones de solicitud */}
                    {notif.type === 'solicitud' && notif.data?.solicitudId && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          onClick={() =>
                            handleApproveSolicitud(notif.id, notif.data.solicitudId)
                          }
                          disabled={loadingId === notif.id}
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {loadingId === notif.id ? '...' : 'Aprobar'}
                        </Button>
                        <Button
                          onClick={() =>
                            handleRejectSolicitud(notif.id, notif.data.solicitudId)
                          }
                          disabled={loadingId === notif.id}
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          {loadingId === notif.id ? '...' : 'Rechazar'}
                        </Button>
                      </div>
                    )}

                    {/* Detalles adicionales para notificaciones de citas */}
                    {notif.type === 'cita' && notif.data && (
                      <div className="mt-3 p-3 bg-purple-100 rounded-lg border border-purple-200">
                        <p className="text-xs font-semibold text-purple-900 mb-2">Detalles de la cita:</p>
                        <ul className="text-xs text-purple-800 space-y-1">
                          <li>📅 <strong>Fecha:</strong> {notif.data.fecha}</li>
                          <li>⏰ <strong>Hora:</strong> {notif.data.hora}</li>
                          <li>🔍 <strong>Tipo:</strong> {notif.data.tipo}</li>
                          <li>👤 <strong>Paciente:</strong> {notif.data.pacienteNombre}</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Read indicator */}
                {!notif.read && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Marcar como leído
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
