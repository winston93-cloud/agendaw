import { NextRequest, NextResponse } from 'next/server'

const VALID_LOCALES = ['es', 'en']

export async function POST(req: NextRequest) {
  const { locale, redirectTo } = await req.json()

  if (!VALID_LOCALES.includes(locale)) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('locale', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 año
    sameSite: 'lax',
  })

  return response
}
