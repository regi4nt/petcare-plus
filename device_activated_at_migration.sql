-- =====================================================
-- Migration: device_activated_at pada tabel pets
-- Tujuan: Filter data monitoring hanya sejak ESP32
--         terakhir diaktifkan ke hewan tersebut.
--
-- Jalankan di: Supabase Dashboard > SQL Editor
-- =====================================================

ALTER TABLE pets
  ADD COLUMN IF NOT EXISTS device_activated_at timestamptz DEFAULT NULL;

CREATE INDEX IF NOT EXISTS monitoring_pet_created_idx
  ON monitoring (pet_id, created_at DESC);

-- =====================================================
-- SELESAI.
-- device_activated_at = NULL → belum pernah di-set_pet,
-- getCalculated() tetap ambil N data terbaru tanpa filter.
-- =====================================================
