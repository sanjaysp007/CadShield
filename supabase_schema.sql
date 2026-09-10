-- ==============================================================================
-- CADSHIELD - DATABASE SCHEMA, AUTO-ACTIVATION & 3-TIER ROLE SECURITY (RLS) SETUP
-- Run this script in your Supabase Project -> SQL Editor
-- ==============================================================================

-- ==============================================================================
-- 0. AUTOMATIC USER CONFIRMATION & DIRECT REGISTRATION
-- Every new user is automatically confirmed immediately on registration.
-- No manual approval, no OTP, no admin confirmation required!
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_new_user();

-- Auto-confirm any existing unconfirmed accounts
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- ==============================================================================
-- 1. PROFILES TABLE (3 ROLES: 'main_admin', 'admin', 'user')
-- ==============================================================================
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

-- Ensure non-sensitive columns exist if the table already existed
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

-- Drop old check constraint if present and enforce 3-tier roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_profiles_role;
ALTER TABLE public.profiles ADD CONSTRAINT chk_profiles_role CHECK (role IN ('main_admin', 'admin', 'user'));

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 2. Create the 'models' table for 3D CAD files metadata with strict user ownership
CREATE TABLE IF NOT EXISTS public.models (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Ensure user_id and is_public columns exist if table was already created
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Backfill user_id on existing models from profiles if null
UPDATE public.models m
SET user_id = p.id
FROM public.profiles p
WHERE m.user_id IS NULL AND (m.owner_id = p.user_id OR m.owner_id = p.id::text);

CREATE INDEX IF NOT EXISTS idx_models_user_id ON public.models(user_id);
CREATE INDEX IF NOT EXISTS idx_models_owner_id ON public.models(owner_id);
CREATE INDEX IF NOT EXISTS idx_models_is_public ON public.models(is_public);
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

-- 4. Helper Functions: Role Verification
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'main_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_main_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'main_admin'
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

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_main_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_for_login(TEXT) TO anon, authenticated;

-- ==============================================================================
-- 6. TRIGGER: STRICT MAIN ADMIN & ROLE INTEGRITY PROTECTION
-- Prevents any user or admin from demoting or altering the Main Admin.
-- Only Main Admin can promote or demote other users to/from admin.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.protect_profiles_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent modifying or demoting the Main Administrator under any circumstance
  IF OLD.role = 'main_admin' AND NEW.role <> 'main_admin' THEN
    RAISE EXCEPTION 'The Main Administrator is protected and cannot be demoted.';
  END IF;

  -- Prevent assigning main_admin to any other account
  IF OLD.role <> 'main_admin' AND NEW.role = 'main_admin' THEN
    RAISE EXCEPTION 'Cannot assign main_admin role. Only one Main Administrator is permitted.';
  END IF;

  -- If the role is being changed, ensure caller is the Main Admin
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT public.is_main_admin() THEN
      RAISE EXCEPTION 'Only the Main Administrator can promote or demote user roles.';
    END IF;
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profiles_role ON public.profiles;
CREATE TRIGGER trg_protect_profiles_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profiles_role();

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
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
DROP POLICY IF EXISTS "Models select policy" ON public.models;
DROP POLICY IF EXISTS "Models insert policy" ON public.models;
DROP POLICY IF EXISTS "Models update policy" ON public.models;
DROP POLICY IF EXISTS "Models delete policy" ON public.models;

DROP POLICY IF EXISTS "Allow authenticated read verifications" ON public.verifications;
DROP POLICY IF EXISTS "Allow authenticated insert verifications" ON public.verifications;

-- Normal users can view profiles (for creator info, project credits); Admins & Main Admin have full access
CREATE POLICY "Users can read profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Pre-login lookup policy: allow anon to read email & user_id for login resolution
CREATE POLICY "Allow username lookup for login"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (true);

-- Authenticated users can insert their initial profile (defaults to role = 'user')
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
  );

-- Users can update their own profile; Main Admin can update any profile (role protected by trigger)
CREATE POLICY "Users can update own profile or admin update all"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR public.is_main_admin()
  )
  WITH CHECK (
    auth.uid() = id OR public.is_main_admin()
  );

-- (B) MODELS RLS:
-- 1. Users can only select their own models (user_id = auth.uid()), public models, or admins can select all
CREATE POLICY "Models select policy"
  ON public.models
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR is_public = true 
    OR public.is_admin()
  );

-- 2. Users can only insert models where user_id matches auth.uid()
CREATE POLICY "Models insert policy"
  ON public.models
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );

-- 3. Users can only update their own models (user_id = auth.uid()); admins can update all
CREATE POLICY "Models update policy"
  ON public.models
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = user_id OR public.is_admin()
  );

-- 4. Users can only delete their own models (user_id = auth.uid()); admins can delete all
CREATE POLICY "Models delete policy"
  ON public.models
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR public.is_admin()
  );

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

-- ==============================================================================
-- 8. TRIGGER: Automatically populate 'profiles' when a user signs up in Supabase Auth
-- Every new user automatically receives role = 'user'
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role TEXT;
BEGIN
  -- Protect Main Admin email: auto-assign 'main_admin' if it matches main admin
  IF lower(NEW.email) = 'mailtosanjaysp@gmail.com' THEN
    assigned_role := 'main_admin';
  ELSE
    assigned_role := 'user';
  END IF;

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
    assigned_role,
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
-- 9. DEDICATED MAIN ADMIN SETUP & PROFILE SEED
-- ==============================================================================
-- Auto-confirm the Main Admin email so no email verification is needed:
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'mailtosanjaysp@gmail.com';

-- Ensure the Main Admin profile has role = 'main_admin' and user_id = 'Admin@123'
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
  'main_admin',
  NOW()
FROM auth.users
WHERE email = 'mailtosanjaysp@gmail.com'
ON CONFLICT (id) DO UPDATE
SET
  role = 'main_admin',
  user_id = 'Admin@123',
  name = 'System Administrator';

-- ==============================================================================
-- 10. DIRECT ACCESS CONFIGURATION:
--
-- With the auto-confirm trigger in Section 0:
-- - Every newly registered user is automatically confirmed and active.
-- - No manual approval in Supabase is needed.
-- - Direct flow: Register -> Account Created -> Login -> Dashboard.
-- ==============================================================================

-- ==============================================================================
-- 11. NOTIFICATIONS TABLE & CADSHIELD TEAM COMMUNICATIONS:
-- Admins can reach out to users with notifications regarding their CAD projects.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id TEXT NOT NULL,
  recipient_email TEXT,
  recipient_name TEXT,
  sender_name TEXT DEFAULT 'CadShield Team',
  sender_email TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  project_id TEXT,
  project_name TEXT,
  type TEXT DEFAULT 'advisory', -- advisory, security, compliance, general
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_email ON public.notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_notifications_project_id ON public.notifications(project_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
