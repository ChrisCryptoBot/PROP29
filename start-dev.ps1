# PROPER 2.9 - Enhanced Development Startup Script
# Starts both backend and frontend servers with better error handling

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PROPER 2.9 - Development Environment" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory (project root)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ScriptDir "backend"
$FrontendDir = Join-Path $ScriptDir "frontend"

# Verify directories exist
if (-not (Test-Path $BackendDir)) {
    Write-Host "ERROR: Backend directory not found: $BackendDir" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $FrontendDir)) {
    Write-Host "ERROR: Frontend directory not found: $FrontendDir" -ForegroundColor Red
    exit 1
}

Write-Host "Project Root: $ScriptDir" -ForegroundColor Cyan
Write-Host ""

# Check if ports are in use
Write-Host "Checking ports..." -ForegroundColor Yellow
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($port8000) {
    Write-Host "WARNING: Port 8000 is already in use!" -ForegroundColor Yellow
    Write-Host "  Killing process on port 8000..." -ForegroundColor Yellow
    $process = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($process) {
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}

if ($port3000) {
    Write-Host "WARNING: Port 3000 is already in use!" -ForegroundColor Yellow
    Write-Host "  Killing process on port 3000..." -ForegroundColor Yellow
    $process = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($process) {
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}

# Stop any existing servers
Write-Host "Stopping any existing servers..." -ForegroundColor Yellow
Get-Process | Where-Object {
    ($_.ProcessName -eq "node" -or $_.ProcessName -eq "python") -and
    ($_.Path -like "*$ScriptDir*" -or $_.CommandLine -like "*$ScriptDir*")
} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Verify Python is available
Write-Host "Verifying Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "  $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Python not found in PATH!" -ForegroundColor Red
    Write-Host "  Please install Python 3.10+ and add it to PATH" -ForegroundColor Red
    exit 1
}

# Verify Node.js is available
Write-Host "Verifying Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Node.js not found in PATH!" -ForegroundColor Red
    Write-Host "  Please install Node.js 16+ and add it to PATH" -ForegroundColor Red
    exit 1
}

# Verify npm is available
Write-Host "Verifying npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "  npm $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: npm not found in PATH!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Start backend in a new window
Write-Host "Starting Backend Server (port 8000)..." -ForegroundColor Yellow

$BackendScript = @"
`$ErrorActionPreference = 'Stop'
Set-Location '$BackendDir'
`$env:SECRET_KEY = 'dev-secret-key-change-in-production-1234567890abcdef'
`$env:DATABASE_URL = 'sqlite:///./proper29.db'
`$env:ENVIRONMENT = 'development'
Write-Host '========================================' -ForegroundColor Green
Write-Host 'PROPER 2.9 Backend Server' -ForegroundColor Green
Write-Host '========================================' -ForegroundColor Green
Write-Host 'API Docs: http://localhost:8000/docs' -ForegroundColor Cyan
Write-Host 'Health:   http://localhost:8000/health' -ForegroundColor Cyan
Write-Host ''
try {
    python main.py
} catch {
    Write-Host 'ERROR: Backend failed to start!' -ForegroundColor Red
    Write-Host `$_.Exception.Message -ForegroundColor Red
    Write-Host ''
    Write-Host 'Press any key to close...' -ForegroundColor Yellow
    `$null = `$Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
}
"@

$BackendScriptPath = Join-Path $env:TEMP "proper29-backend-start.ps1"
$BackendScript | Out-File -FilePath $BackendScriptPath -Encoding UTF8

Start-Process powershell -ArgumentList "-NoExit", "-File", $BackendScriptPath -WindowStyle Normal

# Wait for backend to start
Write-Host "  Waiting for backend to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Start frontend in a new window
Write-Host "Starting Frontend Server (port 3000)..." -ForegroundColor Yellow
Write-Host "  Note: Frontend compilation may take 30-60 seconds" -ForegroundColor Gray

$FrontendScript = @"
`$ErrorActionPreference = 'Stop'
Set-Location '$FrontendDir'
`$env:SKIP_PREFLIGHT_CHECK = 'true'
Write-Host '========================================' -ForegroundColor Green
Write-Host 'PROPER 2.9 Frontend Server' -ForegroundColor Green
Write-Host '========================================' -ForegroundColor Green
Write-Host 'App: http://localhost:3000' -ForegroundColor Cyan
Write-Host 'API: http://localhost:8000' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Compiling... (this may take 30-60 seconds)' -ForegroundColor Yellow
Write-Host ''
try {
    npm start
} catch {
    Write-Host 'ERROR: Frontend failed to start!' -ForegroundColor Red
    Write-Host `$_.Exception.Message -ForegroundColor Red
    Write-Host ''
    Write-Host 'Press any key to close...' -ForegroundColor Yellow
    `$null = `$Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
}
"@

$FrontendScriptPath = Join-Path $env:TEMP "proper29-frontend-start.ps1"
$FrontendScript | Out-File -FilePath $FrontendScriptPath -Encoding UTF8

Start-Process powershell -ArgumentList "-NoExit", "-File", $FrontendScriptPath -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Servers Launched Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access your application:" -ForegroundColor White
Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Backend:   http://localhost:8000" -ForegroundColor Cyan
Write-Host "   API Docs:  http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "   Health:    http://localhost:8000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Both servers are running in separate PowerShell windows." -ForegroundColor Yellow
Write-Host "   - Check those windows for startup status and any errors" -ForegroundColor Yellow
Write-Host "   - Close those windows to stop the servers" -ForegroundColor Yellow
Write-Host ""
Write-Host "Waiting for servers to start (this may take 30-60 seconds)..." -ForegroundColor Yellow
Write-Host ""

# Wait and test connectivity with retries
$maxRetries = 12
$retryCount = 0
$backendReady = $false
$frontendReady = $false

while ($retryCount -lt $maxRetries -and (-not $backendReady -or -not $frontendReady)) {
    Start-Sleep -Seconds 5
    $retryCount++
    
    Write-Host "Checking servers... (attempt $retryCount/$maxRetries)" -ForegroundColor Gray
    
    # Test backend
    if (-not $backendReady) {
        try {
            $backendResponse = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
            Write-Host "  ✓ Backend: Running (Status: $($backendResponse.StatusCode))" -ForegroundColor Green
            $backendReady = $true
        } catch {
            Write-Host "  ⏳ Backend: Still starting..." -ForegroundColor Yellow
        }
    }
    
    # Test frontend
    if (-not $frontendReady) {
        try {
            $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
            Write-Host "  ✓ Frontend: Running (Status: $($frontendResponse.StatusCode))" -ForegroundColor Green
            $frontendReady = $true
        } catch {
            Write-Host "  ⏳ Frontend: Still compiling..." -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($backendReady -and $frontendReady) {
    Write-Host "Development Environment Ready!" -ForegroundColor Green
    Write-Host "  Open http://localhost:3000 in your browser" -ForegroundColor White
} else {
    Write-Host "Servers are starting..." -ForegroundColor Yellow
    if (-not $backendReady) {
        Write-Host "  Backend may still be initializing" -ForegroundColor Yellow
        Write-Host "  Check the PROPER 2.9 Backend window for errors" -ForegroundColor Yellow
    }
    if (-not $frontendReady) {
        Write-Host "  Frontend is still compiling (this is normal)" -ForegroundColor Yellow
        Write-Host "  Check the PROPER 2.9 Frontend window for progress" -ForegroundColor Yellow
    }
    Write-Host "  Refresh http://localhost:3000 in a few moments" -ForegroundColor White
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
