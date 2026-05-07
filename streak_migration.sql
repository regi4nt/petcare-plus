-- =====================================================
-- Migrasi: Sistem Streak Login Harian (Basic User)
-- Jalankan di: Supabase Dashboard > SQL Editor
-- =====================================================

-- Tambah kolom streak ke tabel profiles
alter table profiles
  add column if not exists login_streak integer not null default 0,
  add column if not exists last_login_date date;

-- Komentar kolom untuk dokumentasi
comment on column profiles.login_streak    is 'Jumlah hari berturut-turut user login (hanya dihitung untuk Basic)';
comment on column profiles.last_login_date is 'Tanggal login terakhir (digunakan untuk kalkulasi streak)';

-- =====================================================
-- SELESAI! Jalankan ini sebelum deploy versi baru.
-- =====================================================
