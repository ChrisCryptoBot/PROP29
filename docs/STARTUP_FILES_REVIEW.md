# Startup Files Review

## Entry points

| What | Where | Command / behavior |
|------|--------|---------------------|
| **Single-command dev** | Root `package.json` | `npm run dev` → runs `concurrently` with `start:backend` + `start:frontend` |
| **Backend** | Root script | `npm run start:backend` → `cd backend && python main.py` |
| **Frontend** | Root script | `npm run start:frontend` → `cd frontend && npm start` |
| **PowerShell script** | `start-dev.ps1` | Kills 8000/3000, starts backend in new window (`python main.py`), waits 5s, starts frontend in new window (`npm start`). Sets `SECRET_KEY`, `DATABASE_URL`, `ENVIRONMENT` for backend; `SKIP_PREFLIGHT_CHECK` for frontend. |

## Backend (`backend/main.py`)

- Sets `DATABASE_URL`, `ENVIRONMENT`, `SECRET_KEY` (dev default if unset).
- Adds project root to `sys.path`, then imports `init_db`, `AuthService`, and all API routers.
- `startup_event`: runs `init_db()` only (no analytics mock).
- Serves app via uvicorn when run as `python main.py` (see bottom of file).
- All API routes are mounted under `APIRouter(prefix="/api")`.

## Frontend

- **Root** `package.json`: `start` = `cd frontend && react-scripts start`; `dev` = concurrently backend + frontend.
- **Frontend** `package.json`: `start` = `react-scripts start`.
- Env: `frontend/.env.development` has `REACT_APP_API_BASE_URL=http://localhost:8000/api`. Frontend dev server typically runs on port 3000.

## Notes

- `npm run dev` requires `concurrently`; run `npm install` at **project root** if you get "concurrently is not recognized".
- Backend expects `SECRET_KEY` and `DATABASE_URL` in production; dev defaults are applied when `ENVIRONMENT=development`.
- `start-dev.ps1` is the recommended way to start both servers on Windows (opens two PowerShell windows).
