# Download FFmpeg essentials, extract to C:\ffmpeg, add to user PATH, and verify.
# Run: .\scripts\install-ffmpeg.ps1
# Requires: PowerShell 5+ (Expand-Archive), internet.

$ErrorActionPreference = "Stop"
$ffmpegRoot = "C:\ffmpeg"
$zipUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
$zipPath = Join-Path $ffmpegRoot "ffmpeg-download.zip"

Write-Host "FFmpeg install (download + extract + PATH)..." -ForegroundColor Cyan

# 1. Create target dir
if (-not (Test-Path $ffmpegRoot)) {
    New-Item -ItemType Directory -Path $ffmpegRoot -Force | Out-Null
    Write-Host "Created $ffmpegRoot" -ForegroundColor Green
}

# 2. Download zip
Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
Write-Host "Downloading FFmpeg essentials (this may take a minute)..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing
} catch {
    Write-Host "Download failed: $_" -ForegroundColor Red
    exit 1
}

# 3. Remove old extract if present, then expand
Get-ChildItem $ffmpegRoot -Directory -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Expand-Archive -Path $zipPath -DestinationPath $ffmpegRoot -Force
Remove-Item $zipPath -Force -ErrorAction SilentlyContinue

# 4. Find bin folder (zip may contain one top-level folder like ffmpeg-8.0.1-essentials_build)
$binPath = $null
Get-ChildItem $ffmpegRoot -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    $b = Join-Path $_.FullName "bin"
    if (Test-Path (Join-Path $b "ffmpeg.exe")) { $binPath = $b }
}
if (-not $binPath) {
    if (Test-Path (Join-Path $ffmpegRoot "bin\ffmpeg.exe")) { $binPath = Join-Path $ffmpegRoot "bin" }
}
if (-not $binPath) {
    Write-Host "Could not find ffmpeg.exe under $ffmpegRoot" -ForegroundColor Red
    exit 1
}
$binPath = (Resolve-Path $binPath).Path
Write-Host "FFmpeg bin: $binPath" -ForegroundColor Green

# 5. Add to user PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -and $currentPath -like "*$binPath*") {
    Write-Host "Already on PATH." -ForegroundColor Green
} else {
    $newPath = if ($currentPath) { $currentPath.TrimEnd(';') + ";" + $binPath } else { $binPath }
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "Added to user PATH." -ForegroundColor Green
}

# 6. Verify in current session (refresh env)
$env:Path = [Environment]::GetEnvironmentVariable("Path", "User") + ";" + [Environment]::GetEnvironmentVariable("Path", "Machine")
$exe = Get-Command ffmpeg -ErrorAction SilentlyContinue
if ($exe) {
    Write-Host ""
    Write-Host "Verification:" -ForegroundColor Cyan
    & ffmpeg -version 2>&1 | Select-Object -First 1
    Write-Host ""
    Write-Host "FFmpeg is ready. Restart your backend and try the camera in Live View." -ForegroundColor Green
    exit 0
}
Write-Host "PATH updated. Open a new terminal and run: ffmpeg -version" -ForegroundColor Yellow
exit 0
