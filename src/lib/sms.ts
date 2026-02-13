/**
 * SMS vía SMS Mobile API (app en tu celular).
 * Endpoint: https://api.smsmobileapi.com/sendsms/
 * Parámetros: apikey, recipients, message.
 * NO usar shorturl para preservar parámetros de query en URLs.
 * Actualizado: 2026-02-10
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
  campusName: string
  studentName: string
  appointmentDate: string // YYYY-MM-DD
  appointmentTime: string
  expedienteUrl: string
}

/** Arma el texto del SMS en máximo 2 segmentos (~306 caracteres). */
export function buildAdmissionSmsText(data: AdmissionSmsData): string {
  const dateShort = (() => {
    try {
      const d = new Date(data.appointmentDate + 'T12:00:00')
      return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return data.appointmentDate
    }
  })()
  
  // Mensaje: nombre plantel completo, nombre completo del alumno, fecha, hora, menú admisión
  const msg = `${data.campusName}: Cita registrada. ${data.studentName}. ${dateShort} ${data.appointmentTime}. Menú admisión: ${data.expedienteUrl.replace('/expediente_inicial?', '/menu-admision?')}`
  
  // Limitar a 2 segmentos SMS (306 caracteres)
  return msg.length > 306 ? msg.slice(0, 303) + '...' : msg
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
    // NO usar shorturl porque pierde el parámetro ?cita=ID
  })

  try {
    const res = await fetch(`${SMSMOBILEAPI_URL}?${params.toString()}`, { method: 'GET' })
    const text = await res.text()
    if (!res.ok) {
      console.warn('[sms]', res.status, text)
      return { ok: false, error: `SMS API: ${res.status}` }
    }
    
    // La API devuelve JSON con {"result":{"error":0,"sent":"1"}} cuando tiene éxito
    try {
      const json = JSON.parse(text)
      if (json.result) {
        // error:0 y sent:"1" indican éxito
        const isSuccess = json.result.error === 0 || json.result.error === '0' || json.result.sent === '1' || json.result.sent === 1
        if (isSuccess) {
          return { ok: true }
        } else {
          console.warn('[sms]', text)
          return { ok: false, error: json.result.error || 'SMS no enviado' }
        }
      }
    } catch {
      // Si no es JSON válido, revisar el texto
    }
    
    // Fallback: si contiene "fail" consideramos fallo
    if (text.toLowerCase().includes('fail')) {
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
