/*
 * SWSN Gateway
 * Receives MQTT from Sensor Node → POSTs to Next.js / MongoDB
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <HTTPClient.h>

const char* ssid        = "YOUR_HOTSPOT_NAME";
const char* password    = "YOUR_HOTSPOT_PASSWORD";
const char* mqtt_server = "192.168.43.105";          // Laptop IP
const char* api_url     = "http://192.168.43.105:3000/api/readings";  // Next.js API

WiFiClient espClient;
PubSubClient client(espClient);

void setup_wifi();
void reconnect();
void callback(char* topic, byte* payload, unsigned int length);

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=== SWSN Gateway ===");

  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();
}

void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.print("Received [");
  Serial.print(topic);
  Serial.print("] ");
  Serial.println(message);

  // Only forward telemetry
  if (String(topic) == "swsn/node1/telemetry") {
    HTTPClient http;
    http.begin(api_url);
    http.addHeader("Content-Type", "application/json");

    int httpCode = http.POST(message);
    Serial.print("POST status: ");
    Serial.println(httpCode);

    http.end();
  }
}

void setup_wifi() {
  Serial.print("Connecting WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println("\nWiFi OK");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("MQTT connecting...");
    if (client.connect("SWSN_Gateway")) {
      Serial.println("connected");
      client.subscribe("swsn/node1/telemetry");
      client.subscribe("swsn/node1/alert");
    } else {
      delay(3000);
    }
  }
}