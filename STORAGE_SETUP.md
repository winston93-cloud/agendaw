# Configuración del Storage para Documentación

## Crear Bucket en Supabase

1. Ve a tu proyecto en Supabase Dashboard: https://supabase.com/dashboard/project/nmxrccrbnoenkahefrrw
2. Navega a **Storage** en el menú lateral
3. Haz clic en **"New bucket"**
4. Configura el bucket con:
   - **Name**: `admission-documents`
   - **Public bucket**: ✅ Activado (para que los enlaces sean públicos)
   - **File size limit**: 5MB
   - **Allowed MIME types**: `application/pdf`, `image/jpeg`, `image/jpg`, `image/png`

5. Crea el bucket

## Configurar Políticas de Acceso

Después de crear el bucket, ejecuta las políticas del archivo:
```
supabase/migrations/005_admission_documents_storage.sql
```

Esto se puede hacer desde:
- **SQL Editor** en Supabase Dashboard
- O ejecutando: `supabase db push` (si tienes el CLI configurado)

## ¿Por qué usar Storage?

El límite de Vercel para el body de las peticiones es **4.5MB** en el plan gratuito.
Cuando convertimos archivos a base64 para enviarlos por correo, el tamaño aumenta ~33%.

**Solución**: Subir archivos a Supabase Storage y enviar solo los enlaces por correo.

Beneficios:
- ✅ Sin límite de 4.5MB (Supabase permite hasta 5MB por archivo gratis)
- ✅ Correos más ligeros y rápidos
- ✅ Archivos siempre disponibles para descarga
- ✅ URLs públicas fáciles de compartir
