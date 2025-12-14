# Super Admin Setup Guide

## Quick Setup

### Option 1: Using SQL Script (Recommended)

1. Go to your Supabase Dashboard → SQL Editor
2. Run the migration: `database/migrations/003_create_super_admin.sql`
3. This will create a super admin user with:
   - **Email:** `superadmin@rkids.church`
   - **Password:** `password123`
   - **Role:** `SuperAdmin`

### Option 2: Manual SQL

Run this in Supabase SQL Editor:

```sql
-- Get your church_id first
SELECT church_id FROM churches LIMIT 1;

-- Then create super admin (replace YOUR_CHURCH_ID with actual ID)
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
    'YOUR_CHURCH_ID',  -- Replace with actual church_id
    'superadmin@rkids.church',
    encode(digest('password123', 'sha256'), 'hex'),  -- SHA256 hash of "password123"
    'SuperAdmin',
    'Super Administrator',
    true,
    false,
    true,
    true
);
```

### Option 3: Login with Email Pattern

The system automatically assigns `super_admin` role to emails starting with "superadmin":
- Email: `superadmin@test.com` or `superadmin@rkids.church`
- Password: `password123`
- This works if the user exists in the database

## Login Steps

1. Go to the login page
2. Enter email: `superadmin@rkids.church`
3. Enter password: `password123`
4. Complete MFA verification
5. You'll be logged in as super admin!

## Super Admin Features

- ✅ Create and manage admin users
- ✅ Suspend/activate admin users
- ✅ Full access to all admin features
- ✅ Manage all users (teachers, teens, parents)
- ✅ Start/end sessions
- ✅ Full site management

## Security Note

**IMPORTANT:** Change the password after first login! The default password `password123` is for development only.
