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

    getExpedienteCompleto(citaId)
      .then(data => {
        if (data) {
          setExpediente(data)
        } else {
          setError('No se encontró el expediente inicial para esta cita')
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Error al cargar el expediente')
        setLoading(false)
      })
  }, [citaId])

  if (loading) {
    return (
      <div className="expediente-page">
        <p style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.9)' }}>
          Cargando expediente...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="expediente-page">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
          <Link href="/admin" className="btn btn-secondary">Volver al admin</Link>
        </div>
      </div>
    )
  }

  if (!expediente) {
    return (
      <div className="expediente-page">
        <p style={{ textAlign: 'center', padding: '2rem' }}>No hay datos</p>
        <Link href="/admin" className="btn btn-secondary">Volver al admin</Link>
      </div>
    )
  }

  const v = expediente // Alias corto

  return (
    <div className="expediente-page">
      <header className="expediente-hero" style={{ marginBottom: '2rem' }}>
        <h1 className="expediente-hero-title">
          <span className="expediente-hero-title-line">📋 Expediente Inicial del Aspirante</span>
          <span className="expediente-hero-title-line" style={{ fontSize: '1.2rem', opacity: 0.8 }}>(Solo lectura)</span>
        </h1>
        <Link href="/admin" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          ← Volver al Admin
        </Link>
      </header>

      <div className="expediente-form-container">
        
        {/* Datos del Aspirante */}
        <Section title="📚 Datos del Aspirante" emoji="📚">
          <Row>
            <Field label="Nivel" value={v.nivel} />
            <Field label="Grado al que desea ingresar" value={v.grado} />
            <Field label="Ciclo escolar" value={v.ciclo_escolar} />
          </Row>
          <Row>
            <Field label="Nombre" value={v.nombre_alumno} />
            <Field label="Apellido paterno" value={v.apellido_paterno_alumno} />
            <Field label="Apellido materno" value={v.apellido_materno_alumno} />
          </Row>
          <Row>
            <Field label="Fecha de nacimiento" value={v.fecha_nacimiento} />
            <Field label="Lugar de nacimiento" value={v.lugar_nacimiento} />
            <Field label="Sexo" value={v.sexo} />
            <Field label="Edad" value={v.edad} />
          </Row>
          <Row>
            <Field label="Escuela de procedencia" value={v.escuela_procedencia} fullWidth />
          </Row>
        </Section>

        {/* Datos del Padre */}
        <Section title="👨 Datos del Padre" emoji="👨">
          <Row>
            <Field label="Nombre" value={v.padre_nombre} />
            <Field label="Apellido paterno" value={v.padre_apellido_paterno} />
            <Field label="Apellido materno" value={v.padre_apellido_materno} />
          </Row>
          <Row>
            <Field label="Edad" value={v.padre_edad} />
            <Field label="Estado civil" value={v.padre_estado_civil} />
            <Field label="Email" value={v.padre_email} />
          </Row>
          <Row>
            <Field label="Lugar de trabajo" value={v.padre_lugar_trabajo} fullWidth />
          </Row>
          <Row>
            <Field label="Teléfono de trabajo" value={v.padre_telefono_trabajo} />
            <Field label="Teléfono celular" value={v.padre_telefono_celular} />
            <Field label="Trabaja fuera de la ciudad" value={v.padre_trabaja_fuera_ciudad ? 'Sí' : 'No'} />
          </Row>
        </Section>

        {/* Datos de la Madre */}
        <Section title="👩 Datos de la Madre" emoji="👩">
          <Row>
            <Field label="Nombre" value={v.madre_nombre} />
            <Field label="Apellido paterno" value={v.madre_apellido_paterno} />
            <Field label="Apellido materno" value={v.madre_apellido_materno} />
          </Row>
          <Row>
            <Field label="Edad" value={v.madre_edad} />
            <Field label="Estado civil" value={v.madre_estado_civil} />
            <Field label="Email" value={v.madre_email} />
          </Row>
          <Row>
            <Field label="Lugar de trabajo" value={v.madre_lugar_trabajo} fullWidth />
          </Row>
          <Row>
            <Field label="Teléfono de trabajo" value={v.madre_telefono_trabajo} />
            <Field label="Teléfono celular" value={v.madre_telefono_celular} />
            <Field label="Trabaja fuera de la ciudad" value={v.madre_trabaja_fuera_ciudad ? 'Sí' : 'No'} />
          </Row>
        </Section>

        {/* Información Médica */}
        <Section title="🏥 Información Médica y Psicológica" emoji="🏥">
          <Row>
            <Field label="Tratamiento médico en el último año" value={v.tratamiento_medico_ultimo_ano} fullWidth />
          </Row>
          <Row>
            <Field label="¿Ha recibido tratamiento psicológico?" value={v.tratamiento_psicologico_si ? 'Sí' : 'No'} />
            <Field label="Razón (o marque No)" value={v.tratamiento_psicologico_razon} fullWidth />
          </Row>
          <Row>
            <Field label="Alergias y/o padecimientos" value={v.alergias_padecimientos} fullWidth />
          </Row>
          <Row>
            <Field label="Diagnósticos médicos" value={v.diagnosticos_medicos} fullWidth />
          </Row>
        </Section>

        {/* Información Escolar */}
        <Section title="🎓 Información Escolar" emoji="🎓">
          <Row>
            <Field label="¿Asiste a clase extracurricular?" value={v.clase_extracurricular} fullWidth />
          </Row>
          <Row>
            <Field label="Nombre de escuela o guardería de procedencia" value={v.nombre_escuela_guarderia} fullWidth />
          </Row>
          <Row>
            <Field label="Motivo de la separación" value={v.motivo_separacion} fullWidth />
          </Row>
          <Row>
            <Field label="Motivo de incorporación a la institución" value={v.motivo_incorporacion} fullWidth />
          </Row>
          <Row>
            <Field label="¿Algo que le preocupa en torno al desenvolvimiento o aprovechamiento de su hijo(a)?" value={v.preocupacion_desenvolvimiento} fullWidth />
          </Row>
        </Section>

        {/* Evaluación de Comportamiento */}
        <Section title="✋ Evaluación de Comportamiento" emoji="✋">
          {v.conductas && v.conductas.length > 0 && (
            <div className="expediente-field" style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
              <label className="expediente-label">Señale los comportamientos que ha identificado:</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {v.conductas.map((c: string, i: number) => (
                  <span key={i} style={{
                    padding: '0.4rem 0.9rem',
                    background: '#6366f1',
                    color: '#ffffff',
                    borderRadius: '1rem',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
          <Row>
            <Field label="Conductas en proceso de control (o indique Ninguna)" value={v.conductas_proceso_control} fullWidth />
          </Row>
        </Section>

        {/* Núcleo Familiar */}
        <Section title="👨‍👩‍👧‍👦 Núcleo Familiar" emoji="👨‍👩‍👧‍👦">
          <Row>
            <Field label="Número de familiares adicionales (hermanos, abuelos, etc.)" value={v.num_familiares_adicionales} />
            <Field label="Lugar que ocupa el aspirante" value={v.lugar_ocupa_aspirante} />
            <Field label="Edades de familiares" value={v.edades_familiares} />
          </Row>
          
          {(v.familiar_1_nombre || v.familiar_2_nombre || v.familiar_3_nombre || v.familiar_4_nombre) && (
            <div style={{ marginTop: '1.5rem', gridColumn: '1 / -1' }}>
              <h4 style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '1rem', fontSize: '1.1rem' }}>
                Otros miembros del hogar
              </h4>
              
              {v.familiar_1_nombre && (
                <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Familiar 1</p>
                  <Row>
                    <Field label="Nombre" value={v.familiar_1_nombre} />
                    <Field label="Apellidos" value={v.familiar_1_apellidos} />
                    <Field label="Edad" value={v.familiar_1_edad} />
                  </Row>
                </div>
              )}
              
              {v.familiar_2_nombre && (
                <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Familiar 2</p>
                  <Row>
                    <Field label="Nombre" value={v.familiar_2_nombre} />
                    <Field label="Apellidos" value={v.familiar_2_apellidos} />
                    <Field label="Edad" value={v.familiar_2_edad} />
                  </Row>
                </div>
              )}
              
              {v.familiar_3_nombre && (
                <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Familiar 3</p>
                  <Row>
                    <Field label="Nombre" value={v.familiar_3_nombre} />
                    <Field label="Apellidos" value={v.familiar_3_apellidos} />
                    <Field label="Edad" value={v.familiar_3_edad} />
                  </Row>
                </div>
              )}
              
              {v.familiar_4_nombre && (
                <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Familiar 4</p>
                  <Row>
                    <Field label="Nombre" value={v.familiar_4_nombre} />
                    <Field label="Apellidos" value={v.familiar_4_apellidos} />
                    <Field label="Edad" value={v.familiar_4_edad} />
                  </Row>
                </div>
              )}
            </div>
          )}
        </Section>

        {/* Información Adicional */}
        <Section title="📞 Información Adicional" emoji="📞">
          <Row>
            <Field label="Nombre de la persona que proporcionó la información" value={v.nombre_persona_info} fullWidth />
          </Row>
          <Row>
            <Field label="Relación con el alumno" value={v.relacion_alumno} />
            <Field label="Teléfono principal de contacto" value={v.telefono_principal} />
          </Row>
        </Section>

      </div>
    </div>
  )
}

function Section({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <section className="expediente-section">
      <h2 className="expediente-section-title">
        <span style={{ marginRight: '0.5rem' }}>{emoji}</span>
        {title}
      </h2>
      <div className="expediente-section-content">
        {children}
      </div>
    </section>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="expediente-row">
      {children}
    </div>
  )
}

function Field({ label, value, fullWidth }: { label: string; value: any; fullWidth?: boolean }) {
  const displayValue = value === null || value === undefined || value === '' ? '—' : String(value)
  
  return (
    <div className={`expediente-field ${fullWidth ? 'expediente-field-full' : ''}`}>
      <label className="expediente-label">{label}</label>
      <div className="expediente-value">{displayValue}</div>
    </div>
  )
}

export default function VerExpedientePage() {
  return (
    <Suspense fallback={
      <div className="expediente-page">
        <p style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.9)' }}>Cargando…</p>
      </div>
    }>
      <VerExpedienteContent />
    </Suspense>
  )
}
