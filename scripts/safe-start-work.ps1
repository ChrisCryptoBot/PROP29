# Safe Work Start Script
# Run this before starting any work to ensure a clean state

Write-Host "🛡️ SAFE WORK START CHECK" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# 1. Check current status
Write-Host "1. Checking current status..." -ForegroundColor Yellow
$status = git status --short
if ($status) {
    Write-Host "⚠️  WARNING: You have uncommitted changes!" -ForegroundColor Yellow
    Write-Host "   Uncommitted files:" -ForegroundColor Yellow
    git status --short | ForEach-Object { Write-Host "   $_" -ForegroundColor Yellow }
    Write-Host ""
    $response = Read-Host "Commit these changes first? (y/n)"
    if ($response -eq "y") {
        $message = Read-Host "Enter commit message"
        git add .
        git commit -m $message
        Write-Host "✅ Changes committed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Please commit or stash changes before continuing" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✅ Working directory is clean" -ForegroundColor Green
}

# 2. Check current branch
Write-Host ""
Write-Host "2. Checking current branch..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "   Current branch: $currentBranch" -ForegroundColor Cyan

if ($currentBranch -eq "main") {
    Write-Host "⚠️  You are on main branch" -ForegroundColor Yellow
    Write-Host "   Creating a feature branch is recommended" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Create a feature branch? (y/n)"
    if ($response -eq "y") {
        $branchName = Read-Host "Enter branch name (will be prefixed with 'cursor/')"
        $fullBranchName = "cursor/$branchName-$(Get-Date -Format 'yyyyMMdd')"
        git checkout -b $fullBranchName
        Write-Host "✅ Created and switched to: $fullBranchName" -ForegroundColor Green
    }
} else {
    Write-Host "✅ On feature branch: $currentBranch" -ForegroundColor Green
}

# 3. Fetch latest from remote
Write-Host ""
Write-Host "3. Fetching latest from remote..." -ForegroundColor Yellow
git fetch origin
Write-Host "✅ Fetched latest changes" -ForegroundColor Green

# 4. Check if main needs updating
if ($currentBranch -eq "main") {
    Write-Host ""
    Write-Host "4. Updating main branch..." -ForegroundColor Yellow
    git pull origin main
    Write-Host "✅ Main branch updated" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "4. Checking if feature branch is up to date..." -ForegroundColor Yellow
    $localCommit = git rev-parse HEAD
    $remoteCommit = git rev-parse "origin/$currentBranch" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   Branch doesn't exist on remote yet" -ForegroundColor Yellow
    } elseif ($localCommit -ne $remoteCommit) {
        Write-Host "⚠️  Local and remote branches differ" -ForegroundColor Yellow
        $response = Read-Host "Pull latest changes? (y/n)"
        if ($response -eq "y") {
            git pull origin $currentBranch
            Write-Host "✅ Branch updated" -ForegroundColor Green
        }
    } else {
        Write-Host "✅ Branch is up to date" -ForegroundColor Green
    }
}

# 5. Show recent commits
Write-Host ""
Write-Host "5. Recent commits:" -ForegroundColor Yellow
git log --oneline -5
Write-Host ""

# 6. Final status
Write-Host ""
Write-Host "✅ SAFE TO START WORK" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Green
Write-Host "Current branch: $currentBranch" -ForegroundColor Cyan
Write-Host "Ready to make changes!" -ForegroundColor Cyan
Write-Host ""

