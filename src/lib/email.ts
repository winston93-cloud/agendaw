import nodemailer from 'nodemailer'
import path from 'path'
import fs from 'fs'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sistemas.desarrollo@winston93.edu.mx',
    pass: 'ckxc xdfg oxqx jtmm', // App Password de Gmail
  },
})

export type AdmissionConfirmationData = {
  parentName: string
  studentName: string
  appointmentDate: string
  appointmentTime: string
  campusName: string
  levelLabel: string
  expedienteUrl?: string
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return dateStr
  }
}

export async function sendAdmissionConfirmation(
  to: string,
  data: AdmissionConfirmationData
): Promise<{ ok: boolean; error?: string }> {
  const from = 'sistemas.desarrollo@winston93.edu.mx'
  const dateFormatted = formatDate(data.appointmentDate)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de cita de admisión</title>
</head>
<body style="margin:0; padding:0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; padding: 24px 16px;">
    <tr>
      <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); border-radius: 16px 16px 0 0; padding: 28px 24px; text-align: center;">
        <h1 style="margin: 0; color: #fff; font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em;">Instituto Winston</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 0.95rem;">Confirmación de cita de admisión</p>
      </td>
    </tr>
    <tr>
      <td style="background: #ffffff; padding: 28px 24px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; border-top: none;">
        <p style="margin: 0 0 16px; color: #334155; font-size: 1rem; line-height: 1.6;">Estimado(a) <strong>${escapeHtml(data.parentName)}</strong>,</p>
        <p style="margin: 0 0 20px; color: #475569; font-size: 0.95rem; line-height: 1.6;">Su solicitud de cita de admisión ha sido registrada correctamente.</p>
        ${data.expedienteUrl ? `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
          <tr>
            <td style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; padding: 16px; text-align: center;">
              <p style="margin: 0 0 8px; color: #92400e; font-size: 0.9rem; font-weight: 700;">Requisitos importantes</p>
              <p style="margin: 0 0 16px; color: #78350f; font-size: 0.9rem; line-height: 1.5;">
                Para que la psicología le entregue los resultados del examen de admisión, debe completar antes de su cita:<br>
                • <strong>Expediente Inicial del Aspirante</strong><br>
                • <strong>Subir Documentación Requerida</strong>
              </p>
              <a href="${escapeHtml(data.expedienteUrl.replace('/expediente_inicial?', '/menu-admision?'))}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #fff; padding: 12px 24px; border-radius: 10px; font-weight: 600; text-decoration: none; font-size: 0.95rem;">
                📋 Acceder a Requisitos
              </a>
            </td>
          </tr>
        </table>
        ` : ''}
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
          <tr>
            <td style="padding: 20px;">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">Aspirante</p>
              <p style="margin: 0; color: #1e293b; font-size: 1.05rem; font-weight: 600;">${escapeHtml(data.studentName)}</p>
              <p style="margin: 12px 0 0; color: #64748b; font-size: 0.8rem;">${escapeHtml(data.campusName)} · ${escapeHtml(data.levelLabel)}</p>
              <p style="margin: 16px 0 0; color: #64748b; font-size: 0.8rem;">Fecha de la cita</p>
              <p style="margin: 4px 0 0; color: #1e293b; font-size: 1.05rem; font-weight: 600;">${escapeHtml(dateFormatted)}</p>
              <p style="margin: 4px 0 0; color: #475569; font-size: 0.95rem;">Hora: <strong>${escapeHtml(data.appointmentTime)}</strong></p>
            </td>
          </tr>
        </table>
        <p style="margin: 20px 0 0; color: #64748b; font-size: 0.9rem; line-height: 1.6;">Recuerde enviar la documentación requerida por correo y realizar el pago de <strong>$200 MXN</strong> en recepción el día de su cita.</p>
        <p style="margin: 24px 0 0; color: #475569; font-size: 0.9rem; line-height: 1.6;">Saludos cordiales,<br><strong>Instituto Winston</strong></p>
      </td>
    </tr>
  </table>
