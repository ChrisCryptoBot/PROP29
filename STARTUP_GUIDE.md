# 🚀 PROPER 2.9 - Quick Start Guide

## Prerequisites
- Node.js 16.x+
- Python 3.10+
- Git

---

## ⚡ Quick Start (1 Command)

```bash
# Run this from project root:
npm run dev:all
```

This will start both backend and frontend automatically.

---

## 📋 Manual Startup (2 Terminals)

### Terminal 1: Backend
```bash
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

**Last Updated**: 2026-01-24
**Version**: 2.9.0
