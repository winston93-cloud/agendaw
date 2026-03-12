'use client'

import { use } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

interface Props {
  params: Promise<{ id: string }>
}

function ComprobanteContent({ id }: { id: string }) {
  const searchParams = useSearchParams()
  const qr = searchParams.get('qr') ?? '------'
  const ctrl = searchParams.get('ctrl') ?? '0'
  const ref = searchParams.get('ref') ?? ''
  const nombre = searchParams.get('nombre') ?? ''

  const fecha = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="comprobante-page">
      <div className="comprobante-paper">
        {/* Encabezado institucional */}
        <div className="comprobante-header">
          <div className="comprobante-logos">
            <div className="comprobante-logo-placeholder">IW</div>
          </div>
          <div className="comprobante-header-text">
            <h1 className="comprobante-inst">Instituto Winston Churchill</h1>
            <p className="comprobante-subinst">Instituto Educativo Winston</p>
            <p className="comprobante-programa">Programa Familia Winston</p>
          </div>
        </div>

        <div className="comprobante-divider" />

        {/* Título */}
        <h2 className="comprobante-title">COMPROBANTE DE REFERENCIA</h2>
        <p className="comprobante-folio">Folio: <strong>WSP-{String(id).padStart(5, '0')}</strong></p>
        <p className="comprobante-fecha">Fecha de emisión: {fecha}</p>

        <div className="comprobante-divider" />

        {/* Datos del alumno referenciado */}
        <section className="comprobante-section">
          <h3 className="comprobante-section-title">Alumno que recomienda</h3>
          <div className="comprobante-row">
            <span className="comprobante-label">N° de Control:</span>
            <span className="comprobante-value">{ref || ctrl}</span>
          </div>
          {nombre && (
            <div className="comprobante-row">
              <span className="comprobante-label">Nombre:</span>
              <span className="comprobante-value">{nombre}</span>
            </div>
          )}
        </section>

        <div className="comprobante-divider" />

        {/* Código QR / verificación */}
        <section className="comprobante-qr-section">
          <div className="comprobante-qr-box">
            <div className="comprobante-qr-code">{qr}</div>
            <p className="comprobante-qr-label">Código de verificación</p>
          </div>
          <div className="comprobante-qr-info">
            <p>Presenta este comprobante en la institución para hacer válido el beneficio del <strong>Programa Familia Winston</strong>.</p>
            <p className="comprobante-nota">Este comprobante es personal e intransferible. Su validez está sujeta a verificación por parte de la institución.</p>
          </div>
        </section>

        <div className="comprobante-divider" />

        {/* Pie */}
        <footer className="comprobante-footer">
          <p>Instituto Winston Churchill · Instituto Educativo Winston</p>
          <p className="comprobante-footer-status">Estado: <strong>Pendiente de revisión</strong></p>
        </footer>
      </div>

      <div className="comprobante-actions no-print">
        <button className="comprobante-btn-print" onClick={() => window.print()}>
          🖨️ Imprimir / Guardar PDF
        </button>
        <button className="comprobante-btn-close" onClick={() => window.close()}>
          ✕ Cerrar
        </button>
      </div>
    </div>
  )
}

export default function ComprobantePage({ params }: Props) {
  const { id } = use(params)
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Cargando comprobante…</div>}>
      <ComprobanteContent id={id} />
    </Suspense>
  )
}
