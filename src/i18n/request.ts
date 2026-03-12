import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export type Locale = 'es' | 'en'
export const locales: Locale[] = ['es', 'en']
export const defaultLocale: Locale = 'es'

// Turbopack requiere imports estáticos (no template literals dinámicos)
async function loadMessages(locale: Locale) {
  switch (locale) {
    case 'en':
      return (await import('../../messages/en.json')).default
    case 'es':
    default:
      return (await import('../../messages/es.json')).default
  }
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value as Locale) ?? defaultLocale

  return {
    locale,
    messages: await loadMessages(locale),
  }
})
