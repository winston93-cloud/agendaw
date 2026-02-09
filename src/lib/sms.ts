/**
 * SMS vía SMS Mobile API (app en tu celular).
 * Endpoint: https://api.smsmobileapi.com/sendsms/
 * Parámetros: apikey, recipients, message. Opcional: shorturl=1 para acortar URLs.
 */

const SMSMOBILEAPI_URL = 'https://api.smsmobileapi.com/sendsms/'

/** Normaliza número a formato internacional México (+52 + 10 dígitos) */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+52${digits}`
  if (digits.length === 12 && digits.startsWith('52')) return `+${digits}`
  return `+52${digits.slice(-10)}`
}

export type AdmissionSmsData = {
  studentName: string
  appointmentDate: string // YYYY-MM-DD
  appointmentTime: string
  expedienteUrl: string
}

/** Arma el texto del SMS en ~1 segmento (≤160 caracteres), con enlace al expediente. */
export function buildAdmissionSmsText(data: AdmissionSmsData): string {
  const dateShort = (() => {
    try {
      const d = new Date(data.appointmentDate + 'T12:00:00')
      return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return data.appointmentDate
    }
  })()
  const name = data.studentName.length > 25 ? data.studentName.slice(0, 22) + '...' : data.studentName
  const msg = `Winston: Cita registrada. ${name}. ${dateShort} ${data.appointmentTime}. Expediente: ${data.expedienteUrl}`
  return msg.length > 160 ? msg.slice(0, 157) + '...' : msg
}

/**
 * Envía SMS usando SMS Mobile API (tu celular con la app instalada).
 * Requiere SMSMOBILEAPI_API_KEY en .env.local
 */
export async function sendAdmissionSms(
  toPhone: string,
  data: AdmissionSmsData
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.SMSMOBILEAPI_API_KEY
  if (!apiKey?.trim()) {
    return { ok: false, error: 'SMSMOBILEAPI_API_KEY no configurada' }
  }

  const recipients = normalizePhone(toPhone)
  const message = buildAdmissionSmsText(data)

  const params = new URLSearchParams({
    apikey: apiKey.trim(),
    recipients,
    message,
    shorturl: '1', // acortar URL para ahorrar caracteres
  })

  try {
    const res = await fetch(`${SMSMOBILEAPI_URL}?${params.toString()}`, { method: 'GET' })
    const text = await res.text()
    if (!res.ok) {
      console.warn('[sms]', res.status, text)
      return { ok: false, error: `SMS API: ${res.status}` }
    }
    // La API puede devolver JSON o texto; si contiene "error" o "fail" consideramos fallo
    if (text.toLowerCase().includes('error') || text.toLowerCase().includes('fail')) {
      console.warn('[sms]', text)
      return { ok: false, error: text.slice(0, 100) }
    }
    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al enviar SMS'
    console.warn('[sms]', msg)
    return { ok: false, error: msg }
  }
}
