# Camera Provisioning and Stream Routing

## Is the camera in the backend?

**Yes.** When you add a camera in the Security Operations Center **Provisioning** tab:

1. **Frontend** sends `POST /api/security-operations/cameras` with name, location, IP, stream URL, and optional credentials.
2. **Backend** (`backend/api/security_operations_endpoints.py` → `CameraService.create_camera`) creates a row in the `cameras` table and returns the new camera (including `stream_url`).
3. **Frontend** adds the returned camera to state (`setCameras([created, ...prev])`), so it appears in **Live View** and **Provisioning** list immediately.

So the camera **is** stored in the backend and **does** show in the UI after a successful create.

---

## Why might it “not connect” when I add it in provisioning?

### 1. **Permission (403)**

- **Backend**: Creating/updating/deleting cameras requires **admin**, **security_manager**, or **security_officer** (see `require_security_manager_or_admin` in `backend/api/auth_dependencies.py`).
- **Frontend**: The Provisioning tab and “Add Camera” are only available when the user has one of those roles. The frontend now treats **ADMIN**, **SECURITY_MANAGER**, and **SECURITY_OFFICER** as having management access (aligned with the backend).
- If your user has only `security_manager` and the UI still shows “Access Restricted”, ensure the frontend build includes the role check that includes `SECURITY_MANAGER`.

### 2. **Create fails (500 / validation)**

- If the backend returns an error (e.g. validation, DB error), the frontend shows “Failed to provision camera” and the camera is **not** added to the list. Check browser Network tab for the `POST .../cameras` response and backend logs.

### 3. **Camera appears but stream does not play (“Stream unavailable” / 404)**

- The **camera record** is in the backend and the **tile** appears in Live View. “Not connecting” here usually means the **video stream** fails to load.
- Browsers cannot play **RTSP** directly. The app expects **HLS** from the backend:
  - Backend stores your **RTSP** URL as `source_stream_url` and exposes a **proxy** URL like `/api/security-operations/cameras/{camera_id}/hls/index.m3u8`.
  - That proxy forwards requests to the **HLS gateway** (e.g. `http://localhost:9000`). The gateway serves files that **FFmpeg** must be writing for that camera.
- So: **no FFmpeg + no HLS gateway** → no HLS files → proxy returns **404** → “Stream unavailable” / “Reconnection attempts exhausted” in the UI.
- **Fix**: Run FFmpeg (to transcode RTSP → HLS) and the HLS gateway so the gateway’s webroot has the manifest and segments for that `camera_id`. See **Startup Guide** and `docs/HLS_GATEWAY_SETUP.md`. After that, use **Refresh** or **Retry stream** on the tile.

---

## Wiring and routing (review)

| Layer | What happens |
|-------|-------------------------------|
| **Frontend – Provisioning** | `ProvisioningTab` → `createCamera(payload)` → `securityOperationsCenterService.createCamera()` → `POST /api/security-operations/cameras` (body: name, location, ip_address, stream_url, credentials). |
| **Backend – Create** | `security_operations_endpoints.create_camera` (requires `require_security_manager_or_admin`) → `CameraService.create_camera` → insert into `cameras`; `stream_url` is set via `StreamProxyService.resolve_stream_url()` (for RTSP this becomes the HLS proxy path). |
| **Backend – List** | `GET /api/security-operations/cameras` → `list_cameras` → `CameraService.list_cameras()` → all cameras from DB; each camera’s `stream_url` is the proxy path (e.g. `/api/security-operations/cameras/{id}/hls/index.m3u8`). |
| **Frontend – Live View** | `getCameras()` → list of cameras with `stream_url`; `resolveStreamUrl(stream_url)` turns relative paths into absolute backend URLs; `VideoStreamPlayer` loads that URL (HLS). |
| **Backend – HLS proxy** | `GET /api/security-operations/cameras/{camera_id}/hls/{path:path}` → `proxy_camera_hls` → `CameraService.get_camera(camera_id)` (404 if camera missing) → proxy request to `{HLS_GATEWAY_BASE_URL}/hls/{camera_id}/{path}` (e.g. `http://localhost:9000/hls/{camera_id}/index.m3u8`). |
| **Stream proxy service** | `StreamProxyService.resolve_stream_url(rtsp_url, camera_id)` returns the **proxy path** for RTSP (and for HLS gateway URLs when using backend proxy). Raw RTSP is stored in `source_stream_url`; the browser only gets the proxy URL. |

- **Router**: Security Operations routes are under `APIRouter(prefix="/security-operations")` and mounted under `api_router` with `prefix="/api"`, so full path is `/api/security-operations/cameras` and `/api/security-operations/cameras/{id}/hls/...`.
- **DB**: `cameras` table in `backend/models.py` (Camera); `init_db()` creates tables; optional columns are added via migrations in `database.py`.

No routing or wiring bug was found: create → DB → list and proxy paths are consistent. The usual “not connecting” issue after adding a camera is the **stream** not being available (FFmpeg + HLS gateway), not the camera record missing in the backend.
