# RTSP → HLS Gateway Setup for Security Operations Center

Your browser cannot play RTSP directly. The app converts RTSP → HLS and (by default) serves it via the **backend proxy** so the frontend loads the stream same-origin and avoids CORS.

---

## Tapo C500 quick checklist (video not showing?)

1. **Add the camera in SOC**  
   Security Operations Center → **Provisioning** → Add Camera: Name, Location, IP `192.168.1.100`, Stream URL  
   `rtsp://Proper29:Proper29@192.168.1.100:554/stream1` (use your Tapo RTSP credentials).

2. **Note the camera ID**  
   After adding, get the camera’s `camera_id` from the API (`GET /api/security-operations/cameras`) or from the app (e.g. network tab when opening the camera).

3. **Run FFmpeg** (same machine that can reach the camera and the backend). Use your real `CAMERA_ID` and RTSP URL:
   ```powershell
   $CAMERA_ID = "YOUR_CAMERA_ID"
   $WEBROOT = "C:\dev\proper-29\hls-gateway"
   New-Item -ItemType Directory -Force -Path "$WEBROOT\hls\$CAMERA_ID" | Out-Null
   ffmpeg -fflags nobuffer -rtsp_transport tcp -i "rtsp://Proper29:Proper29@192.168.1.100:554/stream1" -vcodec copy -movflags frag_keyframe+empty_moov -an -hls_flags delete_segments+append_list -f hls -hls_time 1 -hls_list_size 3 "$WEBROOT\hls\$CAMERA_ID\index.m3u8"
   ```
   Leave this running.

4. **Run the HLS gateway** (HTTP server on port 9000 serving the same `WEBROOT`):
   ```powershell
   cd C:\dev\proper-29\hls-gateway
   python -m http.server 9000
   ```
   Or use `.\scripts\run-hls-gateway.ps1 -WebRoot "C:\dev\proper-29\hls-gateway"`.

5. **Backend .env**  
   `HLS_GATEWAY_BASE_URL=http://localhost:9000` (default). Keep `USE_HLS_VIA_BACKEND_PROXY=true` (default) so the frontend gets the stream via the backend and CORS is not an issue.

6. **Open Live View**  
   The feed should show even if the camera is “Offline” (no heartbeat). If you see “Stream unavailable”, check: FFmpeg is running, gateway is serving on 9000, backend can reach `http://localhost:9000`, and the camera ID in FFmpeg matches the one in the app.

---

## 1. Set the backend environment variable

In your backend `.env` (or environment), set:

```env
HLS_GATEWAY_BASE_URL=http://localhost:9000
```

If you use the default, the backend already uses `http://localhost:9000`. Restart the backend after changing this.

---

## 2. Get your camera ID

- **From the app:** Open Security Operations Center → Live View → click the camera tile. The URL or network tab may show the camera ID.
- **From the API:** When logged in, `GET /api/security-operations/cameras` returns a list; use the `camera_id` of your C500 (e.g. `b875e204-56f3-4550-9795-499624fcff39`).

Use this value as `CAMERA_ID` below.

---

## 3. Run FFmpeg to produce HLS for one camera

On the machine that can reach your camera (and where you will run the gateway), create a folder and output HLS into a path that matches the backend:

**Windows (PowerShell):**

```powershell
# Replace CAMERA_ID with your actual camera_id (e.g. b875e204-56f3-4550-9795-499624fcff39)
$CAMERA_ID = "YOUR_CAMERA_ID_HERE"
$WEBROOT = "C:\dev\proper-29\hls-gateway"
New-Item -ItemType Directory -Force -Path "$WEBROOT\hls\$CAMERA_ID" | Out-Null

ffmpeg -fflags nobuffer -rtsp_transport tcp -i "rtsp://Proper29:Proper29@192.168.1.100:554/stream1" -vcodec copy -movflags frag_keyframe+empty_moov -an -hls_flags delete_segments+append_list -f hls -hls_time 1 -hls_list_size 3 "$WEBROOT\hls\$CAMERA_ID\index.m3u8"
```

**Linux/macOS (bash):**

```bash
CAMERA_ID="YOUR_CAMERA_ID_HERE"
WEBROOT="/tmp/proper-hls-gateway"
mkdir -p "$WEBROOT/hls/$CAMERA_ID"

ffmpeg -fflags nobuffer -rtsp_transport tcp -i "rtsp://Proper29:Proper29@192.168.1.100:554/stream1" -vcodec copy -movflags frag_keyframe+empty_moov -an -hls_flags delete_segments+append_list -f hls -hls_time 1 -hls_list_size 3 "$WEBROOT/hls/$CAMERA_ID/index.m3u8"
```

Leave this running. It will create/update `index.m3u8` and `.ts` segments in `hls/{CAMERA_ID}/`.

---

## 4. Serve the HLS folder over HTTP on port 9000

From the same `WEBROOT` folder, start a simple HTTP server so that `http://localhost:9000/hls/{camera_id}/index.m3u8` is available.

**Option A – Python (if installed):**

```powershell
cd C:\dev\proper-29\hls-gateway
python -m http.server 9000
```

**Option B – Node (npx):**

```powershell
cd C:\dev\proper-29\hls-gateway
npx -y serve -l 9000
```

**Option C – Use the project script (Windows):**

```powershell
.\scripts\run-hls-gateway.ps1 -WebRoot "C:\dev\proper-29\hls-gateway"
```

Then open in the browser: `http://localhost:9000/hls/YOUR_CAMERA_ID/index.m3u8` — you should see the playlist or the stream.

---

## 5. Show the camera as ONLINE (heartbeat)

The SOC shows the camera as ONLINE when it receives a heartbeat. Send a POST request with a valid JWT (or your hardware key if you use it for devices):

**Using your JWT (after logging in):**

1. Get the token from the browser (e.g. Application → Local Storage, or Network tab on any API request → Authorization header).
2. Then run (replace `YOUR_JWT` and `YOUR_CAMERA_ID`):

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/security-operations/cameras/YOUR_CAMERA_ID/heartbeat" -Method POST -Headers @{ Authorization = "Bearer YOUR_JWT" } -ContentType "application/json" -Body "{}"
```

**Using hardware ingest key (if set):**

```powershell
$key = $env:HARDWARE_INGEST_KEY
Invoke-RestMethod -Uri "http://localhost:8000/api/security-operations/cameras/YOUR_CAMERA_ID/heartbeat" -Method POST -Headers @{ "X-API-Key" = $key } -ContentType "application/json" -Body "{}"
```

Sending a heartbeat every 30–60 seconds keeps the camera displayed as ONLINE.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Set `HLS_GATEWAY_BASE_URL=http://localhost:9000` in backend `.env` and restart backend. |
| 2 | Get your camera ID from SOC/API. |
| 3 | Run FFmpeg so it writes to `{webroot}/hls/{camera_id}/index.m3u8` (use your RTSP URL and credentials). |
| 4 | Run an HTTP server on port 9000 serving that webroot so `/hls/{camera_id}/index.m3u8` is reachable. |
| 5 | Optionally send heartbeats so the camera appears ONLINE in the SOC. |

After this, open Security Operations Center → Live View and click the C500 tile; the live HLS stream should play in the modal (and the camera can show ONLINE if heartbeats are sent).
