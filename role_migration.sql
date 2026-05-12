-- =====================================================
-- Migration: Sistem 3 Jenis Akun
-- Ubah role 'Basic' → 'Subscribe', tambah 'Demo' & 'Admin'
-- Jalankan di: Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Update semua user existing dari 'Basic' ke 'Subscribe'
UPDATE profiles
SET role = 'Subscribe'
WHERE role = 'Basic' OR role IS NULL;

-- 2. Tambahkan CHECK constraint untuk memvalidasi nilai role
--    (opsional — jalankan jika belum ada)
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('Subscribe', 'Demo', 'Admin'));

-- 3. Update default kolom role
ALTER TABLE profiles
  ALTER COLUMN role SET DEFAULT 'Subscribe';

-- 4. Update fungsi auto-create profile untuk user baru
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, name, phone, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    'Subscribe'  -- default akun baru = Subscribe
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── CARA MENGUBAH ROLE PENGGUNA ─────────────────────
-- Subscribe  : pengguna berlangganan penuh
-- Demo       : akun percobaan (baca saja, tidak bisa tambah/edit/hapus)
-- Admin      : akses penuh + Panel Admin di sidebar

-- Contoh: jadikan user tertentu sebagai Admin
-- UPDATE profiles SET role = 'Admin' WHERE id = '<user-uuid>';

-- Contoh: jadikan user sebagai Demo
-- UPDATE profiles SET role = 'Demo' WHERE id = '<user-uuid>';

-- Contoh: kembalikan ke Subscribe
-- UPDATE profiles SET role = 'Subscribe' WHERE id = '<user-uuid>';
-- =====================================================
