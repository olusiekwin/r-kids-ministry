-- Migration: Create Super Admin User
-- Run this in your Supabase SQL Editor to create a super admin account
-- 
-- IMPORTANT: Replace the email and password_hash with your desired values
-- The password_hash below is for "password123" (development only)
-- In production, use a proper password hashing algorithm (bcrypt)

-- First, ensure you have a church_id
-- If you don't have one, this will use the first church or create a default one
DO $$
DECLARE
    v_church_id UUID;
    v_user_id UUID;
    v_password_hash VARCHAR(255);
BEGIN
    -- Get or create default church
    SELECT church_id INTO v_church_id FROM churches LIMIT 1;
    
    IF v_church_id IS NULL THEN
        INSERT INTO churches (name, location, settings)
        VALUES ('Ruach South Assembly', 'Growth Happens Here', '{}')
        RETURNING church_id INTO v_church_id;
    END IF;

    -- Hash password for "password123" (SHA256 - for development only)
    -- In production, use bcrypt or similar
    v_password_hash := encode(digest('password123', 'sha256'), 'hex');

    -- Check if super admin already exists
    SELECT user_id INTO v_user_id 
    FROM users 
    WHERE email = 'superadmin@rkids.church' 
      AND church_id = v_church_id;

    -- Create super admin if doesn't exist
    IF v_user_id IS NULL THEN
        INSERT INTO users (
            church_id,
            email,
            password_hash,
            role,
            name,
            is_active,
            mfa_enabled,
            password_set,
            profile_updated
        )
        VALUES (
            v_church_id,
            'superadmin@rkids.church',
            v_password_hash,
            'SuperAdmin',
            'Super Administrator',
            true,
            false,
            true,  -- Password already set (using password123)
            true   -- Profile updated
        )
        RETURNING user_id INTO v_user_id;

        RAISE NOTICE 'Super admin created successfully!';
        RAISE NOTICE 'Email: superadmin@rkids.church';
        RAISE NOTICE 'Password: password123';
        RAISE NOTICE 'User ID: %', v_user_id;
    ELSE
        -- Update existing user to super admin
        UPDATE users 
        SET role = 'SuperAdmin',
            password_hash = v_password_hash,
            password_set = true,
            profile_updated = true
        WHERE user_id = v_user_id;

        RAISE NOTICE 'Existing user updated to super admin!';
        RAISE NOTICE 'Email: superadmin@rkids.church';
        RAISE NOTICE 'Password: password123';
    END IF;
END $$;

-- Verify super admin was created
SELECT 
    user_id,
    email,
    role,
    name,
    is_active,
    password_set,
    profile_updated
FROM users 
WHERE role = 'SuperAdmin'
ORDER BY created_at DESC
LIMIT 1;
