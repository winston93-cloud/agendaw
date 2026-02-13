-- Crear bucket para almacenar documentos de admisión
INSERT INTO storage.buckets (id, name, public)
VALUES ('admission-documents', 'admission-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Política de acceso público para lectura
CREATE POLICY "Public Access for admission documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'admission-documents');

-- Política de escritura autenticada (admin service role)
CREATE POLICY "Authenticated users can upload admission documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'admission-documents');

-- Política de actualización para service role
CREATE POLICY "Service role can update admission documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'admission-documents')
WITH CHECK (bucket_id = 'admission-documents');

-- Política de eliminación para service role
CREATE POLICY "Service role can delete admission documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'admission-documents');
