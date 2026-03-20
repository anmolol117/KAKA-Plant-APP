#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <DHT.h>
#include <time.h>

const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* API_URL = "https://kaka-server-bujv.onrender.com/api/v1/sensor-data";

// Set this to your local UTC offset if you want local serial timestamps.
// India is +5:30, so 19800 seconds.
const long GMT_OFFSET_SECONDS = 19800;
const int DAYLIGHT_OFFSET_SECONDS = 0;

// Wake, measure, send, then sleep for one minute.
const uint64_t SLEEP_INTERVAL_US = 60ULL * 1000000ULL;
const int WIFI_CONNECT_TIMEOUT_MS = 20000;
const int HTTP_TIMEOUT_MS = 10000;
const int MAX_POST_RETRIES = 3;

// Pins
const int SOIL_PIN = 34;
const int LIGHT_PIN = 35;
const int DHT_PIN = 4;

// DHT11
#define DHT_TYPE DHT11
DHT dht(DHT_PIN, DHT_TYPE);

// Soil sensor calibration:
// Update these after checking your dry and wet sensor values.
const int SOIL_RAW_DRY = 3200;
const int SOIL_RAW_WET = 1400;

// Photoresistor tuning:
// These values are approximations and usually need adjustment for your LDR circuit.
const float ADC_REFERENCE_VOLTAGE = 3.3f;
const int ADC_MAX = 4095;
const float LDR_FIXED_RESISTOR_OHMS = 10000.0f;
const float LUX_CALIBRATION_FACTOR = 500.0f;

struct SensorReading {
  unsigned long timestamp;
  int soilMoisture;
  int sunlight;
  float temperature;
  float humidity;
  bool valid;
};

void connectToWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to WiFi");
  const unsigned long startedAt = millis();

  while (WiFi.status() != WL_CONNECTED && millis() - startedAt < WIFI_CONNECT_TIMEOUT_MS) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi connection timed out");
  }
}

void syncTime() {
  configTime(GMT_OFFSET_SECONDS, DAYLIGHT_OFFSET_SECONDS, "pool.ntp.org", "time.nist.gov");

  Serial.print("Syncing clock");
  time_t now = time(nullptr);
  int attempts = 0;

  while (now < 1700000000 && attempts < 20) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
    attempts++;
  }

  Serial.println();

  if (now >= 1700000000) {
    Serial.print("Clock synced. Epoch: ");
    Serial.println(now);
  } else {
    Serial.println("Clock sync failed. Falling back to uptime-based timestamp.");
  }
}

unsigned long getUnixTimestamp() {
  time_t now = time(nullptr);
  if (now >= 1700000000) {
    return static_cast<unsigned long>(now);
  }

  // Fallback only if NTP was unavailable.
  return 1710000000UL + (millis() / 1000UL);
}

int readSoilMoistureRaw() {
  return analogRead(SOIL_PIN);
}

int calculateSoilMoisturePercent(int rawValue) {
  int percent = map(rawValue, SOIL_RAW_DRY, SOIL_RAW_WET, 0, 100);
  return constrain(percent, 0, 100);
}

int readLightRaw() {
  return analogRead(LIGHT_PIN);
}

int calculateLux(int rawValue) {
  if (rawValue <= 0) return 0;

  float voltage = (static_cast<float>(rawValue) / ADC_MAX) * ADC_REFERENCE_VOLTAGE;
  if (voltage <= 0.01f || voltage >= ADC_REFERENCE_VOLTAGE) {
    return 0;
  }

  float ldrResistance = (ADC_REFERENCE_VOLTAGE - voltage) * LDR_FIXED_RESISTOR_OHMS / voltage;
  float lux = LUX_CALIBRATION_FACTOR * pow(LDR_FIXED_RESISTOR_OHMS / ldrResistance, 1.4f);
  return max(0, static_cast<int>(lux));
}

float readTemperatureC() {
  float value = dht.readTemperature();
  return isnan(value) ? NAN : value;
}

