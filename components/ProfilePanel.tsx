"use client"

import dynamic from 'next/dynamic'
import React from 'react'
import type { Profesional, Cita, Modulo } from '@/types'

// Importar ProfileView que ya está preparado como client component
const ProfileView = dynamic(() => import('./ProfileView').then(m => m.ProfileView), { ssr: false })

interface ProfilePanelProps {
  professional: Profesional | any
  citas: any[]
  modulos?: any[]
}

export default function ProfilePanel({ professional, citas, modulos }: ProfilePanelProps) {
  return (
    <div>
      <ProfileView professional={professional} citas={citas as any} modulos={modulos as any} />
    </div>
  )
}
