import { NextRequest, NextResponse } from 'next/server'
import { createWinstonServiciosClient } from '@/lib/winstonServicios'

// 2026-10-05: los comprobantes Familia Winston se guardan en InsForge «Winston Servicios»
// (tabla wsp), la misma que lee el validador https://familia-winston.vercel.app.
// Antes se guardaban en la base de AgendaW y el validador nunca los encontraba.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ctrl = parseInt(body.ctrl) || 0
    // 2026-10-05: sin número de control válido no se genera comprobante (evita filas ctrl=0)
    if (ctrl <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Número de control del alumno que recomienda es requerido' },
        { status: 400 }
      )
    }
    const qr = Math.floor(100000 + Math.random() * 900000)

    const db = createWinstonServiciosClient()

    const insertData = {
      ctrl,
      qr,
      fecha: new Date().toISOString().slice(0, 10),
      estatus: 'INICIAL',
      status: 'pendiente',
    }

    const { data, error } = await db
      .from('wsp')
      .insert(insertData)
      .select('id, ctrl, qr, estatus, status')
      .single()

    if (error) {
      console.error('[wsp POST] InsForge error:', JSON.stringify(error))
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
