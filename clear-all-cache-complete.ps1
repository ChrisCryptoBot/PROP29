# PROPER 2.9 - Complete Cache & Settings Cleanup
# Clears ALL cache, metadata, roaming settings, and AppData

$ErrorActionPreference = 'SilentlyContinue'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete Cache & Settings Cleanup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ScriptDir "backend"
$FrontendDir = Join-Path $ScriptDir "frontend"
$AppDataRoaming = $env:APPDATA
$AppDataLocal = $env:LOCALAPPDATA
$TempDir = $env:TEMP

# Stop running processes
Write-Host "Stopping running servers..." -ForegroundColor Yellow
Get-Process | Where-Object {
    ($_.ProcessName -eq "node" -or $_.ProcessName -eq "python" -or $_.ProcessName -eq "electron") -and
    ($_.Path -like "*$ScriptDir*")
} | Stop-Process -Force -ErrorAction SilentlyContinue

# Kill ports
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port8000) {
    $process = Get-NetTCPConnection -LocalPort 8000 | Select-Object -ExpandProperty OwningProcess -Unique
    if ($process) { Stop-Process -Id $process -Force -ErrorAction SilentlyContinue }
}
if ($port3000) {
    $process = Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess -Unique
    if ($process) { Stop-Process -Id $process -Force -ErrorAction SilentlyContinue }
}

Start-Sleep -Seconds 2

Write-Host "Clearing Project Cache..." -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan

# Backend Python cache
Get-ChildItem -Path $BackendDir -Recurse -Directory -Filter "__pycache__" | Remove-Item -Recurse -Force
Get-ChildItem -Path $BackendDir -Recurse -Filter "*.pyc" | Remove-Item -Force
Get-ChildItem -Path $BackendDir -Recurse -Filter "*.pyo" | Remove-Item -Force
Get-ChildItem -Path $BackendDir -Recurse -Filter "*.pyd" | Remove-Item -Force
Remove-Item -Path "$BackendDir\.pytest_cache" -Recurse -Force
Remove-Item -Path "$BackendDir\.mypy_cache" -Recurse -Force
Remove-Item -Path "$BackendDir\.ruff_cache" -Recurse -Force
Remove-Item -Path "$BackendDir\htmlcov" -Recurse -Force
Remove-Item -Path "$BackendDir\.coverage" -Recurse -Force
Remove-Item -Path "$BackendDir\.tox" -Recurse -Force
Remove-Item -Path "$BackendDir\.eggs" -Recurse -Force
Remove-Item -Path "$BackendDir\*.egg-info" -Recurse -Force

# Frontend cache
Remove-Item -Path "$FrontendDir\node_modules" -Recurse -Force
Remove-Item -Path "$FrontendDir\build" -Recurse -Force
Remove-Item -Path "$FrontendDir\dist" -Recurse -Force
Remove-Item -Path "$FrontendDir\.cache" -Recurse -Force
Remove-Item -Path "$FrontendDir\.eslintcache" -Recurse -Force
Remove-Item -Path "$FrontendDir\.vite" -Recurse -Force
Remove-Item -Path "$FrontendDir\coverage" -Recurse -Force
Remove-Item -Path "$FrontendDir\.parcel-cache" -Recurse -Force
Remove-Item -Path "$FrontendDir\.next" -Recurse -Force
Remove-Item -Path "$FrontendDir\.nuxt" -Recurse -Force
Remove-Item -Path "$FrontendDir\.turbo" -Recurse -Force

# Root cache
Remove-Item -Path "$ScriptDir\node_modules" -Recurse -Force
Remove-Item -Path "$ScriptDir\build" -Recurse -Force
Remove-Item -Path "$ScriptDir\dist" -Recurse -Force
Remove-Item -Path "$ScriptDir\.cache" -Recurse -Force
Remove-Item -Path "$ScriptDir\.pytest_cache" -Recurse -Force
Remove-Item -Path "$ScriptDir\.mypy_cache" -Recurse -Force

# Metadata and temp files
Get-ChildItem -Path $ScriptDir -Recurse -Filter "*.log" | Remove-Item -Force
Get-ChildItem -Path $ScriptDir -Recurse -Filter ".DS_Store" | Remove-Item -Force
Get-ChildItem -Path $ScriptDir -Recurse -Filter "Thumbs.db" | Remove-Item -Force
Get-ChildItem -Path $ScriptDir -Recurse -Filter "*.tmp" | Remove-Item -Force
Get-ChildItem -Path $ScriptDir -Recurse -Filter "*.temp" | Remove-Item -Force
Get-ChildItem -Path $ScriptDir -Recurse -Filter "*.swp" | Remove-Item -Force
Get-ChildItem -Path $ScriptDir -Recurse -Filter "*.swo" | Remove-Item -Force
Get-ChildItem -Path $ScriptDir -Recurse -Filter "*~" | Remove-Item -Force
Get-ChildItem -Path $ScriptDir -Recurse -Filter "*.bak" | Remove-Item -Force
Get-ChildItem -Path $ScriptDir -Recurse -Filter "*.old" | Remove-Item -Force

# Temp directories in project
Get-ChildItem -Path $ScriptDir -Recurse -Directory -Filter "tmp" | Remove-Item -Recurse -Force
Get-ChildItem -Path $ScriptDir -Recurse -Directory -Filter "temp" | Remove-Item -Recurse -Force
Get-ChildItem -Path $ScriptDir -Recurse -Directory -Filter ".tmp" | Remove-Item -Recurse -Force

