import { cookies } from 'next/headers'
import DirectorDashboard from './DirectorDashboard'
import DirectorLogin from './DirectorLogin'
import { getPermissionRequests } from './actions'
import type { AdmissionLevel, PermissionRequest } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function DirectorDashboardPage() {
  const cookieStore = await cookies()
  const level = cookieStore.get('director_session')?.value as AdmissionLevel | undefined

  if (!level || !['maternal_kinder', 'primaria', 'secundaria'].includes(level)) {
    return <DirectorLogin />
  }

  let requests: PermissionRequest[] = []
  try {
    requests = await getPermissionRequests(level)
  } catch (e) {
    console.error('Error cargando solicitudes:', e)
  }

  return <DirectorDashboard level={level} requests={requests} />
}
