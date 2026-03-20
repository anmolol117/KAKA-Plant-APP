# KAKA - Smart Plant Companion

KAKA is a product-style full-stack IoT web app for monitoring plant health, visualizing sensor data, and rendering an animated plant companion that reacts emotionally to live conditions.

## Stack

- Frontend: React + Vite + Tailwind CSS + Framer Motion + Recharts
- Backend: Node.js + Express + Server-Sent Events
- Firmware: ESP32 Arduino sketch using `WiFi.h` and `HTTPClient.h`

## Project Structure

- `client/` - React application
- `server/` - REST API and real-time stream
- `esp32/` - sample firmware

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start both apps:

```bash
npm run dev
```

3. Open:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## Deployment

Recommended split:

- Frontend: Vercel
- Backend: Render

### Backend on Render

This repo includes [render.yaml](/Users/anmol117/Documents/New%20project/render.yaml) for the Express API.

Set these environment variables in Render:

```bash
PORT=10000
CLIENT_ORIGIN=https://your-vercel-app-url.vercel.app
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

After deploy, your API base will look like:

```bash
https://your-render-service.onrender.com/api/v1
```

### Frontend on Vercel

Deploy the `client/` app and set:

```bash
VITE_API_BASE_URL=https://your-render-service.onrender.com/api/v1
```

Build settings:

```bash
Framework Preset: Vite
Root Directory: client
Build Command: npm run build
Output Directory: dist
```

### Deployment Order

1. Deploy backend on Render
2. Copy the Render API URL
3. Deploy frontend on Vercel with `VITE_API_BASE_URL` set to that API URL
4. Update Render `CLIENT_ORIGIN` to the final Vercel URL if needed

## Environment

Create `server/.env` if you want to customize values:

```bash
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
FIREBASE_PROJECT_ID=kaka-plant-app
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

You can also provide the full service account JSON as `FIREBASE_SERVICE_ACCOUNT_JSON`.

## API

- `POST /api/v1/sensor-data`
- `GET /api/v1/latest`
- `GET /api/v1/history?type=soil_moisture&range=24h`
- `GET /api/v1/suggestions`
- `GET /api/v1/settings`
- `POST /api/v1/preferences`
- `GET /api/v1/stream`

## Notes

- The backend is designed to persist readings, settings, preferences, and care tracker data in Firestore.
- The server uses the Firebase Admin SDK, so it needs Firebase service account credentials in `server/.env`.
- Sound effects are implemented with browser-generated tones, so there are no binary assets required.

## ESP32 Firmware

The sketch in [esp32/kaka_plant_companion.ino](/Users/anmol117/Documents/New%20project/esp32/kaka_plant_companion.ino) is set up to:

- connect to WiFi
- read:
  - soil moisture from an analog soil sensor on `GPIO34`
  - sunlight from a photoresistor on `GPIO35`
  - temperature and humidity from a `DHT11` on `GPIO4`
- POST a JSON reading to `/api/v1/sensor-data`
- sleep in deep sleep for 60 seconds between uploads

Expected payload format:

```json
{
  "timestamp": 1710000000,
  "soil_moisture": 18,
  "sunlight": 5400,
  "temperature": 24.0,
  "humidity": 31.0
}
```

Before flashing, update these values in the sketch:

- `WIFI_SSID`
- `WIFI_PASSWORD`
- `API_URL`
- `SOIL_RAW_DRY`
- `SOIL_RAW_WET`

Notes about calibration:

- Soil moisture percentage depends on your sensor's actual dry and wet ADC readings.
- Photoresistor lux is an estimated conversion and usually needs tuning for your resistor pair and enclosure.
- The sketch uses NTP to generate real Unix timestamps before posting readings.
