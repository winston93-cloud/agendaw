import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgendaW - Agenda tu Cita de Admisión | Winston',
  description: 'Sistema de agendamiento de citas para proceso de admisión escolar Instituto Winston. Rápido, fácil y seguro.',
  keywords: 'agenda, citas, admisión, escolar, registro, winston, churchill',
  authors: [{ name: 'Winston93 Cloud' }],
  openGraph: {
    title: 'AgendaW - Agenda tu Cita de Admisión',
    description: 'Sistema de agendamiento de citas para proceso de admisión escolar',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AgendaW" />
      </head>
      <body>{children}</body>
    </html>
  )
}
