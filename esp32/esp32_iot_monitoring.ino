/*
  ============================================================
  PetCare+ IoT Monitor — ESP32 Firmware v3.0
  ============================================================
  Hardware:
    - ESP32 ESP-32S Dev Board (AIFRobotic)
    - MAX30102   : Heart Rate + SpO2  (I2C 0x57)
    - MLX90614   : Suhu Inframerah    (I2C 0x5A)
    - MPU-6050   : Akselerometer      (I2C 0x68)
    - Reed Switch: Deteksi mode kandang/kalung
    - LED 4-pin  : RGB indicator (common cathode)
    - Li-Po 3.7V : Baterai via ADC
    - TP4056     : Charging module (pin CHRG + STDBY)

  WIRING:
  ┌─────────────────────────────────────────────────────┐
  │ I2C Bus (shared MLX90614 + MPU-6050 + MAX30102)     │
  │   SDA → GPIO 21                                     │
  │   SCL → GPIO 22                                     │
  │   VCC → 3.3V    GND → GND                          │
  ├─────────────────────────────────────────────────────┤
  │ Magnetic Reed Switch                                │
  │   Pin 1 → GPIO 33 (INPUT_PULLUP)                   │
  │   Pin 2 → GND                                      │
  │   LOW = magnet menempel = mode kandang              │
  ├─────────────────────────────────────────────────────┤
  │ LED 4-pin RGB (Common Cathode)                      │
  │   R → GPIO 27 (via resistor 220Ω)                  │
  │   G → GPIO 14 (via resistor 220Ω)                  │
  │   B → GPIO 12 (via resistor 220Ω)                  │
  │   GND (common) → GND                               │
  │                                                     │
  │ Jika Common Anode: hubungkan common ke 3.3V,        │
  │ ubah logika: HIGH=OFF, LOW=ON                       │
  ├─────────────────────────────────────────────────────┤
  │ Battery Li-Po 3.7V                                  │
  │   BAT+ → [R1: 100kΩ] → GPIO 34 (ADC)              │
  │                      → [R2: 100kΩ] → GND           │
  │   (Voltage divider 1:1, max input ~2.1V = aman)    │
  ├─────────────────────────────────────────────────────┤
  │ TP4056 Charging Module                              │
  │   CHRG  → GPIO 35 (INPUT_PULLUP, LOW = charging)  │
  │   STDBY → GPIO 32 (INPUT_PULLUP, LOW = penuh)     │
  │   (Opsional — bisa tidak disambung)                │
  └─────────────────────────────────────────────────────┘

  LIBRARY (install via Arduino Library Manager):
    - SparkFun MAX3010x Pulse and Proximity Sensor (oleh SparkFun)
    - Adafruit MLX90614                           (oleh Adafruit)
    - MPU6050                                     (oleh Electronic Cats)
    - ArduinoJson                                 (oleh Benoit Blanchon, v6/v7)

  CATATAN MAX30102:
    Library SparkFun MAX3010x mendukung MAX30102 dan MAX30105.
    MAX30102 hanya punya Red + IR LED (tidak ada Green).
    SpO2 dihitung dari rasio Red/IR menggunakan algoritma bawaan library.
  ============================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <ArduinoJson.h>

#include <Adafruit_MLX90614.h>
#include <MPU6050.h>
#include "MAX30105.h"         // SparkFun MAX3010x library (support MAX30102)
#include "spo2_algorithm.h"   // Algoritma SpO2 bawaan SparkFun
#include "heartRate.h"        // Algoritma BPM bawaan SparkFun

#include <esp_task_wdt.h>

// ═══════════════════════════════════════════════════════════
//  KONFIGURASI — WAJIB DIISI
// ═══════════════════════════════════════════════════════════

const char* WIFI_SSID         = "Jupri";
const char* WIFI_PASSWORD     = "pondokmarhen";

const char* SUPABASE_URL      = "https://vpytcguxghpvvsrqdsoc.supabase.co";
const char* SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZweXRjZ3V4Z2hwdnZzcnFkc29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTIzMTIsImV4cCI6MjA5MjY4ODMxMn0.-98m71uyb_Uf1x7VC1LM6Q6dPlja-FDuQQl0wXOqfTQ";

const char* PET_ID            = "57bed84e-303d-4dda-9d2b-357f97284562";
const char* DEVICE_ID         = "esp32-01";

// ═══════════════════════════════════════════════════════════
//  PIN DEFINITION
// ═══════════════════════════════════════════════════════════

#define SDA_PIN       21
#define SCL_PIN       22

#define REED_PIN      33    // Magnetic Reed Switch (INPUT_PULLUP)

// LED 4-pin RGB — Common Cathode (HIGH = nyala)
// Jika common ANODE: ganti semua HIGH↔LOW di fungsi setLED()
#define LED_R         27
#define LED_G         14
#define LED_B         12

// Battery ADC (input only pin, aman untuk ADC)
#define BATTERY_PIN   34

// TP4056 status pins (opsional)
#define TP4056_CHRG   35    // LOW = sedang charging
#define TP4056_STDBY  32    // LOW = baterai penuh

// ═══════════════════════════════════════════════════════════
//  KONSTANTA
// ═══════════════════════════════════════════════════════════

#define INTERVAL_KALUNG   15000   // 15 detik (mode collar)
#define INTERVAL_KANDANG   5000   // 5 detik  (mode cage, intensif)
#define INTERVAL_HIBERNATE 60000  // 60 detik (hemat daya)
#define INTERVAL_CMD_POLL   5000  // 5 detik polling perintah web

#define BATTERY_MIN_V     3.0f   // 0% discharge
#define BATTERY_MAX_V     4.2f   // 100% full

// MAX30102: jumlah sample untuk kalkulasi SpO2
#define SPO2_SAMPLE_SIZE  100

// Watchdog timeout 30 detik (cukup untuk HTTP request lambat)
#define WDT_TIMEOUT_MS    30000

// ═══════════════════════════════════════════════════════════
//  OBJEK SENSOR
// ═══════════════════════════════════════════════════════════

Adafruit_MLX90614 mlx;
MPU6050           mpu;
MAX30105          particleSensor;   // Library mendukung MAX30102

// ═══════════════════════════════════════════════════════════
//  STATE GLOBAL
// ═══════════════════════════════════════════════════════════

bool isCageMode    = false;
bool isHibernating = false;
bool isCharging    = false;
bool isBattFull    = false;

unsigned long lastSendTime    = 0;
unsigned long lastCmdPollTime = 0;
unsigned long hibernateEnd    = 0;

int  failCount = 0;

// Buffer MAX30102 untuk SpO2 algorithm
uint32_t irBuffer[SPO2_SAMPLE_SIZE];
uint32_t redBuffer[SPO2_SAMPLE_SIZE];
int32_t  spo2Value     = 0;
int8_t   spo2Valid     = 0;
int32_t  heartRateCalc = 0;
int8_t   hrValid       = 0;

// HR ring buffer untuk smoothing BPM
#define BPM_BUFFER_SIZE 4
float bpmBuffer[BPM_BUFFER_SIZE] = {0};
int   bpmIdx  = 0;
long  lastBeat = 0;

// ═══════════════════════════════════════════════════════════
//  STRUCT
// ═══════════════════════════════════════════════════════════

struct BatteryInfo {
  float  level;    // 0–100 %
  String status;   // "full" | "charging" | "discharging" | "low" | "critical"
};

// ═══════════════════════════════════════════════════════════
//  LED RGB HELPER
//  Warna encode status:
//    Hijau         = normal / kalung
//    Biru          = mode kandang
//    Merah         = error / gagal kirim
//    Cyan (G+B)    = charging
//    Putih (R+G+B) = connecting WiFi
//    Kuning (R+G)  = baterai rendah
//    Magenta (R+B) = baterai kritis / hibernasi
//    Semua mati    = idle / deep sleep
// ═══════════════════════════════════════════════════════════

void setLED(bool r, bool g, bool b) {
  // Common Cathode: HIGH = nyala
  // Jika common Anode: ganti HIGH → LOW dan sebaliknya
  digitalWrite(LED_R, r ? HIGH : LOW);
  digitalWrite(LED_G, g ? HIGH : LOW);
  digitalWrite(LED_B, b ? HIGH : LOW);
}

void ledOff()         { setLED(0,0,0); }
void ledGreen()       { setLED(0,1,0); }   // kalung normal
void ledBlue()        { setLED(0,0,1); }   // kandang
void ledRed()         { setLED(1,0,0); }   // error
void ledCyan()        { setLED(0,1,1); }   // charging
void ledYellow()      { setLED(1,1,0); }   // baterai rendah
void ledMagenta()     { setLED(1,0,1); }   // kritis / hibernasi
void ledWhite()       { setLED(1,1,1); }   // connecting

// Kedip sekali (non-blocking versi cepat)
void ledBlink(bool r, bool g, bool b, int ms = 120) {
  setLED(r, g, b);
  delay(ms);
  ledOff();
  delay(ms);
}

// ═══════════════════════════════════════════════════════════
//  WATCHDOG
// ═══════════════════════════════════════════════════════════

void setupWatchdog() {
  esp_task_wdt_deinit();
  esp_task_wdt_config_t cfg = {
    .timeout_ms    = WDT_TIMEOUT_MS,
    .idle_core_mask = (1 << portNUM_PROCESSORS) - 1,
    .trigger_panic  = true
  };
  esp_task_wdt_init(&cfg);
  esp_task_wdt_add(NULL);
}

// ═══════════════════════════════════════════════════════════
//  WiFi
// ═══════════════════════════════════════════════════════════

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.printf("[WiFi] Menghubungkan ke \"%s\"", WIFI_SSID);
  ledWhite();
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int t = 0;
  while (WiFi.status() != WL_CONNECTED && t < 24) {
    delay(500);
    esp_task_wdt_reset();
    Serial.print(".");
    t++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] Terhubung ✓ IP: %s\n", WiFi.localIP().toString().c_str());
    ledBlink(0,1,0, 100); ledBlink(0,1,0, 100);  // kedip hijau 2x = connected
    failCount = 0;
  } else {
    Serial.println("\n[WiFi] Gagal.");
    ledBlink(1,0,0, 200);
  }
}

// ═══════════════════════════════════════════════════════════
//  SENSOR: MLX90614 — Suhu
// ═══════════════════════════════════════════════════════════

float bacaSuhu() {
  float s = mlx.readObjectTempC();
  if (isnan(s) || s < 10.0f || s > 50.0f) {
    Serial.println("[WARN] Suhu MLX90614 tidak valid, pakai 38.5°C");
    return 38.5f;
  }
  return roundf(s * 100.0f) / 100.0f;
}

// ═══════════════════════════════════════════════════════════
//  SENSOR: MAX30102 — Heart Rate real-time (interrupt-free)
//  Membaca ~4 sample baru per panggilan, deteksi beat, rata-rata BPM
// ═══════════════════════════════════════════════════════════

float bacaHeartRate() {
  // Baca beberapa sample baru yang tersedia di FIFO MAX30102
  // (FIFO punya buffer ~32 sample, aman dipanggil tiap loop)
  byte nSamples = particleSensor.available();
  if (nSamples == 0) {
    particleSensor.check();   // Minta sensor isi ulang FIFO
    nSamples = particleSensor.available();
  }

  float bpm = 0;
  for (byte i = 0; i < nSamples; i++) {
    long ir = particleSensor.getIR();
    particleSensor.nextSample();

    // Jika IR < threshold, jari tidak terpasang
    if (ir < 50000) continue;

    if (checkForBeat(ir)) {
      long now   = millis();
      long delta = now - lastBeat;
      lastBeat   = now;

      if (delta > 300 && delta < 2000) {    // filter 30–200 BPM
        float newBpm = 60000.0f / (float)delta;
        // Masukkan ke ring buffer
        bpmBuffer[bpmIdx % BPM_BUFFER_SIZE] = newBpm;
        bpmIdx++;
      }
    }
  }

  // Rata-rata dari ring buffer (abaikan nilai 0)
  float sum = 0; int cnt = 0;
  for (int i = 0; i < BPM_BUFFER_SIZE; i++) {
    if (bpmBuffer[i] > 0) { sum += bpmBuffer[i]; cnt++; }
  }

  if (cnt > 0) bpm = sum / cnt;
  if (bpm < 30 || bpm > 220) bpm = 0;   // 0 = tidak valid / jari tidak ada

  return roundf(bpm * 10.0f) / 10.0f;
}

// ═══════════════════════════════════════════════════════════
//  SENSOR: MAX30102 — SpO2
//  Menggunakan SparkFun spo2_algorithm (sampling blok 100 data)
//  Dipanggil lebih jarang (hanya saat interval kirim tiba)
// ═══════════════════════════════════════════════════════════

float bacaSpO2() {
  Serial.print("[SpO2] Mengambil 100 sample...");

  // Kumpulkan 100 sample Red + IR
  for (int i = 0; i < SPO2_SAMPLE_SIZE; i++) {
    // Tunggu data baru tersedia
    while (!particleSensor.available()) {
      particleSensor.check();
    }
    redBuffer[i] = particleSensor.getRed();
    irBuffer[i]  = particleSensor.getIR();
    particleSensor.nextSample();

    if (i % 25 == 0) {
      esp_task_wdt_reset();   // Reset watchdog saat loop panjang
      Serial.print(".");
    }
  }

  // Jalankan algoritma SpO2 SparkFun
  maxim_heart_rate_and_oxygen_saturation(
    irBuffer, SPO2_SAMPLE_SIZE, redBuffer,
    &spo2Value, &spo2Valid, &heartRateCalc, &hrValid
  );

  Serial.printf(" selesai. SpO2: %d (%s)\n",
    spo2Value, spo2Valid ? "valid" : "tidak valid");

  if (!spo2Valid || spo2Value < 70 || spo2Value > 100) {
    return 0;   // 0 = tidak ada jari / tidak valid
  }

  return (float)spo2Value;
}

// ═══════════════════════════════════════════════════════════
//  SENSOR: Baterai (ADC + TP4056)
// ═══════════════════════════════════════════════════════════

BatteryInfo bacaBaterai() {
  // Rata-rata 16 sample ADC untuk stabilitas
  long rawSum = 0;
  for (int i = 0; i < 16; i++) {
    rawSum += analogRead(BATTERY_PIN);
    delay(1);
  }
  float raw = rawSum / 16.0f;

  // ADC 12-bit, 3.3V ref, voltage divider 1:1 (×2)
  float voltage = (raw / 4095.0f) * 3.3f * 2.0f;

  float level = ((voltage - BATTERY_MIN_V) / (BATTERY_MAX_V - BATTERY_MIN_V)) * 100.0f;
  level = constrain(level, 0.0f, 100.0f);

  // Baca status TP4056
  bool chrg  = (digitalRead(TP4056_CHRG)  == LOW);  // LOW = charging
  bool stdby = (digitalRead(TP4056_STDBY) == LOW);  // LOW = full/standby

  isCharging = chrg;
  isBattFull = stdby;

  // Tentukan status string
  String status;
  if      (stdby || level >= 95.0f)                status = "full";
  else if (chrg)                                    status = "charging";
  else if (level > (float)20)                       status = "discharging";
  else if (level > (float)10)                       status = "low";
  else                                              status = "critical";

  Serial.printf("[Batt] Raw:%.0f | %.2fV | %.1f%% | %s | CHRG:%s STDBY:%s\n",
    raw, voltage, level, status.c_str(),
    chrg ? "YES" : "no", stdby ? "YES" : "no");

  return { level, status };
}

// ═══════════════════════════════════════════════════════════
//  UPDATE LED berdasarkan state
// ═══════════════════════════════════════════════════════════

void updateLED(const BatteryInfo& batt) {
  if (isHibernating) {
    ledMagenta();                    // Ungu = hibernasi
    return;
  }
  if (batt.status == "critical") {
    // Kedip merah-mati cepat (non-blocking: alternating tiap loop)
    static bool blink = false;
    blink = !blink;
    blink ? ledRed() : ledOff();
    return;
  }
  if (batt.status == "low") {
    ledYellow();                     // Kuning = baterai rendah
    return;
  }
  if (batt.status == "charging") {
    ledCyan();                       // Cyan = sedang charge
    return;
  }
  if (batt.status == "full") {
    ledBlink(0,1,0, 80);             // Kedip hijau singkat = full
    return;
  }
  // Normal → sesuai mode
  isCageMode ? ledBlue() : ledGreen();
}

// ═══════════════════════════════════════════════════════════
//  KIRIM DATA KE SUPABASE
// ═══════════════════════════════════════════════════════════

bool kirimData(float suhu, float hr, float spo2,
               int16_t ax, int16_t ay, int16_t az,
               const BatteryInfo& batt) {

  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    if (WiFi.status() != WL_CONNECTED) return false;
  }

  // JSON payload — sesuai skema tabel monitoring
  StaticJsonDocument<512> doc;
  doc["pet_id"]         = PET_ID;
  doc["device_id"]      = DEVICE_ID;
  doc["mode"]           = isCageMode ? "kandang" : "kalung";
  doc["suhu"]           = suhu;
  doc["heart_rate"]     = hr;
  doc["spo2"]           = spo2;
  doc["ax"]             = ax;
  doc["ay"]             = ay;
  doc["az"]             = az;
  doc["battery_level"]  = roundf(batt.level * 100.0f) / 100.0f;  // ✓ field benar
  doc["battery_status"] = batt.status;                            // ✓ field benar

  String json;
  serializeJson(doc, json);

  HTTPClient http;
  http.begin(String(SUPABASE_URL) + "/rest/v1/monitoring");
  http.setTimeout(8000);
  http.addHeader("Content-Type",  "application/json");
  http.addHeader("apikey",        SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  http.addHeader("Prefer",        "return=minimal");

  int code = http.POST(json);
  http.end();

  if (code == 200 || code == 201) {
    Serial.printf("[Supabase] Terkirim ✓ HTTP %d\n", code);
    failCount = 0;
    ledBlink(0,1,0, 60);   // Kedip hijau singkat = sukses kirim
    return true;
  }

  failCount++;
  Serial.printf("[Supabase] Gagal HTTP %d | fail#%d\n", code, failCount);
  ledBlink(1,0,0, 80);

  if (failCount >= 5) {
    Serial.println("[WiFi] Reset karena terlalu banyak gagal...");
    WiFi.disconnect();
    delay(1000);
    connectWiFi();
    failCount = 0;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════
//  UPDATE STATUS COMMAND DI SUPABASE (PATCH)
// ═══════════════════════════════════════════════════════════

void updateCommandStatus(const String& cmdId, const String& status,
                         const String& errMsg = "") {
  if (WiFi.status() != WL_CONNECTED) return;

  StaticJsonDocument<192> doc;
  doc["status"] = status;
  if (errMsg.length() > 0) doc["error_message"] = errMsg;

  String json;
  serializeJson(doc, json);

  HTTPClient http;
  String url = String(SUPABASE_URL)
             + "/rest/v1/device_commands"
             + "?id=eq."        + cmdId
             + "&device_id=eq." + DEVICE_ID;
  http.begin(url);
  http.setTimeout(6000);
  http.addHeader("Content-Type",  "application/json");
  http.addHeader("apikey",        SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  http.addHeader("Prefer",        "return=minimal");

  int code = http.PATCH(json);
  http.end();

  Serial.printf("[CMD] Status '%s' → PATCH HTTP %d\n", status.c_str(), code);
}

// ═══════════════════════════════════════════════════════════
//  POLLING PERINTAH DARI WEB (device_commands)
// ═══════════════════════════════════════════════════════════

void checkAndExecuteCommands() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(SUPABASE_URL)
             + "/rest/v1/device_commands"
             + "?device_id=eq." + DEVICE_ID
             + "&status=eq.pending"
             + "&order=created_at.desc"
             + "&limit=1";
  http.begin(url);
  http.setTimeout(6000);
  http.addHeader("apikey",        SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  http.addHeader("Accept",        "application/json");

  int code = http.GET();
  if (code != 200) { http.end(); return; }

  String resp = http.getString();
  http.end();

  StaticJsonDocument<512> doc;
  if (deserializeJson(doc, resp) || !doc.is<JsonArray>()
      || doc.as<JsonArray>().size() == 0) return;

  JsonObject cmd     = doc[0];
  String     cmdId   = cmd["id"]      | "";
  String     command = cmd["command"] | "";
  if (cmdId.length() == 0) return;

  Serial.printf("[CMD] Terima: %s (id: ...%s)\n",
    command.c_str(), cmdId.substring(cmdId.length()-6).c_str());

  // ── Eksekusi ──────────────────────────────────────────────
  if (command == "hibernate") {
    int durMin = 30;
    if (cmd.containsKey("payload") && !cmd["payload"].isNull()) {
      durMin = cmd["payload"]["duration_minutes"] | 30;
    }
    durMin        = constrain(durMin, 1, 480);
    isHibernating = true;
    hibernateEnd  = millis() + (unsigned long)durMin * 60000UL;
    Serial.printf("[Hibernasi] Aktif %d menit. Auto-resume pukul +%d detik\n",
      durMin, durMin * 60);
    updateCommandStatus(cmdId, "executed");

  } else if (command == "resume") {
    isHibernating = false;
    hibernateEnd  = 0;
    Serial.println("[Hibernasi] Resume — sensor aktif kembali.");
    updateCommandStatus(cmdId, "executed");

  } else if (command == "restart") {
    Serial.println("[CMD] Restart ESP32...");
    updateCommandStatus(cmdId, "executed");
    delay(800);
    ESP.restart();

  } else {
    Serial.printf("[CMD] Perintah tidak dikenal: %s\n", command.c_str());
    updateCommandStatus(cmdId, "error", "Unknown command: " + command);
  }
}

// ═══════════════════════════════════════════════════════════
//  SETUP
// ═══════════════════════════════════════════════════════════

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n╔════════════════════════════════════╗");
  Serial.println("║  PetCare+ ESP32 Firmware v3.0      ║");
  Serial.println("║  MAX30102 + MLX90614 + MPU6050     ║");
  Serial.println("╚════════════════════════════════════╝");

  // ── Pin setup ──────────────────────────────────────────
  pinMode(REED_PIN,    INPUT_PULLUP);
  pinMode(LED_R,       OUTPUT);
  pinMode(LED_G,       OUTPUT);
  pinMode(LED_B,       OUTPUT);
  pinMode(BATTERY_PIN, INPUT);
  pinMode(TP4056_CHRG, INPUT_PULLUP);
  pinMode(TP4056_STDBY,INPUT_PULLUP);

  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);   // Full scale ~3.3V

  // LED test — semua warna satu per satu
  ledRed();     delay(200);
  ledGreen();   delay(200);
  ledBlue();    delay(200);
  ledWhite();   delay(300);
  ledOff();

  // ── I2C ────────────────────────────────────────────────
  Wire.begin(SDA_PIN, SCL_PIN);

  // ── MLX90614 ───────────────────────────────────────────
  if (!mlx.begin()) {
    Serial.println("[ERROR] MLX90614 tidak terdeteksi!");
    ledBlink(1,0,0, 500); ledBlink(1,0,0, 500);
  } else {
    Serial.println("[OK]   MLX90614 siap");
  }

  // ── MPU-6050 ───────────────────────────────────────────
  mpu.initialize();
  if (!mpu.testConnection()) {
    Serial.println("[ERROR] MPU-6050 tidak terdeteksi!");
    ledBlink(1,0,0, 500);
  } else {
    Serial.println("[OK]   MPU-6050 siap");
  }

  // ── MAX30102 ───────────────────────────────────────────
  // MAX30102 alamat I2C 0x57 — library SparkFun MAX3010x
  if (!particleSensor.begin(Wire, I2C_SPEED_STANDARD)) {
    Serial.println("[ERROR] MAX30102 tidak terdeteksi! Cek kabel SDA/SCL.");
    ledBlink(1,0,0, 500); ledBlink(1,0,0, 500);
  } else {
    Serial.println("[OK]   MAX30102 siap");

    // Konfigurasi MAX30102 untuk HR + SpO2
    byte ledBrightness = 60;    // 0=off, 255=max (mulai sedang)
    byte sampleAvg     = 4;     // sample average 4 (1,2,4,8,16,32)
    byte ledMode       = 2;     // 1=Red only, 2=Red+IR (SpO2 mode)
    byte sampleRate    = 100;   // samples/sec: 50,100,200,400,800,1000,1600,3200
    int  pulseWidth    = 411;   // pulse width µs: 69,118,215,411
    int  adcRange      = 4096;  // ADC full scale: 2048,4096,8192,16384

    particleSensor.setup(ledBrightness, sampleAvg, ledMode,
                         sampleRate, pulseWidth, adcRange);
    particleSensor.setPulseAmplitudeRed(ledBrightness);
    particleSensor.setPulseAmplitudeIR(ledBrightness);
    particleSensor.enableDIETEMPRDY();   // Enable die temperature (opsional)
  }

  // ── Watchdog ───────────────────────────────────────────
  setupWatchdog();

  // ── WiFi ───────────────────────────────────────────────
  connectWiFi();

  Serial.println("[INFO] Setup selesai. Monitoring dimulai.\n");
}

// ═══════════════════════════════════════════════════════════
//  LOOP UTAMA
// ═══════════════════════════════════════════════════════════

void loop() {
  esp_task_wdt_reset();   // Reset watchdog di setiap iterasi loop

  unsigned long now = millis();

  // ── 1. Auto-resume hibernasi ──────────────────────────
  if (isHibernating && hibernateEnd > 0 && now >= hibernateEnd) {
    isHibernating = false;
    hibernateEnd  = 0;
    Serial.println("[Hibernasi] Waktu habis — auto resume ✓");
  }

  // ── 2. Polling command dari web ───────────────────────
  if (now - lastCmdPollTime >= INTERVAL_CMD_POLL) {
    lastCmdPollTime = now;
    checkAndExecuteCommands();
    esp_task_wdt_reset();
  }

  // ── 3. Baca reed switch (mode kandang/kalung) ─────────
  isCageMode = (digitalRead(REED_PIN) == LOW);

  // ── 4. Baca baterai & update LED ──────────────────────
  BatteryInfo batt = bacaBaterai();
  updateLED(batt);

  // ── 5. Kirim data sesuai interval ─────────────────────
  unsigned long interval;
  if      (isHibernating) interval = INTERVAL_HIBERNATE;
  else if (isCageMode)    interval = INTERVAL_KANDANG;
  else                    interval = INTERVAL_KALUNG;

  if (now - lastSendTime >= interval) {
    lastSendTime = now;

    // Baca semua sensor
    float   suhu = bacaSuhu();
    float   hr   = bacaHeartRate();
    float   spo2 = bacaSpO2();       // Blok ~1 detik untuk 100 sample
    int16_t ax, ay, az;
    mpu.getAcceleration(&ax, &ay, &az);

    esp_task_wdt_reset();   // Reset watchdog setelah bacaSpO2() yang lama

    // Print Serial Monitor
    Serial.println("════════════════════════════════════════");
    Serial.printf("Mode     : %s\n",        isCageMode   ? "KANDANG 🏠" : "KALUNG 🐾");
    Serial.printf("Hibernasi: %s\n",        isHibernating ? "AKTIF 💤"   : "Tidak");
    Serial.printf("Suhu     : %.2f°C\n",    suhu);
    Serial.printf("HR       : %.1f BPM%s\n", hr, hr==0?" (jari tidak ada)":"");
    Serial.printf("SpO2     : %.0f%%%s\n",   spo2, spo2==0?" (tidak valid)":"");
    Serial.printf("Accel    : X=%-5d Y=%-5d Z=%d\n", ax, ay, az);
    Serial.printf("Baterai  : %.1f%% | %s | Charging:%s | Full:%s\n",
      batt.level, batt.status.c_str(),
      isCharging?"YES":"no", isBattFull?"YES":"no");

    // Kirim ke Supabase
    bool ok = kirimData(suhu, hr, spo2, ax, ay, az, batt);

    if (!ok) {
      Serial.println("[WARN] Data tidak terkirim kali ini.");
    }

    esp_task_wdt_reset();
  }

  // Loop delay pendek agar HR, LED blink, command poll tetap responsif
  delay(100);
}
