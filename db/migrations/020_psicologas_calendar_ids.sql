-- Event IDs de las 3 psicólogas (rotación en vacaciones: toda cita va a las tres).
-- google_event_id se conserva como el de la psicóloga del nivel del alumno (compat).

ALTER TABLE public.admission_appointments
  ADD COLUMN IF NOT EXISTS google_event_id_psic_educativo TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS google_event_id_psic_primaria TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS google_event_id_psic_secundaria TEXT DEFAULT NULL;
