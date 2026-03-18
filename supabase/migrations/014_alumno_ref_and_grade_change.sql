-- Agregar campo alumno_ref a admission_appointments
-- Para guardar el número de control cuando se completa la admisión

ALTER TABLE public.admission_appointments
  ADD COLUMN IF NOT EXISTS alumno_ref INTEGER DEFAULT NULL;

-- Agregar campo proposed_grade a permission_requests
-- Para solicitar cambio de grado al reagendar

ALTER TABLE public.permission_requests
  ADD COLUMN IF NOT EXISTS proposed_grade TEXT DEFAULT NULL;
