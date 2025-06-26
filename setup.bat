@echo off
echo ========================================
echo PROPER 2.9 - Setup Script
echo ========================================
echo.

echo Checking prerequisites...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed!
    echo Please install Python 3.11+ from https://python.org/
    pause
    exit /b 1
)

echo Prerequisites check passed!
echo.

echo Installing dependencies...
echo.

REM Install Node.js dependencies (backend root)
echo Installing Node.js dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Node.js dependencies!
    pause
    exit /b 1
)

REM Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies!
    pause
    exit /b 1
)
cd ..

REM Install Python dependencies
echo Installing Python dependencies...
cd backend
call pip install --upgrade pip
call pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Python dependencies!
    pause
    exit /b 1
)
cd ..

echo.
echo Dependencies installed successfully!
echo.

echo Setting up database...
echo.

REM Setup database (assumes a script is defined in package.json)
call npm run setup:database
if %errorlevel% neq 0 (
    echo ERROR: Failed to setup database!
    pause
    exit /b 1
)

echo.
echo Database setup completed!
echo.

echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo To start the application:
echo 1. Run: npm start
echo 2. Or open: http://localhost:3000 in your browser
echo 3. Login with: admin@proper29.com / admin123
echo.
echo Press any key to start the application now...
pause

echo.
echo Starting PROPER 2.9...
echo.

REM Start the full application
call npm start
