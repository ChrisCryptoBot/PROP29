# LOST & FOUND MODULE - REFACTOR PLAN

**Date**: 2025-01-27  
**Phase**: 3 - Architecture Refactor  
**Module**: Lost & Found  
**Status**: 📋 **Planning Complete**  

---

## 🎯 REFACTOR OBJECTIVES

Transform the monolithic 1,801-line `LostAndFound.tsx` into a Gold Standard modular architecture following the pattern established by Incident Log and Access Control modules.

---

## 📋 COMPONENT BREAKDOWN

### Current Structure (Monolithic)
- **File**: `frontend/src/pages/modules/LostAndFound.tsx` (1,801 lines)
- **Tabs**: Overview, Storage Management, Analytics & Reports, Settings (all inline)
- **Modals**: Item Details Modal, Register New Item Modal (all inline)
- **State**: All state in component
- **API**: All operations simulated with `setTimeout`

### Target Structure (Gold Standard)
```
features/lost-and-found/
├── types/
│   └── lost-and-found.types.ts ✅ (Created)
├── services/
│   └── LostFoundService.ts ✅ (Created)
├── context/
│   └── LostFoundContext.tsx ✅ (Created)
├── hooks/
│   └── useLostFoundState.ts ✅ (Created)
├── components/
│   ├── tabs/
│   │   ├── OverviewTab.tsx (NEW)
│   │   ├── StorageTab.tsx (NEW)
│   │   ├── AnalyticsTab.tsx (NEW)
│   │   └── SettingsTab.tsx (NEW)
│   ├── modals/
│   │   ├── RegisterItemModal.tsx (NEW)
│   │   ├── ItemDetailsModal.tsx (NEW)
│   │   └── ReportModal.tsx (NEW)
│   └── index.ts (NEW)
└── routes/
    └── (if needed)
```

---

## 🔧 EXTRACTION PLAN

### Phase 1: Types & Services ✅
- [x] Create TypeScript types
- [x] Create API service layer
- [x] Create Context
- [x] Create state hook

### Phase 2: Component Extraction (IN PROGRESS)
- [ ] Extract OverviewTab (lines ~398-587)
- [ ] Extract StorageTab (lines ~589-743)
- [ ] Extract AnalyticsTab (lines ~745-1002)
- [ ] Extract SettingsTab (lines ~1004-1300)
- [ ] Extract ItemDetailsModal (lines ~1303-1578)
- [ ] Extract RegisterItemModal (lines ~1580-1861)
- [ ] Create component index.ts

### Phase 3: Orchestrator Creation
- [ ] Refactor `LostAndFound.tsx` to orchestrator
- [ ] Wire up Context Provider
- [ ] Wire up tab navigation
- [ ] Wire up modals

### Phase 4: Integration & Testing
- [ ] Wire up real API calls
- [ ] Test all CRUD operations
- [ ] Test modals
- [ ] Test navigation
- [ ] Build verification

---

## 📝 KEY COMPONENTS TO EXTRACT

### 1. OverviewTab
- Item management grid
- Filter buttons
- Item cards
- Emergency actions
- Uses: `items`, `filter`, `handleNotifyGuest`, `handleClaimItem`, `handleArchiveItem`

### 2. StorageTab
- Storage location overview
- Storage location details
- Capacity alerts
- Uses: `items`, storage location filtering

### 3. AnalyticsTab
- Key performance metrics
- Charts (Recovery Rate Trend, Common Items, Status Distribution, Value Recovered)
- Export reports
- Uses: `items`, `metrics` (if available)

### 4. SettingsTab
- System settings
- Category management
- Storage location management
- Notification settings
- Legal & compliance settings
- Uses: `settings`, `updateSettings`

### 5. ItemDetailsModal
- Item information display
- Guest information
- Notifications
- Legal compliance
- Manager approval (for weapons)
- Quick actions
- Uses: `selectedItem`, `handleNotifyGuest`, `handleClaimItem`, `handleArchiveItem`

### 6. RegisterItemModal
- Basic item information form
- Guest information form
- Storage information form
- Uses: `registerForm`, `handleRegisterItem`

---

## 🔗 INTEGRATION POINTS

### State Management
- All state managed in `useLostFoundState`
- Exposed via `LostFoundContext`
- Components use `useLostFoundContext()` hook

### API Integration
- All API calls via `LostFoundService`
- Service methods called from state hook
- Components never call API directly

### Modal Control
- Modals controlled by orchestrator state
- Modal state passed to context
- Components open/close modals via context

---

## ✅ SUCCESS CRITERIA

1. **Architecture**: Modular structure with clear separation of concerns
2. **API Integration**: Real API calls (backend endpoints need to be created)
3. **Type Safety**: Full TypeScript coverage
4. **Component Decomposition**: All tabs and modals extracted
5. **State Management**: All business logic in hooks
6. **Build**: Successful compilation
7. **Functionality**: All features working (after backend endpoints created)

---

**Last Updated**: 2025-01-27  
**Status**: Planning Complete, Extraction In Progress
