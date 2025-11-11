# 📁 EXACT FILE LOCATIONS - AI QUICK REFERENCE
**Last Updated:** October 24, 2025  
**Purpose:** Crystal-clear file locations for AI assistants

---

## 🎯 HOW TO USE THIS DOCUMENT

**For AI Assistants:** When looking for a file, CHECK THIS FIRST!  
**For Developers:** Keep this updated when moving files

---

## 📂 MODULE FILES - EXACT LOCATIONS

### ✅ Location 1: `frontend/src/pages/modules/` (MOST MODULES HERE)

**Import Pattern:** `import ModuleName from './pages/modules/ModuleName';`

| File Name | Full Path | Import in App.tsx |
|-----------|-----------|-------------------|
| `AccessControlModule.tsx` | `frontend/src/pages/modules/AccessControlModule.tsx` | `./pages/modules/AccessControlModule` |
| `Admin.tsx` | `frontend/src/pages/modules/Admin.tsx` | `./pages/modules/Admin` |
| `AdvancedReports.tsx` | `frontend/src/pages/modules/AdvancedReports.tsx` | `./pages/modules/AdvancedReports` |
| `CybersecurityHub.tsx` | `frontend/src/pages/modules/CybersecurityHub.tsx` | `./pages/modules/CybersecurityHub` |
| `DigitalHandover.tsx` | `frontend/src/pages/modules/DigitalHandover.tsx` | `./pages/modules/DigitalHandover` |
| `EmergencyAlerts.tsx` | `frontend/src/pages/modules/EmergencyAlerts.tsx` | `./pages/modules/EmergencyAlerts` |
| `EventLogModule.tsx` | `frontend/src/pages/modules/EventLogModule.tsx` | `./pages/modules/EventLogModule` |
| `EvidenceManagement.tsx` | `frontend/src/pages/modules/EvidenceManagement.tsx` | `./pages/modules/EvidenceManagement` |
| `GuestSafety.tsx` | `frontend/src/pages/modules/GuestSafety.tsx` | `./pages/modules/GuestSafety` |
| `IoTEnvironmental.tsx` | `frontend/src/pages/modules/IoTEnvironmental.tsx` | `./pages/modules/IoTEnvironmental` |
| `LockdownFacility.tsx` | `frontend/src/pages/modules/LockdownFacility.tsx` | `./pages/modules/LockdownFacility` |
| `LockdownFacilityDashboard.tsx` | `frontend/src/pages/modules/LockdownFacilityDashboard.tsx` | `./pages/modules/LockdownFacilityDashboard` |
| `LostAndFound.tsx` | `frontend/src/pages/modules/LostAndFound.tsx` | `./pages/modules/LostAndFound` |
| `Packages.tsx` | `frontend/src/pages/modules/Packages.tsx` | `./pages/modules/Packages` |
| `ProfileSettings.tsx` | `frontend/src/pages/modules/ProfileSettings.tsx` | `./pages/modules/ProfileSettings` |
| `SettingsTab.tsx` | `frontend/src/pages/modules/SettingsTab.tsx` | Used by IoTEnvironmental & Admin |
| `SmartParking.tsx` | `frontend/src/pages/modules/SmartParking.tsx` | `./pages/modules/SmartParking` |
| `SoundMonitoring.tsx` | `frontend/src/pages/modules/SoundMonitoring.tsx` | `./pages/modules/SoundMonitoring` |
| `SystemAdministration.tsx` | `frontend/src/pages/modules/SystemAdministration.tsx` | `./pages/modules/SystemAdministration` |
| `TeamChat.tsx` | `frontend/src/pages/modules/TeamChat.tsx` | `./pages/modules/TeamChat` |
| `Visitors.tsx` | `frontend/src/pages/modules/Visitors.tsx` | `./pages/modules/Visitors` |

### ✅ Folder-Based Modules in `frontend/src/pages/modules/`

| Folder Name | Main File | Import in App.tsx |
|-------------|-----------|-------------------|
| `BannedIndividuals/` | `index.tsx` | `./pages/modules/BannedIndividuals` |
| `Patrols/` | `index.tsx` | `./pages/modules/Patrols/index` |
| `SmartLockers/` | `index.tsx` | `./pages/modules/SmartLockers/index` |

### ⚠️ Location 2: `frontend/src/pages/` (SPECIAL PAGES - INCONSISTENT!)

**⚠️ IMPORTANT:** These 3 files are NOT in `modules/` folder but should be!

