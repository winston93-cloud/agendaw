import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Acceso al admin sin login (temporalmente desactivada la protección por clave)
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
