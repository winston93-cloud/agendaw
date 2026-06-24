/** URL del dashboard principal de Servicios Administrativos (servicios_admin). */
export function urlServiciosAdminDashboard(): string {
  const base = process.env.NEXT_PUBLIC_SERVICIOS_ADMIN_URL?.trim()
  if (base) {
    const normalized = base.replace(/\/$/, '')
    if (normalized.endsWith('/dashboard')) return normalized
    return `${normalized}/dashboard`
  }
  return 'https://servicios-admin.vercel.app/dashboard'
}
