-- Migration: create confirmed_bookings table for storing user bookings (pending and confirmed)
-- Timestamped file name: 20251207_create_confirmed_bookings.sql

-- 1) Create confirmed_bookings table
CREATE TABLE IF NOT EXISTS public.confirmed_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  itinerary_title TEXT NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  itinerary_data JSONB,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed')) DEFAULT 'pending',
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid')) DEFAULT 'pending',
  transaction_id TEXT,
  card_last_four TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.confirmed_bookings ENABLE ROW LEVEL SECURITY;

-- 2) Create indexes for faster queries
CREATE INDEX idx_confirmed_bookings_user_id ON public.confirmed_bookings(user_id);
CREATE INDEX idx_confirmed_bookings_status ON public.confirmed_bookings(status);
CREATE INDEX idx_confirmed_bookings_user_status ON public.confirmed_bookings(user_id, status);

-- 3) RLS policies: users can select/insert/update/delete their own bookings
CREATE POLICY "Confirmed bookings: users can select their own bookings"
ON public.confirmed_bookings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Confirmed bookings: users can insert their own bookings"
ON public.confirmed_bookings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Confirmed bookings: users can update their own bookings"
ON public.confirmed_bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Confirmed bookings: users can delete their own bookings"
ON public.confirmed_bookings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4) Admins can manage all bookings (requires public.has_role function from migrations)
CREATE POLICY "Confirmed bookings: admins can manage all bookings"
ON public.confirmed_bookings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
