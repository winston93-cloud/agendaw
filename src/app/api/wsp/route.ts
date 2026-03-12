import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!url || !key) throw new Error('Supabase env vars not set')
  // auth.persistSession: false para server-side, autoRefreshToken: false
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ctrl = parseInt(body.ctrl) || 0
    const qr = Math.floor(100000 + Math.random() * 900000)

    const supabase = getAdminClient()

    const insertData = {
      ctrl,
      qr,
      estatus: ctrl > 0 ? 'EMPTY' : 'INICIAL',
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
