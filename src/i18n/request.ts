import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export type Locale = 'es' | 'en'
export const locales: Locale[] = ['es', 'en']
export const defaultLocale: Locale = 'es'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value as Locale) ?? defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
