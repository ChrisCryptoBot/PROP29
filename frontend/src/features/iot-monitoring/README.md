# IoT Monitoring Module

Unified module for **environmental** and **sound** sensor monitoring. Production-ready for deployment, real-world use, and future mobile agent and hardware integration.

## Structure

| Path | Purpose |
|------|--------|
| `IoTMonitoringOrchestrator.tsx` | Entry component; composes Environmental + Sound providers and tabs. |
| `types/iot-monitoring.types.ts` | Shared types (sensors, alerts, metrics, settings, tab IDs). |
| `../iot-environmental/` | Environmental sub-module (sensors, alerts, analytics, settings; full backend). |
| `../sound-monitoring/` | Sound sub-module (alerts, zones, live monitoring, analytics; stub backend). |

## Tabs

| Tab | Content |
|-----|--------|
| **Overview** | Unified metrics bar + Environmental card + Sound card. |
| **Environmental** | Sensors list (add/edit/delete/view), wired to REST + WebSocket. |
| **Sound** | Live monitoring, zones (stub data until backend). |
| **Alerts** | Single view: Environmental section + Sound section (embedded, no duplicate headers). |
| **Analytics** | Environmental analytics + Sound analytics. |
| **Settings** | Environmental settings + Sound settings. |

## Backend

- **Environmental:** `/iot` — sensors data, readings, CRUD sensors, alerts, settings. See `backend/api/iot_environmental_endpoints.py`.
- **Sound:** `/sound-monitoring` — alerts, zones, metrics, audio visualization, settings (stub). See `backend/api/sound_monitoring_endpoints.py`.

## Behaviour

- **Load & retry:** Environmental data loads on mount; on failure, a retryable error block is shown (orchestrator).
- **Offline:** Orchestrator shows an offline banner when `navigator.onLine` is false; data may be stale until reconnect.
- **Export:** Environmental export produces a CSV download from current analytics/data.
- **Delete sensor:** Uses `sensor_id` (not row `id`); confirmation via in-app modal.
- **Real-time:** Environmental subscribes to WebSocket channels `environmental_data` and `environmental_alert` when enabled in settings.

## Integration & extension

- **API and WebSocket contracts:** See project root `docs/iot-monitoring-integration.md` (ingestion, WebSocket payloads, mobile/hardware/external).
- **Adding a tab:** Extend `TabId` in `types/iot-monitoring.types.ts`, add tab in `OrchestratorContent`, and render content in `EnvironmentalContent` / `SoundContent` or a new content block.
- **Adding a sub-module:** Add provider, tab(s), and content section; keep shared types in `iot-monitoring.types.ts` or in the sub-module and re-export as needed.
- **Third-party dev:** State lives in `useIoTEnvironmentalState` / `useSoundMonitoringContext`; no business logic in presentational components. Use existing UI components (Button, Card, Modal, DataTable, Badge) per `UI-GOLDSTANDARD.md`.

## Production readiness

- Critical fixes applied: delete by `sensor_id`, CSV export, confirm delete modal, Sound stub backend, Alerts tab scope, dark-theme badges, retry/offline handling.
- Audit: `docs/audits/IOT_MONITORING_PRODUCTION_READINESS_AUDIT.md`.
