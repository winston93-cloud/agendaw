'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ExamDateCalendar from '@/components/ExamDateCalendar'
import { createAdmissionAppointment } from './actions'

type Step = 1 | 2

const SCHOOL_CYCLES = [
  { value: '2025-2026', label: '2025-2026' },
  { value: '2026-2027', label: '2026-2027' },
] as const

const HOW_DID_YOU_HEAR_OPTIONS = [
  { value: '', label: 'Seleccione una opción' },
  { value: 'medios_impresos', label: 'Medios Impresos' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'familiar_conocido', label: 'Familiar o Conocido' },
  { value: 'programa_familia_winston', label: 'Programa Familia Winston' },
  { value: 'otra', label: 'Otra' },
] as const

interface FormData {
  // Paso 1: Selección de plantel y nivel
  campus: string
  level: string
  gradeLevel: string
  studentName: string
  studentLastNameP: string
  studentLastNameM: string
  studentBirthDate: string
  studentAge: string
  schoolCycle: string
  howDidYouHear: string
  appointmentDate: string
  appointmentTime: string
  // Paso 2: Padre/tutor
  parentName: string
  parentEmail: string
  parentPhone: string
  relationship: string
  // Paso 4: Confirmación
  acceptTerms: boolean
  documentsSent: boolean
}

