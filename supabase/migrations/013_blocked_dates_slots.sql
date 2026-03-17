-- Migración 013: Bloqueo por horario específico y por rango de fechas

-- 1. Agregar columna block_time a blocked_dates (NULL = día completo)
ALTER TABLE public.blocked_dates
  ADD COLUMN IF NOT EXISTS block_time TEXT DEFAULT NULL;

-- 2. Eliminar la restricción única antigua (block_date, level)
ALTER TABLE public.blocked_dates
  DROP CONSTRAINT IF EXISTS blocked_dates_block_date_level_key;

-- 3. Crear índices únicos parciales:
--    - Día completo: solo un registro por (fecha, nivel) cuando block_time IS NULL
--    - Por horario:  solo un registro por (fecha, nivel, hora) cuando block_time IS NOT NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_blocked_full_day
  ON public.blocked_dates (block_date, level)
  WHERE block_time IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_blocked_by_slot
  ON public.blocked_dates (block_date, level, block_time)
  WHERE block_time IS NOT NULL;

-- 4. Agregar campos de rango y horario a permission_requests
ALTER TABLE public.permission_requests
  ADD COLUMN IF NOT EXISTS bloqueo_date_end TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bloqueo_time     TEXT DEFAULT NULL;
