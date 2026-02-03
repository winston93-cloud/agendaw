'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ExamDateCalendar from '@/components/ExamDateCalendar'
import { createAdmissionAppointment } from './actions'

type Step = 1 | 2 | 3 | 4

interface FormData {
  // Paso 1: Selección de plantel y nivel
  campus: string // 'churchill' o 'winston'
  level: string // 'maternal' | 'kinder' | 'primaria' | 'secundaria'
  gradeLevel: string
  studentName: string
  studentAge: string
  
  // Paso 2: Información del padre/tutor
  parentName: string
  parentEmail: string
  parentPhone: string
  relationship: string
  
  // Paso 3: Fecha y hora
  appointmentDate: string
  appointmentTime: string
  
  // Paso 4: Confirmación
  acceptTerms: boolean
  documentsSent: boolean
}

export default function AgendarPage() {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [scheduleTimes, setScheduleTimes] = useState<string[]>([])
  const [formData, setFormData] = useState<FormData>({
    campus: '',
    level: '',
    studentName: '',
    studentAge: '',
    gradeLevel: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    relationship: 'Padre',
    appointmentDate: '',
    appointmentTime: '',
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
      // Si cambia el nivel, resetear gradeLevel, fecha y horario
      if (field === 'level') {
        newData.gradeLevel = ''
        newData.appointmentDate = ''
        newData.appointmentTime = ''
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

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep((currentStep + 1) as Step)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as Step)
  }

  const handleSubmit = async () => {
    try {
      await createAdmissionAppointment({
        campus: formData.campus,
        level: formData.level,
        grade_level: formData.gradeLevel,
        student_name: formData.studentName,
        student_age: formData.studentAge,
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
        <Link href="/" className="back-link">← Volver</Link>
        <h1>Agendar Cita de Admisión</h1>
      </div>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`progress-step ${currentStep >= step ? 'active' : ''} ${
                currentStep > step ? 'completed' : ''
              }`}
            >
              <div className="progress-circle">
                {currentStep > step ? '✓' : step}
              </div>
              <span className="progress-label">
                {step === 1 && 'Aspirante'}
                {step === 2 && 'Tutor'}
                {step === 3 && 'Fecha'}
                {step === 4 && 'Confirmar'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Steps */}
      <div className="form-container">
        {/* Step 1: Información del Aspirante */}
        {currentStep === 1 && (
          <div className="form-step">
            <h2 className="step-heading">🏫 Selecciona el Plantel</h2>
            <p className="step-description">
              Elige el campus según el nivel educativo de interés
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
              <div className="student-info-section">
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

                  <div className="form-group">
                    <label className="form-label">Nombre completo del aspirante *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej: Juan Pérez García"
                      value={formData.studentName}
                      onChange={(e) => updateFormData('studentName', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Edad *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Ej: 6"
                      min="2"
                      max="18"
                      value={formData.studentAge}
                      onChange={(e) => updateFormData('studentAge', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button
                className="btn btn-primary"
                onClick={nextStep}
                disabled={
                  !formData.campus || !formData.level || !formData.studentName || !formData.studentAge || !formData.gradeLevel || !formData.appointmentDate ||
                  (scheduleTimes.length > 0 && !formData.appointmentTime)
                }
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Información del Padre/Tutor */}
        {currentStep === 2 && (
          <div className="form-step">
            <h2 className="step-heading">👤 Información del Padre/Tutor</h2>
            <p className="step-description">
              Datos de contacto del responsable
            </p>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nombre completo *</label>
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

              <div className="form-group">
                <label className="form-label">Correo electrónico *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="ejemplo@correo.com"
                  value={formData.parentEmail}
                  onChange={(e) => updateFormData('parentEmail', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Teléfono celular *</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="10 dígitos"
                  value={formData.parentPhone}
                  onChange={(e) => updateFormData('parentPhone', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button className="btn btn-secondary" onClick={prevStep}>
                ← Anterior
              </button>
              <button
                className="btn btn-primary"
                onClick={nextStep}
                disabled={
                  !formData.parentName ||
                  !formData.parentEmail ||
                  !formData.parentPhone ||
                  !formData.relationship
                }
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Selección de Hora (fecha ya elegida en paso 1) */}
        {currentStep === 3 && (
          <div className="form-step">
            <h2 className="step-heading">🕐 Selecciona la Hora</h2>
            <p className="step-description">
              Fecha del examen: <strong>{formData.appointmentDate ? new Date(formData.appointmentDate + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}</strong>
            </p>

            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Hora de la cita *</label>
                {scheduleTimes.length === 0 ? (
                  <p className="form-hint text-soft">No hay horarios configurados para este nivel. La escuela te contactará.</p>
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
            </div>

            <div className="info-box">
              <strong>📌 Importante:</strong>
              <p>
                La entrevista tiene una duración aproximada de 30 minutos. Por favor llega
                10 minutos antes de tu hora agendada.
              </p>
            </div>

            <div className="form-actions">
              <button className="btn btn-secondary" onClick={prevStep}>
                ← Anterior
              </button>
              <button
                className="btn btn-primary"
                onClick={nextStep}
                disabled={!formData.appointmentDate || (scheduleTimes.length > 0 && !formData.appointmentTime)}
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmación */}
        {currentStep === 4 && (
          <div className="form-step">
            <h2 className="step-heading">✅ Confirma tu Información</h2>
            <p className="step-description">
              Revisa que todos los datos sean correctos
            </p>

            <div className="summary-card">
              <div className="summary-section">
                <h3>🏫 Plantel</h3>
                <p><strong>Campus:</strong> {formData.campus === 'winston' ? campusInfo.winston.name : campusInfo.churchill.name}</p>
                <p><strong>Sitio web:</strong> {formData.campus === 'winston' ? campusInfo.winston.website : campusInfo.churchill.website}</p>
              </div>

              <div className="summary-section">
                <h3>📚 Aspirante</h3>
                <p><strong>Nombre:</strong> {formData.studentName}</p>
                <p><strong>Edad:</strong> {formData.studentAge} años</p>
                <p><strong>Grado:</strong> {getGradeLevels().find(g => g.value === formData.gradeLevel)?.label}</p>
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

            <div className="form-actions">
              <button className="btn btn-secondary" onClick={prevStep}>
                ← Anterior
              </button>
              <button
                className="btn btn-primary btn-large"
                onClick={handleSubmit}
                disabled={!formData.acceptTerms || !formData.documentsSent}
              >
                Confirmar Cita ✓
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
