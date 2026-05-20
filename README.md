# PetCare+ IoT Monitor

Sistem pemantauan kesehatan hewan peliharaan berbasis ESP32 + Supabase.

## Firmware v4.0 — Deep Sleep + Batch Upload

### Pembagian Waktu Operasional

| Fase | Interval | WiFi |
|------|----------|------|
| Bangun & Baca Sensor | Setiap 1 menit | ❌ Mati |
| Batch Upload ke Supabase | Setiap 15 menit (15 data) | ✅ Nyala |

**Siklus Bangun & Membaca Sensor (tiap 1 menit):**
1. ESP32 bangun dari Deep Sleep (<3 detik)
2. Baca semua sensor: suhu (MLX90614), detak jantung + SpO2 (MAX30102), gerak (MPU-6050), baterai
3. Simpan ke buffer RTC RAM (bertahan selama Deep Sleep)
4. WiFi tetap mati → langsung tidur kembali

**Siklus Pengiriman Batch (tiap 15 menit):**
1. Setelah 15 data terkumpul, hidupkan WiFi
2. Kirim 15 baris sekaligus dalam 1 HTTP POST (JSON array)
3. Polling perintah dari web (hibernate / resume / restart)
4. Buffer dikosongkan → WiFi dimatikan → siklus ulang

### Hardware

- ESP32 ESP-32S Dev Board
- MAX30102 — Heart Rate + SpO2 (I2C 0x57)
- MLX90614 — Suhu Inframerah (I2C 0x5A)
- MPU-6050 — Akselerometer (I2C 0x68)
- Reed Switch — Mode kandang/kalung (GPIO 33)
- LED RGB 4-pin (GPIO 27, 14, 12)
- Li-Po 3.7V + TP4056

### Library Arduino

- SparkFun MAX3010x Pulse and Proximity Sensor
- Adafruit MLX90614
- MPU6050 (Electronic Cats)
- ArduinoJson (v6/v7)

### Wiring

```
I2C Bus: SDA → GPIO 21, SCL → GPIO 22
Reed Switch: GPIO 33 (INPUT_PULLUP)
LED: R=GPIO27, G=GPIO14, B=GPIO12 (via 220Ω)
Battery ADC: GPIO 34
TP4056: CHRG=GPIO35, STDBY=GPIO32
```

### Setup Web App

```bash
cp .env.example .env
# Isi REACT_APP_SUPABASE_URL dan REACT_APP_SUPABASE_ANON_KEY
npm install
npm start
```

### Database

Jalankan file SQL di Supabase SQL Editor sesuai urutan:
1. `supabase_schema.sql`
2. `device_commands_migration.sql`
3. `role_migration.sql`
4. `streak_migration.sql`
5. `SYNC_DATABASE_FIX.sql` (jika ada masalah sinkronisasi)
