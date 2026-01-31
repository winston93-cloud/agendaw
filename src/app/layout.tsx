import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgendaW - Sistema de Gestión de Citas',
  description: 'Sistema moderno para gestión de citas y clientes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
