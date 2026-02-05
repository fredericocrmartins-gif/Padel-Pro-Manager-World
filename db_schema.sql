
-- -----------------------------------------------------------------------------
-- PADEL PRO MANAGER - MASTER DATABASE SCHEMA (FINAL VERSION)
-- -----------------------------------------------------------------------------

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
DO $$
BEGIN
    -- Identidade Base
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_color text DEFAULT '#25f4c0';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privacy_settings jsonb DEFAULT '{"email": "PRIVATE", "phone": "PARTNERS", "stats": "PUBLIC", "matchHistory": "PUBLIC", "activityLog": "PRIVATE"}'::jsonb;

    -- Localização & Competição
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text DEFAULT 'PT';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS home_club text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS division text; 
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
-- [04] CLUBS
-- ============================================================================

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


-- ============================================================================
-- [05] PARTNERSHIPS
-- ============================================================================

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


-- ============================================================================
-- [06] RACKET BRANDS (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.racket_brands (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  logo_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.racket_brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Brands viewable by everyone" ON public.racket_brands;
CREATE POLICY "Brands viewable by everyone" ON public.racket_brands FOR SELECT USING ( true );

-- Populate Brands (Upsert to prevent duplicates)
INSERT INTO public.racket_brands (name, logo_url) VALUES
('ACA', 'https://ui-avatars.com/api/?name=ACA&background=10221e&color=25f4c0&size=64&font-size=0.4'),
('Acero Padel', 'https://ui-avatars.com/api/?name=AP&background=10221e&color=25f4c0&size=64'),
('Adidas', 'https://ui-avatars.com/api/?name=Adidas&background=000&color=fff&size=64&font-size=0.35'),
('Akkeron', 'https://ui-avatars.com/api/?name=Akkeron&background=10221e&color=25f4c0&size=64&font-size=0.3'),
('Alacran', 'https://ui-avatars.com/api/?name=AL&background=10221e&color=25f4c0&size=64'),
('Ares', 'https://ui-avatars.com/api/?name=Ares&background=10221e&color=25f4c0&size=64&font-size=0.4'),
('Babolat', 'https://ui-avatars.com/api/?name=Babolat&background=00AEEF&color=fff&size=64&font-size=0.3'),
('Beast Padel', 'https://ui-avatars.com/api/?name=Beast&background=10221e&color=25f4c0&size=64&font-size=0.35'),
('Black Crown', 'https://ui-avatars.com/api/?name=BC&background=111&color=fff&size=64'),
('Bonabola', 'https://ui-avatars.com/api/?name=BB&background=10221e&color=25f4c0&size=64'),
('Bullpadel', 'https://ui-avatars.com/api/?name=BP&background=E55300&color=fff&size=64'),
('Cabra', 'https://ui-avatars.com/api/?name=Cabra&background=10221e&color=25f4c0&size=64&font-size=0.4'),
('Cartri', 'https://ui-avatars.com/api/?name=Cartri&background=10221e&color=25f4c0&size=64&font-size=0.4'),
('Cork', 'https://ui-avatars.com/api/?name=Cork&background=10221e&color=25f4c0&size=64&font-size=0.4'),
('Donnay', 'https://ui-avatars.com/api/?name=Donnay&background=10221e&color=25f4c0&size=64&font-size=0.35'),
('Dopadel', 'https://ui-avatars.com/api/?name=DP&background=10221e&color=25f4c0&size=64'),
('Drop Shot', 'https://ui-avatars.com/api/?name=DS&background=000&color=FFD700&size=64'),
('Dunlop', 'https://ui-avatars.com/api/?name=Dunlop&background=000&color=FBEC5D&size=64&font-size=0.3'),
('Endless', 'https://ui-avatars.com/api/?name=Endless&background=10221e&color=25f4c0&size=64&font-size=0.3'),
('Enebe', 'https://ui-avatars.com/api/?name=NB&background=10221e&color=25f4c0&size=64'),
('Fila', 'https://ui-avatars.com/api/?name=Fila&background=00205B&color=E31D2B&size=64&font-size=0.4'),
('FZ Forza', 'https://ui-avatars.com/api/?name=FZ&background=10221e&color=25f4c0&size=64'),
('Goliat', 'https://ui-avatars.com/api/?name=Goliat&background=10221e&color=25f4c0&size=64&font-size=0.4'),
('Harlem', 'https://ui-avatars.com/api/?name=Harlem&background=10221e&color=25f4c0&size=64&font-size=0.35'),
('Head', 'https://ui-avatars.com/api/?name=Head&background=F60&color=fff&size=64&font-size=0.4'),
('Heroes', 'https://ui-avatars.com/api/?name=Heroes&background=10221e&color=25f4c0&size=64&font-size=0.35'),
('Hirostar', 'https://ui-avatars.com/api/?name=HS&background=10221e&color=25f4c0&size=64'),
('Impero Padel', 'https://ui-avatars.com/api/?name=Impero&background=10221e&color=25f4c0&size=64&font-size=0.35'),
('Jhayber', 'https://ui-avatars.com/api/?name=Jhayber&background=10221e&color=25f4c0&size=64&font-size=0.3'),
('Joma', 'https://ui-avatars.com/api/?name=Joma&background=10221e&color=25f4c0&size=64&font-size=0.4'),
('K Swiss', 'https://ui-avatars.com/api/?name=KS&background=10221e&color=25f4c0&size=64'),
('Kelme', 'https://ui-avatars.com/api/?name=Kelme&background=10221e&color=25f4c0&size=64&font-size=0.4'),
('Kombat', 'https://ui-avatars.com/api/?name=Kombat&background=10221e&color=25f4c0&size=64&font-size=0.35'),
('Kuikma', 'https://ui-avatars.com/api/?name=Kuikma&background=0066CC&color=fff&size=64&font-size=0.35'),
('Legend', 'https://ui-avatars.com/api/?name=Legend&background=10221e&color=25f4c0&size=64&font-size=0.35'),
('LOK', 'https://ui-avatars.com/api/?name=LOK&background=10221e&color=25f4c0&size=64&font-size=0.4'),
('Magnus Padel', 'https://ui-avatars.com/api/?name=Magnus&background=10221e&color=25f4c0&size=64&font-size=0.35'),
('Middlemoon', 'https://ui-avatars.com/api/?name=MM&background=10221e&color=25f4c0&size=64'),
('Nox', 'https://ui-avatars.com/api/?name=Nox&background=E60000&color=fff&size=64&font-size=0.4'),
('Osaka', 'https://ui-avatars.com/api/?name=Osaka&background=10221e&color=25f4c0&size=64&font-size=0.4'),
('Our Padel Story', 'https://ui-avatars.com/api/?name=OPS&background=10221e&color=25f4c0&size=64'),
('Oxdog', 'https://ui-avatars.com/api/?name=Oxdog&background=10221e&color=25f4c0&size=64&font-size=0.4'),
('Padel Force', 'https://ui-avatars.com/api/?name=PF&background=10221e&color=25f4c0&size=64'),
('Pallap', 'https://ui-avatars.com/api/?name=Pallap&background=10221e&color=25f4c0&size=64&font-size=0.4'),
('Prince', 'https://ui-avatars.com/api/?name=Prince&background=10221e&color=25f4c0&size=64&font-size=0.4'),
('Pro Kennex', 'https://ui-avatars.com/api/?name=PK&background=10221e&color=25f4c0&size=64'),
('PUMA', 'https://ui-avatars.com/api/?name=PUMA&background=000&color=fff&size=64&font-size=0.4'),
('Quad', 'https://ui-avatars.com/api/?name=Quad&background=10221e&color=25f4c0&size=64&font-size=0.4'),
('Raw', 'https://ui-avatars.com/api/?name=Raw&background=10221e&color=25f4c0&size=64&font-size=0.4'),
('Royal Padel', 'https://ui-avatars.com/api/?name=RP&background=444&color=fff&size=64'),
('RS', 'https://ui-avatars.com/api/?name=RS&background=10221e&color=25f4c0&size=64'),
('Salming', 'https://ui-avatars.com/api/?name=Salming&background=10221e&color=25f4c0&size=64&font-size=0.35'),
('Sane', 'https://ui-avatars.com/api/?name=Sane&background=10221e&color=25f4c0&size=64&font-size=0.4'),
('SET', 'https://ui-avatars.com/api/?name=SET&background=10221e&color=25f4c0&size=64&font-size=0.4'),
('Shooter', 'https://ui-avatars.com/api/?name=Shooter&background=10221e&color=25f4c0&size=64&font-size=0.35'),
('Side Spin', 'https://ui-avatars.com/api/?name=SS&background=10221e&color=25f4c0&size=64'),
('Siux', 'https://ui-avatars.com/api/?name=Siux&background=000&color=fff&size=64&font-size=0.4'),
('Skull Padel', 'https://ui-avatars.com/api/?name=Skull&background=10221e&color=25f4c0&size=64&font-size=0.4'),
('Slazenger', 'https://ui-avatars.com/api/?name=Slazenger&background=10221e&color=25f4c0&size=64&font-size=0.3'),
('Softee', 'https://ui-avatars.com/api/?name=Softee&background=10221e&color=25f4c0&size=64&font-size=0.4'),
('StarVie', 'https://ui-avatars.com/api/?name=SV&background=000&color=FFD700&size=64'),
('Stiga', 'https://ui-avatars.com/api/?name=Stiga&background=10221e&color=25f4c0&size=64&font-size=0.4'),
('Tactical Padel', 'https://ui-avatars.com/api/?name=TP&background=10221e&color=25f4c0&size=64'),
('Techton of Sweden', 'https://ui-avatars.com/api/?name=Techton&background=10221e&color=25f4c0&size=64&font-size=0.3'),
('Tecnifibre', 'https://ui-avatars.com/api/?name=Tecni&background=10221e&color=25f4c0&size=64&font-size=0.4'),
('Tenax Padel', 'https://ui-avatars.com/api/?name=Tenax&background=10221e&color=25f4c0&size=64&font-size=0.4'),
('Tretorn', 'https://ui-avatars.com/api/?name=Tretorn&background=10221e&color=25f4c0&size=64&font-size=0.35'),
('Vairo', 'https://ui-avatars.com/api/?name=Vairo&background=10221e&color=25f4c0&size=64&font-size=0.4'),
('Varlion', 'https://ui-avatars.com/api/?name=Varlion&background=FFCC00&color=000&size=64&font-size=0.35'),
('Vibor-A', 'https://ui-avatars.com/api/?name=VA&background=333&color=0F0&size=64'),
('Vidar of Båstad', 'https://ui-avatars.com/api/?name=Vidar&background=10221e&color=25f4c0&size=64&font-size=0.4'),
('Volt', 'https://ui-avatars.com/api/?name=Volt&background=10221e&color=25f4c0&size=64&font-size=0.4'),
('Wallich', 'https://ui-avatars.com/api/?name=Wallich&background=10221e&color=25f4c0&size=64&font-size=0.35'),
('Wilson', 'https://ui-avatars.com/api/?name=Wilson&background=C8102E&color=fff&size=64&font-size=0.4'),
('ZERV', 'https://ui-avatars.com/api/?name=ZERV&background=10221e&color=25f4c0&size=64&font-size=0.4')
ON CONFLICT (name) DO NOTHING;


-- ============================================================================
-- [07] TRIGGERS & FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url, privacy_settings)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', 'New Player'),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id,
    '{"email": "PRIVATE", "phone": "PARTNERS", "stats": "PUBLIC", "matchHistory": "PUBLIC", "activityLog": "PRIVATE"}'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ language 'plpgsql' security definer;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
