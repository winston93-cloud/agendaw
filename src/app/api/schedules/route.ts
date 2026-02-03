import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return NextResponse.json({ error: 'Server config missing' }, { status: 500 })
  }
  const { searchParams } = new URL(request.url)
  const level = searchParams.get('level')
  if (!level || !['maternal_kinder', 'primaria', 'secundaria'].includes(level)) {
    return NextResponse.json({ error: 'level required: maternal_kinder | primaria | secundaria' }, { status: 400 })
  }
  const supabase = createClient(url, anonKey)
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
