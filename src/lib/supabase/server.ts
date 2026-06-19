import { createClient } from '@supabase/supabase-js'

/** Cliente público (anon) a InsForge AgendaW. */
export function createPublicClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_INSFORGE_URL
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    throw new Error('Faltan credenciales públicas de InsForge AgendaW.')
  }
  return createClient(supabaseUrl, anonKey)
}

/** Cliente admin a InsForge AgendaW (API PostgREST; compatible con supabase-js). */
export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_INSFORGE_URL
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.INSFORGE_API_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Faltan credenciales de InsForge AgendaW (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, o NEXT_PUBLIC_INSFORGE_URL + INSFORGE_API_KEY).'
    )
  }
  return createClient(supabaseUrl, serviceRoleKey)
}
