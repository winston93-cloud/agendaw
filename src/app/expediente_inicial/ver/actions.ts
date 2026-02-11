'use server'

import { createAdminClient } from '@/lib/supabase/server'

export async function getExpedienteCompleto(appointmentId: string) {
  console.log('[expediente-ver] Buscando expediente para cita:', appointmentId)
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('expediente_inicial')
      .select('*')
      .eq('appointment_id', appointmentId)
      .single()
    
    if (error) {
      console.error('[expediente-ver] Error:', error)
      return null
    }
    
    if (!data) {
      console.warn('[expediente-ver] No se encontró expediente')
      return null
    }
    
    console.log('[expediente-ver] Expediente encontrado:', Object.keys(data).length, 'campos')
    return data
  } catch (e) {
    console.error('[expediente-ver] Exception:', e)
    return null
  }
}
