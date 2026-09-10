-- ==============================================================================
-- CADSHIELD - SUPABASE PROFILES TABLE & ROW LEVEL SECURITY (RLS) SETUP
-- Run this script in your Supabase Project -> SQL Editor
-- ==============================================================================

-- 1. Create the 'profiles' table if it doesn't already exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'user' NOT NULL,
  phone TEXT,
  profile_photo TEXT,
  college_company TEXT,
  department TEXT,
  designation TEXT,
  location TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Ensure non-sensitive columns exist even if the table already existed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user' NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_id') THEN
    ALTER TABLE public.profiles ADD COLUMN user_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'name') THEN
    ALTER TABLE public.profiles ADD COLUMN name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE public.profiles ADD COLUMN phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'profile_photo') THEN
    ALTER TABLE public.profiles ADD COLUMN profile_photo TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
    ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;
  END IF;
END $$;

-- 2. Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 2. Create the 'models' table for 3D CAD files metadata
CREATE TABLE IF NOT EXISTS public.models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  original_filename TEXT,
  file_format TEXT,
  owner_id TEXT,
  designer_name TEXT,
  model_id_str TEXT,
  copyright_info TEXT,
  original_file_path TEXT,
  watermarked_file_path TEXT,
  integrity_score NUMERIC DEFAULT 100.0,
  distortion_percentage NUMERIC DEFAULT 0.0,
  vertex_count INTEGER DEFAULT 0,
  face_count INTEGER DEFAULT 0,
  processing_time NUMERIC DEFAULT 0.0,
  status TEXT DEFAULT 'uploaded',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_models_owner_id ON public.models(owner_id);
CREATE INDEX IF NOT EXISTS idx_models_status ON public.models(status);
CREATE INDEX IF NOT EXISTS idx_models_created_at ON public.models(created_at);

-- 3. Create the 'verifications' table for authentication audit logs
CREATE TABLE IF NOT EXISTS public.verifications (
  id TEXT PRIMARY KEY,
  model_db_id TEXT REFERENCES public.models(id) ON DELETE SET NULL,
  verified_filename TEXT,
  is_authenticated BOOLEAN DEFAULT true,
  is_tampered BOOLEAN DEFAULT false,
  owner_id_found TEXT,
  designer_found TEXT,
  model_id_found TEXT,
  watermark_timestamp TEXT,
  integrity_score NUMERIC DEFAULT 100.0,
  tampering_percentage NUMERIC DEFAULT 0.0,
  confidence_score NUMERIC DEFAULT 100.0,
  vertex_changes INTEGER DEFAULT 0,
  face_changes INTEGER DEFAULT 0,
  details JSONB,
  verified_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_verifications_model_id ON public.verifications(model_db_id);
CREATE INDEX IF NOT EXISTS idx_verifications_is_tampered ON public.verifications(is_tampered);
CREATE INDEX IF NOT EXISTS idx_verifications_verified_at ON public.verifications(verified_at);

-- 4. Security Definer Helper Function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 5. Helper Function: Pre-login lookup for username/Owner ID to email
CREATE OR REPLACE FUNCTION public.get_email_for_login(identifier TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_email TEXT;
BEGIN
  SELECT email INTO resolved_email
  FROM public.profiles
  WHERE lower(user_id) = lower(identifier) 
     OR lower(name) = lower(identifier)
     OR lower(email) = lower(identifier)
  LIMIT 1;
  RETURN resolved_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_email_for_login(TEXT) TO anon, authenticated;

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

-- Clean existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can read own profile or admin read all" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admin update all" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile or admin delete all" ON public.profiles;
DROP POLICY IF EXISTS "Allow username lookup for login" ON public.profiles;

DROP POLICY IF EXISTS "Allow authenticated read models" ON public.models;
DROP POLICY IF EXISTS "Allow authenticated insert models" ON public.models;
DROP POLICY IF EXISTS "Allow owner or admin update models" ON public.models;
DROP POLICY IF EXISTS "Allow owner or admin delete models" ON public.models;

DROP POLICY IF EXISTS "Allow authenticated read verifications" ON public.verifications;
DROP POLICY IF EXISTS "Allow authenticated insert verifications" ON public.verifications;

-- (A) PROFILES RLS:
-- Normal users can only view their own profile. Admins can view all profiles.
CREATE POLICY "Users can read own profile or admin read all"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR public.is_admin()
  );

-- Pre-login lookup policy: allow anon to read email & user_id for login resolution
CREATE POLICY "Allow username lookup for login"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (true);

-- Authenticated users can insert their own initial profile on registration
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
  );

-- Users can update their own profile; Admins can update any profile
CREATE POLICY "Users can update own profile or admin update all"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = id OR public.is_admin()
  );

-- (B) MODELS RLS:
CREATE POLICY "Allow authenticated read models"
  ON public.models
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert models"
  ON public.models
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow owner or admin update models"
  ON public.models
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow owner or admin delete models"
  ON public.models
  FOR DELETE
  TO authenticated
  USING (true);

-- (C) VERIFICATIONS RLS:
CREATE POLICY "Allow authenticated read verifications"
  ON public.verifications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert verifications"
  ON public.verifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 7. Trigger to automatically populate 'profiles' when a user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    user_id,
    name,
    email,
    role,
    college_company,
    phone,
    created_at
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'user_id',
      NEW.raw_user_meta_data->>'owner_id',
      'OWN-' || upper(substring(replace(NEW.id::text, '-', '') from 1 for 4)) || '-' || upper(substring(replace(NEW.id::text, '-', '') from 5 for 4))
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.raw_user_meta_data->>'college_company',
    NEW.raw_user_meta_data->>'phone',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    role = COALESCE(profiles.role, EXCLUDED.role);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 8. DEDICATED ADMIN ACCOUNT SETUP & PROFILE SEED
-- ==============================================================================
-- Auto-confirm the admin email in auth.users so no email verification is needed:
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'mailtosanjaysp@gmail.com';

-- Ensure the admin profile is populated with role = 'admin' and user_id = 'Admin@123'
INSERT INTO public.profiles (
  id,
  user_id,
  name,
  email,
  role,
  created_at
)
SELECT
  id,
  'Admin@123',
  'System Administrator',
  'mailtosanjaysp@gmail.com',
  'admin',
  NOW()
FROM auth.users
WHERE email = 'mailtosanjaysp@gmail.com'
ON CONFLICT (id) DO UPDATE
SET
  role = 'admin',
  user_id = 'Admin@123',
  name = 'System Administrator';

-- ==============================================================================
-- 9. CONFIGURATION INSTRUCTION FOR PURE EMAIL + PASSWORD AUTHENTICATION:
--
-- In your Supabase Dashboard:
-- 1. Go to: Authentication -> Providers -> Email
-- 2. Toggle "Confirm email" to OFF.
--    (This disables email confirmation requirements so users and admins can log in immediately with their password).
-- ==============================================================================
