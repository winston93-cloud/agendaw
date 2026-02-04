'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getAppointmentForExpediente, submitExpedienteInicial, type ExpedienteFormData } from './actions'

const LEVEL_LABELS: Record<string, string> = {
  maternal: 'Maternal',
  kinder: 'Kinder',
  primaria: 'Primaria',
  secundaria: 'Secundaria',
}

const GRADE_LABELS: Record<string, string> = {
  maternal_a: 'Maternal A',
  maternal_b: 'Maternal B',
  kinder_1: 'Kinder-1',
  kinder_2: 'Kinder-2',
  kinder_3: 'Kinder-3',
  primaria_1: '1° Primaria',
  primaria_2: '2° Primaria',
  primaria_3: '3° Primaria',
  primaria_4: '4° Primaria',
  primaria_5: '5° Primaria',
  primaria_6: '6° Primaria',
  secundaria_7: '7mo',
  secundaria_8: '8vo',
  secundaria_9: '9no',
}

const CONDUCTAS_OPTIONS = [
  'SE DISTRAE FÁCILMENTE',
  'FÁCIL TRABAJO DIRIGIDO',
  'RETRAÍDO',
  'MIEDO A LO',
  'MIEDO IRRACIONAL',
  'MUESTRA CARIÑO',
  'AMABLE',
  'EN OCASIONES AGRESIVO',
  'LLORÓN',
  'PROBLEMAS DE LENGUAJE',
  'RARA VEZ RÍE',
  'REBELDE ANTE DISCIPLINA',
  'CONCENTRADO',
  'COME MUCHO',
  'IMPULSIVO',
  'PROBLEMAS SEVEROS',
  'DESOBEDIENTE',
  'APATÍA',
]

const initialForm: ExpedienteFormData = {
  nivel: '',
  grado: '',
  ciclo_escolar: '',
  nombre_alumno: '',
  apellido_paterno_alumno: '',
  apellido_materno_alumno: '',
  fecha_nacimiento: '',
  lugar_nacimiento: '',
  sexo: '',
  edad: undefined,
  escuela_procedencia: '',
  padre_nombre: '',
  padre_apellido_paterno: '',
  padre_apellido_materno: '',
  padre_edad: undefined,
  padre_email: '',
  padre_lugar_trabajo: '',
  padre_estado_civil: '',
  padre_telefono_trabajo: '',
  padre_telefono_celular: '',
  madre_nombre: '',
  madre_apellido_paterno: '',
  madre_apellido_materno: '',
  madre_edad: undefined,
  madre_email: '',
  madre_lugar_trabajo: '',
  madre_estado_civil: '',
  madre_telefono_trabajo: '',
  madre_telefono_celular: '',
  tratamiento_medico_ultimo_ano: '',
  tratamiento_psicologico_si: false,
  tratamiento_psicologico_razon: '',
  clase_extracurricular: '',
  nombre_escuela_guarderia: '',
  motivo_separacion: '',
  motivo_incorporacion: '',
  preocupacion_desenvolvimiento: '',
  nombre_persona_info: '',
  relacion_alumno: '',
  conductas: [],
  conductas_proceso_control: '',
  padre_trabaja_fuera_ciudad: false,
  madre_trabaja_fuera_ciudad: false,
  alergias_padecimientos: '',
  diagnosticos_medicos: '',
  num_familiares_adicionales: undefined,
  lugar_ocupa_aspirante: undefined,
  edades_familiares: '',
  familiar_1_nombre: '',
  familiar_1_apellidos: '',
  familiar_1_edad: undefined,
  familiar_2_nombre: '',
  familiar_2_apellidos: '',
  familiar_2_edad: undefined,
  familiar_3_nombre: '',
  familiar_3_apellidos: '',
  familiar_3_edad: undefined,
  familiar_4_nombre: '',
  familiar_4_apellidos: '',
  familiar_4_edad: undefined,
  telefono_principal: '',
}

