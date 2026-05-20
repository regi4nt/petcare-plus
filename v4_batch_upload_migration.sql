-- ================================================================
-- PetCare+ Migration v4.0 — Deep Sleep + Batch Upload
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query → Run
-- Aman dijalankan berulang (semua pakai IF NOT EXISTS / OR REPLACE)
-- ================================================================

-- ================================================================
-- [1] Tambah kolom batch_id ke tabel monitoring
--     Digunakan untuk mengelompokkan 15 baris dari satu batch upload.
--     Firmware v4.0 mengisi batch_id dengan UUID yang sama untuk
--     semua baris dalam satu siklus pengiriman 15 menit.
-- ================================================================

ALTER TABLE monitoring
  ADD COLUMN IF NOT EXISTS batch_id uuid DEFAULT NULL;

COMMENT ON COLUMN monitoring.batch_id IS
  'UUID yang sama untuk semua baris dalam satu batch upload (15 baris/kirim). '
  'NULL untuk data lama dari firmware v3 ke bawah.';

-- Index untuk query per batch (misal: ambil semua data batch terakhir)
CREATE INDEX IF NOT EXISTS monitoring_batch_id_idx
  ON monitoring(batch_id)
  WHERE batch_id IS NOT NULL;


-- ================================================================
-- [2] Tambah kolom reading_index ke tabel monitoring
--     Urutan pembacaan dalam batch (0–14), untuk tahu kapan tiap
--     data dibaca relatif terhadap waktu upload.
-- ================================================================

ALTER TABLE monitoring
  ADD COLUMN IF NOT EXISTS reading_index smallint DEFAULT NULL;

COMMENT ON COLUMN monitoring.reading_index IS
  'Urutan pembacaan dalam batch: 0 = paling lama, 14 = paling baru. '
  'Tiap index mewakili jeda ~1 menit sebelum created_at batch.';


-- ================================================================
-- [3] View: monitoring_with_approx_time
--     Menambah kolom approx_recorded_at yang merekonstruksi
--     perkiraan waktu baca sensor berdasarkan reading_index.
--     (created_at = waktu upload batch, bukan waktu baca sensor)
-- ================================================================

CREATE OR REPLACE VIEW monitoring_with_approx_time AS
SELECT
  *,
  CASE
    WHEN reading_index IS NOT NULL AND batch_id IS NOT NULL
    THEN created_at - ((14 - reading_index) * INTERVAL '1 minute')
    ELSE created_at
  END AS approx_recorded_at
FROM monitoring;

COMMENT ON VIEW monitoring_with_approx_time IS
  'Monitoring dengan perkiraan waktu baca sensor (approx_recorded_at). '
  'Data dikirim batch per 15 menit; reading_index 0 = ~14 mnt sebelum upload, '
  '14 = ~0 mnt sebelum upload.';


-- ================================================================
-- [4] RLS untuk view (akses sama dengan tabel monitoring)
-- ================================================================

-- View tidak perlu RLS sendiri — inherits dari tabel underlying.
-- Pastikan SELECT policy monitoring sudah ada (dari SYNC_DATABASE_FIX.sql).


-- ================================================================
-- [5] Index tambahan untuk dashboard query efisien
-- ================================================================

-- Query "ambil data 24 jam terakhir per pet" — sering dipakai dashboard
CREATE INDEX IF NOT EXISTS monitoring_pet_recent_idx
  ON monitoring(pet_id, created_at DESC)
  WHERE created_at > NOW() - INTERVAL '7 days';


-- ================================================================
-- [6] Verifikasi — tampilkan kolom tabel monitoring setelah migrasi
-- ================================================================

SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'monitoring'
ORDER BY ordinal_position;

-- ================================================================
-- SELESAI — Migration v4.0 berhasil
-- Selanjutnya: upload firmware esp32_iot_monitoring.ino v4.0
-- ================================================================
