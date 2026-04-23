'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getExpedienteForPdf } from './actions'

type PdfState =
  | { status: 'idle' | 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready' }

function safe(v: unknown) {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  const s = String(v).trim()
  return s ? s : '—'
}

function formatDateISO(iso?: string | null) {
  if (!iso) return '—'
  // llega como YYYY-MM-DD en supabase para DATE, o ISO para timestamptz.
  const d = iso.length === 10 ? new Date(iso + 'T12:00:00') : new Date(iso)
  if (Number.isNaN(d.getTime())) return safe(iso)
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: '2-digit' })
}

function buildNombreCompleto(appt: any, expediente: any) {
  const base = [
    expediente?.nombre_alumno ?? appt?.student_name,
    expediente?.apellido_paterno_alumno ?? appt?.student_last_name_p,
    expediente?.apellido_materno_alumno ?? appt?.student_last_name_m,
  ]
    .filter(Boolean)
    .join(' ')
    .trim()
  return base || (appt?.student_name ?? '—')
}

export default function ExpedientePdfPage() {
  const searchParams = useSearchParams()
  const citaId = searchParams.get('cita')

  const [state, setState] = useState<PdfState>({ status: 'idle' })
  const [downloaded, setDownloaded] = useState(false)

  const filename = useMemo(() => {
    const id = (citaId ?? '').slice(0, 8) || 'expediente'
    return `ExpedienteInicial-${id}.pdf`
  }, [citaId])

  useEffect(() => {
    if (!citaId) {
      setState({ status: 'error', message: 'No se especificó el ID de la cita.' })
      return
    }
    const cita = citaId
    let cancelled = false

    async function run() {
      setState({ status: 'loading' })
      try {
        const payload = await getExpedienteForPdf(cita)
        if (cancelled) return
        if (!payload?.expediente) {
          setState({ status: 'error', message: 'No se encontró el expediente inicial para esta cita.' })
          return
        }

        const { jsPDF } = await import('jspdf')
        const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4', compress: true })

        const pageW = doc.internal.pageSize.getWidth()
        const pageH = doc.internal.pageSize.getHeight()
        const margin = 40
        const contentW = pageW - margin * 2

        let y = 0

        const ensureSpace = (needed: number) => {
          if (y + needed <= pageH - margin) return
          doc.addPage()
          y = margin
          drawHeader(true)
          y += 18
        }

        const drawHeader = (isContinuation = false) => {
          // Banda superior
          doc.setFillColor(15, 23, 42) // slate-900
          doc.rect(0, 0, pageW, 92, 'F')

          const gutter = 18
          const leftMaxW = Math.floor(pageW * 0.62) - margin // reserva espacio al nombre
          const rightMaxW = pageW - margin - (margin + leftMaxW) - gutter

          doc.setTextColor(255, 255, 255)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(16)
          const instLines = doc.splitTextToSize('Instituto Educativo Winston / Winston Churchill', Math.max(220, leftMaxW))
          doc.text(instLines, margin, 32)

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(11)
          doc.setTextColor(226, 232, 240) // slate-200
          doc.text(
            isContinuation ? 'Expediente Inicial (continuación)' : 'Expediente Inicial del Aspirante',
            margin,
            62
          )

          // Meta
          const appt = payload.appointment
          const exp = payload.expediente
          const nombre = buildNombreCompleto(appt, exp)

          const rightX = pageW - margin
          // Nombre: se envuelve para no empalmarse con el título institucional.
          // Ajuste dinámico a 1-2 líneas usando rightMaxW.
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(255, 255, 255)
          let nameSize = 12
          doc.setFontSize(nameSize)
          let nameLines = doc.splitTextToSize(nombre, Math.max(160, rightMaxW))
          while (nameLines.length > 2 && nameSize > 9) {
            nameSize -= 1
            doc.setFontSize(nameSize)
            nameLines = doc.splitTextToSize(nombre, Math.max(160, rightMaxW))
          }
          if (nameLines.length > 2) nameLines = nameLines.slice(0, 2)
          doc.text(nameLines, rightX, 28, { align: 'right' })

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(10)
          doc.setTextColor(203, 213, 225) // slate-300
          const citaStr = appt?.appointment_date
            ? `${formatDateISO(appt.appointment_date)} · ${safe(appt.appointment_time)}`
            : 'Cita: —'
          const metaY = nameLines.length > 1 ? 58 : 48
          doc.text(citaStr, rightX, metaY, { align: 'right' })
          doc.text(`ID cita: ${cita}`, rightX, metaY + 16, { align: 'right' })
        }

        const drawSectionTitle = (title: string) => {
          ensureSpace(44)
          doc.setFillColor(241, 245, 249) // slate-100
          doc.roundedRect(margin, y, contentW, 28, 8, 8, 'F')
          doc.setTextColor(15, 23, 42)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(12)
          doc.text(title, margin + 12, y + 19)
          y += 40
        }

        const drawKeyValueGrid = (pairs: Array<{ label: string; value: string }>) => {
          const colGap = 16
          const colW = (contentW - colGap) / 2
          const padX = 10
          const padY = 10
          const rowGap = 10

          let i = 0
          while (i < pairs.length) {
            const left = pairs[i]
            const right = pairs[i + 1]

            const leftText = doc.splitTextToSize(left.value, colW - padX * 2)
            const rightText = right ? doc.splitTextToSize(right.value, colW - padX * 2) : []

            const leftLines = Math.max(1, leftText.length)
            const rightLines = right ? Math.max(1, rightText.length) : 0
            const lines = Math.max(leftLines, rightLines || 1)

            const boxH = padY * 2 + 14 + lines * 12
            ensureSpace(boxH + rowGap)

            // Left box
            doc.setFillColor(255, 255, 255)
            doc.setDrawColor(226, 232, 240)
            doc.roundedRect(margin, y, colW, boxH, 10, 10, 'FD')
            doc.setTextColor(100, 116, 139) // slate-500
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(9)
            doc.text(left.label, margin + padX, y + padY + 10)
            doc.setTextColor(15, 23, 42)
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
            doc.text(leftText, margin + padX, y + padY + 26)

            // Right box
            if (right) {
              const x2 = margin + colW + colGap
              doc.setFillColor(255, 255, 255)
              doc.setDrawColor(226, 232, 240)
              doc.roundedRect(x2, y, colW, boxH, 10, 10, 'FD')
              doc.setTextColor(100, 116, 139)
              doc.setFont('helvetica', 'bold')
              doc.setFontSize(9)
              doc.text(right.label, x2 + padX, y + padY + 10)
              doc.setTextColor(15, 23, 42)
              doc.setFont('helvetica', 'normal')
              doc.setFontSize(10)
              doc.text(rightText, x2 + padX, y + padY + 26)
            }

            y += boxH + rowGap
            i += 2
          }
        }

        // Primera página
        drawHeader(false)
        y = 110

        const exp: any = payload.expediente
        const appt: any = payload.appointment

        drawSectionTitle('Datos del Aspirante')
        drawKeyValueGrid([
          { label: 'Nivel', value: safe(exp.nivel ?? appt?.level) },
          { label: 'Grado', value: safe(exp.grado ?? appt?.grade_level) },
          { label: 'Ciclo escolar', value: safe(exp.ciclo_escolar ?? appt?.school_cycle) },
          { label: 'Nombre completo', value: buildNombreCompleto(appt, exp) },
          { label: 'Fecha de nacimiento', value: formatDateISO(exp.fecha_nacimiento ?? appt?.student_birth_date) },
          { label: 'Lugar de nacimiento', value: safe(exp.lugar_nacimiento) },
          { label: 'Sexo', value: safe(exp.sexo) },
          { label: 'Edad', value: safe(exp.edad ?? appt?.student_age) },
          { label: 'Escuela de procedencia', value: safe(exp.escuela_procedencia) },
          { label: 'Campus', value: safe(appt?.campus) },
        ])

        drawSectionTitle('Datos del Padre')
        drawKeyValueGrid([
          { label: 'Nombre', value: safe(exp.padre_nombre) },
          { label: 'Apellido paterno', value: safe(exp.padre_apellido_paterno) },
          { label: 'Apellido materno', value: safe(exp.padre_apellido_materno) },
          { label: 'Edad', value: safe(exp.padre_edad) },
          { label: 'Estado civil', value: safe(exp.padre_estado_civil) },
          { label: 'Email', value: safe(exp.padre_email ?? appt?.parent_email) },
          { label: 'Lugar de trabajo', value: safe(exp.padre_lugar_trabajo) },
          { label: 'Teléfono trabajo', value: safe(exp.padre_telefono_trabajo) },
          { label: 'Teléfono celular', value: safe(exp.padre_telefono_celular ?? appt?.parent_phone) },
          { label: 'Trabaja fuera de la ciudad', value: safe(exp.padre_trabaja_fuera_ciudad) },
        ])

        drawSectionTitle('Datos de la Madre')
        drawKeyValueGrid([
          { label: 'Nombre', value: safe(exp.madre_nombre) },
          { label: 'Apellido paterno', value: safe(exp.madre_apellido_paterno) },
          { label: 'Apellido materno', value: safe(exp.madre_apellido_materno) },
          { label: 'Edad', value: safe(exp.madre_edad) },
          { label: 'Estado civil', value: safe(exp.madre_estado_civil) },
          { label: 'Email', value: safe(exp.madre_email) },
          { label: 'Lugar de trabajo', value: safe(exp.madre_lugar_trabajo) },
          { label: 'Teléfono trabajo', value: safe(exp.madre_telefono_trabajo) },
          { label: 'Teléfono celular', value: safe(exp.madre_telefono_celular) },
          { label: 'Trabaja fuera de la ciudad', value: safe(exp.madre_trabaja_fuera_ciudad) },
        ])

        drawSectionTitle('Información Médica y Psicológica')
        drawKeyValueGrid([
          { label: 'Tratamiento médico último año', value: safe(exp.tratamiento_medico_ultimo_ano) },
          { label: 'Tratamiento psicológico', value: safe(exp.tratamiento_psicologico_si) },
          { label: 'Razón (psicológico)', value: safe(exp.tratamiento_psicologico_razon) },
          { label: 'Alergias / padecimientos', value: safe(exp.alergias_padecimientos) },
          { label: 'Diagnósticos médicos', value: safe(exp.diagnosticos_medicos) },
          { label: 'Clase extracurricular', value: safe(exp.clase_extracurricular) },
        ])

        drawSectionTitle('Información Escolar y Familiar')
        drawKeyValueGrid([
          { label: 'Guardería / escuela', value: safe(exp.nombre_escuela_guarderia) },
          { label: 'Motivo separación', value: safe(exp.motivo_separacion) },
          { label: 'Motivo incorporación', value: safe(exp.motivo_incorporacion) },
          { label: 'Preocupación desenvolvimiento', value: safe(exp.preocupacion_desenvolvimiento) },
          { label: 'Persona que proporciona info', value: safe(exp.nombre_persona_info) },
          { label: 'Relación con alumno', value: safe(exp.relacion_alumno) },
        ])

        // Conductas
        drawSectionTitle('Evaluación de Comportamiento')
        const conductas = Array.isArray(exp.conductas) ? exp.conductas : []
        drawKeyValueGrid([
          { label: 'Conductas señaladas', value: conductas.length ? conductas.join(', ') : '—' },
          { label: 'Conductas en proceso de control', value: safe(exp.conductas_proceso_control) },
        ])

        drawSectionTitle('Núcleo Familiar y Contacto')
        drawKeyValueGrid([
          { label: 'Familiares adicionales', value: safe(exp.num_familiares_adicionales) },
          { label: 'Lugar que ocupa', value: safe(exp.lugar_ocupa_aspirante) },
          { label: 'Edades familiares', value: safe(exp.edades_familiares) },
          { label: 'Teléfono principal', value: safe(exp.telefono_principal ?? appt?.parent_phone) },
          { label: 'Creado', value: formatDateISO(exp.created_at) },
          { label: 'Actualizado', value: formatDateISO(exp.updated_at) },
        ])

        // Pie
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(100, 116, 139)
        doc.text(
          'Documento generado desde AgendaW. Si detecta algún error, favor de verificar en el sistema.',
          margin,
          pageH - 24
        )

        doc.save(filename)
        setDownloaded(true)
        setState({ status: 'ready' })
      } catch (e) {
        if (cancelled) return
        const msg = e instanceof Error ? e.message : 'No se pudo generar el PDF.'
        setState({ status: 'error', message: msg })
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [citaId, filename])

  return (
    <div className="expediente-page" style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <header className="expediente-hero" style={{ marginBottom: '1.25rem' }}>
          <h1 className="expediente-hero-title">
            <span className="expediente-hero-title-line">📄 Generando PDF</span>
            <span className="expediente-hero-title-line" style={{ fontSize: '1rem', opacity: 0.85 }}>
              Expediente Inicial
            </span>
          </h1>
        </header>

        {state.status === 'loading' && (
          <div style={{ color: 'rgba(255,255,255,0.9)', textAlign: 'center', padding: '1rem' }}>
            Preparando el documento…
          </div>
        )}

        {state.status === 'error' && (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <p style={{ color: '#ef4444', marginBottom: '0.75rem' }}>{state.message}</p>
            <Link href="/admin" className="btn btn-secondary">Volver al admin</Link>
          </div>
        )}

        {state.status === 'ready' && (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '0.75rem' }}>
              {downloaded ? 'Listo. El PDF se descargó.' : 'Listo.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href={citaId ? `/expediente_inicial/ver?cita=${citaId}` : '/admin'} className="btn btn-secondary">
                Ver expediente en pantalla
              </Link>
              <Link href="/admin" className="btn btn-secondary">
                Volver al admin
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

