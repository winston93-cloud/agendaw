'use client'

import { useState } from 'react'
import { blockDate, unblockDate } from './actions'
import type { BlockedDate } from '@/types/database'
import type { AdmissionLevel } from '@/types/database'

const LEVEL_LABELS: Record<AdmissionLevel, string> = {
  maternal_kinder: 'Maternal y Kinder',
  primaria: 'Primaria',
  secundaria: 'Secundaria',
}

export default function AdminBloquear({ blockedDates }: { blockedDates: BlockedDate[] }) {
  const [level, setLevel] = useState<AdmissionLevel>('maternal_kinder')
  const [block_date, setBlockDate] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleBlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!block_date.trim()) return
    setLoading(true)
    try {
      await blockDate(block_date, level, reason.trim() || undefined)
      setBlockDate('')
      setReason('')
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleUnblock = async (id: string) => {
    if (!confirm('¿Desbloquear este día para este nivel?')) return
    try {
      await unblockDate(id)
    } catch (err) {
      alert((err as Error).message)
    }
  }

  const byLevel = (l: AdmissionLevel) => blockedDates.filter((b) => b.level === l)

  return (
    <div className="admin-bloquear">
      <form onSubmit={handleBlock} className="admin-bloquear-form">
        <label>
          Nivel
          <select value={level} onChange={(e) => setLevel(e.target.value as AdmissionLevel)} required>
            <option value="maternal_kinder">Maternal y Kinder</option>
            <option value="primaria">Primaria</option>
            <option value="secundaria">Secundaria</option>
          </select>
        </label>
        <label>
          Fecha a bloquear
          <input
            type="date"
            value={block_date}
            onChange={(e) => setBlockDate(e.target.value)}
            required
          />
        </label>
        <label>
          Motivo (opcional)
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: Capacitación"
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Guardando…' : 'Bloquear día'}
        </button>
      </form>

      <div className="admin-blocked-list">
        {(['maternal_kinder', 'primaria', 'secundaria'] as const).map((l) => {
          const list = byLevel(l)
          return (
            <div key={l} className="admin-blocked-level">
              <h3>{LEVEL_LABELS[l]}</h3>
              {list.length === 0 ? (
                <p className="admin-empty">Ningún día bloqueado.</p>
              ) : (
                <ul>
                  {list.map((b) => (
                    <li key={b.id}>
                      <span>
                        {new Date(b.block_date + 'T12:00:00').toLocaleDateString('es-MX', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {b.reason && ` – ${b.reason}`}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleUnblock(b.id)}
                      >
                        Desbloquear
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
