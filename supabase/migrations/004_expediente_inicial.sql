-- Expediente inicial del aspirante (llenado por papás antes de recibir resultados)
CREATE TABLE IF NOT EXISTS public.expediente_inicial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.admission_appointments(id) ON DELETE SET NULL,
  -- Datos del alumno (algunos prellenados desde la cita)
  nivel TEXT,
  grado TEXT,
  ciclo_escolar TEXT,
  nombre_alumno TEXT,
  apellido_paterno_alumno TEXT,
  apellido_materno_alumno TEXT,
  fecha_nacimiento DATE,
  lugar_nacimiento TEXT,
  sexo TEXT CHECK (sexo IS NULL OR sexo IN ('Masculino', 'Femenino')),
  edad INTEGER,
  escuela_procedencia TEXT,
  -- Datos del padre
  padre_nombre TEXT,
  padre_apellido_paterno TEXT,
  padre_apellido_materno TEXT,
  padre_edad INTEGER,
  padre_email TEXT,
  padre_lugar_trabajo TEXT,
  padre_estado_civil TEXT,
  padre_telefono_trabajo TEXT,
  padre_telefono_celular TEXT,
  -- Datos de la madre
  madre_nombre TEXT,
  madre_apellido_paterno TEXT,
  madre_apellido_materno TEXT,
  madre_edad INTEGER,
  madre_email TEXT,
  madre_lugar_trabajo TEXT,
  madre_estado_civil TEXT,
  madre_telefono_trabajo TEXT,
  madre_telefono_celular TEXT,
  -- Datos médicos
  tratamiento_medico_ultimo_ano TEXT,
  tratamiento_psicologico_si BOOLEAN,
  tratamiento_psicologico_razon TEXT,
  clase_extracurricular TEXT,
  nombre_escuela_guarderia TEXT,
  motivo_separacion TEXT,
  motivo_incorporacion TEXT,
  preocupacion_desenvolvimiento TEXT,
  nombre_persona_info TEXT,
  relacion_alumno TEXT,
  -- Evaluación comportamiento (checkboxes como JSON array de labels)
  conductas JSONB DEFAULT '[]',
  conductas_proceso_control TEXT,
  -- Info psicológica/médica
  padre_trabaja_fuera_ciudad BOOLEAN,
  madre_trabaja_fuera_ciudad BOOLEAN,
  alergias_padecimientos TEXT,
  diagnosticos_medicos TEXT,
  -- Info familiar
  num_familiares_adicionales INTEGER,
  lugar_ocupa_aspirante INTEGER,
  edades_familiares TEXT,
  familiar_1_nombre TEXT,
  familiar_1_apellidos TEXT,
  familiar_1_edad INTEGER,
  familiar_2_nombre TEXT,
  familiar_2_apellidos TEXT,
  familiar_2_edad INTEGER,
  familiar_3_nombre TEXT,
  familiar_3_apellidos TEXT,
  familiar_3_edad INTEGER,
  familiar_4_nombre TEXT,
  familiar_4_apellidos TEXT,
  familiar_4_edad INTEGER,
  -- Contacto
  telefono_principal TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expediente_inicial_appointment ON public.expediente_inicial(appointment_id);

ALTER TABLE public.expediente_inicial ENABLE ROW LEVEL SECURITY;

-- Permitir inserción/actualización desde el backend (service role). Lectura para admin.
DROP POLICY IF EXISTS "Public read expediente_inicial" ON public.expediente_inicial;
CREATE POLICY "Public read expediente_inicial" ON public.expediente_inicial FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert expediente_inicial" ON public.expediente_inicial;
CREATE POLICY "Public insert expediente_inicial" ON public.expediente_inicial FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update expediente_inicial" ON public.expediente_inicial;
CREATE POLICY "Public update expediente_inicial" ON public.expediente_inicial FOR UPDATE USING (true);
