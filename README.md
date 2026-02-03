# AgendaW - Sistema de Gestión de Citas Megasuperchingón 🚀

Sistema moderno de gestión de citas construido con Next.js, TypeScript y Supabase.

**Última actualización:** 3 de Febrero 2026

## Stack Tecnológico

- **Frontend**: Next.js 15 + TypeScript + CSS Global
- **Backend**: Next.js API Routes
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Despliegue**: Vercel (desde GitHub)

## Características Principales

- 📅 Calendario visual de citas
- 👥 Gestión de clientes y profesionales
- 🔔 Sistema de notificaciones
- 📊 Dashboard con estadísticas
- 🔐 Autenticación y autorización
- 📱 Diseño responsive

## Inicio Rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Copia `.env.local.example` a `.env.local`
3. Agrega tus credenciales de Supabase

```bash
cp .env.local.example .env.local
```

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Crea el build de producción
- `npm start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter
- `npm run type-check` - Verifica los tipos de TypeScript

## Estructura del Proyecto

```
agendaw/
├── src/
│   ├── app/              # App Router de Next.js
│   │   ├── api/          # API Routes
│   │   ├── (auth)/       # Rutas de autenticación
│   │   ├── (dashboard)/  # Rutas del dashboard
│   │   └── layout.tsx    # Layout principal
│   ├── components/       # Componentes reutilizables
│   ├── lib/             # Utilidades y configuraciones
│   │   ├── supabase/    # Cliente de Supabase
│   │   └── utils/       # Funciones auxiliares
│   ├── types/           # Definiciones de tipos TypeScript
│   └── styles/          # Estilos CSS globales
├── public/              # Archivos estáticos
└── supabase/           # Migraciones y esquemas
```

## Configuración de Supabase

Las tablas principales que necesitarás crear:

- `users` - Usuarios del sistema
- `clients` - Clientes que solicitan citas
- `professionals` - Profesionales que dan servicios
- `services` - Servicios disponibles
- `appointments` - Citas agendadas
- `availability` - Disponibilidad de profesionales

## Despliegue en Vercel

1. Sube el código a GitHub
2. Conecta el repositorio en [Vercel](https://vercel.com)
3. Configura las variables de entorno
4. ¡Deploy automático con cada push!

## Variables de Entorno en Vercel

Asegúrate de configurar estas variables en tu proyecto de Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

---

Desarrollado con ❤️ por Mario
