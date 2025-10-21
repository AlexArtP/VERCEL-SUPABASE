import { notFound } from "next/navigation"
import { DEMO_DATA } from "@/lib/demoData"
import type { Usuario, Cita, Modulo } from "@/lib/demoData"
import ProfilePageClient from "./ProfilePageClient"

// Next.js export requires statically known dynamic params when using `output: 'export'`.
// generateStaticParams provides the available profile ids based on demo data.
export async function generateStaticParams() {
  return DEMO_DATA.usuarios
    .filter((u) => u.rol === "profesional")
    .map((u) => ({ id: String(u.id) }))
}

interface ProfilePageProps {
  params: {
    id: string
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params as { id: string }
  const professionalId = Number(id)
  if (Number.isNaN(professionalId)) {
    notFound()
  }

  const professional = DEMO_DATA.usuarios.find(
    (user) => user.id === professionalId && user.rol === "profesional",
  ) as Usuario | undefined

  if (!professional) {
    notFound()
  }

  const citas = DEMO_DATA.citas.filter((cita) => cita.profesionalId === professional.id) as Cita[]
  const modulos = DEMO_DATA.modulos.filter((modulo) => modulo.profesionalId === professional.id) as Modulo[]

  // Render a client wrapper that will do the dynamic import and client-side rendering
  return <ProfilePageClient professional={professional} citas={citas} modulos={modulos} />
}

