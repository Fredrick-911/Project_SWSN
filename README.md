
# SWSN – Subterranean Wireless Sensor Network

**Artisanal Mine Safety Monitoring System**

Real-time monitoring of **soil moisture** and **vibration** in underground artisanal mines using ESP32 nodes, TinyML anomaly detection, MQTT, and a modern Next.js dashboard.

---

## Table of Contents

- [Project Overview](#project-overview)
- [System Architecture](#system-architecture)
- [Folder Structure](#folder-structure)
- [Hardware Required](#hardware-required)
- [Wiring Diagram](#wiring-diagram)
- [Software Requirements](#software-requirements)
- [1. Installations](#1-installations)
- [2. Backend + Frontend Setup](#2-backend--frontend-setup)
- [3. Machine Learning Model](#3-machine-learning-model)
- [4. ESP32 Codes](#4-esp32-codes)
- [5. Testing Flow](#5-testing-flow)
- [6. API Endpoints](#6-api-endpoints)
- [7. MQTT Topics](#7-mqtt-topics)
- [8. Important Notes](#8-important-notes)
- [9. Tech Stack](#9-tech-stack)
- [License](#license)

---

## Project Overview

This system detects abnormal soil moisture levels and ground vibrations that may indicate structural instability or flooding risk in artisanal mines.

**Key Features:**

- TinyML model running on the Sensor Node for on-device anomaly detection
- Dual LED indication (Green = Normal, Red = Alert)
- MQTT communication between Sensor Node and Gateway
- Gateway forwards data to a Next.js + MongoDB backend
- Live dashboard with real-time updates

---

## System Architecture

```text
Sensor Node (ESP32 #1)
        │
        │  MQTT (swsn/node1/telemetry)
        ▼
Gateway (ESP32 #2)
        │
        │  HTTP POST
        ▼
Next.js API + MongoDB
        │
        ▼
Live Dashboard (Browser)
```

---

## Folder Structure

```text
dashboard_swsn/
├── app/
│   ├── api/
│   │   └── readings/
│   │       ├── route.ts
│   │       └── latest/
│   │           └── route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── swsn-dashboard.tsx
│   └── ui/
│       └── button.tsx
├── lib/
│   ├── mongodb.ts
│   ├── models/
│   │   └── Reading.ts
│   └── utils.ts
├── node_gateway/          ← ESP32 codes
│   ├── sensor_node.ino
│   └── gateway.ino
├── .env.local
├── package.json
└── README.md
```

---

## Hardware Required

| Component                        | Quantity | Notes                         |
| -------------------------------- | -------- | ----------------------------- |
| ESP32 DevKit                     | 2        | One Sensor Node + One Gateway |
| Soil Moisture Sensor (HW-080)    | 1        | Analog output                 |
| Vibration Sensor (801S / SW-420) | 1        | Digital output                |
| Green LED                        | 1        | Normal status                 |
| Red LED                          | 1        | Alert status                  |
| 220Ω Resistors                  | 2        | For LEDs                      |
| Jumper wires + Breadboard        | -        |                               |

---

## Wiring Diagram

### Sensor Node (ESP32 #1)

| Component              | ESP32 Pin | Notes                  |
| ---------------------- | --------- | ---------------------- |
| Soil Moisture (AO)     | GPIO 34   | Analog                 |
| Soil Moisture (VCC)    | 3.3V      |                        |
| Soil Moisture (GND)    | GND       |                        |
| Vibration Sensor (DO)  | GPIO 27   | Digital                |
| Vibration Sensor (VCC) | 3.3V      |                        |
| Vibration Sensor (GND) | GND       |                        |
| Green LED (+)          | GPIO 25   | Through 220Ω resistor |
| Red LED (+)            | GPIO 26   | Through 220Ω resistor |
| Both LED (−)          | GND       |                        |

### Gateway (ESP32 #2)

- Only power and WiFi required (no sensors)

---

## Software Requirements

- Node.js 18 or higher
- npm
- MongoDB (local or MongoDB Atlas)
- Mosquitto MQTT Broker
- Arduino IDE with ESP32 board support
- Git

---

## 1. Installations

### 1.1 Node.js & npm

Download and install from [https://nodejs.org](https://nodejs.org)

### 1.2 MongoDB

- **Local:** Install MongoDB Community Edition
- **Cloud:** Or use MongoDB Atlas

### 1.3 Mosquitto MQTT Broker

**Windows:**

1. Download from [https://mosquitto.org/download/](https://mosquitto.org/download/)
2. Install and make sure to add it to PATH
3. Run in terminal:

```bash
mosquitto -v
```

**macOS:**

```bash
brew install mosquitto
mosquitto -v
```

**Linux:**

```bash
sudo apt update
sudo apt install mosquitto mosquitto-clients
mosquitto -v
```

### 1.4 Arduino IDE + ESP32

1. Install Arduino IDE
2. Go to **File → Preferences → Additional Board Manager URLs** and add:

```text
https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
```

3. Install **esp32 by Espressif Systems** via Board Manager
4. Install library: **PubSubClient** by Nick O'Leary

---

## 2. Backend + Frontend Setup

```bash
git clone <your-repository-url>
cd dashboard_swsn
npm install
```

Create a file named `.env.local` in the root:

```properties
MONGODB_URI=mongodb://127.0.0.1:27017/swsn
```

Start the development server:

```bash
npm run dev
```

Dashboard will be available at: [http://localhost:3000](http://localhost:3000/)

---

## 3. Machine Learning Model

A lightweight linear TinyML model was trained to detect vibration anomalies using features derived from seismic patterns.

The model is embedded directly in the Sensor Node firmware (`sensor_node.ino`) together with a soil moisture window-based detector.

**Model decision logic:**

- Vibration score is calculated using the trained weights
- Soil moisture uses a sliding window mean compared against baseline + threshold
- Final alert is triggered if either detector raises an alarm
- **Green LED** = Normal | **Red LED** = Alert

---

## 4. ESP32 Codes

All ESP32 codes are located in the `node_gateway/` folder.

### Sensor Node

1. Open `node_gateway/sensor_node.ino` in Arduino IDE
2. Change these values:

```cpp
const char* ssid        = "YOUR_HOTSPOT_NAME";
const char* password    = "YOUR_HOTSPOT_PASSWORD";
const char* mqtt_server = "YOUR_LAPTOP_IP";   // e.g. 192.168.43.105
```

3. Select your ESP32 board and upload

### Gateway

1. Open `node_gateway/gateway.ino`
2. Change these values:

```cpp
const char* ssid        = "YOUR_HOTSPOT_NAME";
const char* password    = "YOUR_HOTSPOT_PASSWORD";
const char* mqtt_server = "YOUR_LAPTOP_IP";
const char* api_url     = "http://YOUR_LAPTOP_IP:3000/api/readings";
```

3. Upload to the second ESP32

### How to find your Laptop IP

- **Windows** → `ipconfig`
- **macOS/Linux** → `ifconfig` or `ip addr`

---

## 5. Testing Flow

1. **Start Mosquitto broker:**

   ```bash
   mosquitto -v
   ```
2. **Start the Next.js dashboard:**

   ```bash
   npm run dev
   ```
3. **Power the Sensor Node**

   - Green LED should turn on (Normal)
   - Red LED turns on when an anomaly is detected
4. **Power the Gateway**

   - It will receive MQTT messages and forward them to the backend
5. **Open the dashboard in your browser:**

   ```text
   http://localhost:3000
   ```

   Live soil moisture and vibration values should appear.

---

## 6. API Endpoints

| Method | Endpoint                 | Description                     |
| ------ | ------------------------ | ------------------------------- |
| GET    | `/api/readings/latest` | Returns the most recent reading |
| GET    | `/api/readings`        | Returns recent history          |
| POST   | `/api/readings`        | Used by Gateway to save data    |

---

## 7. MQTT Topics

| Topic                    | Direction       | Purpose               |
| ------------------------ | --------------- | --------------------- |
| `swsn/node1/telemetry` | Node → Gateway | Main sensor data      |
| `swsn/node1/alert`     | Node → Gateway | Alert flag (optional) |

---

## 8. Important Notes

- Calibrate the soil moisture sensor by taking readings in dry air and in water, then adjust the mapping in `sensor_node.ino`.
- After collecting real data from your soil probe, recompute `kSoilBaseline` and `kSoilWindowSigma` for better accuracy.
- Make sure the phone hotspot, laptop, and both ESP32s are on the **same network**.
- The current vibration sensor provides digital (0/1) output. The model uses a practical mapping of this signal.
- Keep the Mosquitto terminal open while testing.

---

## 9. Tech Stack

| Layer         | Technology                                    |
| ------------- | --------------------------------------------- |
| Hardware      | ESP32, Soil Moisture Sensor, Vibration Sensor |
| Firmware      | Arduino (C++)                                 |
| Communication | MQTT (Mosquitto) + HTTP                       |
| Backend       | Next.js API Routes + MongoDB + Mongoose       |
| Frontend      | Next.js, React, Tailwind CSS, Lucide Icons    |
| Edge AI       | Custom linear TinyML model                    |

---

## License

This project was developed as a prototype for academic / competition purposes.
