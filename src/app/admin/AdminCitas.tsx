// Componente para administrar citas - V3
'use client'

import { useState, useEffect } from 'react'
import { updateAppointment, completeAdmissionAndCreateAlumno, checkExpedientesBatch } from './actions'
import ExamDateCalendar from '@/components/ExamDateCalendar'
import type { AdmissionAppointment } from '@/types/database'

const LEVEL_LABELS: Record<string, string> = {
  maternal: 'Maternal',
  kinder: 'Kinder',
  primaria: 'Primaria',
  secundaria: 'Secundaria',
}

function apiLevel(level: string): string {
  if (level === 'maternal' || level === 'kinder') return 'maternal_kinder'
  if (level === 'primaria') return 'primaria'
  if (level === 'secundaria') return 'secundaria'
  return level
}

export default function AdminCitas({ appointments }: { appointments: AdmissionAppointment[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editingLevel, setEditingLevel] = useState<string>('')
  const [editBlockedDates, setEditBlockedDates] = useState<string[]>([])
  const [editScheduleTimes, setEditScheduleTimes] = useState<string[]>([])
  const [editBookedSlots, setEditBookedSlots] = useState<string[]>([])
  const [filterLevel, setFilterLevel] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [expedientesMap, setExpedientesMap] = useState<Record<string, boolean>>({})

  const filtered = appointments.filter((a) => {
    if (filterLevel && a.level !== filterLevel) return false
    if (filterStatus && a.status !== filterStatus) return false
    return true
  })

  // Cargar qué citas tienen expediente inicial (Optimizado: una sola consulta)
  useEffect(() => {
    const loadExpedientes = async () => {
      // Obtener IDs de citas visibles
      const appointmentIds = appointments.map(a => a.id)
      if (appointmentIds.length === 0) return

      try {
        // Consultar todos los expedientes de una sola vez
        const resultMap = await checkExpedientesBatch(appointmentIds)
        setExpedientesMap(resultMap)
      } catch (e) {
        console.error('Error cargando expedientes:', e)
      }
    }
    loadExpedientes()
  }, [appointments])

  const startEdit = (a: AdmissionAppointment) => {
    setEditingId(a.id)
    setEditDate(a.appointment_date)
    setEditTime(a.appointment_time)
    setEditingLevel(a.level)
  }

  useEffect(() => {
    if (!editingId || !editingLevel) {
      setEditBlockedDates([])
      setEditScheduleTimes([])
      return
    }
    const level = apiLevel(editingLevel)
    Promise.all([
      fetch(`/api/blocked-dates?level=${level}`).then((r) => r.json()).then((d) => d.dates || []).catch(() => []),
      fetch(`/api/schedules?level=${level}`).then((r) => r.json()).then((d) => d.times || []).catch(() => []),
    ]).then(([dates, times]) => {
      setEditBlockedDates(dates)
      setEditScheduleTimes(times)
    })
  }, [editingId, editingLevel])

  useEffect(() => {
    if (!editingId || !editDate || !editingLevel) {
      setEditBookedSlots([])
      return
    }
    fetch(`/api/booked-slots?level=${editingLevel}&date=${editDate}&exclude_id=${editingId}`)
      .then((r) => r.json())
      .then((d) => setEditBookedSlots(d.times || []))
      .catch(() => setEditBookedSlots([]))
  }, [editingId, editDate, editingLevel])

  // Si al cambiar fecha/horarios el tiempo elegido ya no está disponible, limpiar
  useEffect(() => {
    if (!editingId || !editTime) return
    if (editBookedSlots.includes(editTime) || (editScheduleTimes.length > 0 && !editScheduleTimes.includes(editTime))) {
      setEditTime('')
    }
  }, [editingId, editTime, editBookedSlots, editScheduleTimes])

  const saveEdit = async () => {
    if (!editingId) return
    if (editScheduleTimes.length > 0 && !editTime?.trim()) {
      alert('Elige un horario de la lista.')
      return
    }
    try {
      await updateAppointment(editingId, {
        appointment_date: editDate,
        appointment_time: (editTime?.trim() || 'Por confirmar'),
      })
      setEditingId(null)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const cancelEdit = () => setEditingId(null)

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateAppointment(id, { status })
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const aprobarAlumno = async (id: string) => {
    if (!confirm('¿Aprobar alumno y crear en el sistema? Esta acción creará el registro en MySQL.')) {
      return
    }
    try {
      const result = await completeAdmissionAndCreateAlumno(id)
      if (result.success) {
        alert(result.message)
        window.location.reload()
      } else {
        alert('❌ Error: ' + result.message)
      }
    } catch (e) {
      alert((e as Error).message)
    }
  }

  return (
    <div className="admin-citas">
      <div className="admin-filters">
        <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
          <option value="">Todos los niveles</option>
          <option value="maternal">Maternal</option>
          <option value="kinder">Kinder</option>
          <option value="primaria">Primaria</option>
          <option value="secundaria">Secundaria</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmada</option>
          <option value="cancelled">Cancelada</option>
          <option value="completed">Completada</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="admin-empty">No hay citas con esos filtros.</p>
      ) : (
        <div className="admin-table-wrap" style={{ background: 'transparent', border: 'none', boxShadow: 'none', overflow: 'visible' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Nivel</th>
                <th>Aspirante</th>
                <th>Tutor / Contacto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>
                    {editingId === a.id ? (
                      <div className="admin-edit-date">
                        <ExamDateCalendar
                          value={editDate}
                          onChange={setEditDate}
                          blockedDates={editBlockedDates}
                        />
                      </div>
                    ) : (
                      new Date(a.appointment_date + 'T12:00:00').toLocaleDateString('es-MX', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    )}
                  </td>
                  <td>
                    {editingId === a.id ? (
                      <div className="admin-edit-time">
                        {editScheduleTimes.length === 0 ? (
                          <input
                            type="text"
                            value={editTime}
                            onChange={(e) => setEditTime(e.target.value)}
                            className="admin-input-inline"
                            placeholder="Ej: 09:00"
                          />
                        ) : (
                          <div className="time-slots time-slots-admin">
                            {editScheduleTimes.map((time) => {
                              const isBooked = editBookedSlots.includes(time)
                              return (
                                <button
                                  key={time}
                                  type="button"
                                  className={`time-slot ${editTime === time ? 'selected' : ''} ${isBooked ? 'time-slot-booked' : ''}`}
                                  onClick={() => !isBooked && setEditTime(time)}
                                  disabled={isBooked}
                                  title={isBooked ? 'Ocupado' : undefined}
                                >
                                  {time}
                                  {isBooked && <span className="time-slot-label"> (Ocupado)</span>}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      a.appointment_time
                    )}
                  </td>
                  <td>{LEVEL_LABELS[a.level] || a.level}</td>
                  <td>
                    <strong>{a.student_name}</strong>
                    <br />
                    <small>{a.grade_level} · {a.student_age} años</small>
                  </td>
                  <td>
                    {a.parent_name}
                    <br />
                    <small>{a.parent_email} · {a.parent_phone}</small>
                  </td>
                  <td>
                    <select
                      value={a.status}
                      onChange={(e) => updateStatus(a.id, e.target.value)}
                      className={`admin-select-status status-pill status-${a.status}`}
                    >
                      <option value="pending">Pendiente</option>
                      <option value="confirmed">Confirmada</option>
                      <option value="cancelled">Cancelada</option>
                      <option value="completed">Completada</option>
                    </select>
                  </td>
                  <td style={{ minWidth: '180px', padding: '0.5rem' }}>
                    {editingId === a.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button type="button" className="btn btn-primary btn-sm" onClick={saveEdit} style={{ width: '100%' }}>
                          Guardar
                        </button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={cancelEdit} style={{ width: '100%' }}>
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button 
                          type="button" 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => startEdit(a)}
                          title="Reagendar fecha/hora"
                          style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', width: '100%' }}
                        >
                          <span style={{ fontSize: '1.1rem' }}>📅</span> <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Reagendar</span>
                        </button>
                        
                        {expedientesMap[a.id] && (
                          <>
                            <button 
                              type="button" 
                              className="btn btn-info btn-sm" 
                              onClick={() => window.open(`/expediente_inicial/ver?cita=${a.id}`, '_blank')}
                              title="Ver expediente completo"
                              style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#3b82f6', border: 'none', color: 'white', width: '100%' }}
                            >
                              <span style={{ fontSize: '1.1rem' }}>👁️</span> <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Ver Exp.</span>
                            </button>
                            
                            {a.status !== 'completed' && (
                              <button 
                                type="button" 
                                className="btn btn-success btn-sm" 
                                onClick={() => aprobarAlumno(a.id)}
                                title="Aprobar ingreso y crear alumno"
                                style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#10b981', border: 'none', color: 'white', width: '100%' }}
                              >
                                <span style={{ fontSize: '1.1rem' }}>✅</span> <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Aprobar</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
