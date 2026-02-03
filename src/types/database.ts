// Tipos de base de datos

export interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'professional' | 'client'
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  user_id: string
  phone: string
  address?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Professional {
  id: string
  user_id: string
  specialty: string
  bio?: string
  phone: string
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  name: string
  description?: string
  duration_minutes: number
  price: number
  professional_id: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  client_id: string
  professional_id: string
  service_id: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes?: string
  created_at: string
  updated_at: string
}

export interface Availability {
  id: string
  professional_id: string
  day_of_week: number // 0 = Domingo, 6 = Sábado
  start_time: string // formato HH:MM
  end_time: string // formato HH:MM
  active: boolean
  created_at: string
  updated_at: string
}

export type AdmissionLevel = 'maternal_kinder' | 'primaria' | 'secundaria'

export interface AdmissionAppointment {
  id: string
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
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes?: string
  created_at: string
  updated_at: string
}

export interface BlockedDate {
  id: string
  block_date: string
  level: AdmissionLevel
  reason?: string
  created_at: string
}

export interface AdmissionSchedule {
  id: string
  level: AdmissionLevel
  time_slot: string
  sort_order: number
  created_at: string
}
