// Página para subir documentación requerida (Paso 2 del proceso)
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getAppointmentForDocs, sendDocumentacion } from './actions'

const DOCS_REQUIRED = [
  'Constancia del nivel actual (solo Maternal/Kinder 1)',
  'Última boleta interna del año en curso',
  'Boleta oficial del ciclo escolar anterior',
  'Carta de Buena Conducta del ciclo actual',
]

function DocumentacionContent() {
  const searchParams = useSearchParams()
  const citaId = searchParams.get('cita')
  const [appointment, setAppointment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [files, setFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!citaId) {
      setError('No se especificó el ID de la cita')
      setLoading(false)
      return
    }

    getAppointmentForDocs(citaId)
      .then(app => {
        if (app) {
          setAppointment(app)
        } else {
          setError('No se encontró la cita')
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Error al cargar la cita')
        setLoading(false)
      })
  }, [citaId])

  const handleFileChange = (index: number, file: File | null) => {
    setFiles(prev => {
      const newFiles = [...prev]
      if (file) {
        newFiles[index] = file
      } else {
        newFiles.splice(index, 1)
      }
      return newFiles
    })
  }

  const handleSubmit = async () => {
    if (files.length === 0) {
      alert('Debes subir al menos un documento')
      return
    }

    if (!appointment) return

    setSending(true)
    setError(null)

    try {
      // Convertir archivos a base64
      const filesData = await Promise.all(
        files.map(async (file) => {
          return new Promise<{ filename: string; content: string; mimetype: string }>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => {
              resolve({
                filename: file.name,
                content: reader.result as string,
                mimetype: file.type,
              })
            }
            reader.readAsDataURL(file)
          })
        })
      )

      const studentName = [
        appointment.student_name,
        appointment.student_last_name_p,
        appointment.student_last_name_m
      ].filter(Boolean).join(' ')

      const result = await sendDocumentacion({
        appointmentId: appointment.id,
        level: appointment.level,
        studentName,
        parentEmail: appointment.parent_email,
        parentName: appointment.parent_name,
        files: filesData,
      })

      if (result.ok) {
        setSuccess(true)
      } else {
        setError(result.error || 'Error al enviar documentación')
      }
    } catch (err) {
      setError('Error al procesar los archivos')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="expediente-page">
        <p style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.9)' }}>
          Cargando...
        </p>
      </div>
    )
  }

  if (error && !appointment) {
    return (
      <div className="expediente-page">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
          <Link href="/" className="btn btn-secondary">Volver al inicio</Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
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
  }

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
        
        <div className="expediente-section" style={{ margin: '0 auto' }}>
          <h2 className="expediente-section-title">📄 Documentos requeridos</h2>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ color: '#1e293b', marginBottom: '1rem', lineHeight: '1.6' }}>
              Por favor, sube los siguientes documentos. Es necesario completar este trámite para que la psicología le entregue los resultados del examen de admisión.
            </p>
            <ul style={{ color: '#475569', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
              {DOCS_REQUIRED.map((doc, i) => (
                <li key={i}>{doc}</li>
              ))}
            </ul>
          </div>

          {[0, 1, 2, 3].map(index => (
            <div key={index} className="expediente-field" style={{ marginBottom: '1.5rem' }}>
              <label className="expediente-label" style={{ fontSize: '0.95rem', marginBottom: '0.5rem', display: 'block' }}>
                {index === 0 ? '📝 Constancia del nivel actual (solo Maternal/Kinder 1)' : index === 1 ? '📊 Última boleta interna del año en curso' : index === 2 ? '📜 Boleta oficial del ciclo escolar anterior' : '🤝 Carta de Buena Conducta del ciclo actual'}
              </label>
              
              <div style={{ position: 'relative' }}>
                <input
                  type="file"
                  id={`file-${index}`}
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(index, e.target.files?.[0] || null)}
                  style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    zIndex: 2
                  }}
                />
                <div style={{ 
                  padding: '1.5rem',
                  background: files[index] ? '#f0fdf4' : '#f8fafc',
                  border: `2px dashed ${files[index] ? '#22c55e' : '#cbd5e1'}`,
                  borderRadius: '12px',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{ fontSize: '2rem' }}>
                    {files[index] ? '✅' : '📄'}
                  </div>
                  {files[index] ? (
                    <div>
                      <p style={{ color: '#166534', fontWeight: '600', margin: 0 }}>Archivo seleccionado:</p>
                      <p style={{ color: '#15803d', fontSize: '0.9rem', margin: '0.25rem 0 0', wordBreak: 'break-all' }}>{files[index].name}</p>
                      <p style={{ color: '#16a34a', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>Clic para cambiar</p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ color: '#475569', fontWeight: '600', margin: 0 }}>Clic para seleccionar archivo</p>
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>PDF, JPG o PNG</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {error && (
            <div style={{ 
              padding: '1rem', 
              background: '#fee2e2', 
              border: '1px solid #fecaca', 
              borderRadius: '12px',
              color: '#991b1b',
              marginTop: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.25rem' }}>⚠️</span>
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={sending || files.length === 0}
            className="expediente-submit-btn"
            style={{ 
              marginTop: '2rem', 
              width: '100%',
              padding: '1rem',
              fontSize: '1.1rem',
              fontWeight: '700',
              borderRadius: '12px',
              background: files.length > 0 ? 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' : '#e2e8f0',
              color: files.length > 0 ? 'white' : '#94a3b8',
              border: 'none',
              cursor: files.length > 0 ? 'pointer' : 'not-allowed',
              boxShadow: files.length > 0 ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {sending ? 'Enviando...' : `📤 Enviar Documentación (${files.length} archivo${files.length !== 1 ? 's' : ''})`}
          </button>

          <p className="expediente-submit-note" style={{ marginTop: '1rem' }}>
            * Los documentos se enviarán a la psicología del nivel correspondiente. Recibirás una copia de confirmación en tu correo.
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
