# PetCare+ Web App

Aplikasi monitoring kesehatan hewan peliharaan berbasis IoT.

## Versi

**Web App**: v3.0 — disesuaikan dengan firmware ESP32 v3.0

## Hardware ESP32 (Firmware v3.0)

- ESP32 ESP-32S Dev Board
- **MAX30102** — Heart Rate + SpO₂ (I2C 0x57)
- MLX90614 — Suhu Inframerah (I2C 0x5A)
- MPU-6050 — Akselerometer (I2C 0x68)
- Reed Switch — Deteksi mode kandang/kalung
- LED RGB 4-pin (Common Cathode)
- Li-Po 3.7V + TP4056 Charging Module

## Perubahan v3.0

### Web App
- ✅ `generateDemoMonitoring`: tambah `battery_level`, `battery_status`, `device_id`; mode `'kalung'`/`'kandang'` (bukan `'normal'`)
- ✅ `HibernationControl.jsx`: status `'failed'` → `'error'` sesuai constraint SQL
- ✅ `api.js getCalculated`: select + return field `battery_level`, `battery_status`
- ✅ `fetchAllIot` Demo mode: sertakan `latest_battery_level`, `latest_battery_status`, `avg_battery_level`
- ✅ `MonitorPage.jsx`: terima prop `profile`; fetchData dengan Demo mode simulasi baterai

### Firmware ESP32
- MAX30102 (SpO₂ + HR) menggantikan MAX30100
- LED RGB 4-pin (R/G/B) menggantikan LED tunggal
- Battery monitoring via ADC + TP4056 CHRG/STDBY pins
- Kirim field: `battery_level`, `battery_status`
- Command polling: hibernate / resume / restart

## Setup

1. Jalankan `SYNC_DATABASE_FIX.sql` di Supabase SQL Editor
2. Flash `esp32/esp32_iot_monitoring.ino` ke ESP32
3. `npm install && npm start`

## Library Arduino (v3.0)

- SparkFun MAX3010x Pulse and Proximity Sensor
- Adafruit MLX90614
- MPU6050 (Electronic Cats)
- ArduinoJson (v6/v7)
