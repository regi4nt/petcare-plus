-- ================================================================
-- PetCare+ Supabase Migration v3.0
-- Untuk firmware ESP32 v3.0 (MAX30102 + TP4056 + RGB LED)
-- 
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query → Run
-- Aman dijalankan berulang (semua pakai IF NOT EXISTS / OR REPLACE)
-- ================================================================


-- ================================================================
-- [1] TABEL monitoring — Tambah kolom battery (jika belum ada)
-- ================================================================
-- Kolom battery_level dan battery_status mungkin BELUM ada
-- jika migration battery sebelumnya belum dijalankan.

ALTER TABLE monitoring
  ADD COLUMN IF NOT EXISTS battery_level  numeric(5,2)                  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS battery_status text        NOT NULL           DEFAULT 'unknown';

-- Pastikan constraint nilai battery_status valid
ALTER TABLE monitoring
  DROP CONSTRAINT IF EXISTS monitoring_battery_status_check;

ALTER TABLE monitoring
  ADD CONSTRAINT monitoring_battery_status_check
  CHECK (battery_status IN ('full','charging','discharging','low','critical','unknown'));

COMMENT ON COLUMN monitoring.battery_level  IS 'Level baterai Li-Po (0–100%), diukur via ADC voltage divider';
COMMENT ON COLUMN monitoring.battery_status IS 'Status baterai: full | charging | discharging | low | critical | unknown';


-- ================================================================
-- [2] TABEL device_commands — Buat jika belum ada
-- ================================================================
CREATE TABLE IF NOT EXISTS device_commands (
  id            uuid        DEFAULT uuid_generate_v4() PRIMARY KEY,
  pet_id        uuid        REFERENCES pets(id) ON DELETE CASCADE,
  device_id     text        NOT NULL,
  command       text        NOT NULL,          -- 'hibernate' | 'resume' | 'restart'
  status        text        NOT NULL DEFAULT 'pending',
  payload       jsonb       NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  executed_at   timestamptz,
  error_message text
);

-- Constraint nilai status yang valid
ALTER TABLE device_commands
  DROP CONSTRAINT IF EXISTS device_commands_status_check;

ALTER TABLE device_commands
  ADD CONSTRAINT device_commands_status_check
  CHECK (status IN ('pending','executed','error'));

-- Constraint nilai command yang valid
ALTER TABLE device_commands
  DROP CONSTRAINT IF EXISTS device_commands_command_check;

ALTER TABLE device_commands
  ADD CONSTRAINT device_commands_command_check
  CHECK (command IN ('hibernate','resume','restart'));

COMMENT ON TABLE  device_commands           IS 'Perintah dari web ke ESP32 (hibernasi, resume, restart)';
COMMENT ON COLUMN device_commands.command   IS 'hibernate | resume | restart';
COMMENT ON COLUMN device_commands.status    IS 'pending = belum dieksekusi, executed = berhasil, error = gagal';
COMMENT ON COLUMN device_commands.payload   IS 'Config tambahan, contoh: {"duration_minutes": 30}';

-- Index performa
CREATE INDEX IF NOT EXISTS device_commands_device_pending_idx
  ON device_commands(device_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS device_commands_pet_id_idx
  ON device_commands(pet_id, created_at DESC);


-- ================================================================
-- [3] RLS — device_commands
-- ================================================================
ALTER TABLE device_commands ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama agar tidak bentrok
DROP POLICY IF EXISTS "device_commands: insert own pets"  ON device_commands;
DROP POLICY IF EXISTS "device_commands: select own pets"  ON device_commands;
DROP POLICY IF EXISTS "device_commands: update anon"      ON device_commands;
DROP POLICY IF EXISTS "device_commands: update own"       ON device_commands;

-- INSERT: hanya user yang punya pet itu
CREATE POLICY "device_commands: insert own pets"
  ON device_commands FOR INSERT
  TO authenticated
  WITH CHECK (
    pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid())
  );

-- SELECT: hanya user yang punya pet itu
CREATE POLICY "device_commands: select own pets"
  ON device_commands FOR SELECT
  TO authenticated
  USING (
    pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid())
  );

-- UPDATE (PATCH status): ESP32 pakai anon key untuk update status executed/error
-- Dibatasi hanya kolom status, executed_at, error_message
CREATE POLICY "device_commands: update anon"
  ON device_commands FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);


-- ================================================================
-- [4] RLS — monitoring (pastikan anon bisa INSERT dari ESP32)
-- ================================================================
-- Hapus policy lama agar tidak duplikat
DROP POLICY IF EXISTS "monitoring: insert anon"       ON monitoring;
DROP POLICY IF EXISTS "monitoring: select own pets"   ON monitoring;
DROP POLICY IF EXISTS "monitoring: delete own pets"   ON monitoring;

-- INSERT: siapa saja termasuk ESP32 (anon key)
CREATE POLICY "monitoring: insert anon"
  ON monitoring FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- SELECT: hanya user yang punya pet tersebut
CREATE POLICY "monitoring: select own pets"
  ON monitoring FOR SELECT
  TO authenticated
  USING (
    pet_id IS NULL
    OR pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid())
  );

-- DELETE: user bisa hapus data monitoring pet miliknya
CREATE POLICY "monitoring: delete own pets"
  ON monitoring FOR DELETE
  TO authenticated
  USING (
    pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid())
  );


-- ================================================================
-- [5] REALTIME — aktifkan untuk monitoring + device_commands
-- ================================================================
-- monitoring sudah ditambah di schema awal, ini pastikan
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE monitoring;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE device_commands;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;


-- ================================================================
-- [6] INDEX TAMBAHAN monitoring untuk query dashboard
-- ================================================================
CREATE INDEX IF NOT EXISTS monitoring_pet_created_idx
  ON monitoring(pet_id, created_at DESC);

CREATE INDEX IF NOT EXISTS monitoring_device_id_idx
  ON monitoring(device_id, created_at DESC);


-- ================================================================
-- [7] PROFILES — pastikan kolom streak ada
-- ================================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS login_streak    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login_date date;


-- ================================================================
-- [8] VERIFIKASI — tampilkan hasil akhir
-- ================================================================

-- Cek kolom tabel monitoring
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'monitoring'
ORDER BY ordinal_position;

-- Cek semua RLS policies aktif
SELECT
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename IN ('monitoring', 'device_commands', 'profiles', 'pets')
ORDER BY tablename, policyname;

-- ================================================================
-- SELESAI — Migration v3.0 berhasil dijalankan
-- ================================================================
