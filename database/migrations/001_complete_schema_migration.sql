-- ============================================
-- R-KIDS Complete Database Migration
-- ============================================
-- This migration includes all schema updates and enhancements
-- Run this in your Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: User Profile Fields
-- ============================================
-- Add user profile fields to users table

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending_password';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_updated BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS invitation_token VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_set BOOLEAN DEFAULT false;

-- ============================================
-- PART 2: Sessions and Session Bookings
-- ============================================
-- Add sessions/events table for managing Sunday sessions and special events

CREATE TABLE IF NOT EXISTS sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(church_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    session_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    group_id UUID REFERENCES groups(group_id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    session_type VARCHAR(50) NOT NULL DEFAULT 'Regular' CHECK (session_type IN ('Regular', 'Special Event', 'Holiday', 'Outing')),
    location VARCHAR(255),
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(100),
    gender_restriction VARCHAR(20) CHECK (gender_restriction IN ('Male', 'Female', NULL)),
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'ended', 'cancelled')),
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(church_id, title, session_date, start_time)
);

COMMENT ON COLUMN sessions.status IS 'Session status: scheduled, active, ended, or cancelled';
COMMENT ON COLUMN sessions.started_at IS 'Timestamp when session was started';
COMMENT ON COLUMN sessions.ended_at IS 'Timestamp when session was ended';

COMMENT ON COLUMN sessions.gender_restriction IS 'Optional gender restriction for session (Male/Female only)';

-- Session Bookings (parent books child for a session)
CREATE TABLE IF NOT EXISTS session_bookings (
    booking_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(child_id) ON DELETE CASCADE,
    guardian_id UUID REFERENCES guardians(guardian_id) ON DELETE SET NULL,
    qr_code VARCHAR(500),
    otp_code VARCHAR(10),
    status VARCHAR(50) DEFAULT 'booked' CHECK (status IN ('booked', 'checked_in', 'checked_out', 'cancelled')),
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checked_in_at TIMESTAMP,
    checked_out_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, child_id)
);

-- Add session_id and booking_id to check_in_records
ALTER TABLE check_in_records 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(session_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES session_bookings(booking_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS parent_id VARCHAR(50);

-- Update method check constraint to include 'PARENT_ID' as a valid method
ALTER TABLE check_in_records 
DROP CONSTRAINT IF EXISTS check_in_records_method_check;

ALTER TABLE check_in_records 
ADD CONSTRAINT check_in_records_method_check 
CHECK (method IN ('QR', 'OTP', 'PARENT_ID', 'manual'));

COMMENT ON COLUMN check_in_records.parent_id IS 'Parent ID (e.g., RS073) used for check-in/check-out verification when method is PARENT_ID';

-- ============================================
-- PART 3: Super Admin Role
-- ============================================
-- Update the role constraint to include SuperAdmin

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('Admin', 'SuperAdmin', 'Teacher', 'Parent', 'Teen'));

-- ============================================
-- PART 4: Notifications Table Updates
-- ============================================
-- Update notifications table to support all CRUD operations

ALTER TABLE notifications 
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'CheckIn', 'CheckOut', 'Birthday', 'Reminder', 'OTP',
    'ChildCreated', 'ChildApproved', 'ChildRejected', 'ChildUpdated',
    'UserCreated', 'UserUpdated', 'UserSuspended', 'UserActivated', 'UserDeleted',
    'SessionCreated', 'SessionUpdated', 'SessionDeleted',
    'GroupAssigned', 'GroupUpdated'
  ));

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- ============================================
-- PART 5: Validation Constraints
-- ============================================
-- Add validation constraints to prevent duplicates and ensure data integrity

-- Clean up duplicate emails and phones before creating unique indexes
DO $$
DECLARE
    dup_email_group RECORD;
    dup_email_record RECORD;
    dup_phone_group RECORD;
    dup_phone_record RECORD;
    counter INTEGER;
