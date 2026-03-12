'use client'

import { useLocale } from 'next-intl'
import LangSelector from './LangSelector'

export default function ClientLangSelector() {
  const locale = useLocale()
  return <LangSelector currentLocale={locale as 'es' | 'en'} />
}
