'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Locale = 'es' | 'en'

interface Props {
  currentLocale: Locale
}

const LANGS: { locale: Locale; flag: string; label: string }[] = [
  { locale: 'es', flag: '🇲🇽', label: 'ES' },
  { locale: 'en', flag: '🇺🇸', label: 'EN' },
]

export default function LangSelector({ currentLocale }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleChange = async (locale: Locale) => {
    if (locale === currentLocale) return
    await fetch('/api/set-locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale }),
    })
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="lang-selector" aria-label="Seleccionar idioma" role="group">
      {LANGS.map(({ locale, flag, label }) => (
        <button
          key={locale}
          type="button"
          className={`lang-btn${currentLocale === locale ? ' active' : ''}`}
          onClick={() => handleChange(locale)}
          disabled={isPending}
          aria-pressed={currentLocale === locale}
          title={locale === 'es' ? 'Español' : 'English'}
        >
          <span aria-hidden="true">{flag}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
