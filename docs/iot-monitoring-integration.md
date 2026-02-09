# IoT Monitoring — Integration Guide

This document describes how to integrate with the IoT Monitoring module: data ingestion, WebSocket contracts, cross-module navigation, and extension points for mobile agents, hardware devices, and external data sources.

**Scope:** Environmental sensors (full backend), Sound monitoring (stub backend).  
**Reference:** Backend `api/iot_environmental_endpoints.py`, `api/sound_monitoring_endpoints.py`; frontend `frontend/src/features/iot-monitoring`, `iot-environmental`, `sound-monitoring`.

---

## 1. Environmental Data Ingestion (REST)

All environmental endpoints are under **`/iot`** (prefix). Auth: Bearer token; sensor CRUD requires security manager or admin.

| Method | Path | Purpose |
|--------|------|--------|
| `POST` | `/iot/sensors/data` | Record a single sensor reading (hardware/agent/ingestion). |
| `GET` | `/iot/sensors/readings` | List sensor readings (same as `/iot/environmental`). |
| `GET` | `/iot/environmental` | List environmental data (sensor readings). |
| `POST` | `/iot/environmental/sensors` | Create sensor (logical sensor record). |
| `PUT` | `/iot/environmental/sensors/{sensor_id}` | Update sensor. |
| `DELETE` | `/iot/environmental/sensors/{sensor_id}` | Delete sensor (**use `sensor_id`**, not row `id`). |
| `GET` | `/iot/reports/environmental` | Environmental report (query: `start_date`, `end_date`, optional `location`). |
| `GET` | `/iot/environmental/alerts` | List environmental alerts. |
| `POST` | `/iot/environmental/alerts` | Create alert. |
| `PUT` | `/iot/environmental/alerts/{alert_id}` | Update alert (e.g. acknowledge/resolve). |
| `GET` | `/iot/environmental/settings` | Get settings. |
| `PUT` | `/iot/environmental/settings` | Update settings. |

### Record sensor data (ingestion)

**`POST /iot/sensors/data`**

Body (`IoTEnvironmentalDataCreate`): `sensor_id`, `sensor_type`, `location`, optional: `camera_id`, `value`, `unit`, `temperature`, `humidity`, `air_quality`, `smoke_level`, `water_level`, `gas_level`, `pressure`, `vibration`, `battery_level`, `signal_strength`, `threshold_min`, `threshold_max`.

Use this for:
- Hardware devices (plug & play gateways posting readings).
- Mobile agent apps (agents that read environmental sensors and push data).
- External systems (BMS, HVAC, third-party environmental APIs).

**Real-time updates:** When sensor data is recorded, the backend broadcasts a WebSocket message to all connected clients on channel `environmental_data`. Frontend automatically updates the UI in real-time.

---

## 2. WebSocket Contracts (Environmental)

The frontend connects to the app WebSocket (e.g. `/ws/{user_id}`) and subscribes by **channel name**. The backend sends JSON messages that the frontend routes by `type` or channel. The environmental feature subscribes to:

| Channel | Purpose | Expected payload shape |
|---------|--------|-------------------------|
| `environmental_data` | New or updated sensor reading | `{ "type": "environmental_data", "sensor_data": <IoTEnvironmentalDataResponse-like object> }`. Must include `id` (or equivalent) for upsert. |
| `environmental_alert` | New environmental alert | `{ "type": "environmental_alert", "alert": <SensorAlertResponse-like object> }`. Must include `message` for notifications. |

**Backend implementation:** WebSocket broadcasting is implemented in `backend/api/iot_environmental_endpoints.py`. When `record_sensor_data`, `create_environmental_alert`, or `update_environmental_alert` completes, the backend broadcasts to all connected WebSocket clients.

If the backend does not emit these channels, the UI will not receive real-time updates; initial load and refresh still work via REST. To enable real-time:

- Backend broadcasts automatically after sensor data/alerts are created/updated (implemented).
- Ensure payloads match the frontend expectations in `useIoTEnvironmentalState.ts` (e.g. `sensor_data` / `alert` keys and field names).

---

## 3. Sound Monitoring (Stub Backend)

Sound monitoring APIs are under **`/sound-monitoring`**. Currently **stub only**: all GETs return empty lists or default metrics; POST/PUT return 200 with stub bodies. Use for wiring and future hardware/agent integration.

| Method | Path | Purpose |
|--------|------|--------|
| `GET` | `/sound-monitoring/alerts` | List sound alerts (stub: `[]`). |
| `GET` | `/sound-monitoring/alerts/{alert_id}` | Get one alert (stub). |
| `POST` | `/sound-monitoring/alerts/{alert_id}/acknowledge` | Acknowledge (stub). |
| `POST` | `/sound-monitoring/alerts/{alert_id}/resolve` | Resolve (stub). |
| `GET` | `/sound-monitoring/zones` | List zones (stub: `[]`). |
| `GET` | `/sound-monitoring/metrics` | Metrics (stub: zeros/defaults). |
| `GET` | `/sound-monitoring/audio-visualization` | Live audio (stub: empty waveform). |
| `GET` | `/sound-monitoring/settings` | Settings (stub). |
| `PUT` | `/sound-monitoring/settings` | Update settings (stub). |

