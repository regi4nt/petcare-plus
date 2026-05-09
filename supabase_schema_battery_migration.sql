-- =====================================================
-- Migrasi: Tambah Kolom Battery ke Tabel Monitoring
-- Jalankan di: Supabase Dashboard > SQL Editor
-- =====================================================

-- Tambah kolom battery_level ke tabel monitoring
alter table monitoring
  add column if not exists battery_level numeric(5,2),
  add column if not exists battery_status text default 'unknown';

-- Komentar kolom untuk dokumentasi
comment on column monitoring.battery_level is 'Level baterai dalam persentase (0-100%)';
comment on column monitoring.battery_status is 'Status baterai: charging, discharging, full, low, critical, atau unknown';

-- Optional: Tambah index untuk query cepat
create index if not exists monitoring_battery_level_idx on monitoring(battery_level);

-- =====================================================
-- SELESAI! Jalankan migrasi ini sebelum update firmware.
-- =====================================================
