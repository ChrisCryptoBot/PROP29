# Serve HLS gateway folder on port 9000 so the SOC can load streams at
# http://localhost:9000/hls/{camera_id}/index.m3u8
# Run FFmpeg separately to write HLS into WebRoot\hls\{camera_id}\ (see docs\HLS_GATEWAY_SETUP.md).

param(
    [string]$WebRoot = (Join-Path (Split-Path -Parent $PSScriptRoot) "hls-gateway"),
    [int]$Port = 9000
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path $WebRoot)) {
    New-Item -ItemType Directory -Path $WebRoot -Force | Out-Null
    Write-Host "Created $WebRoot - add hls\{camera_id}\index.m3u8 via FFmpeg (see docs\HLS_GATEWAY_SETUP.md)" -ForegroundColor Yellow
}

Write-Host "HLS Gateway: serving $WebRoot on http://localhost:$Port" -ForegroundColor Green
Write-Host "Stream URL format: http://localhost:$Port/hls/{camera_id}/index.m3u8" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
Write-Host ""

try {
    Push-Location $WebRoot
    python -m http.server $Port
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Ensure Python is installed and port $Port is free." -ForegroundColor Yellow
    exit 1
} finally {
    Pop-Location
}
