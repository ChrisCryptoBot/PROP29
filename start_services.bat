@echo off
echo Starting PROPER 2.9 Services...

echo.
echo Starting Backend (FastAPI) on port 8000...
start "Backend" cmd /k "cd /d C:\Users\14698\OneDrive\Desktop\Proper 2.9\backend && uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

echo.
echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo Starting Frontend (React) on port 3000...
start "Frontend" cmd /k "cd /d C:\Users\14698\OneDrive\Desktop\Proper 2.9\frontend && npm start"

echo.
echo Both services are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit this launcher...
pause > nul

echo Starting PROPER 2.9 Services...

echo.
echo Starting Backend (FastAPI) on port 8000...
start "Backend" cmd /k "cd /d C:\Users\14698\OneDrive\Desktop\Proper 2.9\backend && uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

echo.
echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo Starting Frontend (React) on port 3000...
start "Frontend" cmd /k "cd /d C:\Users\14698\OneDrive\Desktop\Proper 2.9\frontend && npm start"

echo.
echo Both services are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit this launcher...
pause > nul


