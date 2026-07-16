/**
 * Backfill: replica citas futuras incompletas en los calendarios de las 3 psicólogas.
 * Protegido con CRON_SECRET (Authorization: Bearer … o ?secret=).
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/insforge/server'
import {
  buildAdmisionEventDescription,
  syncAdmissionCalendarEvents,
} from '@/lib/googleCalendar'

const LEVEL_LABELS: Record<string, string> = {
  maternal: 'Maternal',
  kinder: 'Kinder',
  primaria: 'Primaria',
  secundaria: 'Secundaria',
}

function authorize(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get('authorization')
  if (auth === `Bearer ${secret}`) return true
  const url = new URL(req.url)
  return url.searchParams.get('secret') === secret
}

export async function POST(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    const today = new Date().toISOString().slice(0, 10)

    const { data: appointments, error } = await supabase
      .from('admission_appointments')
      .select(
        'id, student_name, student_last_name_p, student_last_name_m, level, grade_level, campus, parent_name, parent_phone, parent_email, appointment_date, appointment_time, status, google_event_id, google_event_id_psic_educativo, google_event_id_psic_primaria, google_event_id_psic_secundaria, google_event_id_control_escolar, google_event_id_ingles'
      )
      .gte('appointment_date', today)
      .neq('appointment_time', 'Por confirmar')
      .not('appointment_time', 'is', null)
      .neq('status', 'cancelled')
      .order('appointment_date', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const incomplete = (appointments ?? []).filter((a) => {
      const missingPsic =
        !a.google_event_id_psic_educativo ||
        !a.google_event_id_psic_primaria ||
        !a.google_event_id_psic_secundaria
      const missingPrimariaExtras =
        a.level === 'primaria' &&
        (!a.google_event_id_control_escolar || !a.google_event_id_ingles)
      return missingPsic || missingPrimariaExtras || !a.google_event_id
    })

    const results: Array<{
      id: string
      student: string
      level: string
      ok: boolean
      updates?: string[]
      error?: string
    }> = []

    for (const appt of incomplete) {
      const studentName = [appt.student_name, appt.student_last_name_p, appt.student_last_name_m]
        .filter(Boolean)
        .join(' ')
      const date =
        typeof appt.appointment_date === 'string'
          ? appt.appointment_date.slice(0, 10)
          : String(appt.appointment_date).slice(0, 10)

      try {
        const calendarUpdates = await syncAdmissionCalendarEvents(appt.level, appt, {
          summary: `Examen admisión: ${studentName} (${LEVEL_LABELS[appt.level] ?? appt.level})`,
          description: buildAdmisionEventDescription({
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

        if (Object.keys(calendarUpdates).length > 0) {
          const { error: updErr } = await supabase
            .from('admission_appointments')
            .update(calendarUpdates)
            .eq('id', appt.id)
          if (updErr) throw new Error(updErr.message)
        }

        results.push({
          id: appt.id,
          student: studentName,
          level: appt.level,
          ok: true,
          updates: Object.keys(calendarUpdates),
        })
      } catch (e) {
        results.push({
          id: appt.id,
          student: studentName,
          level: appt.level,
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        })
      }
    }

    return NextResponse.json({
      success: true,
      scanned: appointments?.length ?? 0,
      incomplete: incomplete.length,
      synced: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}
