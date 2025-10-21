"use client"

import { useState } from "react"
import { X, Plus, Trash2, Edit } from "lucide-react"
import type { PlantillaModulo, Modulo } from "@/lib/demoData"

interface PlantillaListModalProps {
  plantillas: PlantillaModulo[]
  modulos: Modulo[] // Para saber cuántas instancias hay de cada plantilla
  onClose: () => void
  onEdit: (plantilla: PlantillaModulo) => void
  onDelete: (plantillaId: number) => void
}

export function PlantillaListModal({
  plantillas,
  modulos,
  onClose,
  onEdit,
  onDelete,
}: PlantillaListModalProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  // Contar instancias por plantilla
  const getInstanceCount = (plantillaId: number) => {
    return modulos.filter((m) => m.plantillaId === plantillaId).length
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Gestionar Módulos</h3>
            <p className="text-sm text-gray-500 mt-1">
              Plantillas de prestación creadas para este profesional. Edita duración, color o detalles.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de plantillas */}
        <div className="space-y-2">
          {plantillas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay plantillas de módulo. Crea la primera en "Crear Módulo".</p>
            </div>
          ) : (
            plantillas.map((plantilla) => {
              const instanceCount = getInstanceCount(plantilla.id)
              const isExpanded = expandedId === plantilla.id
              const isDeleting = confirmDelete === plantilla.id

              return (
                <div key={plantilla.id} className="border rounded-lg overflow-hidden">
                  {/* Header - clickeable */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : plantilla.id)}
                    className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 cursor-pointer hover:from-gray-100 hover:to-gray-150 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{plantilla.tipo}</h4>
                      <div className="flex gap-4 mt-1 text-sm text-gray-600">
                        <span>⏱ {plantilla.duracion} min</span>
                        <span>📋 {plantilla.estamento}</span>
                        <span className="text-blue-600 font-medium">
                          {instanceCount} instancia{instanceCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div
                      className="w-8 h-8 rounded mr-2"
                      style={{ backgroundColor: plantilla.color }}
                      title={`Color: ${plantilla.color}`}
                    ></div>
                  </div>

                  {/* Contenido expandido */}
                  {isExpanded && (
                    <div className="bg-white border-t p-4 space-y-4">
                      {/* Detalles */}
                      {plantilla.observaciones && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Observaciones:</label>
                          <p className="text-gray-600 text-sm mt-1">{plantilla.observaciones}</p>
                        </div>
                      )}

                      {/* Información de instancias */}
                      {instanceCount > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-3">
                          <p className="text-sm text-blue-900">
                            <strong>{instanceCount}</strong> instancia{instanceCount !== 1 ? "s" : ""} de esta
                            plantilla en calendario. Los cambios se aplicarán a todas ellas.
                          </p>
                        </div>
                      )}

                      {/* Botones de acción */}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            onEdit(plantilla)
                            setExpandedId(null)
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </button>

                        {isDeleting ? (
                          <>
                            <button
                              onClick={() => {
                                onDelete(plantilla.id)
                                setConfirmDelete(null)
                                setExpandedId(null)
                              }}
                              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(plantilla.id)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Botón cerrar al pie */}
        <div className="mt-6 pt-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
