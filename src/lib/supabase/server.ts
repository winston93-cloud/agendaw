import type { InsForgeClient } from '@insforge/sdk'
import { createAdminClient as createInsforgeAdmin, createClient } from '@insforge/sdk'

export type DbClient = InsForgeClient['database']

function agendawBaseUrl(): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_INSFORGE_URL
  if (!baseUrl) {
    throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL (URL de InsForge AgendaW).')
  }
  return baseUrl
}

/** Cliente público (anon) a InsForge AgendaW. */
export function createPublicClient(): DbClient {
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY
  if (!anonKey) {
    throw new Error('Falta NEXT_PUBLIC_SUPABASE_ANON_KEY (InsForge AgendaW).')
  }
  return createClient({ baseUrl: agendawBaseUrl(), anonKey }).database
}

/** Cliente admin a InsForge AgendaW. */
export function createAdminClient(): DbClient {
  const apiKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.INSFORGE_API_KEY
  if (!apiKey) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY (API key de InsForge AgendaW).')
  }
  return createInsforgeAdmin({ baseUrl: agendawBaseUrl(), apiKey }).database
}
