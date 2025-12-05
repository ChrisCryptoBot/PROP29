# Codebase Cleanup Script
# Run this after reviewing CODEBASE_CLEANUP_AUDIT.md

Write-Host "🧹 CODEBASE CLEANUP SCRIPT" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  WARNING: This script will DELETE files!" -ForegroundColor Yellow
Write-Host "   Review CODEBASE_CLEANUP_AUDIT.md first" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Continue with cleanup? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "❌ Cleanup cancelled" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Starting cleanup..." -ForegroundColor Green
Write-Host ""

# Phase 1: Delete empty files
Write-Host "Phase 1: Deleting empty files..." -ForegroundColor Yellow
$emptyFiles = @(
    "backend_audit_report.md",
    "COMPREHENSIVE_BACKEND_AUDIT.md",
    "start_backend.ps1",
    "start_both.bat",
    "start_both_services.ps1",
    "start_frontend.ps1"
)

foreach ($file in $emptyFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ✅ Deleted: $file" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Not found: $file" -ForegroundColor Yellow
    }
}

# Phase 2: Delete generated files
Write-Host ""
Write-Host "Phase 2: Deleting generated files..." -ForegroundColor Yellow
$generatedFiles = @(
    "file_inventory.csv"
)

foreach ($file in $generatedFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ✅ Deleted: $file" -ForegroundColor Green
    }
}

# Phase 3: Update .gitignore
Write-Host ""
Write-Host "Phase 3: Updating .gitignore..." -ForegroundColor Yellow
$gitignoreAdditions = @(
    "",
    "# Generated files",
    "file_inventory.csv",
    "*.csv",
    "",
    "# Media files (too large for git)",
    "*.mp4",
    "*.mov",
    "*.avi",
    "*.mkv"
)

$gitignoreContent = Get-Content .gitignore -Raw
foreach ($line in $gitignoreAdditions) {
    if ($gitignoreContent -notmatch [regex]::Escape($line)) {
        Add-Content .gitignore $line
        Write-Host "  ✅ Added to .gitignore: $line" -ForegroundColor Green
    }
}

# Phase 4: Create archive directory
Write-Host ""
Write-Host "Phase 4: Creating archive directory..." -ForegroundColor Yellow
if (-not (Test-Path "docs/archive")) {
    New-Item -ItemType Directory -Path "docs/archive" -Force | Out-Null
    New-Item -ItemType Directory -Path "docs/archive/audits" -Force | Out-Null
    New-Item -ItemType Directory -Path "docs/archive/historical" -Force | Out-Null
    Write-Host "  ✅ Created docs/archive/ structure" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review deleted files" -ForegroundColor White
Write-Host "  2. Manually review large files (preliminary.txt, Homepage UI.mp4)" -ForegroundColor White
Write-Host "  3. Move obsolete docs to docs/archive/ if needed" -ForegroundColor White
Write-Host "  4. Commit changes: git add . && git commit -m 'Cleanup: Remove empty and obsolete files'" -ForegroundColor White
Write-Host ""

