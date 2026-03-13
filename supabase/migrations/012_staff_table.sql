-- Tabla mínima de personal administrativo (psicólogas, directoras, admin).
-- Permite auditar quién autorizó/creó cada solicitud de permiso y escalar roles en el futuro.

CREATE TABLE IF NOT EXISTS public.staff (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_user_id UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  name             TEXT        NOT NULL,
  role             TEXT        NOT NULL CHECK (role IN ('psicologa', 'directora', 'admin')),
  level            TEXT        CHECK (level IN ('maternal_kinder', 'primaria', 'secundaria')),
  active           BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice por usuario de Supabase Auth para lookups rápidos
CREATE INDEX IF NOT EXISTS idx_staff_supabase_user_id ON public.staff(supabase_user_id);

-- Índice por nivel y rol (útil en filtros del admin)
CREATE INDEX IF NOT EXISTS idx_staff_level_role ON public.staff(level, role);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_staff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_staff_updated_at ON public.staff;

CREATE TRIGGER trg_staff_updated_at
  BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION update_staff_updated_at();

-- RLS: habilitado pero permisivo por ahora (solo admins autenticados pueden leer)
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_select_authenticated" ON public.staff;
DROP POLICY IF EXISTS "staff_insert_authenticated" ON public.staff;
DROP POLICY IF EXISTS "staff_update_authenticated" ON public.staff;

CREATE POLICY "staff_select_authenticated"
  ON public.staff FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "staff_insert_authenticated"
  ON public.staff FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "staff_update_authenticated"
  ON public.staff FOR UPDATE
  TO authenticated
  USING (true);


-- ─────────────────────────────────────────────
-- Agrega trazabilidad a permission_requests:
-- quién del staff creó/aprobó la solicitud.
-- ─────────────────────────────────────────────
ALTER TABLE public.permission_requests
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Índice para consultas de auditoría
CREATE INDEX IF NOT EXISTS idx_permission_requests_approved_by
  ON public.permission_requests(approved_by);


-- ─────────────────────────────────────────────
-- Índices de performance recomendados.
-- (Aplica solo los que no existen ya.)
-- ─────────────────────────────────────────────

-- admission_appointments: filtros comunes en el panel admin
CREATE INDEX IF NOT EXISTS idx_admission_appointments_date
  ON public.admission_appointments(appointment_date);

CREATE INDEX IF NOT EXISTS idx_admission_appointments_status
  ON public.admission_appointments(status);

CREATE INDEX IF NOT EXISTS idx_admission_appointments_level
  ON public.admission_appointments(level);

-- blocked_dates: filtros en calendario de disponibilidad
CREATE INDEX IF NOT EXISTS idx_blocked_dates_date
  ON public.blocked_dates(block_date);

CREATE INDEX IF NOT EXISTS idx_blocked_dates_level
  ON public.blocked_dates(level);

-- permission_requests: filtros de estado en dashboard de directoras
CREATE INDEX IF NOT EXISTS idx_permission_requests_status
  ON public.permission_requests(status);

CREATE INDEX IF NOT EXISTS idx_permission_requests_appointment_id
  ON public.permission_requests(appointment_id);
