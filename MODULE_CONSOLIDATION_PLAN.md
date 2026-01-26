# Module Consolidation Plan

**Date:** 2026-01-26  
**Status:** 🚧 In Progress  
**Goal:** Clean, modular codebase with logical module groupings

---

## Consolidation Tasks

### 1. ✅ IoT Environmental + Sound Monitoring → Unified IoT Monitoring
**Status:** In Progress

**Actions:**
- [x] Create unified types (`iot-monitoring.types.ts`)
- [ ] Create unified context (`IoTMonitoringContext.tsx`)
- [ ] Create unified hook (`useIoTMonitoringState.ts`)
- [ ] Create unified orchestrator with tabs:
  - Overview (combined dashboard)
  - Environmental Sensors
  - Sound Monitoring
  - Alerts (unified)
  - Analytics (combined)
  - Settings (unified)
- [ ] Migrate components from both modules
- [ ] Update routes in `App.tsx`
- [ ] Update sidebar
- [ ] Update backend endpoints (if needed)
- [ ] Delete obsolete modules

---

### 2. ⏳ Visitor Security + Banned Individuals Integration
**Status:** Pending

**Actions:**
- [ ] Add banned individual check API call to Visitor Security check-in flow
- [ ] Display alert if visitor matches watchlist
- [ ] Add link to banned individuals module from visitor details
- [ ] Update Visitor Security service to include banned check
- [ ] Add UI indicators for banned matches

---

### 3. ⏳ Lost & Found + Packages → Unified Property Items
**Status:** Pending

**Actions:**
- [ ] Create unified types (`property-items.types.ts`)
- [ ] Create unified context (`PropertyItemsContext.tsx`)
- [ ] Create unified hook (`usePropertyItemsState.ts`)
- [ ] Create unified orchestrator with tabs:
  - Overview (combined dashboard)
  - Lost & Found Items
  - Packages
  - Analytics (combined)
  - Settings (unified)
- [ ] Migrate components from both modules
- [ ] Update routes in `App.tsx`
- [ ] Update sidebar
- [ ] Update backend endpoints (if needed)
- [ ] Delete obsolete modules

---

## Files to Update

### Frontend Routes (`App.tsx`)
- Remove: `/modules/iot-environmental`
- Remove: `/modules/sound-monitoring`
- Add: `/modules/iot-monitoring`
- Remove: `/modules/lost-and-found`
- Remove: `/modules/packages`
- Add: `/modules/property-items`

### Sidebar (`Sidebar.tsx`)
- Remove: IoT Environmental
- Remove: Sound Monitoring
- Add: IoT Monitoring
- Remove: Lost & Found
- Remove: Packages
- Add: Property Items

### Backend (`main.py`)
- Review endpoint consolidation needs
- Update route imports if needed

---

## Cleanup Tasks

### Delete After Consolidation:
- `frontend/src/features/iot-environmental/` (entire directory)
- `frontend/src/features/sound-monitoring/` (entire directory)
- `frontend/src/pages/modules/IoTEnvironmental.tsx`
- `frontend/src/pages/modules/SoundMonitoring.tsx`
- `frontend/src/features/lost-and-found/` (after consolidation)
- `frontend/src/features/packages/` (after consolidation)
- `frontend/src/pages/modules/LostAndFound.tsx`
- `frontend/src/pages/modules/Packages.tsx`

---

## Testing Checklist

- [ ] All routes work correctly
- [ ] Sidebar navigation works
- [ ] All tabs render correctly
- [ ] Data loads correctly
- [ ] No console errors
- [ ] TypeScript compiles
- [ ] Build succeeds

---

## Notes

- Preserve all existing functionality
- Maintain Gold Standard architecture
- Ensure RBAC is preserved
- Keep all API integrations working
- Update documentation as needed
