-- Migration: Add Super Admin Role
-- This allows super admins to manage other admins
-- Regular admins cannot create other admins

-- Update the role constraint to include SuperAdmin
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('Admin', 'SuperAdmin', 'Teacher', 'Parent', 'Teen'));

-- Note: Existing admins remain as 'Admin'
-- To convert an admin to super admin, run:
-- UPDATE users SET role = 'SuperAdmin' WHERE email = 'admin@example.com';

