/**
 * Las tablas de la agenda viven en InsForge «Winston Servicios» (desde 2026-10-05).
 * El proyecto AgendaW (sr6a9iza) queda retirado: si la URL apunta ahí, se rechaza
 * para no escribir citas en dos bases distintas.
 */
const HOST_AGENDAW_RETIRADO = 'sr6a9iza'

export function getAgendawBaseUrl(): string {
  const url = process.env.WINSTON_SERVICIOS_URL?.trim()
  if (!url) {
    throw new Error('Falta WINSTON_SERVICIOS_URL (proyecto Winston Servicios en InsForge).')
  }
  if (url.includes(HOST_AGENDAW_RETIRADO)) {
    throw new Error('WINSTON_SERVICIOS_URL apunta al proyecto AgendaW retirado; debe ser Winston Servicios.')
  }
  return url
}

export function getAgendawApiKey(): string {
  const key = process.env.WINSTON_SERVICIOS_API_KEY?.trim()
  if (!key) {
    throw new Error('Falta WINSTON_SERVICIOS_API_KEY (proyecto Winston Servicios en InsForge).')
  }
  return key
}

export function hasAgendawDbEnv(): boolean {
  try {
    getAgendawBaseUrl()
    getAgendawApiKey()
    return true
  } catch {
    return false
  }
}
