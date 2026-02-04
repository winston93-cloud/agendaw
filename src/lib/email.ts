import nodemailer from 'nodemailer'

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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
