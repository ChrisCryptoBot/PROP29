# Guest Safety Module - Architecture Refactor Plan

**Module:** Guest Safety (Security Team Interface)  
**Date:** 2025-01-XX  
**Phase:** Phase 3 - Architecture Refactor  
**Reference:** Smart Lockers module (Gold Standard)

---

## EXECUTIVE SUMMARY

**Refactor Decision:** ✅ **REFACTOR REQUIRED**

**Reasons:**
- Monolithic file (927 lines)
- No separation of concerns
- No context/hooks pattern
- No service layer
- Multiple Gold Standard violations

**Estimated Effort:** 8-12 hours  
**Target Architecture:** Gold Standard (Smart Lockers pattern)

---

## CURRENT STATE ANALYSIS

### Current File Structure
```
frontend/src/pages/modules/
└── GuestSafety.tsx (927 lines - monolithic)
```

### Current Issues
1. All code in single file (927 lines)
2. Business logic mixed with UI
3. Local state only (no context)
4. Mock data (no API service layer)
5. Modal inline (not extracted)
6. No type definitions (types inline)
7. No RBAC implementation
8. Several broken/unwired buttons

---

## TARGET ARCHITECTURE

### Target File Structure
```
frontend/src/features/guest-safety/
├── GuestSafetyOrchestrator.tsx
├── context/
│   └── GuestSafetyContext.tsx
├── hooks/
│   └── useGuestSafetyState.ts
├── components/
│   ├── tabs/
│   │   ├── IncidentsTab.tsx
│   │   ├── MassNotificationTab.tsx
│   │   ├── ResponseTeamsTab.tsx
│   │   ├── AnalyticsTab.tsx
│   │   ├── SettingsTab.tsx
│   │   └── index.ts
│   ├── modals/
│   │   ├── IncidentDetailsModal.tsx
│   │   ├── AssignTeamModal.tsx (new)
│   │   ├── SendMessageModal.tsx (new)
│   │   └── index.ts
│   └── index.ts
├── services/
│   └── guestSafetyService.ts
├── types/
│   ├── guest-safety.types.ts
│   └── index.ts
├── utils/
│   ├── badgeHelpers.ts
│   └── constants.ts
└── index.tsx
```

---

## COMPONENTS TO EXTRACT

### Tab Components (5 tabs)
1. **IncidentsTab.tsx**
   - Current: Lines 484-592
   - Features: Incident list, filtering, incident cards, modal trigger
   - State: Uses context (incidents, filters, selectedIncident)
   - Actions: viewIncident, assignTeam, resolveIncident, sendMessage

2. **MassNotificationTab.tsx**
   - Current: Lines 640-708
   - Features: Mass notification form
   - State: Uses context (massNotificationData, sendMassNotification)
   - Actions: sendMassNotification

3. **ResponseTeamsTab.tsx**
   - Current: Lines 711-746
   - Features: Team cards display
   - State: Uses context (teams)
   - Actions: None (display only)

4. **AnalyticsTab.tsx**
   - Current: Lines 749-774
   - Features: Metrics display
   - State: Uses context (metrics)
   - Actions: None (display only)

5. **SettingsTab.tsx**
   - Current: Lines 777-854
   - Features: Settings form
   - State: Uses context (settings, updateSettings)
   - Actions: updateSettings, resetSettings

### Modal Components (3 modals)
1. **IncidentDetailsModal.tsx**
   - Current: Lines 858-922 (inline)
   - Features: Incident details, action buttons
   - Props: Uses context (selectedIncident, setSelectedIncident)
   - Actions: assignTeam, resolveIncident, sendMessage

2. **AssignTeamModal.tsx** (NEW)
   - Features: Team selection for incident assignment
   - Props: Uses context (teams, assignTeam)
   - Actions: assignTeam

3. **SendMessageModal.tsx** (NEW)
   - Features: Message input for guest communication
   - Props: Uses context (sendMessage)
   - Actions: sendMessage

---

## REFACTORING PHASES

### REFACTORING_PHASE_1: Analysis & Planning ✅
**Status:** Complete (this document)