function ExpedienteInicialContent() {
  const searchParams = useSearchParams()
  const citaId = searchParams.get('cita') || undefined
  const [form, setForm] = useState<ExpedienteFormData>(initialForm)
  const [loading, setLoading] = useState(false)
  const [prefillLoading, setPrefillLoading] = useState(!!citaId)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const setField = useCallback(<K extends keyof ExpedienteFormData>(key: K, value: ExpedienteFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }, [])

  useEffect(() => {
    if (!citaId) {
      setPrefillLoading(false)
      return
    }
    getAppointmentForExpediente(citaId)
      .then(app => {
        if (app) {
          const levelLabel = LEVEL_LABELS[app.level] || app.level
          const gradeLabel = GRADE_LABELS[app.grade_level] || app.grade_level
          setForm(prev => ({
            ...prev,
            appointment_id: app.id,
            nivel: levelLabel,
            grado: gradeLabel,
            ciclo_escolar: app.school_cycle || prev.ciclo_escolar,
            nombre_alumno: app.student_name?.trim() || '',
            apellido_paterno_alumno: app.student_last_name_p?.trim() || '',
            apellido_materno_alumno: app.student_last_name_m?.trim() || '',
            fecha_nacimiento: app.student_birth_date || '',
            padre_nombre: app.parent_name?.trim() || '',
            padre_email: app.parent_email?.trim() || '',
            padre_telefono_celular: app.parent_phone?.trim() || '',
          }))
        }
        setPrefillLoading(false)
      })
      .catch(() => setPrefillLoading(false))
  }, [citaId])

  const toggleConducta = (label: string) => {
    setForm(prev => {
      const list = prev.conductas || []
      const next = list.includes(label) ? list.filter(c => c !== label) : [...list, label]
      return { ...prev, conductas: next }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    setLoading(true)
    try {
      await submitExpedienteInicial({ ...form, appointment_id: form.appointment_id || citaId || null })
      setSubmitSuccess(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No se pudo guardar el expediente.')
    } finally {
      setLoading(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="expediente-page">
        <div className="expediente-success">
          <h1>Expediente enviado</h1>
          <p>Hemos recibido el Expediente Inicial. La psicología lo revisará antes de entregar los resultados de admisión.</p>
          <Link href="/" className="expediente-success-btn">Volver al inicio</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="expediente-page">
      <div className="expediente-header-bar">
        <Link href="/" className="expediente-back">← Volver al inicio</Link>
      </div>

      <form onSubmit={handleSubmit} className="expediente-form expediente-form-enter" id="datosa">
        <header className="expediente-hero">
          <div className="expediente-hero-confidencial">
            <span className="expediente-hero-icon" aria-hidden>🔒</span>
            <p>Esta información es requerida por el Departamento de Psicología</p>
            <p className="expediente-hero-sub">y será manejada de manera confidencial.</p>
          </div>
          <div className="expediente-hero-cta">
            <span className="expediente-hero-cta-icon">📋</span>
            Favor de llenar todos los campos del Expediente Inicial
          </div>
          <h1 className="expediente-hero-title">
            <span className="expediente-hero-title-line">Expediente Inicial</span>
            <span className="expediente-hero-title-line">del Aspirante</span>
          </h1>
        </header>

        {prefillLoading && (
          <p className="expediente-loading">Cargando datos de la cita…</p>
        )}

        {/* Datos del Alumno */}
        <section className="expediente-section expediente-section-enter">
          <h3 className="expediente-section-title">📚 Datos del Alumno</h3>
          <div className="expediente-grid">
            <div className="expediente-field">
              <label>Nivel</label>
              <input type="text" value={form.nivel || ''} readOnly className="readonly" />
            </div>
            <div className="expediente-field">
              <label>Grado al que desea ingresar</label>
              <input type="text" value={form.grado || ''} readOnly className="readonly" />
            </div>
            <div className="expediente-field">
              <label>Ciclo escolar</label>
              <input type="text" value={form.ciclo_escolar || ''} readOnly className="readonly" />
            </div>
            <div className="expediente-field">
              <label>Nombre del alumno</label>
              <input type="text" value={form.nombre_alumno || ''} readOnly className="readonly" />
            </div>
            <div className="expediente-field">
              <label>Apellido paterno</label>
              <input type="text" value={form.apellido_paterno_alumno || ''} readOnly className="readonly" />
            </div>
            <div className="expediente-field">
              <label>Apellido materno</label>
              <input type="text" value={form.apellido_materno_alumno || ''} readOnly className="readonly" />
            </div>
            <div className="expediente-field">
              <label>Fecha de nacimiento</label>
              <input type="date" value={form.fecha_nacimiento || ''} onChange={e => setField('fecha_nacimiento', e.target.value)} />
            </div>
            <div className="expediente-field">
              <label>Lugar de nacimiento</label>
              <input type="text" placeholder="Lugar de nacimiento" value={form.lugar_nacimiento || ''} onChange={e => setField('lugar_nacimiento', e.target.value)} />
            </div>
            <div className="expediente-field">
              <label>Sexo</label>
              <select value={form.sexo || ''} onChange={e => setField('sexo', e.target.value)}>
                <option value="">Seleccione</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
            </div>
            <div className="expediente-field">
              <label>Edad</label>
              <input type="number" min={1} max={18} placeholder="Edad en años" value={form.edad ?? ''} onChange={e => setField('edad', e.target.value ? parseInt(e.target.value, 10) : undefined)} />
            </div>
            <div className="expediente-field">
              <label>Escuela de procedencia</label>
              <input type="text" placeholder="Nombre de la escuela anterior" value={form.escuela_procedencia || ''} onChange={e => setField('escuela_procedencia', e.target.value)} />
            </div>
          </div>
        </section>

        {/* Datos del Padre */}
        <section className="expediente-section expediente-section-enter">
          <h3 className="expediente-section-title">👤 Datos del Padre</h3>
          <div className="expediente-grid">
            <div className="expediente-field">
              <label>Nombre</label>
              <input type="text" placeholder="Nombre" value={form.padre_nombre || ''} onChange={e => setField('padre_nombre', e.target.value)} />
            </div>
            <div className="expediente-field">
              <label>Apellido paterno</label>
              <input type="text" placeholder="Apellido paterno" value={form.padre_apellido_paterno || ''} onChange={e => setField('padre_apellido_paterno', e.target.value)} />
            </div>
            <div className="expediente-field">
              <label>Apellido materno</label>
              <input type="text" placeholder="Apellido materno" value={form.padre_apellido_materno || ''} onChange={e => setField('padre_apellido_materno', e.target.value)} />
            </div>
            <div className="expediente-field">
              <label>Edad</label>
              <input type="number" placeholder="Edad" value={form.padre_edad ?? ''} onChange={e => setField('padre_edad', e.target.value ? parseInt(e.target.value, 10) : undefined)} />
            </div>
            <div className="expediente-field">
              <label>Email</label>
              <input type="email" placeholder="Email" value={form.padre_email || ''} onChange={e => setField('padre_email', e.target.value)} />
            </div>
            <div className="expediente-field">
              <label>Lugar de trabajo</label>
              <input type="text" placeholder="Lugar de trabajo" value={form.padre_lugar_trabajo || ''} onChange={e => setField('padre_lugar_trabajo', e.target.value)} maxLength={20} />
            </div>
            <div className="expediente-field">
              <label>Estado civil</label>
              <input type="text" placeholder="Estado civil" value={form.padre_estado_civil || ''} onChange={e => setField('padre_estado_civil', e.target.value)} />
            </div>
            <div className="expediente-field">
              <label>Teléfono de trabajo</label>
              <input type="tel" placeholder="Solo números" value={form.padre_telefono_trabajo || ''} onChange={e => setField('padre_telefono_trabajo', e.target.value)} />
            </div>
            <div className="expediente-field">
              <label>Teléfono celular</label>
              <input type="tel" placeholder="10 dígitos" value={form.padre_telefono_celular || ''} onChange={e => setField('padre_telefono_celular', e.target.value)} />
            </div>
          </div>
        </section>

        {/* Datos de la Madre */}
        <section className="expediente-section expediente-section-enter">
          <h3 className="expediente-section-title">👩 Datos de la Madre</h3>
          <div className="expediente-grid">
            <div className="expediente-field">
              <label>Nombre</label>
              <input type="text" placeholder="Nombre" value={form.madre_nombre || ''} onChange={e => setField('madre_nombre', e.target.value)} />
            </div>
            <div className="expediente-field">
              <label>Apellido paterno</label>
              <input type="text" placeholder="Apellido paterno" value={form.madre_apellido_paterno || ''} onChange={e => setField('madre_apellido_paterno', e.target.value)} />
            </div>
            <div className="expediente-field">
              <label>Apellido materno</label>
              <input type="text" placeholder="Apellido materno" value={form.madre_apellido_materno || ''} onChange={e => setField('madre_apellido_materno', e.target.value)} />
            </div>
            <div className="expediente-field">
              <label>Edad</label>
              <input type="number" placeholder="Edad" value={form.madre_edad ?? ''} onChange={e => setField('madre_edad', e.target.value ? parseInt(e.target.value, 10) : undefined)} />
            </div>
            <div className="expediente-field">
              <label>Email</label>
              <input type="email" placeholder="Email" value={form.madre_email || ''} onChange={e => setField('madre_email', e.target.value)} />
            </div>
            <div className="expediente-field">
              <label>Lugar de trabajo</label>
              <input type="text" placeholder="Lugar de trabajo" value={form.madre_lugar_trabajo || ''} onChange={e => setField('madre_lugar_trabajo', e.target.value)} maxLength={20} />
            </div>
            <div className="expediente-field">
              <label>Estado civil</label>
              <input type="text" placeholder="Estado civil" value={form.madre_estado_civil || ''} onChange={e => setField('madre_estado_civil', e.target.value)} />
            </div>
            <div className="expediente-field">
              <label>Teléfono de trabajo</label>
              <input type="tel" placeholder="Solo números" value={form.madre_telefono_trabajo || ''} onChange={e => setField('madre_telefono_trabajo', e.target.value)} />
            </div>
            <div className="expediente-field">
              <label>Teléfono celular</label>
              <input type="tel" placeholder="10 dígitos" value={form.madre_telefono_celular || ''} onChange={e => setField('madre_telefono_celular', e.target.value)} />
            </div>
          </div>
        </section>

        {/* Datos Médicos */}
        <section className="expediente-section expediente-section-enter">
          <h3 className="expediente-section-title">🏥 Datos Médicos</h3>
          <div className="expediente-grid">
            <div className="expediente-field full-width">
              <label>¿Su hijo ha recibido algún tratamiento médico en el último año? Especifique:</label>
              <input type="text" value={form.tratamiento_medico_ultimo_ano || ''} onChange={e => setField('tratamiento_medico_ultimo_ano', e.target.value)} />
            </div>
            <div className="expediente-field full-width">
              <label>¿Tratamiento psicológico en el último año? ¿Cuál fue la razón?</label>
              <div className="expediente-check-row">
                <label><input type="checkbox" checked={form.tratamiento_psicologico_si === true} onChange={e => setField('tratamiento_psicologico_si', e.target.checked)} /> Sí</label>
                <label><input type="checkbox" checked={form.tratamiento_psicologico_si === false} onChange={() => setField('tratamiento_psicologico_si', false)} /> No</label>
              </div>
              <input type="text" placeholder="Razón o detalles" value={form.tratamiento_psicologico_razon || ''} onChange={e => setField('tratamiento_psicologico_razon', e.target.value)} />
            </div>
            <div className="expediente-field full-width">
              <label>¿Asiste a clase extracurricular? Especifique:</label>
              <input type="text" value={form.clase_extracurricular || ''} onChange={e => setField('clase_extracurricular', e.target.value)} />
            </div>
            <div className="expediente-field full-width">
              <label>Nombre de la escuela o guardería de procedencia</label>
              <input type="text" value={form.nombre_escuela_guarderia || ''} onChange={e => setField('nombre_escuela_guarderia', e.target.value)} />
            </div>
            <div className="expediente-field full-width">
              <label>Motivo de la separación</label>
              <input type="text" maxLength={100} value={form.motivo_separacion || ''} onChange={e => setField('motivo_separacion', e.target.value)} />
            </div>
            <div className="expediente-field full-width">
              <label>Motivo por el que desea incorporarlo(a) a nuestra institución</label>
              <input type="text" value={form.motivo_incorporacion || ''} onChange={e => setField('motivo_incorporacion', e.target.value)} />
            </div>
            <div className="expediente-field full-width">
              <label>¿Algo que le preocupe en torno al desenvolvimiento o aprovechamiento de su hijo(a)?</label>
              <input type="text" required minLength={2} maxLength={75} value={form.preocupacion_desenvolvimiento || ''} onChange={e => setField('preocupacion_desenvolvimiento', e.target.value)} />
            </div>
            <div className="expediente-field">
              <label>Nombre de la persona que proporcionó la información</label>
              <input type="text" required minLength={2} maxLength={35} value={form.nombre_persona_info || ''} onChange={e => setField('nombre_persona_info', e.target.value)} />
            </div>
            <div className="expediente-field">
              <label>Relación con el alumno</label>
              <input type="text" required minLength={2} maxLength={75} value={form.relacion_alumno || ''} onChange={e => setField('relacion_alumno', e.target.value)} />
            </div>
          </div>
        </section>

        {/* Evaluación de Comportamiento */}
        <section className="expediente-section expediente-section-enter">
          <h3 className="expediente-section-title">✨ Evaluación de Comportamiento</h3>
          <p className="expediente-section-note">Señale los comportamientos que ha identificado en su pequeño(a):</p>
          <div className="expediente-conductas">
            {CONDUCTAS_OPTIONS.map(label => (
              <label key={label} className="expediente-check">
                <input type="checkbox" checked={(form.conductas || []).includes(label)} onChange={() => toggleConducta(label)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <div className="expediente-field full-width">
            <label>Conductas señaladas que están en proceso de control:</label>
            <textarea rows={3} placeholder="Describa las conductas en proceso de control…" value={form.conductas_proceso_control || ''} onChange={e => setField('conductas_proceso_control', e.target.value)} />
          </div>
        </section>

        {/* Info Psicológica y Médica */}
        <section className="expediente-section expediente-section-enter">
          <h3 className="expediente-section-title">💡 Información Psicológica y Médica</h3>
          <div className="expediente-grid">
            <div className="expediente-field full-width">
              <label>¿Alguno de los padres trabaja fuera de la ciudad?</label>
              <div className="expediente-check-row">
                <label><input type="checkbox" checked={form.padre_trabaja_fuera_ciudad === true} onChange={e => setField('padre_trabaja_fuera_ciudad', e.target.checked)} /> Papá</label>
                <label><input type="checkbox" checked={form.madre_trabaja_fuera_ciudad === true} onChange={e => setField('madre_trabaja_fuera_ciudad', e.target.checked)} /> Mamá</label>
              </div>
            </div>
            <div className="expediente-field full-width">
              <label>Alergias y/o padecimientos</label>
              <textarea rows={2} placeholder="Describa…" value={form.alergias_padecimientos || ''} onChange={e => setField('alergias_padecimientos', e.target.value)} />
            </div>
            <div className="expediente-field full-width">
              <label>Diagnósticos médicos</label>
              <textarea rows={2} placeholder="Especifique…" value={form.diagnosticos_medicos || ''} onChange={e => setField('diagnosticos_medicos', e.target.value)} />
            </div>
          </div>
        </section>

        {/* Info Familiar */}
        <section className="expediente-section expediente-section-enter">
          <h3 className="expediente-section-title">👨‍👩‍👧‍👦 Información Familiar</h3>
          <div className="expediente-grid">
            <div className="expediente-field">
              <label>Número de familiares adicionales</label>
              <input type="number" min={0} max={10} value={form.num_familiares_adicionales ?? ''} onChange={e => setField('num_familiares_adicionales', e.target.value ? parseInt(e.target.value, 10) : undefined)} />
            </div>
            <div className="expediente-field">
              <label>Lugar que ocupa el aspirante</label>
              <input type="number" min={1} max={10} value={form.lugar_ocupa_aspirante ?? ''} onChange={e => setField('lugar_ocupa_aspirante', e.target.value ? parseInt(e.target.value, 10) : undefined)} />
            </div>
            <div className="expediente-field">
              <label>Edades (ej: 5, 8, 12)</label>
              <input type="text" placeholder="Ej: 5, 8, 12" value={form.edades_familiares || ''} onChange={e => setField('edades_familiares', e.target.value)} />
            </div>
          </div>
          <p className="expediente-section-note">Si viven otros familiares en el mismo domicilio, menciónelos:</p>
          <div className="expediente-familiares">
            {([1, 2, 3, 4] as const).map(n => (
              <div key={n} className="expediente-familiar-block">
                <label>Familiar {n}</label>
                <input type="text" placeholder="Nombre" value={form[`familiar_${n}_nombre` as keyof ExpedienteFormData] as string || ''} onChange={e => setField(`familiar_${n}_nombre` as keyof ExpedienteFormData, e.target.value)} />
                <input type="text" placeholder="Apellidos" value={form[`familiar_${n}_apellidos` as keyof ExpedienteFormData] as string || ''} onChange={e => setField(`familiar_${n}_apellidos` as keyof ExpedienteFormData, e.target.value)} />
                <input type="number" placeholder="Edad" value={form[`familiar_${n}_edad` as keyof ExpedienteFormData] as number ?? ''} onChange={e => setField(`familiar_${n}_edad` as keyof ExpedienteFormData, e.target.value ? parseInt(e.target.value, 10) : undefined)} />
              </div>
            ))}
          </div>
        </section>

        {/* Contacto */}
        <section className="expediente-section expediente-section-enter">
          <h3 className="expediente-section-title">📞 Información de Contacto</h3>
          <div className="expediente-field">
            <label>Teléfono principal de contacto</label>
            <input type="tel" placeholder="10 dígitos" value={form.telefono_principal || ''} onChange={e => setField('telefono_principal', e.target.value)} />
          </div>
        </section>

        {submitError && (
          <div className="expediente-error">
            {submitError}
          </div>
        )}

        <div className="expediente-submit-area">
          <button type="submit" className="expediente-submit-btn" disabled={loading}>
            {loading ? 'Enviando…' : '✓ ENVIAR EXPEDIENTE INICIAL'}
          </button>
          <p className="expediente-submit-note">* Haga clic en el botón para guardar el expediente. Es requisito para que la psicología entregue los resultados de admisión.</p>
        </div>
      </form>
    </div>
  )
}

export default function ExpedienteInicialPage() {
  return (
    <Suspense fallback={
      <div className="expediente-page">
        <p style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.9)' }}>Cargando…</p>
      </div>
    }>
      <ExpedienteInicialContent />
    </Suspense>
  )
}
