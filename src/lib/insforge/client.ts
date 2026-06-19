import { createClient } from '@insforge/sdk'
import { getAgendawAnonKey, getAgendawBaseUrl } from '@/lib/insforge/env'

export const db = createClient({
  baseUrl: getAgendawBaseUrl(),
  anonKey: getAgendawAnonKey(),
}).database
