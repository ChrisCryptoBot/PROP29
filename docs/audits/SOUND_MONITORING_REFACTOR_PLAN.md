# Sound Monitoring Module - Refactoring Plan
**Date:** 2024-01-XX  
**Phase:** Phase 3 - Architecture Refactor, REFACTORING_PHASE_1: Analysis & Planning  
**Module:** Sound Monitoring

---

## REFACTORING DECISION

**Needs Refactoring:** ✅ **YES**

**Reasons (6/7 criteria met):**
- ✅ File >1000 lines? No (633 lines, but close to threshold)
- ✅ Business logic mixed with UI? Yes
- ✅ No separation of concerns? Yes
- ✅ Difficult to test? Yes
- ✅ Hard to maintain? Yes
- ✅ No context/hooks pattern? Yes
- ✅ Components not modularized? Yes

**Score: 6/7** → **REFACTOR REQUIRED**

---

## CURRENT MODULE ANALYSIS

### Current File Structure
```
frontend/src/pages/modules/
└── SoundMonitoring.tsx (633 lines - monolithic)
```

### Current Architecture Issues
1. **Monolithic Component:** All logic in single file
2. **Business Logic in Component:** State management, API calls, handlers all in component
3. **No Service Layer:** Uses generic `ModuleService` instead of dedicated service
4. **No Context/Hooks Pattern:** Uses local `useState` hooks
5. **Tabs as Switch Cases:** Tabs are inline switch cases, not separate components
6. **No Modal Components:** Alert details functionality exists but no modal
7. **Type Definitions in File:** Interfaces defined in component file
8. **No Error Boundaries:** No error handling at component level

---

## COMPONENT INVENTORY

### Tabs to Extract (5 tabs)
1. **OverviewTab** (`overview`)
   - Key metrics (4 metric cards)
   - Recent sound alerts list
   - Empty state handling

2. **LiveMonitoringTab** (`monitoring`)
   - Live audio visualization
   - Real-time decibel level
   - Waveform visualization
   - Frequency spectrum
   - Sound zones status

3. **SoundAlertsTab** (`alerts`)
   - Alert list display
   - Acknowledge/Resolve buttons
   - Alert filtering (future)
   - Empty state

4. **AnalyticsTab** (`analytics`)
   - Metrics display (3 metrics)
   - Charts/graphs (future enhancement)
   - Date range selection (future)

5. **SettingsTab** (`settings`)
   - Currently placeholder
   - Settings form (to be implemented)
   - Configuration options

### Modals to Create (1 modal)
1. **AlertDetailsModal**
   - Display alert details
   - Show full alert information
   - Actions (acknowledge/resolve if applicable)
   - Close handler

### Filters to Create (Future - Optional)
- Alert status filter
- Alert severity filter
- Date range filter
- Search functionality

---

## BUSINESS LOGIC IDENTIFIED

### State Management
- `soundAlerts: SoundAlert[]` - List of alerts
- `soundZones: SoundZone[]` - List of monitoring zones
- `metrics: SoundMetrics` - System metrics
- `audioVisualization: AudioVisualization` - Real-time audio data
- `loading: boolean` - Loading state
- `selectedAlert: SoundAlert | null` - Selected alert for details
- `activeTab: string` - Current active tab

### Actions/Functions
- `handleAcknowledgeAlert(alertId: number)` - Acknowledge an alert
- `handleResolveAlert(alertId: number)` - Resolve an alert
- `handleViewAlert(alert: SoundAlert)` - View alert details
- `getSeverityBadgeClass(severity: string)` - Badge styling helper
- `getStatusBadgeClass(status: string)` - Badge styling helper
- `getZoneTypeBadgeClass(type: string)` - Badge styling helper

### API Calls (Current)
- `ModuleService.acknowledgeSoundAlert(alertId)` - Acknowledge alert
- Future: Get alerts, get zones, get metrics, get settings, update settings

---

## TARGET FILE STRUCTURE

After refactoring, the module should follow this structure:

```
frontend/src/features/sound-monitoring/
├── SoundMonitoringOrchestrator.tsx          # Main orchestrator component
├── context/
│   └── SoundMonitoringContext.tsx          # Context provider and hook
├── hooks/
│   └── useSoundMonitoringState.ts           # Business logic hook
├── services/
│   └── soundMonitoringService.ts            # API service layer
├── components/
│   ├── tabs/
│   │   ├── OverviewTab.tsx
│   │   ├── LiveMonitoringTab.tsx
│   │   ├── SoundAlertsTab.tsx
│   │   ├── AnalyticsTab.tsx
│   │   ├── SettingsTab.tsx
│   │   └── index.ts                         # Barrel exports
│   ├── modals/
│   │   ├── AlertDetailsModal.tsx
│   │   └── index.ts                         # Barrel exports
│   └── index.ts                             # Component barrel exports
├── types/
│   └── sound-monitoring.types.ts            # Type definitions
├── utils/
│   └── badgeHelpers.ts                      # Badge helper functions
└── index.ts                                 # Feature barrel exports
```

