-- Add user consent column and example RLS policies to protect profiles.
-- Safe to re-run.

-- 1) Add consent_to_matching column if missing (default false so explicit consent is needed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'consent_to_matching'
  ) THEN
    ALTER TABLE profiles ADD COLUMN consent_to_matching boolean DEFAULT false;
  END IF;
END
$$;

-- 2) Enable Row Level Security on profiles (safe to run even if already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3) Policy: allow selecting other profiles only when they consent
-- This allows selection of profiles where consent_to_matching = true.
-- It also allows selecting your own profile (id = auth.uid()) so users can view their own data regardless of consent.
DROP POLICY IF EXISTS "select_profiles_with_consent" ON profiles;
CREATE POLICY "select_profiles_with_consent" ON profiles
  FOR SELECT
  USING (consent_to_matching = true OR id = auth.uid());

-- 4) Policy: allow users to update only their own consent flag (and other fields on their own row)
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 5) Policy: allow insert for authenticated users (basic example)
DROP POLICY IF EXISTS "insert_profile_authenticated" ON profiles;
CREATE POLICY "insert_profile_authenticated" ON profiles
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Note: service_role bypasses RLS automatically. Adjust policies for your security model.