### REFACTORING_PHASE_2: Setup Architecture Foundation

**Tasks:**
1. Create folder structure
2. Create type definitions (`types/guest-safety.types.ts`)
3. Create utility helpers (`utils/badgeHelpers.ts`, `utils/constants.ts`)
4. Create service layer (`services/guestSafetyService.ts`)
5. Create state hook (`hooks/useGuestSafetyState.ts`)
6. Create context provider (`context/GuestSafetyContext.tsx`)

**Estimated Time:** 2-3 hours

### REFACTORING_PHASE_3: Extract Tab Components

**Tasks:**
1. Extract IncidentsTab
2. Extract MassNotificationTab
3. Extract ResponseTeamsTab
4. Extract AnalyticsTab
5. Extract SettingsTab

**Estimated Time:** 2-3 hours

### REFACTORING_PHASE_4: Extract Modal Components

**Tasks:**
1. Extract IncidentDetailsModal
2. Create AssignTeamModal
3. Create SendMessageModal

**Estimated Time:** 1-2 hours

### REFACTORING_PHASE_5: Create Orchestrator

**Tasks:**
1. Create GuestSafetyOrchestrator
2. Integrate Provider
3. Set up tab navigation
4. Integrate modals
5. Add header (Gold Standard layout)

**Estimated Time:** 1-2 hours

### REFACTORING_PHASE_6: Integration & Testing

**Tasks:**
1. Update main module file
2. Create barrel exports
3. Fix all imports
4. Fix TypeScript errors
5. Fix linter errors
6. Ensure build passes

**Estimated Time:** 1-2 hours

### REFACTORING_PHASE_7: Button Workflow Audit & Fixes

**Tasks:**
1. Wire all buttons to handlers
2. Fix Settings tab (state management, handlers)
3. Implement Send Message workflow
4. Add loading states
5. Add empty states

**Estimated Time:** 1-2 hours

### REFACTORING_PHASE_8: RBAC Integration

**Tasks:**
1. Add useAuth to state hook
2. Implement RBAC helper functions
3. Add role guards to actions
4. Export RBAC flags
5. Update UI for conditional rendering

**Estimated Time:** 1 hour

### REFACTORING_PHASE_9: Polish & Optimization

**Tasks:**
1. Fix type errors
2. Fix UI issues (Gold Standard compliance)
3. Add error boundaries
4. Remove "Quick Actions" card (if not needed)
5. Ensure UI uniformity

**Estimated Time:** 1 hour

---

## TYPE DEFINITIONS

### Core Types (from ApiService.ts)
- `GuestSafetyIncident` (already defined in ApiService)
- `GuestSafetyAlert` (already defined in ApiService)

### Additional Types Needed
- `ResponseTeam`
- `SafetyMetrics`
- `MassNotificationData`
- `GuestSafetySettings`
- `GuestSafetyFilters`
- `TabId`

---

## SERVICE LAYER

### Service Methods (using ApiService endpoints)
- `getIncidents(filters?)`
- `getIncident(id)`
- `createIncident(data)`
- `updateIncident(id, data)`
- `deleteIncident(id)`
- `resolveIncident(id)`
- `assignTeam(incidentId, teamId)` (future - may use updateIncident)
- `getAlerts(filters?)`
- `createAlert(data)`
- `getTeams()` (future - may need new endpoint)
- `getMetrics()` (future - may need new endpoint)
- `getSettings()` (future - may need new endpoint)
- `updateSettings(settings)` (future - may need new endpoint)
- `sendMassNotification(data)` (future - may need new endpoint)

**Note:** Some methods may not have backend endpoints yet. Will use mock data initially, prepare for API integration.

---

## STATE MANAGEMENT

