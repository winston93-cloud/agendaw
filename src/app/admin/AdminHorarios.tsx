'use client'

import { useState, useEffect } from 'react'
import { createPermissionRequest, getAllRecentRequests } from './dashboard/actions'
import type { AdmissionSchedule, AdmissionLevel, PermissionRequest } from '@/types/database'

const LEVEL_LABELS: Record<AdmissionLevel, string> = {
  maternal_kinder: 'Maternal y Kinder',
  primaria:        'Primaria',
  secundaria:      'Secundaria',
}

type ReqStatus = 'pendiente' | 'aprobada' | 'rechazada'

function reqKey(level: AdmissionLevel, action: 'agregar' | 'eliminar', time: string) {
  return `horario:${level}:${action}:${time}`
}

function StatusBadge({ status }: { status: ReqStatus }) {
  const cfg = {
    pendiente:  { bg: '#fef3c7', color: '#92400e', label: '⏳ Pendiente' },
    aprobada:   { bg: '#d1fae5', color: '#065f46', label: '✅ Aprobada'  },
    rechazada:  { bg: '#fee2e2', color: '#991b1b', label: '❌ Rechazada' },
  }[status]
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: '700', padding: '0.2rem 0.6rem',
      borderRadius: '20px', background: cfg.bg, color: cfg.color,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}