float readHumidityPercent() {
  float value = dht.readHumidity();
  return isnan(value) ? NAN : value;
}

SensorReading captureReading() {
  SensorReading reading;
  reading.timestamp = getUnixTimestamp();

  int rawSoil = readSoilMoistureRaw();
  int rawLight = readLightRaw();
  float temperature = readTemperatureC();
  float humidity = readHumidityPercent();

  reading.soilMoisture = calculateSoilMoisturePercent(rawSoil);
  reading.sunlight = calculateLux(rawLight);
  reading.temperature = temperature;
  reading.humidity = humidity;
  reading.valid = !isnan(temperature) && !isnan(humidity);

  Serial.println("Captured sensor values:");
  Serial.print("  Soil raw: ");
  Serial.print(rawSoil);
  Serial.print(" -> ");
  Serial.print(reading.soilMoisture);
  Serial.println("%");

  Serial.print("  Light raw: ");
  Serial.print(rawLight);
  Serial.print(" -> ");
  Serial.print(reading.sunlight);
  Serial.println(" lux");

  Serial.print("  Temperature: ");
  Serial.print(reading.temperature);
  Serial.println(" C");

  Serial.print("  Humidity: ");
  Serial.print(reading.humidity);
  Serial.println("%");

  return reading;
}

String buildPayload(const SensorReading& reading) {
  String payload = "{";
  payload += "\"timestamp\":" + String(reading.timestamp) + ",";
  payload += "\"soil_moisture\":" + String(reading.soilMoisture) + ",";
  payload += "\"sunlight\":" + String(reading.sunlight) + ",";
  payload += "\"temperature\":" + String(reading.temperature, 1) + ",";
  payload += "\"humidity\":" + String(reading.humidity, 1);
  payload += "}";
  return payload;
}

bool postReading(const SensorReading& reading) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Trying reconnect before POST.");
    connectToWiFi();
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Skipping POST because WiFi is still unavailable.");
    return false;
  }

  String payload = buildPayload(reading);
  Serial.println("Sending payload:");
  Serial.println(payload);

  for (int attempt = 1; attempt <= MAX_POST_RETRIES; attempt++) {
    HTTPClient http;
    http.setTimeout(HTTP_TIMEOUT_MS);
    http.begin(API_URL);
    http.addHeader("Content-Type", "application/json");

    int responseCode = http.POST(payload);
    String responseBody = http.getString();
    http.end();

    if (responseCode > 0 && responseCode < 300) {
      Serial.print("POST succeeded on attempt ");
      Serial.print(attempt);
      Serial.print(" with code ");
      Serial.println(responseCode);
      Serial.println(responseBody);
      return true;
    }

    Serial.print("POST attempt ");
    Serial.print(attempt);
    Serial.print(" failed. Code: ");
    Serial.println(responseCode);

    if (responseBody.length() > 0) {
      Serial.println(responseBody);
    }

    delay(1500);
  }

  return false;
}

void enterLowPowerSleep() {
  Serial.println("Entering deep sleep for 60 seconds.");
  WiFi.disconnect(true, true);
  WiFi.mode(WIFI_OFF);
  btStop();
  esp_sleep_enable_timer_wakeup(SLEEP_INTERVAL_US);
  Serial.flush();
  esp_deep_sleep_start();
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  analogReadResolution(12);
  dht.begin();
  Wire.begin();

  Serial.println();
  Serial.println("KAKA Plant Companion booting...");

  connectToWiFi();
  syncTime();

  SensorReading reading = captureReading();
  if (!reading.valid) {
    Serial.println("DHT11 read failed. Data was not sent this cycle.");
    enterLowPowerSleep();
    return;
  }

  bool sent = postReading(reading);
  if (!sent) {
    Serial.println("Reading could not be uploaded this cycle.");
  }

  enterLowPowerSleep();
}

void loop() {
  // The device should never stay awake long enough to loop continuously.
}
