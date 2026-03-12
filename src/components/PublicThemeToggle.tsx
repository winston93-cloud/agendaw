'use client'

import { useEffect, useState } from 'react'

type PublicTheme = 'light' | 'dark'
const STORAGE_KEY = 'pub-theme'

export default function PublicThemeToggle() {
  const [theme, setTheme] = useState<PublicTheme>('light')

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as PublicTheme) || 'light'
    setTheme(saved)
  }, [])

  const handleChange = (next: PublicTheme) => {
    setTheme(next)
    window.dispatchEvent(new CustomEvent<PublicTheme>('pub-theme-change', { detail: next }))
  }

  return (
    <div className="pub-theme-toggle" role="group" aria-label="Cambiar tema">
      <button
        type="button"
        className={`pub-theme-btn${theme === 'light' ? ' active' : ''}`}
        onClick={() => handleChange('light')}
        aria-pressed={theme === 'light'}
        title="Modo claro"
      >
        <span aria-hidden="true">☀️</span>
      </button>
      <button
        type="button"
        className={`pub-theme-btn${theme === 'dark' ? ' active' : ''}`}
        onClick={() => handleChange('dark')}
        aria-pressed={theme === 'dark'}
        title="Modo oscuro"
      >
        <span aria-hidden="true">🌌</span>
      </button>
    </div>
  )
}
