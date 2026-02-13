// Página para subir documentación requerida (Paso 2 del proceso) - V2
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
  const [files, setFiles] = useState<Record<number, File>>({})
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
      const newFiles = { ...prev }
      if (file) {
        newFiles[index] = file
      } else {
        delete newFiles[index]
      }
      return newFiles
    })
  }

  const handleSubmit = async () => {
    const filesList = Object.values(files)
    if (filesList.length === 0) {
      alert('Debes subir al menos un documento')
      return
    }

    if (!appointment) return

    setSending(true)
    setError(null)

    try {
      // Convertir archivos a base64 con sufijo único para evitar duplicados
      const filesData = await Promise.all(
        Object.entries(files).map(async ([indexStr, file]) => {
          const index = parseInt(indexStr)
          return new Promise<{ filename: string; content: string; mimetype: string }>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => {
              // Agregar índice al nombre para evitar duplicados en el servidor
              const baseName = file.name.replace(/\.[^/.]+$/, '')
              const ext = file.name.split('.').pop()
              const uniqueName = `${index + 1}_${baseName}.${ext}`
              
              resolve({
                filename: uniqueName,
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
            <div key={index} className="expediente-field" style={{ marginBottom: '2rem' }}>
              <label className="expediente-label" style={{ 
                fontSize: '1rem', 
                marginBottom: '0.75rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                color: index === 0 ? '#4f46e5' : index === 1 ? '#0891b2' : index === 2 ? '#d97706' : '#be185d',
                fontWeight: '700'
              }}>
                <span style={{ fontSize: '1.5rem' }}>
                  {index === 0 ? '📝' : index === 1 ? '📊' : index === 2 ? '📜' : '🤝'}
                </span>
                {index === 0 ? 'Constancia del nivel actual' : index === 1 ? 'Última boleta interna' : index === 2 ? 'Boleta oficial anterior' : 'Carta de Buena Conducta'}
                {index === 0 && <span style={{ fontSize: '0.8rem', fontWeight: '400', color: '#64748b', marginLeft: 'auto' }}>(Solo Maternal/Kinder)</span>}
              </label>
              
              <div style={{ position: 'relative', transition: 'transform 0.2s ease' }}>
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
                  padding: '2rem',
                  background: files[index] ? '#f0fdf4' : 'white',
                  border: `2px dashed ${
                    files[index] 
                      ? '#22c55e' 
                      : index === 0 ? '#818cf8' 
                      : index === 1 ? '#22d3ee' 
                      : index === 2 ? '#fbbf24' 
                      : '#f472b6'
                  }`,
                  borderRadius: '16px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem',
                  boxShadow: files[index] ? '0 4px 12px rgba(34, 197, 94, 0.2)' : '0 4px 6px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ 
                    fontSize: '2.5rem', 
                    filter: files[index] ? 'none' : 'grayscale(0.5)',
                    opacity: files[index] ? 1 : 0.7,
                    transform: files[index] ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.3s ease'
                  }}>
                    {files[index] ? '✅' : '📤'}
                  </div>
                  
                  {files[index] ? (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                      <p style={{ color: '#166534', fontWeight: '700', margin: 0, fontSize: '1.1rem' }}>¡Archivo listo!</p>
                      <p style={{ color: '#15803d', fontSize: '0.95rem', margin: '0.5rem 0 0', wordBreak: 'break-all', padding: '0.5rem 1rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px' }}>
                        {files[index].name}
                      </p>
                      <p style={{ color: '#16a34a', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>Toca para cambiar</p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ color: '#334155', fontWeight: '600', margin: 0, fontSize: '1.1rem' }}>Seleccionar archivo</p>
                      <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.5rem 0 0' }}>PDF, Foto o Imagen</p>
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
            disabled={sending || Object.keys(files).length === 0}
            className="expediente-submit-btn"
            style={{ 
              marginTop: '2rem', 
              width: '100%',
              padding: '1rem',
              fontSize: '1.1rem',
              fontWeight: '700',
              borderRadius: '12px',
              background: Object.keys(files).length > 0 ? 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' : '#e2e8f0',
              color: Object.keys(files).length > 0 ? 'white' : '#94a3b8',
              border: 'none',
              cursor: Object.keys(files).length > 0 ? 'pointer' : 'not-allowed',
              boxShadow: Object.keys(files).length > 0 ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {sending ? 'Enviando...' : `📤 ENVIAR DOCUMENTACIÓN (${Object.keys(files).length} ARCHIVO${Object.keys(files).length !== 1 ? 'S' : ''})`}
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
