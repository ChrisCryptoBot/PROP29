# PowerShell Script to Sync Repository Files to Local Windows Environment
# Run this script on your Windows machine at C:\Proper 2.9\

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Repository File Sync Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$GITHUB_REPO = "ChrisCryptoBot/Hotel-Loss-Prevention-Platform"
$BRANCH = "claude/fix-packages-jsx-syntax-01Q4mnMXVnJ4DG2sZ9Tc6Jnw"
$LOCAL_BASE = "C:\Proper 2.9"

# Files to sync
$files = @(
    "frontend/src/pages/modules/Packages.tsx",
    "frontend/src/pages/modules/DigitalHandover.tsx"
)

Write-Host "This script will download the latest repository files to your local machine." -ForegroundColor Yellow
Write-Host "Local directory: $LOCAL_BASE" -ForegroundColor Yellow
Write-Host "GitHub branch: $BRANCH" -ForegroundColor Yellow
Write-Host ""

# Create backup directory
$backupDir = "$LOCAL_BASE\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Host "Creating backup directory: $backupDir" -ForegroundColor Green
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Download and replace each file
foreach ($file in $files) {
    Write-Host ""
    Write-Host "Processing: $file" -ForegroundColor Cyan

    $localPath = Join-Path $LOCAL_BASE $file
    $backupPath = Join-Path $backupDir $file
    $url = "https://raw.githubusercontent.com/$GITHUB_REPO/$BRANCH/$file"

    # Backup existing file
    if (Test-Path $localPath) {
        Write-Host "  [1/3] Backing up existing file..." -ForegroundColor Gray
        $backupFileDir = Split-Path $backupPath -Parent
        if (!(Test-Path $backupFileDir)) {
            New-Item -ItemType Directory -Path $backupFileDir -Force | Out-Null
        }
        Copy-Item $localPath $backupPath -Force
        Write-Host "  [1/3] Backup created successfully" -ForegroundColor Green
    } else {
        Write-Host "  [1/3] No existing file to backup" -ForegroundColor Yellow
    }

    # Download new file
    try {
        Write-Host "  [2/3] Downloading from repository..." -ForegroundColor Gray
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($url, $localPath)
        Write-Host "  [2/3] Downloaded successfully" -ForegroundColor Green

        # Verify file
        Write-Host "  [3/3] Verifying file..." -ForegroundColor Gray
        $content = Get-Content $localPath -Raw

        if ($content -match "glass-card") {
            Write-Host "  [3/3] ERROR: Downloaded file still contains old 'glass-card' classes!" -ForegroundColor Red
            Write-Host "  Restoring backup..." -ForegroundColor Yellow
            Copy-Item $backupPath $localPath -Force
        } elseif ($content -match "import.*Card.*from.*components/UI/Card") {
            Write-Host "  [3/3] Verification passed - modern Card components detected" -ForegroundColor Green
        } else {
            Write-Host "  [3/3] WARNING: Could not verify Card imports" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  [2/3] ERROR: Failed to download file" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Red
        if (Test-Path $backupPath) {
            Write-Host "  Restoring backup..." -ForegroundColor Yellow
            Copy-Item $backupPath $localPath -Force
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Sync Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify the files were updated successfully" -ForegroundColor White
Write-Host "2. Run your build command to test compilation" -ForegroundColor White
Write-Host "3. If there are any issues, your backups are in: $backupDir" -ForegroundColor White
Write-Host ""

# Verification check
Write-Host "Running verification checks..." -ForegroundColor Cyan
Write-Host ""

foreach ($file in $files) {
    $localPath = Join-Path $LOCAL_BASE $file
    $fileName = Split-Path $file -Leaf

    if (Test-Path $localPath) {
        $content = Get-Content $localPath -Raw

        Write-Host "$fileName" -ForegroundColor Cyan

        if ($content -match "glass-card") {
            Write-Host "  ❌ FAIL: Still contains 'glass-card' classes (outdated version)" -ForegroundColor Red
        } else {
            Write-Host "  ✓ PASS: No 'glass-card' classes found" -ForegroundColor Green
        }

        if ($content -match "import.*Card.*from.*components/UI/Card") {
            Write-Host "  ✓ PASS: Modern Card component imports detected" -ForegroundColor Green
        } else {
            Write-Host "  ❌ FAIL: Card component imports not found" -ForegroundColor Red
        }

        Write-Host ""
    } else {
        Write-Host "$fileName" -ForegroundColor Cyan
        Write-Host "  ❌ FAIL: File not found at $localPath" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Manual Verification Command:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Run these commands to double-check:" -ForegroundColor White
Write-Host '  findstr /C:"glass-card" "C:\Proper 2.9\frontend\src\pages\modules\Packages.tsx"' -ForegroundColor Gray
Write-Host '  findstr /C:"import { Card" "C:\Proper 2.9\frontend\src\pages\modules\Packages.tsx"' -ForegroundColor Gray
Write-Host ""
Write-Host "The first command should return NOTHING (no results)" -ForegroundColor White
Write-Host "The second command should show the Card import line" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
