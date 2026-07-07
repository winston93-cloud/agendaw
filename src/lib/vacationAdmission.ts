import { normalizeAppointmentTime } from '@/lib/admissionBooking'

/** Periodo vacacional: admisiones con 2 psicólogas por día y 3 bloques fijos. */
export const VACATION_START = '2026-07-15'
export const VACATION_END = '2026-08-07'

export type StudentLevel = 'maternal' | 'kinder' | 'primaria' | 'secundaria'

export interface VacationSlotConfig {
  time: string
  allowedLevels: StudentLevel[]
  capacityLevels: StudentLevel[]
  maxCapacity: number
}

export const VACATION_SLOTS: VacationSlotConfig[] = [
  {
    time: '08:10',
    allowedLevels: ['maternal', 'kinder'],
    capacityLevels: ['maternal', 'kinder'],
    maxCapacity: 2,
  },
  {
    time: '09:40',
    allowedLevels: ['primaria', 'secundaria'],
    capacityLevels: ['primaria', 'secundaria'],
    maxCapacity: 2,
  },
  {
    time: '12:00',
    allowedLevels: ['maternal', 'kinder', 'primaria', 'secundaria'],
    capacityLevels: ['maternal', 'kinder', 'primaria', 'secundaria'],
    maxCapacity: 2,
  },
]

const SLOT_BY_TIME = new Map(VACATION_SLOTS.map((s) => [s.time, s]))

export function isVacationAdmissionDate(date: string): boolean {
  return date >= VACATION_START && date <= VACATION_END
}

export function isVacationWeekday(date: string): boolean {
  const [y, m, d] = date.split('-').map(Number)
  const day = new Date(y, m - 1, d).getDay()
  return day >= 1 && day <= 5
}

export function isActiveVacationBookingDate(date: string): boolean {
  return isVacationAdmissionDate(date) && isVacationWeekday(date)
}

export function getVacationSlotConfig(time: string): VacationSlotConfig | null {
  return SLOT_BY_TIME.get(normalizeAppointmentTime(time)) ?? null
}

export function getVacationSlotsForStudentLevel(level: string): string[] {
  return VACATION_SLOTS.filter((s) => s.allowedLevels.includes(level as StudentLevel)).map(
    (s) => s.time
  )
}

export function getVacationSlotsForApiLevel(
  apiLevel: 'maternal_kinder' | 'primaria' | 'secundaria'
): string[] {
  if (apiLevel === 'maternal_kinder') return ['08:10', '12:00']
  return ['09:40', '12:00']
}

export function permissionLevelAffectsCapacityPool(
  permissionLevel: string,
  capacityLevels: StudentLevel[]
): boolean {
  if (permissionLevel === 'maternal_kinder') {
    return capacityLevels.includes('maternal') || capacityLevels.includes('kinder')
  }
  if (permissionLevel === 'primaria') return capacityLevels.includes('primaria')
  if (permissionLevel === 'secundaria') return capacityLevels.includes('secundaria')
  return false
}
