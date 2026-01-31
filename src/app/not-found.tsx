export default function NotFound() {
  return (
    <div className="container text-center" style={{ paddingTop: '4rem' }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</h1>
      <h2 style={{ marginBottom: '1rem' }}>Página No Encontrada</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        La página que buscas no existe.
      </p>
      <a href="/" className="btn btn-primary">
        Volver al Inicio
      </a>
    </div>
  )
}
