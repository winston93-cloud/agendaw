# AgendaW — Contexto del Proyecto

Sistema de agendamiento de citas para proceso de admisión escolar del **Instituto Winston Churchill** e **Instituto Educativo Winston** (Guadalajara, México). Más de 30 años formando líderes.

**Stack**: Next.js 16 (App Router) · Supabase (PostgreSQL) · CSS puro con variables · Plus Jakarta Sans · Vercel

**Módulos principales**:
- `/` — Landing pública para padres de familia
- `/agendar` — Formulario de cita de admisión (2 pasos)
- `/admin` — Panel interno: citas, horarios, búsqueda, migración, recorridos
- `/documentacion` — Checklist de documentos por nivel
- `/expediente_inicial` — Captura de expediente del aspirante

**Colores institucionales**: Azul `#1565c0` · Amarillo-verde `#c8d400` · Logos en `/public/`

---

## Design Context

### Users

**Públicos (padres/tutores)**: Familias buscando inscribir a sus hijos. Acceden desde móvil en su mayoría. Su contexto es emocional — es una decisión importante. Necesitan sentir **confianza y claridad** en cada paso del proceso.

**Internos (staff administrativo, psicólogas, dirección)**: Personal que gestiona el pipeline de admisión diariamente. Usan el panel en desktop. Necesitan **velocidad, densidad de información útil y cero ambigüedad** en los datos.

### Brand Personality

**Dinámico · Innovador · Juvenil** — Una institución con décadas de trayectoria que no se siente anticuada. La agenda digital es la primera impresión del colegio; debe comunicar modernidad sin sacrificar seriedad académica. Tono: confiado, directo, un poco aspiracional.

### Aesthetic Direction

**Referencia**: Stripe Dashboard — datos limpios, jerarquía tipográfica clara, mucha información sin sensación de saturación. Espaciado generoso, contraste nítido.

**Modo**: Light y Dark con toggle — el admin debe soportar ambos sin perder legibilidad.

**Anti-referencias**:
- ❌ Paleta semáforo (rojo/amarillo/verde en todo) — usar color con intención, no decoración
- ❌ Sombras excesivas y gradientes pesados — preferir bordes sutiles y profundidad discreta
- ❌ Apariencia Bootstrap/Material out-of-the-box — debe tener identidad propia

### Design Principles

1. **Claridad sobre decoración** — cada elemento visual debe justificar su presencia. Si no aporta información o jerarquía, se elimina.
2. **Tipografía como arquitectura** — Plus Jakarta Sans ya está cargada; usarla con pesos contrastados (400/600/700) para construir jerarquía sin depender de color.
3. **Color con propósito** — el azul institucional (`#1565c0`) ancla la identidad; el color de acento se reserva para acciones primarias y estados, nunca para decoración.
4. **Densidad cómoda** — el admin muestra tablas con mucha data; el espaciado debe ser generoso pero no derrochador. Target: Stripe, no Excel.
5. **Mobile-first en lo público, desktop-optimizado en lo interno** — el formulario `/agendar` se diseña desde 375px; el panel `/admin` se optimiza para 1280px+ pero no se rompe en móvil.
