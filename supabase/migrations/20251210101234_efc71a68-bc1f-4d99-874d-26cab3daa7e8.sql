-- Add columns for old member historical data entry
ALTER TABLE public.family_members 
ADD COLUMN IF NOT EXISTS takaful_paid_before_entry numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS takaful_pending_before_entry numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS plus_paid_before_entry numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS plus_pending_before_entry numeric DEFAULT 0;