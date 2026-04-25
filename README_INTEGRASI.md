# PetCare+ — Panduan Integrasi Web + Supabase + IoT (ESP32)

## Arsitektur Sistem

```
┌─────────────┐     POST /rest/v1/monitoring      ┌──────────────────┐
│   ESP32     │ ──────────────────────────────────▶│                  │
│  (Firmware) │       anon key, no login           │    SUPABASE      │
└─────────────┘                                    │  (satu database) │
                                                   │                  │
┌─────────────┐     Supabase Auth + REST + RT  ◀──│  - auth.users    │
│  Web React  │ ◀─────────────────────────────────│  - profiles      │
│  (Browser)  │       authenticated user           │  - pets          │
└─────────────┘                                    │  - schedules     │
                                                   │  - medical_recs  │
                                                   │  - notifications │
                                                   │  - monitoring ◀──┤ IoT
                                                   └──────────────────┘
```

**Data IoT dikirim langsung dari ESP32 ke Supabase** — tidak perlu backend/server terpisah.  
**Web React** membaca data dari Supabase dengan Realtime subscription — update otomatis saat ESP32 kirim data.  
**Login** menggunakan Supabase Auth — satu database, satu akun untuk semua fitur.

---

## Langkah 1 — Setup Supabase

### 1.1 Buat Project Supabase
1. Buka [supabase.com](https://supabase.com) → New Project
2. Catat **Project URL** dan **anon public key** dari Settings → API

### 1.2 Jalankan Schema SQL
1. Buka Supabase Dashboard → **SQL Editor**
2. Copy-paste isi file `supabase_schema.sql` → Run
3. Pastikan semua tabel terbuat: `profiles`, `pets`, `schedules`, `medical_records`, `notifications`, `monitoring`

### 1.3 Aktifkan Realtime (jika belum)
1. Buka Supabase Dashboard → **Database** → **Replication**
2. Pastikan tabel `monitoring` ada di daftar publikasi `supabase_realtime`
3. Atau jalankan SQL: `alter publication supabase_realtime add table monitoring;`

---

## Langkah 2 — Setup Web (React)

### 2.1 Struktur file yang perlu diganti
```
petcare-v2/
├── .env                        ← isi URL & key Supabase
├── supabase_schema.sql         ← schema lengkap (sudah include IoT)
└── src/
    ├── App.js                  ← sudah ada halaman Monitor IoT
    └── lib/
        ├── supabase.js         ← config client Supabase
        └── api.js              ← sudah ada monitoringService
```

### 2.2 Isi file .env
```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2.3 Install & jalankan
```bash
npm install
npm start
```

### 2.4 Fitur halaman "Monitor IoT"
- Pilih pet yang ingin dipantau
- Tampil data terbaru: suhu, detak jantung, SpO₂, akselerasi
- Status mode: **Kalung** (bebas bergerak) atau **Kandang** (terkunci)
- Grafik histori 15 data terakhir
- **Live update** otomatis via Supabase Realtime saat ESP32 kirim data
- Indikator status koneksi ESP32

---

## Langkah 3 — Setup ESP32 (Firmware)

### 3.1 Library yang dibutuhkan (Arduino IDE / PlatformIO)
```
- Adafruit MLX90614 Library
- MPU6050 by Electronic Cats
- ArduinoJson by Benoit Blanchon  ← WAJIB install
- WiFi (built-in ESP32)
- HTTPClient (built-in ESP32)
```

### 3.2 Konfigurasi firmware
Buka file `esp32/esp32_iot_monitoring.ino` dan isi bagian ini:

```cpp
const char* WIFI_SSID         = "NAMA_WIFI_KAMU";
const char* WIFI_PASSWORD     = "PASSWORD_WIFI";
const char* SUPABASE_URL      = "https://your-project-id.supabase.co";
const char* SUPABASE_ANON_KEY = "your-anon-key-here";   // sama dengan .env web
const char* PET_ID            = "uuid-pet-dari-supabase"; // lihat cara di bawah
const char* DEVICE_ID         = "esp32-01";               // bebas, untuk identifikasi
```

### 3.3 Cara mendapatkan PET_ID
1. Login ke web PetCare+
2. Tambahkan hewan peliharaan
3. Buka Supabase Dashboard → Table Editor → tabel `pets`
4. Salin kolom `id` (format UUID) untuk pet yang dipasangi ESP32
5. Paste ke `const char* PET_ID` di firmware

### 3.4 Wiring ESP32
```
MLX90614 & MPU6050 (I2C):
  VCC  → 3.3V
  GND  → GND
  SDA  → GPIO 21
  SCL  → GPIO 22

Magnetic Reed Switch (deteksi mode kandang/kalung):
  Pin 1 → GPIO 26
  Pin 2 → GND
  (LOW = magnet menempel = mode kandang)

LED Indikator:
  LED Hijau (+) → GPIO 14 → GND (via resistor 220Ω)
  LED Merah (+) → GPIO 12 → GND (via resistor 220Ω)
```

### 3.5 Upload & test
1. Upload firmware ke ESP32
2. Buka Serial Monitor (115200 baud)
3. Lihat output — data harus terkirim dengan response HTTP 201
4. Buka halaman Monitor IoT di web → data muncul otomatis

---

## Tabel Monitoring — Struktur

| Kolom        | Tipe         | Deskripsi                              |
|-------------|--------------|----------------------------------------|
| `id`         | uuid         | Primary key (auto)                     |
| `pet_id`     | uuid         | FK ke tabel `pets` (diisi di firmware) |
| `device_id`  | text         | Identitas ESP32 (misal: "esp32-01")    |
| `mode`       | text         | `"kalung"` atau `"kandang"`            |
| `suhu`       | numeric(5,2) | Suhu tubuh hewan dalam °C              |
| `heart_rate` | numeric(6,2) | Detak jantung dalam BPM                |
| `spo2`       | numeric(5,2) | Saturasi oksigen dalam %               |
| `ax`         | integer      | Akselerasi sumbu X (MPU6050)           |
| `ay`         | integer      | Akselerasi sumbu Y (MPU6050)           |
| `az`         | integer      | Akselerasi sumbu Z (MPU6050)           |
| `created_at` | timestamptz  | Waktu data diterima (auto)             |

---

## Row Level Security (RLS) — Ringkasan

| Operasi          | Siapa             | Aturan                                     |
|-----------------|-------------------|--------------------------------------------|
| INSERT monitoring | anon (ESP32)    | Boleh semua — ESP32 tidak perlu login      |
| SELECT monitoring | authenticated   | Hanya pet milik user yang login            |
| DELETE monitoring | authenticated   | Hanya pet milik user yang login            |
| Semua tabel lain  | authenticated   | Hanya data milik user sendiri              |

---

## Jika Ada >1 ESP32 (Multi-perangkat)

Cukup ganti `DEVICE_ID` dan `PET_ID` di masing-masing firmware:
```cpp
// ESP32 untuk kucing
const char* PET_ID    = "uuid-kucing";
const char* DEVICE_ID = "esp32-kucing";

// ESP32 untuk anjing
const char* PET_ID    = "uuid-anjing";
const char* DEVICE_ID = "esp32-anjing";
```

Kedua perangkat kirim ke endpoint yang sama — Supabase otomatis pisahkan per `pet_id`.

---

## Troubleshooting

| Masalah | Solusi |
|--------|--------|
| HTTP 401 dari ESP32 | Cek `SUPABASE_ANON_KEY` sudah benar |
| HTTP 403 dari ESP32 | Cek RLS policy "monitoring: insert anon" sudah dibuat |
| Data tidak muncul di web | Cek `PET_ID` di firmware sesuai dengan UUID pet di database |
| Realtime tidak update | Pastikan tabel `monitoring` sudah di-enable di Supabase Realtime |
| ESP32 gagal konek WiFi | Cek SSID/password, ESP32 hanya support 2.4GHz |
