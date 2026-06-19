import { createClient } from '@insforge/sdk'

const baseUrl =
  process.env.NEXT_PUBLIC_INSFORGE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey =
  process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!baseUrl || !anonKey) {
  throw new Error('Faltan variables de InsForge AgendaW (URL y anon key).')
}

export const db = createClient({ baseUrl, anonKey }).database
