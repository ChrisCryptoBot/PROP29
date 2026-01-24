# PROPER 2.9 - Unified Startup Script
# Starts both backend and frontend servers

Write-Host "Starting PROPER 2.9 Development Environment..." -ForegroundColor Green
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

# Stop any existing servers
Write-Host "Stopping any existing servers..." -ForegroundColor Yellow
Get-Process | Where-Object {
    ($_.ProcessName -eq "node" -or $_.ProcessName -eq "python") -and
    $_.Path -like "*$ScriptDir*"
} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start backend in a new window
Write-Host "Starting Backend Server (port 8000)..." -ForegroundColor Yellow

$BackendArgs = "Set-Location '$BackendDir'; " +
"`$env:SECRET_KEY = 'dev-secret-key-change-in-production-1234567890abcdef'; " +
"`$env:DATABASE_URL = 'sqlite:///./proper29.db'; " +
"`$env:ENVIRONMENT = 'development'; " +
"Write-Host 'PROPER 2.9 Backend' -ForegroundColor Green; " +
"Write-Host 'API Docs: http://localhost:8000/docs' -ForegroundColor Cyan; " +
"Write-Host 'Health: http://localhost:8000/health' -ForegroundColor Cyan; " +
"Write-Host ''; " +
"python main.py"

Start-Process powershell -ArgumentList "-Command", $BackendArgs -WindowStyle Normal

# Wait for backend to start
Start-Sleep -Seconds 3

# Start frontend in a new window
Write-Host "Starting Frontend Server (port 3000)..." -ForegroundColor Yellow
Write-Host "   Note: Frontend uses API at http://localhost:8000 (configured in frontend/src/config/env.ts)" -ForegroundColor Gray

$FrontendArgs = "Set-Location '$FrontendDir'; " +
"Write-Host 'PROPER 2.9 Frontend' -ForegroundColor Green; " +
"Write-Host 'App: http://localhost:3000' -ForegroundColor Cyan; " +
"Write-Host 'API: http://localhost:8000' -ForegroundColor Cyan; " +
"Write-Host 'Compiling... (this may take 30-60 seconds)' -ForegroundColor Yellow; " +
"Write-Host ''; " +
"npm start"

Start-Process powershell -ArgumentList "-Command", $FrontendArgs -WindowStyle Normal

Write-Host ""
Write-Host "Both servers launched successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Access your application:" -ForegroundColor White
Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Backend:   http://localhost:8000" -ForegroundColor Cyan
Write-Host "   API Docs:  http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "   Health:    http://localhost:8000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Both servers are running in separate PowerShell windows." -ForegroundColor Yellow
Write-Host "   Close those windows to stop the servers." -ForegroundColor Yellow
Write-Host ""
Write-Host "Waiting for servers to start..." -ForegroundColor Yellow

# Wait and test connectivity
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "Testing server connectivity..." -ForegroundColor Yellow

# Test backend
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "Backend: Running (Status: $($backendResponse.StatusCode))" -ForegroundColor Green
}
catch {
    Write-Host "Backend: Still starting..." -ForegroundColor Yellow
}

# Test frontend
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "Frontend: Running (Status: $($frontendResponse.StatusCode))" -ForegroundColor Green
}
catch {
    Write-Host "Frontend: Still compiling... (this can take 30-60 seconds)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Development environment ready!" -ForegroundColor Green
Write-Host "   Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host ""
