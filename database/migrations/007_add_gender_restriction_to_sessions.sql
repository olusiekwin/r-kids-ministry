-- Migration: Add gender_restriction to sessions table
-- Purpose: Allow sessions to be restricted to specific genders (Male/Female only)

ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS gender_restriction VARCHAR(20) CHECK (gender_restriction IN ('Male', 'Female', NULL));

COMMENT ON COLUMN sessions.gender_restriction IS 'Optional gender restriction for session (Male/Female only)';

