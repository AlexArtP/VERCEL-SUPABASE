import type { Modulo } from "@/types"
import { Edit, Trash2 } from "lucide-react"

interface ModuloListModalProps {
  modulos: Modulo[]
  onClose: () => void
  onEdit: (modulo: Modulo) => void
  onDelete: (id: string) => void
}

export function ModuloListModal({ modulos, onClose, onEdit, onDelete }: ModuloListModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Todos los Módulos</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="sr-only">Cerrar</span>
            ×
          </button>
        </div>
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {modulos.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay módulos creados</p>
          ) : (
            modulos.map((modulo) => (
              <div key={modulo.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900">{modulo.profesionalNombre}</p>
                  <p className="text-xs text-gray-500">{modulo.tipo}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onEdit(modulo)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Editar">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(modulo.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
