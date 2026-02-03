export const metadata = {
  title: 'Admin – Citas de Admisión | AgendaW',
  description: 'Panel de psicólogas: citas y bloqueo de fechas',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="admin-layout">
      {children}
    </div>
  )
}
