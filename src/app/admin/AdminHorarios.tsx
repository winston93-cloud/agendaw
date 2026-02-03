'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addSchedule, removeSchedule } from './actions'
import type { AdmissionSchedule } from '@/types/database'
import type { AdmissionLevel } from '@/types/database'

const LEVEL_LABELS: Record<AdmissionLevel, string> = {
  maternal_kinder: 'Maternal y Kinder',
  primaria: 'Primaria',
  secundaria: 'Secundaria',
}

export default function AdminHorarios({ schedules }: { schedules: AdmissionSchedule[] }) {
  const router = useRouter()
  const [timeInputByLevel, setTimeInputByLevel] = useState<Record<AdmissionLevel, string>>({
    maternal_kinder: '',
    primaria: '',
    secundaria: '',
  })
  const [loading, setLoading] = useState(false)

  const byLevel = (l: AdmissionLevel) => schedules.filter((s) => s.level === l)

  const handleAdd = async (e: React.FormEvent, level: AdmissionLevel) => {
    e.preventDefault()
    const trimmed = timeInputByLevel[level].trim()
    if (!trimmed) return
    setLoading(true)
    const result = await addSchedule(level, trimmed)
    setLoading(false)
    if (!result.ok) {
      alert(result.error ?? 'No se pudo agregar el horario.')
      return
    }
    setTimeInputByLevel((prev) => ({ ...prev, [level]: '' }))
    router.refresh()
  }

  const handleRemove = async (id: string) => {
    if (!confirm('¿Quitar este horario?')) return
    const result = await removeSchedule(id)
    if (!result.ok) {
      alert(result.error ?? 'No se pudo eliminar.')
      return
    }
    router.refresh()
  }

  return (
    <div className="admin-horarios">
      <p className="admin-hint">
        Configura 1, 2 o 3 horarios por nivel (lunes a viernes). El aspirante elegirá uno al agendar. Cada nivel tiene sus propios horarios.
      </p>
      {(['maternal_kinder', 'primaria', 'secundaria'] as const).map((l) => {
        const list = byLevel(l)
        return (
          <div key={l} className="admin-horarios-level">
            <h3>{LEVEL_LABELS[l]}</h3>
            <form onSubmit={(e) => handleAdd(e, l)} className="admin-horarios-form">
              <label>
                Agregar horario (HH:MM)
                <input
                  type="time"
                  value={timeInputByLevel[l]}
                  onChange={(e) => setTimeInputByLevel((prev) => ({ ...prev, [l]: e.target.value }))}
                  disabled={loading}
                />
              </label>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={loading || !timeInputByLevel[l].trim()}
              >
                {loading ? 'Guardando…' : 'Agregar'}
              </button>
            </form>
            <ul className="admin-horarios-list">
              {list.length === 0 ? (
                <li className="admin-empty">Ningún horario. Agrega al menos uno.</li>
              ) : (
                list.map((s) => (
                  <li key={s.id}>
                    <span>{s.time_slot}</span>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => handleRemove(s.id)}>
                      Quitar
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
