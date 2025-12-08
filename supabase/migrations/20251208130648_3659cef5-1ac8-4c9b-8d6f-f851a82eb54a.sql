-- Add initial contribution column to track contribution before joining the system
ALTER TABLE public.family_members 
ADD COLUMN initial_contribution numeric NOT NULL DEFAULT 0;