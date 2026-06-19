-- Nombre del alumno prospecto en recorridos
ALTER TABLE public.tour_recorridos
  ADD COLUMN IF NOT EXISTS student_name TEXT;

-- Control para no mandar el recordatorio de Slack dos veces
ALTER TABLE public.tour_recorridos
  ADD COLUMN IF NOT EXISTS slack_reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;
