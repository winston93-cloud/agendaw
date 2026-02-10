'use server'

import { createAdminClient } from '@/lib/supabase/server'

export type ExpedienteFormData = {
  appointment_id?: string | null
  nivel?: string
  grado?: string
  ciclo_escolar?: string
  nombre_alumno?: string
  apellido_paterno_alumno?: string
  apellido_materno_alumno?: string
  fecha_nacimiento?: string
  lugar_nacimiento?: string
  sexo?: string
  edad?: number
  escuela_procedencia?: string
  padre_nombre?: string
  padre_apellido_paterno?: string
  padre_apellido_materno?: string
  padre_edad?: number
  padre_email?: string
  padre_lugar_trabajo?: string
  padre_estado_civil?: string
  padre_telefono_trabajo?: string
  padre_telefono_celular?: string
  madre_nombre?: string
  madre_apellido_paterno?: string
  madre_apellido_materno?: string
  madre_edad?: number
  madre_email?: string
  madre_lugar_trabajo?: string
  madre_estado_civil?: string
  madre_telefono_trabajo?: string
  madre_telefono_celular?: string
  tratamiento_medico_ultimo_ano?: string
  tratamiento_psicologico_si?: boolean
  tratamiento_psicologico_razon?: string
  clase_extracurricular?: string
  nombre_escuela_guarderia?: string
  motivo_separacion?: string
  motivo_incorporacion?: string
  preocupacion_desenvolvimiento?: string
  nombre_persona_info?: string
  relacion_alumno?: string
  conductas?: string[]
  conductas_proceso_control?: string
  padre_trabaja_fuera_ciudad?: boolean
  madre_trabaja_fuera_ciudad?: boolean
  alergias_padecimientos?: string
  diagnosticos_medicos?: string
  num_familiares_adicionales?: number
  lugar_ocupa_aspirante?: number
  edades_familiares?: string
  familiar_1_nombre?: string
  familiar_1_apellidos?: string
  familiar_1_edad?: number
  familiar_2_nombre?: string
  familiar_2_apellidos?: string
  familiar_2_edad?: number
  familiar_3_nombre?: string
  familiar_3_apellidos?: string
  familiar_3_edad?: number
  familiar_4_nombre?: string
  familiar_4_apellidos?: string
  familiar_4_edad?: number
  telefono_principal?: string
}

export async function getAppointmentForExpediente(appointmentId: string) {
  console.log('[expediente] Buscando cita:', appointmentId)
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('admission_appointments')
    .select('id, campus, level, grade_level, student_name, student_last_name_p, student_last_name_m, student_birth_date, school_cycle, parent_name, parent_email, parent_phone')
    .eq('id', appointmentId)
    .single()
  
  if (error) {
    console.error('[expediente] Error al buscar cita:', error)
    return null
  }
  if (!data) {
    console.warn('[expediente] No se encontró cita con id:', appointmentId)
    return null
  }
  
  console.log('[expediente] Cita encontrada:', data.student_name, data.level, data.grade_level)
  return data
}

export async function submitExpedienteInicial(data: ExpedienteFormData) {
  const supabase = createAdminClient()
  const row: Record<string, unknown> = {
    appointment_id: data.appointment_id || null,
    nivel: data.nivel || null,
    grado: data.grado || null,
    ciclo_escolar: data.ciclo_escolar || null,
    nombre_alumno: data.nombre_alumno || null,
    apellido_paterno_alumno: data.apellido_paterno_alumno || null,
    apellido_materno_alumno: data.apellido_materno_alumno || null,
    fecha_nacimiento: data.fecha_nacimiento || null,
    lugar_nacimiento: data.lugar_nacimiento || null,
    sexo: data.sexo || null,
    edad: data.edad ?? null,
    escuela_procedencia: data.escuela_procedencia || null,
    padre_nombre: data.padre_nombre || null,
    padre_apellido_paterno: data.padre_apellido_paterno || null,
    padre_apellido_materno: data.padre_apellido_materno || null,
    padre_edad: data.padre_edad ?? null,
    padre_email: data.padre_email || null,
    padre_lugar_trabajo: data.padre_lugar_trabajo || null,
    padre_estado_civil: data.padre_estado_civil || null,
    padre_telefono_trabajo: data.padre_telefono_trabajo || null,
    padre_telefono_celular: data.padre_telefono_celular || null,
    madre_nombre: data.madre_nombre || null,
    madre_apellido_paterno: data.madre_apellido_paterno || null,
    madre_apellido_materno: data.madre_apellido_materno || null,
    madre_edad: data.madre_edad ?? null,
    madre_email: data.madre_email || null,
    madre_lugar_trabajo: data.madre_lugar_trabajo || null,
    madre_estado_civil: data.madre_estado_civil || null,
    madre_telefono_trabajo: data.madre_telefono_trabajo || null,
    madre_telefono_celular: data.madre_telefono_celular || null,
    tratamiento_medico_ultimo_ano: data.tratamiento_medico_ultimo_ano || null,
    tratamiento_psicologico_si: data.tratamiento_psicologico_si ?? null,
    tratamiento_psicologico_razon: data.tratamiento_psicologico_razon || null,
    clase_extracurricular: data.clase_extracurricular || null,
    nombre_escuela_guarderia: data.nombre_escuela_guarderia || null,
    motivo_separacion: data.motivo_separacion || null,
    motivo_incorporacion: data.motivo_incorporacion || null,
    preocupacion_desenvolvimiento: data.preocupacion_desenvolvimiento || null,
    nombre_persona_info: data.nombre_persona_info || null,
    relacion_alumno: data.relacion_alumno || null,
    conductas: data.conductas && data.conductas.length > 0 ? data.conductas : [],
    conductas_proceso_control: data.conductas_proceso_control || null,
    padre_trabaja_fuera_ciudad: data.padre_trabaja_fuera_ciudad ?? null,
    madre_trabaja_fuera_ciudad: data.madre_trabaja_fuera_ciudad ?? null,
    alergias_padecimientos: data.alergias_padecimientos || null,
    diagnosticos_medicos: data.diagnosticos_medicos || null,
    num_familiares_adicionales: data.num_familiares_adicionales ?? null,
    lugar_ocupa_aspirante: data.lugar_ocupa_aspirante ?? null,
    edades_familiares: data.edades_familiares || null,
    familiar_1_nombre: data.familiar_1_nombre || null,
    familiar_1_apellidos: data.familiar_1_apellidos || null,
    familiar_1_edad: data.familiar_1_edad ?? null,
    familiar_2_nombre: data.familiar_2_nombre || null,
    familiar_2_apellidos: data.familiar_2_apellidos || null,
    familiar_2_edad: data.familiar_2_edad ?? null,
    familiar_3_nombre: data.familiar_3_nombre || null,
    familiar_3_apellidos: data.familiar_3_apellidos || null,
    familiar_3_edad: data.familiar_3_edad ?? null,
    familiar_4_nombre: data.familiar_4_nombre || null,
    familiar_4_apellidos: data.familiar_4_apellidos || null,
    familiar_4_edad: data.familiar_4_edad ?? null,
    telefono_principal: data.telefono_principal || null,
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('expediente_inicial').insert(row)
  if (error) throw new Error(error.message)
}
