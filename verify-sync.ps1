# Quick Verification Script - Run this after syncing your local files
# This will check if your local files match the repository structure

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "File Sync Verification Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$LOCAL_BASE = "C:\Proper 2.9\frontend\src\pages\modules"
$allPassed = $true

$files = @(
    @{
        Name = "Packages.tsx"
        Path = "$LOCAL_BASE\Packages.tsx"
    },
    @{
        Name = "DigitalHandover.tsx"
        Path = "$LOCAL_BASE\DigitalHandover.tsx"
    }
)

foreach ($file in $files) {
    Write-Host "Checking: $($file.Name)" -ForegroundColor Yellow
    Write-Host "Location: $($file.Path)" -ForegroundColor Gray
    Write-Host ""

    if (!(Test-Path $file.Path)) {
        Write-Host "  ❌ FAIL: File not found!" -ForegroundColor Red
        $allPassed = $false
        Write-Host ""
        continue
    }

    $content = Get-Content $file.Path -Raw

    # Check 1: Should NOT contain old glass-card classes
    if ($content -match "glass-card") {
        Write-Host "  ❌ FAIL: File contains old 'glass-card' classes" -ForegroundColor Red
        Write-Host "     This means the file was NOT synced properly." -ForegroundColor Red
        $allPassed = $false
    } else {
        Write-Host "  ✓ PASS: No old 'glass-card' classes found" -ForegroundColor Green
    }

    # Check 2: Should contain modern Card imports
    if ($content -match "import.*Card.*from.*components/UI/Card") {
        Write-Host "  ✓ PASS: Modern Card component imports detected" -ForegroundColor Green
    } else {
        Write-Host "  ❌ FAIL: Card component imports not found" -ForegroundColor Red
        Write-Host "     This means the file was NOT synced properly." -ForegroundColor Red
        $allPassed = $false
    }

    # Check 3: Should NOT contain JSX syntax errors (basic check)
    $openFragments = ([regex]::Matches($content, "<>")).Count
    $closeFragments = ([regex]::Matches($content, "</>")).Count

    if ($openFragments -eq $closeFragments) {
        Write-Host "  ✓ PASS: JSX fragments are balanced ($openFragments opening, $closeFragments closing)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ FAIL: Unbalanced JSX fragments ($openFragments opening, $closeFragments closing)" -ForegroundColor Red
        $allPassed = $false
    }

    # Check 4: Verify file size (should be substantial)
    $fileSize = (Get-Item $file.Path).Length
    if ($fileSize -gt 10000) {
        Write-Host "  ✓ PASS: File size is reasonable ($([math]::Round($fileSize/1024, 2)) KB)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ WARNING: File size seems small ($([math]::Round($fileSize/1024, 2)) KB)" -ForegroundColor Yellow
        Write-Host "     Expected size should be around 50+ KB." -ForegroundColor Yellow
    }

    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "✓ ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your local files are now synchronized with the repository." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next step: Run your build command to test compilation:" -ForegroundColor Yellow
    Write-Host "  cd C:\Proper 2.9" -ForegroundColor Gray
    Write-Host "  npm run build" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "❌ SOME CHECKS FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Your local files are NOT properly synchronized." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run the sync script again:" -ForegroundColor Yellow
    Write-Host "  .\sync-local-files.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or manually download the files from GitHub:" -ForegroundColor Yellow
    Write-Host "  https://github.com/ChrisCryptoBot/Hotel-Loss-Prevention-Platform/tree/claude/fix-packages-jsx-syntax-01Q4mnMXVnJ4DG2sZ9Tc6Jnw" -ForegroundColor Gray
    Write-Host ""
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Show specific lines from the files for manual verification
Write-Host "Manual Verification - Check these imports:" -ForegroundColor Yellow
Write-Host ""
foreach ($file in $files) {
    if (Test-Path $file.Path) {
        Write-Host "$($file.Name):" -ForegroundColor Cyan
        $content = Get-Content $file.Path
        $importLines = $content | Select-String -Pattern "import.*Card" | Select-Object -First 1
        if ($importLines) {
            Write-Host "  $importLines" -ForegroundColor Gray
        } else {
            Write-Host "  No Card import found!" -ForegroundColor Red
        }
        Write-Host ""
    }
}

Write-Host "========================================" -ForegroundColor Cyan
