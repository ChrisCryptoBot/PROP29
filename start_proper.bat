@echo off
echo ========================================
echo Starting PROPER 2.9 Services
echo ========================================

echo.
echo [1/3] Starting Backend (FastAPI) on port 8000...
start "PROPER Backend" cmd /k "cd /d C:\Users\14698\OneDrive\Desktop\Proper 2.9\backend && python simple_main.py"

echo.
echo [2/3] Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo [3/3] Starting Frontend (React) on port 3000...
start "PROPER Frontend" cmd /k "cd /d C:\Users\14698\OneDrive\Desktop\Proper 2.9\frontend && npm start"

echo.
echo ========================================
echo Services Starting...
echo ========================================
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Login Credentials:
echo Email:    admin@proper.com
echo Password: admin123
echo.
echo ========================================
echo Press any key to close this launcher...
pause > nul

echo ========================================
echo Starting PROPER 2.9 Services
echo ========================================

echo.
echo [1/3] Starting Backend (FastAPI) on port 8000...
start "PROPER Backend" cmd /k "cd /d C:\Users\14698\OneDrive\Desktop\Proper 2.9\backend && python simple_main.py"

echo.
echo [2/3] Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo [3/3] Starting Frontend (React) on port 3000...
start "PROPER Frontend" cmd /k "cd /d C:\Users\14698\OneDrive\Desktop\Proper 2.9\frontend && npm start"

echo.
echo ========================================
echo Services Starting...
echo ========================================
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Login Credentials:
echo Email:    admin@proper.com
echo Password: admin123
echo.
echo ========================================
echo Press any key to close this launcher...
pause > nul


