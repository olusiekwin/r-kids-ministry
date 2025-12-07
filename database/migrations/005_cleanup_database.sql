-- Migration: Clean up database - Keep only admin details
-- This script removes all test/sample data while preserving admin user and essential structure

-- Step 1: Delete all check-in/check-out records
DELETE FROM check_in_records;

-- Step 2: Delete all attendance summaries
DELETE FROM attendance_summary;

-- Step 3: Delete all notifications
DELETE FROM notifications;

-- Step 4: Delete all audit logs (optional - you may want to keep these)
DELETE FROM audit_logs;

-- Step 5: Delete all child-guardian relationships (for secondary guardians)
DELETE FROM child_guardians;

-- Step 6: Delete all children
DELETE FROM children;

-- Step 7: Delete all guardians (except any that are linked to admin users)
-- First, identify admin-linked guardians to preserve them
DO $$
DECLARE
    admin_guardian_ids UUID[];
BEGIN
    -- Get guardian IDs linked to admin users
    SELECT ARRAY_AGG(DISTINCT linked_guardian_id)
    INTO admin_guardian_ids
    FROM users
    WHERE role = 'Admin' 
      AND linked_guardian_id IS NOT NULL;

    -- Delete all guardians except admin-linked ones
    IF admin_guardian_ids IS NOT NULL AND array_length(admin_guardian_ids, 1) > 0 THEN
        DELETE FROM guardians
        WHERE guardian_id != ALL(admin_guardian_ids);
    ELSE
        -- No admin-linked guardians, delete all
        DELETE FROM guardians;
    END IF;
END $$;

-- Step 8: Delete all users except admin users
-- Keep only users with role = 'Admin'
DELETE FROM users WHERE role != 'Admin';

-- Step 9: Reset sequence counters (optional, but helpful)
-- Note: UUIDs don't use sequences, but if you have any auto-increment fields, reset them here

-- Step 10: Verify cleanup
-- The following queries can be used to verify the cleanup:
-- SELECT COUNT(*) as remaining_guardians FROM guardians;
-- SELECT COUNT(*) as remaining_children FROM children;
-- SELECT COUNT(*) as remaining_users FROM users;
-- SELECT COUNT(*) as remaining_checkins FROM check_in_records;

-- Step 11: Display summary
DO $$
DECLARE
    guardian_count INTEGER;
    child_count INTEGER;
    user_count INTEGER;
    checkin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO guardian_count FROM guardians;
    SELECT COUNT(*) INTO child_count FROM children;
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO checkin_count FROM check_in_records;

    RAISE NOTICE 'Cleanup Summary:';
    RAISE NOTICE '  Remaining Guardians: %', guardian_count;
    RAISE NOTICE '  Remaining Children: %', child_count;
    RAISE NOTICE '  Remaining Users: %', user_count;
    RAISE NOTICE '  Remaining Check-ins: %', checkin_count;
END $$;

