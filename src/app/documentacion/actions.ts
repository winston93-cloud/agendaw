'use server'

import { createAdminClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'

const PSICOLOGIA_EMAILS: Record<string, string> = {
  maternal: 'psicologia.kinder@winston93.edu.mx',
  kinder: 'psicologia.kinder@winston93.edu.mx',
  primaria: 'psicologia.primaria@winston93.edu.mx',
  secundaria: 'psicologia.secundaria@winston93.edu.mx',
}

export async function getAppointmentForDocs(appointmentId: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('admission_appointments')
    .select('id, level, student_name, student_last_name_p, student_last_name_m, parent_name, parent_email, appointment_date')
    .eq('id', appointmentId)
    .single()
  return data || null
}

export async function sendDocumentacion(data: {
  appointmentId: string
  level: string
  studentName: string
  parentEmail: string
  parentName: string
  files: { filename: string; content: string; mimetype: string }[]
}) {
  const psicologiaEmail = PSICOLOGIA_EMAILS[data.level] || PSICOLOGIA_EMAILS.primaria
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })

  const attachments = data.files.map(file => ({
    filename: file.filename,
    content: Buffer.from(file.content.split(',')[1], 'base64'),
    contentType: file.mimetype,
  }))

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 2rem; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 1rem; border-left: 4px solid #667eea; margin: 1rem 0; border-radius: 4px; }
        .footer { text-align: center; color: #666; font-size: 0.85rem; margin-top: 2rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📤 Documentación Recibida</h1>
          <p>Examen de Admisión</p>
        </div>
        <div class="content">
          <p>Estimada Psicología,</p>
          
          <p>Se ha recibido la documentación del aspirante:</p>
          
          <div class="info-box">
            <strong>Alumno:</strong> ${data.studentName}<br>
            <strong>Nivel:</strong> ${data.level.charAt(0).toUpperCase() + data.level.slice(1)}<br>
            <strong>Padre/Tutor:</strong> ${data.parentName}<br>
            <strong>Email:</strong> ${data.parentEmail}
          </div>
          
          <p><strong>Archivos adjuntos:</strong></p>
          <ul>
            ${data.files.map(f => `<li>${f.filename}</li>`).join('')}
          </ul>
          
          <p style="margin-top: 2rem; padding: 1rem; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
            ⚠️ <strong>Recordatorio:</strong> Esta documentación es requisito para entregar los resultados del examen de admisión al aspirante.
          </p>
          
          <div class="footer">
            <p>Este correo fue generado automáticamente por el Sistema de Admisión.<br>
            Instituto Educativo Winston / Winston Churchill</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    await transporter.sendMail({
      from: `"Sistema de Admisión" <${process.env.SMTP_USER}>`,
      to: psicologiaEmail,
      cc: 'sistemas.desarrollo@winston93.edu.mx',
      subject: `Documentación de Admisión - ${data.studentName}`,
      html,
      attachments,
    })
    return { ok: true }
  } catch (error) {
    console.error('[sendDocumentacion]', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Error al enviar' }
  }
}
