-- Recorridos programados: citas que la sra. de vinculación agenda a papás para dar un recorrido
-- Restricción: no duplicar (plantel_group, tour_date, tour_time)
-- Plantel educativo: maternal + kinder comparten horarios
-- Plantel primaria/secundaria: primaria + secundaria comparten horarios
CREATE TABLE IF NOT EXISTS public.tour_recorridos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('maternal', 'kinder', 'primaria', 'secundaria')),
  tour_date DATE NOT NULL,
  tour_time TEXT NOT NULL CHECK (tour_time ~ '^[0-9]{1,2}:[0-9]{2}$'),
  parent_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_recorridos_date ON public.tour_recorridos(tour_date);
CREATE INDEX IF NOT EXISTS idx_tour_recorridos_level ON public.tour_recorridos(level);
CREATE INDEX IF NOT EXISTS idx_tour_recorridos_created ON public.tour_recorridos(created_at DESC);

-- RLS: acceso solo vía service role (admin)
ALTER TABLE public.tour_recorridos ENABLE ROW LEVEL SECURITY;
