-- =====================================================
-- Migration: Tambah kolom batch_id dan reading_index
-- ke tabel monitoring untuk mendukung batch upload ESP32
-- Jalankan di: Supabase Dashboard > SQL Editor
-- =====================================================

alter table monitoring
  add column if not exists batch_id text default null,
  add column if not exists reading_index integer default null,
  add column if not exists battery_level numeric(5,2) default null,
  add column if not exists battery_status text default null;

-- Index untuk query per batch (opsional tapi berguna)
create index if not exists monitoring_batch_id_idx on monitoring(batch_id);

-- Selesai
