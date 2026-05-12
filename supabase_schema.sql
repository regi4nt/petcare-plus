-- =====================================================
-- PetCare+ Supabase Schema — Terintegrasi IoT
-- Jalankan di: Supabase Dashboard > SQL Editor
-- =====================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES ──────────────────────────────────────
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null default '',
  phone text default '',
  role text default 'Subscribe' check (role in ('Subscribe', 'Demo', 'Admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- ─── PETS ──────────────────────────────────────────
create table if not exists pets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  species text not null default 'Kucing',
  breed text not null default '',
  age text default '1',
  weight text default '1',
  gender text default 'Jantan',
  color text default '',
  notes text default '',
  created_at timestamptz default now()
);

-- ─── SCHEDULES ─────────────────────────────────────
create table if not exists schedules (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  pet_id uuid references pets on delete cascade not null,
  type text not null default 'Makan',
  title text not null,
  date date not null,
  time time not null default '08:00',
  notes text default '',
  done boolean default false,
  created_at timestamptz default now()
);

-- ─── MEDICAL RECORDS ───────────────────────────────
create table if not exists medical_records (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  pet_id uuid references pets on delete cascade not null,
  date date not null,
  type text not null default 'Pemeriksaan',
  title text not null,
  doctor text default '',
  clinic text default '',
  weight text default '',
  temp text default '',
  notes text default '',
  next_visit date,
  created_at timestamptz default now()
);

-- ─── NOTIFICATIONS ─────────────────────────────────
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  pet_id uuid references pets on delete set null,
  text text not null,
  type text default 'info',
  unread boolean default true,
  created_at timestamptz default now()
);

-- ─── MONITORING (IoT) ──────────────────────────────
-- Data dikirim langsung dari ESP32 ke tabel ini.
-- pet_id diisi di firmware ESP32 (UUID pet yang dipantau).
create table if not exists monitoring (
  id uuid default uuid_generate_v4() primary key,
  pet_id uuid references pets on delete cascade,        -- FK ke pets (set di firmware ESP32)
  device_id text default 'esp32-01',                    -- Identifikasi perangkat
  mode text default 'kalung',                           -- 'kalung' atau 'kandang'
  suhu numeric(5,2),                                    -- Suhu tubuh (°C) dari MLX90614
  heart_rate numeric(6,2),                              -- Detak jantung (BPM)
  spo2 numeric(5,2),                                    -- Saturasi O2 (%)
  ax integer,                                           -- Akselerasi X dari MPU6050
  ay integer,                                           -- Akselerasi Y dari MPU6050
  az integer,                                           -- Akselerasi Z dari MPU6050
  created_at timestamptz default now()
);

-- Index untuk query cepat per pet
create index if not exists monitoring_pet_id_idx on monitoring(pet_id, created_at desc);
create index if not exists monitoring_created_at_idx on monitoring(created_at desc);

-- ─── ROW LEVEL SECURITY ────────────────────────────
alter table profiles enable row level security;
alter table pets enable row level security;
alter table schedules enable row level security;
alter table medical_records enable row level security;
alter table notifications enable row level security;
alter table monitoring enable row level security;

-- Policies: user hanya bisa akses data miliknya sendiri
create policy "profiles: own" on profiles for all using (auth.uid() = id);
create policy "pets: own" on pets for all using (auth.uid() = user_id);
create policy "schedules: own" on schedules for all using (auth.uid() = user_id);
create policy "medical_records: own" on medical_records for all using (auth.uid() = user_id);
create policy "notifications: own" on notifications for all using (auth.uid() = user_id);

-- Policy monitoring:
-- INSERT: boleh dari siapa saja (anon) → ESP32 kirim data tanpa login
-- SELECT: hanya user yang punya pet tersebut
create policy "monitoring: insert anon"
  on monitoring for insert
  to anon, authenticated
  with check (true);

create policy "monitoring: select own pets"
  on monitoring for select
  to authenticated
  using (
    pet_id is null
    or pet_id in (
      select id from pets where user_id = auth.uid()
    )
  );

create policy "monitoring: delete own pets"
  on monitoring for delete
  to authenticated
  using (
    pet_id in (
      select id from pets where user_id = auth.uid()
    )
  );

-- ─── REALTIME ──────────────────────────────────────
-- Aktifkan Realtime untuk tabel monitoring (web langsung update saat ESP32 kirim data)
alter publication supabase_realtime add table monitoring;

-- ─── AUTO CREATE PROFILE ───────────────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    'Subscribe'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── HELPER: Bersihkan data monitoring lama ────────
-- Opsional: jalankan via cron / pg_cron untuk hemat storage
-- delete from monitoring where created_at < now() - interval '30 days';

-- =====================================================
-- SELESAI! Schema lengkap dengan integrasi IoT.
-- =====================================================
