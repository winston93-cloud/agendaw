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
            <div key={index} className="expediente-field" style={{ marginBottom: '1rem' }}>
              <label className="expediente-label">
                Documento {index + 1} {index === 0 ? '(Constancia - solo Maternal/Kinder 1)' : index === 1 ? '(Boleta interna)' : index === 2 ? '(Boleta oficial)' : '(Carta Buena Conducta)'}
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange(index, e.target.files?.[0] || null)}
                className="expediente-input"
                style={{ 
                  padding: '0.75rem',
                  background: 'white',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              />
              {files[index] && (
                <p style={{ fontSize: '0.85rem', color: '#059669', marginTop: '0.25rem' }}>
                  ✓ {files[index].name}
                </p>
              )}
            </div>
          ))}

          {error && (
            <div style={{ 
              padding: '1rem', 
              background: '#fee', 
              border: '2px solid #fcc', 
              borderRadius: '8px',
              color: '#c00',
              marginTop: '1rem'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={sending || files.length === 0}
            className="expediente-submit-btn"
            style={{ marginTop: '2rem', width: '100%' }}
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
