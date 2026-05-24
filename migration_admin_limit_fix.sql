-- =====================================================
-- MIGRATION: Fix Kelola Limit — Admin Ubah max_pets
--
-- Jalankan di:
-- Supabase Dashboard > SQL Editor > New Query > Run
-- =====================================================

-- ─── STEP 1: Pastikan kolom max_pets ada di profiles ────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS max_pets integer NOT NULL DEFAULT 0;

-- ─── STEP 2: Pastikan fungsi is_admin() sudah ada ───────────────────
-- (sudah dibuat di migration_admin_pets_rls.sql, ini aman dijalankan ulang)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'Admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── STEP 3: Drop policy profiles lama, buat ulang pakai is_admin() ─
DROP POLICY IF EXISTS "profiles: own"           ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy"  ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy"  ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy"  ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy"  ON profiles;
DROP POLICY IF EXISTS "Admin can read all profiles"       ON profiles;
DROP POLICY IF EXISTS "Admin can update any profile role" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile."       ON profiles;
DROP POLICY IF EXISTS "Users can update own profile."     ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile."     ON profiles;
DROP POLICY IF EXISTS "Enable read for users based on user_id"         ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only"     ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id"       ON profiles;

-- SELECT: user lihat milik sendiri, admin lihat semua
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR is_admin()
  );

-- INSERT: hanya trigger signup system
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- UPDATE: user update milik sendiri, admin update siapa saja (termasuk max_pets)
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (
    auth.uid() = id OR is_admin()
  ) WITH CHECK (
    auth.uid() = id OR is_admin()
  );

-- ─── VERIFIKASI ─────────────────────────────────────────────────────
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'pets')
ORDER BY tablename, cmd;