---

## TYPE DEFINITIONS TO EXTRACT

### Current Interfaces (in component file)
- `SoundAlert` - Alert data structure
- `SoundZone` - Zone data structure
- `SoundMetrics` - Metrics data structure
- `AudioVisualization` - Real-time audio data structure

### Additional Types Needed
- `SoundMonitoringFilters` - Filter options
- `SoundMonitoringSettings` - Settings structure
- API request/response types
- Context value type
- Hook return type

---

## SERVICE LAYER DESIGN

### Current State
- Uses `ModuleService.acknowledgeSoundAlert()` (generic service)
- Backend endpoints: `/sound-monitoring/alerts/{id}/acknowledge` (exists in ModuleService)

### Service Methods Needed
- `getAlerts(filters?)` - Get all alerts
- `getAlert(alertId)` - Get single alert
- `acknowledgeAlert(alertId)` - Acknowledge alert
- `resolveAlert(alertId)` - Resolve alert
- `getZones()` - Get monitoring zones
- `getMetrics()` - Get system metrics
- `getSettings()` - Get settings
- `updateSettings(settings)` - Update settings
- `getAudioVisualization()` - Get real-time audio data (if backend exists)

### Backend Status
- ⚠️ **Unknown:** Backend endpoints may not exist
- ModuleService has `acknowledgeSoundAlert()` method
- No other sound monitoring endpoints found in backend audit

---

## CONTEXT STRUCTURE DESIGN

### Context Value Interface
```typescript
interface SoundMonitoringContextValue {
  // Data
  soundAlerts: SoundAlert[];
  soundZones: SoundZone[];
  metrics: SoundMetrics;
  audioVisualization: AudioVisualization;
  selectedAlert: SoundAlert | null;
  
  // Loading states
  loading: {
    alerts: boolean;
    zones: boolean;
    metrics: boolean;
    audio: boolean;
    actions: boolean;
  };
  
  // Actions
  acknowledgeAlert: (alertId: number) => Promise<void>;
  resolveAlert: (alertId: number) => Promise<void>;
  viewAlert: (alert: SoundAlert) => void;
  clearSelectedAlert: () => void;
  refreshAlerts: () => Promise<void>;
  refreshZones: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  refreshAudioVisualization: () => Promise<void>;
  
  // Settings (future)
  getSettings: () => Promise<SoundMonitoringSettings>;
  updateSettings: (settings: Partial<SoundMonitoringSettings>) => Promise<void>;
  
  // Modal controls
  setShowAlertDetailsModal: (show: boolean) => void;
  showAlertDetailsModal: boolean;
}
```

---

## BUTTON WORKFLOW AUDIT

### Overview Tab
- **None** - No buttons (Quick Actions removed)

### Live Monitoring Tab
- **None** - Display only

### Sound Alerts Tab
- **Acknowledge Button** (line 488-497)
  - Status: ✅ Functional (calls `handleAcknowledgeAlert`)
  - Uses: ModuleService.acknowledgeSoundAlert()
  - Issue: Backend may not exist
  
- **Resolve Button** (line 499-509)
  - Status: ❌ Mock implementation (setTimeout)
  - Uses: Mock delay
  - Issue: Needs API integration
  
- **Alert Click** (line 465)
  - Status: ❌ Sets state but no modal renders
  - Uses: `handleViewAlert`
  - Issue: Missing AlertDetailsModal

### Analytics Tab
- **None** - Display only

### Settings Tab
- **None** - Placeholder

### Summary
- 2 functional buttons (1 real API, 1 mock)
- 1 broken workflow (alert details)
- No missing onClick handlers
- No redundant buttons

---

## REFACTORING PHASES BREAKDOWN

### REFACTORING_PHASE_1: Analysis & Planning ✅
- **Status:** COMPLETE
- **Output:** This document

### REFACTORING_PHASE_2: Setup Architecture Foundation
**Tasks:**
1. Create folder structure
2. Create type definitions file
3. Create service layer (if backend exists, or placeholder)
4. Create context provider
5. Create state hook
6. Create badge helpers utility

