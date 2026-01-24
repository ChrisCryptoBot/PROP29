# INCIDENT LOG MODULE - REFACTORING PLAN

**Date**: 2025-01-27  
**Phase**: Phase 3 - Architecture Refactor  
**Goal**: Split 3,386-line monolith into Gold Standard structure, replace document.getElementById with controlled inputs, implement real API integration  

---

## 📋 CURRENT STATE ANALYSIS

### File Structure
- **Monolithic file**: `frontend/src/pages/modules/IncidentLogModule.tsx` (3,386 lines)
- **No separation of concerns**: UI, state, business logic all mixed
- **No API service**: All operations use mock data with `setTimeout`
- **Anti-patterns**: `document.getElementById` for form handling
- **No context/hooks pattern**: All state in component

### Tabs Identified
1. **Overview** (`overview`) - Main dashboard with search/filters/incident list
2. **Incident Management** (`incidents`) - Detailed incident list with actions
3. **Trend Analysis** (`trends`) - Charts and analytics
4. **Predictive Insights** (`predictions`) - AI predictions and patterns
5. **Settings** (`settings`) - Module configuration

### Modals Identified
1. **CreateIncidentModal** - Create new incident form
2. **EditIncidentModal** - Edit existing incident form
3. **IncidentDetailsModal** - View incident details
4. **TimelineModal** - View incident timeline
5. **EvidenceModal** - Upload/view evidence
6. **RelatedIncidentsModal** - View related incidents
7. **EscalationModal** - Escalate incident
8. **ReportModal** - Generate reports
9. **QRCodeModal** - Generate QR codes
10. **AdvancedFiltersModal** - Advanced filtering

### Backend Endpoints (Phase 1 Secured)
1. `GET /api/incidents` - List incidents (with filters)
2. `POST /api/incidents` - Create incident
3. `GET /api/incidents/{id}` - Get single incident
4. `PUT /api/incidents/{id}` - Update incident
5. `DELETE /api/incidents/{id}` - Delete incident (admin only)
6. `POST /api/incidents/ai-classify` - AI classification (already used)
7. `POST /api/incidents/emergency-alert` - Create emergency alert

---

## 🎯 TARGET STRUCTURE

```
frontend/src/features/incident-log/
├── IncidentLogOrchestrator.tsx      # Main orchestrator (~200 lines)
├── context/
│   └── IncidentLogContext.tsx       # Context provider and hook
├── hooks/
│   └── useIncidentLogState.ts       # All business logic (~600-800 lines)
├── services/
│   └── IncidentService.ts           # API service layer (NEW)
├── components/
│   ├── tabs/
│   │   ├── OverviewTab.tsx
│   │   ├── IncidentsTab.tsx
│   │   ├── TrendsTab.tsx
│   │   ├── PredictionsTab.tsx
│   │   ├── SettingsTab.tsx
│   │   └── index.ts
│   ├── modals/
│   │   ├── CreateIncidentModal.tsx
│   │   ├── EditIncidentModal.tsx
│   │   ├── IncidentDetailsModal.tsx
│   │   ├── TimelineModal.tsx
│   │   ├── EvidenceModal.tsx
│   │   ├── RelatedIncidentsModal.tsx
│   │   ├── EscalationModal.tsx
│   │   ├── ReportModal.tsx
│   │   ├── QRCodeModal.tsx
│   │   ├── AdvancedFiltersModal.tsx
│   │   └── index.ts
│   ├── filters/
│   │   ├── IncidentFilters.tsx
│   │   └── index.ts
│   └── shared/
│       ├── IncidentCard.tsx
│       ├── IncidentList.tsx
│       └── index.ts
├── types/
│   └── incident-log.types.ts        # Type definitions (NEW)
├── routes/
│   └── IncidentLogRoutes.tsx        # Route definitions
├── index.ts                          # Barrel exports
└── REFACTOR_PROGRESS.md              # Progress tracking
```

---

## 📝 REFACTORING PHASES

