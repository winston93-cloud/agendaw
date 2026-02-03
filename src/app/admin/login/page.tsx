'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Acceso denegado')
      return
    }
    const next = searchParams.get('next') || '/admin'
    router.push(next)
    router.refresh()
  }

  return (
    <div className="admin-login-card">
      <h1>Admin – Psicólogas</h1>
      <p>Acceso al sistema de citas de admisión</p>
      <form onSubmit={handleSubmit}>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña de acceso"
            autoFocus
          />
        </label>
        {error && <p className="admin-login-error">{error}</p>}
        <button type="submit" className="btn btn-primary">
          Entrar
        </button>
      </form>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <div className="admin-login-page">
      <Suspense fallback={<div className="admin-login-card">Cargando…</div>}>
        <AdminLoginForm />
      </Suspense>
    </div>
  )
}
