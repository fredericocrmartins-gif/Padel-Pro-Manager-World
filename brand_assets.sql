
-- ============================================================================
-- BRAND ASSETS STORAGE MANAGER
-- ============================================================================

-- 1. Criação do Bucket (Armazenamento físico)
-- O 'public: true' é essencial para que as imagens tenham URLs acessíveis.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'brand-logos', 
    'brand-logos', 
    true, 
    524288, -- Limite de 500KB por logo (otimização)
    ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'] -- Apenas imagens
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 524288,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];

-- ============================================================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- ============================================================================

-- Remover políticas antigas para evitar conflitos/duplicação
DROP POLICY IF EXISTS "Public Brand Logos View" ON storage.objects;
DROP POLICY IF EXISTS "Auth Brand Logos Upload" ON storage.objects;
DROP POLICY IF EXISTS "Auth Brand Logos Update" ON storage.objects;
DROP POLICY IF EXISTS "Auth Brand Logos Delete" ON storage.objects;

-- 1. LEITURA: Pública para todos (Visitantes e Utilizadores)
CREATE POLICY "Public Brand Logos View" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'brand-logos' );

-- 2. UPLOAD: Apenas utilizadores autenticados
-- (Num cenário ideal, restringiria a admins por email, ex: auth.email() = 'admin@padel.com')
CREATE POLICY "Auth Brand Logos Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( 
    bucket_id = 'brand-logos' 
    AND auth.role() = 'authenticated' 
);

-- 3. ATUALIZAÇÃO: Substituir imagens existentes
CREATE POLICY "Auth Brand Logos Update" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'brand-logos' AND auth.role() = 'authenticated' );

-- 4. APAGAR: Remover imagens antigas
CREATE POLICY "Auth Brand Logos Delete" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'brand-logos' AND auth.role() = 'authenticated' );

-- ============================================================================
-- EXEMPLO DE COMO ATUALIZAR A TABELA DE MARCAS COM O URL DA IMAGEM
-- ============================================================================
/*
  Depois de fazer o upload de uma imagem chamada 'adidas.png', 
  pode atualizar a tabela `racket_brands` com este SQL:

  UPDATE public.racket_brands
  SET logo_url = 'https://[SEU-PROJECT-ID].supabase.co/storage/v1/object/public/brand-logos/adidas.png'
  WHERE name = 'Adidas';
*/
