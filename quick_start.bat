@echo off
echo ========================================
echo PROPER 2.9 Quick Start
echo ========================================

echo.
echo Starting Backend...
start "Backend" cmd /k "cd /d C:\Users\14698\OneDrive\Desktop\Proper 2.9\backend && python -c \"from fastapi import FastAPI; from fastapi.middleware.cors import CORSMiddleware; from pydantic import BaseModel; import uvicorn; app = FastAPI(); app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*']); @app.get('/'); def root(): return {'message': 'Backend running!'}; @app.post('/auth/login'); def login(data: dict): return {'access_token': 'test-token', 'user': {'id': 1, 'email': 'admin@proper.com'}}; uvicorn.run(app, host='127.0.0.1', port=8000)\""

echo.
echo Waiting 3 seconds...
timeout /t 3 /nobreak > nul

echo.
echo Starting Frontend...
start "Frontend" cmd /k "cd /d C:\Users\14698\OneDrive\Desktop\Proper 2.9\frontend && npm start"

echo.
echo ========================================
echo Services should be starting...
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo ========================================
pause

echo ========================================
echo PROPER 2.9 Quick Start
echo ========================================

echo.
echo Starting Backend...
start "Backend" cmd /k "cd /d C:\Users\14698\OneDrive\Desktop\Proper 2.9\backend && python -c \"from fastapi import FastAPI; from fastapi.middleware.cors import CORSMiddleware; from pydantic import BaseModel; import uvicorn; app = FastAPI(); app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*']); @app.get('/'); def root(): return {'message': 'Backend running!'}; @app.post('/auth/login'); def login(data: dict): return {'access_token': 'test-token', 'user': {'id': 1, 'email': 'admin@proper.com'}}; uvicorn.run(app, host='127.0.0.1', port=8000)\""

echo.
echo Waiting 3 seconds...
timeout /t 3 /nobreak > nul

echo.
echo Starting Frontend...
start "Frontend" cmd /k "cd /d C:\Users\14698\OneDrive\Desktop\Proper 2.9\frontend && npm start"

echo.
echo ========================================
echo Services should be starting...
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo ========================================
pause


