'use client'

import { useState } from 'react'
import { RegisterForm } from './RegisterForm'
import { X } from 'lucide-react'

interface RegistrationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RegistrationModal({ isOpen, onClose }: RegistrationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex items-center justify-between border-b">
          <div>
            <h2 className="text-2xl font-bold">Solicitar Acceso</h2>
            <p className="text-blue-100 text-sm mt-1">Completa el formulario para solicitar acceso al sistema</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <RegisterForm
            onCancel={onClose}
            onSuccess={onClose}
          />
        </div>
      </div>
    </div>
  )
}
