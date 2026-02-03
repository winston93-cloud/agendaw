-- Horarios de examen de admisión por nivel (1, 2 o 3 por día, lunes a viernes)
-- La psicóloga los configura en el admin; el formulario público muestra solo los del nivel elegido
CREATE TABLE IF NOT EXISTS public.admission_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('maternal_kinder', 'primaria', 'secundaria')),
  time_slot TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(level, time_slot)
);

CREATE INDEX IF NOT EXISTS idx_admission_schedules_level ON public.admission_schedules(level);

ALTER TABLE public.admission_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read admission_schedules" ON public.admission_schedules;
CREATE POLICY "Public read admission_schedules"
  ON public.admission_schedules FOR SELECT
  USING (true);
