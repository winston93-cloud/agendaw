'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { AdmissionLevel } from '@/types/database'
import { createAlumnoInMySQL, checkAlumnoExists as checkAlumnoExistsInMySQL, type AlumnoData } from '@/lib/mysql'
import { sendRecorridoConfirmationToParent, sendRecorridoNotificationToDirector, sendRecorridoReagendacionToParent, sendRecorridoReagendacionToDirector } from '@/lib/email'
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getVinculacionCalendarId,
  buildRecorridoEventDescription,
} from '@/lib/googleCalendar'
import { sendSlackRecorrido } from '@/lib/slack'

// Verificar disponibilidad completa
export async function getFullyBookedDates(level: AdmissionLevel, excludeAppointmentId?: string): Promise<string[]> {
  try {
    const supabase = createAdminClient()
    
    // 1. Obtener total de slots disponibles por día para este nivel
    const { count: totalSlots, error: countError } = await supabase
      .from('admission_schedules')
      .select('*', { count: 'exact', head: true })
      .eq('level', level)
    
    if (countError || !totalSlots) return []

    // 2. Obtener conteo de citas por fecha (solo futuras o recientes para no cargar todo)
    // Filtramos citas canceladas. Si hay excludeAppointmentId, la excluimos.
    const today = new Date().toISOString().split('T')[0]
    
    let query = supabase
      .from('admission_appointments')
      .select('appointment_date')
      .eq('level', level)
      .neq('status', 'cancelled')
      .gte('appointment_date', today)
    
    if (excludeAppointmentId) {
      query = query.neq('id', excludeAppointmentId)
    }

    const { data: appointments, error: appError } = await query
    
    if (appError || !appointments) return []

    // 3. Agrupar y contar
    const counts: Record<string, number> = {}
    appointments.forEach(a => {
      counts[a.appointment_date] = (counts[a.appointment_date] || 0) + 1
    })

    // 4. Filtrar fechas llenas
    return Object.keys(counts).filter(date => counts[date] >= totalSlots)
  } catch (e) {
    console.error('Error checking full dates:', e)
    return []
  }
}

export async function getAdmissionAppointments(filters?: { date?: string; level?: string; status?: string }) {
  let supabase
  try {
    supabase = createAdminClient()
  } catch {
    return []
  }
  let query = supabase
    .from('admission_appointments')
    .select('*')
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: true })

  if (filters?.date) query = query.eq('appointment_date', filters.date)
  if (filters?.level) query = query.eq('level', filters.level)
  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

