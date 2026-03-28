#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <DHT.h>
#include <time.h>

// ---------- WiFi ----------
const char* WIFI_SSID = "Anmol5G";
const char* WIFI_PASSWORD = "mangat@221";
const char* API_URL = "https://kaka-server-bujv.onrender.com/api/v1/sensor-data";

// ---------- Time ----------
const long GMT_OFFSET_SECONDS = 19800;
const int DAYLIGHT_OFFSET_SECONDS = 0;

// ---------- Sleep ----------
const uint64_t SLEEP_INTERVAL_US = 60ULL * 1000000ULL;

// ---------- HTTP ----------
const int WIFI_CONNECT_TIMEOUT_MS = 20000;
const int HTTP_TIMEOUT_MS = 10000;
const int MAX_POST_RETRIES = 3;

// ---------- Pins ----------
const int SOIL_PIN = 34;
const int LIGHT_PIN = 35;
const int DHT_PIN = 4;

// ---------- DHT ----------
#define DHT_TYPE DHT11
DHT dht(DHT_PIN, DHT_TYPE);

// ---------- Calibration ----------
const int SOIL_RAW_DRY = 3200;
const int SOIL_RAW_WET = 1100;

const int ADC_MAX = 4095;

// ---------- STRUCT (FIXED POSITION) ----------
struct SensorReading {
  unsigned long timestamp;
  int soilMoisture;
  int sunlight;
  float temperature;
  float humidity;
  bool valid;
};

// ---------- Helper: Averaging ----------
int readAverage(int pin) {
  int sum = 0;
  for (int i = 0; i < 5; i++) {
    sum += analogRead(pin);
    delay(10);
  }
  return sum / 5;
}

// ---------- WiFi ----------
void connectToWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to WiFi");
  unsigned long start = millis();

  while (WiFi.status() != WL_CONNECTED && millis() - start < WIFI_CONNECT_TIMEOUT_MS) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected");
  } else {
    Serial.println("WiFi connection failed");
  }
}

// ---------- Time ----------
void syncTime() {
  configTime(GMT_OFFSET_SECONDS, DAYLIGHT_OFFSET_SECONDS, "pool.ntp.org");

  time_t now = time(nullptr);
  int attempts = 0;

  while (now < 1700000000 && attempts < 20) {
    delay(500);
    now = time(nullptr);
    attempts++;
  }
}

unsigned long getUnixTimestamp() {
  time_t now = time(nullptr);
  if (now >= 1700000000) return now;
  return 1710000000UL + millis() / 1000UL;
}

// ---------- Sensor Calculations ----------
int calculateSoilPercent(int raw) {
  int percent = map(raw, SOIL_RAW_DRY, SOIL_RAW_WET, 0, 100);
  return constrain(percent, 0, 100);
}

int calculateLightPercent(int raw) {
  int inverted = ADC_MAX - raw;
  return map(inverted, 0, ADC_MAX, 0, 100);
}

float readTemp() {
  float t = dht.readTemperature();
  return isnan(t) ? NAN : t;
}

float readHum() {
  float h = dht.readHumidity();
  return isnan(h) ? NAN : h;
}

// ---------- Capture ----------
SensorReading captureReading() {
  SensorReading r;
  r.timestamp = getUnixTimestamp();

  int soilRaw = readAverage(SOIL_PIN);
  int lightRaw = readAverage(LIGHT_PIN);

  float t = readTemp();
  float h = readHum();

  r.soilMoisture = calculateSoilPercent(soilRaw);
  r.sunlight = calculateLightPercent(lightRaw);
  r.temperature = t;
  r.humidity = h;
  r.valid = !isnan(t) && !isnan(h);

  Serial.println("---- Sensor Data ----");
  Serial.print("Soil: "); Serial.print(r.soilMoisture); Serial.println("%");
  Serial.print("Light: "); Serial.print(r.sunlight); Serial.println("%");
  Serial.print("Temp: "); Serial.println(r.temperature);
  Serial.print("Humidity: "); Serial.println(r.humidity);

  return r;
}

// ---------- JSON ----------
String buildPayload(const SensorReading& r) {
  String payload = "{";
  payload += "\"timestamp\":" + String(r.timestamp) + ",";
  payload += "\"soil_moisture\":" + String(r.soilMoisture) + ",";
  payload += "\"sunlight\":" + String(r.sunlight) + ",";
  payload += "\"temperature\":" + String(r.temperature, 1) + ",";
  payload += "\"humidity\":" + String(r.humidity, 1);
  payload += "}";
  return payload;
}

// ---------- POST ----------
bool postReading(const SensorReading& r) {
  if (WiFi.status() != WL_CONNECTED) connectToWiFi();
  if (WiFi.status() != WL_CONNECTED) return false;

  String payload = buildPayload(r);

  for (int i = 0; i < MAX_POST_RETRIES; i++) {
    HTTPClient http;
    http.setTimeout(HTTP_TIMEOUT_MS);
    http.begin(API_URL);
    http.addHeader("Content-Type", "application/json");

    int code = http.POST(payload);
    String response = http.getString();
    http.end();

    if (code > 0 && code < 300) {
      Serial.println("POST success");
      Serial.println(response);
      return true;
    }

    Serial.print("POST failed: ");
    Serial.println(code);
    delay(1500);
  }

  return false;
}

// ---------- Sleep ----------
void enterSleep() {
  Serial.println("Sleeping...");
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  btStop();

  esp_sleep_enable_timer_wakeup(SLEEP_INTERVAL_US);
  Serial.flush();
  esp_deep_sleep_start();
}

// ---------- Setup ----------
void setup() {
  Serial.begin(115200);
  delay(1000);

  analogReadResolution(12);
  dht.begin();
  Wire.begin();

  Serial.println("🌱 KAKA Plant Companion Booting...");

  connectToWiFi();
  syncTime();

  SensorReading r = captureReading();

  if (r.valid) {
    postReading(r);
  } else {
    Serial.println("DHT failed");
  }

  enterSleep();
}

void loop() {}