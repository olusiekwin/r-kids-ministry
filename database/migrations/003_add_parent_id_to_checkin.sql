-- Migration: Add Parent ID Support to Check-In Records
-- Purpose: Enable check-in/check-out using Parent ID (RS073, RS074, etc.) instead of just OTP/QR
-- Date: Current

-- Add parent_id column to store the Parent ID (e.g., RS073) for reference
ALTER TABLE public.check_in_records 
ADD COLUMN IF NOT EXISTS parent_id VARCHAR(50);

-- Update method check constraint to include 'PARENT_ID' as a valid method
ALTER TABLE public.check_in_records 
DROP CONSTRAINT IF EXISTS check_in_records_method_check;

ALTER TABLE public.check_in_records 
ADD CONSTRAINT check_in_records_method_check 
CHECK (method IN ('QR', 'OTP', 'PARENT_ID'));

-- Add index on parent_id for faster lookups when searching by Parent ID
CREATE INDEX IF NOT EXISTS idx_check_in_records_parent_id 
ON public.check_in_records(parent_id);

-- Add comment to document the new column
COMMENT ON COLUMN public.check_in_records.parent_id IS 'Parent ID (e.g., RS073) used for check-in/check-out verification when method is PARENT_ID';

