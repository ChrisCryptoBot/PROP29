# Security Operations Center - Refactor Plan

**Phase:** REFACTORING_PHASE_1 (Analysis & Planning)
**Module:** Security Operations Center
**Status:** READY FOR REFACTOR

---

## ✅ Refactor Needed?
- [x] Monolithic file (>2000 lines)
- [x] Business logic mixed with UI
- [x] No context/hooks pattern
- [x] No service layer
- [x] Hard to test/maintain

**Decision:** Proceed with Gold Standard refactor.

---

## 📌 Current Inventory

### Tabs/Sections
- Live View
- Recordings
- Evidence Management
- Analytics
- Settings

### Modals
- Camera Details Modal
- Evidence Details Modal
- Chain of Custody Modal
- Settings Modal
- Upload Evidence Modal
- Live Viewer Modal

### Key Business Logic
- Camera CRUD: add/edit/save/delete
- Live viewer management (add/remove cameras)
- Recording view/download/delete
- Evidence upload/view/download/link
- Chain of custody workflows
- Settings save/reset
- Report export
- LocalStorage auth check + redirect

### State Management
- `cameras`, `recordings`, `evidence` arrays
- `metrics`, `analytics`, `settings`, `filters`
- Multiple `showXModal` booleans
- `selectedCamera`, `selectedEvidence`, `selectedRecording`
- UI view mode, search/filter, active tab

---

## 🏗 Target Structure (Gold Standard)
```
frontend/src/features/security-operations-center/
├── SecurityOperationsCenterOrchestrator.tsx
├── context/
│   └── SecurityOperationsCenterContext.tsx
├── hooks/
│   └── useSecurityOperationsCenterState.ts
├── services/
│   └── securityOperationsCenterService.ts
├── types/
│   └── security-operations.types.ts
├── components/
│   ├── tabs/
│   │   ├── LiveViewTab.tsx
│   │   ├── RecordingsTab.tsx
│   │   ├── EvidenceTab.tsx
│   │   ├── AnalyticsTab.tsx
│   │   ├── SettingsTab.tsx
│   │   └── index.ts
│   ├── modals/
│   │   ├── CameraDetailsModal.tsx
│   │   ├── EvidenceDetailsModal.tsx
│   │   ├── ChainOfCustodyModal.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── UploadEvidenceModal.tsx
│   │   ├── LiveViewerModal.tsx
│   │   └── index.ts
│   └── index.ts
└── index.tsx
```

---

## 🧠 Planned Hook Responsibilities
- Centralize all state (cameras, recordings, evidence, settings, analytics)
- RBAC checks (ADMIN / SECURITY_OFFICER)
- Service layer calls (cameras, recordings, evidence, settings)
- Loading/error state handling
- Modal state convergence into context

---

## 🔌 Service Layer (Planned)
Endpoints to implement/validate:
- `GET /security-operations/cameras`
- `POST /security-operations/cameras`
- `PUT /security-operations/cameras/{id}`
- `DELETE /security-operations/cameras/{id}`
- `GET /security-operations/recordings`
- `GET /security-operations/recordings/{id}/download`
- `DELETE /security-operations/recordings/{id}`
- `GET /security-operations/evidence`
- `POST /security-operations/evidence`
- `GET /security-operations/evidence/{id}/download`
- `POST /security-operations/evidence/{id}/link`
- `GET /security-operations/analytics`
- `GET /security-operations/settings`
- `PUT /security-operations/settings`

---

## ✅ Next Actions (REFACTORING_PHASE_2)
1. Create folder structure
2. Add types file
3. Create service layer (API calls)
4. Create state hook + context
5. Extract tabs + modals
6. Orchestrator + routing
7. Update main module entry

---

**Deliverable:** `SECURITY_OPERATIONS_CENTER_REFACTOR_PLAN.md`
