# Live Streaming Audit & Diagnosis — Security Operations Center

**Scope:** End-to-end path from frontend Live View → backend HLS proxy → FFmpeg RTSP→HLS → consistency and failure modes.  
**Date:** 2026-02-08.

---

## 0. Independent code verification (diagnosis summary)

A full trace of the live-streaming path was performed against the codebase. The following causes explain why streaming is not consistent:

| # | Cause | Location | Verified |
|---|--------|----------|----------|
| 1 | Backend returns **200 + `[]`** on any exception in `list_cameras`; **200 + empty metrics** in `get_camera_metrics`. | `security_operations_endpoints.py` L89–96, L118–126 | ✓ |
| 2 | Frontend **replaces** camera list with API response. When that response is `[]` (from backend error or service catch), **all tiles disappear**. | `useSecurityOperationsState.ts` L161–190: `setCameras(prev => data.map(...))`; `securityOperationsCenterService.ts` L69–74: `getCameras()` returns `[]` on catch | ✓ |
| 3 | **FFmpeg exits** when RTSP is unreachable or drops. Next segment request restarts FFmpeg → repeated start/stop and “stream stopped again.” | `stream_manager_service.py` L90–209: no reconnect; `proc.poll() is not None` triggers restart on next request | ✓ |
| 4 | **Stream-status** endpoint probes `HLS_GATEWAY_BASE_URL` (e.g. localhost:9000). For RTSP cameras the backend serves HLS itself, so status is misleading. | `security_operations_endpoints.py` L136–162: `manifest_url = f"{gateway_base}/hls/{camera_id}/index.m3u8"` | ✓ |
| 5 | **Poster URL** `last_known_image_url` is a path (e.g. `/api/.../last-image`). Frontend uses it as-is; when app and API are different origins, poster request goes to frontend origin and can 404. | Backend sets path at `security_operations_service.py` L107; frontend uses at `LiveViewTab.tsx` L461, `CameraWallTile.tsx` L263, `CameraLiveModal.tsx` L365; no `resolveStreamUrl`-style resolution in `mapCamera` for `lastKnownImageUrl` | ✓ |
| 6 | **DB churn:** Each HLS request (manifest + every segment) does `get_camera` + `is_rtsp_camera` (→ `_get_camera_for_stream`) + `ensure_stream_running` (→ `_get_camera_for_stream` again) = **3 DB sessions per request**. | `security_operations_endpoints.py` L176, L178–179, L181; `stream_manager_service.py` L254–255, L110, L31–38 | ✓ |

**Data flow (verified):** Camera model has `stream_url` (browser-facing proxy path) and `source_stream_url` (raw RTSP). Stream manager uses `source_stream_url` only. Frontend receives `stream_url` and resolves it with `getBackendOrigin()` in `resolveStreamUrl`; poster URL is not resolved.

---

## 1. Architecture Summary

- **Frontend:** Live View / Camera Wall use `VideoStreamPlayer` with HLS.js. Stream URL = backend origin + `/api/security-operations/cameras/{id}/hls/index.m3u8`. Auth via `xhrSetup` (Bearer).
- **Backend:** `GET /api/security-operations/cameras/{camera_id}/hls/{path}` → `CameraService.get_camera` → `stream_manager.is_rtsp_camera` → `ensure_stream_running` → `serve_stream_file` (FileResponse). RTSP cameras: FFmpeg writes HLS to `streams/{camera_id}/`; backend serves files from disk.
- **Config:** `USE_HLS_VIA_BACKEND_PROXY=true` (default). FFmpeg path set in `start-dev.ps1` for backend window. Single uvicorn process (no multi-worker).

---

## 2. Root Causes of Inconsistent Streaming

### 2.1 Backend returns empty list on any error (cameras “disappear”)

**Where:** `backend/api/security_operations_endpoints.py` — `list_cameras`, `get_camera_metrics`.

