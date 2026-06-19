/** URL del backend InsForge AgendaW (acepta nombres nuevos y legacy). */
export function getAgendawBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_INSFORGE_URL ??
    process.env.INSFORGE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url?.trim()) {
    throw new Error(
      'Falta la URL de InsForge AgendaW. En Vercel define NEXT_PUBLIC_INSFORGE_URL=https://sr6a9iza.us-east.insforge.app'
    )
  }
  return url.trim()
}

export function getAgendawAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key?.trim()) {
    throw new Error(
      'Falta NEXT_PUBLIC_INSFORGE_ANON_KEY (anon key del proyecto AgendaW en InsForge).'
    )
  }
  return key.trim()
}

export function getAgendawApiKey(): string {
  const key =
    process.env.INSFORGE_API_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key?.trim()) {
    throw new Error('Falta INSFORGE_API_KEY (API key admin del proyecto AgendaW en InsForge).')
  }
  return key.trim()
}

export function hasAgendawDbEnv(): boolean {
  try {
    getAgendawBaseUrl()
    getAgendawApiKey()
    return true
  } catch {
    return false
  }
}
