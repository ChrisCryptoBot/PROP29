# Security Operations Center Module

Production-ready surveillance and security operations UI for the PROPER 2.9 platform. Supports live camera grids, recordings, evidence, analytics, provisioning, and audit trail. Ready for deployment, real-world use, future mobile agent apps, hardware plug & play, external data sources, and clean extension by 3rd-party engineers.

## Public API (from `index.ts`)

- **Default export**: `SecurityOperationsCenterOrchestrator`
- **Orchestrator**: `SecurityOperationsCenterOrchestrator`
- **Context**: `SecurityOperationsContext`, re-exports from `context/SecurityOperationsContext`
- **Hooks**: `useSecurityOperationsState`, `useSecurityOperationsQueue`, `useSecurityOperationsHeartbeat`, `useSecurityOperationsWebSocket`, `useSecurityOperationsTelemetry`, `useNetworkStatus` (from `hooks/`)
- **Tabs**: All tab components from `components/tabs/`
- **Modals**: `EvidenceDetailsModal`, `CameraLiveModal`, `QueueManagementModal`, `ConfirmDeleteCameraModal`
- **Types**: `security-operations.types` (e.g. `CameraEntry`, `Recording`, `EvidenceItem`, `TabId`) and `camera-wall.types` (e.g. `CameraTile`, `CameraWallLayout`, `CameraWallPreset`, `CameraWallSettings`, `DisplayBounds`, `DEFAULT_WALL_SETTINGS`)

Use the feature via the app router; for programmatic use, import from `@/features/security-operations-center` (or your alias).

## Deployment & Environment

| Variable / Config | Purpose |
|-------------------|--------|
| `REACT_APP_API_URL` | Backend base URL; all API calls go through app `ApiService`. |
| WebSocket URL | Optional; configured via context for real-time camera/recording/evidence updates. |
| Auth | JWT via app auth layer. PTZ and provisioning require Security Manager or Admin role. |
| Electron | When running in Electron, multi-monitor and desktop shortcuts use `ElectronBridge`. |

## Backend contract (key endpoints)

The frontend expects these API shapes; implement or proxy them for deployment and integrations.

- **Cameras**: `GET /security-operations/cameras`, `POST /security-operations/cameras`, `GET/PATCH/DELETE /security-operations/cameras/{id}`, `POST /security-operations/cameras/{id}/heartbeat`, `POST /security-operations/cameras/{id}/ptz`, `POST /security-operations/cameras/register/hardware`
- **Recordings**: `GET /security-operations/recordings`, `GET /security-operations/recordings/{id}`, `POST /security-operations/recordings/{id}/export`, `POST /security-operations/recordings/export-batch` (job polling via returned job ID)
- **Evidence**: `GET /security-operations/evidence`, `GET /security-operations/evidence/{id}`, chain-of-custody fields in response
- **Audit trail**: `GET /security-operations/audit-trail` (paginated), `POST /security-operations/audit-trail` (ingest)
- **Mobile / ingest**: `POST /security-operations/recordings/ingest/mobile-agent` (and related ingest endpoints as documented in backend)

Camera payloads should include `lastHeartbeat`, `lastStatusChange`, and `version` for heartbeat and reconciliation. PTZ action values: `pan_left`, `pan_right`, `tilt_up`, `tilt_down`, `zoom_in`, `zoom_out`, `home`.

## Real-World Use

- **Live View**: Choose layout (1–16 cameras), select which cameras to show, edge-to-edge grid. Camera Wall mode supports unlimited draggable tiles and presets.
- **Recordings / Evidence**: Export uses backend jobs; download URLs are served by the API. Evidence chain-of-custody is recorded server-side.
- **Provisioning**: Camera credentials are sent to the backend only; never stored or logged client-side.
- **Audit Trail**: Prefer server-side audit (`GET /security-operations/audit-trail`); tab falls back to local audit log if backend is unavailable.
- **Offline**: Queue and banner indicate pending/failed actions; retry and sync are available.

## Mobile Agent Applications (Future)

- Backend endpoints ready for ingestion: `POST /security-operations/recordings/ingest/mobile-agent`, etc. Use `X-API-Key` or JWT as required.
- Event shapes and correlation IDs should match backend schema; extend `security-operations.types.ts` and service layer as new payloads are defined.

## Hardware Plug & Play

- **Heartbeat**: `POST /security-operations/cameras/{id}/heartbeat` (JWT or `X-API-Key`). Frontend uses `lastHeartbeat` / `lastStatusChange` for staleness and last-known-good state.
- **Device registration**: `POST /security-operations/cameras/register/hardware` for auto-provisioning; see backend docs for payload.
- **PTZ**: `POST /security-operations/cameras/{id}/ptz` with action one of: `pan_left`, `pan_right`, `tilt_up`, `tilt_down`, `zoom_in`, `zoom_out`, `home`.

## External Data Sources

- **VMS/NVR / alarm systems**: Integrate via backend. Frontend consumes cameras, recordings, and evidence from existing API; add new endpoints and map in `securityOperationsCenterService.ts`.
- **WebSocket**: Subscribe to channels for cameras, recordings, evidence, alerts; reconciliation is in `stateReconciliationService.ts` and WebSocket hook.

## Cross-Module Navigation

- **Deep link**: Opening `/modules/security-operations-center?cameraId=<id>` (e.g. from IoT Environmental) switches to Live View and opens the camera modal for that ID when the camera list has loaded. The `cameraId` query param is cleared after handling.

## For 3rd-Party Engineers

- **Entry**: `SecurityOperationsCenterOrchestrator.tsx` wraps tabs and providers; routing is handled by the app.
- **State**: `SecurityOperationsContext` (from `useSecurityOperationsState`) plus `CameraModalManagerContext`, `CameraWallLayoutContext`. No Redux.
- **API**: All calls go through `services/securityOperationsCenterService.ts` with retries and logging. Types in `types/security-operations.types.ts` and `types/camera-wall.types.ts`.
- **UI**: Shared components from `../../components/UI`; Gold Standard patterns in `UI-GOLDSTANDARD.md`. Tabs in `components/tabs/`, modals in `components/modals/`.
- **Telemetry**: `useSecurityOperationsTelemetry` logs actions; plug in your analytics in the hook’s `trackEvent` implementation (see comment in code).
- **Tests**: `__tests__/` for context and state hook; add integration tests against a stub API as needed.
- **Camera Wall**: Context `CameraWallLayoutContext` (use `useCameraWallLayout`) and types in `camera-wall.types.ts` are public; layout/presets persist to localStorage by default and can be replaced with API persistence.
