'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import ExamDateCalendar from '@/components/ExamDateCalendar'
import PublicThemeToggle from '@/components/PublicThemeToggle'
import ClientLangSelector from '@/components/ClientLangSelector'
import { createAdmissionAppointment } from './actions'

interface AlumnoResult {
  alumno_id: number
  alumno_ref: string
  alumno_nombre: string | null
  alumno_app: string | null
  alumno_apm: string | null
  alumno_nombre_completo: string | null
  alumno_nivel: number | null
  alumno_grado: number | null
  alumno_ciclo_escolar: number | null
}

type Step = 1 | 2

const SCHOOL_CYCLES = [
  { value: '2025-2026', label: '2025-2026' },
  { value: '2026-2027', label: '2026-2027' },
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
  howDidYouHearOther: string
  appointmentDate: string
  appointmentTime: string
  // Paso 2: Padre/tutor
  parentName: string
  parentEmail: string
  parentPhone: string
  relationship: string
  relationshipOther: string
}

export default function AgendarPage() {
  const t      = useTranslations('agendar')
  const locale = useLocale()

  const HOW_DID_YOU_HEAR_OPTIONS = [
    { value: '', label: t('aspirante.howPlaceholder') },
    { value: 'medios_impresos', label: t('aspirante.howOptions.impreso') },
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'familiar_conocido', label: t('aspirante.howOptions.familiar') },
    { value: 'programa_familia_winston', label: t('aspirante.howOptions.familia_winston') },
    { value: 'otra', label: t('aspirante.howOptions.otra') },
  ]

  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [scheduleTimes, setScheduleTimes] = useState<string[]>([])
  const [bookedSlots,   setBookedSlots]   = useState<string[]>([])
  const [blockedSlots,  setBlockedSlots]  = useState<string[]>([])
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [lastAppointmentId, setLastAppointmentId] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [smsSent, setSmsSent] = useState(false)
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false)
  const [pendingLeaveAction, setPendingLeaveAction] = useState<'prevStep' | 'goHome' | null>(null)
  const [submitError,   setSubmitError]   = useState<string | null>(null)
  const [isSubmitting,  setIsSubmitting]  = useState(false)
  const allowLeaveWithoutSendRef = useRef(false)

  // --- Programa Familia Winston ---
  const [showFamiliaModal, setShowFamiliaModal] = useState(false)
  const [familiaSearch, setFamiliaSearch] = useState('')
  const [familiaResults, setFamiliaResults] = useState<AlumnoResult[]>([])
  const [familiaSearching, setFamiliaSearching] = useState(false)
  const [familiaSelected, setFamiliaSelected] = useState<AlumnoResult | null>(null)
  const [familiaShowDropdown, setFamiliaShowDropdown] = useState(false)
  const [familiaGenerating, setFamiliaGenerating] = useState(false)
  const [familiaCtrlConfirmed, setFamiliaCtrlConfirmed] = useState<string | null>(null)
  const [familiaComprobante, setFamiliaComprobante] = useState<{
    id: number; qr: number; ctrl: string; nombreRef: string;
    estudiante: string; nivelGrado: string; ciclo: string;
  } | null>(null)
  const [familiaQrDataUrl, setFamiliaQrDataUrl] = useState<string | null>(null)
  const familiaSearchRef = useRef<HTMLDivElement>(null)

  const router = useRouter()
  const studentInfoRef = useRef<HTMLDivElement>(null)
  const afterHorarioRef = useRef<HTMLDivElement>(null)
  const confirmStepRef = useRef<HTMLDivElement>(null)
  const plantelNivelRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
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
    howDidYouHearOther: '',
    appointmentDate: '',
    appointmentTime: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    relationship: 'Padre',
    relationshipOther: '',
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
          { value: 'maternal_a', label: t('grades.maternalA'), campus: 'winston' },
          { value: 'maternal_b', label: t('grades.maternalB'), campus: 'winston' },
        ]
      }
      if (formData.level === 'kinder') {
        return [
          { value: 'kinder_1', label: t('grades.kinder1'), campus: 'winston' },
          { value: 'kinder_2', label: t('grades.kinder2'), campus: 'winston' },
          { value: 'kinder_3', label: t('grades.kinder3'), campus: 'winston' },
        ]
      }
      return []
    }
    // Churchill
    if (formData.level === 'primaria') {
      return [
        { value: 'primaria_1', label: t('grades.primaria1'), campus: 'churchill' },
        { value: 'primaria_2', label: t('grades.primaria2'), campus: 'churchill' },
        { value: 'primaria_3', label: t('grades.primaria3'), campus: 'churchill' },
        { value: 'primaria_4', label: t('grades.primaria4'), campus: 'churchill' },
        { value: 'primaria_5', label: t('grades.primaria5'), campus: 'churchill' },
        { value: 'primaria_6', label: t('grades.primaria6'), campus: 'churchill' },
      ]
    }
    if (formData.level === 'secundaria') {
      return [
        { value: 'secundaria_7', label: t('grades.secundaria7'), campus: 'churchill' },
        { value: 'secundaria_8', label: t('grades.secundaria8'), campus: 'churchill' },
        { value: 'secundaria_9', label: t('grades.secundaria9'), campus: 'churchill' },
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
      if (field === 'howDidYouHear' && value !== 'otra') {
        newData.howDidYouHearOther = ''
      }
      if (field === 'howDidYouHear' && value === 'programa_familia_winston') {
        // Abre modal al seleccionar Programa Familia Winston
        setTimeout(() => setShowFamiliaModal(true), 0)
      }
      if (field === 'relationship' && value !== 'Otro') {
        newData.relationshipOther = ''
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

  // Búsqueda autocomplete de alumnos con debounce
  const searchAlumnos = useCallback(async (query: string) => {
    if (query.length < 2) { setFamiliaResults([]); return }
    setFamiliaSearching(true)
    try {
      const res = await fetch(`/api/alumno-search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setFamiliaResults(Array.isArray(data) ? data : [])
      setFamiliaShowDropdown(true)
    } catch {
      setFamiliaResults([])
    } finally {
      setFamiliaSearching(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { if (familiaSearch) searchAlumnos(familiaSearch) }, 300)
    return () => clearTimeout(t)
  }, [familiaSearch, searchAlumnos])

  // Cierra el dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (familiaSearchRef.current && !familiaSearchRef.current.contains(e.target as Node)) {
        setFamiliaShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Genera QR code cuando hay datos de comprobante
  useEffect(() => {
    if (!familiaComprobante) { setFamiliaQrDataUrl(null); return }
    import('qrcode').then(QRCode => {
      QRCode.toDataURL(String(familiaComprobante.qr), { width: 180, margin: 1 })
        .then(url => setFamiliaQrDataUrl(url))
        .catch(() => setFamiliaQrDataUrl(null))
    })
  }, [familiaComprobante])

  const handleFamiliaSelect = (alumno: AlumnoResult) => {
    setFamiliaSelected(alumno)
    const nombre = [alumno.alumno_nombre, alumno.alumno_app, alumno.alumno_apm].filter(Boolean).join(' ')
    setFamiliaSearch(alumno.alumno_ref + (nombre ? ` — ${nombre}` : ''))
    setFamiliaShowDropdown(false)
  }

  const handleGenerarComprobante = async () => {
    if (!familiaSelected) return
    setFamiliaGenerating(true)
    try {
      const res = await fetch('/api/wsp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ctrl: parseInt(familiaSelected.alumno_ref) || 0 }),
      })

      let data: Record<string, unknown>
      try {
        data = await res.json()
      } catch {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      if (!data.ok) {
        const errMsg = [data.error, data.details, data.hint].filter(Boolean).join(' | ')
        throw new Error(errMsg || 'Error desconocido al guardar en WSP')
      }

      // Construir datos para mostrar el comprobante dentro del modal
      const estudianteNombre = [formData.studentName, formData.studentLastNameP, formData.studentLastNameM]
        .filter(Boolean).join(' ').toUpperCase() || 'N/D'
      const gradoLabel = getGradeLevels().find(g => g.value === formData.gradeLevel)?.label ?? ''
      const levelLabel: Record<string, string> = {
        maternal: 'Maternal', kinder: 'Kinder', primaria: 'Primaria', secundaria: 'Secundaria',
      }
      const nivelGrado = [levelLabel[formData.level] ?? formData.level, gradoLabel].filter(Boolean).join(' ')
      const ciclo = (formData.schoolCycle || '').replace('-', ' - ')
      const nombreRef = [familiaSelected.alumno_nombre, familiaSelected.alumno_app, familiaSelected.alumno_apm]
        .filter(Boolean).join(' ')

      setFamiliaCtrlConfirmed(familiaSelected.alumno_ref)
      setFamiliaComprobante({
        id: data.id as number,
        qr: data.qr as number,
        ctrl: familiaSelected.alumno_ref,
        nombreRef,
        estudiante: estudianteNombre,
        nivelGrado,
        ciclo,
      })
    } catch (err) {
      alert('❌ Error al generar comprobante:\n' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setFamiliaGenerating(false)
    }
  }

  const handleCloseFamiliaModal = () => {
    setShowFamiliaModal(false)
    // Si cierra sin confirmar, revierte la selección
    if (!familiaCtrlConfirmed) {
      setFormData(prev => ({ ...prev, howDidYouHear: '' }))
    }
    setFamiliaSearch('')
    setFamiliaResults([])
    setFamiliaSelected(null)
    setFamiliaShowDropdown(false)
    setFamiliaComprobante(null)
    setFamiliaQrDataUrl(null)
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

  // Horarios ya reservados para esta fecha y nivel (evitar doble reserva)
  useEffect(() => {
    if (!formData.appointmentDate || !formData.level) {
      setBookedSlots([])
      return
    }
    fetch(`/api/booked-slots?level=${formData.level}&date=${formData.appointmentDate}`)
      .then((res) => res.json())
      .then((data) => setBookedSlots(data.times || []))
      .catch(() => setBookedSlots([]))
  }, [formData.appointmentDate, formData.level])

  // Horarios bloqueados administrativamente para esta fecha y nivel
  useEffect(() => {
    if (!formData.appointmentDate || !formData.level) {
      setBlockedSlots([])
      return
    }
    const apiLevel = admissionLevelForApi()
    if (!apiLevel) { setBlockedSlots([]); return }
    fetch(`/api/blocked-slots?level=${apiLevel}&date=${formData.appointmentDate}`)
      .then((res) => res.json())
      .then((data) => setBlockedSlots(data.blockedTimes || []))
      .catch(() => setBlockedSlots([]))
  }, [formData.appointmentDate, formData.level])

  // Si el horario elegido está ocupado o bloqueado, limpiar selección
  useEffect(() => {
    setFormData((prev) => {
      if (prev.appointmentTime && (bookedSlots.includes(prev.appointmentTime) || blockedSlots.includes(prev.appointmentTime))) {
        return { ...prev, appointmentTime: '' }
      }
      return prev
    })
  }, [bookedSlots, blockedSlots])

  // Scroll a "Información del Aspirante" al elegir plantel y nivel
  useEffect(() => {
    if (formData.campus && formData.level && currentStep === 1) {
      studentInfoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [formData.campus, formData.level, currentStep])

  // Al seleccionar grado, bajar el scroll al calendario
  useEffect(() => {
    if (formData.gradeLevel && currentStep === 1) {
      calendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [formData.gradeLevel, currentStep])

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

  // Al cerrar la pestaña o recargar en paso confirmación: aviso nativo del navegador (no se puede mostrar nuestro modal ahí).
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentStep !== 2 || showSuccessModal || allowLeaveWithoutSendRef.current) return
      e.preventDefault()
      ;(e as BeforeUnloadEvent & { returnValue: string }).returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [currentStep, showSuccessModal])

  const nextStep = () => {
    if (currentStep < 2) setCurrentStep(2)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(1)
  }

  const openLeaveConfirmModal = (action: 'prevStep' | 'goHome') => {
    setPendingLeaveAction(action)
    setShowLeaveConfirmModal(true)
  }

  const closeLeaveConfirmModal = () => {
    setShowLeaveConfirmModal(false)
    setPendingLeaveAction(null)
  }

  const confirmSendFromModal = () => {
    closeLeaveConfirmModal()
    handleSubmit()
  }

  const declineSendAndLeave = () => {
    const action = pendingLeaveAction
    allowLeaveWithoutSendRef.current = true
    closeLeaveConfirmModal()
    if (action === 'prevStep') {
      setCurrentStep(1)
      allowLeaveWithoutSendRef.current = false
    } else if (action === 'goHome') {
      router.push('/')
    }
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      const result = await createAdmissionAppointment({
        campus: formData.campus,
        level: formData.level,
        grade_level: formData.gradeLevel,
        student_name: formData.studentName,
        student_age: formData.studentAge,
        student_last_name_p: formData.studentLastNameP || undefined,
        student_last_name_m: formData.studentLastNameM || undefined,
        student_birth_date: formData.studentBirthDate || undefined,
        school_cycle: formData.schoolCycle || undefined,
        how_did_you_hear: formData.howDidYouHear === 'otra'
          ? (formData.howDidYouHearOther?.trim() ? `Otra: ${formData.howDidYouHearOther.trim()}` : undefined)
          : (formData.howDidYouHear || undefined),
        parent_name: formData.parentName,
        parent_email: formData.parentEmail,
        parent_phone: formData.parentPhone,
        relationship: formData.relationship === 'Otro'
          ? (formData.relationshipOther?.trim() ? `Otro: ${formData.relationshipOther.trim()}` : 'Otro')
          : formData.relationship,
        appointment_date: formData.appointmentDate,
        appointment_time: formData.appointmentTime,
      })
      setLastAppointmentId(result?.id ?? null)
      setEmailSent(result?.emailSent ?? false)
      setSmsSent(result?.smsSent ?? false)
      setShowSuccessModal(true)
    } catch (e) {
      setSubmitError(t('errorMsg'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
    <div className="agendar-page">
      {/* Modal de confirmación exitosa */}
      {showSuccessModal && (
        <div className="success-modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="success-modal success-modal-with-expediente" onClick={(e) => e.stopPropagation()}>
            <div className="success-modal-icon">{t('success.icon')}</div>
            <h3 className="success-modal-title">{t('success.title')}</h3>
            <p className="success-modal-text">
              {t('success.emailText', { email: formData.parentEmail })}
            </p>
            <div className="success-modal-status">
              <p className={`status-item ${emailSent ? 'status-ok' : 'status-fail'}`}>
                <span className="status-icon">{emailSent ? '✓' : '✗'}</span>
                <span>{emailSent ? t('success.emailOk') : t('success.emailFail')}</span>
              </p>
              <p className={`status-item ${smsSent ? 'status-ok' : 'status-fail'}`}>
                <span className="status-icon">{smsSent ? '✓' : '✗'}</span>
                <span>{smsSent ? t('success.smsOk') : t('success.smsFail')}</span>
              </p>
            </div>
            {lastAppointmentId && (
              <div className="success-modal-expediente">
                <p className="success-modal-expediente-title">{t('success.reqTitle')}</p>
                <p className="success-modal-expediente-text">
                  {t('success.reqText')}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
                  <Link 
                    href={`/expediente_inicial?cita=${lastAppointmentId}`} 
                    className="success-modal-btn success-modal-btn-expediente" 
                    onClick={() => setShowSuccessModal(false)}
                    style={{ fontSize: '0.85rem', padding: '0.65rem 1rem' }}
                  >
                    {t('success.btnExpediente')}
                  </Link>
                  <Link 
                    href={`/documentacion?cita=${lastAppointmentId}`} 
                    className="success-modal-btn success-modal-btn-expediente" 
                    onClick={() => setShowSuccessModal(false)}
                    style={{ fontSize: '0.85rem', padding: '0.65rem 1rem', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}
                  >
                    {t('success.btnDocs')}
                  </Link>
                </div>
              </div>
            )}
            <Link href="/" className="success-modal-btn" onClick={() => setShowSuccessModal(false)}>
              {t('success.btnClose')}
            </Link>
          </div>
        </div>
      )}

      {/* Modal: ¿Desea enviar antes de salir? */}
      {showLeaveConfirmModal && (
        <div className="leave-confirm-modal-overlay" onClick={closeLeaveConfirmModal}>
          <div className="leave-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="leave-confirm-modal-title">{t('exitModal.title')}</h3>
            <p className="leave-confirm-modal-text">
              {t('exitModal.text')}
            </p>
            <ul className="leave-confirm-modal-list">
              <li>{t('exitModal.item1')}</li>
              <li>{t('exitModal.item2')}</li>
            </ul>
            <div className="leave-confirm-modal-actions">
              <button type="button" className="leave-confirm-btn leave-confirm-btn-primary" onClick={confirmSendFromModal}>
                {t('exitModal.confirmBtn')}
              </button>
              <button type="button" className="leave-confirm-btn leave-confirm-btn-secondary" onClick={declineSendAndLeave}>
                {t('exitModal.cancelBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {submitError && (
        <div className="agendar-error-banner">
          <span>{submitError}</span>
          <button type="button" className="agendar-error-close" onClick={() => setSubmitError(null)} aria-label="Cerrar">×</button>
        </div>
      )}

      <div className="agendar-header">
        <div className="agendar-header-top">
          {currentStep === 2 && !showSuccessModal ? (
            <button type="button" className="back-link" onClick={() => openLeaveConfirmModal('goHome')}>
              {t('back')}
            </button>
          ) : (
            <Link href="/" className="back-link">{t('back')}</Link>
          )}
          <div className="agendar-header-controls">
            <PublicThemeToggle />
            <ClientLangSelector />
          </div>
        </div>
        <h1>{t('title')}</h1>
        <p className="agendar-header-desc">{t('subtitle')}</p>
      </div>

      {/* Progress Bar */}
      <div className="progress-container progress-two">
        <div className="progress-bar">
          {[1, 2].map((step) => (
            <div
              key={step}
              className={`progress-step ${currentStep >= step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
            >
              <div className="progress-circle">{currentStep > step ? t('progress.done') : step}</div>
              <span className="progress-label">{step === 1 ? t('progress.step1') : t('progress.step2')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Steps */}
      <div className="form-container">
        {/* Step 1: Información del Aspirante */}
        {currentStep === 1 && (
          <div ref={plantelNivelRef} className="form-step">
            <h2 className="step-heading">{t('campus.heading')}</h2>
            <p className="step-description">
              {t('campus.desc')}
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
                <h3>{t('campus.campus1')}</h3>
                <p className="campus-website">{campusInfo.winston.website}</p>
                <div className="campus-levels">
                  <button
                    type="button"
                    className={`level-badge ${formData.campus === 'winston' && formData.level === 'maternal' ? 'selected' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setCampusAndLevel('winston', 'maternal'); }}
                  >
                    {t('levels.maternal')}
                  </button>
                  <button
                    type="button"
                    className={`level-badge ${formData.campus === 'winston' && formData.level === 'kinder' ? 'selected' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setCampusAndLevel('winston', 'kinder'); }}
                  >
                    {t('levels.kinder')}
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
                <h3>{t('campus.campus2')}</h3>
                <p className="campus-website">{campusInfo.churchill.website}</p>
                <div className="campus-levels">
                  <button
                    type="button"
                    className={`level-badge ${formData.campus === 'churchill' && formData.level === 'primaria' ? 'selected' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setCampusAndLevel('churchill', 'primaria'); }}
                  >
                    {t('levels.primaria')}
                  </button>
                  <button
                    type="button"
                    className={`level-badge ${formData.campus === 'churchill' && formData.level === 'secundaria' ? 'selected' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setCampusAndLevel('churchill', 'secundaria'); }}
                  >
                    {t('levels.secundaria')}
                  </button>
                </div>
              </div>
            </div>

            {formData.campus && formData.level && (
              <div className="student-info-section" ref={studentInfoRef}>
                <h3 className="section-subtitle">📚 {t('aspirante.heading')}</h3>
                
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">{t('aspirante.gradeLabel')}</label>
                    <select
                      className="form-select"
                      value={formData.gradeLevel}
                      onChange={(e) => updateFormData('gradeLevel', e.target.value)}
                      required
                    >
                      <option value="">{t('aspirante.gradePlaceholder')}</option>
                      {getGradeLevels().map((grade) => (
                        <option key={grade.value} value={grade.value}>
                          {grade.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.gradeLevel && (
                    <div ref={calendarRef} className="form-group full-width">
                      <label className="form-label">{t('aspirante.examDateLabel')}</label>
                      <ExamDateCalendar
                        value={formData.appointmentDate}
                        onChange={(date) => updateFormData('appointmentDate', date)}
                        blockedDates={blockedDates}
                        locale={locale}
                      />
                    </div>
                  )}

                  {formData.gradeLevel && formData.appointmentDate && (
                    <div className="form-group full-width">
                      <label className="form-label">{t('aspirante.scheduleLabel')}</label>
                      {scheduleTimes.length === 0 ? (
                        <p className="form-hint text-soft">{t('aspirante.noSchedules')}</p>
                      ) : (
                        <div className="time-slots">
                          {scheduleTimes.map((time) => {
                            const isBooked  = bookedSlots.includes(time)
                            const isBlocked = blockedSlots.includes(time)
                            const unavailable = isBooked || isBlocked
                            return (
                              <button
                                key={time}
                                type="button"
                                className={`time-slot ${formData.appointmentTime === time ? 'selected' : ''} ${unavailable ? 'time-slot-booked' : ''}`}
                                onClick={() => !unavailable && updateFormData('appointmentTime', time)}
                                disabled={unavailable}
                                title={isBlocked ? 'Horario no disponible' : isBooked ? t('aspirante.slotOccupiedTitle') : undefined}
                              >
                                {time}
                                {unavailable && <span className="time-slot-label"> {t('aspirante.slotOccupied')}</span>}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {(formData.appointmentTime || scheduleTimes.length === 0) && formData.gradeLevel && formData.appointmentDate && (
                    <div className="student-data-section" ref={afterHorarioRef}>
                      <h3 className="section-subtitle">{t('aspirante.heading')}</h3>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">{t('aspirante.nameLabel')}</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder={t('aspirante.namePlaceholder')}
                            value={formData.studentName}
                            onChange={(e) => updateFormData('studentName', e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">{t('aspirante.lastNamePLabel')}</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder={t('aspirante.lastNamePPlaceholder')}
                            value={formData.studentLastNameP}
                            onChange={(e) => updateFormData('studentLastNameP', e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">{t('aspirante.lastNameMLabel')}</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder={t('aspirante.lastNameMPlaceholder')}
                            value={formData.studentLastNameM}
                            onChange={(e) => updateFormData('studentLastNameM', e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">{t('aspirante.dobLabel')}</label>
                          <input
                            type="date"
                            className="form-input"
                            value={formData.studentBirthDate}
                            onChange={(e) => updateFormData('studentBirthDate', e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">{t('aspirante.phoneLabel')}</label>
                          <input
                            type="tel"
                            className="form-input"
                            placeholder={t('aspirante.phonePlaceholder')}
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
                          <label className="form-label">{t('aspirante.emailLabel')}</label>
                          <input
                            type="email"
                            className="form-input"
                            placeholder={t('aspirante.emailPlaceholder')}
                            value={formData.parentEmail}
                            onChange={(e) => updateFormData('parentEmail', e.target.value)}
                            required
                            title="Correo electrónico válido"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">{t('aspirante.cycleLabel')}</label>
                          <select
                            className="form-select"
                            value={formData.schoolCycle}
                            onChange={(e) => updateFormData('schoolCycle', e.target.value)}
                            required
                          >
                            <option value="">{t('aspirante.cyclePlaceholder')}</option>
                            {SCHOOL_CYCLES.map((c) => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group full-width">
                          <label className="form-label">{t('aspirante.howLabel')}</label>
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
                          {formData.howDidYouHear === 'otra' && (
                            <input
                              type="text"
                              className="form-input mt-2"
                              placeholder={t('aspirante.howOtherPlaceholder')}
                              value={formData.howDidYouHearOther}
                              onChange={(e) => updateFormData('howDidYouHearOther', e.target.value)}
                              required={formData.howDidYouHear === 'otra'}
                            />
                          )}
                        </div>

                        <div className="form-section-divider" />
                        <h3 className="section-subtitle">{t('tutor.heading')}</h3>
                        <div className="form-group">
                          <label className="form-label">{t('tutor.nameLabel')}</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder={t('tutor.namePlaceholder')}
                            value={formData.parentName}
                            onChange={(e) => updateFormData('parentName', e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">{t('tutor.relationLabel')}</label>
                          <select
                            className="form-select"
                            value={formData.relationship}
                            onChange={(e) => updateFormData('relationship', e.target.value)}
                            required
                          >
                            <option value="Padre">{t('tutor.relationOptions.padre')}</option>
                            <option value="Madre">{t('tutor.relationOptions.madre')}</option>
                            <option value="Tutor">{t('tutor.relationOptions.tutor')}</option>
                            <option value="Otro">{t('tutor.relationOptions.otro')}</option>
                          </select>
                          {formData.relationship === 'Otro' && (
                            <input
                              type="text"
                              className="form-input mt-2"
                              placeholder={t('tutor.relationOtherPlaceholder')}
                              value={formData.relationshipOther}
                              onChange={(e) => updateFormData('relationshipOther', e.target.value)}
                              required={formData.relationship === 'Otro'}
                            />
                          )}
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
                    (formData.howDidYouHear === 'otra' && !formData.howDidYouHearOther?.trim()) ||
                    !formData.parentPhone?.trim() || formData.parentPhone.replace(/\D/g, '').length !== 10 ||
                    !formData.parentEmail?.trim() || !formData.parentName?.trim() || !formData.relationship ||
                    (formData.relationship === 'Otro' && !formData.relationshipOther?.trim())
                  ))
                )}
              >
                {t('nextBtn')}
              </button>
            </div>
          </div>
        )}

        {/* Paso 2: Confirmación */}
        {currentStep === 2 && (
          <div ref={confirmStepRef} className="form-step form-step-confirm">
            <h2 className="step-heading">{t('confirm.heading')}</h2>
            <p className="step-description">
              {t('confirm.desc')}
            </p>

            <div className="summary-card">
              <div className="summary-section">
                <h3>{t('confirm.sectionCampus')}</h3>
                <p><strong>{t('confirm.campus')}</strong> {formData.campus === 'winston' ? campusInfo.winston.name : campusInfo.churchill.name}</p>
                <p><strong>{t('confirm.website')}</strong> {formData.campus === 'winston' ? campusInfo.winston.website : campusInfo.churchill.website}</p>
              </div>

              <div className="summary-section">
                <h3>{t('confirm.sectionAspirant')}</h3>
                <p><strong>{t('confirm.nombre')}</strong> {formData.studentName}{formData.studentLastNameP || formData.studentLastNameM ? ` ${formData.studentLastNameP || ''} ${formData.studentLastNameM || ''}`.trim() : ''}</p>
                <p><strong>{t('confirm.dob')}</strong> {formData.studentBirthDate ? new Date(formData.studentBirthDate + 'T12:00:00').toLocaleDateString('es-MX') : '—'}</p>
                <p><strong>{t('confirm.grado')}</strong> {getGradeLevels().find(g => g.value === formData.gradeLevel)?.label}</p>
                {formData.schoolCycle && <p><strong>{t('confirm.ciclo')}</strong> {formData.schoolCycle}</p>}
                {formData.howDidYouHear && (
                <p><strong>{t('confirm.howKnew')}</strong> {formData.howDidYouHear === 'otra' && formData.howDidYouHearOther?.trim()
                  ? `Otra: ${formData.howDidYouHearOther.trim()}`
                  : (HOW_DID_YOU_HEAR_OPTIONS.find(o => o.value === formData.howDidYouHear)?.label || formData.howDidYouHear)}</p>
              )}
              </div>

              <div className="summary-section">
                <h3>{t('confirm.sectionTutor')}</h3>
                <p><strong>{t('confirm.nombre')}</strong> {formData.parentName}</p>
                <p><strong>{t('confirm.parentesco')}</strong> {formData.relationship === 'Otro' && formData.relationshipOther?.trim()
                  ? `Otro: ${formData.relationshipOther.trim()}`
                  : formData.relationship}</p>
                <p><strong>{t('confirm.correo')}</strong> {formData.parentEmail}</p>
                <p><strong>{t('confirm.telefono')}</strong> {formData.parentPhone}</p>
              </div>

              <div className="summary-section highlight">
                <h3>{t('confirm.sectionCita')}</h3>
                <p><strong>{t('confirm.fecha')}</strong> {new Date(formData.appointmentDate).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>{t('confirm.hora')}</strong> {formData.appointmentTime || t('confirm.hourPending')}</p>
                <p><strong>{t('confirm.contacto')}</strong> {getContactEmail()}</p>
              </div>
            </div>

            <div className="form-actions form-actions-confirm">
              <button type="button" className="btn btn-secondary" onClick={prevStep}>
                {t('confirm.backBtn')}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-large"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="btn-spinner-wrap">
                    <span className="btn-spinner" aria-hidden="true" />
                    {t('confirm.submittingBtn')}
                  </span>
                ) : t('confirm.submitBtn')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* ─── Modal Programa Familia Winston ─────────────────────────────── */}
    {showFamiliaModal && (
      <div className="familia-overlay" onClick={familiaComprobante ? undefined : handleCloseFamiliaModal}>
        <div
          className={`familia-modal${familiaComprobante ? ' familia-modal-wide' : ''}`}
          onClick={e => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="familia-modal-header">
            <span className="familia-modal-icon">🏫</span>
            <div>
              <h2 className="familia-modal-title">
                {familiaComprobante ? t('familiaWinston.voucherTitle') : t('familiaWinston.title')}
              </h2>
              <p className="familia-modal-subtitle">{t('familiaWinston.subtitle')}</p>
            </div>
            <button className="familia-modal-close" onClick={handleCloseFamiliaModal} aria-label="Cerrar">✕</button>
          </div>

          {/* ── Vista 1: Búsqueda ── */}
          {!familiaComprobante && (
            <>
              <div className="familia-modal-body">
                <p className="familia-modal-desc">
                  {t('familiaWinston.desc')}
                </p>

                <div className="familia-search-wrap" ref={familiaSearchRef}>
                  <input
                    type="text"
                    className="familia-search-input"
                    placeholder={t('familiaWinston.searchPlaceholder')}
                    value={familiaSearch}
                    onChange={e => {
                      setFamiliaSearch(e.target.value)
                      setFamiliaSelected(null)
                      if (e.target.value.length >= 2) setFamiliaShowDropdown(true)
                      else setFamiliaShowDropdown(false)
                    }}
                    onFocus={() => { if (familiaResults.length > 0) setFamiliaShowDropdown(true) }}
                    autoFocus
                  />
                  {familiaSearching && <span className="familia-search-spinner">⏳</span>}

                  {familiaShowDropdown && familiaResults.length > 0 && (
                    <ul className="familia-dropdown">
                      {familiaResults.map(a => {
                        const nombre = [a.alumno_nombre, a.alumno_app, a.alumno_apm].filter(Boolean).join(' ')
                        const niveles: Record<number, string> = { 1: 'Maternal', 2: 'Kinder', 3: 'Primaria', 4: 'Secundaria' }
                        const nivel = a.alumno_nivel ? (niveles[a.alumno_nivel] ?? '') : ''
                        return (
                          <li
                            key={a.alumno_id}
                            className="familia-dropdown-item"
                            onMouseDown={() => handleFamiliaSelect(a)}
                          >
                            <span className="familia-dropdown-ref">#{a.alumno_ref}</span>
                            <span className="familia-dropdown-nombre">{nombre || 'Sin nombre'}</span>
                            {nivel && <span className="familia-dropdown-nivel">{nivel}{a.alumno_grado ? ` ${a.alumno_grado}°` : ''}</span>}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                  {familiaShowDropdown && familiaSearch.length >= 2 && !familiaSearching && familiaResults.length === 0 && (
                    <div className="familia-dropdown-empty">{t('familiaWinston.noResults')}</div>
                  )}
                </div>

                {familiaSelected && (
                  <div className="familia-selected-card">
                    <span className="familia-selected-check">✓</span>
                    <div>
                      <strong>
                        {[familiaSelected.alumno_nombre, familiaSelected.alumno_app, familiaSelected.alumno_apm].filter(Boolean).join(' ')}
                      </strong>
                      <span className="familia-selected-ctrl"> {t('familiaWinston.ctrlLabel')} {familiaSelected.alumno_ref}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="familia-modal-footer">
                <button className="familia-btn-cancel" onClick={handleCloseFamiliaModal}>
                  {t('familiaWinston.cancelBtn')}
                </button>
                <button
                  className="familia-btn-generar"
                  onClick={handleGenerarComprobante}
                  disabled={!familiaSelected || familiaGenerating}
                >
                  {familiaGenerating ? t('familiaWinston.generatingBtn') : t('familiaWinston.generateBtn')}
                </button>
              </div>
            </>
          )}

          {/* ── Vista 2: Comprobante ── */}
          {familiaComprobante && (
            <>
              <div className="familia-doc-scroll">
                {/* Documento imprimible */}
                <div className="familia-doc familia-print-area">

                  {/* Encabezado azul + franja amarilla */}
                  <div className="familia-doc-header">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/logo-winston-churchill.png"
                      alt="Winston"
                      className="familia-doc-logo"
                    />
                    <span className="familia-doc-header-title">Comprobante Familia Winston</span>
                    <div className="familia-doc-header-stripe" />
                  </div>

                  {/* Cuerpo */}
                  <div className="familia-doc-body">
                    <p className="familia-doc-saludo">{t('familiaWinston.voucherGreeting')}</p>

                    <p className="familia-doc-parrafo">
                      {t('familiaWinston.voucherP1', {
                        name: familiaComprobante.estudiante,
                        level: familiaComprobante.nivelGrado,
                        cycle: familiaComprobante.ciclo,
                        ctrl: familiaComprobante.ctrl,
                        refName: familiaComprobante.nombreRef,
                      })}
                    </p>

                    <p className="familia-doc-parrafo">
                      {t('familiaWinston.voucherP2')}
                    </p>

                    <p className="familia-doc-parrafo">
                      {t('familiaWinston.voucherP3')}
                    </p>

                    {/* QR */}
                    <div className="familia-doc-qr-wrap">
                      {familiaQrDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={familiaQrDataUrl} alt="QR" className="familia-doc-qr" />
                      ) : (
                        <div className="familia-doc-qr-placeholder">{familiaComprobante.qr}</div>
                      )}
                      <p className="familia-doc-qr-label">{t('familiaWinston.voucherQrLabel')}</p>
                    </div>

                    {/* Firma */}
                    <div className="familia-doc-firma">
                      <p>{t('familiaWinston.voucherSign')}</p>
                      <p className="familia-doc-firma-inst">{t('familiaWinston.voucherInstitution')}</p>
                    </div>

                    <div className="familia-doc-folio">
                      <span>Folio: WSP-{String(familiaComprobante.id).padStart(5, '0')}</span>
                      <span>{new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pie del modal */}
              <div className="familia-modal-footer">
                <button className="familia-btn-cancel" onClick={handleCloseFamiliaModal}>
                  {t('familiaWinston.continueBtn')}
                </button>
                <button className="familia-btn-generar" onClick={() => window.print()}>
                  {t('familiaWinston.printBtn')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
    </>
  )
}
