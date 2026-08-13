/** Base URL de servicios_admin (portal / APIs compartidas). */
export function urlServiciosAdminBase(): string {
  const base = process.env.NEXT_PUBLIC_SERVICIOS_ADMIN_URL?.trim()
  if (base) {
    return base.replace(/\/$/, '').replace(/\/dashboard$/i, '')
  }
  return 'https://servicios-admin.vercel.app'
}

/** URL del dashboard principal de Servicios Administrativos (servicios_admin). */
export function urlServiciosAdminDashboard(): string {
  return `${urlServiciosAdminBase()}/dashboard`
}

export function urlCupoInscripcionApi(params: {
  level?: string
  grade_level?: string
  nivel?: number
  grado?: number
}): string {
  const url = new URL(`${urlServiciosAdminBase()}/api/cupo-inscripcion`)
  if (params.nivel != null && params.grado != null) {
    url.searchParams.set('nivel', String(params.nivel))
    url.searchParams.set('grado', String(params.grado))
  } else if (params.level && params.grade_level) {
    url.searchParams.set('level', params.level)
    url.searchParams.set('grade_level', params.grade_level)
  }
  return url.toString()
}
