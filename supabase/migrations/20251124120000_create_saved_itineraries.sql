-- Migration: create saved_itineraries table + RLS policies + updated_at trigger
-- Timestamped file name: 20251124120000_create_saved_itineraries.sql

-- 1) Create saved_itineraries table
CREATE TABLE IF NOT EXISTS public.saved_itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  plan JSONB NOT NULL, -- full generated itinerary payload
  total_price NUMERIC(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.saved_itineraries ENABLE ROW LEVEL SECURITY;

-- 2) RLS policies: owners can select/insert/update/delete their own itineraries
CREATE POLICY "Saved itineraries: owners can select their own itineraries"
ON public.saved_itineraries
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Saved itineraries: owners can insert their own itineraries"
ON public.saved_itineraries
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Saved itineraries: owners can update their own itineraries"
ON public.saved_itineraries
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Saved itineraries: owners can delete their own itineraries"
ON public.saved_itineraries
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- 3) Admins can manage all saved itineraries (requires public.has_role function from migrations)
CREATE POLICY "Saved itineraries: admins can manage all itineraries"
ON public.saved_itineraries
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) Trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_saved_itineraries_updated_at ON public.saved_itineraries;
CREATE TRIGGER set_saved_itineraries_updated_at
BEFORE UPDATE ON public.saved_itineraries
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Notes:
-- - After applying this migration, RLS enforces that only the owner (or admins) can access saved itineraries.
-- - The plan column stores the full generated itinerary JSON produced by the app (day-by-day, totals).