- **Code:** On exception, `list_cameras` returns `[]` and `get_camera_metrics` returns `_empty_metrics()`.
- **Effect:** A single transient error (DB, timeout, etc.) causes the API to respond 200 with an empty list. The frontend then replaces the whole camera list with `[]`, so all tiles disappear. The 30s refresh can repeatedly wipe the list if the backend is flaky.
- **Recommendation:** Return a proper error (e.g. 503) on failure instead of 200 + empty body, and/or have the frontend only update state when the response is successful and non-empty (or merge instead of replace on error).

### 2.2 Frontend replaces cameras with empty array when API returns []

**Where:** `frontend/src/features/security-operations-center/hooks/useSecurityOperationsState.ts` — `refreshCameras`.

- **Code:** `const data = await ... getCameras();` then `setCameras(prev => data.map(...))`. If the **service** returns `[]` (e.g. catch in `getCameras` or backend returned 200 + []), `data` is `[]` and the UI shows no cameras.
- **Service:** `securityOperationsCenterService.ts` — `getCameras()` catches all errors and returns `[]`.
- **Recommendation:** In `refreshCameras`, do not set cameras to `data` when `data.length === 0` and `prev.length > 0` (preserve last good list and show a warning/toast). Optionally surface error state so the user sees “Could not refresh list” instead of an empty grid.

### 2.3 FFmpeg process exits (RTSP unreachable or unstable)

**Where:** `backend/services/stream_manager_service.py` — `ensure_stream_running`, FFmpeg command.

- **Behavior:** FFmpeg is started with RTSP URL (e.g. `rtsp://192.168.1.100:554/stream1`). If the camera or network is unreachable, FFmpeg exits. The next segment request sees `proc.poll() is not None`, so we restart FFmpeg. That produces repeated “Starting RTSP stream” logs and intermittent playback.
- **Current mitigations:** `-stimeout 10000000` (10s socket timeout), “recent manifest” check (≤45s) to avoid double-start when manifest exists. On missing segment, endpoint calls `ensure_stream_running` again and retries once, then 503.
- **Recommendation:** Ensure the RTSP source is reachable from the backend host (firewall, VLAN, camera credentials). Optionally add FFmpeg `-reconnect 1` / `-reconnect_streamed 1` and/or a small health-check that restarts FFmpeg only after a short backoff to avoid restart storms.

### 2.4 Stream-status endpoint checks wrong target (external gateway)

**Where:** `backend/api/security_operations_endpoints.py` — `get_camera_stream_status`.

- **Code:** It requests `HLS_GATEWAY_BASE_URL` (default `http://localhost:9000`) + `/hls/{camera_id}/index.m3u8`. For RTSP cameras the backend serves HLS itself (no gateway on 9000).
- **Effect:** For built-in RTSP→HLS, stream-status always reports “gateway unreachable” or wrong status. Any UI or script that uses this endpoint for “is the stream up?” gets misleading results.
- **Recommendation:** If the camera is RTSP (built-in proxy), check the **backend’s own** manifest path (e.g. local file or `GET /api/security-operations/cameras/{id}/hls/index.m3u8`) instead of the external gateway.

### 2.5 Poster / last-image URL may be wrong origin

**Where:** Backend sets `last_known_image_url = /api/security-operations/cameras/{id}/last-image`. Frontend uses it as `poster={camera.lastKnownImageUrl}` without resolving to backend origin.

- **Effect:** If the app is served from a different origin than the API (e.g. production with separate domains), `<video poster="/api/...">` is requested from the frontend origin and can 404. In dev with proxy, it may work.
- **Recommendation:** Resolve `lastKnownImageUrl` to an absolute backend URL when it’s a path (e.g. same logic as `resolveStreamUrl` in the frontend service), so poster works cross-origin.

### 2.6 High DB/session churn per stream

**Where:** Every HLS request (manifest + each segment) runs: `CameraService.get_camera(camera_id)` (new session + query) and, for RTSP, `_get_camera_for_stream(camera_id)` inside `ensure_stream_running` / `is_rtsp_camera` (another session + query). So multiple DB sessions per second per camera.

