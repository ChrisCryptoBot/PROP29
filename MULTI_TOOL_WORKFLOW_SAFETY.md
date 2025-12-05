# 🛡️ MULTI-TOOL WORKFLOW SAFETY GUIDE

## ⚠️ CRITICAL: Preventing Codebase Corruption

This document establishes **MANDATORY** workflows to prevent codebase corruption when using:
- **Cursor AI** (this tool)
- **Claude Code Account #1**
- **Claude Code Account #2**

All three tools access the same GitHub repository: `ChrisCryptoBot/Hotel-Loss-Prevention-Platform`

---

## 🚨 GOLDEN RULES (NEVER VIOLATE)

### 1. **ALWAYS Work on Feature Branches**
   - ❌ **NEVER** commit directly to `main`
   - ✅ **ALWAYS** create a feature branch first
   - ✅ **ALWAYS** use tool-specific branch prefixes

### 2. **ALWAYS Pull Before Starting Work**
   - ✅ `git fetch origin` - Check for remote changes
   - ✅ `git pull origin main` - Update main branch
   - ✅ Create feature branch from updated main

### 3. **ALWAYS Commit Before Switching Tools**
   - ✅ Commit all changes before closing/leaving
   - ✅ Push to remote (even if WIP)
   - ✅ Document what you're working on

### 4. **NEVER Force Push to Main**
   - ❌ `git push --force origin main` - **FORBIDDEN**
   - ✅ Use Pull Requests for main branch merges

### 5. **ALWAYS Check Status Before Starting**
   - ✅ `git status` - Check for uncommitted changes
   - ✅ `git branch` - Verify current branch
   - ✅ `git log --oneline -5` - See recent commits

---

## 📋 BRANCH NAMING CONVENTION

### Format: `{tool}/{feature-description}-{timestamp}`

**Cursor AI:**
```
cursor/ai-integration-gold-standard-20250127
cursor/fix-incident-log-ui-20250127
```

**Claude Code #1:**
```
claude1/feature-name-20250127
claude1/bugfix-description-20250127
```

**Claude Code #2:**
```
claude2/feature-name-20250127
claude2/bugfix-description-20250127
```

**Emergency/Hotfix:**
```
hotfix/critical-security-patch-20250127
```

---

## 🔄 SAFE WORKFLOW FOR EACH TOOL

### **STARTING WORK (Every Time)**

```bash
# 1. Check current status
git status
git branch

# 2. Fetch latest from GitHub
git fetch origin

# 3. Update main branch (if not on feature branch)
git checkout main
git pull origin main

# 4. Create new feature branch
git checkout -b cursor/your-feature-name-$(Get-Date -Format "yyyyMMdd")

# 5. Verify you're on the new branch
git branch
```

### **DURING WORK**

```bash
# Check status frequently
git status

# Commit frequently (small commits)
git add .
git commit -m "Descriptive commit message"

# Push to remote (even WIP)
git push origin cursor/your-feature-name-20250127
```

### **ENDING WORK (Before Switching Tools)**

```bash
# 1. Check for uncommitted changes
git status

# 2. Commit everything
git add .
git commit -m "WIP: Feature description - ready for next tool"

# 3. Push to remote
git push origin cursor/your-feature-name-20250127

# 4. Document what was done
# (Update this file or create WORK_IN_PROGRESS.md)
```

### **SWITCHING TOOLS**

```bash
# 1. Commit and push current work
git add .
git commit -m "Checkpoint: Feature description"
git push origin cursor/your-feature-name-20250127

# 2. Fetch latest
git fetch origin

# 3. Check what branches exist
git branch -a

# 4. If continuing work, checkout the branch
git checkout cursor/your-feature-name-20250127
git pull origin cursor/your-feature-name-20250127

# 5. If starting new work, follow "STARTING WORK" steps
```

---

## 🛡️ SAFETY CHECKS (Run Before Major Operations)

### Pre-Commit Safety Check
```bash
# Check for uncommitted changes
git status

# Verify branch name (should NOT be 'main')
git branch | grep "*"

# Check for merge conflicts
git diff --check

# Verify remote is correct
git remote -v
```

### Pre-Push Safety Check
```bash
# Pull latest changes first
git fetch origin
git pull origin $(git branch --show-current)

# Check for conflicts
git status

# Verify you're not on main
if (git branch --show-current -eq "main") {
    Write-Error "❌ DO NOT PUSH TO MAIN! Create a feature branch first."
    exit 1
}
```

---

