import { createClient } from '@insforge/sdk'

const baseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_INSFORGE_URL
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY

if (!baseUrl || !anonKey) {
  throw new Error('Faltan variables de InsForge AgendaW (URL y anon key).')
}

export const supabase = createClient({ baseUrl, anonKey }).database
