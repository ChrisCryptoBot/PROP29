# Hardware: Which Modules Use It, What Type, and How to Start Testing

This guide answers: **which modules use hardware**, **what device types** the system supports, **what products/protocols** it is designed to work with, and **where to start** (e.g. cameras).

---

## 1. Modules That Use Hardware

| Module | Hardware type | Purpose | Backend / Auth |
|--------|----------------|---------|----------------|
| **Security Operations Center** | Cameras | Live view, recording, evidence, PTZ, heartbeat | `POST /security-operations/cameras/register/hardware-device`, `POST .../ingest/hardware-device` — **X-API-Key** (same as `HARDWARE_INGEST_KEY`) |
| **Incident Log** | Cameras, sensors, access control, alarm, environmental | Incidents *from* devices (source = device/sensor); device health in Overview | `GET /incidents/hardware/health`, `GET /incidents/hardware/{device_id}/status` — JWT; ingest uses same key as above where applicable |
| **IoT Environmental** | Environmental sensors | Temperature, humidity, smoke, air quality; optional link to camera | `POST /iot/sensors/data` — JWT or agent; hardware gateways use same API |
| **Access Control** | Doors, gates, elevators, turnstiles, barriers | Access points / readers; register & heartbeat | `POST /access-control/access-points/register/hardware` — **X-API-Key** |
| **Guest Safety** | Panic buttons, sensors, cameras | Ingest incidents from devices (e.g. panic button, sensor) | `POST /guest-safety/incidents/ingest/hardware-device`, `POST .../ingest/guest-panic` — **X-API-Key** for hardware |
| **Smart Lockers** | Physical lockers | Release command sent to bridge (solenoid, etc.) | `POST /hardware/lockers/{locker_id}/release` — JWT; backend calls **HARDWARE_BRIDGE_URL** |
| **Sound Monitoring** | Sound sensors / mics | Alerts, zones, metrics — **stub only** for now | Backend returns empty/defaults until real hardware is wired |
| **Patrol** | Officer devices | Check-in, heartbeat | `X-API-Key` or JWT for device heartbeat |

So the main places to start for **hardware testing** are:

1. **Cameras** → Security Operations Center (and optionally Incident Log when device-sourced incidents are used).
2. **Environmental sensors** → IoT Environmental.
3. **Doors / access readers** → Access Control.
4. **Panic buttons / guest devices** → Guest Safety.

---

## 2. Device Types the System Configures With

The system is **protocol/API-oriented**, not tied to specific brands. It expects:

### 2.1 Cameras (Security Operations Center + Incident Log)

- **Stream**: Any **RTSP**, **HTTP**, **HTTPS**, or **WebSocket** URL. Backend can proxy RTSP to HLS for the UI; raw URL stored as `source_stream_url`.
- **Registration**: Device sends `device_id`, `device_name`, `location`, `stream_url`, optional `device_type` (e.g. `"camera"`), optional `capabilities`. Backend creates/updates a camera record.
- **Heartbeat**: `POST /security-operations/cameras/{id}/heartbeat` (JWT or **X-API-Key**) to keep status “online”.
- **PTZ**: `POST /security-operations/cameras/{id}/ptz` with action: `pan_left`, `pan_right`, `tilt_up`, `tilt_down`, `zoom_in`, `zoom_out`, `home`. Backend has a TODO to send commands via ONVIF/RTSP to real hardware.
- **Products**: Any IP camera or NVR/VMS that can:
  - Expose an RTSP (or HTTP/HLS) stream URL, and
  - Either call our register/heartbeat APIs (via a small gateway or firmware) or be manually added in the UI with that stream URL.

So you can start with **any RTSP-capable camera** (e.g. generic ONVIF camera, or a test RTSP stream). No specific vendor (e.g. Hikvision, Axis) is required; the system just needs a URL and optional registration payload.

### 2.2 Environmental Sensors (IoT Environmental)

- **Types**: `temperature`, `humidity`, `smoke`, `air_quality` (backend enum).
- **Ingestion**: `POST /iot/sensors/data` with `sensor_id`, `sensor_type`, `location`, and readings (`value`, or `temperature` / `humidity` / `air_quality` / `smoke_level`, etc.). Optional `camera_id` to associate with a camera.
- **Products**: Any device or gateway that can HTTP POST to that endpoint (e.g. Raspberry Pi + sensor, commercial environmental gateway, BMS/HVAC integration). No specific product names in code.

### 2.3 Access Control (Doors, Gates, etc.)

- **Types**: `door`, `gate`, `elevator`, `turnstile`, `barrier`.
- **Registration**: Hardware (or gateway) registers an access point with `device_id`, `device_type`, etc., using **X-API-Key**.
- **Products**: Any door controller or access reader that can call the REST API (directly or via a small integration service). No specific vendor in code.

### 2.4 Guest Safety (Panic / Alerts)

- **Types**: e.g. `panic_button`, `sensor`, `camera`, `access_control`, `alarm`, `environmental`, `other`.
- **Ingestion**: `POST /guest-safety/incidents/ingest/hardware-device` or `.../ingest/guest-panic` with `device_id`, `device_type`, location, etc. **X-API-Key** for hardware.
- **Products**: Any panic button or alarm device that can send an HTTP POST (or that talks to a gateway which does).

