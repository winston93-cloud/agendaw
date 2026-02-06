'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { AdmissionLevel } from '@/types/database'

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
    .order('appointment_date', { ascending: true })
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
