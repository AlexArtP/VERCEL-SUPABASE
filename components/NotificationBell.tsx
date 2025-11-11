'use client';

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';

interface NotificationBellProps {
  onApproveSolicitud?: (solicitudId: string) => Promise<void>;
  onRejectSolicitud?: (solicitudId: string) => Promise<void>;
}

export function NotificationBell({
  onApproveSolicitud,
  onRejectSolicitud,
}: NotificationBellProps) {
  const { unreadCount } = useNotifications();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleTogglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  return (
    <div className="relative">
      {/* Campanita */}
      <button
        onClick={handleTogglePanel}
        className="relative p-2 text-white hover:text-indigo-100 hover:bg-indigo-500 rounded-lg transition-colors"
        title="Notificaciones"
        aria-label="Abrir notificaciones"
      >
        <Bell className="w-6 h-6" />

        {/* Badge de contador */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel deslizable */}
      {/* Panel deslizable */}
      {isPanelOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg border z-50">
          <div className="flex items-center justify-between p-3 border-b">
            <span className="font-medium">Notificaciones</span>
            <button
              onClick={() => setIsPanelOpen(false)}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Cerrar"
              title="Cerrar"
            >
              ×
            </button>
          </div>
          <div className="p-4 text-sm text-gray-500">
            No hay notificaciones.
          </div>
        </div>
      )}
    </div>
  );
}
