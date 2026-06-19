-- Tabla de solicitudes de autorización (exclusiva del flujo de admisión).
-- Evita colisiones con public.permission_requests de otros sistemas (p.ej. RH con enums).

CREATE TABLE IF NOT EXISTS public.admission_permission_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Tipo de solicitud
  type TEXT NOT NULL CHECK (type IN ('reagendar', 'horario', 'bloqueo')),

  -- Nivel / plantel del director responsable
  level TEXT NOT NULL CHECK (level IN ('maternal_kinder', 'primaria', 'secundaria')),

  -- Estado
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobada', 'rechazada')),

  -- ─── Campos para reagendar ───────────────────────────────
  appointment_id UUID REFERENCES public.admission_appointments(id) ON DELETE SET NULL,
  student_name   TEXT,
  appt_date      TEXT,
  appt_time      TEXT,
  proposed_date  TEXT,
  proposed_time  TEXT,
  proposed_grade TEXT,

  -- ─── Campos para cambio de horario ───────────────────────
  horario_action   TEXT CHECK (horario_action IN ('agregar', 'eliminar')),
  horario_time_new TEXT,
  horario_time_old TEXT,

  -- ─── Campos para bloqueo de día ──────────────────────────
  bloqueo_date     TEXT,
  bloqueo_date_end TEXT DEFAULT NULL,
  bloqueo_time     TEXT DEFAULT NULL,
  bloqueo_reason   TEXT,

  -- ─── Mensaje y respuesta ─────────────────────────────────
  psych_message  TEXT,
  director_notes TEXT,
  requested_by   TEXT DEFAULT NULL,

  created_at   TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_adm_perm_req_level   ON public.admission_permission_requests(level);
CREATE INDEX IF NOT EXISTS idx_adm_perm_req_status  ON public.admission_permission_requests(status);
CREATE INDEX IF NOT EXISTS idx_adm_perm_req_created ON public.admission_permission_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_adm_perm_req_appt_id ON public.admission_permission_requests(appointment_id);

ALTER TABLE public.admission_permission_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on admission_permission_requests" ON public.admission_permission_requests;
CREATE POLICY "Service role full access on admission_permission_requests"
  ON public.admission_permission_requests
  USING (true)
  WITH CHECK (true);

