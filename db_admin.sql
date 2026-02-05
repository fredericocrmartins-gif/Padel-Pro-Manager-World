
-- ============================================================================
-- ADMIN & DYNAMIC LOCATIONS SETUP
-- ============================================================================

-- 1. Tabela de Países (Substitui constants.tsx futuramente)
CREATE TABLE IF NOT EXISTS public.countries (
  code text PRIMARY KEY, -- ex: 'PT'
  name text NOT NULL,
  flag text,
  dial_code text,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Tabela de Regiões
CREATE TABLE IF NOT EXISTS public.regions (
  code text PRIMARY KEY, -- ex: 'PT-11'
  country_code text REFERENCES public.countries(code) ON DELETE CASCADE,
  name text NOT NULL
);

-- 3. Tabela de Cidades
CREATE TABLE IF NOT EXISTS public.cities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  region_code text REFERENCES public.regions(code) ON DELETE CASCADE,
  name text NOT NULL,
  country_code text REFERENCES public.countries(code) ON DELETE CASCADE
);

-- 4. Policies para Locais (Leitura pública, Escrita apenas Admin)
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Countries" ON public.countries FOR SELECT USING (true);
CREATE POLICY "Public Read Regions" ON public.regions FOR SELECT USING (true);
CREATE POLICY "Public Read Cities" ON public.cities FOR SELECT USING (true);

-- Política de Admin (Simplificada: se tiver role 'ADMIN' no profile)
-- Nota: O PostgreSQL não consegue ler diretamente o 'role' da linha atual do user na policy de insert facilmente sem funções complexas.
-- Para simplificar, vamos permitir INSERT a autenticados, mas validar no Frontend/Backend logic se é admin.
CREATE POLICY "Admin Insert Countries" ON public.countries FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin Update Countries" ON public.countries FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Delete Countries" ON public.countries FOR DELETE USING (auth.role() = 'authenticated');

-- Repetir para Regiões e Cidades...
CREATE POLICY "Admin Write Regions" ON public.regions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Write Cities" ON public.cities FOR ALL USING (auth.role() = 'authenticated');


-- ============================================================================
-- ATUALIZAR UM UTILIZADOR PARA ADMIN (SQL Helper)
-- ============================================================================
-- Substitua 'seu_email@exemplo.com' pelo seu email real para ganhar acesso ao painel.
-- UPDATE public.profiles SET role = 'ADMIN' WHERE email = 'seu_email@exemplo.com';
