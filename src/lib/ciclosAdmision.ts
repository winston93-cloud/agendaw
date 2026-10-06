import { createAdminClient } from '@/lib/insforge/server'

export type CicloAdmision = {
  /** "2026-2027" — formato guardado en admission_appointments.school_cycle */
  value: string
  /** Número de ciclo de Winston (año final − 2004): 2026-2027 → 23, 2027-2028 → 24 */
  numero: number
  inicio: number
  fin: number
  /** true = ciclo en curso (es_actual); false = el siguiente */
  actual: boolean
}

function ciclo(inicio: number, actual: boolean): CicloAdmision {
  return { value: `${inicio}-${inicio + 1}`, numero: inicio + 1 - 2004, inicio, fin: inicio + 1, actual }
}

/**
 * Ciclos que se pueden reservar: el de temporada (ciclos_escolares.es_actual) y el siguiente
 * (p. ej. 22→23, 23→24). Si la BD no responde, se calcula por fecha (el ciclo inicia en agosto).
 */
export async function ciclosAdmision(): Promise<CicloAdmision[]> {
  let inicio = 0
  try {
    const { data } = await createAdminClient()
      .from('ciclos_escolares')
      .select('anio_inicio')
      .eq('es_actual', true)
      .limit(1)
      .maybeSingle()
    inicio = Number((data as { anio_inicio?: unknown } | null)?.anio_inicio) || 0
  } catch {
    inicio = 0
  }
  if (!inicio) {
    const hoy = new Date()
    inicio = hoy.getMonth() >= 7 ? hoy.getFullYear() : hoy.getFullYear() - 1
  }
  return [ciclo(inicio, true), ciclo(inicio + 1, false)]
}
