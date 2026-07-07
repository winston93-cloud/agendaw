import { NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/insforge/server'
import {
  getVacationSlotsForApiLevel,
  getVacationSlotsForStudentLevel,
  isActiveVacationBookingDate,
} from '@/lib/vacationAdmission'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const level = searchParams.get('level')
  const date = searchParams.get('date')
  const studentLevel = searchParams.get('student_level')

  if (!level || !['maternal_kinder', 'primaria', 'secundaria'].includes(level)) {
    return NextResponse.json({ error: 'level required: maternal_kinder | primaria | secundaria' }, { status: 400 })
  }

  if (date && isActiveVacationBookingDate(date)) {
    const times = studentLevel
      ? getVacationSlotsForStudentLevel(studentLevel)
      : getVacationSlotsForApiLevel(level as 'maternal_kinder' | 'primaria' | 'secundaria')
    return NextResponse.json({ times, vacation: true })
  }

  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('admission_schedules')
    .select('time_slot')
    .eq('level', level)
    .order('sort_order', { ascending: true })
    .order('time_slot', { ascending: true })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  const times = (data || []).map((r) => r.time_slot)
  return NextResponse.json({ times, vacation: false })
}
