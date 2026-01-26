# Startup Files Audit - Obsolete File Identification

**Date:** January 26, 2026  
**Purpose:** Identify and document obsolete startup files

---

## Current Startup Files Found

### Root Directory Startup Files

1. **`start.ps1`** - Original PowerShell startup script
   - **Status:** ⚠️ **OBSOLETE** - Replaced by `start-dev.ps1`
   - **Function:** Basic startup script, launches backend and frontend
   - **Issues:** No error handling, no port checking, no diagnostics
   - **Recommendation:** DELETE or RENAME to `start.ps1.old`

2. **`start-dev.ps1`** - Enhanced development startup script
   - **Status:** ✅ **CURRENT** - Use this one
   - **Function:** Enhanced startup with error handling, port checking, diagnostics
   - **Features:** 
     - Port conflict detection
     - Environment verification
     - Status checking with retries
     - Better error messages
   - **Recommendation:** KEEP - This is the primary startup script

3. **`start.bat`** - Windows batch startup script
   - **Status:** ⚠️ **OBSOLETE** - PowerShell is preferred on Windows
   - **Function:** Same as start.ps1 but in batch format
   - **Issues:** Less powerful than PowerShell, no error handling
   - **Recommendation:** DELETE or RENAME to `start.bat.old`

### Setup Files

4. **`setup.bat`** - Windows setup script
   - **Status:** ✅ **KEEP** - Still useful for initial setup
   - **Function:** Installs dependencies, sets up database
   - **Recommendation:** KEEP

5. **`setup.sh`** - Linux/Mac setup script
   - **Status:** ✅ **KEEP** - Cross-platform support
   - **Function:** Same as setup.bat but for Unix systems
   - **Recommendation:** KEEP

### Scripts Directory

6. **`scripts/safe-start-work.ps1`** - Git workflow script
   - **Status:** ✅ **KEEP** - Different purpose (not server startup)
   - **Function:** Git workflow helper (check status, create branches)
   - **Recommendation:** KEEP - Not a server startup script

---

## Package.json Scripts

The `package.json` also contains startup commands:

- `npm run dev` - Uses concurrently to start both servers (alternative to scripts)
- `npm run start:frontend` - Starts only frontend
- `npm run start:backend` - Starts only backend

**Status:** ✅ **KEEP** - These are useful alternatives

---

## Recommendations

### Files DELETED:

1. **`start.ps1`** → ✅ **DELETED** (was renamed to `.old`, then deleted)
   - Reason: Replaced by `start-dev.ps1` which has better features

2. **`start.bat`** → ✅ **DELETED** (was renamed to `.old`, then deleted)
   - Reason: PowerShell is standard on Windows, batch is less capable

### Files to KEEP:

1. **`start-dev.ps1`** - Primary startup script
2. **`setup.bat`** - Windows setup
3. **`setup.sh`** - Unix setup
4. **`scripts/safe-start-work.ps1`** - Git workflow (different purpose)

---

## Migration Guide

**For users currently using `start.ps1` or `start.bat`:**

Simply use `start-dev.ps1` instead:
```powershell
.\start-dev.ps1
```

Or use npm:
```bash
npm run dev
```

---

## Summary

- **Deleted:** `start.ps1`, `start.bat` (obsolete files removed)
- **Current:** `start-dev.ps1` (primary startup script)
- **Keep:** `setup.bat`, `setup.sh`, `scripts/safe-start-work.ps1`
- **Alternative:** `npm run dev` (from package.json)

**Status:** ✅ Cleanup complete - All obsolete startup files have been removed.
