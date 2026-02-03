# Panel Admin – Psicólogas

URL en producción: **https://agendaw.vercel.app/admin**

## Acceso

1. Crear variable de entorno en Vercel (y en `.env.local` para desarrollo):
   - `ADMIN_SECRET`: contraseña que usarán las psicólogas para entrar.

2. Ir a **/admin**. Si no hay sesión, se redirige a **/admin/login**.
3. En login, ingresar la contraseña configurada en `ADMIN_SECRET`.
4. Tras entrar, se ve el panel con citas y bloqueo de días.

## Funciones

- **Ver citas**: listado de citas de examen de admisión (las que se generan desde el formulario público).
- **Reagendar**: cambiar fecha y/o hora de una cita; cambiar estado (pendiente, confirmada, cancelada, completada).
- **Bloquear días**: por nivel:
  - **Maternal y Kinder** (Instituto Educativo Winston)
  - **Primaria** (Instituto Winston Churchill)
  - **Secundaria** (Instituto Winston Churchill)

Si se bloquea un día para un nivel (ej. 27 de febrero para Secundaria), ese día **solo** queda bloqueado para ese nivel. Los otros dos niveles siguen pudiendo agendar ese día.

## Base de datos (Supabase)

Ejecutar la migración para crear tablas y políticas:

```bash
# Con Supabase CLI (si está configurado)
supabase db push

# O ejecutar manualmente en el SQL Editor de Supabase
# el contenido de: supabase/migrations/001_admission_admin.sql
```

Tablas:

- `admission_appointments`: citas enviadas desde el formulario público.
- `blocked_dates`: fechas bloqueadas por nivel (`maternal_kinder`, `primaria`, `secundaria`).

## Cerrar sesión

En el panel, enlace **Cerrar sesión** (o visitar `/api/admin/logout`).
