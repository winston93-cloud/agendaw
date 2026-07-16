/**
 * Backfill calendarios de las 3 psicólogas.
 * Lee citas incompletas vía InsForge CLI y escribe eventos en Google.
 * Uso: node scripts/backfill-psicologas-calendars.cjs
 */
const { readFileSync, writeFileSync } = require('fs')
const { resolve } = require('path')
const { execFileSync } = require('child_process')
const { google } = require('googleapis')

function loadEnvLocal() {
  const path = resolve(process.cwd(), '.env.local')
  const text = readFileSync(path, 'utf8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq)
    let val = trimmed.slice(eq + 1)
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val.replace(/\\n/g, '\n')
  }
}

const LEVEL_LABELS = {
  maternal: 'Maternal',
  kinder: 'Kinder',
  primaria: 'Primaria',
  secundaria: 'Secundaria',
}

const COLS = {
  educativo: 'google_event_id_psic_educativo',
  primaria: 'google_event_id_psic_primaria',
  secundaria: 'google_event_id_psic_secundaria',
}

function levelKey(level) {
  if (level === 'maternal' || level === 'kinder') return 'educativo'
  if (level === 'primaria') return 'primaria'
  if (level === 'secundaria') return 'secundaria'
  return null
}

function listPsicologas() {
  return [
    { key: 'educativo', calendarId: process.env.GOOGLE_CALENDAR_PSICOLOGA_EDUCATIVO },
    { key: 'primaria', calendarId: process.env.GOOGLE_CALENDAR_PSICOLOGA_PRIMARIA },
    { key: 'secundaria', calendarId: process.env.GOOGLE_CALENDAR_PSICOLOGA_SECUNDARIA },
  ].filter((c) => c.calendarId)
}

function getAuth(calendarId) {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
    subject: calendarId,
  })
}

function formatLocal(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

function eventBody(eventData) {
  const timezone = 'America/Monterrey'
  const duration = 60
  const [hour, minute] = eventData.time.split(':').map(Number)
  const startDate = new Date(`${eventData.date}T00:00:00`)
  startDate.setHours(hour, minute, 0, 0)
  const endDate = new Date(startDate.getTime() + duration * 60 * 1000)
  return {
    summary: eventData.summary,
    description: eventData.description,
    start: { dateTime: formatLocal(startDate), timeZone: timezone },
    end: { dateTime: formatLocal(endDate), timeZone: timezone },
  }
}

async function createEvent(calendarId, eventData) {
  const calendar = google.calendar({ version: 'v3', auth: getAuth(calendarId) })
  const response = await calendar.events.insert({
    calendarId,
    requestBody: eventBody(eventData),
  })
  return response.data.id
}

async function updateEvent(calendarId, eventId, eventData) {
  const calendar = google.calendar({ version: 'v3', auth: getAuth(calendarId) })
  await calendar.events.update({
    calendarId,
    eventId,
    requestBody: eventBody(eventData),
  })
}

function buildDescription(data) {
  const level = LEVEL_LABELS[data.level] ?? data.level
  return [
    `Alumno: ${data.studentName}`,
    `Nivel: ${level}${data.gradeLevel ? ` - ${data.gradeLevel}` : ''}`,
    `Plantel: ${data.campus}`,
    ``,
    `Tutor: ${data.parentName}`,
    `Teléfono: ${data.parentPhone}`,
    `Correo: ${data.parentEmail}`,
  ].join('\n')
}

function sqlLiteral(v) {
  if (v == null) return 'NULL'
  return `'${String(v).replace(/'/g, "''")}'`
}

function cliQuery(sql) {
  const out = execFileSync('npx', ['@insforge/cli', 'db', 'query', '--json', sql], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  })
  return JSON.parse(out)
}

