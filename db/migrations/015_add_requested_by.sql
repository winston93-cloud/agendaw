-- Agregar campo para identificar quién solicita la autorización
-- Puede ser el rol de la psicóloga/vinculación que solicita

ALTER TABLE public.permission_requests
  ADD COLUMN IF NOT EXISTS requested_by TEXT DEFAULT NULL;

-- Índice para búsquedas por solicitante
CREATE INDEX IF NOT EXISTS idx_permission_requests_requested_by 
  ON public.permission_requests(requested_by);
