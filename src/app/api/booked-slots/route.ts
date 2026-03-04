import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Grupos de campus: mismos niveles comparten psicóloga y no se pueden duplicar horario
const CAMPUS_GROUPS: Record<string, string[]> = {
  maternal:        ['maternal', 'kinder'],
  kinder:          ['maternal', 'kinder'],
  maternal_kinder: ['maternal', 'kinder'],
  primaria:        ['primaria', 'secundaria'],
  secundaria:      ['primaria', 'secundaria'],
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const level = searchParams.get('level')
  const date  = searchParams.get('date')

  if (!level || !CAMPUS_GROUPS[level]) {
    return NextResponse.json(
      { error: 'level required: maternal | kinder | maternal_kinder | primaria | secundaria' },
      { status: 400 }
    )
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date required (YYYY-MM-DD)' }, { status: 400 })
  }

  const excludeId  = searchParams.get('exclude_id') || undefined
  const levelsToCheck = CAMPUS_GROUPS[level]

  try {
    const supabase = createAdminClient()
    let query = supabase
      .from('admission_appointments')
      .select('appointment_time')
      .eq('appointment_date', date)
      .in('level', levelsToCheck)
      .neq('status', 'cancelled')
    if (excludeId) query = query.neq('id', excludeId)
    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const times = [...new Set((data || []).map((r) => r.appointment_time).filter(Boolean))]
    return NextResponse.json({ times })
  } catch {
    return NextResponse.json({ times: [] })
  }
}
