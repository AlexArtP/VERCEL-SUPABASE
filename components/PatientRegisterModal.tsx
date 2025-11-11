"use client"

import { useState, useEffect } from "react";
import { useAddPaciente } from "../lib/hooks/useAddPaciente";
import { useFirestoreUsers } from "../lib/useFirestoreUsers";
import { formatearRun, validarRun, calculateAge } from "../lib/validators";
import type { Paciente } from "../types";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (p: Paciente) => void;
}

export function PatientRegisterModal({ open, onClose, onCreated }: Props) {
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [run, setRun] = useState("");
  const [email, setEmail] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [profesionales, setProfesionales] = useState<string[]>([]);

  const { addPaciente, loading, error } = useAddPaciente();
  const { usuarios } = useFirestoreUsers();
  const [localError, setLocalError] = useState<string | null>(null);

  if (!open) return null;

  // Filtrar usuarios que sean psicólogos, psiquiatras o asistentes sociales
  const tratantes = usuarios.filter((u) => {
    const rol = (u.rol || u.profesion || '').toLowerCase();
    return (
      rol.includes('psicolog') || 
      rol.includes('psiquiatr') || 
      rol.includes('asistente')
    );
  });

  // Agrupar tratantes por tipo
  const psicologos = tratantes.filter((u) => (u.rol || u.profesion || '').toLowerCase().includes('psicolog'));
  const psiquiatras = tratantes.filter((u) => (u.rol || u.profesion || '').toLowerCase().includes('psiquiatr'));
  const asistentes = tratantes.filter((u) => (u.rol || u.profesion || '').toLowerCase().includes('asistente'));

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLocalError(null);
    try {
      if (!nombre.trim()) return setLocalError('Nombre es obligatorio');
      if (run && !validarRun(run)) return setLocalError('RUN inválido');
      const formattedRun = run ? formatearRun(run) || undefined : undefined;

      const payload: any = {
        nombre: nombre.trim(),
        apellidos: apellidos.trim() || undefined,
        run: formattedRun,
        email: email.trim() || undefined,
        fechaNacimiento: fechaNacimiento || undefined,
        profesionales: profesionales.length > 0 ? profesionales : undefined,
      };

      const created = await addPaciente(payload);
      if (onCreated) onCreated(created);
      // reset form
      setNombre(""); setApellidos(""); setRun(""); setEmail(""); setFechaNacimiento(""); setProfesionales([]);
      onClose();
    } catch (err: any) {
      setLocalError(err?.message || String(err));
    }
  }

  const edad = fechaNacimiento ? calculateAge(fechaNacimiento) : undefined;

  const handleProfesionalToggle = (id: string) => {
    setProfesionales(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Registrar paciente</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Información básica */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Nombre *</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Apellidos</label>
              <input value={apellidos} onChange={(e) => setApellidos(e.target.value)} className="w-full border rounded p-2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">RUN</label>
              <input value={run} onChange={(e) => setRun(e.target.value)} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded p-2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Fecha de nacimiento</label>
            <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} className="w-full border rounded p-2" />
            {edad !== undefined && !Number.isNaN(edad) && <div className="text-sm text-gray-500">Edad estimada: {edad} años</div>}
          </div>

          {/* Tratantes */}
          <div className="border-t pt-3 mt-3">
            <label className="block text-sm font-medium mb-2">Tratantes</label>
            
            {psicologos.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">Psicólogos</p>
                <div className="space-y-2 pl-2">
                  {psicologos.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={profesionales.includes(p.id)}
                        onChange={() => handleProfesionalToggle(p.id)}
                        className="rounded"
                      />
                      <span>{p.nombre} {p.apellido_paterno || ''}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {psiquiatras.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">Psiquiatras</p>
                <div className="space-y-2 pl-2">
                  {psiquiatras.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={profesionales.includes(p.id)}
                        onChange={() => handleProfesionalToggle(p.id)}
                        className="rounded"
                      />
                      <span>{p.nombre} {p.apellido_paterno || ''}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {asistentes.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">Asistentes Sociales</p>
                <div className="space-y-2 pl-2">
                  {asistentes.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={profesionales.includes(p.id)}
                        onChange={() => handleProfesionalToggle(p.id)}
                        className="rounded"
                      />
                      <span>{p.nombre} {p.apellido_paterno || ''}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {tratantes.length === 0 && (
              <p className="text-xs text-gray-500 italic">No hay tratantes registrados</p>
            )}
          </div>

          {localError && <div className="text-sm text-red-600">{localError}</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex justify-end gap-2 border-t pt-3">
            <button type="button" onClick={onClose} className="px-3 py-1 border rounded">Cancelar</button>
            <button type="submit" disabled={loading} className="px-3 py-1 bg-blue-600 text-white rounded">{loading ? 'Guardando...' : 'Registrar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PatientRegisterModal;
