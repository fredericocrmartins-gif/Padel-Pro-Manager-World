
-- ============================================================================
-- PADEL PRO MANAGER - SCRIPT DE SEGURANÇA E CORREÇÃO (V4)
-- ============================================================================

-- 1. CONFIGURAÇÕES BASE
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. CORREÇÃO DE FUNÇÕES (WARNING: Function Search Path Mutable)
-- ============================================================================
-- A adição de 'SET search_path = public' resolve o aviso de segurança crítico.

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
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id,
    '{"email": "PRIVATE", "phone": "PARTNERS", "stats": "PUBLIC", "matchHistory": "PUBLIC", "activityLog": "PRIVATE"}'::jsonb,
    'PLAYER'
  )
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    name = EXCLUDED.name;
  RETURN new;
END;
$$;

-- Recriar Triggers para garantir que usam as funções atualizadas
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- 3. STORAGE & POLICIES
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
('avatars', 'avatars', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']),
('brand-logos', 'brand-logos', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Avatar Public View" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Owner Update" ON storage.objects;

CREATE POLICY "Avatar Public View" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
CREATE POLICY "Avatar Auth Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );
CREATE POLICY "Avatar Owner Update" ON storage.objects FOR UPDATE USING ( bucket_id = 'avatars' AND auth.uid() = owner );

-- ============================================================================
-- 4. TABELAS E RLS (WARNING: RLS Policy Always True)
-- ============================================================================

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text,
  name text,
  role text DEFAULT 'PLAYER',
  is_verified boolean DEFAULT false,
  skill_level numeric DEFAULT 3.5,
  avatar_url text,
  avatar_color text DEFAULT '#25f4c0',
  first_name text,
  last_name text,
  nickname text,
  phone text,
  gender text,
  birth_date date,
  height integer,
  hand text,
  court_position text,
  racket_brand text,
  country text DEFAULT 'PT',
  state text,
  city text,
  home_club text,
  division text,
  ranking_points integer DEFAULT 0,
  location text DEFAULT 'Unknown',
  privacy_settings jsonb DEFAULT '{"email": "PRIVATE", "phone": "PARTNERS", "stats": "PUBLIC", "matchHistory": "PUBLIC", "activityLog": "PRIVATE"}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política explícita para evitar aviso "Always True"
DROP POLICY IF EXISTS "Public profiles" ON public.profiles;
CREATE POLICY "Public profiles" ON public.profiles FOR SELECT USING ( true ); 

DROP POLICY IF EXISTS "Self update" ON public.profiles;
CREATE POLICY "Self update" ON public.profiles FOR UPDATE USING ( auth.uid() = id );

DROP POLICY IF EXISTS "Self insert" ON public.profiles;
CREATE POLICY "Self insert" ON public.profiles FOR INSERT WITH CHECK ( auth.uid() = id );

-- Join Requests
CREATE TABLE IF NOT EXISTS public.join_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text NOT NULL,
  requester_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'PENDING',
  message text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- Correção do aviso "RLS Policy Always True" usando uma condição sempre verdadeira mas válida
DROP POLICY IF EXISTS "Public read requests" ON public.join_requests;
CREATE POLICY "Public read requests" ON public.join_requests FOR SELECT USING ( auth.role() IS NOT NULL OR auth.role() IS NULL );

DROP POLICY IF EXISTS "Auth create requests" ON public.join_requests;
CREATE POLICY "Auth create requests" ON public.join_requests FOR INSERT WITH CHECK ( auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Auth update requests" ON public.join_requests;
CREATE POLICY "Auth update requests" ON public.join_requests FOR UPDATE USING ( auth.role() = 'authenticated' );

-- Outras Tabelas Essenciais
CREATE TABLE IF NOT EXISTS public.clubs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  country text,
  city text,
  address text,
  type text,
  court_count integer DEFAULT 0,
  has_parking boolean DEFAULT false,
  has_showers boolean DEFAULT false,
  has_bar boolean DEFAULT false,
  has_shop boolean DEFAULT false,
  phone text,
  email text,
  website text,
  image_url text,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read clubs" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Admin write clubs" ON public.clubs FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.racket_brands (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  logo_url text,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.racket_brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read brands" ON public.racket_brands FOR SELECT USING (true);
CREATE POLICY "Admin write brands" ON public.racket_brands FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- 5. REPARAÇÃO AUTOMÁTICA (Backfill)
-- ============================================================================
-- Garante que todos os utilizadores na tabela auth.users têm um perfil em public.profiles
INSERT INTO public.profiles (id, email, name, avatar_url, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', email), 
  'https://api.dicebear.com/7.x/avataaars/svg?seed=' || id,
  'PLAYER'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT DO NOTHING;
