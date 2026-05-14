-- =====================================================================
-- PETCARE+ — SINKRONISASI DATABASE LENGKAP
-- Jalankan SATU FILE INI di: Supabase Dashboard → SQL Editor → Run
-- File ini aman dijalankan berulang kali (idempotent).
-- =====================================================================

-- ─── LANGKAH 1: Extension UUID ───────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── LANGKAH 2: Tabel PROFILES (+ kolom streak jika belum ada) ───────
create table if not exists profiles (
  id               uuid references auth.users on delete cascade primary key,
  name             text not null default '',
  phone            text default '',
  role             text default 'Demo' check (role in ('Subscribe', 'Demo', 'Admin')),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- Kolom streak (dibutuhkan oleh api.js → profileService.updateStreak)
alter table profiles
  add column if not exists login_streak     integer not null default 0,
  add column if not exists last_login_date  date;

-- Pastikan constraint role sudah benar (drop dulu jika beda)
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles
  add constraint profiles_role_check
  check (role in ('Subscribe', 'Demo', 'Admin'));

-- Default role = Demo (sesuai handle_new_user terbaru)
alter table profiles alter column role set default 'Demo';

-- ─── LANGKAH 3: Tabel PETS ───────────────────────────────────────────
create table if not exists pets (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references auth.users on delete cascade not null,
  name       text not null,
  species    text not null default 'Kucing',
  breed      text not null default '',
  age        text default '1',
  weight     text default '1',
  gender     text default 'Jantan',
  color      text default '',
  notes      text default '',
  created_at timestamptz default now()
);

-- ─── LANGKAH 4: Tabel SCHEDULES ──────────────────────────────────────
create table if not exists schedules (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references auth.users on delete cascade not null,
  pet_id     uuid references pets on delete cascade not null,
  type       text not null default 'Makan',
  title      text not null,
  date       date not null,
  time       time not null default '08:00',
  notes      text default '',
  done       boolean default false,
  created_at timestamptz default now()
);

-- ─── LANGKAH 5: Tabel MEDICAL_RECORDS ────────────────────────────────
create table if not exists medical_records (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references auth.users on delete cascade not null,
  pet_id     uuid references pets on delete cascade not null,
  date       date not null,
  type       text not null default 'Pemeriksaan',
  title      text not null,
  doctor     text default '',
  clinic     text default '',
  weight     text default '',
  temp       text default '',
  notes      text default '',
  next_visit date,
  created_at timestamptz default now()
);

-- ─── LANGKAH 6: Tabel NOTIFICATIONS ──────────────────────────────────
create table if not exists notifications (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references auth.users on delete cascade not null,
  pet_id     uuid references pets on delete set null,
  text       text not null,
  type       text default 'info',
  unread     boolean default true,
  created_at timestamptz default now()
);

-- ─── LANGKAH 7: Tabel MONITORING (IoT + kolom battery) ───────────────
create table if not exists monitoring (
  id             uuid default uuid_generate_v4() primary key,
  pet_id         uuid references pets on delete cascade,
  device_id      text default 'esp32-01',
  mode           text default 'kalung',
  suhu           numeric(5,2),
  heart_rate     numeric(6,2),
  spo2           numeric(5,2),
  ax             integer,
  ay             integer,
  az             integer,
  created_at     timestamptz default now()
);

-- Kolom battery (dibutuhkan MonitorPage.jsx)
alter table monitoring
  add column if not exists battery_level  numeric(5,2),
  add column if not exists battery_status text default 'unknown';

-- Index monitoring
create index if not exists monitoring_pet_id_idx    on monitoring(pet_id, created_at desc);
create index if not exists monitoring_created_at_idx on monitoring(created_at desc);
create index if not exists monitoring_battery_level_idx on monitoring(battery_level);

-- ─── LANGKAH 8: Tabel DEVICE_COMMANDS (hibernasi ESP32) ──────────────
create table if not exists device_commands (
  id            uuid default uuid_generate_v4() primary key,
  pet_id        uuid references pets on delete cascade,
  device_id     text not null,
  command       text not null,     -- 'hibernate' | 'resume' | 'restart'
  status        text default 'pending',  -- 'pending' | 'executed' | 'failed'
  payload       jsonb default '{}',
  created_at    timestamptz default now(),
  executed_at   timestamptz,
  error_message text
);

create index if not exists device_commands_device_id_idx on device_commands(device_id, created_at desc);
create index if not exists device_commands_pet_id_idx    on device_commands(pet_id);
create index if not exists device_commands_status_idx    on device_commands(status);

-- ─── LANGKAH 9: Fungsi & Trigger updated_at ──────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- ─── LANGKAH 10: Fungsi handle_new_user (trigger signup) ─────────────
-- Default role = Demo, ON CONFLICT aman untuk re-run
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    'Demo'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── LANGKAH 11: Row Level Security ──────────────────────────────────
alter table profiles       enable row level security;
alter table pets           enable row level security;
alter table schedules      enable row level security;
alter table medical_records enable row level security;
alter table notifications  enable row level security;
alter table monitoring     enable row level security;
alter table device_commands enable row level security;

-- ── Bersihkan semua policy profiles lama ─────────────────────────────
drop policy if exists "profiles: own"                         on profiles;
drop policy if exists "Users can view own profile."           on profiles;
drop policy if exists "Users can update own profile."         on profiles;
drop policy if exists "Users can insert own profile."         on profiles;
drop policy if exists "Admin can read all profiles"           on profiles;
drop policy if exists "Admin can update any profile role"     on profiles;
drop policy if exists "Enable read for users based on user_id" on profiles;
drop policy if exists "Enable insert for authenticated users only" on profiles;
drop policy if exists "Enable update for users based on user_id"   on profiles;
drop policy if exists "profiles_select_policy"               on profiles;
drop policy if exists "profiles_insert_policy"               on profiles;
drop policy if exists "profiles_update_policy"               on profiles;

-- SELECT: user baca milik sendiri ATAU Admin baca semua
create policy "profiles_select_policy" on profiles
  for select using (
    auth.uid() = id
    or (select role from profiles where id = auth.uid()) = 'Admin'
  );

-- INSERT: trigger signup (service_role) yang insert
create policy "profiles_insert_policy" on profiles
  for insert with check (auth.uid() = id);

-- UPDATE: user update profil sendiri ATAU Admin update siapa saja
create policy "profiles_update_policy" on profiles
  for update using (
    auth.uid() = id
    or (select role from profiles where id = auth.uid()) = 'Admin'
  );

-- ── Policies tabel lain ───────────────────────────────────────────────
drop policy if exists "pets: own" on pets;
create policy "pets: own" on pets
  for all using (auth.uid() = user_id);

drop policy if exists "schedules: own" on schedules;
create policy "schedules: own" on schedules
  for all using (auth.uid() = user_id);

drop policy if exists "medical_records: own" on medical_records;
create policy "medical_records: own" on medical_records
  for all using (auth.uid() = user_id);

drop policy if exists "notifications: own" on notifications;
create policy "notifications: own" on notifications
  for all using (auth.uid() = user_id);

-- Monitoring: ESP32 insert tanpa login, user baca pet miliknya
drop policy if exists "monitoring: insert anon" on monitoring;
create policy "monitoring: insert anon"
  on monitoring for insert
  to anon, authenticated
  with check (true);

drop policy if exists "monitoring: select own pets" on monitoring;
create policy "monitoring: select own pets"
  on monitoring for select
  to authenticated
  using (
    pet_id is null
    or pet_id in (select id from pets where user_id = auth.uid())
  );

drop policy if exists "monitoring: delete own pets" on monitoring;
create policy "monitoring: delete own pets"
  on monitoring for delete
  to authenticated
  using (
    pet_id in (select id from pets where user_id = auth.uid())
  );

-- Device commands: user hanya untuk pet miliknya
drop policy if exists "device_commands: insert own pets" on device_commands;
create policy "device_commands: insert own pets"
  on device_commands for insert
  to authenticated
  with check (
    pet_id in (select id from pets where user_id = auth.uid())
  );

drop policy if exists "device_commands: select own pets" on device_commands;
create policy "device_commands: select own pets"
  on device_commands for select
  to authenticated
  using (
    pet_id in (select id from pets where user_id = auth.uid())
  );

-- ─── LANGKAH 12: Realtime ────────────────────────────────────────────
-- (Abaikan error "already member" — itu normal jika sudah aktif)
alter publication supabase_realtime add table monitoring;
alter publication supabase_realtime add table device_commands;

-- ─── LANGKAH 13: Migrasi data existing (role lama 'Basic' → 'Subscribe') ──
update profiles
set role = 'Subscribe'
where role = 'Basic' or role is null;

-- ─── LANGKAH 14: Set Admin pertama ───────────────────────────────────
-- GANTI UUID di bawah dengan UUID akun Admin Anda, lalu uncomment:
-- update profiles set role = 'Admin' where id = 'GANTI-DENGAN-UUID-ANDA';

-- ─── VERIFIKASI: Cek semua tabel & kolom penting ─────────────────────
select
  table_name,
  string_agg(column_name, ', ' order by ordinal_position) as kolom
from information_schema.columns
where table_schema = 'public'
  and table_name in ('profiles','pets','schedules','medical_records','notifications','monitoring','device_commands')
group by table_name
order by table_name;

-- =====================================================================
-- SELESAI! Semua tabel, kolom, RLS, dan trigger sudah sinkron.
-- =====================================================================
