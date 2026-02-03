
/* 
  -----------------------------------------------------------------------------
  PADEL PRO MANAGER - MASTER DATABASE SCHEMA
  -----------------------------------------------------------------------------
  
  Como usar:
  1. Copie todo o conteúdo deste ficheiro.
  2. Cole no SQL Editor do Supabase.
  3. Execute (Run).

  Estrutura:
  [01] PROFILES ........ Perfil do utilizador (ligado ao auth.users)
  [02] TRAINING LOGS ... Registos de treino
  [03] JOIN REQUESTS ... Pedidos para entrar em jogos
  [04] TRIGGERS ........ Automações (ex: criar perfil ao registar, updated_at)
*/

-- ============================================================================
-- [01] PROFILES
-- Tabela pública que estende os dados do auth.users
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text,
  name text,                        -- Nome completo (Display Name)
  
  -- Campos de Identidade
  first_name text,
  last_name text,
  nickname text,
  phone text,
  avatar_url text,
  
  -- Campos Físicos e Técnicos
  birth_date date,
  gender text CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
  height integer,                   -- em cm
  weight numeric,                   -- em kg
  hand text CHECK (hand IN ('RIGHT', 'LEFT')),
  court_position text CHECK (court_position IN ('LEFT', 'RIGHT', 'BOTH')),
  racket_brand text,
  
  -- Campos de Jogo (SaaS Features)
  skill_level numeric DEFAULT 3.5,
  role text DEFAULT 'PLAYER',       -- PLAYER, ORGANIZER, ADMIN
  location text DEFAULT 'Unknown',
  
  -- Metadados
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- RLS (Row Level Security) para Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política 1: Todos podem ver perfis (necessário para rankings e discovery)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING ( true );

-- Política 2: O utilizador só pode inserir o seu próprio perfil
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK ( auth.uid() = id );

-- Política 3: O utilizador só pode editar o seu próprio perfil
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING ( auth.uid() = id );


-- ============================================================================
-- [02] TRAINING LOGS
-- Registos de exercícios e treinos dos utilizadores
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.training_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  exercise_id text NOT NULL,        -- ID do exercício (local ou db)
  duration integer NOT NULL,        -- Minutos
  rpe integer,                      -- Esforço 1-10
  notes text,
  
  completed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS para Training Logs
ALTER TABLE public.training_logs ENABLE ROW LEVEL SECURITY;

-- Política: Utilizadores só veem e criam os seus próprios logs
CREATE POLICY "Users can CRUD own training logs" 
ON public.training_logs FOR ALL 
USING ( auth.uid() = user_id );


-- ============================================================================
-- [03] JOIN REQUESTS
-- Pedidos para participar em eventos/jogos
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.join_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text NOT NULL,           -- ID do evento (pode virar FK se tiveres tabela events)
  requester_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'DECLINED')),
  message text,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- RLS para Join Requests
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ver pedidos (ou restringe se preferires)
CREATE POLICY "Requests viewable by participants" 
ON public.join_requests FOR SELECT 
USING ( true );

-- Política: Apenas utilizadores autenticados criam pedidos
CREATE POLICY "Auth users can create requests" 
ON public.join_requests FOR INSERT 
WITH CHECK ( auth.role() = 'authenticated' );

-- Política: Apenas o dono do pedido ou organizador podem atualizar (simplificado aqui)
CREATE POLICY "Users update own requests" 
ON public.join_requests FOR UPDATE 
USING ( true ); -- Nota: Em produção, restringe isto melhor


-- ============================================================================
-- [04] FUNCTIONS & TRIGGERS
-- Automação da base de dados
-- ============================================================================

-- Função: Atualizar o campo 'updated_at' automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger: Profiles
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated 
BEFORE UPDATE ON public.profiles 
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();


-- Função: Criar Perfil automaticamente ao fazer Sign Up (Auth -> Public)
-- Isto é crucial para que não tenhas erros de "Profile not found" em novos users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', 'New Player'),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id
  );
  RETURN new;
END;
$$ language 'plpgsql' security definer;

-- Trigger: Auth Users (Executa sempre que um utilizador é criado no Supabase Auth)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
AFTER INSERT ON auth.users 
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