| File Name | Current Path | Should Be | Import in App.tsx |
|-----------|-------------|-----------|-------------------|
| `CameraMonitoring.tsx` | `frontend/src/pages/CameraMonitoring.tsx` | `pages/modules/` | `./pages/CameraMonitoring` ⚠️ |
| `Evacuation.tsx` | `frontend/src/pages/Evacuation.tsx` | `pages/modules/` | `./pages/Evacuation` ⚠️ |
| `DeployGuards.tsx` | `frontend/src/pages/DeployGuards.tsx` | `pages/modules/` | `./pages/DeployGuards` ⚠️ |

**Why separate?** Historical reasons - these were created before standardization  
**Problem:** Confusing for AI to find  
**Solution:** Move when convenient (low priority - currently working fine)

---

## 🔐 AUTH COMPONENTS - ALL IN `frontend/src/pages/modules/`

| Auth Component | Full Path |
|----------------|-----------|
| `AccessControlAuth.tsx` | `frontend/src/pages/modules/AccessControlAuth.tsx` |
| `BannedIndividualsAuth.tsx` | `frontend/src/pages/modules/BannedIndividualsAuth.tsx` |
| `DeployGuardsAuth.tsx` | `frontend/src/pages/modules/DeployGuardsAuth.tsx` |
| `DigitalHandoverAuth.tsx` | `frontend/src/pages/modules/DigitalHandoverAuth.tsx` |
| `EvacuationAuth.tsx` | `frontend/src/pages/modules/EvacuationAuth.tsx` |
| `GuestSafetyAuth.tsx` | `frontend/src/pages/modules/GuestSafetyAuth.tsx` |
| `LockdownFacilityAuth.tsx` | `frontend/src/pages/modules/LockdownFacilityAuth.tsx` |
| `MedicalAssistanceAuth.tsx` | `frontend/src/pages/modules/MedicalAssistanceAuth.tsx` |
| `SmartParkingAuth.tsx` | `frontend/src/pages/modules/SmartParkingAuth.tsx` |
| `SoundMonitoringAuth.tsx` | `frontend/src/pages/modules/SoundMonitoringAuth.tsx` |
| `SystemAdministrationAuth.tsx` | `frontend/src/pages/modules/SystemAdministrationAuth.tsx` |
| `ViewCamerasAuth.tsx` | `frontend/src/pages/modules/ViewCamerasAuth.tsx` |

---

## 📄 CORE PAGE FILES - ALL IN `frontend/src/pages/`

| File | Full Path | Purpose |
|------|-----------|---------|
| `Login.tsx` | `frontend/src/pages/Login.tsx` | Login page |
| `Dashboard.tsx` | `frontend/src/pages/Dashboard.tsx` | Main dashboard |
| `Analytics.tsx` | `frontend/src/pages/Analytics.tsx` | Analytics page |
| `Incidents.tsx` | `frontend/src/pages/Incidents.tsx` | Incidents overview |
| `Notifications.tsx` | `frontend/src/pages/Notifications.tsx` | Notifications |
| `Settings.tsx` | `frontend/src/pages/Settings.tsx` | Settings page |
| `MedicalAssistance.tsx` | `frontend/src/pages/MedicalAssistance.tsx` | ⚠️ Planned feature |

---

## 🎨 UI COMPONENTS - ALL IN `frontend/src/components/UI/`

| Component | Full Path |
|-----------|-----------|
| `Avatar.tsx` | `frontend/src/components/UI/Avatar.tsx` |
| `Badge.tsx` | `frontend/src/components/UI/Badge.tsx` |
| `Button.tsx` | `frontend/src/components/UI/Button.tsx` |
| `Card.tsx` | `frontend/src/components/UI/Card.tsx` |
| `DataTable.tsx` | `frontend/src/components/UI/DataTable.tsx` |
| `LoadingSpinner.tsx` | `frontend/src/components/UI/LoadingSpinner.tsx` |
| `ModuleCard.tsx` | `frontend/src/components/UI/ModuleCard.tsx` |
| `ModuleHeader.tsx` | `frontend/src/components/UI/ModuleHeader.tsx` |
| `Progress.tsx` | `frontend/src/components/UI/Progress.tsx` |
| `Sidebar.tsx` | `frontend/src/components/UI/Sidebar.tsx` |
| `SplashScreen.tsx` | `frontend/src/components/UI/SplashScreen.tsx` |

---

## 🔌 CONTEXTS - ✅ NOW IN `frontend/src/contexts/`

| Context | Full Path | Import |
|---------|-----------|--------|
| `AuthContext.tsx` | `frontend/src/contexts/AuthContext.tsx` | `./contexts/AuthContext` |
| `ModalContext.jsx` | `frontend/src/contexts/ModalContext.jsx` | `./contexts/ModalContext` |

**✅ FIXED:** Previously split between `context/` and `contexts/` - now consolidated!

---

## 🛠️ SERVICES - ALL IN `frontend/src/services/`

