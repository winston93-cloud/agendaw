import { createAdminClient as createInsforgeAdmin } from '@insforge/sdk'
import type { DbClient } from '@/lib/insforge/server'

/** Datos de alumno para alta en Winston Servicios (misma forma que el INSERT legacy). */
export type AlumnoData = {
  alumno_app: string
  alumno_apm: string
  alumno_nombre: string
  alumno_nivel: string
  alumno_grado: string
  alumno_grupo?: string
  alumno_status: string
  alumno_nuevo_ingreso: string
  alumno_ciclo_escolar: string
  alumno_registro?: string
  alumno_alta?: string
  /** 0 = sin boleta aún (default nuevos ingresos AgendaW). */
  alumno_boleta?: string | number
  secret_key?: string
  motivo?: string
  responsable?: string
  estatus_key?: string | number
  digito?: string | number
  hijo?: string | number
}

/** Cliente admin a InsForge «Winston Servicios» (tabla `alumno`). */
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

async function siguienteAlumnoRef(db: DbClient): Promise<number> {
  const { data, error } = await db
    .from('alumno')
    .select('alumno_ref')
    .order('alumno_ref', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (Number(data?.alumno_ref) || 0) + 1
}

async function siguienteAlumnoId(db: DbClient): Promise<number> {
  const { data, error } = await db
    .from('alumno')
    .select('alumno_id')
    .order('alumno_id', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (Number(data?.alumno_id) || 0) + 1
}

/** Verifica si ya existe un alumno por nombre + apellido paterno en InsForge. */
export async function checkAlumnoExistsInWinstonServicios(
  nombre: string,
  apellido: string
): Promise<number | null> {
  try {
    const db = createWinstonServiciosClient()
    const nombreNorm = normalizeAlumnoText(nombre || '')
    const apellidoNorm = normalizeAlumnoText(apellido || '')
    const { data, error } = await db
      .from('alumno')
      .select('alumno_ref')
      .eq('alumno_nombre', nombreNorm)
      .eq('alumno_app', apellidoNorm)
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[WinstonServicios] checkAlumnoExists:', error.message)
      return null
    }
    return data?.alumno_ref != null ? Number(data.alumno_ref) : null
  } catch (e) {
    console.error('[WinstonServicios] checkAlumnoExists:', e)
    return null
  }
}

/**
 * Alta en InsForge Winston Servicios (`alumno`) al aprobar ingreso en AgendaW.
 * Asigna `alumno_ref` / `alumno_id` en InsForge (ya no escribe en MySQL/phpMyAdmin).
 *
 * Si se pasa `alumno_ref`, lo reutiliza (p. ej. reintentos); si no, toma max+1.
 */
export async function createAlumnoInWinstonServicios(
  data: AlumnoData,
  alumno_ref?: number
): Promise<CrearAlumnoWinstonResult> {
  try {
    const db = createWinstonServiciosClient()

    const ref =
      alumno_ref != null && Number.isFinite(alumno_ref) && alumno_ref > 0
        ? Number(alumno_ref)
        : await siguienteAlumnoRef(db)

    const existing = await db
      .from('alumno')
      .select('alumno_id, alumno_ref')
      .eq('alumno_ref', ref)
      .maybeSingle()

    if (existing.error) {
      return { ok: false, message: existing.error.message }
    }
    if (existing.data?.alumno_id) {
      console.log(
        '[WinstonServicios] Alumno ya existía ref',
        ref,
        'id',
        existing.data.alumno_id
      )
      return {
        ok: true,
        alumno_id: Number(existing.data.alumno_id),
        alumno_ref: ref,
        alreadyExisted: true,
      }
    }

    const alumno_id = await siguienteAlumnoId(db)
    const hoy = fechaIsoHoy()
    // 2026-07-24 - alumno_boleta es NOT NULL en Winston Servicios; nuevos ingresos usan 0
    const fila = {
      alumno_id,
      alumno_ref: ref,
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
      alumno_alta: data.alumno_alta ? String(data.alumno_alta).slice(0, 10) : hoy,
      alumno_boleta: toInt(data.alumno_boleta, 0),
      mes: 1,
      secret_key: data.secret_key?.trim() || '',
      motivo: data.motivo?.trim() || '',
      responsable: data.responsable?.trim() || 'agendaw',
      estatus_key: toInt(data.estatus_key, 0),
      digito: toInt(data.digito, 0),
      hijo: toInt(data.hijo, 0),
    }

    const { error } = await db.from('alumno').insert(fila)
    if (error) {
      console.error('[WinstonServicios] Error insert alumno:', error.message)
      return { ok: false, message: error.message }
    }

    console.log('[WinstonServicios] Alumno creado ref', ref, 'id', alumno_id)
    return { ok: true, alumno_id, alumno_ref: ref }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error InsForge Winston Servicios'
    console.error('[WinstonServicios]', msg)
    return { ok: false, message: msg }
  }
}
