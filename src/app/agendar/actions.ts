'use server'

import { createAdminClient } from '@/lib/supabase/server'

export async function createAdmissionAppointment(data: {
  campus: string
  level: string
  grade_level: string
  student_name: string
  student_age: string
  parent_name: string
  parent_email: string
  parent_phone: string
  relationship: string
  appointment_date: string
  appointment_time: string
}) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('admission_appointments').insert({
    campus: data.campus,
    level: data.level,
    grade_level: data.grade_level,
    student_name: data.student_name,
    student_age: data.student_age,
    parent_name: data.parent_name,
    parent_email: data.parent_email,
    parent_phone: data.parent_phone,
    relationship: data.relationship,
    appointment_date: data.appointment_date,
    appointment_time: data.appointment_time,
    status: 'pending',
  })
  if (error) throw new Error(error.message)
}
