# 🚀 QUICK REFERENCE CARD

## Before Starting Work (Every Time)

```powershell
# Option 1: Use the safety script
.\safe-start-work.ps1

# Option 2: Manual steps
git status                    # Check for uncommitted changes
git fetch origin             # Get latest from GitHub
git checkout main            # Switch to main
git pull origin main         # Update main
git checkout -b cursor/your-feature-name-$(Get-Date -Format "yyyyMMdd")
```

## During Work

```powershell
git status                    # Check status frequently
git add .                     # Stage changes
git commit -m "Description"   # Commit with message
git push origin cursor/your-branch-name  # Push to remote
```

## Before Ending Work / Switching Tools

```powershell
# Option 1: Use the safety script
.\safe-end-work.ps1

# Option 2: Manual steps
git status                    # Check for uncommitted changes
git add .                     # Stage all changes
git commit -m "Checkpoint: Description"
git push origin cursor/your-branch-name
```

## Emergency Commands

```powershell
# See what happened
git reflog                    # View recent actions
git status                    # Check current state
git branch -a                 # List all branches

# Recover from bad state
git checkout HEAD@{n}         # Go back to a good commit

# Fresh start (if corrupted)
cd ..
git clone https://github.com/ChrisCryptoBot/Hotel-Loss-Prevention-Platform.git proper-29-new
```

## Branch Naming

- Cursor AI: `cursor/feature-name-20250127`
- Claude #1: `claude1/feature-name-20250127`
- Claude #2: `claude2/feature-name-20250127`

## ⚠️ NEVER

- ❌ Commit to `main` branch
- ❌ Force push to `main`
- ❌ Work without checking `git status` first
- ❌ Switch tools without committing

## ✅ ALWAYS

- ✅ Work on feature branches
- ✅ Pull before starting
- ✅ Commit before switching tools
- ✅ Push to remote frequently

