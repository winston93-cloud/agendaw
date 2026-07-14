import { createAdminClient as createInsforgeAdmin } from '@insforge/sdk'
import type { DbClient } from '@/lib/insforge/server'
import type { AlumnoData } from '@/lib/mysql'

/** Cliente admin a InsForge «Winston Servicios» (tabla `alumno` para Familia Winston). */
export function createWinstonServiciosClient(): DbClient {
  const baseUrl = process.env.WINSTON_SERVICIOS_URL
  const apiKey = process.env.WINSTON_SERVICIOS_API_KEY
  if (!baseUrl || !apiKey) {
    throw new Error(
      'Faltan WINSTON_SERVICIOS_URL y WINSTON_SERVICIOS_API_KEY (proyecto Winston Servicios en InsForge).'
    )
  }
  return createInsforgeAdmin({ baseUrl, apiKey }).database
}

function normalizeAlumnoText(input: string): string {
  return (input ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toUpperCase()
}

function toInt(value: string | number | undefined | null, fallback = 0): number {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10)
  return Number.isFinite(n) ? n : fallback
}

function fechaIsoHoy(): string {
  return new Date().toISOString().slice(0, 10)
}

export type CrearAlumnoWinstonResult =
  | { ok: true; alumno_id: number; alumno_ref: number; alreadyExisted?: boolean }
  | { ok: false; message: string }

/**
 * Alta en InsForge Winston Servicios (`alumno`), espejo del INSERT MySQL
 * al aprobar ingreso en AgendaW.
 *
 * Usa el mismo `alumno_ref` ya asignado en MySQL.
 */
export async function createAlumnoInWinstonServicios(
  data: AlumnoData,
  alumno_ref: number
): Promise<CrearAlumnoWinstonResult> {
  if (!Number.isFinite(alumno_ref) || alumno_ref <= 0) {
    return { ok: false, message: 'alumno_ref inválido para InsForge' }
  }

  try {
    const db = createWinstonServiciosClient()

    const existing = await db
      .from('alumno')
      .select('alumno_id, alumno_ref')
      .eq('alumno_ref', alumno_ref)
      .maybeSingle()

    if (existing.error) {
      return { ok: false, message: existing.error.message }
    }
    if (existing.data?.alumno_id) {
      console.log(
        '[WinstonServicios] Alumno ya existía ref',
        alumno_ref,
        'id',
        existing.data.alumno_id
      )
      return {
        ok: true,
        alumno_id: Number(existing.data.alumno_id),
        alumno_ref,
        alreadyExisted: true,
      }
    }

    const { data: maxRow } = await db
      .from('alumno')
      .select('alumno_id')
      .order('alumno_id', { ascending: false })
      .limit(1)
      .maybeSingle()

    const alumno_id = (Number(maxRow?.alumno_id) || 0) + 1
    const hoy = fechaIsoHoy()
    const fila = {
      alumno_id,
      alumno_ref,
      alumno_app: normalizeAlumnoText(data.alumno_app || ''),
      alumno_apm: normalizeAlumnoText(data.alumno_apm || ''),
      alumno_nombre: normalizeAlumnoText(data.alumno_nombre || ''),
      alumno_nivel: toInt(data.alumno_nivel, 1),
      alumno_grado: toInt(data.alumno_grado, 1),
      alumno_grupo: toInt(data.alumno_grupo, 0),
      alumno_status: toInt(data.alumno_status, 2),
      alumno_nuevo_ingreso: toInt(data.alumno_nuevo_ingreso, 1),
      alumno_ciclo_escolar: toInt(data.alumno_ciclo_escolar, 0),
      alumno_registro: hoy,
      alumno_alta: data.alumno_alta
        ? String(data.alumno_alta).slice(0, 10)
        : hoy,
      mes: 1,
    }

    const { error } = await db.from('alumno').insert(fila)
    if (error) {
      console.error('[WinstonServicios] Error insert alumno:', error.message)
      return { ok: false, message: error.message }
    }

    console.log('[WinstonServicios] Alumno creado ref', alumno_ref, 'id', alumno_id)
    return { ok: true, alumno_id, alumno_ref }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error InsForge Winston Servicios'
    console.error('[WinstonServicios]', msg)
    return { ok: false, message: msg }
  }
}
