'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface Usuario {
  id: string;
  nombre: string;
  apellidos?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  email: string;
  telefono?: string;
  run?: string;
  profesion?: string;
  rol: string;
  esAdmin: boolean;
  activo: boolean;
}

interface EditUserModalProps {
  isOpen: boolean;
  usuario: Usuario | null;
  onClose: () => void;
  onSave: (userId: string, updates: Partial<Usuario>) => Promise<void>;
}

export function EditUserModal({
  isOpen,
  usuario,
  onClose,
  onSave,
}: EditUserModalProps) {
  const [formData, setFormData] = useState<Partial<Usuario>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (usuario) {
      setFormData({
        nombre: usuario.nombre,
        apellidoPaterno: usuario.apellidoPaterno,
        apellidoMaterno: usuario.apellidoMaterno,
        email: usuario.email,
        telefono: usuario.telefono,
        run: usuario.run,
        profesion: usuario.profesion,
        rol: usuario.rol,
        esAdmin: usuario.esAdmin,
        activo: usuario.activo,
      });
      setError(null);
      setSuccess(false);
    }
  }, [usuario, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    setError(null);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validaciones básicas
    if (!formData.nombre || !formData.email) {
      setError('Nombre y email son requeridos');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Email inválido');
      return;
    }

    setLoading(true);

    try {
      if (usuario?.id) {
        await onSave(usuario.id, formData);
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar los cambios');
    } finally {
      setLoading(false);
    }
  };

  if (!usuario) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>
            Actualiza la información del usuario: {usuario.nombre}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Nombre *
            </label>
            <Input
              type="text"
              name="nombre"
              value={formData.nombre || ''}
              onChange={handleInputChange}
              placeholder="Nombre"
              disabled={loading}
            />
          </div>

          {/* Apellidos */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Apellido Paterno
              </label>
              <Input
                type="text"
                name="apellidoPaterno"
                value={formData.apellidoPaterno || ''}
                onChange={handleInputChange}
                placeholder="Apellido paterno"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Apellido Materno
              </label>
              <Input
                type="text"
                name="apellidoMaterno"
                value={formData.apellidoMaterno || ''}
                onChange={handleInputChange}
                placeholder="Apellido materno"
                disabled={loading}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Email *
            </label>
            <Input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleInputChange}
              placeholder="correo@ejemplo.com"
              disabled={loading}
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Teléfono
            </label>
            <Input
              type="tel"
              name="telefono"
              value={formData.telefono || ''}
              onChange={handleInputChange}
              placeholder="+56 9 1234 5678"
              disabled={loading}
            />
          </div>

          {/* RUN */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              RUN
            </label>
            <Input
              type="text"
              name="run"
              value={formData.run || ''}
              onChange={handleInputChange}
              placeholder="12.345.678-9"
              disabled={loading}
            />
          </div>

          {/* Profesión */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Profesión
            </label>
            <Input
              type="text"
              name="profesion"
              value={formData.profesion || ''}
              onChange={handleInputChange}
              placeholder="Ej: Psicólogo, Médico"
              disabled={loading}
            />
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Rol
            </label>
            <select
              name="rol"
              value={formData.rol || 'profesional'}
              onChange={handleInputChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="profesional">Profesional</option>
              <option value="administrativo">Administrativo</option>
              <option value="recepcionista">Recepcionista</option>
              <option value="otros">Otros</option>
            </select>
          </div>

          {/* Admin */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            {(() => {
              let currentUserId: string | null = null
              try {
                const raw = typeof window !== 'undefined' ? localStorage.getItem('sistema_auth_token') : null
                if (raw) {
                  try {
                    const parsed = JSON.parse(raw as string)
                    currentUserId = parsed.userId || parsed.id || null
                  } catch {}
                }
                if (!currentUserId && typeof window !== 'undefined') {
                  currentUserId = localStorage.getItem('usuario_id')
                }
              } catch {}
              const isSelf = String(usuario.id) === String(currentUserId)
              return (
                <>
                  <input
                    type="checkbox"
                    id="esAdmin"
                    name="esAdmin"
                    checked={formData.esAdmin || false}
                    onChange={handleCheckboxChange}
                    disabled={loading || isSelf}
                    title={isSelf ? 'No puedes quitarte tu propio permiso de administrador' : ''}
                    className="w-4 h-4 text-blue-600 rounded disabled:opacity-50"
                  />
                  <label htmlFor="esAdmin" className="text-sm font-medium text-gray-900 cursor-pointer">
                    Es Administrador
                  </label>
                </>
              )
            })()}
          </div>

          {/* Activo */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            {(() => {
              // Deshabilitar la auto-desactivación cuando se edita el propio usuario
              let currentUserId: string | null = null
              try {
                const raw = typeof window !== 'undefined' ? localStorage.getItem('sistema_auth_token') : null
                if (raw) {
                  try {
                    const parsed = JSON.parse(raw as string)
                    currentUserId = parsed.userId || parsed.id || null
                  } catch {}
                }
                if (!currentUserId && typeof window !== 'undefined') {
                  currentUserId = localStorage.getItem('usuario_id')
                }
              } catch {}
              const isSelf = usuario && String(usuario.id) === String(currentUserId)
              return (
                <>
                  <input
                    type="checkbox"
                    id="activo"
                    name="activo"
                    checked={formData.activo !== false}
                    onChange={handleCheckboxChange}
                    disabled={loading || isSelf}
                    title={isSelf ? 'No puedes desactivar tu propia cuenta' : ''}
                    className="w-4 h-4 text-green-600 rounded disabled:opacity-50"
                  />
                  <label htmlFor="activo" className="text-sm font-medium text-gray-900 cursor-pointer">
                    Usuario Activo
                  </label>
                </>
              )
            })()}
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ¡Cambios guardados exitosamente!
              </AlertDescription>
            </Alert>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
