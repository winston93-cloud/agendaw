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
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('admission_appointments')
      .select('id, level, student_name, student_last_name_p, student_last_name_m, parent_name, parent_email, appointment_date')
      .eq('id', appointmentId)
      .single()
    
    if (error) {
      console.error('[getAppointmentForDocs] Supabase error:', error)
      return null
    }
    
    return data || null
  } catch (err) {
    console.error('[getAppointmentForDocs] Exception:', err)
    return null
  }
}

export async function sendDocumentacion(data: {
  appointmentId: string
  level: string
  studentName: string
  parentEmail: string
  parentName: string
  files: { filename: string; content: string; mimetype: string }[]
}) {
  try {
    console.log('[sendDocumentacion] Starting. Files count:', data.files.length)
    
    const psicologiaEmail = PSICOLOGIA_EMAILS[data.level] || PSICOLOGIA_EMAILS.primaria
    console.log('[sendDocumentacion] Target email:', psicologiaEmail)
    
    const supabase = createAdminClient()
    
    // Subir archivos a Supabase Storage en lugar de enviarlos por correo
    const uploadedFiles: { filename: string; url: string }[] = []
    
    for (let i = 0; i < data.files.length; i++) {
      const file = data.files[i]
      console.log(`[sendDocumentacion] Uploading file ${i}: ${file.filename}`)
      
      const base64Content = file.content.includes(',') ? file.content.split(',')[1] : file.content
      const buffer = Buffer.from(base64Content, 'base64')
      
      // Path: documentacion/{appointmentId}/{filename}
      const storagePath = `documentacion/${data.appointmentId}/${file.filename}`
      
      const { error: uploadError } = await supabase.storage
        .from('admission-documents')
        .upload(storagePath, buffer, {
          contentType: file.mimetype,
          upsert: true
        })
      
      if (uploadError) {
        console.error(`[sendDocumentacion] Upload error for ${file.filename}:`, uploadError)
        throw new Error(`Error al subir ${file.filename}: ${uploadError.message}`)
      }
      
      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('admission-documents')
        .getPublicUrl(storagePath)
      
      uploadedFiles.push({
        filename: file.filename,
        url: urlData.publicUrl
      })
      
      console.log(`[sendDocumentacion] File ${i} uploaded successfully: ${urlData.publicUrl}`)
    }
    
    console.log('[sendDocumentacion] All files uploaded. Total:', uploadedFiles.length)
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'sistemas.desarrollo@winston93.edu.mx',
        pass: 'ckxc xdfg oxqx jtmm', // App Password de Gmail
      },
    })

    console.log('[sendDocumentacion] Transporter created')

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
          .file-link { display: inline-block; margin: 0.5rem 0; padding: 0.5rem 1rem; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; }
          .file-link:hover { background: #4338ca; }
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
            
            <p><strong>Documentos disponibles para descarga:</strong></p>
            <div style="margin: 1rem 0;">
              ${uploadedFiles.map(f => `
                <div style="margin: 0.5rem 0;">
                  <a href="${f.url}" class="file-link" target="_blank">📄 ${f.filename}</a>
                </div>
              `).join('')}
            </div>
            
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

    await transporter.sendMail({
      from: `"Sistema de Admisión" <sistemas.desarrollo@winston93.edu.mx>`,
      to: psicologiaEmail,
      cc: 'sistemas.desarrollo@winston93.edu.mx',
      subject: `Documentación de Admisión - ${data.studentName}`,
      html,
    })
    
    console.log('[sendDocumentacion] Email sent successfully')
    return { ok: true }
  } catch (error) {
    console.error('[sendDocumentacion] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al enviar'
    console.error('[sendDocumentacion] Error message:', errorMessage)
    return { ok: false, error: errorMessage }
  }
}
