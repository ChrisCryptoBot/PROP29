# Safe Work End Script
# Run this before switching tools or ending your session

Write-Host "🛡️ SAFE WORK END CHECK" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

# 1. Check for uncommitted changes
Write-Host "1. Checking for uncommitted changes..." -ForegroundColor Yellow
$status = git status --short
if ($status) {
    Write-Host "⚠️  You have uncommitted changes:" -ForegroundColor Yellow
    git status --short | ForEach-Object { Write-Host "   $_" -ForegroundColor Yellow }
    Write-Host ""
    $response = Read-Host "Commit these changes? (y/n)"
    if ($response -eq "y") {
        $message = Read-Host "Enter commit message"
        git add .
        git commit -m $message
        Write-Host "✅ Changes committed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  WARNING: Uncommitted changes will be lost if you switch tools!" -ForegroundColor Red
        $response2 = Read-Host "Continue anyway? (y/n)"
        if ($response2 -ne "y") {
            Write-Host "Aborted. Please commit or stash changes first." -ForegroundColor Yellow
            exit 1
        }
    }
} else {
    Write-Host "✅ No uncommitted changes" -ForegroundColor Green
}

# 2. Check current branch
Write-Host ""
Write-Host "2. Checking current branch..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "   Current branch: $currentBranch" -ForegroundColor Cyan

if ($currentBranch -eq "main") {
    Write-Host "⚠️  WARNING: You are on main branch!" -ForegroundColor Red
    Write-Host "   This is not recommended. Consider creating a feature branch." -ForegroundColor Yellow
} else {
    Write-Host "✅ On feature branch: $currentBranch" -ForegroundColor Green
}

# 3. Push to remote
Write-Host ""
Write-Host "3. Pushing to remote..." -ForegroundColor Yellow
$response = Read-Host "Push current branch to remote? (y/n)"
if ($response -eq "y") {
    git push origin $currentBranch
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Pushed to remote" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Push failed. Check for conflicts." -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  WARNING: Changes not pushed to remote!" -ForegroundColor Yellow
    Write-Host "   Other tools won't see your work." -ForegroundColor Yellow
}

# 4. Show summary
Write-Host ""
Write-Host "📋 WORK SESSION SUMMARY" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host "Branch: $currentBranch" -ForegroundColor Cyan
Write-Host "Recent commits:" -ForegroundColor Cyan
git log --oneline -3
Write-Host ""

# 5. Update WORK_IN_PROGRESS.md reminder
Write-Host "💡 REMINDER:" -ForegroundColor Yellow
Write-Host "   Update WORK_IN_PROGRESS.md with what you accomplished" -ForegroundColor Yellow
Write-Host ""

Write-Host "✅ SAFE TO END WORK SESSION" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Green