- **Effect:** Extra load and possible connection pool pressure under many tiles. Not necessarily the cause of “stream stops,” but adds latency and noise.
- **Recommendation:** In the HLS endpoint, fetch the camera once (e.g. from `get_camera` or a shared helper), pass a “camera known RTSP” flag or the resolved stream config into the stream manager so it doesn’t re-query for every segment. Optionally cache “is_rtsp” per camera_id with a short TTL.

### 2.7 Reconnect delay not applied on first attempt

**Where:** `frontend/src/features/security-operations-center/components/VideoStreamPlayer.tsx` — `attemptReconnect`.

- **Code:** `setTimeout(..., reconnectDelayRef.current)`. On first call, `reconnectDelayRef.current` is 1000, then we do `reconnectDelayRef.current = Math.min(...* 2, 30000)` **after** scheduling the timeout. So the first reconnect fires after 1s; the delay doubling applies to the next attempt. This is mostly correct; the only nuance is that the very first reconnect uses 1s even if we intended a longer backoff.
- **Impact:** Minor. 1s is reasonable for “stream segment not ready” (503).

### 2.8 HLS.js: 4xx = unrecoverable, 5xx = retry

**Where:** `VideoStreamPlayer.tsx` — `isUnrecoverableHlsError`, ERROR handler.

- **Code:** 4xx → stop retrying and show error; 5xx → retry with backoff (up to 5 attempts). Backend returns 503 when the stream/segment isn’t ready.
- **Assessment:** Correct. Ensures temporary unavailability (503) doesn’t permanently kill the tile.

---

## 3. Per-File Findings

### 3.1 Frontend

| File | Finding |
|------|--------|
| `VideoStreamPlayer.tsx` | Auth and 4xx/5xx handling correct. Reconnect uses `reconnectDelayRef.current` which is updated after scheduling timeout (first delay 1s). |
| `securityOperationsCenterService.ts` | `getCameras()` returns `[]` on any error → combined with backend returning [] on error, this wipes the list. `resolveStreamUrl` only used for `stream_url`; `lastKnownImageUrl` not resolved to backend origin. |
| `useSecurityOperationsState.ts` | `refreshCameras` always does `setCameras(prev => data.map(...))` when the promise resolves; if `data === []` (e.g. backend or service returned empty), list is cleared. No “keep last good list” on empty. |
| `LiveViewTab.tsx` | Uses `camera.streamUrl` and `streamRefreshKey` correctly. Filter “Online Only” can hide new/offline cameras until heartbeat. |
| `CameraWallTile.tsx` | Same pattern: `tile.camera.streamUrl`, `streamRefreshKey`. |
| `CameraLiveModal.tsx` | Sends heartbeat on open when `camera.streamUrl` exists; refreshes list so “Online” badge updates. |
| `env.ts` | `getBackendOrigin()` correct for stripping `/api` and giving origin for HLS. |

### 3.2 Backend

| File | Finding |
|------|--------|
| `security_operations_endpoints.py` | `list_cameras`: returns `[]` on exception. `get_camera_metrics`: returns `_empty_metrics()` on exception. `proxy_camera_hls`: correct flow (get_camera → ensure_stream_running → serve; on missing file, re-ensure + retry, then 503). `get_camera_stream_status`: checks external gateway only → wrong for RTSP. |
| `stream_manager_service.py` | “Recent manifest” check avoids redundant FFmpeg start. Lock protects `_processes`. No FFmpeg reconnection options; process exits if RTSP drops. `_get_camera_for_stream` opens a new DB session per call (high churn on segment requests). Uses `camera.source_stream_url` (RTSP); DB `stream_url` is browser-facing proxy path. |
| `security_operations_service.py` | `_serialize_camera` uses `StreamProxyService.resolve_stream_url(camera.stream_url, camera.camera_id)` so API returns proxy path for RTSP. On create, sets `last_known_image_url = /api/security-operations/cameras/{id}/last-image` (relative path). |
| `stream_proxy_service.py` | `USE_HLS_VIA_BACKEND_PROXY` and `HLS_PROXY_PATH_TEMPLATE` correctly yield `/api/security-operations/cameras/{id}/hls/index.m3u8`. |

