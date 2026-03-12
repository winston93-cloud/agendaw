import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import PublicThemeWrapper from '@/components/PublicThemeWrapper'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgendaW - Agenda tu Examen de Admisión | Winston',
  description: 'Sistema de agendamiento de citas para proceso de admisión escolar Instituto Winston. Rápido, fácil y seguro.',
  keywords: 'agenda, citas, admisión, escolar, registro, winston, churchill',
  authors: [{ name: 'Winston93 Cloud' }],
  openGraph: {
    title: 'AgendaW - Agenda tu Examen de Admisión',
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AgendaW" />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <PublicThemeWrapper>
            {children}
          </PublicThemeWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