async function syncOne(appt, eventData) {
  const updates = {}
  const working = { ...appt }
  const lk = levelKey(appt.level)

  if (appt.google_event_id && lk && !working[COLS[lk]]) {
    working[COLS[lk]] = appt.google_event_id
    updates[COLS[lk]] = appt.google_event_id
  }

  for (const psic of listPsicologas()) {
    const col = COLS[psic.key]
    const eventId = working[col]
    if (eventId) {
      try {
        await updateEvent(psic.calendarId, eventId, eventData)
      } catch (e) {
        console.warn(`  update ${psic.key} falló (${e.message}), creando nuevo…`)
        const id = await createEvent(psic.calendarId, eventData)
        updates[col] = id
        working[col] = id
        if (lk === psic.key) updates.google_event_id = id
      }
      continue
    }
    const id = await createEvent(psic.calendarId, eventData)
    updates[col] = id
    working[col] = id
    if (lk === psic.key) updates.google_event_id = id
  }

  if (appt.level === 'primaria') {
    const control = process.env.GOOGLE_CALENDAR_CONTROL_ESCOLAR_PRIMARIA
    const ingles = process.env.GOOGLE_CALENDAR_INGLES_PRIMARIA
    if (control) {
      if (working.google_event_id_control_escolar) {
        try {
          await updateEvent(control, working.google_event_id_control_escolar, eventData)
        } catch (e) {
          console.warn(`  update control falló (${e.message}), creando…`)
          updates.google_event_id_control_escolar = await createEvent(control, eventData)
        }
      } else {
        updates.google_event_id_control_escolar = await createEvent(control, eventData)
      }
    }
    if (ingles) {
      if (working.google_event_id_ingles) {
        try {
          await updateEvent(ingles, working.google_event_id_ingles, eventData)
        } catch (e) {
          console.warn(`  update ingles falló (${e.message}), creando…`)
          updates.google_event_id_ingles = await createEvent(ingles, eventData)
        }
      } else {
        updates.google_event_id_ingles = await createEvent(ingles, eventData)
      }
    }
  }

  return updates
}

async function main() {
  loadEnvLocal()
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) throw new Error('Falta Google SA')

  const { rows } = cliQuery(`
SELECT id, student_name, student_last_name_p, student_last_name_m, level, grade_level, campus,
  parent_name, parent_phone, parent_email, appointment_date::text AS appointment_date, appointment_time, status,
  google_event_id, google_event_id_psic_educativo, google_event_id_psic_primaria, google_event_id_psic_secundaria,
  google_event_id_control_escolar, google_event_id_ingles
FROM admission_appointments
WHERE appointment_date >= CURRENT_DATE
  AND appointment_time IS NOT NULL AND appointment_time <> 'Por confirmar'
  AND status <> 'cancelled'
  AND (
    google_event_id_psic_educativo IS NULL
    OR google_event_id_psic_primaria IS NULL
    OR google_event_id_psic_secundaria IS NULL
    OR (level = 'primaria' AND (google_event_id_control_escolar IS NULL OR google_event_id_ingles IS NULL))
  )
ORDER BY appointment_date, appointment_time;
`)

  console.log(`Incompletas: ${rows.length}`)
  const report = []

  for (const appt of rows) {
    const studentName = [appt.student_name, appt.student_last_name_p, appt.student_last_name_m]
      .filter(Boolean)
      .join(' ')
    const date = String(appt.appointment_date).slice(0, 10)
    console.log(`→ ${studentName} (${appt.level}) ${date} ${appt.appointment_time}`)

    try {
      const updates = await syncOne(appt, {
        summary: `Examen admisión: ${studentName} (${LEVEL_LABELS[appt.level] ?? appt.level})`,
        description: buildDescription({
          studentName,
          level: appt.level,
          gradeLevel: appt.grade_level,
          parentName: appt.parent_name,
          parentPhone: appt.parent_phone,
          parentEmail: appt.parent_email,
          campus: appt.campus || '',
        }),
        date,
        time: appt.appointment_time,
      })

      if (Object.keys(updates).length > 0) {
        const sets = Object.entries(updates)
          .map(([k, v]) => `${k} = ${sqlLiteral(v)}`)
          .join(', ')
        cliQuery(`UPDATE admission_appointments SET ${sets} WHERE id = ${sqlLiteral(appt.id)};`)
        console.log('  OK:', Object.keys(updates).join(', '))
      } else {
        console.log('  (sin updates)')
      }
      report.push({ student: studentName, ok: true, updates: Object.keys(updates) })
    } catch (e) {
      console.error('  FAIL:', e.message)
      report.push({ student: studentName, ok: false, error: e.message })
    }
  }

  writeFileSync('/tmp/agendaw-backfill-report.json', JSON.stringify(report, null, 2))
  console.log('Reporte:', report)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
