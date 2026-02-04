'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { sendAdmissionConfirmation } from '@/lib/email'

const CAMPUS_NAMES: Record<string, string> = {
  winston: 'Instituto Educativo Winston',
  churchill: 'Instituto Winston Churchill',
}
const LEVEL_LABELS: Record<string, string> = {
  maternal: 'Maternal',
  kinder: 'Kinder',
  primaria: 'Primaria',
  secundaria: 'Secundaria',
}

export async function createAdmissionAppointment(data: {
  campus: string
  level: string
  grade_level: string
  student_name: string
  student_age: string
  student_last_name_p?: string
  student_last_name_m?: string
  student_birth_date?: string
  school_cycle?: string
  how_did_you_hear?: string
  parent_name: string
  parent_email: string
  parent_phone: string
  relationship: string
  appointment_date: string
  appointment_time: string
}) {
  const supabase = createAdminClient()

  // Evitar doble reserva: mismo día, hora y nivel
  const { data: existing } = await supabase
    .from('admission_appointments')
    .select('id')
    .eq('appointment_date', data.appointment_date)
    .eq('appointment_time', data.appointment_time || 'Por confirmar')
    .eq('level', data.level)
    .neq('status', 'cancelled')
    .limit(1)
  if (existing && existing.length > 0) {
    throw new Error('Ese horario ya no está disponible. Elige otra fecha u otro horario.')
  }

  const { data: inserted, error } = await supabase
    .from('admission_appointments')
    .insert({
      campus: data.campus,
      level: data.level,
      grade_level: data.grade_level,
      student_name: data.student_name,
      student_age: data.student_age?.trim() || '',
      student_last_name_p: data.student_last_name_p || null,
      student_last_name_m: data.student_last_name_m || null,
      student_birth_date: data.student_birth_date || null,
      school_cycle: data.school_cycle || null,
      how_did_you_hear: data.how_did_you_hear || null,
      parent_name: data.parent_name,
      parent_email: data.parent_email,
      parent_phone: data.parent_phone,
      relationship: data.relationship,
      appointment_date: data.appointment_date,
      appointment_time: data.appointment_time || 'Por confirmar',
      status: 'pending',
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  const appointmentId = (inserted as { id: string })?.id

  const studentName = [data.student_name, data.student_last_name_p, data.student_last_name_m].filter(Boolean).join(' ')
  const campusName = CAMPUS_NAMES[data.campus] || data.campus
  const levelLabel = LEVEL_LABELS[data.level] || data.level
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://agendaw.vercel.app')
  const expedienteUrl = appointmentId ? `${baseUrl}/expediente_inicial?cita=${appointmentId}` : ''
  try {
    const result = await sendAdmissionConfirmation(data.parent_email, {
      parentName: data.parent_name,
      studentName: studentName || data.student_name,
      appointmentDate: data.appointment_date,
      appointmentTime: data.appointment_time || 'Por confirmar',
      campusName,
      levelLabel,
      expedienteUrl,
    })
    if (!result.ok) console.warn('[email]', result.error)
  } catch (e) {
    console.warn('[email]', e)
  }

  return { id: appointmentId }
}
