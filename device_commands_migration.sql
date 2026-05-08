-- =====================================================
-- Device Commands Table — Kontrol hibernasi ESP32
-- Jalankan di: Supabase Dashboard > SQL Editor
-- =====================================================

-- Tabel untuk perintah dari Web ke ESP32
create table if not exists device_commands (
  id uuid default uuid_generate_v4() primary key,
  pet_id uuid references pets on delete cascade,
  device_id text not null,
  command text not null,                     -- 'hibernate', 'resume', 'restart'
  status text default 'pending',             -- 'pending', 'executed', 'failed'
  payload jsonb default '{}',                -- config tambahan
  created_at timestamptz default now(),
  executed_at timestamptz,
  error_message text
);

-- Index untuk query cepat
create index if not exists device_commands_device_id_idx on device_commands(device_id, created_at desc);
create index if not exists device_commands_pet_id_idx on device_commands(pet_id);
create index if not exists device_commands_status_idx on device_commands(status);

-- RLS: User hanya bisa kirim command untuk pet miliknya
alter table device_commands enable row level security;

create policy "device_commands: insert own pets"
  on device_commands for insert
  to authenticated
  with check (
    pet_id in (
      select id from pets where user_id = auth.uid()
    )
  );

create policy "device_commands: select own pets"
  on device_commands for select
  to authenticated
  using (
    pet_id in (
      select id from pets where user_id = auth.uid()
    )
  );

-- Realtime untuk monitoring status command
alter publication supabase_realtime add table device_commands;

-- =====================================================
-- SELESAI! Jalankan migrasi ini sebelum deploy.
-- =====================================================
