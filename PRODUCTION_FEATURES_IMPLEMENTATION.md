# Access Control Module - Production Features Implementation Plan

## Overview
This document outlines the implementation of "Deep SaaS" workflows and edge cases for production deployment at a 500-room luxury hotel.

## Status: IN PROGRESS

### ✅ Completed
1. **AccessControlUtilities Service** - Created utility service for common functions

### 🔄 In Progress
2. **Held-Open Alarm System** - Monitoring doors held open > 5 minutes
3. **Emergency Timeout Mechanism** - Auto-relock after configurable duration
4. **Access Priority Stack** - Permanent > Temporary > Scheduled priority

### ⏳ Pending
5. **Visitor Registration Workflow** - Full registration with ID/Photo capture, badge printing
6. **Bulk Operations** - Checkbox selection and bulk actions for users
7. **Report Generation** - Actual PDF/CSV export with backend integration
8. **Access Point Grouping** - Manage groups (e.g., "Floor 4", "Housekeeping Closets")
9. **Role-to-Zone Mapping** - Map roles to access zones (automated permission engine)
10. **Hardware Late-Sync** - Ingest cached events when devices come back online

## Implementation Details

### 1. Held-Open Alarm System (CRITICAL)
**Issue**: If a door is unlocked and physically propped open for 5+ minutes, system should trigger high-priority alert.

**Implementation**:
- Monitor `sensorStatus === 'held-open'` and `lastStatusChange` timestamp
- Check duration every 30 seconds via `useEffect` interval
- Generate `HeldOpenAlert` when duration > 300 seconds (5 minutes)
- Display in dashboard as high-priority alert banner
- Auto-acknowledge when door closes normally

**Code Location**: `AccessControlModule.tsx` - Add `useEffect` hook to monitor held-open states

### 2. Emergency Timeout Mechanism (CRITICAL)
**Issue**: Emergency unlock stays active indefinitely, could leave building open if operator forgets to reset.

**Implementation**:
- Add `emergencyTimeoutDuration` state (default: 30 minutes)
- Add `emergencyTimeoutTimer` ref to track countdown
- Auto-relock all access points after timeout expires
- Show countdown timer in emergency controls UI
- Allow operator to extend timeout if needed

**Code Location**: `AccessControlModule.tsx` - Modify `handleEmergencyUnlock` and add timeout logic

### 3. Access Priority Stack (CRITICAL)
**Issue**: Conflicting expiration logic - if user has "Permanent" access but "Temporary" access expired, system might accidentally revoke permanent access.

**Implementation**:
- Update `isAccessAllowed` function to check access types in priority order:
  1. Permanent (scheduled) access - highest priority
  2. Temporary access - medium priority
  3. Emergency override - lowest priority
- Each check is independent - permanent access never expires unless explicitly revoked
- Temporary access expiration doesn't affect permanent access

**Code Location**: `AccessControlModule.tsx` - Modify `isAccessAllowed` function (line ~776)

### 4. Visitor Registration Workflow
**Issue**: "Register Visitor" and "Print Badge" buttons only show toasts.

**Implementation**:
- Create `VisitorRegistrationModal` component
- Form fields: Name, Email, Phone, Company, Photo upload, ID document upload
- Auto-generate badge ID using `AccessControlUtilities.generateBadgeId()`
- Set auto-expiration timestamp (default: checkout time or 24 hours)
- Integrate with `handleCreateUser` but with `role: 'guest'` and `autoRevokeAtCheckout: true`
- Print badge functionality (simulate printer API call)

**Code Location**: `AccessControlModule.tsx` - Replace toast with modal and full workflow

### 5. Bulk Operations
**Issue**: "Bulk Operations" button exists but no checkboxes in user list.

**Implementation**:
- Add `selectedUsers` state (Set of user IDs)
- Add checkbox column to user list table
- "Select All" checkbox in header
- Bulk action buttons: Activate, Deactivate, Suspend, Delete, Export
- Confirmation modal for bulk delete (destructive action)

**Code Location**: `AccessControlModule.tsx` - User Management tab (line ~1270)

### 6. Report Generation
**Issue**: Export PDF/CSV buttons only show toasts.

**Implementation**:
- Create `ReportGenerationModal` component
- Options: Date range, Event types, Users, Access points, Format (PDF/CSV)
- Backend API integration: `POST /api/access-control/reports/generate`
- Show progress indicator during generation
- Download generated report file

**Code Location**: `AccessControlModule.tsx` - Reports tab (line ~1917)

### 7. Access Point Grouping
**Issue**: Currently manage 24 doors individually. Need groups like "All Housekeeping Closets" or "Floor 4 Guest Rooms".

**Implementation**:
- Add `AccessPointGroup` interface (already in utilities)
- Add "Access Point Groups" tab or section in Access Points tab
- Create/Edit/Delete group functionality
- Assign multiple access points to group
- Update permissions for entire group at once

**Code Location**: `AccessControlModule.tsx` - Add new tab or section

### 8. Role-to-Zone Mapping
**Issue**: Currently assign "John" to "Door A". Should map "Housekeeping" role to "Service Zone" for automation.

**Implementation**:
- Add `RoleZoneMapping` interface (already in utilities)
- Add "Role Zones" tab in Configuration
- Map roles (admin, manager, employee, guest) to zones (Service Zone, Guest Zone, etc.)
- Zones contain multiple access points
- New users automatically get access based on role-to-zone mapping

**Code Location**: `AccessControlModule.tsx` - Configuration tab

### 9. Hardware Late-Sync
**Issue**: If "Main Entrance" goes offline for 2 hours, it still allows access using local cache. When back online, need to ingest cached events.

**Implementation**:
- Add `cachedEvents` array to `AccessPoint` interface
- When access point goes offline, store events in `cachedEvents`
- When access point comes back online (`isOnline` changes to `true`):
  - Detect cached events
  - Show "Ingest Cached Events" button in UI
  - Batch upload cached events to backend
  - Merge into main `accessEvents` array
  - Clear `cachedEvents` after successful sync

**Code Location**: `AccessControlModule.tsx` - Monitor `isOnline` status changes

## Next Steps

1. Implement Held-Open Alarm System (Priority 1)
2. Implement Emergency Timeout Mechanism (Priority 1)
3. Implement Access Priority Stack (Priority 1)
4. Implement Visitor Registration Workflow (Priority 2)
5. Implement Bulk Operations (Priority 2)
6. Implement remaining features (Priority 3)
