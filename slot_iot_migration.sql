-- =====================================================
-- Migration: Slot Hewan & IoT Device ID
-- Jalankan di: Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Tambah kolom max_pets ke tabel profiles
--    DEFAULT 0 = semua akun Subscribe terkunci sampai admin beri slot
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS max_pets integer NOT NULL DEFAULT 0;

-- Pastikan akun Admin tidak terkunci (opsional, karena logika di app sudah handle)
UPDATE profiles SET max_pets = 999 WHERE role = 'Admin';

-- 2. Tambah kolom iot_device_id ke tabel pets
ALTER TABLE pets
  ADD COLUMN IF NOT EXISTS iot_device_id text DEFAULT NULL;

-- =====================================================
-- SELESAI.
-- Setelah migrasi:
-- - Akun Subscribe baru akan terkunci (max_pets = 0)
-- - Admin bisa buka slot lewat Panel Admin > Tab "Slot Hewan"
-- - IoT device bisa dikunci ke hewan lewat Panel Admin > Tab "ID IoT"
-- =====================================================
