/**
 * Niveles que comparten psicóloga y no pueden tener cita el mismo día a la misma hora.
 * maternal_kinder es el identificador de horarios en admission_schedules.
 */
export function bookingConflictLevels(level: string): string[] {
  if (level === 'maternal' || level === 'kinder' || level === 'maternal_kinder') {
    return ['maternal', 'kinder']
  }
  if (level === 'primaria') return ['primaria']
  if (level === 'secundaria') return ['secundaria']
  return [level]
}
