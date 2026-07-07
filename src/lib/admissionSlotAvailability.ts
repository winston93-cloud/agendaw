import type { DbClient } from '@/lib/insforge/server'
import { bookingConflictLevels, normalizeAppointmentTime } from '@/lib/admissionBooking'
import { fetchPendingRescheduleTimes } from '@/lib/pendingRescheduleSlots'
import {
  getVacationSlotConfig,
  getVacationSlotsForStudentLevel,
  isActiveVacationBookingDate,
  permissionLevelAffectsCapacityPool,
  type StudentLevel,
} from '@/lib/vacationAdmission'

const PERMISSION_TABLE = 'admission_permission_requests'

export interface SlotAvailabilityEntry {
  booked: number
  capacity: number
  full: boolean
}

export type SlotAvailabilityMap = Record<string, SlotAvailabilityEntry>

async function fetchAppointmentsForDate(
  supabase: DbClient,
  date: string,
  excludeAppointmentId?: string
) {
  const { data, error } = await supabase
    .from('admission_appointments')
    .select('id, level, appointment_time')
    .eq('appointment_date', date)
    .neq('status', 'cancelled')

  if (error || !data) return []
  return data.filter((row) => row.id !== excludeAppointmentId)
}

async function fetchPendingReschedulesForDate(supabase: DbClient, date: string) {
  const { data, error } = await supabase
    .from(PERMISSION_TABLE)
    .select('appointment_id, proposed_time, level')
    .eq('type', 'reagendar')
    .eq('status', 'pendiente')
    .eq('proposed_date', date)
    .not('proposed_time', 'is', null)

  if (error || !data) return []
  return data
}

function countVacationSlotUsage(
  time: string,
  capacityLevels: StudentLevel[],
  appointments: { level: string; appointment_time: string }[],
  pending: { level: string; proposed_time: string | null; appointment_id: string | null }[],
  excludeAppointmentId?: string
): number {
  const normalized = normalizeAppointmentTime(time)
  let count = 0

  for (const row of appointments) {
    if (!capacityLevels.includes(row.level as StudentLevel)) continue
    if (normalizeAppointmentTime(row.appointment_time) !== normalized) continue
    count += 1
  }

  for (const row of pending) {
    if (excludeAppointmentId && row.appointment_id === excludeAppointmentId) continue
    const proposed = row.proposed_time
    if (!proposed || proposed === 'Por confirmar') continue
    if (normalizeAppointmentTime(proposed) !== normalized) continue
    if (!permissionLevelAffectsCapacityPool(row.level, capacityLevels)) continue
    count += 1
  }

  return count
}

export async function getVacationSlotAvailability(
  supabase: DbClient,
  date: string,
  studentLevel: string,
  excludeAppointmentId?: string
): Promise<SlotAvailabilityMap> {
  const slots = getVacationSlotsForStudentLevel(studentLevel)
  const appointments = await fetchAppointmentsForDate(supabase, date, excludeAppointmentId)
  const pending = await fetchPendingReschedulesForDate(supabase, date)
  const availability: SlotAvailabilityMap = {}

  for (const time of slots) {
    const config = getVacationSlotConfig(time)
    if (!config) continue
    const booked = countVacationSlotUsage(
      time,
      config.capacityLevels,
      appointments,
      pending,
      excludeAppointmentId
    )
    availability[time] = {
      booked,
      capacity: config.maxCapacity,
      full: booked >= config.maxCapacity,
    }
  }

  return availability
}

export async function assertAdmissionSlotAvailable(
  supabase: DbClient,
  params: {
    date: string
    time: string
    level: string
    excludeAppointmentId?: string
  }
): Promise<void> {
  const normalizedTime = normalizeAppointmentTime(params.time)
  if (!normalizedTime || normalizedTime === 'Por confirmar') return

  if (isActiveVacationBookingDate(params.date)) {
    const config = getVacationSlotConfig(normalizedTime)
    if (!config) {
      throw new Error('Ese horario no está disponible en el periodo vacacional.')
    }
    if (!config.allowedLevels.includes(params.level as StudentLevel)) {
      throw new Error('Ese horario no aplica para el nivel seleccionado en vacaciones.')
    }

    const availability = await getVacationSlotAvailability(
      supabase,
      params.date,
      params.level,
      params.excludeAppointmentId
    )
    const slot = availability[normalizedTime]
    if (!slot || slot.full) {
      throw new Error('Ese horario ya no está disponible. Elige otra fecha u otro horario.')
    }
    return
  }

  const conflictLevels = bookingConflictLevels(params.level)
  let query = supabase
    .from('admission_appointments')
    .select('id')
    .eq('appointment_date', params.date)
    .eq('appointment_time', params.time)
    .in('level', conflictLevels)
    .neq('status', 'cancelled')
    .limit(1)

  if (params.excludeAppointmentId) {
    query = query.neq('id', params.excludeAppointmentId)
  }

  const { data: existing } = await query
  if (existing?.length) {
    throw new Error('Ese horario ya no está disponible. Elige otra fecha u otro horario.')
  }

  const pending = await fetchPendingRescheduleTimes(
    supabase,
    params.date,
    params.level,
    params.excludeAppointmentId
  )
  if (pending.includes(normalizedTime)) {
    throw new Error(
      'Ese horario tiene una reagendación pendiente de autorización. Elige otra fecha u otro horario.'
    )
  }
}
