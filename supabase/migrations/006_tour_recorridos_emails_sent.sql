-- Estado de envío de correos para recorridos
ALTER TABLE public.tour_recorridos
  ADD COLUMN IF NOT EXISTS email_parent_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_director_sent BOOLEAN DEFAULT false;
