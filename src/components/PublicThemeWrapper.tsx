'use client'

import { useEffect, useRef, useState } from 'react'

export type PublicTheme = 'light' | 'dark'
const STORAGE_KEY = 'pub-theme'

export default function PublicThemeWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [theme, setTheme] = useState<PublicTheme>('light')

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as PublicTheme) || 'light'
    setTheme(saved)
    if (ref.current) ref.current.dataset.theme = saved
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const next = (e as CustomEvent<PublicTheme>).detail
      setTheme(next)
      localStorage.setItem(STORAGE_KEY, next)
      if (ref.current) ref.current.dataset.theme = next
    }
    window.addEventListener('pub-theme-change', handler)
    return () => window.removeEventListener('pub-theme-change', handler)
  }, [])

  return (
    <div ref={ref} className="public-layout" data-theme={theme}>
      {children}
    </div>
  )
}
