import type { InsForgeClient } from '@insforge/sdk'
import { createAdminClient as createInsforgeAdmin, createClient } from '@insforge/sdk'

export type DbClient = InsForgeClient['database']

function readEnv(primary: string | undefined, legacy: string | undefined, label: string): string {
  const value = primary ?? legacy
  if (!value) throw new Error(`Falta ${label} (InsForge AgendaW).`)
  return value
}

function agendawBaseUrl(): string {
  return readEnv(
    process.env.NEXT_PUBLIC_INSFORGE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_INSFORGE_URL'
  )
}

/** Cliente público (anon) a InsForge AgendaW. */
export function createPublicClient(): DbClient {
  const anonKey = readEnv(
    process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'NEXT_PUBLIC_INSFORGE_ANON_KEY'
  )
  return createClient({ baseUrl: agendawBaseUrl(), anonKey }).database
}

/** Cliente admin a InsForge AgendaW. */
export function createAdminClient(): DbClient {
  const apiKey = readEnv(
    process.env.INSFORGE_API_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    'INSFORGE_API_KEY'
  )
  return createInsforgeAdmin({ baseUrl: agendawBaseUrl(), apiKey }).database
}