### 2.5 Smart Lockers

- **Control**: Backend sends a release command to an external **hardware bridge** at `HARDWARE_BRIDGE_URL` (e.g. `POST {HARDWARE_BRIDGE_URL}/lockers/{locker_id}/release`). The bridge is responsible for talking to the physical lock (solenoid, etc.).
- **Products**: Any locker system that has (or can be given) a small bridge service implementing that contract. No specific product names in code.

---

## 3. Environment / Config Relevant to Hardware

- **`HARDWARE_INGEST_KEY`**  
  Used to validate **X-API-Key** on hardware ingest/register endpoints (cameras, access control, guest safety, etc.). Set this in env and send it as header `X-API-Key` from devices or gateways.

- **`HARDWARE_BRIDGE_URL`**  
  Used only for **smart locker release**. Backend POSTs here to trigger a physical release. If not set, the backend returns a mock success and does not call any hardware.

- **`HARDWARE_API_URL` / `HARDWARE_API_KEY`** (in `env.production.template`)  
  Generic placeholders for “hardware API”; not currently used in the code paths above. You can ignore or repurpose for your own gateway.

- **`CAMERA_INTEGRATION_ENABLED`, `DOOR_CONTROLLER_ENABLED`, `SENSOR_INTEGRATION_ENABLED`**  
  Listed in the template; actual feature flags may depend on your deployment. Use them to turn on/off camera, door, or sensor integrations if you implement checks.

---

## 4. Where to Start: Camera Testing

Recommended order:

1. **Manual camera (no physical device yet)**  
   - In the app: **Security Operations Center → Provisioning (or Add Camera)**.  
   - Enter a **stream URL** (e.g. a public RTSP test stream, or an HLS URL).  
   - Backend accepts RTSP/HTTP/HTTPS/WS; it can proxy RTSP to HLS for the browser.  
   - You get live view and UI behavior without any “Plug & Play” device.

2. **Plug & Play style (device registers itself)**  
   - Use a camera (or a script simulating it) that can send:
     - `POST /security-operations/cameras/register/hardware-device`  
       Body: `device_id`, `device_name`, `location`, `stream_url`, optional `device_type`, `capabilities`.  
     - Header: `X-API-Key: <HARDWARE_INGEST_KEY>`  
   - Then send heartbeats: `POST /security-operations/cameras/{camera_id}/heartbeat` with same key.  
   - After that, the camera appears in Security Operations Center (and can feed into Incident Log if you create device-sourced incidents).

3. **Physical camera**  
   - Prefer a camera that:
     - Exposes **RTSP** (or HTTP/HLS) and  
     - Either has an API/integration that can call our register/heartbeat, or is added manually with its stream URL.  
   - Many ONVIF IP cameras expose RTSP; you can use their RTSP URL in the console. No specific brand is required; the system does not configure vendor-specific features, only stream URL and optional PTZ (with ONVIF/RTSP planned in backend TODO).

4. **Incident Log**  
   - Device health in Incident Log (Overview) comes from `GET /incidents/hardware/health` and `GET /incidents/hardware/{device_id}/status`.  
   - Those are stubs returning empty/default until you wire real device registration. Camera testing is still best started in Security Operations Center; then you can add device-sourced incidents or health later.

---

## 5. Summary Table: Modules → Hardware Type → How to Test

| Module | Hardware type | Products / protocols | Start testing |
|--------|----------------|---------------------|----------------|
| **Security Operations Center** | Cameras | Any IP camera / NVR with RTSP or HTTP stream; register + heartbeat via API | Add camera with stream URL in UI; then simulate or use device calling register + heartbeat with X-API-Key |
| **Incident Log** | Camera, sensor, access_control, alarm, environmental | Same as above; health/status APIs are stubs until you wire devices | After cameras work in SOC, optional device-sourced incidents and health |
| **IoT Environmental** | Temperature, humidity, smoke, air_quality | Any gateway or device that can POST to `/iot/sensors/data` | POST sensor readings with JWT or from a test script; then attach real sensors to a gateway |
| **Access Control** | Door, gate, elevator, turnstile, barrier | Any controller/reader that can call register + heartbeat with X-API-Key | Register an access point from a script or gateway, then test lock/unlock in UI |
| **Guest Safety** | Panic button, sensor, camera, etc. | Any device or gateway that can POST to ingest endpoints with X-API-Key | Send test ingest payloads for panic/hardware-device |
| **Smart Lockers** | Physical lockers | Any system that exposes a release API compatible with `HARDWARE_BRIDGE_URL` | Set `HARDWARE_BRIDGE_URL` to a mock or real bridge; trigger release from UI |
| **Sound Monitoring** | Sound sensors | Stub only | No real hardware path yet; backend returns empty/defaults |

The system is built to work with **generic protocols and REST/WebSocket APIs**, not with a fixed list of products. For cameras, start with **any RTSP-capable camera or test stream** and the Security Operations Center module; then add environmental sensors, access control, or panic devices as needed.
