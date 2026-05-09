# 🔋 PetCare+ — Battery Monitoring Guide

## Fitur Baru: Pemantauan Daya Baterai IoT

Penambahan fitur **Battery Monitoring** memungkinkan Anda untuk memantau status daya perangkat ESP32 secara real-time melalui web dashboard. Dengan ini, Anda dapat:

✅ Memantau level baterai secara real-time (0-100%)  
✅ Menerima alert ketika baterai rendah atau kritis  
✅ Mengoptimalkan daya dengan fitur **Hibernasi** (sleep mode)  
✅ Melihat grafik histori penggunaan baterai  
✅ LED indikator di ESP32 menunjukkan status daya (merah berkedip = kritis)

---

## Komponen Implementasi

### 1. **Backend (Supabase)**

#### Tabel `monitoring` — Tambah Kolom Baterai
```sql
-- Kolom baru di tabel monitoring:
battery_level numeric(5,2)    -- Level 0-100%
battery_status text           -- full, charging, discharging, low, critical
```

Jalankan migration:
```bash
# Di Supabase Dashboard > SQL Editor:
# Copy isi file: supabase_schema_battery_migration.sql
```

#### Tabel `device_commands` — Untuk Hibernasi
```sql
-- Tabel baru untuk control perangkat:
id uuid                    -- primary key
pet_id uuid               -- FK ke pets
device_id text            -- identitas ESP32
command text              -- 'hibernate', 'resume', 'restart'
payload jsonb             -- {"duration_minutes": 30}
status text               -- pending, executed, error
```

---

### 2. **Hardware (ESP32 + Sensor Baterai)**

#### Wiring Baterai

```
Jika menggunakan **LiPo Battery 3.7V - 4.2V**:

    LiPo +   ──── [R1: 100kΩ] ──── GPIO 34 (ADC)
                       │
    LiPo GND ──── [R2: 100kΩ] ──── GND
                       │
                    [probe ke GPIO 34]

Catatan:
- Voltage divider 1:1 (100k:100k) → max input ~6.6V (aman untuk 4.2V LiPo)
- GPIO 34 adalah ADC1_CH6 (12-bit, 0-4095)
```

#### Calibration Points

```cpp
// File: esp32_iot_monitoring.ino

#define BATTERY_MIN_VOLTAGE 3.0   // 0% discharge
#define BATTERY_MAX_VOLTAGE 4.2   // 100% full charge
#define BATTERY_CRITICAL    10    // % — alert level
#define BATTERY_LOW         20    // % — caution level
```

---

### 3. **Firmware (ESP32)**

#### Setup ADC
```cpp
void setup() {
  // ADC setup untuk battery
  analogSetAttenuation(ADC_11db);  // Full scale 3.3V
  analogReadResolution(12);        // 12-bit (0-4095)
  
  pinMode(BATTERY_PIN, INPUT);
}
```

#### Read Battery Voltage
```cpp
BatteryInfo bacaBaterai() {
  int rawValue = analogRead(BATTERY_PIN);  // 0-4095
  
  // Convert to voltage (with voltage divider 1:1)
  float voltage = (rawValue / 4095.0) * 3.3 * 2.0;
  
  // Calculate percentage (linear)
  float percent = ((voltage - 3.0) / (4.2 - 3.0)) * 100.0;
  
  // Determine status
  String status = percent >= 95 ? "full"
                : percent > 20  ? "discharging"
                : percent > 10  ? "low"
                : "critical";
  
  return {percent, status};
}
```

#### Send Battery Data
```cpp
void loop() {
  BatteryInfo battery = bacaBaterai();
  
  // Include in JSON:
  doc["battery_level"]  = round(battery.level * 100.0) / 100.0;
  doc["battery_status"] = battery.status;
  
  // kirimData(..., battery.level, battery.status);
}
```

#### LED Indicator for Battery Status
```cpp
void updateLEDStatus(String batteryStatus, float batteryLevel) {
  // Critical (< 10%) → LED merah berkedip cepat
  if (batteryStatus == "critical") {
    digitalWrite(LED_RED, blinkState ? HIGH : LOW);  // 250ms blink
    digitalWrite(LED_GREEN, LOW);
  }
  // Low (< 20%) → LED merah terus
  else if (batteryStatus == "low") {
    digitalWrite(LED_RED, HIGH);
    digitalWrite(LED_GREEN, LOW);
  }
  // Normal → Mode sesuai kandang/kalung
  else {
    digitalWrite(LED_RED, isCageMode ? HIGH : LOW);
    digitalWrite(LED_GREEN, isCageMode ? LOW : HIGH);
  }
}
```

---

### 4. **Frontend (React)**

#### Battery Status Card di Monitor Page

```jsx
{batteryPercent != null && (
  <div className={`rounded-3xl p-5 border ${
    batteryPercent < 10 ? 'bg-rose-50 border-rose-200' :
    batteryPercent < 20 ? 'bg-amber-50 border-amber-200' :
    'bg-emerald-50 border-emerald-200'
  }`}>
    
    {/* Battery Icon + Percentage */}
    <div className="flex items-center justify-between">
      <span className="text-3xl">{batteryIcon}</span>
      <span className="text-2xl font-black">{batteryPercent.toFixed(0)}%</span>
    </div>
    
    {/* Progress Bar */}
    <div className="w-full h-3 bg-slate-200 rounded-full mt-3">
      <div 
        className={`h-full ${batteryColor}`}
        style={{ width: `${batteryPercent}%` }}
      />
    </div>
    
    {/* Warning Alert */}
    {batteryPercent < 10 && (
      <div className="mt-3 p-3 bg-rose-100 text-rose-700">
        ⚡ Baterai kritis! Segera isi atau aktifkan hibernasi.
      </div>
    )}
  </div>
)}
```

