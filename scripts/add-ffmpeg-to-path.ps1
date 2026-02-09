# Add FFmpeg bin folder to your user PATH (so backend can run ffmpeg for RTSP camera streams).
# Usage: .\scripts\add-ffmpeg-to-path.ps1
#        .\scripts\add-ffmpeg-to-path.ps1 -Path "C:\Users\You\Downloads\ffmpeg-8.0.1-essentials_build"
# Pass the extracted folder (the one that contains the "bin" folder).

param(
    [string]$Path = ""
)

$ErrorActionPreference = "Stop"

# Resolve bin folder: Path can be the build folder (has bin\) or the bin folder itself
function Get-FfmpegBinPath {
    if ($Path) {
        $p = $Path.Trim().TrimEnd('\')
        if (Test-Path (Join-Path $p "ffmpeg.exe")) { return $p }
        $bin = Join-Path $p "bin"
        if (Test-Path (Join-Path $bin "ffmpeg.exe")) { return $bin }
        throw "Path does not contain ffmpeg.exe: $Path"
    }
    $try = @(
        "C:\ffmpeg\ffmpeg-8.0.1-essentials_build\bin",
        "C:\ffmpeg\ffmpeg-8.0.1-essentials_build",
        (Join-Path $env:USERPROFILE "Downloads\ffmpeg-8.0.1-essentials_build\bin"),
        (Join-Path $env:USERPROFILE "Downloads\ffmpeg-8.0.1-essentials_build")
    )
    foreach ($p in $try) {
        if (Test-Path (Join-Path $p "ffmpeg.exe")) { return $p }
        $b = Join-Path $p "bin"
        if (Test-Path (Join-Path $b "ffmpeg.exe")) { return $b }
    }
    throw "Could not find ffmpeg.exe. Run with -Path 'C:\path\to\your\ffmpeg-8.0.1-essentials_build'"
}

$binPath = Get-FfmpegBinPath
$binPath = (Resolve-Path $binPath).Path

$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -and $currentPath -like "*$binPath*") {
    Write-Host "FFmpeg bin is already on your PATH:" -ForegroundColor Green
    Write-Host "  $binPath"
    Write-Host "Run 'ffmpeg -version' in a new terminal to confirm."
    exit 0
}

$newPath = if ($currentPath) { $currentPath + ";" + $binPath } else { $binPath }
[Environment]::SetEnvironmentVariable("Path", $newPath, "User")

Write-Host "Added FFmpeg to your user PATH:" -ForegroundColor Green
Write-Host "  $binPath"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Close and reopen PowerShell/terminal (and Cursor if open)."
Write-Host "  2. Run: ffmpeg -version"
Write-Host "  3. Restart your backend, then try the camera in Live View again."