When implementing the real backend:

- Alerts: consider `id` as string or number consistently (frontend types use number for SoundAlert.id; align API contract).
- Add ingestion endpoints (e.g. `POST /sound-monitoring/ingest` or per-zone data) for hardware/mobile agents.
- Optionally add WebSocket channels for live sound alerts and levels.

---

## 4. Cross-Module Integration & Navigation

- **Security Operations Center (SOC):** The Environmental Overview tab links to SOC via "SECURE FEED" button when a sensor has `camera_id`. Navigation uses route `/modules/security-operations-center?cameraId={camera_id}`. The SOC LiveViewTab automatically opens the camera modal when `cameraId` query param is present (verified working).
- **Incident Log / Guest Safety:** 
  - **Current:** No automatic integration. Environmental or sound alerts can be manually forwarded to incidents.
  - **Future Integration Point:** Backend can implement automatic incident creation when critical environmental alert is created. Suggested implementation:
    - In `backend/services/iot_environmental_service.py`, after `create_alert()` commits a critical alert, call `GuestSafetyService.create_incident()` or `IncidentLogService.create_incident()` with alert details.
    - Frontend can link from alert detail modal to incident if `incident_id` is stored in alert metadata.
    - Example payload: `{ type: 'environmental', source: 'iot_monitoring', source_metadata: { alert_id, sensor_id }, severity, location, description }`
- **Access Control / Lockdown:** No direct wiring in current implementation; can be extended (e.g. trigger lockdown on critical environmental alert via backend integration).

Navigation to IoT Monitoring is via the main app sidebar/module list; route `/modules/iot-monitoring` as defined in the app router.

---

## 5. Mobile Agent Applications (Future)

- **Environmental:** Agents can POST readings to `POST /iot/sensors/data` with appropriate `sensor_id`, `sensor_type`, `location`, and readings. Optionally associate with `camera_id` if the agent is camera-based.
- **Alerts:** Agents can create alerts via `POST /iot/environmental/alerts` with `sensor_id`, `alert_type`, `severity`, `description`, `location`.
- **Sound:** When sound backend is implemented, add ingestion endpoints and document agent payloads (e.g. zone_id, decibel_level, threshold_exceeded).

No mobile-agent-specific endpoints exist yet; use the same REST APIs with auth.

---

## 6. Hardware Devices (Plug & Play)

- **Environmental:** Devices (or gateways) should POST to `POST /iot/sensors/data`. Use a stable `sensor_id` per device (e.g. MAC or device serial). Frontend lists sensors by reading data; create sensor via `POST /iot/environmental/sensors` if you need a logical sensor record first.
- **Sound:** When sound backend is implemented, define ingestion (e.g. per-zone or per-device) and ensure device IDs are consistent (e.g. zone_id, device_id).
- **Status:** No dedicated "hardware device status" endpoint in IoT Monitoring; use sensor readings and alerts as the source of truth. Optional: add `GET /iot/environmental/sensors` for "last seen" if needed.

**Real-time updates:** Hardware devices posting sensor data will trigger WebSocket broadcasts, and the UI will update in real-time without manual refresh.

---

## 7. External Data Sources

- **Environmental:** Same as ingestion — `POST /iot/sensors/data` and `POST /iot/environmental/alerts`. Include any external source identifier in `location` or extend backend to store `source`/`source_metadata` if required.
- **Sound:** When implemented, expose ingestion APIs and document payload format for third-party systems (e.g. BMS, audio analytics providers).

---

## 8. Frontend State & Extension Points

- **Environmental:** `useIoTEnvironmentalState` + `IoTEnvironmentalContext`; all API calls and WebSocket subscribe in the hook. Export/refresh, load error + retry, offline banner are in the orchestrator or hook. Retry logic with exponential backoff is implemented for all mutations. Optimistic updates for delete/acknowledge/resolve with rollback on failure.
- **Sound:** `useSoundMonitoringContext`; service calls go to `soundMonitoringService` (stub endpoints). Settings auto-load on mount. When backend is real, switch service to real API and align types.
- **Orchestrator:** `IoTMonitoringOrchestrator` composes Environmental + Sound; tabs: Overview, Environmental, Sound, Alerts (unified), Analytics, Settings. Adding a new sub-module: add provider, tab(s), and content in the orchestrator; keep types in `iot-monitoring.types.ts` or feature-specific types.

---

*Last updated: 2025-02-05. Align with backend OpenAPI and frontend types when changing APIs.*