### State Hook Structure
```typescript
useGuestSafetyState() {
  // Data
  incidents: GuestSafetyIncident[]
  teams: ResponseTeam[]
  metrics: SafetyMetrics
  settings: GuestSafetySettings
  
  // Loading states
  loading: { incidents, teams, metrics, settings, actions }
  
  // RBAC flags
  canAssignTeam: boolean
  canResolveIncident: boolean
  canSendNotification: boolean
  canManageSettings: boolean
  
  // Modal states (Modal State Convergence)
  showIncidentModal: boolean
  setShowIncidentModal
  selectedIncident: GuestSafetyIncident | null
  setSelectedIncident
  showAssignTeamModal: boolean
  setShowAssignTeamModal
  showSendMessageModal: boolean
  setShowSendMessageModal
  
  // Actions
  refreshIncidents
  assignTeam
  resolveIncident
  sendMessage
  sendMassNotification
  updateSettings
  resetSettings
}
```

---

## RBAC IMPLEMENTATION

### Required Roles
- **View Incidents:** All authenticated users
- **Assign Team:** `SECURITY_OFFICER`, `ADMIN`
- **Resolve Incident:** `SECURITY_OFFICER`, `ADMIN`
- **Send Mass Notification:** `ADMIN` only
- **Manage Settings:** `ADMIN` only

### RBAC Flags (for UI conditional rendering)
- `canAssignTeam`
- `canResolveIncident`
- `canSendNotification`
- `canManageSettings`

---

## UI/UX IMPROVEMENTS

### Gold Standard Compliance
- ✅ Header layout (centered title, sticky tabs)
- ✅ Remove "Quick Actions" card (navigate via tabs instead)
- ✅ Consistent card styling
- ✅ Modal styling (Gold Standard pattern)
- ✅ Button styling consistency
- ✅ Loading states
- ✅ Empty states

### UI Changes
- Remove "Quick Actions" card (lines 594-637)
- Ensure consistent card styling (fix metrics cards)
- Add loading spinners
- Add empty states
- Ensure modal matches Gold Standard pattern

---

## BUTTON WORKFLOW FIXES

### Buttons to Wire/Fix
1. **IncidentsTab:**
   - "Assign Team" / "View Details" button → Wire to handlers
   - "Message" button → Open SendMessageModal

2. **IncidentDetailsModal:**
   - "Assign Team" / "Resolve" button → Wire to handlers
   - "Send Message" button → Open SendMessageModal

3. **SettingsTab:**
   - "Save Settings" button → Wire to updateSettings handler
   - "Reset to Defaults" button → Wire to resetSettings handler

4. **MassNotificationTab:**
   - "Send Mass Notification" button → Already wired (keep)

---

## VALIDATION (Optional - Defer if User Prefers)

**Zod Validation:**
- Defer if user prefers (like Sound Monitoring)
- Can add later during API integration

---

## MOCK DATA STRATEGY

- Keep mock data in state hook for visualization
- Service layer will use ApiService endpoints when backend is ready
- Easy to switch from mock to real API

---

## ESTIMATED TIMELINE

**Total Estimated Time:** 8-12 hours

**Phase Breakdown:**
- Phase 2: Setup Foundation - 2-3 hours
- Phase 3: Extract Tabs - 2-3 hours
- Phase 4: Extract Modals - 1-2 hours
- Phase 5: Create Orchestrator - 1-2 hours
- Phase 6: Integration - 1-2 hours
- Phase 7: Button Fixes - 1-2 hours
- Phase 8: RBAC Integration - 1 hour
- Phase 9: Polish - 1 hour

---

## RISKS & MITIGATION

### Risk 1: API Endpoints Not Ready
**Mitigation:** Use mock data initially, prepare service layer for API integration

### Risk 2: Type Mismatches
**Mitigation:** Use ApiService types as base, extend as needed

### Risk 3: Complex State Management
**Mitigation:** Follow Smart Lockers pattern exactly

---

## SUCCESS CRITERIA

- [ ] All tabs extracted to separate components
- [ ] All modals extracted/created
- [ ] Context/hooks pattern implemented
- [ ] Service layer created
- [ ] All buttons wired and functional
- [ ] RBAC implemented
- [ ] Gold Standard UI compliance
- [ ] Build passes
- [ ] No TypeScript errors
- [ ] No linter errors

---

## NEXT STEPS

1. Start REFACTORING_PHASE_2: Setup Architecture Foundation
2. Create folder structure
3. Create types, utils, services
4. Create state hook and context
5. Continue through all phases
6. Complete refactor
