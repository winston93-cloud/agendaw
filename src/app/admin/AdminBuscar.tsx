'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { searchAdmissionAppointments, updateAppointment } from './actions'
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

function formatCreatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function AdminBuscar() {
  const [nameQuery, setNameQuery] = useState('')
  const [createdDate, setCreatedDate] = useState('')
  const [examDate, setExamDate] = useState('')
  const [results, setResults] = useState<AdmissionAppointment[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<AdmissionAppointment | null>(null)
  const [reagendarId, setReagendarId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editLevel, setEditLevel] = useState('')
  const [editBlockedDates, setEditBlockedDates] = useState<string[]>([])
  const [editScheduleTimes, setEditScheduleTimes] = useState<string[]>([])
  const [editBookedSlots, setEditBookedSlots] = useState<string[]>([])
  const resultsRef = useRef<HTMLDivElement>(null)
  const selectedCardRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const reagendarRef = useRef<HTMLDivElement>(null)
  const reagendarTimeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => nameInputRef.current?.focus({ preventScroll: false }), 0)
    return () => clearTimeout(t)
  }, [])

  const runSearch = useCallback(async () => {
    if (!nameQuery.trim() && !createdDate && !examDate) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const list = await searchAdmissionAppointments({
        name: nameQuery.trim() || undefined,
        createdDate: createdDate || undefined,
        appointmentDate: examDate || undefined,
      })
      setResults(list)
      setSelected(null)
    } catch (e) {
      setResults([])
      alert((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [nameQuery, createdDate, examDate])

  useEffect(() => {
    const t = setTimeout(runSearch, 350)
    return () => clearTimeout(t)
  }, [runSearch])

  useEffect(() => {
    if (!loading && results.length > 0 && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [loading, results.length])

  useEffect(() => {
    if (!selected) return
    const t = setTimeout(() => {
      selectedCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 100)
    return () => clearTimeout(t)
  }, [selected])

  useEffect(() => {
    if (!reagendarId) return
    const t = setTimeout(() => {
      reagendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 150)
    return () => clearTimeout(t)
  }, [reagendarId])

  useEffect(() => {
    if (!reagendarId || !editDate || !editTime) return
    const t = setTimeout(() => {
      reagendarTimeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 100)
    return () => clearTimeout(t)
  }, [reagendarId, editDate, editTime])

  useEffect(() => {
    if (!reagendarId || !editLevel) return
    const level = apiLevel(editLevel)
    Promise.all([
      fetch(`/api/blocked-dates?level=${level}`).then((r) => r.json()).then((d) => d.dates || []).catch(() => []),
      fetch(`/api/schedules?level=${level}`).then((r) => r.json()).then((d) => d.times || []).catch(() => []),
    ]).then(([dates, times]) => {
      setEditBlockedDates(dates)
      setEditScheduleTimes(times)
    })
  }, [reagendarId, editLevel])

  useEffect(() => {
    if (!reagendarId || !editDate || !editLevel) {
      setEditBookedSlots([])
      return
    }
    fetch(`/api/booked-slots?level=${editLevel}&date=${editDate}&exclude_id=${reagendarId}`)
      .then((r) => r.json())
      .then((d) => setEditBookedSlots(d.times || []))
      .catch(() => setEditBookedSlots([]))
  }, [reagendarId, editDate, editLevel])

  const startReagendar = (a: AdmissionAppointment) => {
    setReagendarId(a.id)
    setEditDate(a.appointment_date)
    setEditTime(a.appointment_time)
    setEditLevel(a.level)
  }

  const saveReagendar = async () => {
    if (!reagendarId) return
    if (editScheduleTimes.length > 0 && !editTime?.trim()) {
      alert('Elige un horario de la lista.')
      return
    }
    try {
      await updateAppointment(reagendarId, {
        appointment_date: editDate,
        appointment_time: (editTime?.trim() || 'Por confirmar'),
      })
      setReagendarId(null)
      runSearch()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const cancelReagendar = () => setReagendarId(null)

  const studentDisplay = (a: AdmissionAppointment) => {
    const parts = [a.student_name, a.student_last_name_p, a.student_last_name_m].filter(Boolean)
    return parts.join(' ')
  }

  return (
    <div className="admin-buscar">
      <div className="admin-buscar-box">
        <div className="admin-buscar-box-inner">
          <h3 className="admin-buscar-title">
            <span className="admin-buscar-title-icon" aria-hidden>🔍</span>
            Criterios de búsqueda
          </h3>
          <div className="admin-buscar-filters">
            <div className="admin-buscar-field admin-buscar-field-name">
              <label htmlFor="admin-buscar-name">Nombre (alumno o tutor)</label>
              <input
                ref={nameInputRef}
                id="admin-buscar-name"
                type="text"
                placeholder="Escriba para buscar..."
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                onFocus={() => setNameQuery('')}
                className="admin-input"
                autoComplete="off"
                aria-describedby="admin-buscar-hint"
              />
            </div>
            <div className="admin-buscar-field admin-buscar-field-date">
              <label htmlFor="admin-buscar-created">Fecha de agendación</label>
              <input
                id="admin-buscar-created"
                type="date"
                value={createdDate}
                onChange={(e) => setCreatedDate(e.target.value)}
                onFocus={() => setCreatedDate('')}
                className="admin-input"
                aria-label="Fecha de agendación (cuando registró la cita)"
              />
            </div>
            <div className="admin-buscar-field admin-buscar-field-date">
              <label htmlFor="admin-buscar-exam">Fecha de examen</label>
              <input
                id="admin-buscar-exam"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                onFocus={() => setExamDate('')}
                className="admin-input"
                aria-label="Fecha de examen"
              />
            </div>
          </div>
          <p id="admin-buscar-hint" className="admin-buscar-hint">
            Use al menos un criterio. La búsqueda se actualiza al escribir o elegir fecha. Navegue con Tab y use Enter en los resultados.
          </p>
        </div>
      </div>

      {loading && (
        <div className="admin-buscar-loading" role="status" aria-live="polite">
          <span className="admin-buscar-loading-dot" />
          <span className="admin-buscar-loading-dot" />
          <span className="admin-buscar-loading-dot" />
          <span>Buscando…</span>
        </div>
      )}

      {!loading && nameQuery.trim().length > 0 && nameQuery.trim().length < 2 && !createdDate && !examDate && (
        <p className="admin-hint">Escriba al menos 2 caracteres para buscar por nombre.</p>
      )}

      {!loading && (nameQuery.trim() || createdDate || examDate) && results.length === 0 && (
        <p className="admin-empty">No se encontraron citas con esos criterios.</p>
      )}

      {!loading && results.length > 0 && (
        <div ref={resultsRef} className="admin-buscar-results" role="list">
          {results.map((a, index) => (
            <div
              key={a.id}
              ref={selected?.id === a.id ? selectedCardRef : null}
              className={`admin-buscar-card ${selected?.id === a.id ? 'selected' : ''}`}
              role="listitem"
            >
              <button
                type="button"
                className="admin-buscar-card-head"
                onClick={() => setSelected(selected?.id === a.id ? null : a)}
                aria-expanded={selected?.id === a.id}
                aria-controls={selected?.id === a.id ? `admin-buscar-card-body-${a.id}` : undefined}
                id={`admin-buscar-card-${a.id}`}
              >
                <span className="admin-buscar-card-name">{studentDisplay(a)}</span>
                <span className="admin-buscar-card-meta">
                  {LEVEL_LABELS[a.level] || a.level} · {new Date(a.appointment_date + 'T12:00:00').toLocaleDateString('es-MX')} · {a.appointment_time}
                </span>
                <span className="admin-buscar-card-arrow">{selected?.id === a.id ? '▼' : '▶'}</span>
              </button>
              {selected?.id === a.id && (
                <div id={`admin-buscar-card-body-${a.id}`} className="admin-buscar-card-body" role="region" aria-labelledby={`admin-buscar-card-${a.id}`}>
                  <div className="admin-buscar-detail">
                    <p><strong>Aspirante:</strong> {studentDisplay(a)} · {a.grade_level} · {a.student_age} años</p>
                    <p><strong>Tutor:</strong> {a.parent_name} · {a.parent_email} · {a.parent_phone}</p>
                    <p><strong>Fecha de agendación:</strong> {formatCreatedAt(a.created_at)}</p>
                    <p><strong>Cita:</strong> {new Date(a.appointment_date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {a.appointment_time}</p>
                    <p><strong>Estado:</strong> <span className={`status-pill status-${a.status}`}>{a.status}</span></p>
                  </div>
                  {reagendarId === a.id ? (
                    <div ref={reagendarRef} className="admin-buscar-reagendar">
                      <h4>Reagendar cita</h4>
                      <div className="admin-buscar-calendar">
                        <label>Nueva fecha</label>
                        <ExamDateCalendar value={editDate} onChange={setEditDate} blockedDates={editBlockedDates} />
                      </div>
                      {editDate && (
                        <div className="admin-buscar-time">
                          <label>Horario</label>
                          {editScheduleTimes.length === 0 ? (
                            <input
                              type="text"
                              value={editTime}
                              onChange={(e) => setEditTime(e.target.value)}
                              className="admin-input"
                              placeholder="Ej: 09:00"
                              aria-label="Horario de la cita"
                            />
                          ) : (
                            <div className="time-slots time-slots-admin" role="group" aria-label="Elegir horario">
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
                                    aria-pressed={editTime === time}
                                    aria-disabled={isBooked}
                                  >
                                    {time}
                                    {isBooked && <span className="time-slot-label"> (Ocupado)</span>}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                      <div ref={reagendarTimeRef} className="admin-buscar-actions">
                        <button type="button" className="btn btn-primary" onClick={saveReagendar}>Guardar</button>
                        <button type="button" className="btn btn-secondary" onClick={cancelReagendar}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="admin-buscar-actions">
                      <button type="button" className="btn btn-primary" onClick={() => startReagendar(a)}>
                        Reagendar cita
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
