'use client'

import { useState } from 'react'
import Link from 'next/link'

type Step = 1 | 2 | 3 | 4

interface FormData {
  // Paso 1: Información del aspirante
  studentName: string
  studentAge: string
  gradeLevel: string
  
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
  const [formData, setFormData] = useState<FormData>({
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

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep((currentStep + 1) as Step)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as Step)
  }

  const handleSubmit = async () => {
    console.log('Enviando formulario:', formData)
    // Aquí irá la lógica para guardar en Supabase
    alert('¡Cita agendada exitosamente! Recibirás un correo de confirmación.')
  }

  const gradeLevels = [
    { value: 'maternal', label: 'Maternal' },
    { value: 'kinder1', label: 'Kinder 1' },
    { value: 'kinder2', label: 'Kinder 2' },
    { value: 'kinder3', label: 'Kinder 3' },
    { value: 'primaria1', label: '1° Primaria' },
    { value: 'primaria2', label: '2° Primaria' },
    { value: 'primaria3', label: '3° Primaria' },
    { value: 'primaria4', label: '4° Primaria' },
    { value: 'primaria5', label: '5° Primaria' },
    { value: 'primaria6', label: '6° Primaria' },
    { value: 'secundaria1', label: '1° Secundaria' },
    { value: 'secundaria2', label: '2° Secundaria' },
    { value: 'secundaria3', label: '3° Secundaria' },
  ]

  const availableTimes = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00'
  ]

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
            <h2 className="step-heading">📚 Información del Aspirante</h2>
            <p className="step-description">
              Ingresa los datos del estudiante que desea ingresar
            </p>

            <div className="form-grid">
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
                  min="3"
                  max="18"
                  value={formData.studentAge}
                  onChange={(e) => updateFormData('studentAge', e.target.value)}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Grado al que desea ingresar *</label>
                <select
                  className="form-select"
                  value={formData.gradeLevel}
                  onChange={(e) => updateFormData('gradeLevel', e.target.value)}
                  required
                >
                  <option value="">Selecciona un grado</option>
                  {gradeLevels.map((grade) => (
                    <option key={grade.value} value={grade.value}>
                      {grade.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button
                className="btn btn-primary"
                onClick={nextStep}
                disabled={!formData.studentName || !formData.studentAge || !formData.gradeLevel}
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

        {/* Step 3: Selección de Fecha y Hora */}
        {currentStep === 3 && (
          <div className="form-step">
            <h2 className="step-heading">📅 Selecciona Fecha y Hora</h2>
            <p className="step-description">
              Elige el día y horario que mejor te convenga
            </p>

            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Fecha de la cita *</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.appointmentDate}
                  onChange={(e) => updateFormData('appointmentDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Hora de la cita *</label>
                <div className="time-slots">
                  {availableTimes.map((time) => (
                    <button
                      key={time}
                      type="button"
                      className={`time-slot ${
                        formData.appointmentTime === time ? 'selected' : ''
                      }`}
                      onClick={() => updateFormData('appointmentTime', time)}
                    >
                      {time}
                    </button>
                  ))}
                </div>
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
                disabled={!formData.appointmentDate || !formData.appointmentTime}
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
                <h3>📚 Aspirante</h3>
                <p><strong>Nombre:</strong> {formData.studentName}</p>
                <p><strong>Edad:</strong> {formData.studentAge} años</p>
                <p><strong>Grado:</strong> {gradeLevels.find(g => g.value === formData.gradeLevel)?.label}</p>
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
                <p><strong>Hora:</strong> {formData.appointmentTime}</p>
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
