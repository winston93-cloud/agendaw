// Componente para administrar citas - V4
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateAppointment, completeAdmissionAndCreateAlumno, checkExpedientesBatch } from './actions'
import { createPermissionRequest, getAllRecentRequests } from './dashboard/actions'
import type { AdmissionAppointment, PermissionRequest } from '@/types/database'

const LEVEL_LABELS: Record<string, string> = {
  maternal: 'Maternal', kinder: 'Kinder', primaria: 'Primaria', secundaria: 'Secundaria',
}

const GRADE_LABELS: Record<string, string> = {
  maternal_a: 'Maternal A', maternal_b: 'Maternal B',
  kinder_1: 'Kinder 1', kinder_2: 'Kinder 2', kinder_3: 'Kinder 3',
  primaria_1: '1° Primaria', primaria_2: '2° Primaria', primaria_3: '3° Primaria',
  primaria_4: '4° Primaria', primaria_5: '5° Primaria', primaria_6: '6° Primaria',
  secundaria_7: '7mo (1° Sec.)', secundaria_8: '8vo (2° Sec.)', secundaria_9: '9no (3° Sec.)',
}

type ReqStatus = 'pendiente' | 'aprobada' | 'rechazada'

type ModalState =
  | { type: 'solicitar-reagendar'; appointment: AdmissionAppointment }
  | { type: 'confirm-aprobar';     appointment: AdmissionAppointment }
  | { type: 'result';  ok: boolean; message: string }
  | { type: 'error';   message: string }
  | null

function StatusBadge({ status, label }: { status: ReqStatus; label?: string }) {
  const cfg = {
    pendiente: { bg: '#fef3c7', color: '#92400e', text: label ?? '⏳ Reagendación pendiente' },
    aprobada:  { bg: '#d1fae5', color: '#065f46', text: label ?? '✅ Reagendación aprobada'  },
    rechazada: { bg: '#fee2e2', color: '#991b1b', text: label ?? '❌ Reagendación rechazada' },
  }[status]
  return (
    <span style={{
      fontSize: '0.7rem', fontWeight: '700', padding: '0.2rem 0.55rem',
      borderRadius: '20px', background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap',
    }}>
      {cfg.text}
    </span>
  )
}

