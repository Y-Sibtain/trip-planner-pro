-- Migration: add destination_type enum, type column to destinations, and helpful indexes
-- Timestamped file name: 20251124180000_add_destination_type_and_indexes.sql

-- 1) Create enum for destination types (categories)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'destination_type') THEN
    CREATE TYPE public.destination_type AS ENUM (
      'adventure',
      'cultural',
      'relaxation',
      'family',
      'romance',
      'business'
    );
  END IF;
END$$;

-- 2) Add 'type' column to destinations (nullable so existing rows remain valid)
ALTER TABLE public.destinations
  ADD COLUMN IF NOT EXISTS type public.destination_type;

-- 3) Add indexes for faster filtering/search by base_price and country
CREATE INDEX IF NOT EXISTS idx_destinations_base_price ON public.destinations (base_price);
CREATE INDEX IF NOT EXISTS idx_destinations_country ON public.destinations (country);

-- 4) (Optional) Backfill a default type for rows where type is NULL using a heuristic:
-- If highlights contain 'beach' or 'relax' => relaxation; if 'hike','trek' => adventure; else cultural
-- This is best-effort and can be removed/adjusted as required.
UPDATE public.destinations
SET type = COALESCE(
  type,
  CASE
    WHEN (highlights::text ILIKE '%beach%' OR highlights::text ILIKE '%relax%') THEN 'relaxation'
    WHEN (highlights::text ILIKE '%hike%' OR highlights::text ILIKE '%trek%' OR name ILIKE '%mountain%') THEN 'adventure'
    ELSE 'cultural'
  END
)::public.destination_type
WHERE type IS NULL;

-- Notes:
-- - After running this migration, the frontend can filter destinations by 'type' and country, and use base_price for cost filters.
-- - If you prefer not to create the enum, you may instead add a TEXT column. Using an enum provides stricter values.