BEGIN
    -- Handle duplicate emails
    FOR dup_email_group IN 
        SELECT church_id, email, COUNT(*) as cnt
        FROM guardians
        WHERE email IS NOT NULL AND email != ''
        GROUP BY church_id, email
        HAVING COUNT(*) > 1
    LOOP
        counter := 0;
        FOR dup_email_record IN 
            SELECT guardian_id, email
            FROM guardians
            WHERE church_id = dup_email_group.church_id
              AND email = dup_email_group.email
              AND email IS NOT NULL
              AND email != ''
            ORDER BY created_at ASC
        LOOP
            IF counter > 0 THEN
                UPDATE guardians SET email = NULL WHERE guardian_id = dup_email_record.guardian_id;
            END IF;
            counter := counter + 1;
        END LOOP;
    END LOOP;

    -- Handle duplicate phones
    FOR dup_phone_group IN 
        SELECT church_id, phone, COUNT(*) as cnt
        FROM guardians
        WHERE phone IS NOT NULL AND phone != ''
        GROUP BY church_id, phone
        HAVING COUNT(*) > 1
    LOOP
        counter := 0;
        FOR dup_phone_record IN 
            SELECT guardian_id, phone
            FROM guardians
            WHERE church_id = dup_phone_group.church_id
              AND phone = dup_phone_group.phone
              AND phone IS NOT NULL
              AND phone != ''
            ORDER BY created_at ASC
        LOOP
            IF counter > 0 THEN
                UPDATE guardians SET phone = NULL WHERE guardian_id = dup_phone_record.guardian_id;
            END IF;
            counter := counter + 1;
        END LOOP;
    END LOOP;
END $$;

-- Add unique constraints
DROP INDEX IF EXISTS guardians_church_email_unique;
DROP INDEX IF EXISTS guardians_church_phone_unique;

CREATE UNIQUE INDEX guardians_church_email_unique 
ON guardians(church_id, email) 
WHERE email IS NOT NULL AND email != '';

CREATE UNIQUE INDEX guardians_church_phone_unique 
ON guardians(church_id, phone) 
WHERE phone IS NOT NULL AND phone != '';

-- Add format validation constraints
ALTER TABLE guardians 
DROP CONSTRAINT IF EXISTS guardians_parent_id_format;

ALTER TABLE guardians
ADD CONSTRAINT guardians_parent_id_format 
CHECK (parent_id ~ '^(RS[0-9]{3,}|SEC_[A-Z0-9]+)$');

ALTER TABLE guardians
DROP CONSTRAINT IF EXISTS guardians_email_format;

