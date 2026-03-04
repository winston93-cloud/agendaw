import { getAdmissionAppointments, getBlockedDates, getSchedules, getRecorridos } from './actions'
import AdminDashboard from './AdminDashboard'

export const dynamic = 'force-dynamic'

function hasSupabaseEnv() {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY
  return Boolean(u && typeof u === 'string' && u.trim() && k && typeof k === 'string' && k.trim())
}

export default async function AdminPage() {
  let appointments: Awaited<ReturnType<typeof getAdmissionAppointments>> = []
  let blockedDates: Awaited<ReturnType<typeof getBlockedDates>> = []
  let schedules: Awaited<ReturnType<typeof getSchedules>> = []
  let recorridos: Awaited<ReturnType<typeof getRecorridos>> = []
  if (hasSupabaseEnv()) {
    try {
      ;[appointments, blockedDates, schedules, recorridos] = await Promise.all([
        getAdmissionAppointments(),
        getBlockedDates(),
        getSchedules(),
        getRecorridos(),
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
            <a href="/admin" className="admin-link">← Dashboard</a>
            <a href="/api/admin/logout" className="admin-link">Cerrar sesión</a>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <        AdminDashboard
          appointments={appointments}
          blockedDates={blockedDates}
          schedules={schedules}
          recorridos={recorridos}
        />
      </main>
    </div>
  )
}
