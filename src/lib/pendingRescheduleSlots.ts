import type { DbClient } from '@/lib/supabase/server'
import { normalizeAppointmentTime, permissionRequestLevel } from '@/lib/admissionBooking'

const PERMISSION_TABLE = 'admission_permission_requests'

/** Horarios reservados por reagendaciones pendientes de autorización de dirección */
export async function fetchPendingRescheduleTimes(
  supabase: DbClient,
  date: string,
  level: string,
  excludeAppointmentId?: string
): Promise<string[]> {
  const permLevel = permissionRequestLevel(level)
  if (!permLevel) return []

  const { data, error } = await supabase
    .from(PERMISSION_TABLE)
    .select('proposed_time, appointment_id')
    .eq('type', 'reagendar')
    .eq('status', 'pendiente')
    .eq('proposed_date', date)
    .eq('level', permLevel)
    .not('proposed_time', 'is', null)

  if (error || !data) return []

  return [
    ...new Set(
      data
        .filter((row) => {
          const time = row.proposed_time as string | null
          if (!time || time === 'Por confirmar') return false
          if (excludeAppointmentId && row.appointment_id === excludeAppointmentId) return false
          return true
        })
        .map((row) => normalizeAppointmentTime(row.proposed_time as string))
    ),
  ]
}
