import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('alumno')
    .select('alumno_id, alumno_ref, alumno_nombre, alumno_app, alumno_apm, alumno_nombre_completo, alumno_nivel, alumno_grado, alumno_ciclo_escolar')
    .or(
      `alumno_ref.ilike.%${q}%,alumno_nombre.ilike.%${q}%,alumno_app.ilike.%${q}%,alumno_nombre_completo.ilike.%${q}%`
    )
    .not('alumno_status', 'eq', 0)
    .order('alumno_nombre')
    .limit(8)

  if (error) {
    console.error('[alumno-search]', error)
    return NextResponse.json([])
  }

  return NextResponse.json(data ?? [])
}
