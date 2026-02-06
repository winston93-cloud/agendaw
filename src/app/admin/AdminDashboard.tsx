'use client'

import { useState } from 'react'
import AdminCitas from './AdminCitas'
import AdminBloquear from './AdminBloquear'
import AdminHorarios from './AdminHorarios'
import AdminBuscar from './AdminBuscar'
import type { AdmissionAppointment } from '@/types/database'
import type { BlockedDate } from '@/types/database'
import type { AdmissionSchedule } from '@/types/database'

type Section = 'citas' | 'horarios' | 'bloquear' | 'buscar' | null

const CARDS: { id: Section; icon: string; title: string; description: string; accent: string }[] = [
  {
    id: 'citas',
    icon: '📅',
    title: 'Citas programadas',
    description: 'Ver, reagendar y cambiar estado de las citas',
    accent: 'citas',
  },
  {
    id: 'horarios',
    icon: '🕐',
    title: 'Horarios por nivel',
    description: 'Configurar horarios disponibles por nivel',
    accent: 'horarios',
  },
  {
    id: 'bloquear',
    icon: '🚫',
    title: 'Días bloqueados por nivel',
    description: 'Bloquear fechas para un nivel',
    accent: 'bloquear',
  },
  {
    id: 'buscar',
    icon: '🔍',
    title: 'Buscar alumno',
    description: 'Búsqueda por nombre o fecha; ver datos y reagendar',
    accent: 'buscar',
  },
]

export default function AdminDashboard({
  appointments,
  blockedDates,
  schedules,
}: {
  appointments: AdmissionAppointment[]
  blockedDates: BlockedDate[]
  schedules: AdmissionSchedule[]
}) {
  const [activeSection, setActiveSection] = useState<Section>(null)

  if (activeSection) {
    return (
      <div className="admin-dashboard-content">
        <button
          type="button"
          className="admin-back-cards"
          onClick={() => setActiveSection(null)}
          aria-label="Volver al menú de secciones"
        >
          ← Volver a las secciones
        </button>
        {activeSection === 'citas' && (
          <section className="admin-section admin-section-citas">
            <h2><span className="admin-section-icon">📅</span> Citas programadas</h2>
            <AdminCitas appointments={appointments} />
          </section>
        )}
        {activeSection === 'horarios' && (
          <section className="admin-section admin-section-horarios">
            <h2><span className="admin-section-icon">🕐</span> Horarios por nivel</h2>
            <AdminHorarios schedules={schedules} />
          </section>
        )}
        {activeSection === 'bloquear' && (
          <section className="admin-section admin-section-bloquear">
            <h2><span className="admin-section-icon">🚫</span> Días bloqueados por nivel</h2>
            <p className="admin-hint">
              Si bloqueas un día para un nivel (ej. Secundaria), los otros niveles (Maternal/Kinder, Primaria) siguen pudiendo agendar ese día.
            </p>
            <AdminBloquear blockedDates={blockedDates} />
          </section>
        )}
        {activeSection === 'buscar' && (
          <section className="admin-section admin-section-buscar">
            <h2><span className="admin-section-icon">🔍</span> Buscar alumno</h2>
            <p className="admin-hint">
              Busque por nombre del alumno o tutor, por fecha en que se agendó la cita o por fecha del examen. Al seleccionar un resultado verá el registro completo y podrá reagendar.
            </p>
            <AdminBuscar />
          </section>
        )}
      </div>
    )
  }

  return (
    <div className="admin-cards-grid">
      {CARDS.map((card) => (
        <button
          key={card.id}
          type="button"
          className={`admin-card admin-card-${card.accent}`}
          onClick={() => setActiveSection(card.id)}
          aria-label={`${card.title}. ${card.description}`}
        >
          <span className="admin-card-icon">{card.icon}</span>
          <h3 className="admin-card-title">{card.title}</h3>
          <p className="admin-card-desc">{card.description}</p>
          <span className="admin-card-arrow">→</span>
        </button>
      ))}
    </div>
  )
}
