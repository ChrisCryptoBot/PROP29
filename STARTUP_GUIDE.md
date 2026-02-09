# 🚀 PROPER 2.9 - Quick Start Guide

## Prerequisites
- Node.js 16.x+
- Python 3.10+
- Git

---

## ⚡ Quick Start (1 Command)

### Option 1: Enhanced PowerShell Script (Recommended)
```powershell
# Run this from project root:
.\start-dev.ps1
```

### Option 2: NPM Script
```bash
# Run this from project root:
npm run dev
```

Both will start both backend and frontend automatically.

---

## 📋 Manual Startup (2 Terminals)

### Open backend CMD (copy-paste)
To get a **real console window** you can copy/paste from:

- **Option A — Use the startup script (opens 2 windows):**  
  From project root in PowerShell: `.\start-dev.ps1`  
  This opens a **Backend** PowerShell window and a **Frontend** PowerShell window. Use the Backend window to read logs and copy/paste.

- **Option B — Open one backend CMD yourself:**  
  Run this in PowerShell (from any folder):
  ```powershell
  Start-Process cmd -ArgumentList '/k', 'cd /d c:\dev\proper-29\backend && python main.py'
  ```
  A CMD window will open and run the backend; you can copy/paste in that window.

- **Option C — Same in PowerShell window:**
  ```powershell
  Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd c:\dev\proper-29\backend; python main.py'
  ```

### Terminal 1: Backend (if typing in Cursor terminal)
```powershell
cd c:\dev\proper-29\backend
python main.py
```
✅ Backend will be available at: **http://127.0.0.1:8000**
📖 API Docs at: **http://127.0.0.1:8000/docs**

### Terminal 2: Frontend
```bash
cd c:\dev\proper-29\frontend
$env:SKIP_PREFLIGHT_CHECK='true'
npm start
```
✅ Frontend will be available at: **http://localhost:3000**

---

## 🧹 Clear cache (to see login again)

If the app skips the login page and goes straight to the dashboard after refresh, auth is cached in the browser.

**Option A — In the app (once you can open it):**
1. Go to **Profile** → **Security**.
2. Click **Clear cache and sign out**. You’ll be signed out and the next load will show the login page.

**Option B — In the browser (when you’re stuck):**
1. Open the app at http://localhost:3000.
2. Open DevTools (F12) → **Console**.
3. Run: `localStorage.clear(); sessionStorage.clear(); location.reload();`
4. The page will reload and show the login screen.

**Option C — Full project cache (optional):**  
From project root, run `.\clear-all-cache-complete.ps1`. This removes Python/Node caches, `node_modules`, and dev DB. Then run `npm run install:all` and `.\start-dev.ps1` to reinstall and start again.

---

## 🐛 Troubleshooting

### Frontend won't start
**Error**: `spawn EPERM` or `Failed to compile`

**Solution**:
1. Delete `node_modules` and cache:
   ```bash
   cd c:\dev\proper-29\frontend
   rm -r node_modules
   npm cache clean --force
   npm install
   npm start
   ```

2. Use PowerShell environment variable syntax (NOT bash `&&`):
   ```bash
   cd c:\dev\proper-29\frontend; $env:SKIP_PREFLIGHT_CHECK='true'; npm start
   ```

### Port 8000 already in use / "I don't see backend console updates"
Only **one** backend can run on port 8000. If you open a new CMD and run `python main.py` and see **"error while attempting to bind on address ('127.0.0.1', 8000): only one usage of each socket address is normally permitted"**, another backend is already running. That other process is the one serving requests and showing logs.

**To use your CMD window as the backend console:**
1. Stop the process using port 8000. In **PowerShell (Run as Administrator)**:
   ```powershell
   Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
   ```
2. In your CMD window (or the same PowerShell): `cd c:\dev\proper-29\backend` then `python main.py`. That window will now be the backend console and will show all request/chat logs.

### Backend won't start
**Error**: `NameError: name 'AgentEventCreate' is not defined`

**Solution**: Check that `schemas.py` imports are complete in `api/access_control_endpoints.py`

### Login returns 500
**Error**: `api/auth/login` → 500 Internal Server Error

**Solution**: 
- Always start the backend via `python main.py` (it sets `SECRET_KEY` and `DATABASE_URL` before loading auth).
- Ensure no other process is using port 8000.
- Check backend terminal for the logged exception; token creation failures are now logged with full tracebacks.

### Favicon 500
**Error**: `favicon.ico` → 500

**Solution**: Favicon is served by the frontend from `frontend/public/`. Ensure `public/` exists and the dev server is running. If proxying to backend, the backend does not serve favicon; ignore or add a static route.

### Camera shows OFFLINE / No live feed (RTSP, e.g. Tapo C500 at 192.168.1.100)
**Error**: Security Operations Center shows a camera as OFFLINE with "No live feed" even after adding it with IP and stream URL (e.g. `rtsp://Proper29:Proper29@192.168.1.100:554/stream1`).

**Cause**: Browsers cannot play RTSP directly. The app expects RTSP to be converted to HLS by **FFmpeg** and served by an **HLS gateway** on port 9000; the backend then proxies that to the frontend.

