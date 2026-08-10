'use server'

import { createAdminClient } from '@/lib/insforge/server'

export async function getExpedienteForPdf(appointmentId: string) {
  const supabase = createAdminClient()

  const [{ data: expRows, error: expErr }, { data: appt, error: apptErr }] = await Promise.all([
    supabase
      .from('expediente_inicial')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('admission_appointments')
      .select('*')
      .eq('id', appointmentId)
      .single(),
  ])

  const expediente = expRows?.[0] ?? null
  if (expErr || !expediente) return null
  if (apptErr || !appt) return { expediente, appointment: null }

  return { expediente, appointment: appt }
}

