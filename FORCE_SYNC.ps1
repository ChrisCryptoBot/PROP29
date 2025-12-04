# FORCE SYNC SCRIPT - Run this to fix ALL compilation errors
# This will replace ALL outdated files with correct repository versions

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FORCE SYNC - Fixing All Outdated Files" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$LOCAL_BASE = "C:\Proper 2.9"
$BRANCH = "claude/fix-packages-jsx-syntax-01Q4mnMXVnJ4DG2sZ9Tc6Jnw"
$GITHUB_REPO = "ChrisCryptoBot/Hotel-Loss-Prevention-Platform"

# Stop any running Node processes
Write-Host "Stopping Node processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Files that need to be force-replaced
$files = @(
    "frontend/src/pages/modules/EvacuationModule.tsx",
    "frontend/src/pages/modules/Packages.tsx",
    "frontend/src/pages/modules/DigitalHandover.tsx"
)

Write-Host ""
Write-Host "This will REPLACE your local files with repository versions." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to cancel, or any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Write-Host ""

# Create backup
$backupDir = "$LOCAL_BASE\BACKUP_BEFORE_FORCE_SYNC_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Host "Creating backup at: $backupDir" -ForegroundColor Green
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$success = $true

foreach ($file in $files) {
    Write-Host ""
    Write-Host "Processing: $file" -ForegroundColor Cyan

    $localPath = Join-Path $LOCAL_BASE $file
    $url = "https://raw.githubusercontent.com/$GITHUB_REPO/$BRANCH/$file"

    # Backup existing file
    if (Test-Path $localPath) {
        $backupPath = Join-Path $backupDir $file
        $backupFileDir = Split-Path $backupPath -Parent
        New-Item -ItemType Directory -Path $backupFileDir -Force | Out-Null
        Copy-Item $localPath $backupPath -Force
        Write-Host "  ✓ Backed up existing file" -ForegroundColor Gray
    }

    # Force delete old file
    try {
        Remove-Item $localPath -Force -ErrorAction Stop
        Write-Host "  ✓ Deleted outdated file" -ForegroundColor Gray
    } catch {
        Write-Host "  ⚠ Could not delete (file may not exist): $_" -ForegroundColor Yellow
    }

    # Download new file
    try {
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($url, $localPath)
        Write-Host "  ✓ Downloaded repository version" -ForegroundColor Green

        # Verify
        $content = Get-Content $localPath -Raw
        if ($content -match "import.*Card.*from.*components/UI/Card") {
            Write-Host "  ✓ Verified: Modern Card components detected" -ForegroundColor Green
        } else {
            Write-Host "  ❌ ERROR: Card imports not found!" -ForegroundColor Red
            $success = $false
        }

        if ($content -match "glass-card") {
            Write-Host "  ❌ ERROR: Still contains old glass-card classes!" -ForegroundColor Red
            $success = $false
        } else {
            Write-Host "  ✓ Verified: No old glass-card classes" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ❌ FAILED to download: $_" -ForegroundColor Red
        $success = $false
    }
}

# Clear build cache
Write-Host ""
Write-Host "Clearing build cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force "$LOCAL_BASE\frontend\node_modules\.cache" -ErrorAction SilentlyContinue
Write-Host "  ✓ Cache cleared" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($success) {
    Write-Host "✓ SYNC SUCCESSFUL!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Close any open editor/IDE windows for these files" -ForegroundColor White
    Write-Host "2. Run: cd C:\Proper 2.9\frontend" -ForegroundColor White
    Write-Host "3. Run: npm start" -ForegroundColor White
    Write-Host ""
    Write-Host "Your backup is at: $backupDir" -ForegroundColor Gray
} else {
    Write-Host "❌ SYNC FAILED!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Some files could not be synced. Try:" -ForegroundColor Yellow
    Write-Host "1. Close all editors/IDEs" -ForegroundColor White
    Write-Host "2. Run this script again" -ForegroundColor White
    Write-Host "3. Or use git reset --hard (see below)" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verification summary
Write-Host "VERIFICATION RESULTS:" -ForegroundColor Cyan
Write-Host ""

foreach ($file in $files) {
    $localPath = Join-Path $LOCAL_BASE $file
    $fileName = Split-Path $file -Leaf

    if (Test-Path $localPath) {
        Write-Host "$fileName" -ForegroundColor White

        $importCheck = Select-String -Path $localPath -Pattern "import.*Card.*from" -ErrorAction SilentlyContinue
        if ($importCheck) {
            Write-Host "  ✓ Card imports: PRESENT" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Card imports: MISSING" -ForegroundColor Red
        }

        $glassCheck = Select-String -Path $localPath -Pattern "glass-card" -ErrorAction SilentlyContinue
        if ($glassCheck) {
            Write-Host "  ❌ Old classes: STILL PRESENT" -ForegroundColor Red
        } else {
            Write-Host "  ✓ Old classes: REMOVED" -ForegroundColor Green
        }
        Write-Host ""
    } else {
        Write-Host "$fileName" -ForegroundColor White
        Write-Host "  ❌ File not found!" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Alternative: Use Git Reset (Nuclear Option)" -ForegroundColor Yellow
Write-Host ""
Write-Host "If the above didn't work, run these commands:" -ForegroundColor White
Write-Host "  cd C:\Proper 2.9" -ForegroundColor Gray
Write-Host "  git stash" -ForegroundColor Gray
Write-Host "  git fetch origin $BRANCH" -ForegroundColor Gray
Write-Host "  git reset --hard origin/$BRANCH" -ForegroundColor Gray
Write-Host ""
Write-Host "This will replace EVERYTHING with the repository version." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
