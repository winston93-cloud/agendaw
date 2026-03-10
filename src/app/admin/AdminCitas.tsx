// Componente para administrar citas - V4
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateAppointment, completeAdmissionAndCreateAlumno, completeAdmissionLegacy, checkExpedientesBatch, getFullyBookedDates } from './actions'
import { createPermissionRequest, getAllRecentRequests } from './dashboard/actions'
import ExamDateCalendar from '@/components/ExamDateCalendar'
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

function toAdminLevel(level: string) {
  if (level === 'maternal' || level === 'kinder') return 'maternal_kinder'
  return level
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

  // ── Estado para el calendario de solicitud reagendar ──────
  const [calBlockedDates,   setCalBlockedDates]   = useState<string[]>([])
  const [calFullyBooked,    setCalFullyBooked]    = useState<string[]>([])
  const [calScheduleTimes,  setCalScheduleTimes]  = useState<string[]>([])
  const [calBookedSlots,    setCalBookedSlots]    = useState<string[]>([])
  const [calLoadingSlots,   setCalLoadingSlots]   = useState(false)

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

  // Cargar fechas bloqueadas, fechas llenas y horarios disponibles al abrir el modal
  useEffect(() => {
    if (modal?.type !== 'solicitar-reagendar') {
      setCalBlockedDates([]); setCalFullyBooked([])
      setCalScheduleTimes([]); setCalBookedSlots([])
      setSolicitudDate(''); setSolicitudTime('')
      return
    }
    const apt        = modal.appointment
    const level      = toAdminLevel(apt.level)   // para blocked-dates, schedules y fullyBooked
    const exactLevel = apt.level                  // para booked-slots (por nivel exacto)
    void exactLevel  // usada en el siguiente useEffect
    // Cargar todo al abrir el modal (sin esperar a que se seleccione fecha)
    Promise.all([
      fetch(`/api/blocked-dates?level=${level}`).then(r => r.json()).then(d => d.dates || []).catch(() => []),
      fetch(`/api/schedules?level=${level}`).then(r => r.json()).then(d => d.times || []).catch(() => []),
      getFullyBookedDates(level as 'maternal_kinder' | 'primaria' | 'secundaria', apt.id),
    ]).then(([blocked, times, fullyBooked]) => {
      setCalBlockedDates(blocked)
      setCalScheduleTimes(times)   // <-- disponibles desde el primer momento
      setCalFullyBooked(fullyBooked)
    }).catch(() => {})
  }, [modal])

  // Cargar slots OCUPADOS al cambiar la fecha (marca cuáles están tomados ese día)
  useEffect(() => {
    if (modal?.type !== 'solicitar-reagendar') return
    if (!solicitudDate) {
      setCalBookedSlots([])   // sin fecha → ninguno ocupado, todos se ven disponibles
      setSolicitudTime('')
      return
    }
    const apt   = modal.appointment
    setCalLoadingSlots(true)
    setSolicitudTime('')    // resetear hora al cambiar fecha
    // Usar nivel exacto para que solo bloquee horarios del mismo nivel
    fetch(`/api/booked-slots?level=${apt.level}&date=${solicitudDate}&exclude_id=${apt.id}`)
      .then(r => r.json())
      .then(d => setCalBookedSlots(d.times || []))
      .catch(() => setCalBookedSlots([]))
      .finally(() => setCalLoadingSlots(false))
  }, [solicitudDate, modal])

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
          <div className="modal-box" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
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

              {/* Calendario con validaciones reales */}
              <div style={{ marginTop: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>
                  Nueva fecha propuesta
                </label>
                <ExamDateCalendar
                  value={solicitudDate}
                  onChange={date => setSolicitudDate(date)}
                  blockedDates={[...calBlockedDates, ...calFullyBooked]}
                  isAdmin={true}
                />
              </div>

              {/* Slots de hora: aparecen desde que abre el modal */}
              <div style={{ marginTop: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>
                  Nueva hora propuesta
                </label>
                {calScheduleTimes.length === 0 ? (
                  /* Sin horarios configurados → input libre */
                  <input type="time" value={solicitudTime} onChange={e => setSolicitudTime(e.target.value)}
                    disabled={!solicitudDate}
                    placeholder={!solicitudDate ? 'Primero elige una fecha' : ''}
                    style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', width: '100%', boxSizing: 'border-box', opacity: solicitudDate ? 1 : 0.5 }} />
                ) : (
                  /* Horarios configurados → botones (todos visibles desde el inicio) */
                  <>
                    {!solicitudDate && (
                      <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                        Selecciona una fecha para ver disponibilidad
                      </p>
                    )}
                    {calLoadingSlots && (
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Verificando disponibilidad…</p>
                    )}
                    <div className="time-slots time-slots-admin">
                      {calScheduleTimes.map(t => {
                        // Si la fecha propuesta es la misma que la actual, el horario original también está ocupado
                        const isSameDay = solicitudDate === modal.appointment.appointment_date
                        const isBooked = solicitudDate
                          ? (calBookedSlots.includes(t) || (isSameDay && t === modal.appointment.appointment_time))
                          : false
                        return (
                          <button key={t} type="button"
                            className={`time-slot ${solicitudTime === t ? 'selected' : ''} ${isBooked ? 'time-slot-booked' : ''}`}
                            onClick={() => !isBooked && setSolicitudTime(t)}
                            disabled={isBooked}
                            title={isBooked ? 'Ya ocupado ese día' : (!solicitudDate ? 'Elige fecha primero' : undefined)}
                          >
                            {t}{isBooked && <span className="time-slot-label"> (Ocupado)</span>}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>

              <div style={{ marginTop: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Mensaje para la directora (opcional)</label>
                <textarea value={solicitudMsg} onChange={e => setSolicitudMsg(e.target.value)} rows={2}
                  placeholder="Explica el motivo de la reagendación..."
                  style={{ width: '100%', marginTop: '0.25rem', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setModal(null)} disabled={sendingSol}>Cancelar</button>
              <button type="button" onClick={() => enviarSolicitudReagendar(modal.appointment)}
                disabled={sendingSol || !solicitudDate || (calScheduleTimes.length > 0 && !solicitudTime)}
                style={{ padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', opacity: (!solicitudDate || (calScheduleTimes.length > 0 && !solicitudTime)) ? 0.5 : 1 }}>
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
        <div className="admin-table-wrap" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
          <table className="admin-table" style={{ tableLayout: 'fixed', minWidth: '1100px' }}>
            <colgroup>
              <col style={{ width: '90px' }} />   {/* Fecha agendación */}
              <col style={{ width: '140px' }} />  {/* Fecha examen */}
              <col style={{ width: '65px' }} />   {/* Hora */}
              <col style={{ width: '80px' }} />   {/* Nivel */}
              <col style={{ width: '90px' }} />   {/* Ciclo */}
              <col style={{ width: '170px' }} />  {/* Aspirante */}
              <col style={{ width: '175px' }} />  {/* Tutor */}
              <col style={{ width: '145px' }} />  {/* Estado */}
              <col style={{ width: '155px' }} />  {/* Acciones */}
            </colgroup>
            <thead>
              <tr>
                <th style={{ whiteSpace: 'nowrap' }}>Fecha Agend.</th>
                <th style={{ whiteSpace: 'nowrap' }}>Fecha Examen</th>
                <th>Hora</th>
                <th>Nivel</th>
                <th>Ciclo</th>
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
                    <td style={{ fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(a.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(a.appointment_date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{a.appointment_time}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{LEVEL_LABELS[a.level] || a.level}</td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{a.school_cycle || '—'}</td>
                    <td>
                      <strong>{`${a.student_name} ${a.student_last_name_p || ''} ${a.student_last_name_m || ''}`.trim()}</strong>
                      {a.origin === 'legacy' && (
                        <span className="badge-legacy" style={{ marginLeft: '0.4rem' }}>Sistema anterior</span>
                      )}
                      <br /><small>{a.grade_level} · {a.student_age}</small>
                    </td>
                    <td style={{ overflow: 'hidden' }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.parent_name === 'PSICOLOGIAS' ? 'N/A' : a.parent_name}
                      </span>
                      <small style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.parent_email}
                      </small>
                      <small>{a.parent_phone}</small>
                    </td>
                    <td style={{ paddingRight: '0.25rem' }}>
                      <select value={a.status} onChange={e => updateStatus(a.id, e.target.value)}
                        className={`admin-select-status status-pill status-${a.status}`} style={{ width: '100%', minWidth: 'unset' }}>
                        <option value="pending">Pendiente</option>
                        <option value="confirmed">Confirmada</option>
                        <option value="cancelled">Cancelada</option>
                        <option value="completed">Completada</option>
                      </select>
                    </td>
                    <td style={{ padding: '0.5rem 0.5rem 0.5rem 0.25rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>

                        {/* Botón reagendar */}
                        <button type="button"
                          onClick={() => { setSolicitudDate(''); setSolicitudTime(''); setSolicitudMsg(''); setModal({ type: 'solicitar-reagendar', appointment: a }) }}
                          style={{ padding: '0.3rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: '#f5f3ff', border: '1px solid #c4b5fd', color: '#7c3aed', whiteSpace: 'nowrap', borderRadius: '6px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '600', width: 'fit-content' }}
                        >
                          📋 Reagendar
                        </button>
                        {/* Indicador del estado de la última solicitud */}
                        {reqStatus === 'aprobada' && (
                          <span style={{ fontSize: '0.65rem', color: '#065f46', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '4px', padding: '0.1rem 0.4rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            ✅ Última aprobada
                          </span>
                        )}
                        {reqStatus === 'pendiente' && (
                          <span style={{ fontSize: '0.65rem', color: '#92400e', background: '#fef9c3', border: '1px solid #fde68a', borderRadius: '4px', padding: '0.1rem 0.4rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            ⏳ Solicitud pendiente
                          </span>
                        )}
                        {reqStatus === 'rechazada' && (
                          <span style={{ fontSize: '0.65rem', color: '#991b1b', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '4px', padding: '0.1rem 0.4rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            ❌ Última rechazada
                          </span>
                        )}

                        {/* Botón aprobar directo para alumnos del sistema anterior */}
                        {a.origin === 'legacy' && a.status !== 'completed' && (
                          <button type="button"
                            onClick={async () => {
                              if (!confirm(`¿Aprobar ingreso de ${a.student_name}? Se creará el alumno en el sistema.`)) return
                              const res = await completeAdmissionLegacy(a.id)
                              if (res.success) {
                                alert(res.message)
                                router.refresh()
                              } else {
                                alert('Error: ' + res.message)
                              }
                            }}
                            style={{ padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: '#10b981', border: 'none', color: 'white', whiteSpace: 'nowrap', borderRadius: '6px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '600', width: 'fit-content' }}>
                            ✅ Aprobar ingreso
                          </button>
                        )}

                        {expedientesMap[a.id] && (<>
                          <button type="button"
                            onClick={() => window.open(`/expediente_inicial/ver?cita=${a.id}`, '_blank')}
                            style={{ padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: '#3b82f6', border: 'none', color: 'white', whiteSpace: 'nowrap', borderRadius: '6px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '600' }}>
                            👁️ Ver Expediente
                          </button>
                          {a.status !== 'completed' && a.origin !== 'legacy' && (
                            <button type="button"
                              onClick={() => setModal({ type: 'confirm-aprobar', appointment: a })}
                              style={{ padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: '#10b981', border: 'none', color: 'white', whiteSpace: 'nowrap', borderRadius: '6px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '600' }}>
                              ✅ Aprobar ingreso
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
