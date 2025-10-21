"use client"

import dynamic from 'next/dynamic'
import React from 'react'
import type { Usuario, Cita, Modulo } from '@/lib/demoData'

// Cargar ProfileView en cliente para evitar SSR/SSR mismatch
const ProfileViewClient = dynamic(() => import('@/components/ProfileView').then((m) => m.ProfileView), { ssr: false })

interface Props {
  professional: Usuario
  citas: Cita[]
  modulos?: Modulo[]
}

export default function ProfilePageClient({ professional, citas, modulos }: Props) {
  return <ProfileViewClient professional={professional} citas={citas} modulos={modulos} />
}
