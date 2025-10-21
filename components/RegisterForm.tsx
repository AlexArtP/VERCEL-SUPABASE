/**
 * COMPONENTE: components/RegisterForm.tsx
 * PROPÓSITO: Formulario para solicitar registro de nuevo usuario
 * 
 * Campos:
 * - Nombre, Apellido paterno, Apellido materno
 * - RUN (validado con regla de los 11)
 * - Profesión (dropdown)
 * - Sobre ti, Cargo actual, Email, Teléfono
 * - Contraseña con validación
 */

'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import {
  validateRUN,
  formatRUN,
  validatePassword,
  validateEmail,
  validatePhone,
  PROFESIONES,
} from '@/lib/validations'

interface RegistrationFormData {
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  run: string
  profesion: string
  sobreTi: string
  cargoActual: string
  email: string
  telefono: string
  password: string
  confirmPassword: string
}

interface RegisterFormProps {
  onSubmit?: (data: RegistrationFormData) => Promise<void>
  onCancel?: () => void
  onSuccess?: () => void
}

export function RegisterForm({ onSubmit, onCancel, onSuccess }: RegisterFormProps) {
  const [formData, setFormData] = useState<RegistrationFormData>({
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    run: '',
    profesion: '',
    sobreTi: '',
    cargoActual: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim())
      newErrors.nombre = 'Nombre es requerido'
    if (!formData.apellidoPaterno.trim())
      newErrors.apellidoPaterno = 'Apellido paterno es requerido'
    if (!formData.apellidoMaterno.trim())
      newErrors.apellidoMaterno = 'Apellido materno es requerido'

    if (!formData.run.trim())
      newErrors.run = 'RUN es requerido'
    else if (!validateRUN(formData.run))
      newErrors.run = 'RUN inválido. Verifica el dígito verificador'

    if (!formData.profesion)
      newErrors.profesion = 'Profesión es requerida'

    if (!formData.email.trim())
      newErrors.email = 'Email es requerido'
    else if (!validateEmail(formData.email))
      newErrors.email = 'Email inválido'

    if (formData.telefono && !validatePhone(formData.telefono))
      newErrors.telefono = 'Teléfono inválido (ej: +56 9 1234 5678)'

    if (!formData.password)
      newErrors.password = 'Contraseña es requerida'
    else if (!validatePassword(formData.password))
      newErrors.password =
        'Contraseña debe tener al menos 8 caracteres, 1 mayúscula y 1 número'

    if (!formData.confirmPassword)
      newErrors.confirmPassword = 'Confirmar contraseña es requerido'
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Las contraseñas no coinciden'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRUNChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRUN(e.target.value)
    setFormData({ ...formData, run: formatted })
    if (errors.run) setErrors({ ...errors, run: '' })
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value
    setFormData({ ...formData, password })
    if (errors.password) setErrors({ ...errors, password: '' })
  }

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const confirmPassword = e.target.value
    setFormData({ ...formData, confirmPassword })
    
    // Validación en tiempo real: mostrar error inmediato si no coinciden
    if (formData.password && confirmPassword && formData.password !== confirmPassword) {
      setErrors({ ...errors, confirmPassword: 'Las contraseñas no coinciden' })
    } else if (errors.confirmPassword && formData.password === confirmPassword) {
      setErrors({ ...errors, confirmPassword: '' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      if (onSubmit) {
        await onSubmit(formData)
      } else {
        // Por defecto, guardar en Firestore
        // Log para debuggear qué se envía
        console.log('📤 Enviando datos del formulario:', { ...formData, password: '***', confirmPassword: '***' })
        
        // Agregar timeout para evitar que el formulario se quede pegado
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 segundos timeout

        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)
          console.log('✅ Respuesta recibida:', response.status, response.statusText)
          const data = await response.json()
          console.log('📦 Datos de respuesta:', data)

          if (!response.ok) {
            setErrors({ submit: data.message || data.error || 'Error al registrar' })
            setLoading(false)
            return
          }

          if (!data.success) {
            setErrors({ submit: data.message || 'Error al registrar' })
            setLoading(false)
            return
          }
        } catch (fetchError) {
          clearTimeout(timeoutId)
          console.error('❌ Error en fetch:', fetchError)
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            setErrors({ submit: 'La solicitud tardó demasiado. Verifica tu conexión e intenta nuevamente.' })
          } else {
            setErrors({ submit: fetchError instanceof Error ? fetchError.message : 'Error de conexión. Verifica tu red.' })
          }
          setLoading(false)
          return
        }
      }

      setSuccess(true)
      // Llamar al callback onSuccess si existe
      if (onSuccess) {
        setTimeout(onSuccess, 2000)
      } else if (onCancel) {
        setTimeout(onCancel, 2000)
      }
    } catch (error) {
      console.error('❌ Error general en submit:', error)
      setErrors({
        submit: error instanceof Error ? error.message : 'Error desconocido',
      })
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
            <div>
              <h3 className="font-semibold text-green-900 mb-1">
                ¡Registro Enviado!
              </h3>
              <p className="text-sm text-green-700">
                Tu solicitud ha sido enviada. Un administrador la revisará pronto.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Solicitar Acceso</CardTitle>
        <CardDescription>
          Completa el formulario para solicitar crear una nueva cuenta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error general */}
          {errors.submit && (
            <Alert className="bg-red-50 border-red-300">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {errors.submit}
              </AlertDescription>
            </Alert>
          )}

          {/* Nombre, Apellidos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Nombre *
              </label>
              <Input
                type="text"
                placeholder="Juan"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                disabled={loading}
                className={errors.nombre ? 'border-red-500' : ''}
              />
              {errors.nombre && (
                <p className="text-xs text-red-600">{errors.nombre}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Apellido Paterno *
              </label>
              <Input
                type="text"
                placeholder="Pérez"
                value={formData.apellidoPaterno}
                onChange={(e) =>
                  setFormData({ ...formData, apellidoPaterno: e.target.value })
                }
                disabled={loading}
                className={errors.apellidoPaterno ? 'border-red-500' : ''}
              />
              {errors.apellidoPaterno && (
                <p className="text-xs text-red-600">{errors.apellidoPaterno}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Apellido Materno *
              </label>
              <Input
                type="text"
                placeholder="González"
                value={formData.apellidoMaterno}
                onChange={(e) =>
                  setFormData({ ...formData, apellidoMaterno: e.target.value })
                }
                disabled={loading}
                className={errors.apellidoMaterno ? 'border-red-500' : ''}
              />
              {errors.apellidoMaterno && (
                <p className="text-xs text-red-600">{errors.apellidoMaterno}</p>
              )}
            </div>
          </div>

          {/* RUN y Profesión */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                RUN *
              </label>
              <Input
                type="text"
                placeholder="12345678-9"
                value={formData.run}
                onChange={handleRUNChange}
                disabled={loading}
                className={errors.run ? 'border-red-500' : ''}
              />
              <p className="text-xs text-gray-500">
                Se formatea automáticamente (ej: 12345678-9)
              </p>
              {errors.run && (
                <p className="text-xs text-red-600">{errors.run}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Profesión *
              </label>
              <Select
                value={formData.profesion}
                onValueChange={(value) =>
                  setFormData({ ...formData, profesion: value })
                }
                disabled={loading}
              >
                <SelectTrigger
                  className={errors.profesion ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder="Selecciona una profesión" />
                </SelectTrigger>
                <SelectContent>
                  {PROFESIONES.map((prof) => (
                    <SelectItem key={prof} value={prof}>
                      {prof}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.profesion && (
                <p className="text-xs text-red-600">{errors.profesion}</p>
              )}
            </div>
          </div>

          {/* Sobre ti y Cargo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Sobre ti
              </label>
              <textarea
                placeholder="Cuéntanos sobre ti..."
                value={formData.sobreTi}
                onChange={(e) =>
                  setFormData({ ...formData, sobreTi: e.target.value })
                }
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Cargo(s) Actual(es)
              </label>
              <textarea
                placeholder="Describe tu cargo actual..."
                value={formData.cargoActual}
                onChange={(e) =>
                  setFormData({ ...formData, cargoActual: e.target.value })
                }
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Email y Teléfono */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Email *
              </label>
              <Input
                type="email"
                placeholder="tu.email@clinica.cl"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={loading}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Teléfono (Opcional)
              </label>
              <Input
                type="tel"
                placeholder="+56 9 1234 5678"
                value={formData.telefono}
                onChange={(e) =>
                  setFormData({ ...formData, telefono: e.target.value })
                }
                disabled={loading}
                className={errors.telefono ? 'border-red-500' : ''}
              />
              {errors.telefono && (
                <p className="text-xs text-red-600">{errors.telefono}</p>
              )}
            </div>
          </div>

          {/* Contraseña */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Contraseña *
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres, 1 mayúscula, 1 número"
                  value={formData.password}
                  onChange={handlePasswordChange}
                  disabled={loading}
                  className={errors.password ? 'border-red-500' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Confirmar Contraseña *
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repite tu contraseña"
                  value={formData.confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  disabled={loading}
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? '⏳ Enviando...' : '📝 Enviar Solicitud'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
