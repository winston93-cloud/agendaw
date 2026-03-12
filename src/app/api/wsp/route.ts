import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ctrl = parseInt(body.ctrl) || 0

    // Código QR de 6 dígitos aleatorio
    const qr = Math.floor(100000 + Math.random() * 900000)

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('wsp')
      .insert({
        ctrl,
        qr,
        estatus: ctrl > 0 ? 'EMPTY' : 'INICIAL',
        status: 'pendiente',
        fecha: null,
      })
      .select()
      .single()

    if (error) {
      console.error('[wsp POST]', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, ...data })
  } catch (e) {
    console.error('[wsp POST]', e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
