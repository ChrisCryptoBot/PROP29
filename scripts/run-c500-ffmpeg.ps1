# Run this to start the camera video feed. You need:
# 1. FFmpeg installed (download from https://ffmpeg.org)
# 2. Your camera ID — when the video says "Stream unavailable", click Copy next to "Camera ID" in the red box
#
# Run the HLS gateway in a SECOND window: .\scripts\run-hls-gateway.ps1

param(
    [string]$CameraId = "",
    [string]$RtspUrl = "rtsp://Proper29:Proper29@192.168.1.100:554/stream1",
    [string]$WebRoot = (Join-Path (Split-Path -Parent $PSScriptRoot) "hls-gateway")
)

$ErrorActionPreference = "Stop"

if (-not $CameraId) {
    Write-Host ""
    Write-Host "Camera video setup" -ForegroundColor Cyan
    Write-Host "When the app shows 'Stream unavailable', it shows a Camera ID and a Copy button."
    Write-Host "Copy that ID and paste it here (or run this script with -CameraId 'your-id')."
    Write-Host ""
    $CameraId = Read-Host "Paste your Camera ID"
    $CameraId = $CameraId.Trim()
    if (-not $CameraId) {
        Write-Host "No Camera ID entered. Exiting." -ForegroundColor Red
        exit 1
    }
}

$hlsDir = Join-Path (Join-Path $WebRoot "hls") $CameraId
$outputPath = Join-Path $hlsDir "index.m3u8"

New-Item -ItemType Directory -Force -Path $hlsDir | Out-Null
Write-Host ""
Write-Host "Starting video feed for camera: $CameraId" -ForegroundColor Green
Write-Host "Leave this window OPEN."
Write-Host "In another PowerShell window run: .\scripts\run-hls-gateway.ps1" -ForegroundColor Yellow
Write-Host "Then in the app click 'Retry stream' on the camera." -ForegroundColor Gray
Write-Host ""

& ffmpeg -fflags nobuffer -rtsp_transport tcp -i $RtspUrl -vcodec copy -movflags frag_keyframe+empty_moov -an -hls_flags delete_segments+append_list -f hls -hls_time 1 -hls_list_size 3 $outputPath
