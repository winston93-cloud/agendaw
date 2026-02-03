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

export async function updateAppointment(
  id: string,
  updates: { appointment_date?: string; appointment_time?: string; status?: string; notes?: string }
) {
  const supabase = createAdminClient()
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

export async function blockDate(block_date: string, level: AdmissionLevel, reason?: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('blocked_dates').insert({ block_date, level, reason })
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function unblockDate(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('blocked_dates').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}
