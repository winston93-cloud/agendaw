-- Campos para identificar registros migrados desde el sistema anterior
ALTER TABLE public.admission_appointments
  ADD COLUMN IF NOT EXISTS legacy_id INT,
  ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'new';

-- Índice único para evitar duplicados al volver a migrar
CREATE UNIQUE INDEX IF NOT EXISTS idx_admission_appointments_legacy_id
  ON public.admission_appointments(legacy_id)
  WHERE legacy_id IS NOT NULL;
