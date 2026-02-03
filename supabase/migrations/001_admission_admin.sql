-- Citas de examen de admisión (desde formulario público)
CREATE TABLE IF NOT EXISTS public.admission_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campus TEXT NOT NULL CHECK (campus IN ('winston', 'churchill')),
  level TEXT NOT NULL CHECK (level IN ('maternal', 'kinder', 'primaria', 'secundaria')),
  grade_level TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_age TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  relationship TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nivel para bloqueos y filtros: maternal_kinder | primaria | secundaria
CREATE TABLE IF NOT EXISTS public.blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_date DATE NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('maternal_kinder', 'primaria', 'secundaria')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(block_date, level)
);

CREATE INDEX IF NOT EXISTS idx_admission_appointments_date ON public.admission_appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_admission_appointments_status ON public.admission_appointments(status);
CREATE INDEX IF NOT EXISTS idx_admission_appointments_level ON public.admission_appointments(level);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_date_level ON public.blocked_dates(block_date, level);

ALTER TABLE public.admission_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

-- admission_appointments: solo backend con service role (bypasea RLS). Sin políticas para anon.
-- blocked_dates: lectura pública para que el formulario pueda ocultar días bloqueados por nivel
DROP POLICY IF EXISTS "Public read blocked_dates" ON public.blocked_dates;
CREATE POLICY "Public read blocked_dates"
  ON public.blocked_dates FOR SELECT
  USING (true);
