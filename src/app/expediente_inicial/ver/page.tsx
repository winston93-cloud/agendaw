'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getExpedienteCompleto } from './actions'

function VerExpedienteContent() {
  const searchParams = useSearchParams()
  const citaId = searchParams.get('cita') || undefined
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
          <Link href="/admin" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
            Volver al admin
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="expediente-page">
      <header className="expediente-hero" style={{ marginBottom: '2rem' }}>
        <h1 className="expediente-hero-title">
          <span className="expediente-hero-title-line">📋 Expediente Inicial</span>
          <span className="expediente-hero-title-line">(Solo lectura)</span>
        </h1>
        <Link href="/admin" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          ← Volver al Admin
        </Link>
      </header>

      <div className="expediente-form-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1rem' }}>
        <Section title="📚 Datos del Aspirante">
          <Field label="Nivel" value={expediente.nivel} />
          <Field label="Grado" value={expediente.grado} />
          <Field label="Ciclo escolar" value={expediente.ciclo_escolar} />
          <Field label="Nombre" value={expediente.nombre_alumno} />
          <Field label="Apellido paterno" value={expediente.apellido_paterno_alumno} />
          <Field label="Apellido materno" value={expediente.apellido_materno_alumno} />
          <Field label="Fecha de nacimiento" value={expediente.fecha_nacimiento} />
          <Field label="Lugar de nacimiento" value={expediente.lugar_nacimiento} />
          <Field label="Sexo" value={expediente.sexo} />
          <Field label="Edad" value={expediente.edad} />
          <Field label="Escuela de procedencia" value={expediente.escuela_procedencia} />
        </Section>

        <Section title="👨 Datos del Padre">
          <Field label="Nombre" value={expediente.padre_nombre} />
          <Field label="Apellido paterno" value={expediente.padre_apellido_paterno} />
          <Field label="Apellido materno" value={expediente.padre_apellido_materno} />
          <Field label="Edad" value={expediente.padre_edad} />
          <Field label="Email" value={expediente.padre_email} />
          <Field label="Lugar de trabajo" value={expediente.padre_lugar_trabajo} />
          <Field label="Estado civil" value={expediente.padre_estado_civil} />
          <Field label="Teléfono trabajo" value={expediente.padre_telefono_trabajo} />
          <Field label="Teléfono celular" value={expediente.padre_telefono_celular} />
          <Field label="Trabaja fuera de la ciudad" value={expediente.padre_trabaja_fuera_ciudad ? 'Sí' : 'No'} />
        </Section>

        <Section title="👩 Datos de la Madre">
          <Field label="Nombre" value={expediente.madre_nombre} />
          <Field label="Apellido paterno" value={expediente.madre_apellido_paterno} />
          <Field label="Apellido materno" value={expediente.madre_apellido_materno} />
          <Field label="Edad" value={expediente.madre_edad} />
          <Field label="Email" value={expediente.madre_email} />
          <Field label="Lugar de trabajo" value={expediente.madre_lugar_trabajo} />
          <Field label="Estado civil" value={expediente.madre_estado_civil} />
          <Field label="Teléfono trabajo" value={expediente.madre_telefono_trabajo} />
          <Field label="Teléfono celular" value={expediente.madre_telefono_celular} />
          <Field label="Trabaja fuera de la ciudad" value={expediente.madre_trabaja_fuera_ciudad ? 'Sí' : 'No'} />
        </Section>

        <Section title="🏥 Información Médica y Psicológica">
          <Field label="Tratamiento médico último año" value={expediente.tratamiento_medico_ultimo_ano} />
          <Field label="Tratamiento psicológico" value={expediente.tratamiento_psicologico_si ? 'Sí' : 'No'} />
          <Field label="Razón tratamiento psicológico" value={expediente.tratamiento_psicologico_razon} />
          <Field label="Alergias y/o padecimientos" value={expediente.alergias_padecimientos} />
          <Field label="Diagnósticos médicos" value={expediente.diagnosticos_medicos} />
        </Section>

        <Section title="🎓 Información Escolar">
          <Field label="Clase extracurricular" value={expediente.clase_extracurricular} />
          <Field label="Nombre escuela/guardería" value={expediente.nombre_escuela_guarderia} />
          <Field label="Motivo de separación" value={expediente.motivo_separacion} />
          <Field label="Motivo de incorporación" value={expediente.motivo_incorporacion} />
          <Field label="Preocupación desenvolvimiento" value={expediente.preocupacion_desenvolvimiento} />
        </Section>

        <Section title="✋ Evaluación de Comportamiento">
          {expediente.conductas && expediente.conductas.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Conductas identificadas:</strong>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                {expediente.conductas.map((c: string, i: number) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          <Field label="Conductas en proceso de control" value={expediente.conductas_proceso_control} />
        </Section>

        <Section title="👨‍👩‍👧‍👦 Núcleo Familiar">
          <Field label="Número de familiares adicionales" value={expediente.num_familiares_adicionales} />
          <Field label="Lugar que ocupa el aspirante" value={expediente.lugar_ocupa_aspirante} />
          <Field label="Edades de familiares" value={expediente.edades_familiares} />
          
          {expediente.familiar_1_nombre && (
            <>
              <h4 style={{ marginTop: '1rem', color: '#fff' }}>Familiar 1</h4>
              <Field label="Nombre" value={expediente.familiar_1_nombre} />
              <Field label="Apellidos" value={expediente.familiar_1_apellidos} />
              <Field label="Edad" value={expediente.familiar_1_edad} />
            </>
          )}
          
          {expediente.familiar_2_nombre && (
            <>
              <h4 style={{ marginTop: '1rem', color: '#fff' }}>Familiar 2</h4>
              <Field label="Nombre" value={expediente.familiar_2_nombre} />
              <Field label="Apellidos" value={expediente.familiar_2_apellidos} />
              <Field label="Edad" value={expediente.familiar_2_edad} />
            </>
          )}
          
          {expediente.familiar_3_nombre && (
            <>
              <h4 style={{ marginTop: '1rem', color: '#fff' }}>Familiar 3</h4>
              <Field label="Nombre" value={expediente.familiar_3_nombre} />
              <Field label="Apellidos" value={expediente.familiar_3_apellidos} />
              <Field label="Edad" value={expediente.familiar_3_edad} />
            </>
          )}
          
          {expediente.familiar_4_nombre && (
            <>
              <h4 style={{ marginTop: '1rem', color: '#fff' }}>Familiar 4</h4>
              <Field label="Nombre" value={expediente.familiar_4_nombre} />
              <Field label="Apellidos" value={expediente.familiar_4_apellidos} />
              <Field label="Edad" value={expediente.familiar_4_edad} />
            </>
          )}
        </Section>

        <Section title="📞 Información Adicional">
          <Field label="Nombre persona que proporcionó la información" value={expediente.nombre_persona_info} />
          <Field label="Relación con el alumno" value={expediente.relacion_alumno} />
          <Field label="Teléfono principal de contacto" value={expediente.telefono_principal} />
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="expediente-section" style={{ marginBottom: '2rem' }}>
      <h2 style={{ 
        fontSize: '1.3rem', 
        fontWeight: '600', 
        color: '#fff', 
        marginBottom: '1rem',
        borderBottom: '2px solid rgba(255,255,255,0.2)',
        paddingBottom: '0.5rem'
      }}>
        {title}
      </h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '1rem' 
      }}>
        {children}
      </div>
    </section>
  )
}

function Field({ label, value }: { label: string; value: any }) {
  const displayValue = value === null || value === undefined || value === '' ? '—' : String(value)
  
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <label style={{ 
        display: 'block', 
        fontSize: '0.85rem', 
        fontWeight: '500', 
        color: 'rgba(255,255,255,0.7)',
        marginBottom: '0.25rem'
      }}>
        {label}
      </label>
      <p style={{ 
        fontSize: '0.95rem', 
        color: '#fff',
        padding: '0.5rem',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '4px',
        minHeight: '2rem'
      }}>
        {displayValue}
      </p>
    </div>
  )
}

export default function VerExpedientePage() {
  return (
    <Suspense fallback={
      <div className="expediente-page">
        <p style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.9)' }}>
          Cargando…
        </p>
      </div>
    }>
      <VerExpedienteContent />
    </Suspense>
  )
}