</body>
</html>
`

  try {
    await transporter.sendMail({
      from: `"Instituto Winston" <${from}>`,
      to,
      subject: 'Confirmación de cita de admisión',
      html,
    })
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al enviar el correo'
    return { ok: false, error: message }
  }
}

/** Temario por grado de secundaria: 7mo → 1°, 8vo → 2°, 9no → 3°. Inglés se envía en los tres. */
const SECUNDARIA_TEMARIO_BY_GRADE: Record<string, string> = {
  secundaria_7: 'TEMARIO ADMISIÓN 1°.pdf',
  secundaria_8: 'TEMARIO ADMISIÓN 2°.pdf',
  secundaria_9: 'TEMARIO ADMISIÓN 3°.pdf',
}
const SECUNDARIA_INGLES = 'TEMARIO INGLES SECUNDARIA.pdf'

export type SecundariaTemariosData = {
  parentName: string
  studentName: string
  appointmentDate: string
  gradeLevel: string // secundaria_7 | secundaria_8 | secundaria_9
}

export async function sendSecundariaTemarios(
  to: string,
  data: SecundariaTemariosData
): Promise<{ ok: boolean; error?: string }> {
  const from = 'sistemas.desarrollo@winston93.edu.mx'
  const dateFormatted = formatDate(data.appointmentDate)
  const temarioFile = SECUNDARIA_TEMARIO_BY_GRADE[data.gradeLevel]
  if (!temarioFile) {
    return { ok: false, error: 'Grado de secundaria no válido para temarios' }
  }

  const possibleDirs = [
    path.join(process.cwd(), 'Secundaria'),
    path.join(process.cwd(), 'public', 'Secundaria'),
  ]
  let dir: string | null = null
  for (const d of possibleDirs) {
    try {
      if (fs.existsSync(d) && fs.statSync(d).isDirectory()) {
        dir = d
        break
      }
    } catch {
      continue
    }
  }
  if (!dir) {
    const err = `Carpeta Secundaria no encontrada (buscada en: ${possibleDirs.join(', ')})`
    console.error('[email temarios]', err)
    return { ok: false, error: err }
  }

  const attachments: { filename: string; content: Buffer }[] = []
  for (const filename of [temarioFile, SECUNDARIA_INGLES]) {
    try {
      const filePath = path.join(dir, filename)
      const content = fs.readFileSync(filePath)
      attachments.push({ filename, content })
    } catch (e) {
      console.warn('[email temarios] No se pudo leer:', filename, e)
    }
  }
  if (attachments.length === 0) {
    const err = 'No se encontraron los PDF de temarios en ' + dir
    console.error('[email temarios]', err)
    return { ok: false, error: err }
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Temarios de Admisión</title>
</head>
<body style="margin:0; padding:0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; padding: 24px 16px;">
    <tr>
      <td style="background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%); border-radius: 16px 16px 0 0; padding: 28px 24px; text-align: center;">
        <h1 style="margin: 0; color: #fff; font-size: 1.5rem; font-weight: 700;">Instituto Winston</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 0.95rem;">Temarios de Admisión</p>
      </td>
    </tr>
    <tr>
      <td style="background: #ffffff; padding: 28px 24px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; border-top: none;">
        <p style="margin: 0 0 16px; color: #334155; font-size: 1rem; line-height: 1.6;">Estimado(a) <strong>${escapeHtml(data.parentName)}</strong>,</p>
        <p style="margin: 0 0 20px; color: #475569; font-size: 0.95rem; line-height: 1.6;">Adjunto encontrará los <strong>temarios de admisión</strong> para el día del examen de admisión de su hijo(a) <strong>${escapeHtml(data.studentName)}</strong> (Secundaria).</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f0fdfa; border-radius: 12px; border: 1px solid #99f6e4;">
          <tr>
            <td style="padding: 20px;">
              <p style="margin: 0 0 8px; color: #0f766e; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">Fecha del examen de admisión</p>
              <p style="margin: 0; color: #134e4a; font-size: 1.05rem; font-weight: 600;">${escapeHtml(dateFormatted)}</p>
              <p style="margin: 12px 0 0; color: #64748b; font-size: 0.9rem;">En este correo se adjuntan el temario según el grado y el temario de inglés.</p>
            </td>
          </tr>
        </table>
        <p style="margin: 24px 0 0; color: #475569; font-size: 0.9rem; line-height: 1.6;">Saludos cordiales,<br><strong>Instituto Winston</strong></p>
      </td>
    </tr>
  </table>
</body>
</html>
`

  try {
    await transporter.sendMail({
      from: `"Instituto Winston" <${from}>`,
      to,
      subject: `Temarios de Admisión - Examen de admisión ${dateFormatted}`,
      html,
      attachments,
    })
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al enviar el correo de temarios'
    return { ok: false, error: message }
  }
}