export default function AdminHorarios({ schedules }: { schedules: AdmissionSchedule[] }) {
  const [timeInputByLevel, setTimeInputByLevel] = useState<Record<AdmissionLevel, string>>({
    maternal_kinder: '', primaria: '', secundaria: '',
  })
  const [modal, setModal] = useState<{
    level: AdmissionLevel; action: 'agregar' | 'eliminar'; time: string
  } | null>(null)
  const [msg, setMsg]         = useState('')
  const [sending, setSending] = useState(false)

  // Mapa de estado: clave → status
  const [statusMap, setStatusMap] = useState<Record<string, ReqStatus>>({})

  useEffect(() => {
    getAllRecentRequests().then((reqs: PermissionRequest[]) => {
      const map: Record<string, ReqStatus> = {}
      reqs.filter(r => r.type === 'horario').forEach(r => {
        const action = r.horario_action as 'agregar' | 'eliminar'
        const time   = r.horario_time_new ?? r.horario_time_old ?? ''
        if (action && time) {
          const k = reqKey(r.level, action, time)
          // Guardar el más reciente (el array ya viene ordenado desc)
          if (!map[k]) map[k] = r.status as ReqStatus
        }
      })
      setStatusMap(map)
    }).catch(() => {})
  }, [])

  const byLevel = (l: AdmissionLevel) => schedules.filter(s => s.level === l)

  const enviar = async () => {
    if (!modal) return
    setSending(true)
    try {
      await createPermissionRequest({
        type:  'horario',
        level: modal.level,
        horario_action:   modal.action,
        horario_time_new: modal.action === 'agregar'  ? modal.time : undefined,
        horario_time_old: modal.action === 'eliminar' ? modal.time : undefined,
        psych_message:    msg.trim() || undefined,
      })
      const k = reqKey(modal.level, modal.action, modal.time)
      setStatusMap(prev => ({ ...prev, [k]: 'pendiente' }))
      setModal(null)
      setMsg('')
    } catch (e) {
      alert('Error: ' + (e as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="admin-horarios">
      {/* Modal solicitar */}
      {modal && (
        <div className="modal-overlay" onClick={() => !sending && setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg,#7c3aed 0%,#a78bfa 100%)' }}>
              <span className="modal-header-icon">📋</span>
              <h3>Solicitar autorización — Horario</h3>
            </div>
            <div className="modal-body">
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <span className="modal-info-label">Nivel</span>
                  <span className="modal-info-value">{LEVEL_LABELS[modal.level]}</span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label">Acción</span>
                  <span className="modal-info-value">{modal.action === 'agregar' ? '➕ Agregar' : '➖ Eliminar'} horario</span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label">Horario</span>
                  <span className="modal-info-value">{modal.time}</span>
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Mensaje para la directora (opcional)</label>
                <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={3}
                  placeholder="Explica el motivo..."
                  style={{ width: '100%', marginTop: '0.25rem', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setModal(null)} disabled={sending}>Cancelar</button>
              <button type="button" onClick={enviar} disabled={sending}
                style={{ padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                {sending ? 'Enviando…' : '📋 Enviar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="admin-hint">
        Para agregar o eliminar horarios, envía una solicitud a la directora. El cambio se aplicará automáticamente al ser aprobado.
      </p>

      {(['maternal_kinder', 'primaria', 'secundaria'] as const).map((l) => {
        const list = byLevel(l)
        return (
          <div key={l} className="admin-horarios-level">
            <h3>{LEVEL_LABELS[l]}</h3>

            {/* Solicitar agregar */}
            <div className="admin-horarios-form" style={{ alignItems: 'center' }}>
              <label style={{ flex: 1 }}>
                Horario a solicitar (HH:MM)
                <input
                  type="time"
                  value={timeInputByLevel[l]}
                  onChange={e => setTimeInputByLevel(prev => ({ ...prev, [l]: e.target.value }))}
                />
              </label>
              {(() => {
                const t = timeInputByLevel[l]
                const k = t ? reqKey(l, 'agregar', t) : ''
                const st = k ? statusMap[k] : undefined
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <SolicitudBtn
                      disabled={!t}
                      status={st}
                      label="Solicitar agregar"
                      approvedLabel="✅ Agregar aprobado"
                      onClick={() => { setMsg(''); setModal({ level: l, action: 'agregar', time: t }) }}
                    />
                  </div>
                )
              })()}
            </div>

            {/* Lista de horarios */}
            <ul className="admin-horarios-list">
              {list.length === 0 ? (
                <li className="admin-empty">Ningún horario configurado.</li>
              ) : (
                list.map(s => {
                  const k  = reqKey(l, 'eliminar', s.time_slot)
                  const st = statusMap[k]
                  return (
                    <li key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '700', minWidth: '60px' }}>{s.time_slot}</span>
                      <SolicitudBtn
                        status={st}
                        label="Solicitar eliminar"
                        approvedLabel="✅ Eliminación aprobada"
                        danger
                        onClick={() => { setMsg(''); setModal({ level: l, action: 'eliminar', time: s.time_slot }) }}
                      />
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

function SolicitudBtn({
  disabled = false, status, label, approvedLabel, danger = false, onClick,
}: {
  disabled?: boolean
  status?: ReqStatus
  label: string
  approvedLabel: string
  danger?: boolean
  onClick: () => void
}) {
  if (status === 'aprobada') {
    return (
      <span style={{
        padding: '0.3rem 0.85rem', background: '#d1fae5', color: '#065f46',
        border: '1.5px solid #6ee7b7', borderRadius: '8px',
        fontWeight: '700', fontSize: '0.82rem',
      }}>
        {approvedLabel}
      </span>
    )
  }
  if (status === 'pendiente') {
    return <StatusBadge status="pendiente" />
  }
  if (status === 'rechazada') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <StatusBadge status="rechazada" />
        <button type="button" onClick={onClick}
          style={{ padding: '0.25rem 0.65rem', background: '#fef3c7', border: '1px solid #fcd34d', color: '#92400e', borderRadius: '6px', fontWeight: '600', fontSize: '0.75rem', cursor: 'pointer' }}>
          Reenviar
        </button>
      </div>
    )
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      style={{
        padding: '0.3rem 0.75rem', fontWeight: '600', fontSize: '0.82rem',
        borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer',
        background: disabled ? '#f1f5f9' : danger ? '#fff1f2' : '#f5f3ff',
        border: `1.5px solid ${disabled ? '#e2e8f0' : danger ? '#fda4af' : '#c4b5fd'}`,
        color: disabled ? '#94a3b8' : danger ? '#e11d48' : '#7c3aed',
        transition: 'all 0.15s',
      }}>
      📋 {label}
    </button>
  )
}
