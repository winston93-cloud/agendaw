import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/calendar.events']

const LEVEL_LABELS: Record<string, string> = {
  maternal: 'Maternal',
  kinder: 'Kinder',
  primaria: 'Primaria',
  secundaria: 'Secundaria',
}

export type PsicologaCalendarKey = 'educativo' | 'primaria' | 'secundaria'

export const PSICOLOGA_EVENT_COLUMNS: Record<
  PsicologaCalendarKey,
  'google_event_id_psic_educativo' | 'google_event_id_psic_primaria' | 'google_event_id_psic_secundaria'
> = {
  educativo: 'google_event_id_psic_educativo',
  primaria: 'google_event_id_psic_primaria',
  secundaria: 'google_event_id_psic_secundaria',
}

/** Calendarios de las 3 psicólogas (vacaciones: toda cita se replica en todas). */
export function listPsicologaCalendars(): { key: PsicologaCalendarKey; calendarId: string }[] {
  const all: { key: PsicologaCalendarKey; env: string | undefined }[] = [
    { key: 'educativo', env: process.env.GOOGLE_CALENDAR_PSICOLOGA_EDUCATIVO },
    { key: 'primaria', env: process.env.GOOGLE_CALENDAR_PSICOLOGA_PRIMARIA },
    { key: 'secundaria', env: process.env.GOOGLE_CALENDAR_PSICOLOGA_SECUNDARIA },
  ]
  return all
    .filter((c): c is { key: PsicologaCalendarKey; env: string } => Boolean(c.env))
    .map((c) => ({ key: c.key, calendarId: c.env }))
}

/** Retorna el Calendar ID (correo) de la psicóloga según el nivel educativo */
export function getPsicologaCalendarId(level: string): string | null {
  if (level === 'maternal' || level === 'kinder') {
    return process.env.GOOGLE_CALENDAR_PSICOLOGA_EDUCATIVO ?? null
  }
  if (level === 'primaria') {
    return process.env.GOOGLE_CALENDAR_PSICOLOGA_PRIMARIA ?? null
  }
  if (level === 'secundaria') {
    return process.env.GOOGLE_CALENDAR_PSICOLOGA_SECUNDARIA ?? null
  }
  return null
}

export function psicologaKeyForLevel(level: string): PsicologaCalendarKey | null {
  if (level === 'maternal' || level === 'kinder') return 'educativo'
  if (level === 'primaria') return 'primaria'
  if (level === 'secundaria') return 'secundaria'
  return null
}

export type LevelCalendars = {
  /** Las 3 psicólogas (si hay env configuradas). */
  psicologas: { key: PsicologaCalendarKey; calendarId: string }[]
  /** Psicóloga del nivel del alumno (compat / google_event_id). */
  psicologa: string
  controlEscolar?: string
  ingles?: string
}

/**
 * Calendarios destino al agendar una cita de admisión.
 * Vacaciones / rotación: SIEMPRE las 3 psicólogas, sin importar el nivel.
 * Primaria además escribe en control escolar e inglés.
 */
export function getAllCalendarIdsForLevel(level: string): LevelCalendars | null {
  const psicologas = listPsicologaCalendars()
  const psicologaId = getPsicologaCalendarId(level) ?? psicologas[0]?.calendarId
  if (!psicologaId && psicologas.length === 0) return null

  const base: LevelCalendars = {
    psicologas,
    psicologa: psicologaId ?? psicologas[0].calendarId,
  }

  if (level === 'primaria') {
    base.controlEscolar = process.env.GOOGLE_CALENDAR_CONTROL_ESCOLAR_PRIMARIA ?? undefined
    base.ingles = process.env.GOOGLE_CALENDAR_INGLES_PRIMARIA ?? undefined
  }

  return base
}

export type AppointmentCalendarIds = {
  google_event_id?: string | null
  google_event_id_psic_educativo?: string | null
  google_event_id_psic_primaria?: string | null
  google_event_id_psic_secundaria?: string | null
  google_event_id_control_escolar?: string | null
  google_event_id_ingles?: string | null
}

/** Crea el evento en las 3 psicólogas (+ control/inglés si aplica). */
export async function createAdmissionCalendarEvents(
  level: string,
  eventData: CalendarEventData
): Promise<Record<string, string>> {
  const calendars = getAllCalendarIdsForLevel(level)
  if (!calendars) return {}

  const updates: Record<string, string> = {}
  const levelKey = psicologaKeyForLevel(level)

  for (const psic of calendars.psicologas) {
    const result = await createCalendarEvent(psic.calendarId, eventData)
    if (!result.ok || !result.eventId) continue
    updates[PSICOLOGA_EVENT_COLUMNS[psic.key]] = result.eventId
    if (levelKey === psic.key || (!levelKey && psic.calendarId === calendars.psicologa)) {
      updates.google_event_id = result.eventId
    }
  }

  // Compat: si no se llenó google_event_id (env del nivel ausente), usar el primero
  if (!updates.google_event_id) {
    const firstCol = Object.values(PSICOLOGA_EVENT_COLUMNS).find((c) => updates[c])
    if (firstCol) updates.google_event_id = updates[firstCol]
  }

  if (level === 'primaria') {
    if (calendars.controlEscolar) {
      const controlResult = await createCalendarEvent(calendars.controlEscolar, eventData)
      if (controlResult.ok && controlResult.eventId) {
        updates.google_event_id_control_escolar = controlResult.eventId
      }
    }
    if (calendars.ingles) {
      const inglesResult = await createCalendarEvent(calendars.ingles, eventData)
      if (inglesResult.ok && inglesResult.eventId) {
        updates.google_event_id_ingles = inglesResult.eventId
      }
    }
  }

  return updates
}

