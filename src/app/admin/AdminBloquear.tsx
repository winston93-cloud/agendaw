'use client'

import { useState, useEffect } from 'react'
import { createPermissionRequest, getAllRecentRequests } from './dashboard/actions'
import type { BlockedDate, AdmissionLevel, PermissionRequest } from '@/types/database'

const LEVEL_LABELS: Record<AdmissionLevel, string> = {
  maternal_kinder: 'Maternal y Kinder',
  primaria:        'Primaria',
  secundaria:      'Secundaria',
}

type ReqStatus = 'pendiente' | 'aprobada' | 'rechazada'

function reqKey(level: AdmissionLevel, date: string) {
  return `bloqueo:${level}:${date}`
}

function StatusBadge({ status }: { status: ReqStatus }) {
  const cfg = {
    pendiente: { bg: '#fef3c7', color: '#92400e', label: '⏳ Solicitud pendiente' },
    aprobada:  { bg: '#d1fae5', color: '#065f46', label: '✅ Bloqueo aprobado'   },
    rechazada: { bg: '#fee2e2', color: '#991b1b', label: '❌ Solicitud rechazada' },
  }[status]
  return (
    <span style={{
      fontSize: '0.8rem', fontWeight: '700', padding: '0.35rem 0.85rem',
      borderRadius: '20px', background: cfg.bg, color: cfg.color,
    }}>
      {cfg.label}
    </span>
  )
}

export default function AdminBloquear({ blockedDates }: { blockedDates: BlockedDate[] }) {
  const [level,      setLevel]      = useState<AdmissionLevel>('maternal_kinder')
  const [block_date, setBlockDate]  = useState('')
  const [reason,     setReason]     = useState('')
  const [msg,        setMsg]        = useState('')
  const [sending,    setSending]    = useState(false)
  const [showModal,  setShowModal]  = useState(false)
  const [statusMap,  setStatusMap]  = useState<Record<string, ReqStatus>>({})

  useEffect(() => {
    getAllRecentRequests().then((reqs: PermissionRequest[]) => {
      const map: Record<string, ReqStatus> = {}
      reqs.filter(r => r.type === 'bloqueo').forEach(r => {
        if (r.bloqueo_date) {
          const k = reqKey(r.level, r.bloqueo_date)
          if (!map[k]) map[k] = r.status as ReqStatus
        }
      })
      setStatusMap(map)
    }).catch(() => {})
  }, [])

  const byLevel = (l: AdmissionLevel) => blockedDates.filter(b => b.level === l)

  const currentKey = level && block_date ? reqKey(level, block_date) : ''
  const currentStatus = currentKey ? statusMap[currentKey] : undefined

  const enviar = async () => {
    setSending(true)
    try {
      await createPermissionRequest({
        type:           'bloqueo',
        level,
        bloqueo_date:   block_date,
        bloqueo_reason: reason.trim() || undefined,
        psych_message:  msg.trim() || undefined,
      })
      setStatusMap(prev => ({ ...prev, [currentKey]: 'pendiente' }))
      setShowModal(false)
      setMsg('')
    } catch (e) {
      alert('Error: ' + (e as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="admin-bloquear">
      {/* Modal confirmación */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !sending && setShowModal(false)}>
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
                {reason && (
                  <div className="modal-info-item">
                    <span className="modal-info-label">Motivo</span>
                    <span className="modal-info-value">{reason}</span>
                  </div>
                )}
              </div>
              <div style={{ marginTop: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Mensaje para la directora (opcional)</label>
                <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={3}
                  placeholder="Explica el motivo del bloqueo..."
                  style={{ width: '100%', marginTop: '0.25rem', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={sending}>Cancelar</button>
              <button type="button" onClick={enviar} disabled={sending}
                style={{ padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                {sending ? 'Enviando…' : '📋 Enviar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="admin-hint">
        Para bloquear un día, envía una solicitud a la directora. El bloqueo se aplicará automáticamente al ser aprobado.
      </p>

      <div className="admin-bloquear-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label>
          Nivel
          <select value={level} onChange={e => setLevel(e.target.value as AdmissionLevel)}>
            <option value="maternal_kinder">Maternal y Kinder</option>
            <option value="primaria">Primaria</option>
            <option value="secundaria">Secundaria</option>
          </select>
        </label>
        <label>
          Fecha a bloquear
          <input type="date" value={block_date} onChange={e => setBlockDate(e.target.value)} />
        </label>
        <label>
          Motivo (opcional)
          <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Ej: Capacitación" />
        </label>

        {/* Botón con estado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          {currentStatus === 'aprobada' ? (
            <span style={{
              padding: '0.6rem 1.25rem', background: '#d1fae5', color: '#065f46',
              border: '2px solid #6ee7b7', borderRadius: '10px', fontWeight: '700',
            }}>
              ✅ Bloqueo aprobado
            </span>
          ) : currentStatus === 'pendiente' ? (
            <StatusBadge status="pendiente" />
          ) : (
            <button
              type="button"
              disabled={!block_date}
              onClick={() => { setMsg(''); setShowModal(true) }}
              style={{
                padding: '0.6rem 1.25rem', fontWeight: '700', borderRadius: '10px',
                background: !block_date ? '#f1f5f9' : '#f5f3ff',
                border: `1.5px solid ${!block_date ? '#e2e8f0' : '#c4b5fd'}`,
                color: !block_date ? '#94a3b8' : '#7c3aed',
                cursor: !block_date ? 'not-allowed' : 'pointer',
              }}
            >
              📋 Solicitar autorización de bloqueo
            </button>
          )}
          {currentStatus === 'rechazada' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <StatusBadge status="rechazada" />
              <button type="button" onClick={() => { setMsg(''); setShowModal(true) }}
                style={{ padding: '0.3rem 0.75rem', background: '#fef3c7', border: '1px solid #fcd34d', color: '#92400e', borderRadius: '6px', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}>
                Reenviar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lista de días bloqueados */}
      <div className="admin-blocked-list">
        {(['maternal_kinder', 'primaria', 'secundaria'] as const).map(l => {
          const list = byLevel(l)
          return (
            <div key={l} className="admin-blocked-level">
              <h3>{LEVEL_LABELS[l]}</h3>
              {list.length === 0 ? (
                <p className="admin-empty">Ningún día bloqueado.</p>
              ) : (
                <ul>
                  {list.map(b => (
                    <li key={b.id}>
                      <span>
                        {new Date(b.block_date + 'T12:00:00').toLocaleDateString('es-MX', {
                          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                        })}
                        {b.reason && ` – ${b.reason}`}
                      </span>
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