export default function AgendarPage() {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [scheduleTimes, setScheduleTimes] = useState<string[]>([])
  const studentInfoRef = useRef<HTMLDivElement>(null)
  const afterHorarioRef = useRef<HTMLDivElement>(null)
  const confirmStepRef = useRef<HTMLDivElement>(null)
  const plantelNivelRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState<FormData>({
    campus: '',
    level: '',
    studentName: '',
    studentLastNameP: '',
    studentLastNameM: '',
    studentBirthDate: '',
    studentAge: '',
    gradeLevel: '',
    schoolCycle: '',
    howDidYouHear: '',
    appointmentDate: '',
    appointmentTime: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    relationship: 'Padre',
    acceptTerms: false,
    documentsSent: false,
  })

  const campusInfo = {
    churchill: {
      name: 'Instituto Winston Churchill',
      website: 'www.winston93.edu.mx',
      levels: ['Primaria', 'Secundaria'],
      email: {
        primaria: 'psicologia.primaria@winston93.edu.mx',
        secundaria: 'psicologia.secundaria@winston93.edu.mx'
      }
    },
    winston: {
      name: 'Instituto Educativo Winston',
      website: 'www.winstonkinder.edu.mx',
      levels: ['Maternal', 'Kinder'],
      email: {
        maternal: 'psicologia.kinder@winston93.edu.mx',
        kinder: 'psicologia.kinder@winston93.edu.mx'
      }
    }
  }

  const getGradeLevels = () => {
    if (!formData.campus || !formData.level) return []
    
    if (formData.campus === 'winston') {
      if (formData.level === 'maternal') {
        return [
          { value: 'maternal_a', label: 'Maternal A', campus: 'winston' },
          { value: 'maternal_b', label: 'Maternal B', campus: 'winston' },
        ]
      }
      if (formData.level === 'kinder') {
        return [
          { value: 'kinder_1', label: 'Kinder-1', campus: 'winston' },
          { value: 'kinder_2', label: 'Kinder-2', campus: 'winston' },
          { value: 'kinder_3', label: 'Kinder-3', campus: 'winston' },
        ]
      }
      return []
    }
    // Churchill
    if (formData.level === 'primaria') {
      return [
        { value: 'primaria_1', label: '1° de Primaria', campus: 'churchill' },
        { value: 'primaria_2', label: '2° de Primaria', campus: 'churchill' },
        { value: 'primaria_3', label: '3° de Primaria', campus: 'churchill' },
        { value: 'primaria_4', label: '4° de Primaria', campus: 'churchill' },
        { value: 'primaria_5', label: '5° de Primaria', campus: 'churchill' },
        { value: 'primaria_6', label: '6° de Primaria', campus: 'churchill' },
      ]
    }
    if (formData.level === 'secundaria') {
      return [
        { value: 'secundaria_7', label: '7mo', campus: 'churchill' },
        { value: 'secundaria_8', label: '8vo', campus: 'churchill' },
        { value: 'secundaria_9', label: '9no', campus: 'churchill' },
      ]
    }
    return []
  }

  const getContactEmail = () => {
    if (!formData.gradeLevel) return ''
    
    if (formData.gradeLevel.startsWith('maternal_') || formData.gradeLevel.startsWith('kinder_')) {
      return campusInfo.winston.email.kinder
    }
    if (formData.gradeLevel.startsWith('primaria_')) {
      return campusInfo.churchill.email.primaria
    }
    if (formData.gradeLevel.startsWith('secundaria_')) {
      return campusInfo.churchill.email.secundaria
    }
    return ''
  }

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Si cambia el campus, resetear level y gradeLevel
      if (field === 'campus') {
        newData.level = ''
        newData.gradeLevel = ''
      }
      // Si cambia el nivel, resetear gradeLevel, fecha, horario y datos extra
      if (field === 'level') {
        newData.gradeLevel = ''
        newData.appointmentDate = ''
        newData.appointmentTime = ''
        newData.studentLastNameP = ''
        newData.studentLastNameM = ''
        newData.studentBirthDate = ''
        newData.schoolCycle = ''
        newData.howDidYouHear = ''
      }
      // Si cambia el grado, resetear fecha y horario
      if (field === 'gradeLevel') {
        newData.appointmentDate = ''
        newData.appointmentTime = ''
      }
      
      return newData
    })
  }

  const setCampusAndLevel = (campus: string, level: string) => {
    setFormData(prev => ({ ...prev, campus, level, gradeLevel: '', appointmentDate: '' }))
  }

  const admissionLevelForApi = (): string | null => {
    if (formData.level === 'maternal' || formData.level === 'kinder') return 'maternal_kinder'
    if (formData.level === 'primaria') return 'primaria'
    if (formData.level === 'secundaria') return 'secundaria'
    return null
  }

  useEffect(() => {
    const level = admissionLevelForApi()
    if (!level) {
      setBlockedDates([])
      setScheduleTimes([])
      return
    }
    Promise.all([
      fetch(`/api/blocked-dates?level=${level}`).then((res) => res.json()).then((data) => data.dates || []).catch(() => []),
      fetch(`/api/schedules?level=${level}`).then((res) => res.json()).then((data) => data.times || []).catch(() => []),
    ]).then(([dates, times]) => {
      setBlockedDates(dates)
      setScheduleTimes(times)
    })
  }, [formData.level])

  // Scroll a "Información del Aspirante" al elegir plantel y nivel
  useEffect(() => {
    if (formData.campus && formData.level && currentStep === 1) {
      studentInfoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [formData.campus, formData.level, currentStep])

  // Scroll a datos del alumno al elegir horario (o al tener fecha si no hay horarios configurados)
  useEffect(() => {
    const showDataBlock = (formData.appointmentTime || scheduleTimes.length === 0) && formData.gradeLevel && formData.appointmentDate
    if (showDataBlock && currentStep === 1) {
      afterHorarioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [formData.appointmentTime, formData.gradeLevel, formData.appointmentDate, scheduleTimes.length, currentStep])

  // Al pasar al paso de confirmar, ir al inicio de ese formulario
  useEffect(() => {
    if (currentStep === 2) {
      confirmStepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [currentStep])

  // Al cargar /agendar (paso 1), mostrar Plantel y nivel y botones en vista
  useEffect(() => {
    const t = setTimeout(() => {
      if (currentStep === 1 && plantelNivelRef.current) {
        plantelNivelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
    return () => clearTimeout(t)
  }, []) // solo al montar

  const nextStep = () => {
    if (currentStep < 2) setCurrentStep(2)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(1)
  }

  const handleSubmit = async () => {
    try {
      await createAdmissionAppointment({
        campus: formData.campus,
        level: formData.level,
        grade_level: formData.gradeLevel,
        student_name: formData.studentName,
        student_age: formData.studentAge,
        student_last_name_p: formData.studentLastNameP || undefined,
        student_last_name_m: formData.studentLastNameM || undefined,
        student_birth_date: formData.studentBirthDate || undefined,
        school_cycle: formData.schoolCycle || undefined,
        how_did_you_hear: formData.howDidYouHear || undefined,
        parent_name: formData.parentName,
        parent_email: formData.parentEmail,
        parent_phone: formData.parentPhone,
        relationship: formData.relationship,
        appointment_date: formData.appointmentDate,
        appointment_time: formData.appointmentTime,
      })
      alert('¡Cita agendada exitosamente! Recibirás un correo de confirmación.')
    } catch (e) {
      alert('No se pudo guardar la cita. Intenta de nuevo o contacta al plantel.')
    }
  }

  return (
    <div className="agendar-page">
      <div className="agendar-header">
        <Link href="/" className="back-link">← Volver al inicio</Link>
        <h1>Solicitud de cita de admisión</h1>
        <p className="agendar-header-desc">Complete los datos para agendar el examen de admisión.</p>
      </div>

      {/* Progress Bar */}
      <div className="progress-container progress-two">
        <div className="progress-bar">
          {[1, 2].map((step) => (
            <div
              key={step}
              className={`progress-step ${currentStep >= step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
            >
              <div className="progress-circle">{currentStep > step ? '✓' : step}</div>
              <span className="progress-label">{step === 1 ? 'Solicitud' : 'Confirmar'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Steps */}
      <div className="form-container">
        {/* Step 1: Información del Aspirante */}
        {currentStep === 1 && (
          <div ref={plantelNivelRef} className="form-step">
            <h2 className="step-heading">Plantel y nivel</h2>
            <p className="step-description">
              Seleccione el campus y el nivel educativo de interés.
            </p>

            <div className="campus-selection">
              <div 
                className={`campus-card ${formData.campus === 'winston' ? 'selected' : ''}`}
                onClick={() => updateFormData('campus', 'winston')}
              >
                <div className="campus-logo">
                  <Image 
                    src="/logo-winston-educativo.png" 
                    alt="Instituto Educativo Winston"
                    width={120}
                    height={120}
                    priority
                  />
                </div>
                <h3>Instituto Educativo Winston</h3>
                <p className="campus-website">{campusInfo.winston.website}</p>
                <div className="campus-levels">
                  <button
                    type="button"
                    className={`level-badge ${formData.campus === 'winston' && formData.level === 'maternal' ? 'selected' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setCampusAndLevel('winston', 'maternal'); }}
                  >
                    Maternal
                  </button>
                  <button
                    type="button"
                    className={`level-badge ${formData.campus === 'winston' && formData.level === 'kinder' ? 'selected' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setCampusAndLevel('winston', 'kinder'); }}
                  >
                    Kinder
                  </button>
                </div>
              </div>

              <div 
                className={`campus-card ${formData.campus === 'churchill' ? 'selected' : ''}`}
                onClick={() => updateFormData('campus', 'churchill')}
              >
                <div className="campus-logo">
                  <Image 
                    src="/logo-winston-churchill.png" 
                    alt="Instituto Winston Churchill"
                    width={120}
                    height={120}
                    priority
                  />
                </div>
                <h3>Instituto Winston Churchill</h3>
                <p className="campus-website">{campusInfo.churchill.website}</p>
                <div className="campus-levels">
                  <button
                    type="button"
                    className={`level-badge ${formData.campus === 'churchill' && formData.level === 'primaria' ? 'selected' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setCampusAndLevel('churchill', 'primaria'); }}
                  >
                    Primaria
                  </button>
                  <button
                    type="button"
                    className={`level-badge ${formData.campus === 'churchill' && formData.level === 'secundaria' ? 'selected' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setCampusAndLevel('churchill', 'secundaria'); }}
                  >
                    Secundaria
                  </button>
                </div>
              </div>
            </div>

            {formData.campus && formData.level && (
              <div className="student-info-section" ref={studentInfoRef}>
                <h3 className="section-subtitle">📚 Información del Aspirante</h3>
                
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">Grado al que desea ingresar *</label>
                    <select
                      className="form-select"
                      value={formData.gradeLevel}
                      onChange={(e) => updateFormData('gradeLevel', e.target.value)}
                      required
                    >
                      <option value="">Selecciona un grado</option>
                      {getGradeLevels().map((grade) => (
                        <option key={grade.value} value={grade.value}>
                          {grade.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.gradeLevel && (
                    <div className="form-group full-width">
                      <label className="form-label">Fecha del examen de admisión *</label>
                      <ExamDateCalendar
                        value={formData.appointmentDate}
                        onChange={(date) => updateFormData('appointmentDate', date)}
                        blockedDates={blockedDates}
                      />
                    </div>
                  )}

                  {formData.gradeLevel && formData.appointmentDate && (
                    <div className="form-group full-width">
                      <label className="form-label">Horario al que asistiría *</label>
                      {scheduleTimes.length === 0 ? (
                        <p className="form-hint text-soft">No hay horarios configurados para este nivel. La escuela te contactará para confirmar.</p>
                      ) : (
                        <div className="time-slots">
                          {scheduleTimes.map((time) => (
                            <button
                              key={time}
                              type="button"
                              className={`time-slot ${formData.appointmentTime === time ? 'selected' : ''}`}
                              onClick={() => updateFormData('appointmentTime', time)}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {(formData.appointmentTime || scheduleTimes.length === 0) && formData.gradeLevel && formData.appointmentDate && (
                    <div className="student-data-section" ref={afterHorarioRef}>
                      <h3 className="section-subtitle">Datos del alumno</h3>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">Nombre del alumno *</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Nombre del alumno"
                            value={formData.studentName}
                            onChange={(e) => updateFormData('studentName', e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Apellido paterno *</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Apellido paterno"
                            value={formData.studentLastNameP}
                            onChange={(e) => updateFormData('studentLastNameP', e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Apellido materno *</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Apellido materno"
                            value={formData.studentLastNameM}
                            onChange={(e) => updateFormData('studentLastNameM', e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Fecha de nacimiento *</label>
                          <input
                            type="date"
                            className="form-input"
                            value={formData.studentBirthDate}
                            onChange={(e) => updateFormData('studentBirthDate', e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Teléfono *</label>
                          <input
                            type="tel"
                            className="form-input"
                            placeholder="10 dígitos"
                            value={formData.parentPhone}
                            onChange={(e) => updateFormData('parentPhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                            inputMode="numeric"
                            pattern="[0-9]{10}"
                            maxLength={10}
                            required
                            title="10 dígitos sin espacios"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Email *</label>
                          <input
                            type="email"
                            className="form-input"
                            placeholder="correo@ejemplo.com"
                            value={formData.parentEmail}
                            onChange={(e) => updateFormData('parentEmail', e.target.value)}
                            required
                            title="Correo electrónico válido"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Ciclo escolar al que desea ingresar *</label>
                          <select
                            className="form-select"
                            value={formData.schoolCycle}
                            onChange={(e) => updateFormData('schoolCycle', e.target.value)}
                            required
                          >
                            <option value="">Seleccione una opción</option>
                            {SCHOOL_CYCLES.map((c) => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group full-width">
                          <label className="form-label">¿Cómo se enteró de nuestra institución? *</label>
                          <select
                            className="form-select"
                            value={formData.howDidYouHear}
                            onChange={(e) => updateFormData('howDidYouHear', e.target.value)}
                            required
                          >
                            {HOW_DID_YOU_HEAR_OPTIONS.map((o) => (
                              <option key={o.value || 'empty'} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-section-divider" />
                        <h3 className="section-subtitle">Responsable del aspirante</h3>
                        <div className="form-group">
                          <label className="form-label">Nombre completo del padre o tutor *</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Ej: María García López"
                            value={formData.parentName}
                            onChange={(e) => updateFormData('parentName', e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Parentesco *</label>
                          <select
                            className="form-select"
                            value={formData.relationship}
                            onChange={(e) => updateFormData('relationship', e.target.value)}
                            required
                          >
                            <option value="Padre">Padre</option>
                            <option value="Madre">Madre</option>
                            <option value="Tutor">Tutor</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="form-actions">
              <button
                className="btn btn-primary btn-submit-step"
                onClick={nextStep}
                disabled={Boolean(
                  !formData.campus || !formData.level || !formData.gradeLevel || !formData.appointmentDate ||
                  (scheduleTimes.length > 0 && !formData.appointmentTime) ||
                  ((formData.appointmentTime || scheduleTimes.length === 0) && (
                    !formData.studentName?.trim() || !formData.studentLastNameP?.trim() || !formData.studentLastNameM?.trim() ||
                    !formData.studentBirthDate || !formData.schoolCycle || !formData.howDidYouHear ||
                    !formData.parentPhone?.trim() || formData.parentPhone.replace(/\D/g, '').length !== 10 ||
                    !formData.parentEmail?.trim() || !formData.parentName?.trim() || !formData.relationship
                  ))
                )}
              >
                Revisar y confirmar →
              </button>
            </div>
          </div>
        )}

        {/* Paso 2: Confirmación */}
        {currentStep === 2 && (
          <div ref={confirmStepRef} className="form-step form-step-confirm">
            <h2 className="step-heading">Confirmación de tu solicitud</h2>
            <p className="step-description">
              Revisa que todos los datos sean correctos antes de enviar.
            </p>

            <div className="summary-card">
              <div className="summary-section">
                <h3>🏫 Plantel</h3>
                <p><strong>Campus:</strong> {formData.campus === 'winston' ? campusInfo.winston.name : campusInfo.churchill.name}</p>
                <p><strong>Sitio web:</strong> {formData.campus === 'winston' ? campusInfo.winston.website : campusInfo.churchill.website}</p>
              </div>

              <div className="summary-section">
                <h3>📚 Aspirante</h3>
                <p><strong>Nombre:</strong> {formData.studentName}{formData.studentLastNameP || formData.studentLastNameM ? ` ${formData.studentLastNameP || ''} ${formData.studentLastNameM || ''}`.trim() : ''}</p>
                <p><strong>Fecha de nacimiento:</strong> {formData.studentBirthDate ? new Date(formData.studentBirthDate + 'T12:00:00').toLocaleDateString('es-MX') : '—'}</p>
                <p><strong>Grado:</strong> {getGradeLevels().find(g => g.value === formData.gradeLevel)?.label}</p>
                {formData.schoolCycle && <p><strong>Ciclo escolar:</strong> {formData.schoolCycle}</p>}
                {formData.howDidYouHear && <p><strong>Cómo se enteró:</strong> {HOW_DID_YOU_HEAR_OPTIONS.find(o => o.value === formData.howDidYouHear)?.label || formData.howDidYouHear}</p>}
              </div>

              <div className="summary-section">
                <h3>👤 Padre/Tutor</h3>
                <p><strong>Nombre:</strong> {formData.parentName}</p>
                <p><strong>Parentesco:</strong> {formData.relationship}</p>
                <p><strong>Email:</strong> {formData.parentEmail}</p>
                <p><strong>Teléfono:</strong> {formData.parentPhone}</p>
              </div>

              <div className="summary-section highlight">
                <h3>📅 Cita</h3>
                <p><strong>Fecha:</strong> {new Date(formData.appointmentDate).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Hora:</strong> {formData.appointmentTime || 'Por confirmar (la escuela te contactará)'}</p>
                <p><strong>Contacto:</strong> {getContactEmail()}</p>
              </div>
            </div>

            <div className="checkboxes">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.documentsSent}
                  onChange={(e) => updateFormData('documentsSent', e.target.checked)}
                />
                <span>
                  Confirmo que he enviado la documentación requerida por correo electrónico
                </span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) => updateFormData('acceptTerms', e.target.checked)}
                />
                <span>
                  Acepto realizar el pago de $200 MXN en recepción el día de la cita
                </span>
              </label>
            </div>

            <div className="form-actions form-actions-confirm">
              <button type="button" className="btn btn-secondary" onClick={prevStep}>
                ← Corregir datos
              </button>
              <button
                type="button"
                className="btn btn-primary btn-large"
                onClick={handleSubmit}
                disabled={!formData.acceptTerms || !formData.documentsSent}
              >
                Enviar solicitud
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