| Service | Full Path |
|---------|-----------|
| `ApiService.ts` | `frontend/src/services/ApiService.ts` |
| `IncidentLogService.ts` | `frontend/src/services/IncidentLogService.ts` |
| `ModuleService.ts` | `frontend/src/services/ModuleService.ts` |

---

## 🔗 SHARED SYSTEM - ALL IN `frontend/src/shared/`

### Components
- `frontend/src/shared/components/base/` - Base components
- `frontend/src/shared/components/composite/` - Composite components
- `frontend/src/shared/components/layout/` - Layout components

### Hooks
- `frontend/src/shared/hooks/useModuleEvents.ts`
- `frontend/src/shared/hooks/useModuleState.ts`
- `frontend/src/shared/hooks/usePerformanceMonitor.ts`

### Services
- `frontend/src/shared/services/api/ApiClient.ts`
- `frontend/src/shared/services/events/ModuleEventBus.ts`
- `frontend/src/shared/services/performance/PerformanceMonitor.ts`

### Types
- `frontend/src/shared/types/` - All TypeScript type definitions

---

## 📊 CSS FILES LOCATION

### Module CSS Files (Co-located with modules)

| CSS File | Location |
|----------|----------|
| `AccessControl.css` | `frontend/src/pages/modules/AccessControl.css` |
| `BannedIndividuals.css` | `frontend/src/pages/modules/BannedIndividuals.css` |
| `CameraMonitoring.css` | `frontend/src/pages/CameraMonitoring.css` ⚠️ (with page) |
| `Dashboard.css` | `frontend/src/pages/Dashboard.css` |
| `DigitalHandover.css` | `frontend/src/pages/modules/DigitalHandover.css` |
| `Evacuation.css` | `frontend/src/pages/Evacuation.css` ⚠️ (with page) |
| `GuestSafety.css` | `frontend/src/pages/modules/GuestSafety.css` |
| `LockdownFacility.css` | `frontend/src/pages/modules/LockdownFacility.css` |
| `MedicalAssistance.css` | `frontend/src/pages/MedicalAssistance.css` |
| `SmartParking.css` | `frontend/src/pages/modules/SmartParking.css` |
| `SoundMonitoring.css` | `frontend/src/pages/modules/SoundMonitoring.css` |
| `SystemAdministration.css` | `frontend/src/pages/modules/SystemAdministration.css` |

---

## 🎯 QUICK SEARCH GUIDE FOR AI

### "Where is the Access Control module?"
→ `frontend/src/pages/modules/AccessControlModule.tsx`

### "Where is Camera Monitoring?"
→ `frontend/src/pages/CameraMonitoring.tsx` ⚠️ (NOT in modules folder!)

### "Where is the Patrol module?"
→ `frontend/src/pages/modules/Patrols/index.tsx`

### "Where are the Auth components?"
→ `frontend/src/pages/modules/*Auth.tsx` (all in modules folder)

### "Where is the Sidebar?"
→ `frontend/src/components/UI/Sidebar.tsx`

### "Where is the main routing?"
→ `frontend/src/App.tsx`

### "Where are contexts?"
→ `frontend/src/contexts/` ✅ (all consolidated here now)

---

## ⚠️ KNOWN INCONSISTENCIES

### Files in Wrong Location (Low Priority to Fix)

1. **CameraMonitoring** - In `pages/` but should be in `pages/modules/`
2. **Evacuation** - In `pages/` but should be in `pages/modules/`
3. **DeployGuards** - In `pages/` but should be in `pages/modules/`

**Status:** Working perfectly, just not ideally organized  
**Impact:** Minimal - just slightly confusing for navigation  
**Fix When:** Next major refactoring

---

## ✅ RECENTLY FIXED

- ✅ **Context folder consolidation** - `context/` merged into `contexts/`
- ✅ **Orphaned files removed** - 6 obsolete files deleted
- ✅ **Documentation updated** - This file created!

---

## 📝 CONVENTIONS

### Naming Patterns
- **Modules:** `ModuleName.tsx` or `ModuleName/index.tsx`
- **Auth:** `ModuleNameAuth.tsx`
- **CSS:** `ModuleName.css` (co-located with module)
- **Components:** `ComponentName.tsx`
- **Services:** `serviceName.ts`
- **Hooks:** `use HookName.ts`
- **Types:** `types.ts` or `typeName.types.ts`

### Import Patterns
```typescript
// UI Components
import { Button, Card, Badge } from '../components/UI/Button';

// Contexts
import { useAuth } from '../contexts/AuthContext';

// Services
import apiService from '../services/ApiService';

// Modules (from App.tsx)
import ModuleName from './pages/modules/ModuleName';
```

---

**This document is the SINGLE SOURCE OF TRUTH for file locations!**  
**Update this whenever files are moved or added.**