ALTER TABLE guardians
ADD CONSTRAINT guardians_email_format
CHECK (email IS NULL OR email = '' OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE guardians
DROP CONSTRAINT IF EXISTS guardians_phone_format;

ALTER TABLE guardians
ADD CONSTRAINT guardians_phone_format
CHECK (phone IS NULL OR phone = '' OR phone ~ '^\+?[0-9]{10,15}$');

ALTER TABLE children
DROP CONSTRAINT IF EXISTS children_registration_id_format;

ALTER TABLE children
ADD CONSTRAINT children_registration_id_format
CHECK (registration_id ~ '^[A-Z]{2}[0-9]{3,}/[0-9]{2,}$');

ALTER TABLE children
DROP CONSTRAINT IF EXISTS children_date_of_birth_valid;

ALTER TABLE children
ADD CONSTRAINT children_date_of_birth_valid
CHECK (date_of_birth <= CURRENT_DATE);

ALTER TABLE guardians
DROP CONSTRAINT IF EXISTS guardians_active_until_valid;

ALTER TABLE guardians
ADD CONSTRAINT guardians_active_until_valid
CHECK (active_until IS NULL OR active_until > created_at);

-- ============================================
-- PART 6: Indexes for Performance
-- ============================================

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_church_id ON sessions(church_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_group_id ON sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_sessions_teacher_id ON sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);

-- Session bookings indexes
CREATE INDEX IF NOT EXISTS idx_session_bookings_session_id ON session_bookings(session_id);
CREATE INDEX IF NOT EXISTS idx_session_bookings_child_id ON session_bookings(child_id);
CREATE INDEX IF NOT EXISTS idx_session_bookings_guardian_id ON session_bookings(guardian_id);
CREATE INDEX IF NOT EXISTS idx_session_bookings_status ON session_bookings(status);
CREATE INDEX IF NOT EXISTS idx_session_bookings_booked_at ON session_bookings(booked_at);

-- Check-in records indexes
CREATE INDEX IF NOT EXISTS idx_check_in_records_session_id ON check_in_records(session_id);
CREATE INDEX IF NOT EXISTS idx_check_in_records_booking_id ON check_in_records(booking_id);
CREATE INDEX IF NOT EXISTS idx_check_in_records_parent_id ON check_in_records(parent_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_guardian ON notifications(guardian_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- ============================================
-- PART 7: Row-Level Security (RLS) Policies
-- ============================================
-- IMPORTANT: Use Service Role Key (RECOMMENDED)
-- Get SUPABASE_SERVICE_ROLE_KEY from Supabase Dashboard → Settings → API
-- Add to backend/.env: SUPABASE_SERVICE_ROLE_KEY=your-service-key
-- Service role key automatically bypasses RLS policies
--
-- If you must use anon key, uncomment the policies below:

/*
-- CHURCHES TABLE
DROP POLICY IF EXISTS "Allow backend operations" ON churches;
CREATE POLICY "Allow backend operations" ON churches
  FOR ALL USING (true) WITH CHECK (true);

-- USERS TABLE
DROP POLICY IF EXISTS "Allow backend operations" ON users;
CREATE POLICY "Allow backend operations" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- GROUPS TABLE
DROP POLICY IF EXISTS "Allow backend operations" ON groups;
CREATE POLICY "Allow backend operations" ON groups
  FOR ALL USING (true) WITH CHECK (true);

-- GUARDIANS TABLE
DROP POLICY IF EXISTS "Allow backend operations" ON guardians;
CREATE POLICY "Allow backend operations" ON guardians
  FOR ALL USING (true) WITH CHECK (true);

-- CHILDREN TABLE
DROP POLICY IF EXISTS "Allow backend operations" ON children;
CREATE POLICY "Allow backend operations" ON children
  FOR ALL USING (true) WITH CHECK (true);

-- CHILD_GUARDIANS TABLE
DROP POLICY IF EXISTS "Allow backend operations" ON child_guardians;
CREATE POLICY "Allow backend operations" ON child_guardians
  FOR ALL USING (true) WITH CHECK (true);

-- CHECK_IN_RECORDS TABLE
DROP POLICY IF EXISTS "Allow backend operations" ON check_in_records;
CREATE POLICY "Allow backend operations" ON check_in_records
  FOR ALL USING (true) WITH CHECK (true);

-- ATTENDANCE_SUMMARY TABLE
DROP POLICY IF EXISTS "Allow backend operations" ON attendance_summary;
CREATE POLICY "Allow backend operations" ON attendance_summary
  FOR ALL USING (true) WITH CHECK (true);

-- NOTIFICATIONS TABLE
DROP POLICY IF EXISTS "Allow backend operations" ON notifications;
CREATE POLICY "Allow backend operations" ON notifications
  FOR ALL USING (true) WITH CHECK (true);

-- AUDIT_LOGS TABLE
DROP POLICY IF EXISTS "Allow backend operations" ON audit_logs;
CREATE POLICY "Allow backend operations" ON audit_logs
  FOR ALL USING (true) WITH CHECK (true);

-- SESSIONS TABLE
DROP POLICY IF EXISTS "Allow backend operations" ON sessions;
CREATE POLICY "Allow backend operations" ON sessions
  FOR ALL USING (true) WITH CHECK (true);

-- SESSION_BOOKINGS TABLE
DROP POLICY IF EXISTS "Allow backend operations" ON session_bookings;
CREATE POLICY "Allow backend operations" ON session_bookings
  FOR ALL USING (true) WITH CHECK (true);
*/

-- ============================================
-- Migration Complete
-- ============================================
-- All schema updates have been applied
-- Next steps:
-- 1. Verify all tables and constraints are created
-- 2. Set up SUPABASE_SERVICE_ROLE_KEY in backend/.env (recommended)
-- 3. Or uncomment RLS policies above if using anon key
-- ============================================
