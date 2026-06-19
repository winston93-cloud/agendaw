import { createAdminClient as createInsforgeAdmin } from '@insforge/sdk'
import type { DbClient } from '@/lib/insforge/server'

/** Cliente admin a InsForge «Winston Servicios» (tabla `alumno` para Familia Winston). */
export function createWinstonServiciosClient(): DbClient {
  const baseUrl = process.env.WINSTON_SERVICIOS_URL
  const apiKey = process.env.WINSTON_SERVICIOS_API_KEY
  if (!baseUrl || !apiKey) {
    throw new Error(
      'Faltan WINSTON_SERVICIOS_URL y WINSTON_SERVICIOS_API_KEY (proyecto Winston Servicios en InsForge).'
    )
  }
  return createInsforgeAdmin({ baseUrl, apiKey }).database
}
