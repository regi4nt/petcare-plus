-- =====================================================
-- MIGRATION: Admin RLS — Izinkan Admin Kelola Hewan Semua Pengguna
-- 
-- Masalah  : "new row violates row-level security policy for table 'pets'"
--            Terjadi saat admin mencoba menambah hewan untuk user lain.
-- Penyebab : Policy lama hanya izinkan user insert/update pet miliknya sendiri
--            (auth.uid() = user_id), sehingga admin yang memasukkan pet dengan
--            user_id berbeda akan ditolak oleh RLS.
-- Solusi   : Ganti policy "pets: own" dengan policy terpisah per operasi,
--            tambahkan pengecualian untuk role Admin.
--
-- Jalankan SELURUH script ini di:
-- Supabase Dashboard > SQL Editor > New Query > Run
-- =====================================================

-- ─── STEP 1: Hapus policy lama yang terlalu ketat ───────────────────
DROP POLICY IF EXISTS "pets: own" ON pets;

-- ─── STEP 2: Buat policy baru — SELECT ──────────────────────────────
-- User bisa lihat pet miliknya sendiri.
-- Admin bisa lihat semua pet.
CREATE POLICY "pets_select_policy" ON pets
  FOR SELECT USING (
    auth.uid() = user_id
    OR (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) = 'Admin'
  );

-- ─── STEP 3: Buat policy baru — INSERT ──────────────────────────────
-- User biasa hanya bisa insert pet untuk dirinya sendiri (user_id = auth.uid()).
-- Admin bisa insert pet untuk siapa saja (user_id bebas).
CREATE POLICY "pets_insert_policy" ON pets
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) = 'Admin'
  );

-- ─── STEP 4: Buat policy baru — UPDATE ──────────────────────────────
-- User biasa hanya bisa update pet miliknya sendiri.
-- Admin bisa update pet siapa saja.
CREATE POLICY "pets_update_policy" ON pets
  FOR UPDATE USING (
    auth.uid() = user_id
    OR (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) = 'Admin'
  );

-- ─── STEP 5: Buat policy baru — DELETE ──────────────────────────────
-- User biasa hanya bisa hapus pet miliknya sendiri.
-- Admin bisa hapus pet siapa saja.
CREATE POLICY "pets_delete_policy" ON pets
  FOR DELETE USING (
    auth.uid() = user_id
    OR (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) = 'Admin'
  );

-- ─── VERIFIKASI: cek policy aktif di tabel pets ─────────────────────
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'pets';