/** Búsqueda para panel: por nombre (alumno/tutor), fecha de agendación (created_at) o fecha de examen (appointment_date) */
export async function searchAdmissionAppointments(params: {
  name?: string
  createdDate?: string
  appointmentDate?: string
}) {
  let supabase
  try {
    supabase = createAdminClient()
  } catch {
    return []
  }
  let query = supabase
    .from('admission_appointments')
    .select('*')
    .order('appointment_date', { ascending: false })
    .order('created_at', { ascending: false })

  const name = params.name?.trim()
  if (name && name.length >= 2) {
    const safe = name.replace(/'/g, "''")
    query = query.or(`student_name.ilike.%${safe}%,parent_name.ilike.%${safe}%`)
  }
  if (params.createdDate) {
    const start = `${params.createdDate}T00:00:00.000Z`
    const end = `${params.createdDate}T23:59:59.999Z`
    query = query.gte('created_at', start).lte('created_at', end)
  }
  if (params.appointmentDate) {
    query = query.eq('appointment_date', params.appointmentDate)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

export async function updateAppointment(
  id: string,
  updates: { appointment_date?: string; appointment_time?: string; status?: string; notes?: string }
) {
  const supabase = createAdminClient()

  if (updates.appointment_date != null && updates.appointment_time != null) {
    const { data: current } = await supabase.from('admission_appointments').select('level').eq('id', id).single()
    if (current?.level) {
      const { data: existing } = await supabase
        .from('admission_appointments')
        .select('id')
        .eq('appointment_date', updates.appointment_date)
        .eq('appointment_time', updates.appointment_time)
        .eq('level', current.level)
        .neq('id', id)
        .neq('status', 'cancelled')
        .limit(1)
      if (existing?.length) {
        throw new Error('Ese horario ya está ocupado por otra cita del mismo nivel. Elige otra fecha u horario.')
      }
    }
  }

  const { error } = await supabase
    .from('admission_appointments')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

/**
 * Marca una cita como completada y crea el alumno en MySQL
 * Retorna el alumno_ref asignado en MySQL
 */
export async function completeAdmissionAndCreateAlumno(appointmentId: string): Promise<{
  success: boolean
  alumno_ref?: number
  message: string
}> {
  try {
    const supabase = createAdminClient()
    
    // Obtener datos completos de la cita y expediente
    const { data: appointment } = await supabase
      .from('admission_appointments')
      .select('*')
      .eq('id', appointmentId)
      .single()
    
    if (!appointment) {
      return { success: false, message: 'No se encontró la cita' }
    }

    const { data: expediente } = await supabase
      .from('expediente_inicial')
      .select('*')
      .eq('appointment_id', appointmentId)
      .single()

    if (!expediente) {
      return { success: false, message: 'El alumno no ha llenado el expediente inicial' }
    }

    // Mapear nivel a número para MySQL
    const nivelMap: Record<string, string> = {
      maternal: '1',
      kinder: '2',
      primaria: '3',
      secundaria: '4',
    }

    // Verificar si ya existe el alumno
    const existingRef = await checkAlumnoExistsInMySQL(
      expediente.nombre_alumno || appointment.student_name,
      expediente.apellido_paterno_alumno || appointment.student_last_name_p || ''
    )

    if (existingRef) {
      return {
        success: false,
        message: `El alumno ya existe con referencia ${existingRef}`,
      }
    }

    // Convertir ciclo "2025-2026" → "22", "2026-2027" → "23" (año final - 2004)
    const rawCiclo = expediente.ciclo_escolar || appointment.school_cycle || ''
    const parsedCiclo = (() => {
      const parts = rawCiclo.split('-')
      if (parts.length >= 2) {
        const endYear = parseInt(parts[parts.length - 1].trim(), 10)
        if (!isNaN(endYear) && endYear > 2000) return String(endYear - 2004)
      }
      return rawCiclo
    })()

    // Crear alumno en MySQL
    const alumnoData: AlumnoData = {
      alumno_app: expediente.apellido_paterno_alumno || appointment.student_last_name_p || '',
      alumno_apm: expediente.apellido_materno_alumno || appointment.student_last_name_m || '',
      alumno_nombre: expediente.nombre_alumno || appointment.student_name || '',
      alumno_nivel: nivelMap[appointment.level] || '1',
      alumno_grado: expediente.grado || '',
      alumno_grupo: '',
      alumno_status: '2',
      alumno_nuevo_ingreso: '1', // Nuevo ingreso de agenda
      alumno_ciclo_escolar: parsedCiclo,
    }

    const alumno_ref = await createAlumnoInMySQL(alumnoData)

    // Actualizar status en Supabase
    await supabase
      .from('admission_appointments')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)

    return {
      success: true,
      alumno_ref,
      message: `✓ Alta exitosa. Alumno creado con referencia: ${alumno_ref}`,
    }
  } catch (error) {
    console.error('[completeAdmission]', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al crear alumno en MySQL',
    }
  }
}

/**
 * Verifica si existen expedientes para múltiples citas en una sola consulta
 */
export async function checkExpedientesBatch(appointmentIds: string[]): Promise<Record<string, boolean>> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('expediente_inicial')
    .select('appointment_id')
    .in('appointment_id', appointmentIds)
  
  const map: Record<string, boolean> = {}
  data?.forEach((row: { appointment_id: string | null }) => {
    if (row.appointment_id) map[row.appointment_id] = true
  })
  return map
}

export async function checkExpedienteExists(appointmentId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('expediente_inicial')
    .select('id')
    .eq('appointment_id', appointmentId)
    .single()
  return !!data
}

export async function getBlockedDates(level?: AdmissionLevel) {
  let supabase
  try {
    supabase = createAdminClient()
  } catch {
    return []
  }
  let query = supabase.from('blocked_dates').select('*').order('block_date', { ascending: true })
  if (level) query = query.eq('level', level)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

export async function blockDate(block_date: string, level: AdmissionLevel, reason?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('blocked_dates').insert({ block_date, level, reason })
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin')
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al bloquear el día.'
    return { ok: false, error: msg }
  }
}

export async function unblockDate(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('blocked_dates').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin')
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al desbloquear.'
    return { ok: false, error: msg }
  }
}

// Horarios por nivel (1, 2 o 3 por día; lunes a viernes)
export async function getSchedules(level?: AdmissionLevel) {
  let supabase
  try {
    supabase = createAdminClient()
  } catch {
    return []
  }
  let query = supabase.from('admission_schedules').select('*').order('sort_order', { ascending: true }).order('time_slot', { ascending: true })
  if (level) query = query.eq('level', level)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

export async function addSchedule(level: AdmissionLevel, time_slot: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    const normalized = time_slot.trim().slice(0, 5)
    if (!/^\d{1,2}:\d{2}$/.test(normalized)) return { ok: false, error: 'Formato de hora inválido (usa HH:MM)' }
    const { data: existing } = await supabase.from('admission_schedules').select('id').eq('level', level).eq('time_slot', normalized).maybeSingle()
    if (existing) return { ok: false, error: 'Ese horario ya existe para este nivel' }
    const { data: max } = await supabase.from('admission_schedules').select('sort_order').eq('level', level).order('sort_order', { ascending: false }).limit(1).maybeSingle()
    const sort_order = (max?.sort_order ?? -1) + 1
    const { error } = await supabase.from('admission_schedules').insert({ level, time_slot: normalized, sort_order })
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin')
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al agregar horario.'
    return { ok: false, error: msg }
  }
}

export async function removeSchedule(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('admission_schedules').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin')
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al eliminar horario.'
    return { ok: false, error: msg }
  }
}

