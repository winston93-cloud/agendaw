import type { InsForgeClient } from '@insforge/sdk'
import { createAdminClient as createInsforgeAdmin, createClient } from '@insforge/sdk'
import { getAgendawAnonKey, getAgendawApiKey, getAgendawBaseUrl } from '@/lib/insforge/env'

export type DbClient = InsForgeClient['database']

/** Cliente público (anon) a InsForge AgendaW. */
export function createPublicClient(): DbClient {
  return createClient({ baseUrl: getAgendawBaseUrl(), anonKey: getAgendawAnonKey() }).database
}

/** Cliente admin a InsForge AgendaW. */
export function createAdminClient(): DbClient {
  return createInsforgeAdmin({ baseUrl: getAgendawBaseUrl(), apiKey: getAgendawApiKey() }).database
}
