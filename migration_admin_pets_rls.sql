-- =====================================================
-- MIGRATION: Admin RLS — Izinkan Admin Kelola Hewan Semua Pengguna
-- Fix: gunakan EXISTS() agar kompatibel dengan PostgreSQL Supabase
--
-- Jalankan di:
-- Supabase Dashboard > SQL Editor > New Query > Run
-- =====================================================

-- ─── STEP 1: Hapus policy lama ──────────────────────────────────────
DROP POLICY IF EXISTS "pets: own"           ON pets;
DROP POLICY IF EXISTS "pets_select_policy"  ON pets;
DROP POLICY IF EXISTS "pets_insert_policy"  ON pets;
DROP POLICY IF EXISTS "pets_update_policy"  ON pets;
DROP POLICY IF EXISTS "pets_delete_policy"  ON pets;

-- ─── STEP 2: Helper function cek Admin ──────────────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'Admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── STEP 3: Policy baru — SELECT ───────────────────────────────────
CREATE POLICY "pets_select_policy" ON pets
  FOR SELECT USING (
    auth.uid() = user_id OR is_admin()
  );

-- ─── STEP 4: Policy baru — INSERT ───────────────────────────────────
CREATE POLICY "pets_insert_policy" ON pets
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR is_admin()
  );

-- ─── STEP 5: Policy baru — UPDATE ───────────────────────────────────
CREATE POLICY "pets_update_policy" ON pets
  FOR UPDATE USING (
    auth.uid() = user_id OR is_admin()
  ) WITH CHECK (
    auth.uid() = user_id OR is_admin()
  );

-- ─── STEP 6: Policy baru — DELETE ───────────────────────────────────
CREATE POLICY "pets_delete_policy" ON pets
  FOR DELETE USING (
    auth.uid() = user_id OR is_admin()
  );

-- ─── VERIFIKASI ─────────────────────────────────────────────────────
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'pets'
ORDER BY cmd;
