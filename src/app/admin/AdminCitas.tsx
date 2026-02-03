'use client'

import { useState } from 'react'
import { updateAppointment } from './actions'
import type { AdmissionAppointment } from '@/types/database'

const LEVEL_LABELS: Record<string, string> = {
  maternal: 'Maternal',
  kinder: 'Kinder',
  primaria: 'Primaria',
  secundaria: 'Secundaria',
}

export default function AdminCitas({ appointments }: { appointments: AdmissionAppointment[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [filterLevel, setFilterLevel] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  const filtered = appointments.filter((a) => {
    if (filterLevel && a.level !== filterLevel) return false
    if (filterStatus && a.status !== filterStatus) return false
    return true
  })

  const startEdit = (a: AdmissionAppointment) => {
    setEditingId(a.id)
    setEditDate(a.appointment_date)
    setEditTime(a.appointment_time)
  }

  const saveEdit = async () => {
    if (!editingId) return
    try {
      await updateAppointment(editingId, { appointment_date: editDate, appointment_time: editTime })
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
        <div className="admin-table-wrap">
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
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="admin-input-inline"
                      />
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
                      <input
                        type="time"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        className="admin-input-inline"
                      />
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
                      className="admin-select-status"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="confirmed">Confirmada</option>
                      <option value="cancelled">Cancelada</option>
                      <option value="completed">Completada</option>
                    </select>
                  </td>
                  <td>
                    {editingId === a.id ? (
                      <>
                        <button type="button" className="btn btn-primary btn-sm" onClick={saveEdit}>
                          Guardar
                        </button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={cancelEdit}>
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEdit(a)}>
                        Reagendar
                      </button>
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
