import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendSlackRecorridoReminder } from '@/lib/slack'

// Cron job llamado cada 5 minutos por cron-job.org
// Detecta recorridos cuya hora sea en ~15 minutos y manda recordatorio a Slack #recorridos

export async function GET(req: NextRequest) {
  // Verificar token de seguridad para que solo cron-job.org pueda llamar este endpoint
  const authHeader = req.headers.get('x-cron-secret')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()

    // Hora actual en zona horaria de México (UTC-6)
    const nowUtc = new Date()
    const offsetMs = -6 * 60 * 60 * 1000
    const nowMx = new Date(nowUtc.getTime() + offsetMs)

    const todayMx = nowMx.toISOString().split('T')[0]

    // Ventana: recorridos cuya hora esté entre ahora+13min y ahora+17min
    const windowStart = new Date(nowMx.getTime() + 13 * 60 * 1000)
    const windowEnd = new Date(nowMx.getTime() + 17 * 60 * 1000)

    const pad = (n: number) => String(n).padStart(2, '0')
    const windowStartStr = `${pad(windowStart.getHours())}:${pad(windowStart.getMinutes())}`
    const windowEndStr = `${pad(windowEnd.getHours())}:${pad(windowEnd.getMinutes())}`

    const { data: recorridos, error } = await supabase
      .from('tour_recorridos')
      .select('id, level, tour_time, student_name, parent_name')
      .eq('tour_date', todayMx)
      .eq('slack_reminder_sent', false)
      .gte('tour_time', windowStartStr)
      .lte('tour_time', windowEndStr)

    if (error) {
      console.error('[cron/slack-recorridos] Error consultando recorridos:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!recorridos || recorridos.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 })
    }

    let sent = 0
    for (const r of recorridos) {
      const result = await sendSlackRecorridoReminder({
        level: r.level,
        tour_time: r.tour_time,
        student_name: r.student_name,
        parent_name: r.parent_name,
      })

      if (result.ok) {
        await supabase
          .from('tour_recorridos')
          .update({ slack_reminder_sent: true })
          .eq('id', r.id)
        sent++
      }
    }

    return NextResponse.json({ ok: true, sent })
  } catch (e) {
    console.error('[cron/slack-recorridos] Excepción:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
