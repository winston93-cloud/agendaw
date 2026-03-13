-- Elimina tablas heredadas de la plantilla base que no están en uso.
-- Orden: respeta FK constraints (hijos antes que padres).
-- Confirmado: ningún archivo del proyecto las referencia.

-- 1. availability → depende de professionals
DROP TABLE IF EXISTS public.availability CASCADE;

-- 2. appointments → depende de clients, professionals, services
DROP TABLE IF EXISTS public.appointments CASCADE;

-- 3. services → depende de professionals
DROP TABLE IF EXISTS public.services CASCADE;

-- 4. clients → depende de users
DROP TABLE IF EXISTS public.clients CASCADE;

-- 5. professionals → depende de users
DROP TABLE IF EXISTS public.professionals CASCADE;

-- 6. users → depende de auth.users (raíz)
DROP TABLE IF EXISTS public.users CASCADE;
