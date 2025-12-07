-- Migration: Add validation constraints to prevent duplicates
-- This migration adds unique constraints and validation rules

-- Step 1: Clean up duplicate emails before creating unique index
-- Keep the first guardian with each email, update others with a suffix
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
        -- Update duplicate emails (keep first, suffix others)
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
                -- Set duplicate emails to NULL (keeping only the first one)
                -- Note: Admin should manually update these records
                UPDATE guardians
                SET email = NULL
                WHERE guardian_id = dup_email_record.guardian_id;
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
        -- Update duplicate phones (keep first, suffix others)
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
                -- Set duplicate phones to NULL (keeping only the first one)
                -- Note: Admin should manually update these records
                UPDATE guardians
                SET phone = NULL
                WHERE guardian_id = dup_phone_record.guardian_id;
            END IF;
            counter := counter + 1;
        END LOOP;
    END LOOP;
END $$;

-- Step 2: Drop existing indexes if they exist
DROP INDEX IF EXISTS guardians_church_email_unique;
DROP INDEX IF EXISTS guardians_church_phone_unique;

-- Step 3: Add unique constraint on email for guardians
-- Note: This allows NULL emails but prevents duplicate non-NULL emails per church
CREATE UNIQUE INDEX guardians_church_email_unique 
ON guardians(church_id, email) 
WHERE email IS NOT NULL AND email != '';

-- Step 4: Add unique constraint on phone for guardians
CREATE UNIQUE INDEX guardians_church_phone_unique 
ON guardians(church_id, phone) 
WHERE phone IS NOT NULL AND phone != '';

-- Add check constraint to ensure parent_id format (RS### or SEC_### for secondary guardians)
ALTER TABLE guardians 
DROP CONSTRAINT IF EXISTS guardians_parent_id_format;

ALTER TABLE guardians
ADD CONSTRAINT guardians_parent_id_format 
CHECK (parent_id ~ '^(RS[0-9]{3,}|SEC_[A-Z0-9]+)$');

-- Add check constraint for email format
ALTER TABLE guardians
DROP CONSTRAINT IF EXISTS guardians_email_format;

ALTER TABLE guardians
ADD CONSTRAINT guardians_email_format
CHECK (email IS NULL OR email = '' OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add check constraint for phone format (basic validation)
ALTER TABLE guardians
DROP CONSTRAINT IF EXISTS guardians_phone_format;

ALTER TABLE guardians
ADD CONSTRAINT guardians_phone_format
CHECK (phone IS NULL OR phone = '' OR phone ~ '^\+?[0-9]{10,15}$');

-- Ensure registration_id format for children (parent_id/##)
ALTER TABLE children
DROP CONSTRAINT IF EXISTS children_registration_id_format;

ALTER TABLE children
ADD CONSTRAINT children_registration_id_format
CHECK (registration_id ~ '^[A-Z]{2}[0-9]{3,}/[0-9]{2,}$');

-- Add validation for date_of_birth (cannot be in the future)
ALTER TABLE children
DROP CONSTRAINT IF EXISTS children_date_of_birth_valid;

ALTER TABLE children
ADD CONSTRAINT children_date_of_birth_valid
CHECK (date_of_birth <= CURRENT_DATE);

-- Add validation for active_until (must be in future if set)
ALTER TABLE guardians
DROP CONSTRAINT IF EXISTS guardians_active_until_valid;

ALTER TABLE guardians
ADD CONSTRAINT guardians_active_until_valid
CHECK (active_until IS NULL OR active_until > created_at);

