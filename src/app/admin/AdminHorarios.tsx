'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addSchedule, removeSchedule } from './actions'
import { createPermissionRequest } from './dashboard/actions'
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
  const [solicitudModal, setSolicitudModal] = useState<{
    level: AdmissionLevel; action: 'agregar' | 'eliminar'; time: string
  } | null>(null)
  const [solicitudMsg, setSolicitudMsg] = useState('')
  const [sendingSolicitud, setSendingSolicitud] = useState(false)
  const [solicitudResult, setSolicitudResult] = useState<{ ok: boolean; msg: string } | null>(null)

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

  const enviarSolicitudHorario = async () => {
    if (!solicitudModal) return
    setSendingSolicitud(true)
    try {
      await createPermissionRequest({
        type:  'horario',
        level: solicitudModal.level,
        horario_action:   solicitudModal.action,
        horario_time_new: solicitudModal.action === 'agregar'  ? solicitudModal.time : undefined,
        horario_time_old: solicitudModal.action === 'eliminar' ? solicitudModal.time : undefined,
        psych_message:    solicitudMsg.trim() || undefined,
      })
      setSolicitudResult({ ok: true, msg: '✅ Solicitud enviada a la directora.' })
      setSolicitudModal(null)
      setSolicitudMsg('')
    } catch (e) {
      setSolicitudResult({ ok: false, msg: (e as Error).message })
    } finally {
      setSendingSolicitud(false)
    }
  }

  return (
    <div className="admin-horarios">
      {/* Modal solicitar horario */}
      {solicitudModal && (
        <div className="modal-overlay" onClick={() => !sendingSolicitud && setSolicitudModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg,#7c3aed 0%,#a78bfa 100%)' }}>
              <span className="modal-header-icon">📋</span>
              <h3>Solicitar autorización — Horario</h3>
            </div>
            <div className="modal-body">
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <span className="modal-info-label">Nivel</span>
                  <span className="modal-info-value">{LEVEL_LABELS[solicitudModal.level]}</span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label">Acción</span>
                  <span className="modal-info-value">{solicitudModal.action === 'agregar' ? '➕ Agregar' : '➖ Eliminar'} horario</span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label">Horario</span>
                  <span className="modal-info-value">{solicitudModal.time}</span>
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Mensaje para la directora (opcional)</label>
                <textarea value={solicitudMsg} onChange={e => setSolicitudMsg(e.target.value)}
                  rows={3} placeholder="Explica el motivo..."
                  style={{ width: '100%', marginTop: '0.25rem', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSolicitudModal(null)} disabled={sendingSolicitud}>Cancelar</button>
              <button type="button" onClick={enviarSolicitudHorario} disabled={sendingSolicitud}
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
              <button
                type="button"
                className="btn btn-sm"
                disabled={!timeInputByLevel[l].trim()}
                onClick={() => { setSolicitudMsg(''); setSolicitudModal({ level: l, action: 'agregar', time: timeInputByLevel[l] }) }}
                style={{ background: '#f5f3ff', border: '1px solid #c4b5fd', color: '#7c3aed', fontWeight: '600', whiteSpace: 'nowrap' }}
                title="Solicitar autorización a directora para agregar este horario"
              >
                📋 Solicitar
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
                    <button type="button" className="btn btn-sm"
                      onClick={() => { setSolicitudMsg(''); setSolicitudModal({ level: l, action: 'eliminar', time: s.time_slot }) }}
                      style={{ background: '#f5f3ff', border: '1px solid #c4b5fd', color: '#7c3aed', fontWeight: '600' }}
                      title="Solicitar autorización a directora para eliminar este horario">
                      📋
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
