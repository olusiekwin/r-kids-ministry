-- Migration: Add user profile fields to users table
-- Run this in your Supabase SQL Editor

-- Add name field
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Add phone field
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add address field
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address TEXT;

-- Add status field (pending_password, active, suspended, inactive)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending_password';

-- Add profile_updated flag
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_updated BOOLEAN DEFAULT false;

-- Add invitation_token for password setup
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS invitation_token VARCHAR(255);

-- Add invitation_sent_at timestamp
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMP WITHOUT TIME ZONE;

-- Add password_set flag
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_set BOOLEAN DEFAULT false;

-- Add unique constraint for email per church (if not already exists)
-- Note: The schema shows UNIQUE(church_id, email) should be added
-- ALTER TABLE public.users ADD CONSTRAINT users_church_email_unique UNIQUE (church_id, email);