/**
 * Sincroniza calendarios: actualiza IDs existentes, adopta google_event_id legacy
 * en la psicóloga del nivel, y CREA las copias faltantes en las demás.
 * Devuelve columnas a persistir en admission_appointments.
 */
export async function syncAdmissionCalendarEvents(
  level: string,
  stored: AppointmentCalendarIds,
  eventData: CalendarEventData
): Promise<Record<string, string>> {
  const calendars = getAllCalendarIdsForLevel(level)
  if (!calendars) return {}

  const updates: Record<string, string> = {}
  const working: AppointmentCalendarIds = { ...stored }
  const levelKey = psicologaKeyForLevel(level)

  // Citas anteriores al cambio: solo tenían google_event_id en la psicóloga del nivel.
  if (stored.google_event_id && levelKey) {
    const col = PSICOLOGA_EVENT_COLUMNS[levelKey]
    if (!working[col]) {
      working[col] = stored.google_event_id
      updates[col] = stored.google_event_id
    }
  }

  for (const psic of calendars.psicologas) {
    const col = PSICOLOGA_EVENT_COLUMNS[psic.key]
    const eventId = working[col]
    if (eventId) {
      await updateCalendarEvent(psic.calendarId, eventId, eventData)
      continue
    }

    const created = await createCalendarEvent(psic.calendarId, eventData)
    if (!created.ok || !created.eventId) continue
    updates[col] = created.eventId
    working[col] = created.eventId
    if (levelKey === psic.key) {
      updates.google_event_id = created.eventId
    }
  }

  if (!stored.google_event_id && !updates.google_event_id) {
    const firstCol = Object.values(PSICOLOGA_EVENT_COLUMNS).find((c) => updates[c] || working[c])
    if (firstCol) {
      const id = updates[firstCol] || working[firstCol]
      if (id) updates.google_event_id = id
    }
  }

  if (level === 'primaria') {
    if (calendars.controlEscolar) {
      if (working.google_event_id_control_escolar) {
        await updateCalendarEvent(
          calendars.controlEscolar,
          working.google_event_id_control_escolar,
          eventData
        )
      } else {
        const controlResult = await createCalendarEvent(calendars.controlEscolar, eventData)
        if (controlResult.ok && controlResult.eventId) {
          updates.google_event_id_control_escolar = controlResult.eventId
        }
      }
    }
    if (calendars.ingles) {
      if (working.google_event_id_ingles) {
        await updateCalendarEvent(calendars.ingles, working.google_event_id_ingles, eventData)
      } else {
        const inglesResult = await createCalendarEvent(calendars.ingles, eventData)
        if (inglesResult.ok && inglesResult.eventId) {
          updates.google_event_id_ingles = inglesResult.eventId
        }
      }
    }
  }

  return updates
}

/** @deprecated Prefer syncAdmissionCalendarEvents (crea faltantes). */
export async function updateAdmissionCalendarEvents(
  level: string,
  stored: AppointmentCalendarIds,
  eventData: CalendarEventData
): Promise<Record<string, string>> {
  return syncAdmissionCalendarEvents(level, stored, eventData)
}

/** Elimina eventos de las 3 psicólogas (+ control/inglés). */
export async function deleteAdmissionCalendarEvents(
  level: string,
  stored: AppointmentCalendarIds
): Promise<void> {
  const calendars = getAllCalendarIdsForLevel(level)
  if (!calendars) return

  for (const psic of calendars.psicologas) {
    const eventId = stored[PSICOLOGA_EVENT_COLUMNS[psic.key]]
    if (eventId) {
      await deleteCalendarEvent(psic.calendarId, eventId)
    }
  }

  const hasPerPsic = calendars.psicologas.some((p) => stored[PSICOLOGA_EVENT_COLUMNS[p.key]])
  if (!hasPerPsic && stored.google_event_id && calendars.psicologa) {
    await deleteCalendarEvent(calendars.psicologa, stored.google_event_id)
  }

  if (level === 'primaria') {
    if (calendars.controlEscolar && stored.google_event_id_control_escolar) {
      await deleteCalendarEvent(calendars.controlEscolar, stored.google_event_id_control_escolar)
    }
    if (calendars.ingles && stored.google_event_id_ingles) {
      await deleteCalendarEvent(calendars.ingles, stored.google_event_id_ingles)
    }
  }
}

