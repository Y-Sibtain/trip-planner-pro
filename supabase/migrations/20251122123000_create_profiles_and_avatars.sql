-- Migration: create profiles table + storage bucket (avatars) + RLS policies
-- Timestamped file name: 20251122123000_create_profiles_and_avatars.sql

-- 1) Create profiles table (one-to-one with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  location TEXT,
  preferences JSONB DEFAULT '{}'::jsonb, -- store budget range, preferred destinations, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2) RLS policies: users can select/insert/update/delete their own profile
CREATE POLICY "Profiles: users can select their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id AND deleted_at IS NULL);

CREATE POLICY "Profiles: users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles: users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id AND deleted_at IS NULL)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles: users can delete (soft) their own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- 3) Admins can manage all profiles (requires public.has_role function from repo migrations)
CREATE POLICY "Profiles: admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) Create a storage bucket for avatars (note: storage bucket creation is usually done via dashboard/CLI)
-- Instruction: Create a storage bucket named "avatars" via Supabase dashboard or CLI.
-- Recommended bucket settings:
-- - Name: avatars
-- - Public: false (recommended). Use signed URLs to serve images.

-- 5) Trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Notes:
-- - After applying this migration, create the "avatars" storage bucket in the Supabase dashboard (or via Storage API/CLI).
-- - The profiles table uses auth.users.id as its primary key for a 1:1 relationship.
-- - RLS policies ensure only the owner (auth.uid()) or admins (using public.has_role) can operate on profiles.