### 3.3 Config / Startup

| File | Finding |
|------|--------|
| `start-dev.ps1` | Prepends FFmpeg dir (e.g. `C:\ffmpeg\ffmpeg-8.0.1-essentials_build\bin`) to PATH for the backend window. Backend runs `python main.py` (single process). |
| `main.py` | Single uvicorn process, no workers → one `_processes` dict, no cross-worker race. |
| `backend/.env.example` | Should document `HLS_STREAM_DIR`, `HLS_MANIFEST_WAIT_TIMEOUT`, `USE_HLS_VIA_BACKEND_PROXY`, `HLS_GATEWAY_BASE_URL` for production. |

---

## 4. Recommended Fixes (Priority Order)

1. **Backend: Do not return 200 + empty list on error**  
   In `list_cameras` and `get_camera_metrics`, on exception either re-raise (so frontend gets 5xx) or return a structured error response. Avoid 200 with `[]` / zeroed metrics when the real cause is a server error.

2. **Frontend: Preserve last good camera list**  
   In `refreshCameras`, if `data.length === 0` and `prev.length > 0`, do not set cameras to `[]`; keep previous list and show a toast/error (“Could not refresh camera list”). Optionally in `getCameras()`, throw or return a tagged result so the UI can distinguish “no cameras” from “request failed.”

3. **Backend: Stream-status for RTSP**  
   In `get_camera_stream_status`, if the camera is RTSP (built-in), probe the backend’s own HLS URL (or local manifest path) instead of `HLS_GATEWAY_BASE_URL`, and document that for RTSP cameras the “gateway” is the same server.

4. **Frontend: Resolve poster URL**  
   When mapping API response to `CameraEntry`, if `last_known_image_url` is a path (e.g. starts with `/`), resolve it to `getBackendOrigin() + path` so the poster works when frontend and backend origins differ.

5. **Backend: Reduce DB round-trips for HLS**  
   In the HLS endpoint, call `get_camera` once; from that or a single extra query, determine RTSP and pass camera_id (and optionally stream config) to the stream manager so `ensure_stream_running` / `serve_stream_file` do not need to call `_get_camera_for_stream` on every segment (or cache “is_rtsp” per camera_id with short TTL).

6. **Operational / FFmpeg**  
   Ensure RTSP URL is reachable from the backend (network, firewall, credentials). Consider adding FFmpeg reconnect options and a short backoff before restarting FFmpeg after exit to avoid restart storms.

7. **Documentation**  
   Document in README or ops doc: FFmpeg required for RTSP; `start-dev.ps1` sets PATH; single-worker backend; 503 = “retry in a moment”; “Online Only” filter and heartbeat for new cameras.

---

## 5. Quick Reference: Request Flow

1. User opens Live View → `refreshCameras()` → GET `/api/security-operations/cameras` → backend `list_cameras` (on error returns `[]`).
2. Frontend maps to `CameraEntry[]`; `streamUrl` = `getBackendOrigin() + camera.stream_url` (e.g. `http://localhost:8000/api/security-operations/cameras/{id}/hls/index.m3u8`).
3. Each tile: `VideoStreamPlayer` with `src={camera.streamUrl}`. HLS.js loads manifest and segments with Bearer in `xhrSetup`.
4. Backend per request: `get_camera(id)` → `is_rtsp_camera(id)` → `ensure_stream_running(id)` (recent-manifest check; else start FFmpeg, wait for manifest) → `serve_stream_file(id, path)`. If file missing: re-ensure, retry serve, else 503.
5. If FFmpeg has exited (e.g. RTSP down), next segment gets 503; frontend retries up to 5 times with backoff. If backend returns 200 with `[]` on a later `list_cameras`, the whole camera list is replaced with empty and tiles disappear.

---

*End of audit.*