// --- Recorridos programados ---
const RECORRIDO_LEVELS = ['maternal', 'kinder', 'primaria', 'secundaria'] as const
type TourLevel = (typeof RECORRIDO_LEVELS)[number]

function plantelGroup(level: TourLevel): 'maternal_kinder' | 'primaria_secundaria' {
  return level === 'maternal' || level === 'kinder' ? 'maternal_kinder' : 'primaria_secundaria'
}

export async function getRecorridos() {
  let supabase
  try {
    supabase = createAdminClient()
  } catch {
    return []
  }
  const { data, error } = await supabase
    .from('tour_recorridos')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createRecorrido(input: {
  level: TourLevel
  tour_date: string
  tour_time: string
  parent_name: string
  parent_phone: string
  parent_email: string
  notes?: string
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    const group = plantelGroup(input.level)
    const otherLevels = group === 'maternal_kinder' ? ['maternal', 'kinder'] : ['primaria', 'secundaria']
    const timeNorm = input.tour_time.trim().slice(0, 5)
    if (!/^\d{1,2}:\d{2}$/.test(timeNorm)) return { ok: false, error: 'Hora inválida (usa HH:MM)' }
    const { data: conflict } = await supabase
      .from('tour_recorridos')
      .select('id')
      .eq('tour_date', input.tour_date)
      .eq('tour_time', timeNorm)
      .in('level', otherLevels)
      .limit(1)
      .maybeSingle()
    if (conflict) {
      return {
        ok: false,
        error: `Ya existe un recorrido para ese día y hora en el plantel (${group === 'maternal_kinder' ? 'Maternal/Kinder' : 'Primaria/Secundaria'}). Elige otro horario.`,
      }
    }
    const row = {
      level: input.level,
      tour_date: input.tour_date,
      tour_time: timeNorm,
      parent_name: input.parent_name.trim(),
      parent_phone: input.parent_phone.trim(),
      parent_email: input.parent_email.trim(),
      notes: input.notes?.trim() || null,
    }
    const { data: inserted, error } = await supabase.from('tour_recorridos').insert(row).select('id').single()
    if (error || !inserted) return { ok: false, error: error?.message ?? 'Error al crear recorrido' }

    const levelLabel = { maternal: 'Maternal', kinder: 'Kinder', primaria: 'Primaria', secundaria: 'Secundaria' }[input.level]
    const parentData = {
      parentName: row.parent_name,
      parentEmail: row.parent_email,
      parentPhone: row.parent_phone,
      levelLabel,
      level: input.level,
      tourDate: row.tour_date,
      tourTime: row.tour_time,
    }
    const [parentResult, directorResult] = await Promise.all([
      sendRecorridoConfirmationToParent(parentData),
      sendRecorridoNotificationToDirector(input.level, parentData),
    ])
    const calendarUpdates: Record<string, unknown> = {
      email_parent_sent: parentResult.ok,
      email_director_sent: directorResult.ok,
      updated_at: new Date().toISOString(),
    }

    // Crear evento en Google Calendar de vinculación
    const calendarId = getVinculacionCalendarId(input.level)
    if (calendarId) {
      try {
        const calResult = await createCalendarEvent(calendarId, {
          summary: `Recorrido ${levelLabel}: ${row.parent_name}`,
          description: buildRecorridoEventDescription({
            level: input.level,
            parentName: row.parent_name,
            parentPhone: row.parent_phone,
            parentEmail: row.parent_email,
            notes: row.notes ?? undefined,
          }),
          date: row.tour_date,
          time: row.tour_time,
          durationMinutes: 30,
        })
        if (calResult.ok && calResult.eventId) {
          calendarUpdates.google_event_id = calResult.eventId
        } else {
          console.warn('[createRecorrido] Google Calendar error:', calResult.error)
        }
      } catch (e) {
        console.warn('[createRecorrido] Google Calendar excepción:', e)
      }
    }

    await supabase.from('tour_recorridos').update(calendarUpdates).eq('id', inserted.id)
    if (!parentResult.ok) console.error('[createRecorrido] Error email al papá:', parentResult.error)
    if (!directorResult.ok) console.error('[createRecorrido] Error email a directora:', directorResult.error)

    // Notificación a Slack #recorridos
    try {
      const slackResult = await sendSlackRecorrido({
        level: input.level,
        tour_date: row.tour_date,
        tour_time: row.tour_time,
        parent_name: row.parent_name,
        parent_phone: row.parent_phone,
        parent_email: row.parent_email,
        notes: row.notes,
      })
      if (!slackResult.ok) console.warn('[createRecorrido] Slack error:', slackResult.error)
    } catch (e) {
      console.warn('[createRecorrido] Slack excepción:', e)
    }

    revalidatePath('/admin')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error al crear recorrido.' }
  }
}

export async function updateRecorrido(
  id: string,
  input: {
    level?: TourLevel
    tour_date?: string
    tour_time?: string
    parent_name?: string
    parent_phone?: string
    parent_email?: string
    notes?: string
  }
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    const { data: current } = await supabase.from('tour_recorridos').select('level, tour_date, tour_time, parent_name, parent_phone, parent_email').eq('id', id).single()
    if (!current) return { ok: false, error: 'Recorrido no encontrado' }
    const level = (input.level ?? current.level) as TourLevel
    const tour_date = input.tour_date ?? current.tour_date
    const tour_time = (input.tour_time ?? current.tour_time).trim().slice(0, 5)
    if (!/^\d{1,2}:\d{2}$/.test(tour_time)) return { ok: false, error: 'Hora inválida (usa HH:MM)' }
    const group = plantelGroup(level)
    const otherLevels = group === 'maternal_kinder' ? ['maternal', 'kinder'] : ['primaria', 'secundaria']
    const { data: conflict } = await supabase
      .from('tour_recorridos')
      .select('id')
      .eq('tour_date', tour_date)
      .eq('tour_time', tour_time)
      .in('level', otherLevels)
      .neq('id', id)
      .limit(1)
      .maybeSingle()
    if (conflict) {
      return {
        ok: false,
        error: `Ya existe otro recorrido para ese día y hora en el plantel (${group === 'maternal_kinder' ? 'Maternal/Kinder' : 'Primaria/Secundaria'}).`,
      }
    }
    const dateOrTimeChanged =
      (input.tour_date != null && input.tour_date !== current.tour_date) ||
      (input.tour_time != null && tour_time !== (current.tour_time ?? '').trim().slice(0, 5))

    const finalParentName = (input.parent_name ?? current.parent_name)?.trim() ?? ''
    const finalParentPhone = (input.parent_phone ?? current.parent_phone)?.trim() ?? ''
    const finalParentEmail = (input.parent_email ?? current.parent_email)?.trim() ?? ''

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      ...(input.level != null && { level: input.level }),
      ...(input.tour_date != null && { tour_date: input.tour_date }),
      ...(input.tour_time != null && { tour_time }),
      ...(input.parent_name != null && { parent_name: input.parent_name.trim() }),
      ...(input.parent_phone != null && { parent_phone: input.parent_phone.trim() }),
      ...(input.parent_email != null && { parent_email: input.parent_email.trim() }),
      ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
    }
    const { error } = await supabase.from('tour_recorridos').update(updates).eq('id', id)
    if (error) return { ok: false, error: error.message }

    // Actualizar evento en Google Calendar si cambió fecha/hora
    if (dateOrTimeChanged) {
      const { data: recorridoRow } = await supabase
        .from('tour_recorridos')
        .select('google_event_id')
        .eq('id', id)
        .single()
      const existingEventId = recorridoRow?.google_event_id
      const calendarId = getVinculacionCalendarId(level)
      if (calendarId && existingEventId) {
        try {
          const levelLabel = { maternal: 'Maternal', kinder: 'Kinder', primaria: 'Primaria', secundaria: 'Secundaria' }[level]
          await updateCalendarEvent(calendarId, existingEventId, {
            summary: `Recorrido ${levelLabel}: ${finalParentName}`,
            description: buildRecorridoEventDescription({
              level,
              parentName: finalParentName,
              parentPhone: finalParentPhone,
              parentEmail: finalParentEmail,
            }),
            date: tour_date,
            time: tour_time,
            durationMinutes: 30,
          })
        } catch (e) {
          console.warn('[updateRecorrido] Google Calendar error:', e)
        }
      }
    }

    if (dateOrTimeChanged) {
      const levelLabel = { maternal: 'Maternal', kinder: 'Kinder', primaria: 'Primaria', secundaria: 'Secundaria' }[level]
      const parentData = {
        parentName: finalParentName,
        parentPhone: finalParentPhone,
        parentEmail: finalParentEmail,
        levelLabel,
        level,
        tourDate: tour_date,
        tourTime: tour_time,
      }
      const [parentResult, directorResult] = await Promise.all([
        sendRecorridoReagendacionToParent(parentData),
        sendRecorridoReagendacionToDirector(level, parentData),
      ])
      await supabase
        .from('tour_recorridos')
        .update({
          email_parent_sent: parentResult.ok,
          email_director_sent: directorResult.ok,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (!parentResult.ok) console.error('[updateRecorrido] Error email reagendación al papá:', parentResult.error)
      if (!directorResult.ok) console.error('[updateRecorrido] Error email reagendación a directora:', directorResult.error)
    }

    revalidatePath('/admin')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error al actualizar recorrido.' }
  }
}

export async function deleteRecorrido(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Obtener google_event_id antes de eliminar
    const { data: recorridoRow } = await supabase
      .from('tour_recorridos')
      .select('google_event_id, level')
      .eq('id', id)
      .single()

    const { error } = await supabase.from('tour_recorridos').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }

    // Eliminar evento de Google Calendar
    if (recorridoRow?.google_event_id && recorridoRow?.level) {
      const calendarId = getVinculacionCalendarId(recorridoRow.level)
      if (calendarId) {
        try {
          await deleteCalendarEvent(calendarId, recorridoRow.google_event_id)
        } catch (e) {
          console.warn('[deleteRecorrido] Google Calendar error:', e)
        }
      }
    }

    revalidatePath('/admin')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error al eliminar recorrido.' }
  }
}
