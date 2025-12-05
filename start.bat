@echo off
REM PROPER 2.9 - Unified Startup Script (Windows Batch)
REM Starts both backend and frontend servers

echo ========================================
echo PROPER 2.9 - Starting Development Environment
echo ========================================
echo.

REM Get the script directory (project root)
set "SCRIPT_DIR=%~dp0"
set "BACKEND_DIR=%SCRIPT_DIR%backend"
set "FRONTEND_DIR=%SCRIPT_DIR%frontend"

REM Verify directories exist
if not exist "%BACKEND_DIR%" (
    echo ERROR: Backend directory not found: %BACKEND_DIR%
    pause
    exit /b 1
)

if not exist "%FRONTEND_DIR%" (
    echo ERROR: Frontend directory not found: %FRONTEND_DIR%
    pause
    exit /b 1
)

echo Project Root: %SCRIPT_DIR%
echo.

REM Stop any existing Node processes
echo Stopping any existing servers...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Start backend
echo [1/2] Starting Backend Server (port 8000)...
start "PROPER 2.9 Backend" cmd /k "cd /d %BACKEND_DIR% && set SECRET_KEY=dev-secret-key-change-in-production-1234567890abcdef && set DATABASE_URL=sqlite:///./proper29.db && set ENVIRONMENT=development && echo Backend starting on port 8000... && echo API Docs: http://localhost:8000/docs && echo. && python main.py"

REM Wait for backend to start
echo.
echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak >nul

REM Start frontend
echo [2/2] Starting Frontend Server (port 3000)...
start "PROPER 2.9 Frontend" cmd /k "cd /d %FRONTEND_DIR% && echo Frontend starting on port 3000... && echo App: http://localhost:3000 && echo Compiling... (this may take 30-60 seconds) && echo. && npm start"

echo.
echo ========================================
echo Services Starting...
echo ========================================
echo.
echo Access your application:
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo   Health:    http://localhost:8000/health
echo.
echo Note: Both servers are running in separate windows.
echo       Close those windows to stop the servers.
echo.
echo ========================================
echo Press any key to close this launcher...
pause >nul

