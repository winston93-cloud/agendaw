import { NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const level = searchParams.get('level')
  if (!level || !['maternal_kinder', 'primaria', 'secundaria'].includes(level)) {
    return NextResponse.json({ error: 'level required: maternal_kinder | primaria | secundaria' }, { status: 400 })
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
  return NextResponse.json({ times })
}
