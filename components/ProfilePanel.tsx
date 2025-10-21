"use client"

import dynamic from 'next/dynamic'
import React from 'react'
import type { Usuario, Cita, Modulo } from '@/lib/demoData'

// Importar ProfileView que ya está preparado como client component
const ProfileView = dynamic(() => import('./ProfileView').then(m => m.ProfileView), { ssr: false })

interface ProfilePanelProps {
  professional: Usuario
  citas: Cita[]
  modulos?: Modulo[]
}

export default function ProfilePanel({ professional, citas, modulos }: ProfilePanelProps) {
  return (
    <div>
      <ProfileView professional={professional} citas={citas} modulos={modulos} />
    </div>
  )
}
