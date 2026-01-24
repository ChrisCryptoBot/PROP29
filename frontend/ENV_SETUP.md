# Frontend Environment Configuration

This document explains how to configure the frontend environment variables.

## Quick Start

For development, the defaults in `src/config/env.ts` are sufficient. However, you can override them using environment variables.

## Environment Variables

The frontend uses the following environment variables (all prefixed with `REACT_APP_`):

### Required for Development

- `REACT_APP_API_BASE_URL` - Backend API base URL (default: `http://localhost:8000`)
- `REACT_APP_WS_URL` - WebSocket URL (default: `ws://localhost:8000/ws`)

### Optional

- `REACT_APP_ENVIRONMENT` - Environment name (default: `development`)
- `REACT_APP_VERSION` - Application version (default: `2.9.0`)
- `REACT_APP_ENABLE_DEBUG` - Enable debug logging (default: `true` in development)

## Configuration Files

### `.env.development`

Used automatically when running `npm start`. Contains development-specific settings.

### `.env.production`

Used when running `npm run build`. Should contain production API URLs.

## Important Notes

1. **Port Configuration**: 
   - Frontend dev server runs on port **3000** (React default)
   - Backend API runs on port **8000** (configured in `backend/main.py`)

2. **API Routes**:
   - Backend routes have `/api` prefix (e.g., `/api/auth/login`)
   - Frontend endpoints in `AuthContext.tsx` must include the `/api` prefix
   - API_BASE_URL should NOT include `/api` (just the base URL)

3. **Cache Issues**:
   - If you change environment variables, restart the dev server
   - If you see old URLs in the browser, do a hard refresh (Ctrl+Shift+R)
   - React embeds env vars at build time, so changes require a rebuild

## Troubleshooting

### Browser shows old API URL (e.g., port 3001)

1. Stop the dev server (Ctrl+C)
2. Clear browser cache (Ctrl+Shift+R or DevTools → Application → Clear site data)
3. Restart dev server: `npm start`
4. Hard refresh browser

### API calls fail with "Failed to fetch"

1. Verify backend is running on port 8000: `http://localhost:8000/health`
2. Check API_BASE_URL in `src/config/env.ts` matches your backend
3. Verify endpoints include `/api` prefix (e.g., `/api/auth/login`)
4. Check browser console for CORS errors

### Double `/api/api/` in URLs

- This means API_BASE_URL includes `/api` AND the endpoint includes `/api`
- Fix: API_BASE_URL should be `http://localhost:8000` (no `/api`)
- Endpoints should be `/api/auth/login` (with `/api`)
