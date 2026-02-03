
-- -----------------------------------------------------------------------------
-- PADEL PRO MANAGER - MASTER DATABASE SCHEMA (FINAL VERSION)
-- -----------------------------------------------------------------------------
-- 
-- Como usar:
-- 1. Copie todo o conteúdo.
-- 2. No Supabase SQL Editor, apague tudo e cole este código.
-- 3. Execute (Run).
--
-- Este script é "Idempotente": corrige tabelas existentes se faltarem colunas
-- e cria o que não existe, sem apagar dados.

-- ============================================================================
-- [01] PROFILES
-- ============================================================================

-- 1. Cria a tabela base se não existir
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text,
  name text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. GARANTIA DE COLUNAS (Patching)
-- Se a tabela já existir (ex: criada pela tua query #3), isto adiciona o que falta.
DO $$
BEGIN
    -- Identidade Base
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
    
    -- Localização & Competição (NOVOS CAMPOS)
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text DEFAULT 'PT';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS home_club text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS division text; -- ex: M3, F4
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ranking_points integer DEFAULT 0;

    -- Físico
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date date;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text; 
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS height integer;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weight numeric;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hand text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS court_position text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS racket_brand text;
    
    -- Jogo
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skill_level numeric DEFAULT 3.5;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'PLAYER';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location text DEFAULT 'Unknown';
    
    -- Metadados
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());
END $$;

-- 3. RLS (Segurança)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING ( true );

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ( auth.uid() = id );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ( auth.uid() = id );


-- ============================================================================
-- [02] TRAINING LOGS
-- ============================================================================

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


-- ============================================================================
-- [03] JOIN REQUESTS
-- ============================================================================

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

DROP POLICY IF EXISTS "Requests viewable by participants" ON public.join_requests;
CREATE POLICY "Requests viewable by participants" ON public.join_requests FOR SELECT USING ( true );

DROP POLICY IF EXISTS "Auth users can create requests" ON public.join_requests;
CREATE POLICY "Auth users can create requests" ON public.join_requests FOR INSERT WITH CHECK ( auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Users update own requests" ON public.join_requests;
CREATE POLICY "Users update own requests" ON public.join_requests FOR UPDATE USING ( true );


-- ============================================================================
-- [04] TRIGGERS & FUNCTIONS
-- ============================================================================

-- Função updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Função New User (Sign Up)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', 'New Player'),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ language 'plpgsql' security definer;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
