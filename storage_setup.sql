
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

-- 2. Criar o Bucket 'brand-logos' (NOVO)
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-logos', 'brand-logos', true)
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- POLICIES: AVATARS
-- ============================================================================

DROP POLICY IF EXISTS "Avatar Public View" ON storage.objects;
CREATE POLICY "Avatar Public View" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Avatar Auth Upload" ON storage.objects;
CREATE POLICY "Avatar Auth Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Avatar Owner Update" ON storage.objects;
CREATE POLICY "Avatar Owner Update" ON storage.objects FOR UPDATE USING ( bucket_id = 'avatars' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Avatar Owner Delete" ON storage.objects;
CREATE POLICY "Avatar Owner Delete" ON storage.objects FOR DELETE USING ( bucket_id = 'avatars' AND auth.uid() = owner );


-- ============================================================================
-- POLICIES: BRAND LOGOS
-- ============================================================================

-- Qualquer pessoa pode ver os logos das marcas
DROP POLICY IF EXISTS "Brand Logos Public View" ON storage.objects;
CREATE POLICY "Brand Logos Public View" ON storage.objects FOR SELECT USING ( bucket_id = 'brand-logos' );

-- Apenas Admins ou Service Role podem inserir/editar logos (por segurança)
-- Nota: Para facilitar o desenvolvimento inicial, permitimos autenticados, 
-- mas num ambiente de produção real deve restringir a admins.
DROP POLICY IF EXISTS "Brand Logos Admin Insert" ON storage.objects;
CREATE POLICY "Brand Logos Admin Insert" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'brand-logos' AND auth.role() = 'authenticated' );
