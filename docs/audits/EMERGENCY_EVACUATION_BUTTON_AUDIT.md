# EMERGENCY_EVACUATION_BUTTON_AUDIT

## Summary
Gold Standard refactor complete. Button workflows audited for Emergency Evacuation module. Status reflects current implementation (backend-integrated vs placeholder toast).

## Header Actions
- Start Evacuation: ✅ Calls `evacuationService.startEvacuation()` via context.
- End Evacuation: ✅ Calls `evacuationService.endEvacuation()` via context.
- Settings: ✅ Opens Settings modal.

## Overview Tab
- No direct action buttons.

## Active Evacuation Tab
- Assign Staff: ✅ Calls `assignAssistance` (backend integration via `evacuationService.assignAssistance`).
- Complete: ✅ Calls `completeAssistance` (backend integration).
- View Details (Route): ✅ Opens Route Details modal.
- Route Card Click: ✅ Opens Route Details modal.

## Communication Tab
- Make Announcement: ✅ Opens Announcement modal.
- Broadcast Announcement (modal): ✅ Calls `sendAnnouncement` (backend integration).
- Send Notifications: ✅ Calls `notifyGuests` (backend integration).
- Contact Services: ✅ Calls `contactEmergencyServices` (backend integration).
- Open Radio Channel: ⚠️ Placeholder toast only.

## Analytics Tab
- View Full Report: ⚠️ Placeholder toast only.
- Download Report: ⚠️ Placeholder toast only.
- View Staff Metrics: ⚠️ Placeholder toast only.
- Export Data: ⚠️ Placeholder toast only.

## Predictive Tab
- Run Assessment: ⚠️ Placeholder toast only.
- Configure Alerts: ⚠️ Placeholder toast only.
- Optimize Routes: ⚠️ Placeholder toast only.
- Run Scenario: ⚠️ Placeholder toast only.

## Settings Tab
- Reset to Defaults: ✅ Updates local settings state.
- Save Settings: ✅ Saves local settings state (no backend persistence yet).

## Settings Modal
- Reset to Defaults: ✅ Updates local settings form state.
- Save Settings: ✅ Saves local settings state (no backend persistence yet).

## Notes
- Placeholder actions are clearly marked and should be wired to backend services in a future pass.
