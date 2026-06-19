-- Campos extra en citas de admisión (después de seleccionar horario)
ALTER TABLE public.admission_appointments
  ADD COLUMN IF NOT EXISTS student_last_name_p TEXT,
  ADD COLUMN IF NOT EXISTS student_last_name_m TEXT,
  ADD COLUMN IF NOT EXISTS student_birth_date DATE,
  ADD COLUMN IF NOT EXISTS school_cycle TEXT,
  ADD COLUMN IF NOT EXISTS how_did_you_hear TEXT;
