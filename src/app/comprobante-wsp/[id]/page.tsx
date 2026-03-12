'use client'

import { use, useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'

interface Props {
  params: Promise<{ id: string }>
}

function ComprobanteContent({ id }: { id: string }) {
  const searchParams = useSearchParams()
  const qr         = searchParams.get('qr')          ?? ''
  const ctrl        = searchParams.get('ctrl')         ?? '0'
  const ref         = searchParams.get('ref')          ?? ctrl
  const nombreRef   = searchParams.get('nombre_ref')   ?? ''
  const estudiante  = searchParams.get('estudiante')   ?? 'N/D'
  const nivelGrado  = searchParams.get('nivel_grado')  ?? ''
  const ciclo       = searchParams.get('ciclo')        ?? ''

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!qr) return
    // Genera el QR code con el valor numérico
    import('qrcode').then(QRCode => {
      QRCode.toDataURL(qr, {
        width: 160,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
      }).then(url => setQrDataUrl(url)).catch(console.error)
    })
  }, [qr])

  const fecha = new Date().toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  const folio = `WSP-${String(id).padStart(5, '0')}`

  // Texto del ciclo formateado: "2026-2027" → "2026 - 2027"
  const cicloDisplay = ciclo.replace('-', ' - ')

  return (
    <>
      {/* ── Comprobante imprimible ─────────────────────────── */}
      <div className="wsp-page">
        <div className="wsp-paper">

          {/* HEADER */}
          <div className="wsp-header">
            <div className="wsp-header-left">
              <Image
                src="/logo-winston-churchill.png"
                alt="Winston"
                width={130}
                height={50}
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
            <div className="wsp-header-center">
              <span className="wsp-header-title">Comprobante Familia Winston</span>
            </div>
            <div className="wsp-header-right" />
          </div>

          {/* BODY */}
          <div className="wsp-body">
            <p className="wsp-saludo">Estimado padre de familia,</p>

            <p className="wsp-parrafo">
              Este documento certifica que el interesado{' '}
              <strong>{estudiante}</strong>{' '}
              {nivelGrado && <>a ingresar a <strong>{nivelGrado}</strong>{' '}</>}
              {cicloDisplay && <>en el ciclo <strong>{cicloDisplay}</strong>,{' '}</>}
              otorga al alumno con número de control{' '}
              <strong>{ref}</strong>{nombreRef ? ` (${nombreRef})` : ''} el beneficio de estar
              registrado en el programa <strong>Familia Winston</strong>.
            </p>

            <p className="wsp-parrafo">
              El programa Familia Winston tiene como objetivo apoyar y fomentar la colaboración
              entre las familias y nuestra institución para brindar una mejor experiencia educativa
              a nuestros alumnos.
            </p>

            <p className="wsp-parrafo">
              Por favor, conserve este comprobante para cualquier trámite relacionado con el programa.
            </p>

            {/* QR CODE */}
            <div className="wsp-qr-wrap">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Código de verificación" className="wsp-qr-img" />
              ) : (
                <div className="wsp-qr-placeholder">
                  <span>{qr}</span>
                </div>
              )}
              <p className="wsp-qr-label">Código de Verificación</p>
            </div>

            {/* PIE */}
            <div className="wsp-firma">
              <p>Atentamente,</p>
              <p className="wsp-firma-inst">Institución Educativa Winston</p>
            </div>

            <div className="wsp-meta">
              <span>Folio: <strong>{folio}</strong></span>
              <span>Fecha: {fecha}</span>
            </div>
          </div>

        </div>

        {/* BOTONES — no se imprimen */}
        <div className="wsp-actions no-print">
          <button className="wsp-btn-print" onClick={() => window.print()}>
            🖨️ Imprimir / Guardar PDF
          </button>
          <button className="wsp-btn-close" onClick={() => window.close()}>
            ✕ Cerrar
          </button>
        </div>
      </div>
    </>
  )
}

export default function ComprobantePage({ params }: Props) {
  const { id } = use(params)
  return (
    <Suspense fallback={
      <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'system-ui', color: '#64748b' }}>
        Generando comprobante…
      </div>
    }>
      <ComprobanteContent id={id} />
    </Suspense>
  )
}
