-- Tabla de solicitudes de autorización de psicólogas a directoras
CREATE TABLE IF NOT EXISTS public.permission_requests (
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
  current_date   TEXT,
  current_time   TEXT,
  proposed_date  TEXT,
  proposed_time  TEXT,

  -- ─── Campos para cambio de horario ───────────────────────
  horario_action   TEXT CHECK (horario_action IN ('agregar', 'eliminar')),
  horario_time_new TEXT,   -- horario a agregar
  horario_time_old TEXT,   -- horario a eliminar (para cambio)

  -- ─── Campos para bloqueo de día ──────────────────────────
  bloqueo_date   TEXT,
  bloqueo_reason TEXT,

  -- ─── Mensaje y respuesta ─────────────────────────────────
  psych_message  TEXT,   -- mensaje de la psicóloga
  director_notes TEXT,   -- respuesta/notas de la directora

  -- ─── Metadatos ───────────────────────────────────────────
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at  TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_perm_req_level   ON public.permission_requests(level);
CREATE INDEX idx_perm_req_status  ON public.permission_requests(status);
CREATE INDEX idx_perm_req_created ON public.permission_requests(created_at DESC);

ALTER TABLE public.permission_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on permission_requests"
  ON public.permission_requests
  USING (true)
  WITH CHECK (true);
