import type { InsForgeClient } from '@insforge/sdk'
import { createAdminClient as createInsforgeAdmin } from '@insforge/sdk'
import { getAgendawApiKey, getAgendawBaseUrl } from '@/lib/insforge/env'

export type DbClient = InsForgeClient['database']

/** Cliente admin (solo servidor) a las tablas de la agenda en Winston Servicios. */
export function createAdminClient(): DbClient {
  return createInsforgeAdmin({ baseUrl: getAgendawBaseUrl(), apiKey: getAgendawApiKey() }).database
}
