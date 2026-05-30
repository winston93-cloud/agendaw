import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const SELECT_ALUMNO =
  'alumno_id, alumno_ref, alumno_nombre, alumno_app, alumno_apm, alumno_nombre_completo, alumno_nivel, alumno_grado, alumno_ciclo_escolar, alumno_status'

type AlumnoRow = {
  alumno_id: number
  alumno_ref: number
  alumno_nombre: string | null
  alumno_app: string | null
  alumno_apm: string | null
  alumno_nombre_completo: string | null
  alumno_nivel: number | null
  alumno_grado: number | null
  alumno_ciclo_escolar: number | null
  alumno_status: number | null
}

function escaparIlike(termino: string): string {
  return termino.replace(/[%_\\]/g, '\\$&')
}

/** Extrae número de control si el usuario escribe "20761" o "20761 — Nombre". */
function extraerRefNumerico(consulta: string): number | null {
  const limpio = consulta.trim()
  const match = limpio.match(/^(\d+)/)
  if (!match) return null
  const n = parseInt(match[1], 10)
  return Number.isNaN(n) ? null : n
}

function fusionarResultados(filas: AlumnoRow[]): AlumnoRow[] {
  const mapa = new Map<number, AlumnoRow>()
  for (const f of filas) mapa.set(f.alumno_id, f)
  return [...mapa.values()].slice(0, 8)
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  const supabase = createAdminClient()
  const esc = escaparIlike(q)
  const patron = `%${esc}%`
  const refNum = extraerRefNumerico(q)

  const acumulado: AlumnoRow[] = []

  // alumno_ref es int8: .ilike no aplica; búsqueda exacta por número de control
  if (refNum != null) {
    const { data, error } = await supabase
      .from('alumno')
      .select(SELECT_ALUMNO)
      .eq('alumno_ref', refNum)
      .not('alumno_status', 'eq', 0)
      .limit(8)

    if (error) {
      console.error('[alumno-search] ref', error)
    } else if (data?.length) {
      acumulado.push(...(data as AlumnoRow[]))
    }
  }

  if (acumulado.length < 8) {
    const { data, error } = await supabase
      .from('alumno')
      .select(SELECT_ALUMNO)
      .or(
        [
          `alumno_nombre.ilike.${patron}`,
          `alumno_app.ilike.${patron}`,
          `alumno_apm.ilike.${patron}`,
          `alumno_nombre_completo.ilike.${patron}`,
        ].join(',')
      )
      .not('alumno_status', 'eq', 0)
      .order('alumno_nombre')
      .limit(8)

    if (error) {
      console.error('[alumno-search] texto', error)
    } else if (data?.length) {
      acumulado.push(...(data as AlumnoRow[]))
    }
  }

  const resultados = fusionarResultados(acumulado).map(
    ({ alumno_status: _s, ...rest }) => rest
  )

  return NextResponse.json(resultados)
}
