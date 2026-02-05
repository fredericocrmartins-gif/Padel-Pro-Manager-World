
-- ============================================================================
-- STORAGE SETUP SCRIPT
-- ============================================================================
-- Execute este script no Supabase SQL Editor para criar o bucket de imagens
-- e configurar as permissões de segurança.
-- ============================================================================

-- 1. Criar o Bucket 'avatars' (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Configurar Políticas de Segurança (RLS) para o bucket 'avatars'

-- Permitir que QUALQUER PESSOA veja as imagens (Leitura Pública)
DROP POLICY IF EXISTS "Avatar Public View" ON storage.objects;
CREATE POLICY "Avatar Public View"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Permitir que utilizadores LOGADOS façam upload (Inserção)
DROP POLICY IF EXISTS "Avatar Auth Upload" ON storage.objects;
CREATE POLICY "Avatar Auth Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Permitir que o DONO do ficheiro atualize/substitua a sua imagem
DROP POLICY IF EXISTS "Avatar Owner Update" ON storage.objects;
CREATE POLICY "Avatar Owner Update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid() = owner
);

-- Permitir que o DONO apague a sua imagem (opcional, mas boa prática)
DROP POLICY IF EXISTS "Avatar Owner Delete" ON storage.objects;
CREATE POLICY "Avatar Owner Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid() = owner
);
