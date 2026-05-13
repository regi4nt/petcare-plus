-- =====================================================
-- MIGRATION: Demo Account + Admin Account Management
-- Jalankan di Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Ubah default role baru menjadi 'Demo'
ALTER TABLE profiles
  ALTER COLUMN role SET DEFAULT 'Demo';

-- 2. Update trigger handle_new_user agar akun baru = Demo
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, name, phone, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    'Demo'  -- Akun baru selalu mulai sebagai Demo
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RLS Policy: Admin bisa membaca SEMUA profiles
-- (Default Supabase hanya mengizinkan user membaca profile sendiri)
DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;
CREATE POLICY "Admin can read all profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id  -- user baca profile sendiri
    OR
    EXISTS (          -- atau jika Admin, bisa baca semua
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'Admin'
    )
  );

-- 4. RLS Policy: Admin bisa update role pengguna lain
DROP POLICY IF EXISTS "Admin can update any profile role" ON profiles;
CREATE POLICY "Admin can update any profile role"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id  -- user update profile sendiri
    OR
    EXISTS (          -- atau Admin bisa update siapa saja
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'Admin'
    )
  );

-- Selesai.
-- Setelah migrasi, set minimal 1 akun ke role 'Admin' secara manual:
-- UPDATE profiles SET role = 'Admin' WHERE id = '<uuid-user-admin>';
