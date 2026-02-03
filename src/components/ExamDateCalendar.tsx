'use client'

import { useState, useMemo } from 'react'
import {
  addDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
  isSameMonth,
  isSameDay,
  isBefore,
  isWeekend,
  addMonths,
  subMonths,
  isAfter,
} from 'date-fns'
import { es } from 'date-fns/locale'

interface ExamDateCalendarProps {
  value: string // YYYY-MM-DD
  onChange: (date: string) => void
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function getMinBookableDate(): Date {
  let d = addDays(new Date(), 2)
  while (isWeekend(d)) {
    d = addDays(d, 1)
  }
  return d
}

export default function ExamDateCalendar({ value, onChange }: ExamDateCalendarProps) {
  const selectedDate = value ? new Date(value + 'T12:00:00') : null
  const minBookable = useMemo(() => getMinBookableDate(), [])
  const [isOpen, setIsOpen] = useState(!value)
  const [viewDate, setViewDate] = useState(() => {
    if (selectedDate) return selectedDate
    return minBookable
  })

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days: Date[] = []
  let day = calendarStart
  while (day <= calendarEnd) {
    days.push(day)
    day = addDays(day, 1)
  }

  const isDayDisabled = (date: Date): boolean => {
    if (isWeekend(date)) return true
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const minStart = new Date(minBookable.getFullYear(), minBookable.getMonth(), minBookable.getDate())
    return isBefore(dayStart, minStart)
  }

  const handleSelect = (date: Date) => {
    if (isDayDisabled(date)) return
    onChange(format(date, 'yyyy-MM-dd'))
    setIsOpen(false)
  }

  const formattedSelectedDate = value && selectedDate
    ? format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })
    : ''

  const canPrevMonth = (): boolean => {
    const prev = subMonths(viewDate, 1)
    return prev.getFullYear() > minBookable.getFullYear() ||
      (prev.getFullYear() === minBookable.getFullYear() && prev.getMonth() >= minBookable.getMonth())
  }

  if (value && !isOpen) {
    return (
      <div className="exam-calendar-closed">
        <div className="exam-date-selected">
          <span className="exam-date-label">Fecha del examen:</span>
          <span className="exam-date-value">{formattedSelectedDate}</span>
        </div>
        <button
          type="button"
          className="exam-date-change"
          onClick={() => setIsOpen(true)}
        >
          Cambiar fecha
        </button>
      </div>
    )
  }

  return (
    <div className="exam-calendar">
      <div className="exam-calendar-header">
        <button
          type="button"
          className="exam-calendar-nav"
          onClick={() => setViewDate(subMonths(viewDate, 1))}
          disabled={!canPrevMonth()}
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <h3 className="exam-calendar-title">
          {format(viewDate, 'MMMM yyyy', { locale: es })}
        </h3>
        <button
          type="button"
          className="exam-calendar-nav"
          onClick={() => setViewDate(addMonths(viewDate, 1))}
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>

      <div className="exam-calendar-weekdays">
        {WEEKDAYS.map((wd) => (
          <span key={wd} className="exam-calendar-weekday">{wd}</span>
        ))}
      </div>

      <div className="exam-calendar-grid">
        {days.map((date) => {
          const disabled = isDayDisabled(date)
          const selected = selectedDate && isSameDay(date, selectedDate)
          const currentMonth = isSameMonth(date, viewDate)
          return (
            <button
              key={date.toISOString()}
              type="button"
              className={`exam-calendar-day ${!currentMonth ? 'other-month' : ''} ${disabled ? 'disabled' : ''} ${selected ? 'selected' : ''}`}
              onClick={() => handleSelect(date)}
              disabled={disabled}
            >
              {format(date, 'd')}
            </button>
          )
        })}
      </div>

      <p className="exam-calendar-note">
        Solo días hábiles. Mínimo 2 días de anticipación.
      </p>
    </div>
  )
}