## 🔀 MERGING TO MAIN (Pull Request Workflow)

### **NEVER merge directly to main from command line**

1. **Push feature branch to GitHub**
   ```bash
   git push origin cursor/your-feature-name-20250127
   ```

2. **Create Pull Request on GitHub**
   - Go to: https://github.com/ChrisCryptoBot/Hotel-Loss-Prevention-Platform
   - Click "New Pull Request"
   - Select your feature branch → main
   - Review changes
   - Merge via GitHub UI

3. **After Merge, Update Local Main**
   ```bash
   git checkout main
   git pull origin main
   git branch -d cursor/your-feature-name-20250127  # Delete local branch
   ```

---

## 🚨 EMERGENCY RECOVERY

### If Codebase Gets Corrupted

```bash
# 1. DON'T PANIC - Don't delete anything yet

# 2. Check what happened
git status
git log --oneline -10
git branch -a

# 3. Create a backup branch
git checkout -b backup/emergency-$(Get-Date -Format "yyyyMMdd-HHmmss")

# 4. Try to recover
git reflog  # See recent actions
git checkout HEAD@{n}  # Go back to a good state

# 5. If all else fails, fresh clone
cd ..
git clone https://github.com/ChrisCryptoBot/Hotel-Loss-Prevention-Platform.git proper-29-recovery
cd proper-29-recovery
```

---

## 📝 TOOL-SPECIFIC NOTES

### **Cursor AI (This Tool)**
- Branch prefix: `cursor/`
- Always check `git status` before making changes
- Commit frequently with descriptive messages
- Push to remote before ending session

### **Claude Code Account #1**
- Branch prefix: `claude1/`
- Follow same workflow as Cursor
- Check for existing branches before creating new ones

### **Claude Code Account #2**
- Branch prefix: `claude2/`
- Follow same workflow as Cursor
- Coordinate with other tools if working on same feature

---

## ✅ DAILY CHECKLIST

Before starting work each day:

- [ ] `git fetch origin` - Check for remote changes
- [ ] `git status` - Check for uncommitted changes
- [ ] `git branch` - Verify current branch
- [ ] `git log --oneline -5` - Review recent commits
- [ ] Check GitHub for open Pull Requests
- [ ] Read `WORK_IN_PROGRESS.md` if it exists

---

## 🔍 BRANCH CLEANUP

### List All Branches
```bash
# Local branches
git branch

# Remote branches
git branch -r

# All branches
git branch -a
```

### Delete Old Feature Branches (After Merged)
```bash
# Delete local branch
git branch -d cursor/old-feature-name

# Delete remote branch
git push origin --delete cursor/old-feature-name
```

---

## 📞 COORDINATION

### When Multiple Tools Work on Same Feature

1. **Create a coordination branch**
   ```bash
   git checkout -b shared/feature-name-20250127
   ```

2. **Document who's working on what**
   - Create `WORK_IN_PROGRESS.md`
   - List current tasks
   - Update when switching tools

3. **Frequent syncs**
   ```bash
   git fetch origin
   git pull origin shared/feature-name-20250127
   ```

---

## 🎯 QUICK REFERENCE

| Action | Command |
|--------|---------|
| Start work | `git fetch && git checkout main && git pull && git checkout -b cursor/feature-name` |
| Check status | `git status` |
| Commit | `git add . && git commit -m "message"` |
| Push | `git push origin cursor/feature-name` |
| Switch tools | `git add . && git commit -m "checkpoint" && git push` |
| Emergency | `git reflog` then `git checkout HEAD@{n}` |

---

## ⚠️ RED FLAGS (STOP IMMEDIATELY)

If you see any of these, **STOP** and investigate:

- ❌ `git status` shows "diverged" branches
- ❌ `git pull` shows merge conflicts
- ❌ Multiple branches with same name
- ❌ Uncommitted changes when switching branches
- ❌ Force push warnings
- ❌ "detached HEAD" state
- ❌ Local changes that don't match remote

**If you see red flags:**
1. Don't commit anything
2. Don't push anything
3. Document the issue
4. Create a backup branch
5. Ask for help or investigate carefully

---

## 📚 ADDITIONAL RESOURCES

- GitHub Repo: https://github.com/ChrisCryptoBot/Hotel-Loss-Prevention-Platform
- Git Documentation: https://git-scm.com/doc
- Branch Protection: Consider enabling on GitHub

---

**Last Updated:** 2025-01-27
**Maintained By:** All three tools (Cursor AI, Claude Code #1, Claude Code #2)

