import { createClient } from '@supabase/supabase-js'

/** Cliente admin a InsForge «Winston Servicios» (tabla `alumno` para Familia Winston). */
export function createWinstonServiciosClient() {
  const url = process.env.WINSTON_SERVICIOS_URL
  const apiKey = process.env.WINSTON_SERVICIOS_API_KEY
  if (!url || !apiKey) {
    throw new Error(
      'Faltan WINSTON_SERVICIOS_URL y WINSTON_SERVICIOS_API_KEY (proyecto Winston Servicios en InsForge).'
    )
  }
  return createClient(url, apiKey)
}
