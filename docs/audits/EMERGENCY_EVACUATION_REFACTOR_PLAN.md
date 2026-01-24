# EMERGENCY_EVACUATION_REFACTOR_PLAN

## REFACTORING_PHASE_1: Analysis & Planning

### ✅ Assessment
- Monolithic file ~2200 lines
- Mixed UI + business logic + mock data
- No context/hooks separation
- Hard to test and maintain

**Refactor needed:** YES

---

## Tabs / Sections Identified
1. Overview
2. Active Evacuation
3. Communication
4. Analytics
5. Predictive Intel
6. Settings

## Modals Identified
- Settings Modal
- Assistance Assignment Modal
- Announcement Modal
- Route Details Modal

## Business Logic Functions (to move into hook)
- `handleStartEvacuation`
- `handleEndEvacuation`
- `handleAllCallAnnouncement`
- `handleSendAnnouncement`
- `handleUnlockExits`
- `handleContactEmergencyServices`
- `handleSendGuestNotifications`
- `handleAssignAssistance`
- `handleCompleteAssistance`
- `handleViewRoute`
- `handleExportData`
- `handleSaveSettings`
- `handleResetSettings`

## State Inventory
- `activeTab`, `evacuationActive`, `timer`
- Modal state: settings/announcement/assistance/route
- Forms: announcementText, assistanceNotes, settingsForm
- Data: metrics, floors, staff, routes, timeline, guestAssistance, communicationLogs, drills, predictiveInsights

---

## Target File Structure
```
frontend/src/features/emergency-evacuation/
├── EmergencyEvacuationOrchestrator.tsx
├── context/
│   └── EmergencyEvacuationContext.tsx
├── hooks/
│   └── useEmergencyEvacuationState.ts
├── components/
│   ├── tabs/
│   │   ├── OverviewTab.tsx
│   │   ├── ActiveEvacuationTab.tsx
│   │   ├── CommunicationTab.tsx
│   │   ├── AnalyticsTab.tsx
│   │   ├── PredictiveIntelTab.tsx
│   │   ├── SettingsTab.tsx
│   │   └── index.ts
│   ├── modals/
│   │   ├── SettingsModal.tsx
│   │   ├── AnnouncementModal.tsx
│   │   ├── AssistanceModal.tsx
│   │   ├── RouteDetailsModal.tsx
│   │   └── index.ts
│   └── index.ts
├── services/
│   └── evacuationService.ts
├── types/
│   └── evacuation.types.ts
└── index.ts
```

---

## Extracted Components
### Tabs
- OverviewTab: metrics + overview content
- ActiveEvacuationTab: floors + assistance + routes
- CommunicationTab: announcements + logs
- AnalyticsTab: drill stats + charts
- PredictiveIntelTab: risk projections + alerts
- SettingsTab: settings form

### Modals
- SettingsModal
- AnnouncementModal
- AssistanceModal
- RouteDetailsModal

---

## Refactor Steps
1. Create feature folder + types
2. Create `useEmergencyEvacuationState` (move all state + handlers)
3. Create context provider
4. Extract tabs and modals
5. Add orchestrator with header + sticky tabs
6. Update module entry point to use orchestrator
7. Update imports + fix type errors

---

## TODO (Priority)
1. Create types file
2. Build state hook with backend integration
3. Extract tabs and modals
4. Remove monolithic file
5. Verify UI and rebuild

---

## Estimated Effort
10-14 hours
