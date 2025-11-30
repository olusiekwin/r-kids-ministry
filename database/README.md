# Database Setup for R-KIDS

## Supabase Setup

1. **Create your Supabase project** at https://supabase.com

2. **Run the main schema** in Supabase SQL Editor:
   - Go to your Supabase project
   - Navigate to SQL Editor
   - Run the contents of `supabase_schema.sql`

3. **Run the migration** to add user profile fields:
   - In SQL Editor, run the contents of `migrations/001_add_user_profile_fields.sql`

4. **Fix Row-Level Security (RLS) policies** - IMPORTANT:
   - Option A (RECOMMENDED): Use Service Role Key
     - Get `SUPABASE_SERVICE_ROLE_KEY` from Supabase Dashboard → Settings → API
     - Add to `backend/.env`: `SUPABASE_SERVICE_ROLE_KEY=your-service-key`
     - Service role key bypasses RLS automatically
   
   - Option B: Create RLS Policies
     - Run `migrations/002_setup_rls_policies.sql` in Supabase SQL Editor
     - This allows backend operations with anon key

## Schema Overview

The database includes these main tables:

- **churches** - Multi-tenant church information
- **users** - User accounts (Admin, Teacher, Parent, Teen)
- **groups** - Children's groups (Little Angels, Saints, etc.)
- **guardians** - Parent/guardian information
- **children** - Child registration and information
- **child_guardians** - Relationships between children and guardians
- **check_in_records** - Check-in/check-out tracking
- **attendance_summary** - Daily attendance summaries
- **notifications** - Email/SMS notifications
- **audit_logs** - System audit trail

## Environment Variables

Set these in your `backend/.env` file:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# RECOMMENDED: Use service role key for backend (bypasses RLS)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Get these from: Supabase Dashboard → Settings → API

**Important:** Use `SUPABASE_SERVICE_ROLE_KEY` for backend operations to bypass RLS. Never expose this key to the frontend!

## Migration Files

Run migrations in order in the Supabase SQL Editor:

1. `001_add_user_profile_fields.sql` - Adds name, phone, address, status fields to users table
2. `002_setup_rls_policies.sql` - Creates RLS policies to allow backend operations (only if using anon key)

## Troubleshooting

### RLS Policy Errors

If you see errors like `new row violates row-level security policy`:

**Solution 1 (Recommended):** Use Service Role Key
- Add `SUPABASE_SERVICE_ROLE_KEY` to `backend/.env`
- Service role key bypasses RLS automatically
- More secure than permissive policies

**Solution 2:** Run RLS Migration
- Execute `migrations/002_setup_rls_policies.sql` in Supabase SQL Editor
- Creates permissive policies for backend operations
- Less secure but works with anon key

### Data Not Saving

- Check if RLS policies are blocking operations
- Verify you're using service_role key OR policies are set
- Check backend logs for RLS errors

