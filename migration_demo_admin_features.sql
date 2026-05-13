-- =====================================================
-- MIGRATION: Demo Default Role + Admin Manage Accounts
-- Jalankan SELURUH script ini di:
-- Supabase Dashboard > SQL Editor > New Query > Run
-- =====================================================

-- ── LANGKAH 1: Ubah trigger agar akun baru = Demo ───────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, name, phone, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    'Demo'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── LANGKAH 2: RLS — drop semua policy profiles lama, buat ulang ────
-- (Supabase default hanya izinkan user baca profile sendiri)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada
DROP POLICY IF EXISTS "Users can view own profile."      ON profiles;
DROP POLICY IF EXISTS "Users can update own profile."    ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile."    ON profiles;
DROP POLICY IF EXISTS "Admin can read all profiles"      ON profiles;
DROP POLICY IF EXISTS "Admin can update any profile role" ON profiles;
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;

-- SELECT: user baca milik sendiri ATAU Admin baca semua
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (
    auth.uid() = id
    OR (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) = 'Admin'
  );

-- INSERT: hanya trigger system (service_role) yang insert saat signup
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- UPDATE: user update profil sendiri ATAU Admin update siapa saja
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (
    auth.uid() = id
    OR (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) = 'Admin'
  );

-- ── LANGKAH 3: Set akun Admin pertama (ganti UUID di bawah) ──────────
-- WAJIB dijalankan manual untuk akun yang ingin dijadikan Admin:
-- UPDATE profiles SET role = 'Admin' WHERE id = 'GANTI-DENGAN-UUID-USER-ADMIN';

-- ── VERIFIKASI: cek policy yang aktif ────────────────────────────────
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'profiles';
