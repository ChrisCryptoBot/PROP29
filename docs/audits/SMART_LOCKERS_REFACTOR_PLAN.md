# Smart Lockers Module - Architecture Refactor Plan

**Module:** Smart Lockers  
**Date:** 2026-01-12  
**Phase:** 3 - Architecture Refactor  
**Status:** 🔴 Planning Phase

---

## REFACTORING_PHASE_1: Analysis & Planning

### Current Module Analysis

#### File Structure
- **Current:** `frontend/src/pages/modules/SmartLockers/index.tsx` (546 lines)
- **Architecture:** Monolithic single file
- **Gold Standard Compliant:** ❌ NO

#### Tabs Identified (5 total)
1. **Overview Tab** (`overview`)
   - Key metrics display
   - Recent locker activity
   - Quick actions
   - Status: ✅ Functional (mock data)

2. **Locker Management Tab** (`lockers`)
   - List all lockers
   - Locker details display
   - Status: ✅ Functional (mock data)

3. **Reservations Tab** (`reservations`)
   - List locker reservations
   - Reservation details
   - Status: ✅ Functional (mock data)

4. **Analytics Tab** (`analytics`)
   - Analytics metrics display
   - Status: ✅ Functional (mock data)

5. **Settings Tab** (`settings`)
   - Status: ⚠️ Placeholder only (empty UI)

#### Modals Identified (2 declared, 0 implemented)
1. **Create Locker Modal** (`showCreateModal`)
   - State declared: Line 50
   - Button opens it: Line 389
   - Status: ❌ **Missing implementation**

2. **Reservation Modal** (`showReservationModal`)
   - State declared: Line 51
   - Status: ❌ **Missing implementation, no button to open**

#### Business Logic Functions
- `handleCreateLocker` (lines 171-195) - Uses setTimeout simulation
- `handleViewLocker` (lines 197-199) - Sets selected locker (no modal)
- Badge helper functions (lines 143-169) - UI helpers

#### State Management
- All state uses local `useState` hooks:
  - `activeTab`, `showCreateModal`, `showReservationModal`, `selectedLocker`, `loading`
  - `lockers`, `reservations`, `metrics` (mock data)
- No context provider pattern
- No custom hooks for business logic

#### API Calls
- ❌ **None** - All operations use `setTimeout` simulation
- Backend endpoints exist but not called:
  - `POST /lockers/assign`
  - `POST /lockers/access`
  - `GET /lockers/status`

