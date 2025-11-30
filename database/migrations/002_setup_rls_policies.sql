-- Migration: Setup Row-Level Security (RLS) Policies
-- IMPORTANT: Run this in your Supabase SQL Editor to allow backend operations

-- ============================================
-- SOLUTION 1: Use Service Role Key (RECOMMENDED)
-- ============================================
-- The best solution is to use SUPABASE_SERVICE_ROLE_KEY in your backend .env
-- Service role key automatically bypasses RLS policies
-- 
-- Get it from: Supabase Dashboard → Settings → API → service_role key

-- ============================================
-- SOLUTION 2: Create Permissive RLS Policies
-- ============================================
-- If you must use anon key, create these policies to allow backend access

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

-- ============================================
-- IMPORTANT NOTES
-- ============================================
-- 
-- Option 1 (RECOMMENDED): Use Service Role Key
--   • Get SUPABASE_SERVICE_ROLE_KEY from Supabase dashboard
--   • Add to backend/.env: SUPABASE_SERVICE_ROLE_KEY=your-service-key
--   • Service role key bypasses RLS automatically
--   • More secure: Keep service role key secret (never expose to frontend)
--
-- Option 2: Use Anon Key with Permissive Policies (Current)
--   • Run this migration SQL file in Supabase SQL Editor
--   • Policies allow all operations for anon role
--   • Less secure: Anyone with anon key can access data
--
-- For production, consider implementing more restrictive policies
-- based on church_id and user authentication.
