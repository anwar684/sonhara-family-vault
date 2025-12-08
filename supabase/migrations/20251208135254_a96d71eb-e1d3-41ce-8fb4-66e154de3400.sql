-- Add separate joining dates for Takaful and Plus funds
ALTER TABLE public.family_members 
ADD COLUMN takaful_joined_date date DEFAULT CURRENT_DATE,
ADD COLUMN plus_joined_date date DEFAULT CURRENT_DATE;

-- Update existing records to use the current joined_date for both
UPDATE public.family_members 
SET takaful_joined_date = joined_date, plus_joined_date = joined_date;