export type RecorridoConfirmationData = {
  parentName: string
  parentEmail: string
  levelLabel: string
  tourDate: string
  tourTime: string
}

export async function sendRecorridoConfirmationToParent(
  data: RecorridoConfirmationData
): Promise<{ ok: boolean; error?: string }> {
  const from = 'sistemas.desarrollo@winston93.edu.mx'
  const dateFormatted = formatDate(data.tourDate)
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de recorrido programado</title>
</head>
<body style="margin:0; padding:0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; padding: 24px 16px;">
    <tr>
      <td style="background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); border-radius: 16px 16px 0 0; padding: 28px 24px; text-align: center;">
        <h1 style="margin: 0; color: #fff; font-size: 1.5rem; font-weight: 700;">Instituto Winston</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 0.95rem;">Confirmación de recorrido programado</p>
      </td>
    </tr>
    <tr>
      <td style="background: #ffffff; padding: 28px 24px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; border-top: none;">
        <p style="margin: 0 0 16px; color: #334155; font-size: 1rem; line-height: 1.6;">Estimado(a) <strong>${escapeHtml(data.parentName)}</strong>,</p>
        <p style="margin: 0 0 20px; color: #475569; font-size: 0.95rem; line-height: 1.6;">Le confirmamos que su recorrido por el plantel ha sido programado correctamente.</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
          <tr>
            <td style="padding: 20px;">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 0.8rem;">Nivel</p>
              <p style="margin: 0; color: #1e293b; font-size: 1.05rem; font-weight: 600;">${escapeHtml(data.levelLabel)}</p>
              <p style="margin: 16px 0 0; color: #64748b; font-size: 0.8rem;">Fecha del recorrido</p>
              <p style="margin: 4px 0 0; color: #1e293b; font-size: 1.05rem; font-weight: 600;">${escapeHtml(dateFormatted)}</p>
              <p style="margin: 4px 0 0; color: #475569; font-size: 0.95rem;">Hora: <strong>${escapeHtml(data.tourTime)}</strong></p>
            </td>
          </tr>
        </table>
        <p style="margin: 24px 0 0; color: #475569; font-size: 0.9rem; line-height: 1.6;">Saludos cordiales,<br><strong>Instituto Winston</strong></p>
      </td>
    </tr>
  </table>
</body>
</html>
`
  try {
    await transporter.sendMail({
      from: `"Instituto Winston" <${from}>`,
      to: data.parentEmail,
      subject: 'Confirmación de recorrido programado',
      html,
    })
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al enviar el correo'
    return { ok: false, error: message }
  }
}

const RECORRIDO_DIRECTOR_BY_LEVEL: Record<string, string> = {
  maternal: 'direccion.kinder@winston93.edu.mx',
  kinder: 'direccion.kinder@winston93.edu.mx',
  primaria: 'direccion.primaria@winston93.edu.mx',
  secundaria: 'direccion.secundaria@winston93.edu.mx',
}

export type RecorridoDirectorData = {
  parentName: string
  parentPhone: string
  parentEmail: string
  levelLabel: string
  tourDate: string
  tourTime: string
}

export async function sendRecorridoNotificationToDirector(
  level: 'maternal' | 'kinder' | 'primaria' | 'secundaria',
  data: RecorridoDirectorData
): Promise<{ ok: boolean; error?: string }> {
  const from = 'sistemas.desarrollo@winston93.edu.mx'
  const to = RECORRIDO_DIRECTOR_BY_LEVEL[level]
  if (!to) return { ok: false, error: 'Nivel no válido para notificación' }
  const dateFormatted = formatDate(data.tourDate)
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo recorrido programado</title>
</head>
<body style="margin:0; padding:0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; padding: 24px 16px;">
    <tr>
      <td style="background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); border-radius: 16px 16px 0 0; padding: 28px 24px; text-align: center;">
        <h1 style="margin: 0; color: #fff; font-size: 1.5rem; font-weight: 700;">Instituto Winston</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 0.95rem;">Nuevo recorrido programado</p>
      </td>
    </tr>
    <tr>
      <td style="background: #ffffff; padding: 28px 24px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; border-top: none;">
        <p style="margin: 0 0 20px; color: #475569; font-size: 0.95rem; line-height: 1.6;">Se ha programado un nuevo recorrido para el siguiente papá:</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
          <tr>
            <td style="padding: 20px;">
              <p style="margin: 0 0 4px; color: #64748b; font-size: 0.8rem;">Nombre</p>
              <p style="margin: 0; color: #1e293b; font-size: 1.05rem; font-weight: 600;">${escapeHtml(data.parentName)}</p>
              <p style="margin: 12px 0 0; color: #64748b; font-size: 0.8rem;">Teléfono</p>
              <p style="margin: 4px 0 0; color: #1e293b; font-size: 0.95rem;">${escapeHtml(data.parentPhone)}</p>
              <p style="margin: 12px 0 0; color: #64748b; font-size: 0.8rem;">Correo</p>
              <p style="margin: 4px 0 0; color: #1e293b; font-size: 0.95rem;">${escapeHtml(data.parentEmail)}</p>
              <p style="margin: 16px 0 0; color: #64748b; font-size: 0.8rem;">Nivel · Fecha y hora</p>
              <p style="margin: 4px 0 0; color: #1e293b; font-size: 1rem; font-weight: 600;">${escapeHtml(data.levelLabel)} · ${escapeHtml(dateFormatted)} ${escapeHtml(data.tourTime)}</p>
            </td>
          </tr>
        </table>
        <p style="margin: 24px 0 0; color: #475569; font-size: 0.9rem; line-height: 1.6;">Saludos cordiales,<br><strong>Sistema de Admisión</strong></p>
      </td>
    </tr>
  </table>
</body>
</html>
`
  try {
    await transporter.sendMail({
      from: `"Instituto Winston" <${from}>`,
      to,
      subject: `Nuevo recorrido programado - ${data.levelLabel} - ${dateFormatted}`,
      html,
    })
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al enviar el correo a directora'
    return { ok: false, error: message }
  }
}

