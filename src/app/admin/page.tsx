import Link from 'next/link'
import { getAdmissionAppointments, getBlockedDates } from './actions'
import AdminCitas from './AdminCitas'
import AdminBloquear from './AdminBloquear'

export const dynamic = 'force-dynamic'

function hasSupabaseEnv() {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY
  return Boolean(u && typeof u === 'string' && u.trim() && k && typeof k === 'string' && k.trim())
}

export default async function AdminPage() {
  let appointments: Awaited<ReturnType<typeof getAdmissionAppointments>> = []
  let blockedDates: Awaited<ReturnType<typeof getBlockedDates>> = []
  if (hasSupabaseEnv()) {
    try {
      ;[appointments, blockedDates] = await Promise.all([
        getAdmissionAppointments(),
        getBlockedDates(),
      ])
    } catch (e) {
      console.error('Admin load error:', e)
    }
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-inner">
          <h1>Panel de Psicólogas</h1>
          <p>Citas de examen de admisión</p>
          <div className="admin-header-actions">
            <Link href="/" className="admin-link">← Volver al sitio</Link>
            <form action="/api/admin/auth" method="POST">
              <input type="hidden" name="_method" value="DELETE" />
            </form>
            <a href="/api/admin/logout" className="admin-link">Cerrar sesión</a>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <section className="admin-section">
          <h2>📅 Citas programadas</h2>
          <AdminCitas appointments={appointments} />
        </section>

        <section className="admin-section">
          <h2>🚫 Días bloqueados por nivel</h2>
          <p className="admin-hint">
            Si bloqueas un día para un nivel (ej. Secundaria), los otros niveles (Maternal/Kinder, Primaria) siguen pudiendo agendar ese día.
          </p>
          <AdminBloquear blockedDates={blockedDates} />
        </section>
      </main>
    </div>
  )
}
