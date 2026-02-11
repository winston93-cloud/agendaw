'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getExpedienteCompleto } from './actions'

function VerExpedienteContent() {
  const searchParams = useSearchParams()
  const citaId = searchParams.get('cita')
  const [expediente, setExpediente] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!citaId) {
      setError('No se especificó el ID de la cita')
      setLoading(false)
      return
    }

    console.log('[ver-expediente] Cargando expediente para:', citaId)
    getExpedienteCompleto(citaId)
      .then(data => {
        console.log('[ver-expediente] Datos recibidos:', data)
        if (data) {
          setExpediente(data)
        } else {
          setError('No se encontró el expediente inicial para esta cita')
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('[ver-expediente] Error:', err)
        setError('Error al cargar el expediente')
        setLoading(false)
      })
  }, [citaId])

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Cargando expediente...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>
        <Link href="/admin">Volver al admin</Link>
      </div>
    )
  }

  if (!expediente) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>No hay datos para mostrar</p>
        <Link href="/admin">Volver al admin</Link>
      </div>
    )
  }

  // Renderizar como JSON primero para debug
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>📋 Expediente Inicial (Solo lectura)</h1>
      <Link href="/admin" style={{ display: 'inline-block', marginBottom: '2rem', padding: '0.5rem 1rem', background: '#4f46e5', color: 'white', borderRadius: '4px', textDecoration: 'none' }}>
        ← Volver al Admin
      </Link>
      
      <div style={{ background: 'white', padding: '2rem', borderRadius: '8px' }}>
        <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontSize: '0.9rem' }}>
          {JSON.stringify(expediente, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export default function VerExpedientePage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Cargando…</div>}>
      <VerExpedienteContent />
    </Suspense>
  )
}
