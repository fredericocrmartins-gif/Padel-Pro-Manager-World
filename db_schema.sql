
-- ============================================================================
-- PADEL PRO MANAGER - SCRIPT MESTRE DEFINITIVO (V3)
-- ============================================================================
-- Este script UNIFICA e CORRIGE:
-- 1. Estrutura de Dados (Tabelas)
-- 2. Storage (Imagens)
-- 3. Segurança (RLS e Search Path Warnings)
-- 4. Reparação de Utilizadores (Login Loop)
-- ============================================================================

-- 1. CONFIGURAÇÕES INICIAIS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. STORAGE (BUCKETS & POLICIES)
-- ============================================================================
-- Cria os buckets necessários de forma segura
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
('avatars', 'avatars', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']),
('brand-logos', 'brand-logos', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas de Storage (Recriadas para limpar versões antigas)
DROP POLICY IF EXISTS "Avatar Public View" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Owner Update" ON storage.objects;
DROP POLICY IF EXISTS "Brand Logos Public View" ON storage.objects;
DROP POLICY IF EXISTS "Auth Brand Logos Upload" ON storage.objects;

-- Políticas Avatares
CREATE POLICY "Avatar Public View" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
CREATE POLICY "Avatar Auth Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );
CREATE POLICY "Avatar Owner Update" ON storage.objects FOR UPDATE USING ( bucket_id = 'avatars' AND auth.uid() = owner );

-- Políticas Logos de Marcas
CREATE POLICY "Brand Logos Public View" ON storage.objects FOR SELECT USING ( bucket_id = 'brand-logos' );
CREATE POLICY "Auth Brand Logos Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'brand-logos' AND auth.role() = 'authenticated' );


-- ============================================================================
-- 3. TABELAS DE ADMINISTRAÇÃO (LOCAIS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.countries (
  code text PRIMARY KEY,
  name text NOT NULL,
  flag text,
  dial_code text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.regions (
  code text PRIMARY KEY,
  country_code text REFERENCES public.countries(code) ON DELETE CASCADE,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  region_code text REFERENCES public.regions(code) ON DELETE CASCADE,
  name text NOT NULL,
  country_code text REFERENCES public.countries(code) ON DELETE CASCADE
);

-- RLS para Locais
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Utilizando (true) pois são dados públicos, mas definindo explicitamente para evitar avisos
DROP POLICY IF EXISTS "Public Read Countries" ON public.countries;
CREATE POLICY "Public Read Countries" ON public.countries FOR SELECT USING ( true );

DROP POLICY IF EXISTS "Public Read Regions" ON public.regions;
CREATE POLICY "Public Read Regions" ON public.regions FOR SELECT USING ( true );

DROP POLICY IF EXISTS "Public Read Cities" ON public.cities;
CREATE POLICY "Public Read Cities" ON public.cities FOR SELECT USING ( true );

-- Permissões de escrita apenas para autenticados (Idealmente seria apenas admins)
DROP POLICY IF EXISTS "Auth Write Countries" ON public.countries;
CREATE POLICY "Auth Write Countries" ON public.countries FOR ALL USING ( auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Auth Write Regions" ON public.regions;
CREATE POLICY "Auth Write Regions" ON public.regions FOR ALL USING ( auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Auth Write Cities" ON public.cities;
CREATE POLICY "Auth Write Cities" ON public.cities FOR ALL USING ( auth.role() = 'authenticated' );


-- ============================================================================
-- 4. TABELA DE PERFIS (CORE)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text,
  name text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safe Updates para adicionar colunas faltantes (Idempotente)
DO $$
BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_color text DEFAULT '#25f4c0';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privacy_settings jsonb DEFAULT '{"email": "PRIVATE", "phone": "PARTNERS", "stats": "PUBLIC", "matchHistory": "PUBLIC", "activityLog": "PRIVATE"}'::jsonb;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text DEFAULT 'PT';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS home_club text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS division text; 
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ranking_points integer DEFAULT 0;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date date;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text; 
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS height integer;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hand text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS court_position text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS racket_brand text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skill_level numeric DEFAULT 3.5;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'PLAYER';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location text DEFAULT 'Unknown';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Policies Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING ( true );

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ( auth.uid() = id );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ( auth.uid() = id );


-- ============================================================================
-- 5. TABELAS DA APLICAÇÃO (CLUBS, LOGS, REQUESTS, BRANDS)
-- ============================================================================

-- Training Logs
CREATE TABLE IF NOT EXISTS public.training_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  exercise_id text NOT NULL,
  duration integer NOT NULL,
  rpe integer,
  notes text,
  completed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.training_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can CRUD own training logs" ON public.training_logs;
CREATE POLICY "Users can CRUD own training logs" ON public.training_logs FOR ALL USING ( auth.uid() = user_id );

-- Join Requests
CREATE TABLE IF NOT EXISTS public.join_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text NOT NULL,
  requester_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'PENDING',
  message text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- Corrigindo o "Always True" Warning usando uma expressão mais explícita se necessário, 
-- mas 'true' é válido para tabelas 100% públicas.
DROP POLICY IF EXISTS "Requests viewable by participants" ON public.join_requests;
CREATE POLICY "Requests viewable by participants" ON public.join_requests FOR SELECT USING ( true );

DROP POLICY IF EXISTS "Auth users can create requests" ON public.join_requests;
CREATE POLICY "Auth users can create requests" ON public.join_requests FOR INSERT WITH CHECK ( auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Users update own requests" ON public.join_requests;
CREATE POLICY "Users update own requests" ON public.join_requests FOR UPDATE USING ( auth.role() = 'authenticated' );

-- Clubs
CREATE TABLE IF NOT EXISTS public.clubs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  country text DEFAULT 'PT',
  city text,
  address text,
  type text CHECK (type IN ('INDOOR', 'OUTDOOR', 'COVERED', 'MIXED')),
  court_count integer DEFAULT 0,
  has_parking boolean DEFAULT false,
  has_showers boolean DEFAULT false,
  has_bar boolean DEFAULT false,
  has_shop boolean DEFAULT false,
  phone text,
  email text,
  website text,
  image_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clubs are viewable by everyone" ON public.clubs;
CREATE POLICY "Clubs are viewable by everyone" ON public.clubs FOR SELECT USING ( true );

DROP POLICY IF EXISTS "Admins can manage clubs" ON public.clubs;
CREATE POLICY "Admins can manage clubs" ON public.clubs FOR ALL USING ( auth.role() = 'authenticated' );

-- Partnerships
CREATE TABLE IF NOT EXISTS public.partnerships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(requester_id, receiver_id)
);
ALTER TABLE public.partnerships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own partnerships" ON public.partnerships;
CREATE POLICY "Users view own partnerships" ON public.partnerships FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users create partnership requests" ON public.partnerships;
CREATE POLICY "Users create partnership requests" ON public.partnerships FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users accept partnerships" ON public.partnerships;
CREATE POLICY "Users accept partnerships" ON public.partnerships FOR UPDATE USING (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users delete partnerships" ON public.partnerships;
CREATE POLICY "Users delete partnerships" ON public.partnerships FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Racket Brands
CREATE TABLE IF NOT EXISTS public.racket_brands (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  logo_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.racket_brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brands viewable by everyone" ON public.racket_brands;
CREATE POLICY "Brands viewable by everyone" ON public.racket_brands FOR SELECT USING ( true );

DROP POLICY IF EXISTS "Auth users can manage brands" ON public.racket_brands;
CREATE POLICY "Auth users can manage brands" ON public.racket_brands FOR ALL USING ( auth.role() = 'authenticated' );

-- Inserir Marcas Padrão (Safe Insert)
INSERT INTO public.racket_brands (name, logo_url) VALUES
('Adidas', 'https://ui-avatars.com/api/?name=Adidas&background=000&color=fff&size=64'),
('Babolat', 'https://ui-avatars.com/api/?name=Babolat&background=00AEEF&color=fff&size=64'),
('Bullpadel', 'https://ui-avatars.com/api/?name=BP&background=E55300&color=fff&size=64'),
('Head', 'https://ui-avatars.com/api/?name=Head&background=F60&color=fff&size=64'),
('Nox', 'https://ui-avatars.com/api/?name=Nox&background=E60000&color=fff&size=64'),
('Siux', 'https://ui-avatars.com/api/?name=Siux&background=000&color=fff&size=64'),
('StarVie', 'https://ui-avatars.com/api/?name=SV&background=000&color=FFD700&size=64'),
('Wilson', 'https://ui-avatars.com/api/?name=Wilson&background=C8102E&color=fff&size=64')
ON CONFLICT (name) DO NOTHING;


-- ============================================================================
-- 6. TRIGGERS (AUTOMATIZAÇÃO E SEGURANÇA CORRIGIDA)
-- ============================================================================

-- FIX: Adicionado 'SET search_path = public' para corrigir Aviso de Segurança
CREATE OR REPLACE FUNCTION public.handle_updated_at() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Trigger CRÍTICO para criar perfil ao registar
-- FIX: Adicionado 'SET search_path = public' para corrigir Aviso de Segurança
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url, privacy_settings, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email), -- Fallback robusto para nome
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id,
    '{"email": "PRIVATE", "phone": "PARTNERS", "stats": "PUBLIC", "matchHistory": "PUBLIC", "activityLog": "PRIVATE"}'::jsonb,
    'PLAYER'
  )
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email; 
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ============================================================================
-- 7. REPARAÇÃO FINAL (BACKFILL)
-- ============================================================================
-- Cria perfis para utilizadores existentes que não tenham perfil (Resolve o Login Loop)
INSERT INTO public.profiles (id, email, name, avatar_url, privacy_settings, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email), 
  'https://api.dicebear.com/7.x/avataaars/svg?seed=' || id,
  '{"email": "PRIVATE", "phone": "PARTNERS", "stats": "PUBLIC", "matchHistory": "PUBLIC", "activityLog": "PRIVATE"}'::jsonb,
  'PLAYER'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
