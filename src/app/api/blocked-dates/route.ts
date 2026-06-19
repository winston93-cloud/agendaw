import { NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/insforge/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const level = searchParams.get('level')
  if (!level || !['maternal_kinder', 'primaria', 'secundaria'].includes(level)) {
    return NextResponse.json({ error: 'level required: maternal_kinder | primaria | secundaria' }, { status: 400 })
  }
  const supabase = createPublicClient()
  // Solo devolver días con bloqueo completo (block_time IS NULL)
  // Los días con bloqueo parcial por horario siguen disponibles para agendar
  const { data, error } = await supabase
    .from('blocked_dates')
    .select('block_date')
    .eq('level', level)
    .is('block_time', null)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  const dates = (data || []).map((r) => r.block_date)
  return NextResponse.json({ dates })
}
