import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const level = searchParams.get('level')
  if (!level || !['maternal_kinder', 'primaria', 'secundaria'].includes(level)) {
    return NextResponse.json({ error: 'level required: maternal_kinder | primaria | secundaria' }, { status: 400 })
  }
  const supabase = createClient(url, anonKey)
  const { data, error } = await supabase
    .from('blocked_dates')
    .select('block_date')
    .eq('level', level)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  const dates = (data || []).map((r) => r.block_date)
  return NextResponse.json({ dates })
}
