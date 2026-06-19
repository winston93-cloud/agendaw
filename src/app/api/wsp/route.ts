import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ctrl = parseInt(body.ctrl) || 0
    const qr = Math.floor(100000 + Math.random() * 900000)

    const supabase = createAdminClient()

    const insertData = {
      ctrl,
      qr,
      estatus: 'INICIAL',
      status: 'pendiente',
    }

    const { data, error } = await supabase
      .from('wsp')
      .insert(insertData)
      .select('id, ctrl, qr, estatus, status')
      .single()

    if (error) {
      console.error('[wsp POST] Supabase error:', JSON.stringify(error))
      return NextResponse.json(
        { ok: false, error: error.message, details: error.details, hint: error.hint },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, ...data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[wsp POST] Exception:', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
