-- Guardar el ID del evento de Google Calendar para poder actualizarlo o eliminarlo
ALTER TABLE public.admission_appointments
  ADD COLUMN IF NOT EXISTS google_event_id TEXT;

ALTER TABLE public.tour_recorridos
  ADD COLUMN IF NOT EXISTS google_event_id TEXT;
