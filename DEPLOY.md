# 🚀 Despliegue en Vercel

## Pasos para desplegar AgendaW en Vercel

### 1. Conectar con GitHub (Ya está listo ✅)
- Repositorio: https://github.com/winston93-cloud/agendamx
- Branch: `main`

### 2. Importar proyecto en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Click en **"Add New Project"**
3. Selecciona **"Import Git Repository"**
4. Busca `winston93-cloud/agendamx`
5. Click en **"Import"**

### 3. Configurar el proyecto

Vercel detectará automáticamente que es Next.js. Solo verifica:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 4. Configurar Variables de Entorno

En la sección **"Environment Variables"** agrega:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
NEXT_PUBLIC_APP_URL=https://tu-proyecto.vercel.app
```

⚠️ **IMPORTANTE**: Primero necesitas crear el proyecto en Supabase

### 5. Deploy

1. Click en **"Deploy"**
2. Espera 2-3 minutos
3. ¡Listo! Tu app estará en: `https://agendamx.vercel.app`

---

## 📝 Configuración de Supabase (Hacer ANTES del deploy)

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Click en "New Project"
3. Llena los datos:
   - **Name**: agendamx
   - **Database Password**: (guarda esta contraseña)
   - **Region**: South America (São Paulo) - más cercano a México
4. Click en "Create new project"
5. Espera 2-3 minutos

### 2. Ejecutar el Schema SQL

1. En el dashboard de Supabase, ve a **SQL Editor**
2. Copia el contenido del archivo `supabase/schema.sql`
3. Pega en el editor
4. Click en **"Run"**
5. Verifica que aparezca el mensaje de éxito

### 3. Obtener las credenciales

1. Ve a **Settings → API**
2. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Configurar autenticación (opcional)

1. Ve a **Authentication → Providers**
2. Habilita **Email** si quieres login de administradores

---

## 🔄 Despliegue Automático

Una vez configurado, cada vez que hagas:

```bash
git add .
git commit -m "Descripción de cambios"
git push origin main
```

Vercel automáticamente:
1. Detectará el push
2. Construirá la app
3. Desplegará la nueva versión
4. Te enviará un email cuando esté lista

---

## 🌐 URLs del Proyecto

- **GitHub**: https://github.com/winston93-cloud/agendamx
- **Vercel**: (Se generará después del deploy)
- **Supabase**: (Se generará después de crear el proyecto)

---

## 🔧 Comandos útiles

```bash
# Ver status de git
git status

# Hacer cambios y subir
git add .
git commit -m "Descripción"
git push origin main

# Ver remotes
git remote -v

# Ver logs
git log --oneline
```

---

## 📞 Próximos pasos después del deploy

1. ✅ Código en GitHub
2. ⏳ Crear proyecto en Supabase
3. ⏳ Ejecutar schema SQL
4. ⏳ Configurar variables en Vercel
5. ⏳ Deploy en Vercel
6. ⏳ Probar la app en producción
7. ⏳ Conectar formulario con Supabase
8. ⏳ Implementar emails de confirmación

---

¡Todo listo para el deploy! 🚀
