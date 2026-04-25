/*
  ============================================================
  PetCare+ IoT Monitor — ESP32 Firmware
  ============================================================
  Sensor  : MLX90614 (suhu), MPU6050 (akselerasi)
  Target  : Supabase REST API → tabel "monitoring"
  Auth    : Anon key (INSERT saja, tanpa login)

  WIRING:
    MLX90614 & MPU6050 via I2C:
      SDA → GPIO 21
      SCL → GPIO 22
    Magnetic door sensor:
      Signal → GPIO 26 (INPUT_PULLUP)
    LED Indikator:
      LED Hijau → GPIO 14  (mode kalung / aktif)
      LED Merah → GPIO 12  (mode kandang / terkunci)
  ============================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_MLX90614.h>
#include <MPU6050.h>
#include <ArduinoJson.h>   // Install: ArduinoJson by Benoit Blanchon

// ─── KONFIGURASI — WAJIB DIISI ──────────────────────────
const char* WIFI_SSID     = "NAMA_WIFI";
const char* WIFI_PASSWORD = "PASSWORD_WIFI";

// Supabase project URL (tanpa trailing slash)
const char* SUPABASE_URL  = "https://vpytcguxghpvvsrqdsoc.supabase.co";

// Anon key dari Supabase → Settings > API > anon public
const char* SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZweXRjZ3V4Z2hwdnZzcnFkc29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTIzMTIsImV4cCI6MjA5MjY4ODMxMn0.-98m71uyb_Uf1x7VC1LM6Q6dPlja-FDuQQl0wXOqfTQ";

// UUID pet dari Supabase → tabel pets → kolom id
// Buka web PetCare+, Settings → lihat ID pet, copy-paste di sini
const char* PET_ID = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";

// Identitas perangkat (bebas, untuk membedakan jika ada >1 ESP32)
const char* DEVICE_ID = "esp32-01";
// ────────────────────────────────────────────────────────

// ─── PIN ─────────────────────────────────────────────────
#define SDA_PIN       21
#define SCL_PIN       22
#define MAGNETIC_PIN  26   // LOW = magnet menempel = mode kandang
#define LED_GREEN     14
#define LED_RED       12

// ─── SENSOR ──────────────────────────────────────────────
Adafruit_MLX90614 mlx;
MPU6050 mpu;

// Interval pengiriman data
#define INTERVAL_KALUNG  15000   // 15 detik (pet sedang bergerak)
#define INTERVAL_KANDANG  5000   // 5 detik  (pet di kandang, monitor intensif)

// ─── STATE ───────────────────────────────────────────────
bool isCageMode = false;
unsigned long lastSendTime = 0;
int failCount = 0;

// ─── SETUP ───────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n====================================");
  Serial.println("   PetCare+ IoT Monitor v2.0");
  Serial.println("====================================");

  pinMode(MAGNETIC_PIN, INPUT_PULLUP);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);

  // LED test
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(LED_RED, HIGH);
  delay(500);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, LOW);

  // I2C + Sensor init
  Wire.begin(SDA_PIN, SCL_PIN);

  if (!mlx.begin()) {
    Serial.println("[ERROR] MLX90614 tidak terdeteksi!");
  } else {
    Serial.println("[OK] MLX90614 siap");
  }

  mpu.initialize();
  if (mpu.testConnection()) {
    Serial.println("[OK] MPU6050 siap");
  } else {
    Serial.println("[ERROR] MPU6050 tidak terdeteksi!");
  }

  // WiFi
  connectWiFi();
}

// ─── WIFI CONNECT ────────────────────────────────────────
void connectWiFi() {
  Serial.printf("[WiFi] Menghubungkan ke %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Terhubung! IP: " + WiFi.localIP().toString());
    failCount = 0;
  } else {
    Serial.println("\n[WiFi] Gagal terhubung. Akan coba ulang...");
  }
}

// ─── BACA SENSOR ─────────────────────────────────────────
float bacaSuhu() {
  float suhu = mlx.readObjectTempC();
  if (isnan(suhu) || suhu < 10.0 || suhu > 50.0) {
    Serial.println("[WARN] Suhu tidak valid, gunakan 38.5");
    return 38.5;
  }
  return suhu;
}

// ─── KIRIM KE SUPABASE ───────────────────────────────────
bool kirimData(float suhu, float heartRate, float spo2,
               int16_t ax, int16_t ay, int16_t az) {

  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    if (WiFi.status() != WL_CONNECTED) return false;
  }

  // Build JSON dengan ArduinoJson (aman dari karakter rusak)
  StaticJsonDocument<512> doc;
  doc["pet_id"]     = PET_ID;
  doc["device_id"]  = DEVICE_ID;
  doc["mode"]       = isCageMode ? "kandang" : "kalung";
  doc["suhu"]       = round(suhu * 100.0) / 100.0;
  doc["heart_rate"] = round(heartRate * 100.0) / 100.0;
  doc["spo2"]       = round(spo2 * 100.0) / 100.0;
  doc["ax"]         = ax;
  doc["ay"]         = ay;
  doc["az"]         = az;

  String jsonStr;
  serializeJson(doc, jsonStr);

  // HTTP POST ke Supabase REST API
  HTTPClient http;
  String endpoint = String(SUPABASE_URL) + "/rest/v1/monitoring";
  http.begin(endpoint);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  http.addHeader("Prefer", "return=minimal");   // Tidak perlu respons body

  int code = http.POST(jsonStr);
  http.end();

  if (code == 201 || code == 200) {
    Serial.printf("[Supabase] Terkirim ✓ (HTTP %d)\n", code);
    failCount = 0;
    return true;
  } else {
    failCount++;
    Serial.printf("[Supabase] Gagal! HTTP %d (percobaan gagal: %d)\n", code, failCount);
    if (failCount >= 5) {
      Serial.println("[WiFi] Reset koneksi...");
      WiFi.disconnect();
      delay(1000);
      connectWiFi();
    }
    return false;
  }
}

// ─── LOOP ────────────────────────────────────────────────
void loop() {
  // Deteksi mode (kandang vs kalung)
  isCageMode = (digitalRead(MAGNETIC_PIN) == LOW);

  // LED indikator mode
  digitalWrite(LED_RED,   isCageMode ? HIGH : LOW);
  digitalWrite(LED_GREEN, isCageMode ? LOW  : HIGH);

  unsigned long now = millis();
  unsigned long interval = isCageMode ? INTERVAL_KANDANG : INTERVAL_KALUNG;

  if (now - lastSendTime >= interval) {
    lastSendTime = now;

    // Baca semua sensor
    float suhu = bacaSuhu();

    // MPU6050 akselerasi
    int16_t ax, ay, az;
    mpu.getAcceleration(&ax, &ay, &az);

    // Simulasi HR & SpO2 (ganti dengan sensor MAX30100/MAX30102 jika ada)
    // Contoh: baca dari sensor analog atau modul HR
    float heartRate = 72.0 + (ax % 15);   // placeholder
    float spo2      = 97.0 + (az % 3);    // placeholder

    // Print ke Serial Monitor
    Serial.println("────────────────────────────────");
    Serial.printf("Mode    : %s\n", isCageMode ? "KANDANG 🏠" : "KALUNG 🐾");
    Serial.printf("Suhu    : %.2f °C\n", suhu);
    Serial.printf("HR      : %.1f BPM\n", heartRate);
    Serial.printf("SpO2    : %.1f %%\n", spo2);
    Serial.printf("Accel   : X=%d Y=%d Z=%d\n", ax, ay, az);
    Serial.printf("Pet ID  : %s\n", PET_ID);

    // Kirim ke Supabase
    kirimData(suhu, heartRate, spo2, ax, ay, az);
  }

  delay(100);  // Loop cepat untuk respons sensor tetap smooth
}
