 'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'
import { RegistrationModal } from '@/components/RegistrationModal'

export function RegistrationModalWrapper() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)

  // Derivar el valor del parámetro para que el useEffect pueda depender de él
  const registerParam = searchParams.get('register')

  useEffect(() => {
    // Si el query param indica abrir, mostrar modal
    if (registerParam === '1') {
      setShowModal(true)
    } else {
      // si no está, asegurarse que el modal esté cerrado
      setShowModal(false)
    }
  }, [registerParam])

  const handleClose = () => {
    setShowModal(false)
    try {
      // Quitar el parámetro register de la URL sin hacer reload
      const url = new URL(window.location.href)
      url.searchParams.delete('register')
      router.replace(url.pathname + url.search)
    } catch (e) {
      // fallback simple: reemplazar a la ruta raíz
      router.replace('/')
    }
  }

  return (
    <RegistrationModal
      isOpen={showModal}
      onClose={handleClose}
    />
  )
}

export function RegistrationModalSuspense() {
  return (
    <Suspense fallback={null}>
      <RegistrationModalWrapper />
    </Suspense>
  )
}