**Effort:** 2-3 hours

### REFACTORING_PHASE_3: Extract Tab Components
**Tasks:**
1. Extract OverviewTab
2. Extract LiveMonitoringTab
3. Extract SoundAlertsTab
4. Extract AnalyticsTab
5. Extract SettingsTab (placeholder or basic implementation)
6. Create tab barrel exports

**Effort:** 3-4 hours

### REFACTORING_PHASE_4: Extract Modal Components
**Tasks:**
1. Create AlertDetailsModal
2. Integrate modal into orchestrator
3. Connect to context

**Effort:** 1-2 hours

### REFACTORING_PHASE_5: Create Orchestrator
**Tasks:**
1. Create SoundMonitoringOrchestrator
2. Set up tab navigation
3. Integrate context provider
4. Set up modal state management

**Effort:** 1-2 hours

### REFACTORING_PHASE_6: Integration & Testing
**Tasks:**
1. Update main module file
2. Fix all imports
3. Fix TypeScript errors
4. Fix linter errors
5. Test UI functionality

**Effort:** 2-3 hours

### REFACTORING_PHASE_7: Button Workflow Fixes
**Tasks:**
1. Fix alert details modal integration
2. Verify acknowledge/resolve workflows
3. Test all button interactions

**Effort:** 1 hour

### REFACTORING_PHASE_8: Polish & Optimization
**Tasks:**
1. Add empty states
2. Improve loading states
3. Add error boundaries
4. UI consistency checks

**Effort:** 1-2 hours

---

## KNOWN ISSUES TO ADDRESS

1. **Backend Integration Status**
   - Issue: Backend endpoints may not exist
   - Impact: Service layer may need to use mock data
   - Decision: Create service with mock data, ready for backend integration

2. **Settings Tab Placeholder**
   - Issue: Settings tab is placeholder
   - Impact: Need to implement or keep as placeholder
   - Decision: Implement basic settings form (thresholds, notifications)

3. **Alert Details Modal Missing**
   - Issue: Clicking alert sets state but no modal
   - Impact: Broken functionality
   - Fix: Create AlertDetailsModal component

4. **Resolve Alert Mock Implementation**
   - Issue: Uses setTimeout instead of API
   - Impact: Not persistent
   - Fix: Use API call or document as mock

---

## DEPENDENCIES & INTEGRATIONS

### External Dependencies
- React, React Router (standard)
- UI Components (Card, Button, etc.)
- Toast utilities
- ApiService (for API calls)

### Internal Dependencies
- Auth context (for RBAC - future)
- ModuleService (currently used, should migrate to dedicated service)

### Backend Dependencies
- `/sound-monitoring/alerts` endpoints (may not exist)
- `/sound-monitoring/zones` endpoints (may not exist)
- `/sound-monitoring/metrics` endpoints (may not exist)
- `/sound-monitoring/settings` endpoints (may not exist)

---

## REFACTORING RISKS

1. **Backend Doesn't Exist**
   - Risk: Service layer will need mock data
   - Mitigation: Create service with mock data, ready for backend
   
2. **Breaking Changes**
   - Risk: Refactoring could break existing functionality
   - Mitigation: Careful testing, incremental changes

3. **Settings Tab Complexity**
   - Risk: Settings tab needs implementation
   - Mitigation: Start with basic implementation, enhance later

---

## SUCCESS CRITERIA

After refactoring, the module should:
- ✅ Follow Gold Standard architecture pattern
- ✅ Have modular components (tabs, modals)
- ✅ Use context/hooks pattern
- ✅ Have dedicated service layer
- ✅ Be easier to test and maintain
- ✅ Have no TypeScript errors
- ✅ Have no linter errors
- ✅ UI functionality preserved
- ✅ Alert details modal working
- ✅ All buttons functional

---

## ESTIMATED EFFORT

**Total Estimated Time:** 11-17 hours

**Breakdown:**
- Setup & Foundation: 2-3 hours
- Tab Extraction: 3-4 hours
- Modal Creation: 1-2 hours
- Orchestrator: 1-2 hours
- Integration & Testing: 2-3 hours
- Fixes & Polish: 2-3 hours

---

## NEXT STEPS

1. ✅ **REFACTORING_PHASE_1 Complete** - Analysis & Planning done
2. ⏭️ **REFACTORING_PHASE_2: Setup Architecture Foundation**
   - Create folder structure
   - Create types file
   - Create service layer
   - Create context & hook
3. ⏭️ Continue with remaining phases

---

**Plan Complete**  
**Ready for Implementation**
