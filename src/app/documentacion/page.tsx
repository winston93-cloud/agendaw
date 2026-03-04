'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getAppointmentForDocs, sendDocumentacion } from './actions'

const MAX_MB   = 5
const MAX_BYTES = MAX_MB * 1024 * 1024

const DOC_LIST = [
  { label: 'Constancia del nivel actual', icon: '📝', note: '(Solo Maternal/Kinder)' },
  { label: 'Última boleta interna del año en curso', icon: '📊', note: '' },
  { label: 'Boleta oficial del ciclo escolar anterior', icon: '📜', note: '' },
  { label: 'Carta de Buena Conducta del ciclo actual', icon: '🤝', note: '' },
]

function DocumentacionContent() {
  const searchParams = useSearchParams()
  const citaId = searchParams.get('cita')

  const [appointment, setAppointment] = useState<any>(null)
  const [loading,     setLoading]     = useState(true)
  const [files,       setFiles]       = useState<Record<number, File>>({})
  const [sending,     setSending]     = useState(false)
  const [success,     setSuccess]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  useEffect(() => {
    if (!citaId) {
      setError('No se especificó el ID de la cita')
      setLoading(false)
      return
    }
    getAppointmentForDocs(citaId)
      .then(app => {
        if (app) setAppointment(app)
        else      setError('No se encontró la cita')
      })
      .catch(() => setError('Error al cargar la cita'))
      .finally(() => setLoading(false))
  }, [citaId])

  const handleFileChange = (index: number, file: File | null) => {
    if (file && file.size > MAX_BYTES) {
      alert(`"${file.name}" supera el límite de ${MAX_MB}MB.`)
      return
    }
    setFiles(prev => {
      const next = { ...prev }
      if (file) next[index] = file
      else      delete next[index]
      return next
    })
  }

  const handleSubmit = async () => {
    if (Object.keys(files).length === 0) {
      alert('Debes subir al menos un documento.')
      return
    }
    setSending(true)
    setError(null)
    try {
      const filesData = await Promise.all(
        Object.entries(files).map(([idxStr, file]) =>
          new Promise<{ filename: string; content: string; mimetype: string }>((resolve, reject) => {
            const idx    = parseInt(idxStr)
            const reader = new FileReader()
            reader.onload  = () => resolve({
              filename: `${idx + 1}_${file.name}`,
              content:  reader.result as string,
              mimetype: file.type,
            })
            reader.onerror = () => reject(new Error('Error al leer archivo'))
            reader.readAsDataURL(file)
          })
        )
      )

      const studentName = [appointment.student_name, appointment.student_last_name_p, appointment.student_last_name_m]
        .filter(Boolean).join(' ')

      const result = await sendDocumentacion({
        level:       appointment.level,
        studentName,
        parentEmail: appointment.parent_email,
        parentName:  appointment.parent_name,
        files:       filesData,
      })

      if (result.ok) setSuccess(true)
      else           setError(result.error ?? 'Error al enviar documentación')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al procesar los archivos')
    } finally {
      setSending(false)
    }
  }

  if (loading) return (
    <div className="expediente-page">
      <p style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.9)' }}>Cargando...</p>
    </div>
  )

  if (!appointment) return (
    <div className="expediente-page">
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error ?? 'No se encontró la cita'}</p>
        <Link href="/" className="btn btn-secondary">Volver al inicio</Link>
      </div>
    </div>
  )

  if (success) return (
    <div className="expediente-page">
      <div className="expediente-success">
        <h1>✅ Documentación enviada</h1>
        <p>Hemos recibido tus documentos y los hemos enviado a la psicología del plantel.</p>
        <p style={{ marginTop: '1rem' }}>
          Recibirás una copia de confirmación en: <strong>{appointment.parent_email}</strong>
        </p>
        <Link href="/" className="expediente-success-btn">Volver al inicio</Link>
      </div>
    </div>
  )

  const fileCount = Object.keys(files).length

  return (
    <div className="expediente-page">
      <header className="expediente-hero">
        <h1 className="expediente-hero-title">
          <span className="expediente-hero-title-line">📤 Subir Documentación</span>
          <span className="expediente-hero-title-line" style={{ fontSize: '1.2rem', opacity: 0.9 }}>
            Requisito para entregar resultados
          </span>
        </h1>
      </header>

      <div className="expediente-form-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="expediente-section">
          <h2 className="expediente-section-title">📄 Documentos requeridos</h2>

          <p style={{ color: '#1e293b', marginBottom: '1rem', lineHeight: '1.6' }}>
            Por favor, sube los siguientes documentos. Es necesario completar este trámite para que la psicología
            entregue los resultados del examen de admisión.
          </p>
          <ul style={{ color: '#475569', paddingLeft: '1.5rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
            {DOC_LIST.map((d, i) => (
              <li key={i}>{d.label}{d.note && <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}> {d.note}</span>}</li>
            ))}
          </ul>

          {DOC_LIST.map((doc, index) => (
            <div key={index} style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                fontWeight: '700', marginBottom: '0.75rem',
                color: ['#4f46e5','#0891b2','#d97706','#be185d'][index],
              }}>
                <span style={{ fontSize: '1.4rem' }}>{doc.icon}</span>
                {doc.label}
                {doc.note && <span style={{ fontSize: '0.8rem', fontWeight: '400', color: '#64748b', marginLeft: 'auto' }}>{doc.note}</span>}
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => handleFileChange(index, e.target.files?.[0] ?? null)}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 2 }}
                />
                <div style={{
                  padding: '2rem',
                  background: files[index] ? '#f0fdf4' : 'white',
                  border: `2px dashed ${files[index] ? '#22c55e' : ['#818cf8','#22d3ee','#fbbf24','#f472b6'][index]}`,
                  borderRadius: '16px', textAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                  boxShadow: files[index] ? '0 4px 12px rgba(34,197,94,0.2)' : '0 2px 6px rgba(0,0,0,0.05)',
                }}>
                  <div style={{ fontSize: '2.5rem' }}>{files[index] ? '✅' : '📤'}</div>
                  {files[index] ? (
                    <>
                      <p style={{ color: '#166534', fontWeight: '700', margin: 0 }}>¡Archivo listo!</p>
                      <p style={{ color: '#15803d', fontSize: '0.9rem', margin: 0, background: 'rgba(34,197,94,0.1)', padding: '0.4rem 0.75rem', borderRadius: '8px', wordBreak: 'break-all' }}>
                        {files[index].name}
                      </p>
                      <p style={{ color: '#16a34a', fontSize: '0.8rem', margin: 0 }}>Toca para cambiar</p>
                    </>
                  ) : (
                    <>
                      <p style={{ color: '#334155', fontWeight: '600', margin: 0 }}>Seleccionar archivo</p>
                      <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>PDF, foto o imagen · Máx. {MAX_MB}MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {error && (
            <div style={{
              padding: '1rem', background: '#fee2e2', border: '1px solid #fecaca',
              borderRadius: '12px', color: '#991b1b',
              display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem',
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={sending || fileCount === 0}
            style={{
              width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: '700',
              borderRadius: '12px', border: 'none', cursor: fileCount > 0 ? 'pointer' : 'not-allowed',
              background: fileCount > 0 ? 'linear-gradient(135deg,#4f46e5 0%,#4338ca 100%)' : '#e2e8f0',
              color: fileCount > 0 ? 'white' : '#94a3b8',
              boxShadow: fileCount > 0 ? '0 4px 12px rgba(79,70,229,0.3)' : 'none',
            }}
          >
            {sending ? 'Enviando...' : `📤 ENVIAR DOCUMENTACIÓN (${fileCount} ARCHIVO${fileCount !== 1 ? 'S' : ''})`}
          </button>

          <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>
            * Los documentos se enviarán a la psicología del nivel correspondiente. Recibirás una copia en tu correo.
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link href={`/menu-admision?cita=${citaId}`} className="btn btn-secondary">
            ← Volver al menú
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function DocumentacionPage() {
  return (
    <Suspense fallback={
      <div className="expediente-page">
        <p style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.9)' }}>Cargando…</p>
      </div>
    }>
      <DocumentacionContent />
    </Suspense>
  )
}