#### Hibernasi Control Modal
- **Input**: Durasi hibernasi (5-120 menit)
- **Output**: Kirim perintah ke ESP32 via `device_commands` table
- **Status**: Monitor eksekusi real-time via Supabase subscription
- **Button Aksi**: Hibernate / Resume (bangunkan)

---

## Integrasi Lengkap — Langkah demi Langkah

### Step 1: Database Migration
```bash
# Jalankan di Supabase Dashboard > SQL Editor
# File: supabase_schema_battery_migration.sql
```

### Step 2: Update Firmware ESP32
```bash
# 1. Copy file terbaru: esp32/esp32_iot_monitoring.ino
# 2. Update konfigurasi:
const char* PET_ID = "uuid-pet-dari-supabase";

# 3. Upload ke ESP32
# 4. Monitor Serial Output:
[Battery] Raw: 2048 | Voltage: 4.15V | Level: 95.0% | Status: full
```

### Step 3: Update Web React
```bash
# Sudah include di src/components/MonitorPage.jsx
# Tampilkan battery card + hibernation button
```

### Step 4: Verifikasi
1. Buka halaman Monitor IoT
2. Pilih pet dengan ESP32
3. Lihat **Battery Status Card** menampilkan persentase & status
4. Test hibernasi dengan duration 5 menit
5. Cek Serial ESP32 untuk debug

---

## Status Baterai — Penjelasan

| Level | Status | Indikator | Aksi |
|-------|--------|-----------|------|
| 0-10% | Critical | 🪫 Merah berkedip | Isi ulang segera |
| 10-20% | Low | ⚠️ Merah terus | Isi atau hibernasi |
| 20-80% | Discharging | 🔋 Normal | Monitor biasa |
| 80-100% | Full | 🔋 Penuh | Bagus |

---

## Hibernasi — Power Saving

### Apa itu Hibernasi?
Mode tidur yang mengurangi frekuensi pengiriman data dari **5-15 detik** menjadi **60+ detik**, hemat energi **hingga 60%**.

### Kapan Gunakan?
- ✅ Saat hewan sedang tidur
- ✅ Baterai mulai rendah
- ✅ Perjalanan panjang tanpa charger

### Cara Aktifkan
1. Buka halaman Monitor IoT
2. Klik tombol **Hibernasi** (petir)
3. Set durasi (5-120 menit)
4. Klik **Hibernasi Sekarang**
5. LED akan indikasi status

### Cara Keluar Hibernasi
1. Klik tombol **Bangunkan** setelah hibernasi aktif
2. Atau tunggu waktu durasi habis (auto resume)
3. ESP32 kembali mode normal

---

## Troubleshooting

| Masalah | Solusi |
|--------|--------|
| Battery tidak muncul di web | Pastikan kolom `battery_level` & `battery_status` sudah di-migrate |
| Nilai battery selalu 0% | Cek wiring voltage divider, test dengan multimeter |
| ESP32 tidak kirim battery data | Cek firmware v2.1, pastikan `bacaBaterai()` dipanggil di loop |
| Hibernasi tidak execute | Pastikan tabel `device_commands` ada & RLS policy sudah aktif |
| LED tidak berkedip saat kritis | Cek pin LED_RED (GPIO 12) & resistor 220Ω |

---

## Referensi Tegangan Baterai

### LiPo 1S (3.7V nominal)
- **Min (0%)**: 3.0V
- **Max (100%)**: 4.2V
- **Safe Range**: 3.0V - 4.2V

### Calibration Test
```cpp
// Di Serial Monitor, catat nilai raw vs voltage:
[Battery] Raw: 0    | Voltage: 0.00V   | Level: 0%
[Battery] Raw: 2048 | Voltage: 4.15V   | Level: 95%
[Battery] Raw: 4095 | Voltage: 6.60V   | Level: 100% (capped)
```

---

## API Endpoints (Supabase)

### Insert Monitoring dengan Battery
```bash
POST /rest/v1/monitoring
{
  "pet_id": "uuid",
  "device_id": "esp32-01",
  "suhu": 38.5,
  "heart_rate": 72,
  "spo2": 97,
  "ax": 100, "ay": 50, "az": 25,
  "battery_level": 85.5,
  "battery_status": "discharging"
}
```

### Query Battery History
```sql
SELECT battery_level, battery_status, created_at
FROM monitoring
WHERE pet_id = 'uuid'
ORDER BY created_at DESC
LIMIT 20;
```

---

## File yang Berubah

✅ `supabase_schema.sql` �� Updated with battery columns  
✅ `supabase_schema_battery_migration.sql` — Migration script  
✅ `esp32/esp32_iot_monitoring.ino` — v2.1 dengan battery ADC  
✅ `src/components/MonitorPage.jsx` — Battery card display  
✅ `src/components/HibernationControl.jsx` — Hibernasi modal  

---

## Versi & Timeline

- **v2.0** (Original): Sensor suhu, detak jantung, SpO2, akselerasi
- **v2.1** (Current): + Battery monitoring + Hibernasi control
- **v2.2** (Future): Power consumption analytics, remote command queue, etc.

---

**Happy Monitoring! 🐾⚡**

