'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function MenuContent() {
  const searchParams = useSearchParams()
  const citaId = searchParams.get('cita')

  if (!citaId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#ef4444' }}>Enlace inválido. Falta el ID de la cita.</p>
        <Link href="/" style={{ color: '#60a5fa', textDecoration: 'underline', marginTop: '1rem', display: 'inline-block' }}>
          Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <div className="expediente-page">
      <header className="expediente-hero">
        <h1 className="expediente-hero-title">
          <span className="expediente-hero-title-line">¡Bienvenido!</span>
          <span className="expediente-hero-title-line" style={{ fontSize: '1.2rem', opacity: 0.9 }}>
            Selecciona una opción para continuar
          </span>
        </h1>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.15)', 
          backdropFilter: 'blur(8px)',
          padding: '1rem 1.5rem', 
          borderRadius: '12px',
          maxWidth: '700px',
          margin: '1.5rem auto 0',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <p className="expediente-hero-subtitle" style={{ 
            fontSize: '1.05rem', 
            opacity: 1, 
            margin: 0, 
            fontWeight: '500',
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}>
            Para que la psicología le entregue los resultados del examen de admisión, es necesario completar los siguientes requisitos:
          </p>
        </div>
      </header>

      <div className="expediente-form-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '2rem',
          marginTop: '2rem'
        }}>
          
          {/* Tarjeta 1: Expediente Inicial */}
          <Link 
            href={`/expediente_inicial?cita=${citaId}`}
            className="menu-card"
            style={{ textDecoration: 'none' }}
          >
            <div className="menu-card-inner">
              <div className="menu-card-icon">📋</div>
              <h3 className="menu-card-title">Llenar Expediente Inicial</h3>
              <p className="menu-card-description">
                Formulario con información del aspirante y su familia. Los primeros campos ya están precargados.
              </p>
              <span className="menu-card-cta">Ir al expediente →</span>
            </div>
          </Link>

          {/* Tarjeta 2: Subir Documentación */}
          <Link 
            href={`/documentacion?cita=${citaId}`}
            className="menu-card"
            style={{ textDecoration: 'none' }}
          >
            <div className="menu-card-inner">
              <div className="menu-card-icon">📤</div>
              <h3 className="menu-card-title">Subir Documentación</h3>
              <p className="menu-card-description">
                Carga los documentos requeridos (constancia, boletas, carta de buena conducta).
              </p>
              <span className="menu-card-cta">Subir documentos →</span>
            </div>
          </Link>
          
        </div>

        <div style={{ 
          marginTop: '3rem', 
          padding: '1.5rem', 
          background: 'rgba(251, 191, 36, 0.15)',
          border: '2px solid rgba(251, 191, 36, 0.4)',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.95)', lineHeight: '1.6' }}>
            ⚠️ <strong>Importante:</strong> Ambos requisitos deben completarse antes de la fecha de tu cita para que puedas recibir los resultados del examen de admisión.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="expediente-page">
        <p style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.9)' }}>Cargando…</p>
      </div>
    }>
      <MenuContent />
    </Suspense>
  )
}