**Solution**:
1. Add the camera in SOC **Provisioning** (Name, Location, IP `192.168.1.100`, Stream URL `rtsp://Proper29:Proper29@192.168.1.100:554/stream1`). Note the camera’s **camera_id** (from the API or network tab).
2. Run **FFmpeg** (same machine that can reach the camera), writing HLS into the project’s `hls-gateway` folder for that camera ID. See **docs/HLS_GATEWAY_SETUP.md** for the exact PowerShell command.
3. Run the **HLS gateway** HTTP server on port 9000 (e.g. `cd hls-gateway && python -m http.server 9000` or `.\scripts\run-hls-gateway.ps1`).
4. Ensure backend `.env` has `HLS_GATEWAY_BASE_URL=http://localhost:9000` (default).

After this, the live feed can show even when the camera is marked Offline (no heartbeat). Optionally send a heartbeat so the camera appears Online: see HLS_GATEWAY_SETUP.md.

### Camera shows ONLINE but "Stream unavailable" / no video
**Symptom**: In Live View the camera tile shows **ONLINE** (green) but the video area shows "Stream unavailable" and "Reconnection attempts exhausted" with a **Retry stream** button.

**Cause**: The camera is registered and sending heartbeats, but the **HLS stream** is not being served. The app needs FFmpeg to turn RTSP into HLS and the HLS gateway to serve it on port 9000.

**Fix** (two terminals):

1. **Get your camera ID**  
   From the API: `GET /api/security-operations/cameras` when logged in, and use the `camera_id` of your C500 (e.g. `406ca5d9-e044-430b-9d15-4f095a36883c`). Or from the browser: open the camera modal and check the network tab for the HLS request URL; the UUID in the path is the camera ID.

2. **Terminal 1 – FFmpeg** (use your actual camera ID and RTSP URL if different):
   ```powershell
   .\scripts\run-c500-ffmpeg.ps1 -CameraId "YOUR_CAMERA_ID"
   ```
   Optional: `-RtspUrl "rtsp://user:pass@192.168.1.100:554/stream1"` if your URL differs.

3. **Terminal 2 – HLS gateway**:
   ```powershell
   .\scripts\run-hls-gateway.ps1
   ```

4. In the app, click **Retry stream** on the camera (or Refresh in Live View). The video should load.

---

## 📁 File Structure

```
c:\dev\proper-29\
├── backend/
│   ├── main.py               (Entry point)
│   ├── requirements.txt      (Dependencies)
│   ├── api/                  (Endpoints)
│   ├── services/             (Business logic)
│   ├── models.py             (Database models)
│   └── schemas.py            (Pydantic schemas)
│
├── frontend/
│   ├── package.json          (Dependencies)
│   ├── tsconfig.json         (TypeScript config)
│   ├── .env.development      (Dev environment)
│   └── src/
│       ├── features/         (Feature modules)
│       ├── components/       (Shared components)
│       └── services/         (API services)
│
└── STARTUP_GUIDE.md          (This file)
```

---

## 🔧 Common Commands

### Frontend
```bash
npm start              # Start dev server
npm run build          # Build for production
npm run lint           # Check code quality
npm run type-check     # TypeScript validation
```

### Backend
```bash
python main.py         # Start dev server
python reset_admin.py  # Reset admin credentials
```

---

## 🌐 Environment Variables

### Frontend (.env.development)
```
REACT_APP_API_BASE_URL=http://localhost:8000/api
REACT_APP_WS_URL=ws://localhost:8000/ws
REACT_APP_ENABLE_AI_FEATURES=true
REACT_APP_ENABLE_DEBUG_MODE=true
```

### Backend (.env)
```
DATABASE_URL=sqlite:///./proper.db
SECRET_KEY=your-secret-key
DEBUG=true
```

---

## ✅ Verification Checklist

- [ ] Backend running on http://127.0.0.1:8000
- [ ] Frontend running on http://localhost:3000
- [ ] Can access backend API docs at http://127.0.0.1:8000/docs
- [ ] Frontend compiles without errors
- [ ] Can login and navigate Patrol Command Center

---

## 📞 Support

If issues persist:
1. Check terminal output for error messages
2. Verify all dependencies installed: `npm list` (frontend), `pip list` (backend)
3. Clear cache and reinstall if needed
4. Ensure ports 3000 and 8000 are not in use

---

**Last Updated**: 2026-01-26
**Version**: 2.9.0

### Startup files (reference)

| File | Purpose |
|------|--------|
| **start-dev.ps1** | Stops processes on 3000/8000, starts backend in a new window (`backend`: `python main.py`), then frontend in another (`frontend`: `npm start`). Best for daily dev. |
| **npm run dev** (root) | Runs `concurrently` to start backend + frontend in one terminal. Same effect, single window. |
| **npm run start:backend** | Backend only: `cd backend && python main.py`. |
| **npm run start:frontend** | Frontend only: `cd frontend && npm start`. |
| **clear-all-cache-complete.ps1** | Full cleanup: Python/Node caches, `node_modules`, build, dev DB. Run only when you need a full reset; then run `npm run install:all` and `.\start-dev.ps1`. |

**Note:** `start.ps1` and `start.bat` have been replaced by `start-dev.ps1` (renamed to `.old`). Use `start-dev.ps1` or `npm run dev` instead.

### Which window is the backend console?
- If you use **`.\start-dev.ps1`**: the **first** new window that opens is the backend; the second is the frontend. Backend logs (including chat requests and LLM calls) appear in the backend window.
- If you get **"port 8000 already in use"** in a new CMD: the backend that’s running is in another window/process. Either use that other window to see logs, or free port 8000 (see "Port 8000 already in use" above) and start the backend in the CMD you want.
