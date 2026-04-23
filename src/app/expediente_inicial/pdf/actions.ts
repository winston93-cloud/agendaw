'use server'

import { createAdminClient } from '@/lib/supabase/server'

export async function getExpedienteForPdf(appointmentId: string) {
  const supabase = createAdminClient()

  const [{ data: expediente, error: expErr }, { data: appt, error: apptErr }] = await Promise.all([
    supabase
      .from('expediente_inicial')
      .select('*')
      .eq('appointment_id', appointmentId)
      .single(),
    supabase
      .from('admission_appointments')
      .select('*')
      .eq('id', appointmentId)
      .single(),
  ])

  if (expErr || !expediente) return null
  if (apptErr || !appt) return { expediente, appointment: null }

  return { expediente, appointment: appt }
}

