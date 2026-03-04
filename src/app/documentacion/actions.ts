'use server'

import { createAdminClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'

const PSICOLOGIA_EMAILS: Record<string, string> = {
  maternal:   'psicologia.kinder@winston93.edu.mx',
  kinder:     'psicologia.kinder@winston93.edu.mx',
  primaria:   'psicologia.primaria@winston93.edu.mx',
  secundaria: 'psicologia.secundaria@winston93.edu.mx',
}

const LEVEL_LABELS: Record<string, string> = {
  maternal:   'Maternal',
  kinder:     'Kinder',
  primaria:   'Primaria',
  secundaria: 'Secundaria',
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

export async function sendDocumentacion(payload: {
  level: string
  studentName: string
  parentEmail: string
  parentName: string
  files: { filename: string; content: string; mimetype: string }[]
}) {
  try {
    const destino = PSICOLOGIA_EMAILS[payload.level] ?? PSICOLOGIA_EMAILS.primaria
    const nivel   = LEVEL_LABELS[payload.level]   ?? payload.level

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'sistemas.desarrollo@winston93.edu.mx',
        pass: 'ckxc xdfg oxqx jtmm',
      },
    })

    const attachments = payload.files.map(f => ({
      filename:    f.filename,
      content:     f.content.includes(',') ? f.content.split(',')[1] : f.content,
      encoding:    'base64' as const,
      contentType: f.mimetype,
    }))

    const html = `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#1e40af 100%);color:white;padding:1.5rem 2rem;border-radius:8px 8px 0 0;text-align:center;">
    <h2 style="margin:0;">📤 Documentación de Admisión</h2>
    <p style="margin:0.5rem 0 0;opacity:0.85;">Nivel ${nivel}</p>
  </div>
  <div style="background:#f9fafb;padding:2rem;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;">
    <p>Estimada Psicología,</p>
    <p>Se ha recibido la documentación del aspirante:</p>
    <table style="border-collapse:collapse;width:100%;margin:1rem 0;">
      <tr><td style="padding:0.5rem;font-weight:bold;color:#64748b;width:130px;">Alumno</td><td style="padding:0.5rem;">${payload.studentName}</td></tr>
      <tr><td style="padding:0.5rem;font-weight:bold;color:#64748b;">Nivel</td><td style="padding:0.5rem;">${nivel}</td></tr>
      <tr><td style="padding:0.5rem;font-weight:bold;color:#64748b;">Padre/Tutor</td><td style="padding:0.5rem;">${payload.parentName}</td></tr>
      <tr><td style="padding:0.5rem;font-weight:bold;color:#64748b;">Correo</td><td style="padding:0.5rem;">${payload.parentEmail}</td></tr>
    </table>
    <p>Se adjuntan <strong>${attachments.length}</strong> documento(s) al presente correo.</p>
    <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:1rem;border-radius:4px;margin-top:1.5rem;">
      ⚠️ Esta documentación es requisito para entregar los resultados del examen de admisión.
    </div>
    <p style="margin-top:2rem;color:#94a3b8;font-size:0.85rem;text-align:center;">
      Sistema de Admisión — Instituto Educativo Winston / Winston Churchill
    </p>
  </div>
</body>
</html>`

    await transporter.sendMail({
      from:        '"Sistema de Admisión" <sistemas.desarrollo@winston93.edu.mx>',
      to:          destino,
      cc:          'sistemas.desarrollo@winston93.edu.mx',
      subject:     `Documentación de Admisión - ${payload.studentName} (${nivel})`,
      html,
      attachments,
    })

    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al enviar'
    return { ok: false, error: msg }
  }
}
