-- Columnas adicionales para guardar event IDs de calendars adicionales de Primaria
-- google_event_id ya existe para la psicóloga
-- Agregamos 2 columnas más para control escolar e inglés

ALTER TABLE public.admission_appointments
  ADD COLUMN IF NOT EXISTS google_event_id_control_escolar TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS google_event_id_ingles TEXT DEFAULT NULL;

-- No necesitan índices porque no se consultarán directamente,
-- solo se usan para actualizar/eliminar eventos cuando sea necesario