### PHASE 1: Foundation Setup ✅
1. ✅ Create folder structure
2. ⏳ Create type definitions (`types/incident-log.types.ts`)
3. ⏳ Create API service (`services/IncidentService.ts`)
4. ⏳ Create context (`context/IncidentLogContext.tsx`)
5. ⏳ Create state hook (`hooks/useIncidentLogState.ts`)

### PHASE 2: Component Extraction
1. Extract tab components (5 tabs)
2. Extract modal components (10 modals)
3. Extract filter components
4. Extract shared components

### PHASE 3: Form Refactoring
1. Replace `document.getElementById` in CreateIncidentModal
2. Replace `document.getElementById` in EditIncidentModal
3. Replace `document.getElementById` in EscalationModal
4. Replace `document.getElementById` in AdvancedFiltersModal
5. Replace `document.getElementById` in ReportModal

### PHASE 4: API Integration
1. Wire up GET /api/incidents in state hook
2. Wire up POST /api/incidents in state hook
3. Wire up PUT /api/incidents/{id} in state hook
4. Wire up DELETE /api/incidents/{id} in state hook
5. Wire up POST /api/incidents/ai-classify
6. Wire up POST /api/incidents/emergency-alert

### PHASE 5: Orchestrator & Integration
1. Create IncidentLogOrchestrator.tsx
2. Create routes file
3. Update module routing
4. Test all workflows
5. Remove old monolithic file

---

## 🔑 KEY CHANGES

### 1. API Service Layer (NEW)
- **File**: `services/IncidentService.ts`
- **Purpose**: Centralized API calls using ApiService
- **Methods**:
  - `getIncidents(params?)` - List with filters
  - `getIncident(id)` - Get single
  - `createIncident(data)` - Create new
  - `updateIncident(id, data)` - Update existing
  - `deleteIncident(id)` - Delete (admin)
  - `getAIClassification(data)` - AI classification
  - `createEmergencyAlert(data)` - Emergency alert

### 2. Controlled Form Inputs
- **Before**: `document.getElementById('incident-title')?.value`
- **After**: `const [title, setTitle] = useState('')` + `<input value={title} onChange={(e) => setTitle(e.target.value)} />`
- **Benefits**: Proper React patterns, validation, state management

### 3. Context Pattern
- **Provider**: Wraps entire module, provides state/actions
- **Hook**: `useIncidentLogContext()` - Used by all components
- **Benefits**: No prop drilling, centralized state

### 4. State Hook Pattern
- **File**: `hooks/useIncidentLogState.ts`
- **Contains**: ALL business logic (moved from component)
- **Returns**: Data, loading states, action functions
- **Benefits**: Testable, reusable, separated from UI

---

## 🎯 IMPLEMENTATION ORDER

1. **Types** (Foundation) → 2. **Service** (Foundation) → 3. **Context** (Foundation) → 4. **State Hook** (Foundation) → 5. **Orchestrator** (Skeleton) → 6. **Components** (Extract & Refactor) → 7. **Integration** (Wire up) → 8. **Testing** (Verify)

---

## ✅ SUCCESS CRITERIA

- [ ] All code in Gold Standard structure
- [ ] Zero `document.getElementById` calls
- [ ] All forms use controlled inputs
- [ ] All API endpoints integrated
- [ ] Context pattern implemented
- [ ] State hook contains all business logic
- [ ] Components are pure UI (no business logic)
- [ ] Orchestrator is < 300 lines
- [ ] All tabs extracted
- [ ] All modals extracted
- [ ] Old monolithic file removed
- [ ] Build succeeds
- [ ] All workflows tested

---

## 📊 ESTIMATED EFFORT

- **Types**: 1 hour
- **Service**: 2-3 hours
- **Context**: 1 hour
- **State Hook**: 4-6 hours
- **Component Extraction**: 8-12 hours
- **Form Refactoring**: 4-6 hours
- **API Integration**: 4-6 hours
- **Testing & Fixes**: 4-6 hours

**Total**: ~28-42 hours

---

**Status**: 🟡 IN PROGRESS - Phase 1 Foundation Setup