/** Retorna el Calendar ID (correo) de vinculación según el nivel educativo */
export function getVinculacionCalendarId(level: string): string | null {
  if (level === 'maternal' || level === 'kinder') {
    return process.env.GOOGLE_CALENDAR_VINCULACION_EDUCATIVO ?? null
  }
  // primaria y secundaria comparten plantel Winston
  return process.env.GOOGLE_CALENDAR_VINCULACION_WINSTON ?? null
}

function getAuthClient(impersonateEmail: string) {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!email || !privateKey) {
    throw new Error('Faltan variables de entorno de Google Service Account')
  }

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: SCOPES,
    subject: impersonateEmail,
  })
}

export interface CalendarEventData {
  summary: string
  description?: string
  date: string      // 'YYYY-MM-DD'
  time: string      // 'HH:mm' o 'HH:mm:ss'
  durationMinutes?: number
  timezone?: string
}

export async function createCalendarEvent(
  calendarId: string,
  eventData: CalendarEventData
): Promise<{ ok: boolean; eventId?: string; error?: string }> {
  try {
    const auth = getAuthClient(calendarId)
    const calendar = google.calendar({ version: 'v3', auth })

    const timezone = eventData.timezone ?? 'America/Monterrey'
    const duration = eventData.durationMinutes ?? 60
    const [hour, minute] = eventData.time.split(':').map(Number)

    const startDate = new Date(`${eventData.date}T00:00:00`)
    startDate.setHours(hour, minute, 0, 0)
    const endDate = new Date(startDate.getTime() + duration * 60 * 1000)

    const formatLocal = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`
    }

    const response = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: eventData.summary,
        description: eventData.description,
        start: { dateTime: formatLocal(startDate), timeZone: timezone },
        end: { dateTime: formatLocal(endDate), timeZone: timezone },
      },
    })

    return { ok: true, eventId: response.data.id ?? undefined }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn('[googleCalendar] createCalendarEvent error:', msg)
    return { ok: false, error: msg }
  }
}

export async function updateCalendarEvent(
  calendarId: string,
  eventId: string,
  eventData: CalendarEventData
): Promise<{ ok: boolean; error?: string }> {
  try {
    const auth = getAuthClient(calendarId)
    const calendar = google.calendar({ version: 'v3', auth })

    const timezone = eventData.timezone ?? 'America/Monterrey'
    const duration = eventData.durationMinutes ?? 60
    const [hour, minute] = eventData.time.split(':').map(Number)

    const startDate = new Date(`${eventData.date}T00:00:00`)
    startDate.setHours(hour, minute, 0, 0)
    const endDate = new Date(startDate.getTime() + duration * 60 * 1000)

    const formatLocal = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`
    }

    await calendar.events.update({
      calendarId,
      eventId,
      requestBody: {
        summary: eventData.summary,
        description: eventData.description,
        start: { dateTime: formatLocal(startDate), timeZone: timezone },
        end: { dateTime: formatLocal(endDate), timeZone: timezone },
      },
    })

    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn('[googleCalendar] updateCalendarEvent error:', msg)
    return { ok: false, error: msg }
  }
}

export async function deleteCalendarEvent(
  calendarId: string,
  eventId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const auth = getAuthClient(calendarId)
    const calendar = google.calendar({ version: 'v3', auth })

    await calendar.events.delete({ calendarId, eventId })
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn('[googleCalendar] deleteCalendarEvent error:', msg)
    return { ok: false, error: msg }
  }
}

/** Construye la descripción del evento para una cita de admisión */
export function buildAdmisionEventDescription(data: {
  studentName: string
  level: string
  gradeLevel?: string
  parentName: string
  parentPhone: string
  parentEmail: string
  campus: string
}): string {
  const level = LEVEL_LABELS[data.level] ?? data.level
  const lines = [
    `Alumno: ${data.studentName}`,
    `Nivel: ${level}${data.gradeLevel ? ` - ${data.gradeLevel}` : ''}`,
    `Plantel: ${data.campus}`,
    ``,
    `Tutor: ${data.parentName}`,
    `Teléfono: ${data.parentPhone}`,
    `Correo: ${data.parentEmail}`,
  ]
  return lines.join('\n')
}

/** Construye la descripción del evento para un recorrido */
export function buildRecorridoEventDescription(data: {
  level: string
  parentName: string
  parentPhone: string
  parentEmail: string
  notes?: string
}): string {
  const level = LEVEL_LABELS[data.level] ?? data.level
  const lines = [
    `Nivel: ${level}`,
    ``,
    `Papá/Mamá: ${data.parentName}`,
    `Teléfono: ${data.parentPhone}`,
    `Correo: ${data.parentEmail}`,
  ]
  if (data.notes) lines.push(``, `Notas: ${data.notes}`)
  return lines.join('\n')
}
