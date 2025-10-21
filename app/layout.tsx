import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
// Cargar Analytics de Vercel solo cuando esté disponible
let Analytics: React.ComponentType | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Analytics = require('@vercel/analytics/next').Analytics
} catch (_e) {
  Analytics = null
}
import { DataProvider } from '@/contexts/DataContext'
import { AuthProvider } from '@/contexts/AuthContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // TODO: Obtener profesionalId del usuario autenticado
  // Por ahora usamos 1 como ejemplo
  const profesionalId = 1

  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {/* 
          AuthProvider: Proporciona autenticación a toda la aplicación
          Todos los componentes dentro pueden usar useAuth()
        */}
  <AuthProvider>
          {/* 
            DataProvider: Envuelve toda la aplicación
            Todas los componentes dentro pueden usar useData()
          */}
          <DataProvider profesionalId={profesionalId}>
            {children}
          </DataProvider>
        </AuthProvider>
        {Analytics ? <Analytics /> : null}
      </body>
    </html>
  )
}
