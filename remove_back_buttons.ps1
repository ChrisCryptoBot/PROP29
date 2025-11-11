# PowerShell script to remove "Back to Dashboard" buttons from all module files

$files = @(
    "frontend\src\pages\modules\DigitalHandover.tsx",
    "frontend\src\pages\modules\LockdownFacilityDashboard.tsx",
    "frontend\src\pages\modules\IoTEnvironmental.tsx",
    "frontend\src\pages\modules\TeamChat.tsx",
    "frontend\src\pages\modules\Patrols\index.tsx",
    "frontend\src\pages\modules\SmartParking.tsx",
    "frontend\src\pages\modules\SystemAdministration.tsx",
    "frontend\src\pages\modules\EvidenceManagement.tsx",
    "frontend\src\pages\modules\Visitors.tsx",
    "frontend\src\pages\modules\Packages.tsx",
    "frontend\src\pages\modules\EventLogModule.tsx",
    "frontend\src\pages\modules\LostAndFound.tsx",
    "frontend\src\pages\modules\AccessControlModule.tsx",
    "frontend\src\pages\modules\GuestSafety.tsx",
    "frontend\src\pages\modules\SoundMonitoring.tsx",
    "frontend\src\pages\modules\EmergencyAlerts.tsx",
    "frontend\src\pages\modules\SmartLockers\index.tsx",
    "frontend\src\pages\modules\BannedIndividuals\index.tsx"
)

$pattern = @'
(?s)\s*{/\* Back Button - FAR LEFT CORNER \*/}\s*<div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20">.*?Back to Dashboard.*?</Button>\s*</div>\s*
'@

$count = 0
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing: $file" -ForegroundColor Cyan
        $content = Get-Content $file -Raw
        
        # Try multiple patterns since the exact formatting may vary
        $patterns = @(
            '(?s)\s*{/\* Back Button - FAR LEFT CORNER \*/}\s*<div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20">.*?</div>\s*(?=\s*{/\* Title Section)',
            '(?s)<div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20">.*?Back to Dashboard.*?</Button>\s*</div>\s*',
            '(?s)\s*{/\* Back Button.*?\*/}.*?<div className="absolute left-4.*?Back to Dashboard.*?</div>\s*'
        )
        
        $modified = $false
        foreach ($p in $patterns) {
            if ($content -match $p) {
                $content = $content -replace $p, "`n        "
                $modified = $true
                break
            }
        }
        
        if ($modified) {
            $content | Set-Content $file -NoNewline
            Write-Host "  ✓ Removed back button" -ForegroundColor Green
            $count++
        } else {
            Write-Host "  ⚠ Pattern not found (may already be removed)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ✗ File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Complete! Removed back buttons from $count files" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