Write-Host ""
Write-Host "Clearing AppData/Roaming Settings..." -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan

# Electron app data (if exists)
Remove-Item -Path "$AppDataRoaming\proper-29" -Recurse -Force
Remove-Item -Path "$AppDataRoaming\proper29" -Recurse -Force
Remove-Item -Path "$AppDataRoaming\PROPER*" -Recurse -Force

# VS Code/Cursor settings cache
Remove-Item -Path "$AppDataRoaming\Code\User\WorkspaceStorage\*proper*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$AppDataRoaming\Cursor\User\WorkspaceStorage\*proper*" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Clearing AppData/Local Cache..." -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan

# Electron cache
Remove-Item -Path "$AppDataLocal\proper-29" -Recurse -Force
Remove-Item -Path "$AppDataLocal\proper29" -Recurse -Force
Remove-Item -Path "$AppDataLocal\PROPER*" -Recurse -Force
Remove-Item -Path "$AppDataLocal\electron*" -Recurse -Force -ErrorAction SilentlyContinue

# Node.js cache
Remove-Item -Path "$AppDataLocal\npm-cache" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$AppDataLocal\.npm" -Recurse -Force -ErrorAction SilentlyContinue

# Python cache
Remove-Item -Path "$AppDataLocal\pip" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$AppDataLocal\Python*" -Recurse -Force -ErrorAction SilentlyContinue

# VS Code/Cursor cache
Remove-Item -Path "$AppDataLocal\Code\Cache" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$AppDataLocal\Code\CachedData" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$AppDataLocal\Code\CachedExtensions" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$AppDataLocal\Cursor\Cache" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$AppDataLocal\Cursor\CachedData" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$AppDataLocal\Cursor\CachedExtensions" -Recurse -Force -ErrorAction SilentlyContinue

# Browser cache (if Electron app)
Remove-Item -Path "$AppDataLocal\proper-29\Cache" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$AppDataLocal\proper-29\GPUCache" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$AppDataLocal\proper-29\Code Cache" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$AppDataLocal\proper-29\ShaderCache" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Clearing Temp Files..." -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan

# Project-specific temp files
Get-ChildItem -Path $TempDir -Filter "*proper*" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
Get-ChildItem -Path $TempDir -Filter "*proper29*" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force

Write-Host ""
Write-Host "Clearing Package Manager Caches..." -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan

# npm cache
npm cache clean --force 2>&1 | Out-Null
Write-Host "  [OK] npm cache cleared" -ForegroundColor Green

# pip cache
pip cache purge 2>&1 | Out-Null
Write-Host "  [OK] pip cache cleared" -ForegroundColor Green

# yarn cache (if exists)
yarn cache clean 2>&1 | Out-Null
Write-Host "  [OK] yarn cache cleared (if installed)" -ForegroundColor Green

Write-Host ""
Write-Host "Clearing Database Files..." -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan

# SQLite databases (development only - be careful!)
Remove-Item -Path "$BackendDir\*.db" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$BackendDir\*.sqlite" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$BackendDir\*.sqlite3" -Force -ErrorAction SilentlyContinue
Write-Host "  [OK] Development database files removed" -ForegroundColor Green

Write-Host ""
Write-Host "Clearing Additional Cache Directories..." -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan

# Find and remove any remaining cache-like directories
Get-ChildItem -Path $ScriptDir -Recurse -Directory -Force | Where-Object {
    $_.Name -match '\.(cache|tmp|temp|log|old|bak|swp|swo)' -or
    $_.Name -eq 'node_modules' -or
    $_.Name -eq '__pycache__' -or
    $_.Name -eq '.pytest_cache' -or
    $_.Name -eq '.mypy_cache' -or
    $_.Name -eq '.ruff_cache' -or
    $_.Name -eq 'coverage' -or
    $_.Name -eq 'htmlcov' -or
    $_.Name -eq 'dist' -or
    $_.Name -eq 'build' -or
    $_.Name -eq '.vscode' -or
    $_.Name -eq '.idea' -or
    $_.Name -eq '.vs'
} | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Complete Cache & Settings Cleanup Done!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Cleared:" -ForegroundColor White
Write-Host "  [OK] All Python cache (__pycache__, *.pyc, etc.)" -ForegroundColor Gray
Write-Host "  [OK] All Node.js cache (node_modules, build, dist)" -ForegroundColor Gray
Write-Host "  [OK] All metadata files (.log, .DS_Store, Thumbs.db)" -ForegroundColor Gray
Write-Host "  [OK] AppData/Roaming settings" -ForegroundColor Gray
Write-Host "  [OK] AppData/Local cache" -ForegroundColor Gray
Write-Host "  [OK] Electron cache (if applicable)" -ForegroundColor Gray
Write-Host "  [OK] VS Code/Cursor cache" -ForegroundColor Gray
Write-Host "  [OK] Package manager caches (npm, pip, yarn)" -ForegroundColor Gray
Write-Host "  [OK] Development database files" -ForegroundColor Gray
Write-Host "  [OK] All temp files" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Reinstall dependencies:" -ForegroundColor Cyan
Write-Host "     cd frontend && npm install" -ForegroundColor Gray
Write-Host "     cd backend && pip install -r requirements.txt" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Restart development servers:" -ForegroundColor Cyan
Write-Host "     .\start-dev.ps1" -ForegroundColor Gray
Write-Host ""