export default function AdminCitas({ appointments }: { appointments: AdmissionAppointment[] }) {
  const router = useRouter()

  const [modal,          setModal]          = useState<ModalState>(null)
  const [approving,      setApproving]      = useState(false)
  const [solicitudMsg,   setSolicitudMsg]   = useState('')
  const [solicitudDate,  setSolicitudDate]  = useState('')
  const [solicitudTime,  setSolicitudTime]  = useState('')
  const [sendingSol,     setSendingSol]     = useState(false)
  const [filterLevel,    setFilterLevel]    = useState('')
  const [filterStatus,   setFilterStatus]   = useState('')
  const [filterStart,    setFilterStart]    = useState('')
  const [filterEnd,      setFilterEnd]      = useState('')
  const [expedientesMap, setExpedientesMap] = useState<Record<string, boolean>>({})
  const [statusMap,      setStatusMap]      = useState<Record<string, ReqStatus>>({})

  const filtered = appointments.filter(a => {
    if (filterLevel  && a.level  !== filterLevel)  return false
    if (filterStatus && a.status !== filterStatus) return false
    if (filterStart  && a.appointment_date < filterStart) return false
    if (filterEnd    && a.appointment_date > filterEnd)   return false
    return true
  })

  useEffect(() => {
    if (appointments.length === 0) return
    checkExpedientesBatch(appointments.map(a => a.id))
      .then(m => setExpedientesMap(m))
      .catch(() => {})
  }, [appointments])

  useEffect(() => {
    getAllRecentRequests().then((reqs: PermissionRequest[]) => {
      const map: Record<string, ReqStatus> = {}
      reqs.filter(r => r.type === 'reagendar' && r.appointment_id).forEach(r => {
        const k = `reagendar:${r.appointment_id}`
        if (!map[k]) map[k] = r.status as ReqStatus
      })
      setStatusMap(map)
    }).catch(() => {})
  }, [])

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateAppointment(id, { status })
      router.refresh()
    } catch (e) {
      setModal({ type: 'error', message: (e as Error).message })
    }
  }

  const enviarSolicitudReagendar = async (appointment: AdmissionAppointment) => {
    setSendingSol(true)
    try {
      const levelMap: Record<string, 'maternal_kinder' | 'primaria' | 'secundaria'> = {
        maternal: 'maternal_kinder', kinder: 'maternal_kinder',
        primaria: 'primaria', secundaria: 'secundaria',
      }
      const studentName = `${appointment.student_name} ${appointment.student_last_name_p ?? ''} ${appointment.student_last_name_m ?? ''}`.trim()
      await createPermissionRequest({
        type:           'reagendar',
        level:          levelMap[appointment.level] ?? 'primaria',
        appointment_id: appointment.id,
        student_name:   studentName,
        current_date:   appointment.appointment_date,
        current_time:   appointment.appointment_time,
        proposed_date:  solicitudDate || undefined,
        proposed_time:  solicitudTime || undefined,
        psych_message:  solicitudMsg.trim() || undefined,
      })
      const k = `reagendar:${appointment.id}`
      setStatusMap(prev => ({ ...prev, [k]: 'pendiente' }))
      setModal({ type: 'result', ok: true, message: '✅ Solicitud enviada a la directora. Recibirás respuesta por correo.' })
      setSolicitudMsg(''); setSolicitudDate(''); setSolicitudTime('')
    } catch (e) {
      setModal({ type: 'result', ok: false, message: (e as Error).message })
    } finally {
      setSendingSol(false)
    }
  }

  const confirmarAprobacion = async (id: string) => {
    setApproving(true)
    try {
      const result = await completeAdmissionAndCreateAlumno(id)
      setModal({ type: 'result', ok: result.success, message: result.message })
    } catch (e) {
      setModal({ type: 'result', ok: false, message: (e as Error).message })
    } finally {
      setApproving(false)
    }
  }

  return (
    <div className="admin-citas">

      {/* ── MODAL SOLICITAR REAGENDACIÓN ─────────────────────────── */}
      {modal?.type === 'solicitar-reagendar' && (
        <div className="modal-overlay" onClick={() => !sendingSol && setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg,#7c3aed 0%,#a78bfa 100%)' }}>
              <span className="modal-header-icon">📋</span>
              <h3>Solicitar autorización — Reagendar</h3>
            </div>
            <div className="modal-body">
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <span className="modal-info-label">Alumno</span>
                  <span className="modal-info-value">
                    {`${modal.appointment.student_name} ${modal.appointment.student_last_name_p ?? ''} ${modal.appointment.student_last_name_m ?? ''}`.trim()}
                  </span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label">Cita actual</span>
                  <span className="modal-info-value">{modal.appointment.appointment_date} · {modal.appointment.appointment_time}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Nueva fecha propuesta</label>
                  <input type="date" value={solicitudDate} onChange={e => setSolicitudDate(e.target.value)}
                    style={{ width: '100%', marginTop: '0.25rem', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Nueva hora propuesta</label>
                  <input type="time" value={solicitudTime} onChange={e => setSolicitudTime(e.target.value)}
                    style={{ width: '100%', marginTop: '0.25rem', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Mensaje para la directora (opcional)</label>
                <textarea value={solicitudMsg} onChange={e => setSolicitudMsg(e.target.value)} rows={3}
                  placeholder="Explica el motivo de la reagendación..."
                  style={{ width: '100%', marginTop: '0.25rem', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setModal(null)} disabled={sendingSol}>Cancelar</button>
              <button type="button" onClick={() => enviarSolicitudReagendar(modal.appointment)} disabled={sendingSol}
                style={{ padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                {sendingSol ? 'Enviando…' : '📋 Enviar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CONFIRMAR APROBACIÓN ───────────────────────────── */}
      {modal?.type === 'confirm-aprobar' && (
        <div className="modal-overlay" onClick={() => !approving && setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header modal-header-confirm">
              <span className="modal-header-icon">✅</span>
              <h3>Confirmar aprobación de ingreso</h3>
            </div>
            <div className="modal-body">
              <p className="modal-body-subtitle">Estás a punto de dar de alta al siguiente aspirante en Servicios Administrativos:</p>
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <span className="modal-info-label">Alumno</span>
                  <span className="modal-info-value">
                    {`${modal.appointment.student_name} ${modal.appointment.student_last_name_p || ''} ${modal.appointment.student_last_name_m || ''}`.trim()}
                  </span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label">Nivel</span>
                  <span className="modal-info-value">{LEVEL_LABELS[modal.appointment.level] || modal.appointment.level}</span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label">Grado</span>
                  <span className="modal-info-value">{GRADE_LABELS[modal.appointment.grade_level] || modal.appointment.grade_level}</span>
                </div>
              </div>
              <p className="modal-body-warning">Esta acción creará el registro permanentemente en Servicios Administrativos.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setModal(null)} disabled={approving}>Cancelar</button>
              <button type="button" className="btn btn-success" onClick={() => confirmarAprobacion(modal.appointment.id)} disabled={approving}>
                {approving ? 'Procesando…' : '✅ Aprobar ingreso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL RESULTADO ─────────────────────────────────────── */}
      {modal?.type === 'result' && (
        <div className="modal-overlay" onClick={() => { setModal(null); if (modal.ok) window.location.reload() }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className={`modal-header ${modal.ok ? 'modal-header-success' : 'modal-header-error'}`}>
              <span className="modal-header-icon">{modal.ok ? '✅' : '❌'}</span>
              <h3>{modal.ok ? 'Operación exitosa' : 'Error'}</h3>
            </div>
            <div className="modal-body"><p className="modal-result-message">{modal.message}</p></div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={() => { setModal(null); if (modal.ok) window.location.reload() }}>Aceptar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ERROR ─────────────────────────────────────────── */}
      {modal?.type === 'error' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header modal-header-error">
              <span className="modal-header-icon">⚠️</span>
              <h3>Atención</h3>
            </div>
            <div className="modal-body"><p className="modal-result-message">{modal.message}</p></div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={() => setModal(null)}>Aceptar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── FILTROS ─────────────────────────────────────────────── */}
      <div className="admin-filters" style={{ alignItems: 'flex-end' }}>
        <div className="admin-filters-group">
          <label className="admin-filter-label"><span className="filter-icon">🎓</span> Nivel</label>
          <div className="filter-input-wrapper">
            <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="admin-filter-select">
              <option value="">Todos los niveles</option>
              <option value="maternal">Maternal</option>
              <option value="kinder">Kinder</option>
              <option value="primaria">Primaria</option>
              <option value="secundaria">Secundaria</option>
            </select>
          </div>
        </div>
        <div className="admin-filters-group">
          <label className="admin-filter-label"><span className="filter-icon">📌</span> Estado</label>
          <div className="filter-input-wrapper">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="admin-filter-select">
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="cancelled">Cancelada</option>
              <option value="completed">Completada</option>
            </select>
          </div>
        </div>
        <div className="admin-filters-divider"></div>
        <div className="admin-filters-group-dates">
          <div className="admin-filters-date-label"><span className="filter-icon">📅</span> Fecha de Examen</div>
          <div className="admin-filters-date-inputs">
            <div className="date-input-container">
              <label>Desde:</label>
              <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} className="admin-filter-date" />
            </div>
            <div className="date-separator">→</div>
            <div className="date-input-container">
              <label>Hasta:</label>
              <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} className="admin-filter-date" />
            </div>
          </div>
        </div>
        {(filterStart || filterEnd || filterLevel || filterStatus) && (
          <button onClick={() => { setFilterStart(''); setFilterEnd(''); setFilterLevel(''); setFilterStatus('') }}
            className="admin-filter-clear" title="Limpiar filtros">
            <span style={{ fontSize: '1.1rem' }}>🧹</span>
          </button>
        )}
      </div>

      {/* ── TABLA ───────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <p className="admin-empty">No hay citas con esos filtros.</p>
      ) : (
        <div className="admin-table-wrap" style={{ background: 'transparent', border: 'none', boxShadow: 'none', overflow: 'visible' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha Agendación</th>
                <th>Fecha Examen</th>
                <th>Hora</th>
                <th>Nivel</th>
                <th>Aspirante</th>
                <th>Tutor / Contacto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const reqStatus = statusMap[`reagendar:${a.id}`]
                return (
                  <tr key={a.id}>
                    <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {new Date(a.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      {new Date(a.appointment_date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>{a.appointment_time}</td>
                    <td>{LEVEL_LABELS[a.level] || a.level}</td>
                    <td>
                      <strong>{`${a.student_name} ${a.student_last_name_p || ''} ${a.student_last_name_m || ''}`.trim()}</strong>
                      <br /><small>{a.grade_level} · {a.student_age} años</small>
                    </td>
                    <td>
                      {a.parent_name}<br />
                      <small>{a.parent_email} · {a.parent_phone}</small>
                    </td>
                    <td>
                      <select value={a.status} onChange={e => updateStatus(a.id, e.target.value)}
                        className={`admin-select-status status-pill status-${a.status}`}>
                        <option value="pending">Pendiente</option>
                        <option value="confirmed">Confirmada</option>
                        <option value="cancelled">Cancelada</option>
                        <option value="completed">Completada</option>
                      </select>
                    </td>
                    <td style={{ minWidth: '130px', padding: '0.25rem 0.5rem 0.25rem 0.25rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>

                        {/* Botón reagendar → solo solicitar */}
                        {reqStatus === 'aprobada' ? (
                          <span style={{ padding: '0.25rem 0.5rem', background: '#d1fae5', color: '#065f46', border: '1.5px solid #6ee7b7', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', textAlign: 'center' }}>
                            ✅ Reagendación aprobada
                          </span>
                        ) : reqStatus === 'pendiente' ? (
                          <StatusBadge status="pendiente" label="⏳ Reagendación pendiente" />
                        ) : (
                          <button type="button"
                            onClick={() => { setSolicitudDate(''); setSolicitudTime(''); setSolicitudMsg(''); setModal({ type: 'solicitar-reagendar', appointment: a }) }}
                            style={{ padding: '0.2rem 0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', background: '#f5f3ff', border: '1px solid #c4b5fd', color: '#7c3aed', width: '100%', minHeight: '26px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: '600' }}
                          >
                            <span style={{ fontSize: '0.8rem' }}>📋</span>
                            {reqStatus === 'rechazada' ? 'Resolicitar reagendar' : 'Solicitar reagendar'}
                          </button>
                        )}

                        {expedientesMap[a.id] && (<>
                          <button type="button" className="btn btn-info btn-sm"
                            onClick={() => window.open(`/expediente_inicial/ver?cita=${a.id}`, '_blank')}
                            style={{ padding: '0.2rem 0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', background: '#3b82f6', border: 'none', color: 'white', width: '100%', minHeight: '26px' }}>
                            <span style={{ fontSize: '0.85rem' }}>👁️</span> <span style={{ fontSize: '0.7rem', fontWeight: '600' }}>Ver Exp.</span>
                          </button>
                          {a.status !== 'completed' && (
                            <button type="button" className="btn btn-success btn-sm"
                              onClick={() => setModal({ type: 'confirm-aprobar', appointment: a })}
                              style={{ padding: '0.2rem 0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', background: '#10b981', border: 'none', color: 'white', width: '100%', minHeight: '26px' }}>
                              <span style={{ fontSize: '0.85rem' }}>✅</span> <span style={{ fontSize: '0.7rem', fontWeight: '600' }}>Aprobar</span>
                            </button>
                          )}
                        </>)}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
