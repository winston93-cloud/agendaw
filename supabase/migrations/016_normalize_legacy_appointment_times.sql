-- Normalizar formato de appointment_time en registros legacy
-- Sistema anterior usaba formato 11.00 (punto decimal)
-- Sistema nuevo usa formato 11:00 (dos puntos)

-- Actualizar todos los registros legacy que tienen punto decimal
UPDATE public.admission_appointments
SET appointment_time = REPLACE(appointment_time, '.', ':')
WHERE origin = 'legacy' 
  AND appointment_time LIKE '%.%';

-- También normalizar horarios que no tienen minutos (ej: '9' → '09:00')
UPDATE public.admission_appointments
SET appointment_time = 
  CASE 
    WHEN appointment_time ~ '^\d{1}$' THEN '0' || appointment_time || ':00'
    WHEN appointment_time ~ '^\d{2}$' THEN appointment_time || ':00'
    WHEN appointment_time ~ '^\d{1}:\d{2}$' THEN '0' || appointment_time
    ELSE appointment_time
  END
WHERE origin = 'legacy' 
  AND appointment_time !~ '^\d{2}:\d{2}$';
