import { urlCupoInscripcionApi } from '@/lib/serviciosAdminConfig'

export type ConsultaCupoInscripcion = {
  ok?: boolean
  aplica: boolean
  nivel: number
  grado: number
  etiqueta: string
  totalInscritos: number
  max: number
  lleno: boolean
  cicloInscripcion: number
  mensaje: string | null
}

const MENSAJE_CUPO_FALLBACK =
  'Por el momento el cupo de este grado se encuentra completo. Agradecemos su comprensión y le invitamos a comunicarse con Administración o Control Escolar ante cualquier apertura o indicación adicional.'

/** Grados con tope de 60 inscritos (3° y 5° Primaria). */
export function gradeLevelConCupoLimitado(level: string, gradeLevel: string): boolean {
  return level === 'primaria' && (gradeLevel === 'primaria_3' || gradeLevel === 'primaria_5')
}

/**
 * 2026-08-21 - 5° Primaria forzado a cupo lleno (como si ya hubiera 60).
 * 3° sigue consultando servicios_admin (métrica real).
 */
export function gradeLevelForzarCupoLleno(level: string, gradeLevel: string): boolean {
  return level === 'primaria' && gradeLevel === 'primaria_5'
}

/**
 * Consulta cupo vía servicios_admin (misma métrica del reporte 2.º diferido).
 */
export async function consultarCupoInscripcionAgenda(opts: {
  level: string
  grade_level: string
}): Promise<ConsultaCupoInscripcion | null> {
  if (!gradeLevelConCupoLimitado(opts.level, opts.grade_level)) {
    return null
  }

  // Bloqueo inmediato de 5° aunque la API aún no haya redeployado.
  if (gradeLevelForzarCupoLleno(opts.level, opts.grade_level)) {
    return {
      aplica: true,
      nivel: 3,
      grado: 5,
      etiqueta: '5° de Primaria',
      totalInscritos: 60,
      max: 60,
      lleno: true,
      cicloInscripcion: 0,
      mensaje: MENSAJE_CUPO_FALLBACK,
    }
  }

  const url = urlCupoInscripcionApi({
    level: opts.level,
    grade_level: opts.grade_level,
  })

  const res = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      text || `No se pudo verificar el cupo del grado (HTTP ${res.status}). Intente de nuevo.`
    )
  }

  const data = (await res.json()) as ConsultaCupoInscripcion
  return data
}

export async function assertCupoDisponibleAgenda(opts: {
  level: string
  grade_level: string
}): Promise<void> {
  const consulta = await consultarCupoInscripcionAgenda(opts)
  if (consulta?.lleno) {
    throw new Error(consulta.mensaje || MENSAJE_CUPO_FALLBACK)
  }
}