/** Reagendación: cuando se modifica fecha u hora del recorrido */
export async function sendRecorridoReagendacionToParent(
  data: RecorridoConfirmationData
): Promise<{ ok: boolean; error?: string }> {
  const from = 'sistemas.desarrollo@winston93.edu.mx'
  const dateFormatted = formatDate(data.tourDate)
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reagendación de cita de recorrido</title>
</head>
<body style="margin:0; padding:0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; padding: 24px 16px;">
    <tr>
      <td style="background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); border-radius: 16px 16px 0 0; padding: 28px 24px; text-align: center;">
        <h1 style="margin: 0; color: #fff; font-size: 1.5rem; font-weight: 700;">Instituto Winston</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 0.95rem;">Reagendación de cita de recorrido</p>
      </td>
    </tr>
    <tr>
      <td style="background: #ffffff; padding: 28px 24px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; border-top: none;">
        <p style="margin: 0 0 16px; color: #334155; font-size: 1rem; line-height: 1.6;">Estimado(a) <strong>${escapeHtml(data.parentName)}</strong>,</p>
        <p style="margin: 0 0 20px; color: #475569; font-size: 0.95rem; line-height: 1.6;">Le informamos que su cita de recorrido ha sido <strong>reagendada</strong>. A continuación los datos actualizados:</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #fef3c7; border-radius: 12px; border: 1px solid #f59e0b;">
          <tr>
            <td style="padding: 16px;">
              <p style="margin: 0 0 4px; color: #92400e; font-size: 0.85rem; font-weight: 600;">Reagendación de cita</p>
              <p style="margin: 8px 0 0; color: #78350f; font-size: 0.9rem;">Nivel: <strong>${escapeHtml(data.levelLabel)}</strong></p>
              <p style="margin: 4px 0 0; color: #78350f; font-size: 0.9rem;">Nueva fecha: <strong>${escapeHtml(dateFormatted)}</strong></p>
              <p style="margin: 4px 0 0; color: #78350f; font-size: 0.9rem;">Nueva hora: <strong>${escapeHtml(data.tourTime)}</strong></p>
            </td>
          </tr>
        </table>
        <p style="margin: 24px 0 0; color: #475569; font-size: 0.9rem; line-height: 1.6;">Saludos cordiales,<br><strong>Instituto Winston</strong></p>
      </td>
    </tr>
  </table>
</body>
</html>
`
  try {
    await transporter.sendMail({
      from: `"Instituto Winston" <${from}>`,
      to: data.parentEmail,
      subject: 'Reagendación de cita de recorrido',
      html,
    })
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al enviar el correo'
    return { ok: false, error: message }
  }
}

/** Reagendación a directora: cuando se modifica fecha u hora del recorrido */
export async function sendRecorridoReagendacionToDirector(
  level: 'maternal' | 'kinder' | 'primaria' | 'secundaria',
  data: RecorridoDirectorData
): Promise<{ ok: boolean; error?: string }> {
  const from = 'sistemas.desarrollo@winston93.edu.mx'
  const to = RECORRIDO_DIRECTOR_BY_LEVEL[level]
  if (!to) return { ok: false, error: 'Nivel no válido para notificación' }
  const dateFormatted = formatDate(data.tourDate)
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reagendación de recorrido programado</title>
</head>
<body style="margin:0; padding:0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; padding: 24px 16px;">
    <tr>
      <td style="background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); border-radius: 16px 16px 0 0; padding: 28px 24px; text-align: center;">
        <h1 style="margin: 0; color: #fff; font-size: 1.5rem; font-weight: 700;">Instituto Winston</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 0.95rem;">Reagendación de cita de recorrido</p>
      </td>
    </tr>
    <tr>
      <td style="background: #ffffff; padding: 28px 24px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; border-top: none;">
        <p style="margin: 0 0 20px; color: #475569; font-size: 0.95rem; line-height: 1.6;">Se ha <strong>reagendado</strong> una cita de recorrido. Datos actualizados del papá:</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
          <tr>
            <td style="padding: 20px;">
              <p style="margin: 0 0 4px; color: #64748b; font-size: 0.8rem;">Nombre</p>
              <p style="margin: 0; color: #1e293b; font-size: 1.05rem; font-weight: 600;">${escapeHtml(data.parentName)}</p>
              <p style="margin: 12px 0 0; color: #64748b; font-size: 0.8rem;">Teléfono</p>
              <p style="margin: 4px 0 0; color: #1e293b; font-size: 0.95rem;">${escapeHtml(data.parentPhone)}</p>
              <p style="margin: 12px 0 0; color: #64748b; font-size: 0.8rem;">Correo</p>
              <p style="margin: 4px 0 0; color: #1e293b; font-size: 0.95rem;">${escapeHtml(data.parentEmail)}</p>
              <p style="margin: 16px 0 0; color: #92400e; font-size: 0.8rem;">Reagendación · Nueva fecha y hora</p>
              <p style="margin: 4px 0 0; color: #1e293b; font-size: 1rem; font-weight: 600;">${escapeHtml(data.levelLabel)} · ${escapeHtml(dateFormatted)} ${escapeHtml(data.tourTime)}</p>
            </td>
          </tr>
        </table>
        <p style="margin: 24px 0 0; color: #475569; font-size: 0.9rem; line-height: 1.6;">Saludos cordiales,<br><strong>Sistema de Admisión</strong></p>
      </td>
    </tr>
  </table>
</body>
</html>
`
  try {
    await transporter.sendMail({
      from: `"Instituto Winston" <${from}>`,
      to,
      subject: `Reagendación de cita de recorrido - ${data.levelLabel} - ${dateFormatted}`,
      html,
    })
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al enviar el correo a directora'
    return { ok: false, error: message }
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
