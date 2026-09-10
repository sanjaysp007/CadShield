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

-- 3. Security Definer Helper Function to check if the current user is an admin
-- Using a SECURITY DEFINER function avoids recursive policy evaluation
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

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can read own profile or admin read all" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admin update all" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile or admin delete all" ON public.profiles;

-- 6. Row Level Security Policies:
-- (A) Normal users can ONLY view their own profile. Admins can view ALL user profiles.
CREATE POLICY "Users can read own profile or admin read all"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR public.is_admin()
  );

-- (B) Authenticated users can insert their own initial profile on registration
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
  );

-- (C) Users can update their own profile; Admins can update any profile
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
    NEW.raw_user_meta_data->>'phone',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 8. HOW TO MAKE A USER AN ADMIN:
-- Replace with the email address of the administrator:
--
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'YOUR_EMAIL@EXAMPLE.COM';
-- ==============================================================================

-- ==============================================================================
-- 9. SUPABASE EMAIL OTP TEMPLATES CONFIGURATION (NO CLICKABLE / MAGIC LINKS)
--
-- In your Supabase Dashboard:
-- Go to: Authentication -> Email Templates
--
-- A) "Confirm signup" Template:
--    Subject: {{ .Token }} is your CADShield verification code
--    Body (HTML):
--    -------------------------------------------------------------------------
--    <div style="font-family: Arial, sans-serif; background-color: #04060f; color: #f0f4ff; padding: 40px 20px; text-align: center;">
--      <div style="max-width: 480px; margin: 0 auto; background: #0b0f1e; border: 1px solid rgba(0, 229, 255, 0.3); border-radius: 20px; padding: 32px;">
--        <h1 style="color: #00e5ff; font-size: 24px; margin-bottom: 8px;">CADShield</h1>
--        <h2 style="font-size: 18px; color: #f0f4ff; margin-bottom: 16px;">Verify Your Email Address</h2>
--        <p style="color: #8892a4; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
--          Enter this 6-digit verification code to complete your CADShield registration:
--        </p>
--        <div style="background: rgba(0, 229, 255, 0.08); border: 2px dashed #00e5ff; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
--          <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #00e5ff;">{{ .Token }}</span>
--        </div>
--        <p style="color: #6b7a8d; font-size: 12px; margin: 0;">
--          This code expires in 10 minutes. Do not share this code with anyone.
--        </p>
--      </div>
--    </div>
--    -------------------------------------------------------------------------
--
-- B) "Reset Password" Template:
--    Subject: {{ .Token }} is your CADShield password reset code
--    Body (HTML):
--    -------------------------------------------------------------------------
--    <div style="font-family: Arial, sans-serif; background-color: #04060f; color: #f0f4ff; padding: 40px 20px; text-align: center;">
--      <div style="max-width: 480px; margin: 0 auto; background: #0b0f1e; border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 20px; padding: 32px;">
--        <h1 style="color: #00e5ff; font-size: 24px; margin-bottom: 8px;">CADShield</h1>
--        <h2 style="font-size: 18px; color: #f0f4ff; margin-bottom: 16px;">Reset Your Password</h2>
--        <p style="color: #8892a4; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
--          Enter this 6-digit verification code to reset your CADShield password:
--        </p>
--        <div style="background: rgba(139, 92, 246, 0.08); border: 2px dashed #a78bfa; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
--          <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #a78bfa;">{{ .Token }}</span>
--        </div>
--        <p style="color: #6b7a8d; font-size: 12px; margin: 0;">
--          This code expires in 10 minutes. If you did not request this, please ignore this email.
--        </p>
--      </div>
--    </div>
--    -------------------------------------------------------------------------
--
-- IMPORTANT: Make sure there are NO "{{ .ConfirmationURL }}" tags in the templates above!
-- Using "{{ .Token }}" sends strictly the 6-digit OTP code with NO magic/clickable links.
-- ==============================================================================
