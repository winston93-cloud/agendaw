import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const url     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const level = searchParams.get('level')
  const date  = searchParams.get('date')

  if (!level || !['maternal_kinder', 'primaria', 'secundaria'].includes(level)) {
    return NextResponse.json({ error: 'level requerido: maternal_kinder | primaria | secundaria' }, { status: 400 })
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date requerido en formato YYYY-MM-DD' }, { status: 400 })
  }

  const supabase = createClient(url, anonKey)
  const { data, error } = await supabase
    .from('blocked_dates')
    .select('block_time')
    .eq('level', level)
    .eq('block_date', date)
    .not('block_time', 'is', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const blockedTimes = (data || []).map((r) => r.block_time as string)
  return NextResponse.json({ blockedTimes })
}
