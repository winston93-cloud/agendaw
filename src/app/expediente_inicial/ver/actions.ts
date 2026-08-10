'use server'

import { createAdminClient } from '@/lib/insforge/server'

export async function getExpedienteCompleto(appointmentId: string) {
  console.log('[expediente-ver] Buscando expediente para cita:', appointmentId)
  try {
    const supabase = createAdminClient()
    
    const { data: rows, error } = await supabase
      .from('expediente_inicial')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('[expediente-ver] Error:', error)
      return null
    }

    const data = rows?.[0] ?? null
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
