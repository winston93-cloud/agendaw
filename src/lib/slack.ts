const LEVEL_LABELS: Record<string, string> = {
  maternal: 'Maternal',
  kinder: 'Kinder',
  primaria: 'Primaria',
  secundaria: 'Secundaria',
}

const PLANTEL: Record<string, string> = {
  maternal: 'Instituto Educativo Winston',
  kinder: 'Instituto Educativo Winston',
  primaria: 'Winston Churchill',
  secundaria: 'Winston Churchill',
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export async function sendSlackRecorrido(data: {
  level: string
  tour_date: string
  tour_time: string
  parent_name: string
  parent_phone: string
  parent_email: string
  notes?: string | null
}): Promise<{ ok: boolean; error?: string }> {
  const webhookUrl = process.env.SLACK_WEBHOOK_RECORRIDOS
  if (!webhookUrl) {
    console.warn('[slack] SLACK_WEBHOOK_RECORRIDOS no configurado')
    return { ok: false, error: 'Webhook no configurado' }
  }

  const level = LEVEL_LABELS[data.level] ?? data.level
  const plantel = PLANTEL[data.level] ?? data.level
  const fecha = formatDate(data.tour_date)

  const lines = [
    `📅 *Nuevo recorrido agendado*`,
    ``,
    `*Nivel:* ${level}  |  *Plantel:* ${plantel}`,
    `*Fecha:* ${fecha}  |  *Hora:* ${data.tour_time}`,
    ``,
    `*Papá/Mamá:* ${data.parent_name}`,
    `*Teléfono:* ${data.parent_phone}`,
    `*Correo:* ${data.parent_email}`,
  ]

  if (data.notes) {
    lines.push(`*Notas:* ${data.notes}`)
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: lines.join('\n') }),
    })
    if (!res.ok) {
      const text = await res.text()
      console.warn('[slack] Error response:', text)
      return { ok: false, error: text }
    }
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn('[slack] sendSlackRecorrido error:', msg)
    return { ok: false, error: msg }
  }
}