#### Buttons and Workflows
1. **Add Locker Button** (Line 387-393)
   - Action: Opens `showCreateModal` (but modal doesn't exist)
   - Status: ❌ Broken

2. **Tab Navigation Buttons** (3 buttons, lines 394-417)
   - Actions: Switch tabs
   - Status: ✅ Functional

3. **View Locker** (onClick handlers on locker items)
   - Action: Sets `selectedLocker` (no modal to display)
   - Status: ⚠️ Incomplete

---

## Target Architecture (Gold Standard)

### Directory Structure
```
frontend/src/features/smart-lockers/
├── SmartLockersOrchestrator.tsx          # Main orchestrator component
├── context/
│   └── SmartLockersContext.tsx          # Context provider and hook
├── hooks/
│   └── useSmartLockersState.ts          # Business logic hook
├── services/
│   └── lockerService.ts                 # API service layer
├── components/
│   ├── tabs/                             # Tab components
│   │   ├── OverviewTab.tsx
│   │   ├── LockersManagementTab.tsx
│   │   ├── ReservationsTab.tsx
│   │   ├── AnalyticsTab.tsx
│   │   ├── SettingsTab.tsx
│   │   └── index.ts                      # Barrel exports
│   ├── modals/                           # Modal components
│   │   ├── CreateLockerModal.tsx
│   │   ├── ReservationModal.tsx
│   │   ├── LockerDetailsModal.tsx
│   │   └── index.ts                      # Barrel exports
│   └── [OtherSharedComponents].tsx       # Shared UI components
├── types/
│   └── locker.types.ts                   # Type definitions
├── utils/
│   └── constants.ts                      # Constants
├── index.ts                              # Feature barrel exports
└── [Documentation files].md
```

---

## Component Extraction Plan

### Tab Components to Extract (5 tabs)
1. **OverviewTab.tsx**
   - Extract: Lines 253-422 (Overview tab JSX)
   - Dependencies: metrics, lockers, handleCreateLocker, setShowCreateModal, setActiveTab

2. **LockersManagementTab.tsx**
   - Extract: Lines 425-470 (Locker Management tab JSX)
   - Dependencies: lockers, handleViewLocker

3. **ReservationsTab.tsx**
   - Extract: Lines 473-514 (Reservations tab JSX)
   - Dependencies: reservations

4. **AnalyticsTab.tsx**
   - Extract: Lines 517-555 (Analytics tab JSX)
   - Dependencies: metrics

5. **SettingsTab.tsx**
   - Extract: Lines 558-566 (Settings tab JSX)
   - Status: Currently placeholder, needs implementation

### Modal Components to Create (3 modals)
1. **CreateLockerModal.tsx**
   - Purpose: Create new smart locker
   - Props: isOpen, onClose, onSubmit, formData, onFormChange, isFormDirty, setIsFormDirty
   - Fields: lockerNumber, location, size, features (array)
   - Validation: Required fields, format validation

2. **ReservationModal.tsx**
   - Purpose: Create/view locker reservation
   - Props: isOpen, onClose, onSubmit, formData, onFormChange, isFormDirty, setIsFormDirty, lockerId
   - Fields: guestId, guestName, startTime, endTime, purpose
   - Validation: Required fields, date validation

3. **LockerDetailsModal.tsx**
   - Purpose: View locker details
   - Props: isOpen, onClose, locker (SmartLocker)
   - Fields: Display-only (all locker fields)
   - Actions: Edit, Delete, View Reservation

### Hooks to Create
1. **useSmartLockersState.ts**
   - Business logic for lockers, reservations, metrics
   - CRUD operations
   - State management
   - API integration

### Services to Create
1. **lockerService.ts**
   - API calls for lockers
   - API calls for reservations
   - API calls for metrics
   - Authentication integration

### Types to Centralize
1. **locker.types.ts**
   - `SmartLocker` interface
   - `LockerReservation` interface
   - `LockerMetrics` interface
   - API request/response types
   - Form data types

---

## Implementation Strategy

### Phase 3.1: Foundation Setup
1. Create directory structure: `features/smart-lockers/`
2. Create types file: `types/locker.types.ts`
3. Create constants file: `utils/constants.ts`
4. Create service layer: `services/lockerService.ts`
5. Set up barrel exports: `index.ts`

### Phase 3.2: State Management
1. Create state hook: `hooks/useSmartLockersState.ts`
2. Create context: `context/SmartLockersContext.tsx`
3. Move business logic from component to hook

### Phase 3.3: Tab Components
1. Extract OverviewTab
2. Extract LockersManagementTab
3. Extract ReservationsTab
4. Extract AnalyticsTab
5. Implement SettingsTab (currently placeholder)

### Phase 3.4: Modal Components
1. Create CreateLockerModal
2. Create ReservationModal
3. Create LockerDetailsModal

### Phase 3.5: Integration
1. Create orchestrator: `SmartLockersOrchestrator.tsx`
2. Update router: `pages/modules/SmartLockers/index.tsx`
3. Wire up all components
4. Fix imports and exports

### Phase 3.6: API Integration
1. Replace setTimeout with real API calls
2. Add authentication headers
3. Implement error handling
4. Add loading states

### Phase 3.7: Security & Validation
1. Add input validation (Zod schemas)
2. Add RBAC checks
3. Fix type safety issues
4. Add error boundaries

### Phase 3.8: Polish & Testing
1. Fix TypeScript errors
2. Fix linter errors
3. Test all workflows
4. Verify build passes

---

## Key Decisions

### API Integration Strategy
- Use `ApiService` pattern (like other modules)
- Endpoints to implement:
  - `GET /api/lockers` - Get all lockers
  - `POST /api/lockers` - Create locker
  - `GET /api/lockers/:id` - Get locker details
  - `PUT /api/lockers/:id` - Update locker
  - `DELETE /api/lockers/:id` - Delete locker
  - `GET /api/lockers/reservations` - Get reservations
  - `POST /api/lockers/reservations` - Create reservation
  - `GET /api/lockers/metrics` - Get metrics

### State Management Strategy
- Use Context + Custom Hook pattern (Gold Standard)
- Centralize all state in `useSmartLockersState`
- Expose via `SmartLockersContext`
- Components consume context, not direct state

### Modal Strategy
- Create reusable modal components
- Use form state management (react-hook-form + Zod)
- Implement dirty state tracking
- Add confirmation on close if dirty

### Type Safety Strategy
- Remove all `any` types
- Fix `as any` assertions
- Use proper TypeScript types throughout
- Create comprehensive type definitions

---

## TODO List with Priorities

### High Priority (Critical Functionality)
- [ ] Create directory structure
- [ ] Extract types to `types/locker.types.ts`
- [ ] Create service layer with API integration
- [ ] Create state hook with business logic
- [ ] Create context provider
- [ ] Extract tab components (5 tabs)
- [ ] Create modal components (3 modals)
- [ ] Create orchestrator
- [ ] Replace setTimeout with real API calls
- [ ] Add input validation (Zod)

### Medium Priority (Security & Quality)
- [ ] Add RBAC checks
- [ ] Fix type safety issues
- [ ] Add error boundaries
- [ ] Implement Settings tab (currently placeholder)
- [ ] Add proper error handling

### Low Priority (Polish)
- [ ] Remove unused imports
- [ ] Add JSDoc comments
- [ ] Optimize performance (memoization)
- [ ] Add loading states
- [ ] Add empty states

---

## Estimated Effort

- **Phase 3.1 (Foundation):** 2-3 hours
- **Phase 3.2 (State Management):** 2-3 hours
- **Phase 3.3 (Tab Components):** 3-4 hours
- **Phase 3.4 (Modal Components):** 3-4 hours
- **Phase 3.5 (Integration):** 2-3 hours
- **Phase 3.6 (API Integration):** 3-4 hours
- **Phase 3.7 (Security & Validation):** 2-3 hours
- **Phase 3.8 (Polish & Testing):** 2-3 hours

**Total Estimated Effort:** 19-27 hours

---

## Reference Patterns

### Gold Standard Module
- Location: `frontend/src/features/access-control/`
- Context: `context/AccessControlContext.tsx`
- Hook: `hooks/useAccessControlState.ts` (check if exists, or similar pattern)
- Tab Example: `components/tabs/DashboardTab.tsx`
- Modal Example: Check for modal examples in access-control
- Orchestrator: `AccessControlModuleOrchestrator.tsx`

---

## Next Steps

**Proceed to REFACTORING_PHASE_2: Setup Architecture Foundation**

1. Create folder structure
2. Create type definitions
3. Create service layer
4. Create context and hooks foundation

---

**Report Status:** ✅ **PLANNING COMPLETE**

**Ready for:** REFACTORING_PHASE_2: Setup Architecture Foundation
