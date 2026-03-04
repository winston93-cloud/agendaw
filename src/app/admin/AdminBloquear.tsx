'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { blockDate, unblockDate } from './actions'
import { createPermissionRequest } from './dashboard/actions'
import type { BlockedDate } from '@/types/database'
import type { AdmissionLevel } from '@/types/database'

const LEVEL_LABELS: Record<AdmissionLevel, string> = {
  maternal_kinder: 'Maternal y Kinder',
  primaria: 'Primaria',
  secundaria: 'Secundaria',
}

export default function AdminBloquear({ blockedDates }: { blockedDates: BlockedDate[] }) {
  const router = useRouter()
  const [level, setLevel] = useState<AdmissionLevel>('maternal_kinder')
  const [block_date, setBlockDate] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [solicitudModal, setSolicitudModal] = useState(false)
  const [solicitudMsg, setSolicitudMsg] = useState('')
  const [sendingSolicitud, setSendingSolicitud] = useState(false)
  const [solicitudResult, setSolicitudResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const handleBlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!block_date.trim()) return
    setLoading(true)
    const result = await blockDate(block_date, level, reason.trim() || undefined)
    setLoading(false)
    if (!result.ok) {
      alert(result.error ?? 'No se pudo bloquear el día.')
      return
    }
    setBlockDate('')
    setReason('')
    router.refresh()
  }

  const enviarSolicitudBloqueo = async () => {
    setSendingSolicitud(true)
    try {
      await createPermissionRequest({
        type:           'bloqueo',
        level,
        bloqueo_date:   block_date,
        bloqueo_reason: reason.trim() || undefined,
        psych_message:  solicitudMsg.trim() || undefined,
      })
      setSolicitudResult({ ok: true, msg: '✅ Solicitud enviada a la directora.' })
      setSolicitudModal(false)
      setSolicitudMsg('')
    } catch (e) {
      setSolicitudResult({ ok: false, msg: (e as Error).message })
    } finally {
      setSendingSolicitud(false)
    }
  }

  const handleUnblock = async (id: string) => {
    if (!confirm('¿Desbloquear este día para este nivel?')) return
    const result = await unblockDate(id)
    if (!result.ok) {
      alert(result.error ?? 'No se pudo desbloquear.')
      return
    }
    router.refresh()
  }

  const byLevel = (l: AdmissionLevel) => blockedDates.filter((b) => b.level === l)

  return (
    <div className="admin-bloquear">
      {/* Modal solicitar bloqueo */}
      {solicitudModal && (
        <div className="modal-overlay" onClick={() => !sendingSolicitud && setSolicitudModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg,#7c3aed 0%,#a78bfa 100%)' }}>
              <span className="modal-header-icon">📋</span>
              <h3>Solicitar autorización — Bloqueo de día</h3>
            </div>
            <div className="modal-body">
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <span className="modal-info-label">Nivel</span>
                  <span className="modal-info-value">{LEVEL_LABELS[level]}</span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label">Fecha</span>
                  <span className="modal-info-value">{block_date}</span>
                </div>
                {reason && <div className="modal-info-item">
                  <span className="modal-info-label">Motivo</span>
                  <span className="modal-info-value">{reason}</span>
                </div>}
              </div>
              <div style={{ marginTop: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Mensaje para la directora (opcional)</label>
                <textarea value={solicitudMsg} onChange={e => setSolicitudMsg(e.target.value)}
                  rows={3} placeholder="Explica el motivo del bloqueo..."
                  style={{ width: '100%', marginTop: '0.25rem', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSolicitudModal(false)} disabled={sendingSolicitud}>Cancelar</button>
              <button type="button" onClick={enviarSolicitudBloqueo} disabled={sendingSolicitud}
                style={{ padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                {sendingSolicitud ? 'Enviando…' : '📋 Enviar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}
      {solicitudResult && (
        <div className="modal-overlay" onClick={() => setSolicitudResult(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className={`modal-header ${solicitudResult.ok ? 'modal-header-success' : 'modal-header-error'}`}>
              <span className="modal-header-icon">{solicitudResult.ok ? '✅' : '❌'}</span>
              <h3>{solicitudResult.ok ? 'Solicitud enviada' : 'Error'}</h3>
            </div>
            <div className="modal-body"><p className="modal-result-message">{solicitudResult.msg}</p></div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={() => setSolicitudResult(null)}>Aceptar</button>
            </div>
          </div>
        </div>
      )}
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
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Guardando…' : 'Bloquear día'}
          </button>
          <button type="button" className="btn" disabled={!block_date}
            onClick={() => { setSolicitudMsg(''); setSolicitudModal(true) }}
            style={{ background: '#f5f3ff', border: '1px solid #c4b5fd', color: '#7c3aed', fontWeight: '600' }}
            title="Solicitar autorización a directora para bloquear este día">
            📋 Solicitar autorización
          </button>
        </div>
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
