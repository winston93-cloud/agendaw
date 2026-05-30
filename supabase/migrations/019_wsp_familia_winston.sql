-- Comprobantes Programa Familia Winston (referencia entre hermanos / familias)
CREATE TABLE IF NOT EXISTS public.wsp (
  id BIGSERIAL PRIMARY KEY,
  ctrl INTEGER NOT NULL,
  qr INTEGER NOT NULL,
  estatus TEXT NOT NULL DEFAULT 'INICIAL',
  status TEXT NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wsp_ctrl ON public.wsp (ctrl);
CREATE INDEX IF NOT EXISTS idx_wsp_qr ON public.wsp (qr);

COMMENT ON TABLE public.wsp IS 'Comprobantes Familia Winston generados al agendar cita';
COMMENT ON COLUMN public.wsp.ctrl IS 'Número de control (alumno_ref) del alumno que otorga el beneficio';
COMMENT ON COLUMN public.wsp.qr IS 'Código numérico de verificación (QR)';

ALTER TABLE public.wsp ENABLE ROW LEVEL SECURITY;

-- Solo backend con service role inserta/consulta; sin políticas públicas.
