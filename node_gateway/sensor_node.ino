/*
 * SWSN Sensor Node
 * Soil Moisture + Vibration + TinyML + LEDs + MQTT
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <math.h>

// ====================== WIFI & MQTT ======================
const char* ssid         = "YOUR_HOTSPOT_NAME";
const char* password     = "YOUR_HOTSPOT_PASSWORD";
const char* mqtt_server  = "192.168.43.105";   // Laptop IP (Mosquitto)

WiFiClient espClient;
PubSubClient client(espClient);

// ====================== PINS ======================
#define SOIL_PIN        34
#define VIBRATION_PIN   27
#define GREEN_LED       25
#define RED_LED         26

// ====================== MODEL (from your training) ======================
constexpr int   kNumFeatures = 6;
constexpr float kMean[6]  = {4.43895147f, 2.50230034f, 11.60642415f, 4.27902477f, 0.85952012f, 1.47611665f};
constexpr float kScale[6] = {0.60525421f, 0.50973104f, 74.06973832f, 61.04940718f, 1.36435236f, 1.74518611f};
constexpr float kW[6]     = {0.04437025f, 0.66019297f, -0.12724622f, -0.02557784f, 0.52676389f, 0.12083725f};
constexpr float kB = -0.45161840f;
constexpr float kVibrationThr = -0.65162747f;

constexpr int   kSoilWindow = 12;
constexpr float kSoilBaseline = 82.9566f;
constexpr float kSoilWindowSigma = 11.0741f;
constexpr float kSoilK = 3.0f;

// ====================== GLOBALS ======================
float soilBuffer[kSoilWindow];
int   soilIndex = 0;
bool  soilBufferFilled = false;

unsigned long lastMsg = 0;
const long interval = 5000;   // every 5 seconds

void setup_wifi();
void reconnect();
float computeVibrationScore(float x[6]);
bool checkSoilAnomaly(float currentSoil);
void setLEDs(bool isAlert);

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=== SWSN Sensor Node ===");

  pinMode(VIBRATION_PIN, INPUT);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  digitalWrite(GREEN_LED, HIGH);
  digitalWrite(RED_LED, LOW);

  for (int i = 0; i < kSoilWindow; i++) soilBuffer[i] = kSoilBaseline;

  setup_wifi();
  client.setServer(mqtt_server, 1883);
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  if (millis() - lastMsg > interval) {
    lastMsg = millis();

    // --- Read sensors ---
    int soilRaw = analogRead(SOIL_PIN);
    int vibDigital = digitalRead(VIBRATION_PIN);

    // Convert to approximate % (calibrate later)
    float soilValue = map(soilRaw, 4095, 0, 0, 100);  // adjust after calibration

    // --- Build features for model ---
    float features[6];
    features[0] = log10f(max(1.0f, (float)(soilRaw + 100)));
    features[1] = log10f(max(1.0f, (float)(vibDigital * 50 + 10)));
    features[2] = (vibDigital == 1) ? 40.0f : -30.0f;
    features[3] = (vibDigital == 1) ? 25.0f : -20.0f;
    features[4] = (float)vibDigital;
    features[5] = log10f(max(1.0f, (float)(vibDigital * 80 + 5)));

    float vibScore = computeVibrationScore(features);
    bool vibAlert  = (vibScore >= kVibrationThr);
    bool soilAlert = checkSoilAnomaly(soilValue);
    bool finalAlert = vibAlert || soilAlert;

    setLEDs(finalAlert);

    // --- Publish MQTT ---
    char payload[200];
    snprintf(payload, sizeof(payload),
      "{\"node\":1,\"soil\":%.1f,\"vib\":%d,\"vib_score\":%.3f,\"soil_alert\":%d,\"vib_alert\":%d,\"status\":%d}",
      soilValue, vibDigital, vibScore, soilAlert?1:0, vibAlert?1:0, finalAlert?1:0);

    client.publish("swsn/node1/telemetry", payload);
    if (finalAlert) client.publish("swsn/node1/alert", "1");

    Serial.println(payload);
  }
}

float computeVibrationScore(float x[6]) {
  float score = kB;
  for (int i = 0; i < 6; i++) {
    score += kW[i] * (x[i] - kMean[i]) / kScale[i];
  }
  return score;
}

bool checkSoilAnomaly(float currentSoil) {
  soilBuffer[soilIndex] = currentSoil;
  soilIndex = (soilIndex + 1) % kSoilWindow;
  if (soilIndex == 0) soilBufferFilled = true;
  if (!soilBufferFilled) return false;

  float sum = 0;
  for (int i = 0; i < kSoilWindow; i++) sum += soilBuffer[i];
  float mean = sum / kSoilWindow;
  return mean > (kSoilBaseline + kSoilK * kSoilWindowSigma);
}

void setLEDs(bool isAlert) {
  digitalWrite(GREEN_LED, isAlert ? LOW : HIGH);
  digitalWrite(RED_LED,   isAlert ? HIGH : LOW);
}

void setup_wifi() {
  Serial.print("Connecting WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("MQTT...");
    if (client.connect("SWSN_Node1")) {
      Serial.println("connected");
    } else {
      delay(3000);
    }
  }
}