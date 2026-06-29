/*
  ============================================================
  PetCare+ IoT Monitor — ESP32 Firmware v4.0
  ============================================================
  Arsitektur Hemat Daya: Deep Sleep + Batch Upload
  ─────────────────────────────────────────────────────────────
  Siklus Bangun & Baca Sensor  : setiap 1 menit
    • ESP32 bangun dari Deep Sleep (<3 detik)
    • Baca semua sensor (MAX30102, MLX90614, MPU-6050)
    • Simpan ke buffer RTC RAM (bertahan selama Deep Sleep)
    • WiFi TETAP MATI → langsung tidur kembali

  Siklus Pengiriman Batch       : setiap 10 menit (10 data)
    • Setelah 15 data terkumpul di buffer RTC RAM
    • Hidupkan WiFi → POST 1 request (array JSON 15 baris)
    • Polling perintah (hibernate / resume / restart)
    • Buffer dikosongkan → siklus mulai lagi
  ─────────────────────────────────────────────────────────────
  Hardware:
    - ESP32 ESP-32S Dev Board (AIFRobotic)
    - MAX30102   : Heart Rate + SpO2  (I2C 0x57)
    - MLX90614   : Suhu Inframerah    (I2C 0x5A)
    - MPU-6050   : Akselerometer      (I2C 0x68)
    - Reed Switch: Mode kandang/kalung
    - LED 4-pin  : RGB indicator (common cathode)
    - Li-Po 3.7V : via ADC GPIO 34
    - TP4056     : Charging (CHRG GPIO35, STDBY GPIO32)

  LIBRARY (Arduino Library Manager):
    - SparkFun MAX3010x Pulse and Proximity Sensor
    - Adafruit MLX90614
    - MPU6050 (by Electronic Cats)
    - ArduinoJson (v6/v7)
  ============================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <esp_sleep.h>
#include <esp_task_wdt.h>

#include <Adafruit_MLX90614.h>
// MPU6050 diakses manual via I2C register (tanpa library MPU6050.h)
#include "MAX30105.h"
#include "spo2_algorithm.h"
#include "heartRate.h"

// ── Alamat I2C MPU6050 ────────────────────────────────────
#define MPU_ADDR 0x68

// ═══════════════════════════════════════════════════════════
//  KONFIGURASI — WAJIB DIISI
// ═══════════════════════════════════════════════════════════

const char* WIFI_SSID         = "Jupri";
const char* WIFI_PASSWORD     = "pondokmarhen";

const char* SUPABASE_URL      = "https://vpytcguxghpvvsrqdsoc.supabase.co";
const char* SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZweXRjZ3V4Z2hwdnZzcnFkc29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTIzMTIsImV4cCI6MjA5MjY4ODMxMn0.-98m71uyb_Uf1x7VC1LM6Q6dPlja-FDuQQl0wXOqfTQ";

const char* DEVICE_ID         = "esp32-01";

// PET_ID disimpan di RTC memory agar bertahan saat deep sleep
// dan bisa diubah dari dashboard via command 'set_pet'
// Isi DEFAULT_PET_ID dengan UUID hewan default dari Supabase
#define DEFAULT_PET_ID "57bed84e-303d-4dda-9d2b-357f97284562"
RTC_DATA_ATTR char activePetId[64] = DEFAULT_PET_ID;

// ═══════════════════════════════════════════════════════════
//  PIN DEFINITION
// ═══════════════════════════════════════════════════════════

#define SDA_PIN       6
#define SCL_PIN       7
#define VBUS_PIN      10    // HIGH = USB terhubung (Mode Kandang)
#define LED_RED       5
#define LED_GREEN     4
#define BATTERY_PIN   0     // ADC ESP32-C3
// TP4056 status pin dihapus, mode berdasarkan VBUS

// ═══════════════════════════════════════════════════════════
//  KONSTANTA TIMING
// ═══════════════════════════════════════════════════════════

#define SLEEP_DURATION_NORMAL_US   (60ULL * 1000000ULL)   // 1 menit
#define SLEEP_DURATION_HIBERNATE_US (60ULL * 1000000ULL)  // 1 menit (skip sensor)
#define BATCH_SIZE                 10    // Kirim setiap 10 pembacaan (kompromi hemat baterai & aman ganti hewan)
#define WDT_TIMEOUT_MS             30000 // 30 detik

// ═══════════════════════════════════════════════════════════
//  KONSTANTA BATERAI
// ═══════════════════════════════════════════════════════════

#define BATTERY_MIN_V   3.0f
#define BATTERY_MAX_V   4.2f

// ═══════════════════════════════════════════════════════════
//  STRUCT SENSOR READING
//  Disimpan di RTC RAM — bertahan selama Deep Sleep
// ═══════════════════════════════════════════════════════════

struct SensorReading {
  float   suhu;
  float   heart_rate;
  float   spo2;
  int16_t ax, ay, az;
  float   battery_level;
  char    battery_status[12];   // "full"|"charging"|"discharging"|"low"|"critical"
  char    mode[8];              // "kalung" | "kandang"
};

struct BatteryResult { float level; const char* status; };

// ═══════════════════════════════════════════════════════════
//  RTC RAM — bertahan selama Deep Sleep
// ═══════════════════════════════════════════════════════════

RTC_DATA_ATTR int           readingCount    = 0;
RTC_DATA_ATTR SensorReading buffer[BATCH_SIZE];
RTC_DATA_ATTR bool          isHibernating   = false;
RTC_DATA_ATTR uint32_t      hibernateCycles = 0;  // Sisa siklus tidur hibernasi
RTC_DATA_ATTR int           failCount       = 0;  // Gagal kirim beruntun

// ═══════════════════════════════════════════════════════════
//  OBJEK SENSOR (di-init ulang setiap bangun)
// ═══════════════════════════════════════════════════════════

Adafruit_MLX90614 mlx;
MAX30105          particleSensor;

// ─── Variabel MPU6050 (manual register) ──────────────────
int16_t accXRaw, accYRaw, accZRaw;
int16_t tempRaw;
int16_t gyroXRaw, gyroYRaw, gyroZRaw;
float   mpuAccX = 0, mpuAccY = 0, mpuAccZ = 0;
float   mpuGyroX = 0, mpuGyroY = 0, mpuGyroZ = 0;
float   suhuChipMPU = 0;
float   totalGerak  = 0;

// ─── SpO2 algorithm buffer ───────────────────────────────
#define SPO2_SAMPLE_SIZE 100
uint32_t irBuffer[SPO2_SAMPLE_SIZE];
uint32_t redBuffer[SPO2_SAMPLE_SIZE];
int32_t  spo2Value     = 0;
int8_t   spo2Valid     = 0;
int32_t  heartRateCalc = 0;
int8_t   hrValid       = 0;

// ─── HR ring buffer ──────────────────────────────────────
#define BPM_BUFFER_SIZE 4
float bpmBuffer[BPM_BUFFER_SIZE] = {0};
int   bpmIdx  = 0;
long  lastBeat = 0;

// ═══════════════════════════════════════════════════════════
//  LED HELPER
// ═══════════════════════════════════════════════════════════

void setLED(bool r, bool g, bool b) {
  digitalWrite(LED_RED, r ? HIGH : LOW);
  digitalWrite(LED_GREEN, g ? HIGH : LOW);
  
}
void ledOff()     { setLED(0,0,0); }
void ledGreen()   { setLED(0,1,0); }
void ledBlue()    { setLED(0,0,1); }
void ledRed()     { setLED(1,0,0); }
void ledCyan()    { setLED(0,1,1); }
void ledYellow()  { setLED(1,1,0); }
void ledMagenta() { setLED(1,0,1); }
void ledWhite()   { setLED(1,1,1); }

void ledBlink(bool r, bool g, bool b, int ms = 120) {
  setLED(r,g,b); delay(ms); ledOff(); delay(ms);
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
//  INISIALISASI SENSOR
// ═══════════════════════════════════════════════════════════

bool initSensors() {
  Wire.begin(SDA_PIN, SCL_PIN);
  bool ok = true;

  if (!mlx.begin()) {
    Serial.println("[WARN] MLX90614 tidak terdeteksi.");
    ok = false;
  }

  // ── MPU6050: inisialisasi manual via register ────────────
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B);   // Register power management
  Wire.write(0x00);   // Wake up MPU6050
  byte mpuErr = Wire.endTransmission();
  if (mpuErr != 0) {
    Serial.println("[WARN] MPU-6050 tidak terdeteksi.");
    ok = false;
  } else {
    Serial.println("[OK] MPU-6050 terdeteksi (manual register)");
  }

  if (!particleSensor.begin(Wire, I2C_SPEED_STANDARD)) {
    Serial.println("[WARN] MAX30102 tidak terdeteksi.");
    ok = false;
  } else {
    particleSensor.setup(
      60,   // LED brightness
      4,    // sample average
      2,    // mode: Red + IR (SpO2)
      100,  // sample rate
      411,  // pulse width µs
      4096  // ADC range
    );
    particleSensor.setPulseAmplitudeRed(60);
    particleSensor.setPulseAmplitudeIR(60);
  }

  return ok;
}

// ═══════════════════════════════════════════════════════════
//  BACA SUHU
// ═══════════════════════════════════════════════════════════

float bacaSuhu() {
  float s = mlx.readObjectTempC();
  if (isnan(s) || s < 10.0f || s > 50.0f) return 38.5f;
  return roundf(s * 100.0f) / 100.0f;
}

// ═══════════════════════════════════════════════════════════
//  BACA MPU6050 MANUAL (via register I2C langsung)
// ═══════════════════════════════════════════════════════════

bool readMPU6050() {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B); // Register awal accelerometer
  byte error = Wire.endTransmission(false);

  if (error != 0) return false;

  Wire.requestFrom(MPU_ADDR, 14, true);
  if (Wire.available() == 14) {
    accXRaw = Wire.read() << 8 | Wire.read();
    accYRaw = Wire.read() << 8 | Wire.read();
    accZRaw = Wire.read() << 8 | Wire.read();
    tempRaw = Wire.read() << 8 | Wire.read();
    gyroXRaw = Wire.read() << 8 | Wire.read();
    gyroYRaw = Wire.read() << 8 | Wire.read();
    gyroZRaw = Wire.read() << 8 | Wire.read();

    mpuAccX = accXRaw / 16384.0;
    mpuAccY = accYRaw / 16384.0;
    mpuAccZ = accZRaw / 16384.0;

    mpuGyroX = gyroXRaw / 131.0;
    mpuGyroY = gyroYRaw / 131.0;
    mpuGyroZ = gyroZRaw / 131.0;

    suhuChipMPU = (tempRaw / 340.0) + 36.53;
    totalGerak  = sqrt((mpuAccX * mpuAccX) + (mpuAccY * mpuAccY) + (mpuAccZ * mpuAccZ));
    return true;
  }
  return false;
}


//  Baca ~2 detik worth of sample untuk mendapatkan beat
// ═══════════════════════════════════════════════════════════

float bacaHeartRate() {
  // Warm-up: baca 200 sample (2 detik pada 100 sample/s)
  unsigned long deadline = millis() + 2500;
  while (millis() < deadline) {
    esp_task_wdt_reset();
    byte avail = particleSensor.available();
    if (avail == 0) { particleSensor.check(); continue; }

    for (byte i = 0; i < avail; i++) {
      long ir = particleSensor.getIR();
      particleSensor.nextSample();
      if (ir < 50000) continue;  // Tidak ada jari

      if (checkForBeat(ir)) {
        long now   = millis();
        long delta = now - lastBeat;
        lastBeat   = now;
        if (delta > 300 && delta < 2000) {
          bpmBuffer[bpmIdx % BPM_BUFFER_SIZE] = 60000.0f / (float)delta;
          bpmIdx++;
        }
      }
    }
  }

  float sum = 0; int cnt = 0;
  for (int i = 0; i < BPM_BUFFER_SIZE; i++) {
    if (bpmBuffer[i] > 0) { sum += bpmBuffer[i]; cnt++; }
  }
  // Reset buffer untuk wakeup berikutnya (RTC RAM tidak menyimpan bpmBuffer)
  memset(bpmBuffer, 0, sizeof(bpmBuffer));
  bpmIdx   = 0;
  lastBeat = 0;

  float bpm = cnt > 0 ? sum / cnt : 0;
  if (bpm < 30 || bpm > 220) bpm = 0;
  return roundf(bpm * 10.0f) / 10.0f;
}

// ═══════════════════════════════════════════════════════════
//  BACA SpO2
// ═══════════════════════════════════════════════════════════

float bacaSpO2() {
  Serial.print("[SpO2] Sampling 100 data...");
  for (int i = 0; i < SPO2_SAMPLE_SIZE; i++) {
    while (!particleSensor.available()) particleSensor.check();
    redBuffer[i] = particleSensor.getRed();
    irBuffer[i]  = particleSensor.getIR();
    particleSensor.nextSample();
    if (i % 25 == 0) { esp_task_wdt_reset(); Serial.print("."); }
  }
  maxim_heart_rate_and_oxygen_saturation(
    irBuffer, SPO2_SAMPLE_SIZE, redBuffer,
    &spo2Value, &spo2Valid, &heartRateCalc, &hrValid
  );
  Serial.printf(" %d (%s)\n", spo2Value, spo2Valid ? "valid" : "tidak valid");
  if (!spo2Valid || spo2Value < 70 || spo2Value > 100) return 0;
  return (float)spo2Value;
}

// ═══════════════════════════════════════════════════════════
//  BACA BATERAI
// ═══════════════════════════════════════════════════════════

BatteryResult bacaBaterai() {
  long rawSum = 0;
  for (int i = 0; i < 16; i++) { rawSum += analogRead(BATTERY_PIN); delay(1); }
  float voltage = ((rawSum / 16.0f) / 4095.0f) * 3.3f * 2.0f;
  float level   = constrain(
    ((voltage - BATTERY_MIN_V) / (BATTERY_MAX_V - BATTERY_MIN_V)) * 100.0f,
    0.0f, 100.0f
  );

  bool charging = (digitalRead(VBUS_PIN)==HIGH);

  const char* status;
  if      (charging || level >= 95.0f) status = "charging";
  else if (level > 20.0f)           status = "discharging";
  else if (level > 10.0f)           status = "low";
  else                              status = "critical";

  Serial.printf("[Batt] %.2fV | %.1f%% | %s\n", voltage, level, status);
  return { level, status };
}

// ═══════════════════════════════════════════════════════════
//  WiFi
// ═══════════════════════════════════════════════════════════

bool connectWiFi() {
  ledWhite();
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.printf("[WiFi] Menghubungkan ke \"%s\"", WIFI_SSID);

  int t = 0;
  while (WiFi.status() != WL_CONNECTED && t < 24) {
    delay(500); esp_task_wdt_reset(); Serial.print("."); t++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] Terhubung ✓ IP: %s\n",
      WiFi.localIP().toString().c_str());
    ledBlink(0,1,0,100); ledBlink(0,1,0,100);
    failCount = 0;
    return true;
  }

  Serial.println("\n[WiFi] Gagal terhubung.");
  ledBlink(1,0,0,200);
  return false;
}

// ═══════════════════════════════════════════════════════════
//  BATCH UPLOAD KE SUPABASE
//  Mengirim buffer[] sebagai JSON array dalam 1 HTTP POST
// ═══════════════════════════════════════════════════════════

bool batchUpload() {
  // ── Generate batch_id: UUID v4 sederhana dari esp_random() ──────
  // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  uint32_t r1 = esp_random(), r2 = esp_random(),
           r3 = esp_random(), r4 = esp_random();
  char batchId[37];
  snprintf(batchId, sizeof(batchId),
    "%08x-%04x-4%03x-%04x-%04x%08x",
    r1,
    (r2 >> 16) & 0xFFFF,
    (r2 & 0x0FFF),
    (0x8000 | ((r3 >> 16) & 0x3FFF)),
    r3 & 0xFFFF,
    r4
  );

  // Hitung ukuran dokumen: 15 objek × ~250 byte + overhead
  DynamicJsonDocument doc(15 * 300);
  JsonArray arr = doc.to<JsonArray>();

  for (int i = 0; i < readingCount; i++) {
    JsonObject obj = arr.createNestedObject();
    obj["pet_id"]         = activePetId;
    obj["device_id"]      = DEVICE_ID;
    obj["batch_id"]       = batchId;        // Semua baris dalam batch punya UUID sama
    obj["reading_index"]  = i;              // 0 = paling lama, 14 = paling baru
    obj["mode"]           = buffer[i].mode;
    obj["suhu"]           = buffer[i].suhu;
    obj["heart_rate"]     = buffer[i].heart_rate;
    obj["spo2"]           = buffer[i].spo2;
    obj["ax"]             = buffer[i].ax;
    obj["ay"]             = buffer[i].ay;
    obj["az"]             = buffer[i].az;
    obj["battery_level"]  = roundf(buffer[i].battery_level * 100.0f) / 100.0f;
    obj["battery_status"] = buffer[i].battery_status;
  }

  String json;
  serializeJson(doc, json);

  Serial.printf("[Supabase] Mengirim %d baris data...\n", readingCount);
  Serial.printf("[Supabase] Payload: %d bytes\n", json.length());

  HTTPClient http;
  http.begin(String(SUPABASE_URL) + "/rest/v1/monitoring");
  http.setTimeout(12000);
  http.addHeader("Content-Type",  "application/json");
  http.addHeader("apikey",        SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  http.addHeader("Prefer",        "return=minimal");

  int code = http.POST(json);
  http.end();

  if (code == 200 || code == 201) {
    Serial.printf("[Supabase] Batch sukses ✓ HTTP %d (%d baris)\n",
      code, readingCount);
    failCount = 0;
    // Kosongkan buffer
    readingCount = 0;
    ledBlink(0,1,0,80); ledBlink(0,1,0,80);
    return true;
  }

  failCount++;
  Serial.printf("[Supabase] Gagal HTTP %d | fail#%d — data disimpan\n",
    code, failCount);
  ledBlink(1,0,0,100);

  // Jika gagal 3x berturut, kosongkan buffer agar tidak stuck
  if (failCount >= 3) {
    Serial.println("[Supabase] 3x gagal — buffer dikosongkan.");
    readingCount = 0;
    failCount    = 0;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════
//  UPDATE STATUS COMMAND
// ═══════════════════════════════════════════════════════════

void updateCommandStatus(const String& cmdId, const String& status,
                         const String& errMsg = "") {
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
  Serial.printf("[CMD] Status '%s' → HTTP %d\n", status.c_str(), code);
}

// ═══════════════════════════════════════════════════════════
//  POLLING PERINTAH (hanya saat WiFi sudah aktif = tiap 10 menit)
// ═══════════════════════════════════════════════════════════

void checkAndExecuteCommands() {
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

  Serial.printf("[CMD] Terima: \"%s\"\n", command.c_str());

  if (command == "hibernate") {
    int durMin = cmd.containsKey("payload") && !cmd["payload"].isNull()
                 ? (int)(cmd["payload"]["duration_minutes"] | 30)
                 : 30;
    durMin          = constrain(durMin, 1, 480);
    // Konversi menit → jumlah siklus 1-menit
    hibernateCycles = (uint32_t)durMin;
    isHibernating   = true;
    Serial.printf("[Hibernasi] Aktif %d menit (%d siklus).\n",
      durMin, hibernateCycles);
    updateCommandStatus(cmdId, "executed");

  } else if (command == "resume") {
    isHibernating   = false;
    hibernateCycles = 0;
    Serial.println("[Hibernasi] Resume — sensor aktif kembali.");
    updateCommandStatus(cmdId, "executed");

  } else if (command == "restart") {
    updateCommandStatus(cmdId, "executed");
    delay(500);
    ESP.restart();

  } else if (command == "set_pet") {
    // Ganti hewan aktif yang dipantau ESP32 ini
    String newPetId = cmd.containsKey("payload") && !cmd["payload"].isNull()
                      ? (const char*)(cmd["payload"]["pet_id"] | "")
                      : "";
    if (newPetId.length() > 0 && newPetId.length() < 64) {
      newPetId.toCharArray(activePetId, sizeof(activePetId));
      // Bersihkan buffer agar data lama tidak tercampur ke hewan baru
      readingCount = 0;
      Serial.printf("[CMD] Pet aktif diubah → %s\n", activePetId);
      updateCommandStatus(cmdId, "executed");
    } else {
      updateCommandStatus(cmdId, "error", "pet_id tidak valid atau kosong");
    }

  } else {
    updateCommandStatus(cmdId, "error", "Unknown command: " + command);
  }
}

// ═══════════════════════════════════════════════════════════
//  MASUK DEEP SLEEP
// ═══════════════════════════════════════════════════════════

void goToSleep(uint64_t duration_us) {
  ledOff();
  particleSensor.shutDown();      // Matikan MAX30102 sebelum tidur
  WiFi.mode(WIFI_OFF);            // Pastikan WiFi mati
  Wire.end();

  Serial.printf("[Sleep] Tidur %.0f detik. Buffer: %d/%d\n",
    duration_us / 1e6, readingCount, BATCH_SIZE);
  Serial.flush();

  esp_sleep_enable_timer_wakeup(duration_us);
  esp_deep_sleep_start();
}

// ═══════════════════════════════════════════════════════════
//  SETUP — Dijalankan setiap bangun dari Deep Sleep
// ═══════════════════════════════════════════════════════════

void setup() {
  Serial.begin(115200);
  delay(200);

  // ── Pin setup ───────────────────────────────────────────
  pinMode(VBUS_PIN, INPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  // LED_B removed
  pinMode(BATTERY_PIN, INPUT);
  // TP4056 removed
  // TP4056 removed
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  setupWatchdog();

  esp_sleep_wakeup_cause_t cause = esp_sleep_get_wakeup_cause();
  bool isFirstBoot = (cause != ESP_SLEEP_WAKEUP_TIMER);

  if (isFirstBoot) {
    // LED test saat pertama kali menyala
    Serial.println("\n╔════════════════════════════════════╗");
    Serial.println("║  PetCare+ ESP32 Firmware v4.0      ║");
    Serial.println("║  Deep Sleep + Batch Upload Mode    ║");
    Serial.println("╚════════════════════════════════════╝");
    ledRed();   delay(200); ledGreen(); delay(200);
    ledBlue();  delay(200); ledWhite(); delay(300);
    ledOff();

    // Reset state di RTC RAM
    readingCount    = 0;
    isHibernating   = false;
    hibernateCycles = 0;
    failCount       = 0;
  }

  // ── Cek mode hibernasi ──────────────────────────────────
  if (isHibernating) {
    if (hibernateCycles > 0) {
      hibernateCycles--;
      Serial.printf("[Hibernasi] Sisa %d siklus. Skip sensor.\n",
        hibernateCycles);
      ledMagenta(); delay(100);
      goToSleep(SLEEP_DURATION_HIBERNATE_US);
      return; // Tidak pernah tercapai
    } else {
      // Hibernasi selesai
      isHibernating = false;
      Serial.println("[Hibernasi] Selesai — resume monitoring.");
    }
  }

  // ═══════════════════════════════════════════════════════
  //  FASE BACA SENSOR (WiFi MATI)
  // ═══════════════════════════════════════════════════════

  bool cageMode = (digitalRead(VBUS_PIN) == HIGH);
  if(cageMode){ digitalWrite(LED_RED,HIGH); digitalWrite(LED_GREEN,LOW);} else { digitalWrite(LED_RED,LOW); digitalWrite(LED_GREEN,HIGH);}

  bool sensorsOk = initSensors();
  esp_task_wdt_reset();

  // Baca semua sensor
  float suhu = sensorsOk ? bacaSuhu()       : 38.5f;
  float hr   = sensorsOk ? bacaHeartRate()  : 0.0f;
  float spo2 = sensorsOk ? bacaSpO2()       : 0.0f;
  esp_task_wdt_reset();

  int16_t ax = 0, ay = 0, az = 0;
  String statusGerak = "Tidak diketahui";
  if (sensorsOk) {
    if (readMPU6050()) {
      ax = (int16_t)(mpuAccX * 16384.0);
      ay = (int16_t)(mpuAccY * 16384.0);
      az = (int16_t)(mpuAccZ * 16384.0);
      if      (totalGerak < 1.20) statusGerak = "Diam / stabil";
      else if (totalGerak < 1.80) statusGerak = "Gerak ringan";
      else                        statusGerak = "Gerak tinggi";
    } else {
      statusGerak = "Data MPU gagal terbaca";
    }
  }

  // Validasi status BPM
  long irCheck = particleSensor.getIR();
  String statusBPM;
  if (irCheck < 50000)                      statusBPM = "Sensor belum menempel";
  else if (statusGerak == "Gerak tinggi")   statusBPM = "Tidak valid (hewan banyak bergerak)";
  else                                      statusBPM = "Valid";

  BatteryResult batt = bacaBaterai();
  esp_task_wdt_reset();

  // ── Simpan ke buffer RTC RAM ────────────────────────────
  if (readingCount < BATCH_SIZE) {
    SensorReading& r = buffer[readingCount];
    r.suhu         = suhu;
    r.heart_rate   = hr;
    r.spo2         = spo2;
    r.ax           = ax;
    r.ay           = ay;
    r.az           = az;
    r.battery_level = batt.level;
    strncpy(r.battery_status, batt.status, sizeof(r.battery_status) - 1);
    strncpy(r.mode, cageMode ? "kandang" : "kalung", sizeof(r.mode) - 1);
    r.battery_status[sizeof(r.battery_status) - 1] = '\0';
    r.mode[sizeof(r.mode) - 1] = '\0';
    readingCount++;
  }

  // Print ringkasan ke Serial Monitor
  Serial.println("────────────────────────────────────────");
  Serial.printf("Mode     : %s | Buffer: %d/%d\n",
    cageMode ? "KANDANG 🏠" : "KALUNG 🐾", readingCount, BATCH_SIZE);
  Serial.printf("Suhu     : %.2f°C\n", suhu);
  Serial.printf("HR       : %.1f BPM%s\n", hr, hr == 0 ? " (tidak ada)" : "");
  Serial.printf("Status BPM: %s\n", statusBPM.c_str());
  Serial.printf("SpO2     : %.0f%%%s\n",   spo2, spo2 == 0 ? " (tidak valid)" : "");
  Serial.printf("Accel    : X=%-5d Y=%-5d Z=%d\n", ax, ay, az);
  Serial.printf("Total Gerak: %.4f | Status: %s\n", totalGerak, statusGerak.c_str());
  Serial.printf("Gyro     : X=%.2f Y=%.2f Z=%.2f deg/s\n", mpuGyroX, mpuGyroY, mpuGyroZ);
  Serial.printf("Suhu Chip MPU: %.2f°C\n", suhuChipMPU);
  Serial.printf("Baterai  : %.1f%% | %s\n", batt.level, batt.status);

  // ═══════════════════════════════════════════════════════
  //  CEK APAKAH SUDAH WAKTUNYA BATCH UPLOAD
  // ═══════════════════════════════════════════════════════

  if (readingCount >= BATCH_SIZE) {
    Serial.println("\n[Batch] Buffer penuh — mulai upload...");

    if (connectWiFi()) {
      esp_task_wdt_reset();

      // 1. Upload batch data
      batchUpload();
      esp_task_wdt_reset();

      // 2. Polling perintah dari web (hibernate, resume, restart)
      checkAndExecuteCommands();
      esp_task_wdt_reset();

      // 3. Putuskan WiFi untuk hemat daya
      WiFi.disconnect(true);
      WiFi.mode(WIFI_OFF);
    } else {
      // Gagal connect: readingCount tetap, coba lagi 10 menit ke depan
      // Namun agar buffer tidak overflow, reset jika sudah terlalu penuh
      Serial.println("[WiFi] Gagal — data tetap di buffer, coba siklus berikutnya.");
    }
  }

  // ── Masuk Deep Sleep ────────────────────────────────────
  goToSleep(SLEEP_DURATION_NORMAL_US);
}

// ═══════════════════════════════════════════════════════════
//  LOOP — Tidak pernah tercapai (deep sleep dari setup())
// ═══════════════════════════════════════════════════════════

void loop() {
  // Tidak digunakan. Semua logika ada di setup() karena
  // ESP32 selalu boot ulang setelah deep sleep.
}
