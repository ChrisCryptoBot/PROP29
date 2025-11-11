# start-dev.ps1 - PROPER 2.9 Development Environment Launcher
Write-Host "🚀 Starting PROPER 2.9 Development Environment..." -ForegroundColor Green
Write-Host ""

# Get the script directory (project root)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ScriptDir "backend"
$FrontendDir = Join-Path $ScriptDir "frontend"

Write-Host "📁 Project Root: $ScriptDir" -ForegroundColor Cyan
Write-Host "📁 Backend Dir: $BackendDir" -ForegroundColor Cyan
Write-Host "📁 Frontend Dir: $FrontendDir" -ForegroundColor Cyan
Write-Host ""

# Start backend in a new window
Write-Host "🔧 Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @"
    Set-Location '$BackendDir'
    `$env:SECRET_KEY = 'dev_secret_key_change_in_production_12345'
    `$env:DATABASE_URL = 'sqlite:///./proper29.db'
    `$env:ENVIRONMENT = 'development'
    `$env:DEBUG = 'true'
    Write-Host '🔧 Backend starting on port 8000...' -ForegroundColor Green
    Write-Host '📊 API Docs will be available at: http://localhost:8000/docs' -ForegroundColor Cyan
    python -m uvicorn main:app --reload --port 8000
"@ -WindowStyle Normal

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend in a new window
Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @"
    Set-Location '$FrontendDir'
    Write-Host '🎨 Frontend starting on port 3000...' -ForegroundColor Green
    Write-Host '🌐 App will be available at: http://localhost:3000' -ForegroundColor Cyan
    npm start
"@ -WindowStyle Normal

Write-Host ""
Write-Host "✅ Both servers launched successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Access your application:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "   API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "   Health Check: http://localhost:8000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Note: Both servers are running in separate windows." -ForegroundColor Yellow
Write-Host "   Close those windows to stop the servers." -ForegroundColor Yellow
Write-Host ""
Write-Host "⏳ Waiting for servers to fully start up..." -ForegroundColor Yellow

# Wait for servers to start and test
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "🧪 Testing server connectivity..." -ForegroundColor Yellow

# Test backend
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 10
    Write-Host "✅ Backend: Running (Status: $($backendResponse.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend: Not responding yet - $($_.Exception.Message)" -ForegroundColor Red
}

# Test frontend
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10
    Write-Host "✅ Frontend: Running (Status: $($frontendResponse.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend: Not responding yet - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Development environment setup complete!" -ForegroundColor Green
Write-Host "   Open http://localhost:3000 in your browser to start using PROPER 2.9" -ForegroundColor White

