
-- ============================================================================
-- PADEL PRO MANAGER - REPAIR & SETUP SCRIPT (MASTER)
-- ============================================================================
-- Execute this script in the Supabase SQL Editor to fix your database.
-- It is idempotent (safe to run multiple times).
-- ============================================================================

-- 1. PROFILES TABLE (Core User Data)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text,
  name text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist (Patching for existing tables)
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
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weight numeric;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hand text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS court_position text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS racket_brand text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skill_level numeric DEFAULT 3.5;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'PLAYER';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location text DEFAULT 'Unknown';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'Column already exists, skipping.';
END $$;

-- Policies (Re-applying to ensure correctness)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING ( true );
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ( auth.uid() = id );
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ( auth.uid() = id );


-- 2. TRAINING LOGS
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


-- 3. JOIN REQUESTS
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


-- 4. CLUBS
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


-- 5. PARTNERSHIPS
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


-- 6. RACKET BRANDS
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

-- Populate Brands (Safe upsert)
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


-- 7. TRIGGERS (Automations)
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- This trigger creates a profile row every time a user signs up via Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url, privacy_settings, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'New Player'),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id,
    '{"email": "PRIVATE", "phone": "PARTNERS", "stats": "PUBLIC", "matchHistory": "PUBLIC", "activityLog": "PRIVATE"}'::jsonb,
    'PLAYER'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email; -- Sync email on conflict
  RETURN new;
END;
$$ language 'plpgsql' security definer;

-- Re-create the trigger to ensure it's active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ============================================================================
-- 8. CRITICAL REPAIR: BACKFILL MISSING PROFILES
-- ============================================================================
-- This command finds users who are in Auth but NOT in the public profiles table
-- and creates them. This fixes the "Login Loop" issue.
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
