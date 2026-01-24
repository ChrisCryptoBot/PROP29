# Security Operations Center — Production Readiness Audit

**Module:** `frontend/src/features/security-operations-center`  
**Date:** January 2026  
**Context:** Manager/admin desktop interface (MSO downloadable Electron app); camera monitoring, recordings, evidence, analytics. Future: ingest from mobile agents, hardware (cameras, NVR).  
**Reference:** UI-GOLDSTANDARD.md, Patrol Command Center (Gold Standard).

---

## I. Overall Production Readiness Score: **78%** (was 62%)

**Status:** 🟡 **NEEDS WORK** — Backend stubs added; offline guard + rollback for toggles; GlobalRefresh + shortcut; page headers; Evidence modal → global Modal. Recordings/evidence/analytics/settings still stubbed; evidence actions local-only; report issue no-op; hardware ingest not implemented.

**Breakdown:**

| Area | Score | Notes |
|------|-------|--------|
| Architecture & modularity | 82% | Hook + context; tabs split; service layer; not monolithic |
| UI Gold Standard | 58% | Cards/buttons use mixed patterns; custom modal; no Data-as-of; jargon |
| Workflow & data flow | 50% | Cameras CRUD + metrics work; recordings/evidence/analytics unimplemented |
| Offline & hardware | 40% | No offline guard on toggle; no ingest API; no last-known-good handling |
| Safety & fail-safes | 48% | Optimistic toggle without rollback; report issue no-op |
| Observability & security | 65% | Logger used; no audit trail for evidence/camera actions |

---

## II. Key Findings

### ✅ Strengths

1. **Architecture:** `useSecurityOperationsState` + `SecurityOperationsContext`; tabs (Live, Recordings, Evidence, Analytics, Settings, Provisioning); dedicated service.
2. **Cameras:** Backend CRUD, metrics, stream, last-image; frontend create/update/delete, toggle recording/motion.
3. **Roles:** `canManageCameras`, `canManageEvidence`, `canUpdateSettings` from user roles.
4. **Live View:** Filters (All/Online/Offline/Maintenance), HLS stream, last-known image fallback, URL `?cameraId=` support.

### ❌ Incomplete or Buggy

1. **Recordings / Evidence / Analytics / Settings APIs missing:** Backend exposes only `/security-operations/cameras` and `/metrics`. Frontend calls `/recordings`, `/evidence`, `/analytics`, `/settings` — all 404. Service returns `[]` or `null` on error. Recordings and evidence always empty; analytics and settings use defaults only.
2. **Evidence actions local-only:** `markEvidenceReviewed` and `archiveEvidence` update only local state. No API; state lost on refresh.
3. **Report camera issue no-op:** `reportCameraIssue` shows toast “Issue reported to maintenance” but performs no API or side effect.
4. **Toggle recording/motion:** Optimistic update then `updateCamera`. No offline guard (offline cameras can be toggled in UI). No rollback if `updateCamera` fails; UI stays updated.
5. **No GlobalRefresh:** Module does not register with `GlobalRefreshContext`; no Ctrl+Shift+R or “Data as of” / “Refreshed X ago.”
6. **EvidenceDetailsModal:** Custom overlay `z-50` (below sticky tabs); has X close. Gold Standard: use `Modal`, `z-[100]`, no X.
7. **Recordings Download:** Button has no handler; no download behavior.
8. **Page headers:** Tabs lack required “title + subtitle” block at top (Gold Standard § Page Header Layout).

---

## III. Workflow & Logic Gaps

- **Recordings:** No backend → empty list; Download does nothing. No workflow for “ingest from NVR/hardware.”
- **Evidence:** No backend → empty list. Review/archive are local-only; no chain-of-custody persistence.
- **Analytics:** No backend → default counts (0, N/A). No link to real camera or motion data.
- **Settings:** No backend; “Save” calls non-existent PUT. Settings never persist.
- **Hardware ingest:** No dedicated ingest API or device binding for future cameras/mobile agents.
- **Offline / last-known-good:** Toggle recording/motion allowed on offline cameras; no “Last known good” or sync-status UX.

---

## IV. Hardware & Fail-Safe Risks

| Scenario | Current behaviour | Risk |
|----------|-------------------|------|
| Toggle recording on offline camera | UI updates; `updateCamera` fails; no rollback | 🟡 UI/backend mismatch |
| Report camera issue | Toast only; no API | 🟡 No audit or repair flow |
| Evidence review/archive | Local state only | 🔴 Lost on refresh; no audit |
| Recordings/evidence fetch | 404 → empty | 🟡 Silent failure |
| Two managers toggle same camera | Last write wins; no optimistic locking | 🟡 Overwrites |
| Camera stream URL down | HLS error or redirect; no explicit “unavailable” UX | 🟡 Opacity |

**Deterministic concerns:** Optimistic toggle without rollback; no idempotency or versioning for camera updates.

---

## V. Tab-by-Tab Breakdown

### Live View

- **Name:** Live View  
- **Readiness Score:** 70  
- **Status:** Needs Work  
- **Specific Issues:**
  - No “Data as of” / “Refreshed X ago” or page header (title + subtitle).
  - Metric cards use `glass-card`, `ring-1`, `shadow-lg`; Gold Standard prefers `bg-slate-900/50 backdrop-blur-xl`, Integrated Glass Icon, `border-white/5`, `text-[9px]` labels, `text-3xl` values.
  - Filter buttons use `shadow-lg shadow-blue-500/20` when selected; Gold Standard: no colored CTA shadows.
  - Toggle recording/motion allowed when camera offline; no rollback on API failure.
  - Empty state copy uses jargon (“SURVEILLANCE REGISTRY OFFLINE”, “tactical filters”).
- **Strengths:** Metrics grid, camera grid, filters, HLS + last-known image, role-based actions, `?cameraId=` support.

### Recordings

- **Name:** Recordings  
- **Readiness Score:** 40  
- **Status:** Blocked  
- **Specific Issues:**
  - No backend `/recordings`; list always empty.
  - Download button has no `onClick` / handler.
  - No page header.
  - Card styling diverges from Gold Standard.
- **Strengths:** Search, clear, layout.

### Evidence Management

- **Name:** Evidence Management  
- **Status:** Blocked  
- **Readiness Score:** 42  
- **Specific Issues:**
  - No backend `/evidence`; list always empty.
  - `markEvidenceReviewed` / `archiveEvidence` local-only; no persistence.
  - No page header.
- **Strengths:** Status filters, modal trigger, role-based buttons.

### Analytics

- **Name:** Analytics  
- **Readiness Score:** 45  
- **Status:** Blocked  
- **Specific Issues:**
  - No backend `/analytics`; uses default `AnalyticsData` (0, N/A).
  - No page header.
  - Icon tiles use `ring-1`, `shadow-xl`; Gold Standard Integrated Glass Icon.
- **Strengths:** Four metric blocks, loading state.

### Settings

- **Name:** Settings  
- **Readiness Score:** 48  
- **Status:** Blocked  
- **Specific Issues:**
  - No backend GET/PUT `/settings`; save fails silently (404).
  - No page header.
  - Save button uses `shadow-lg shadow-blue-500/20`; Gold Standard: no colored CTA shadows.
- **Strengths:** Form layout, toggles, role-based read-only.

### Provisioning

- **Name:** Provisioning  
- **Readiness Score:** 72  
- **Status:** Needs Work  
- **Specific Issues:**
  - No page header.
  - Add Camera submit `shadow-lg shadow-blue-500/20`; remove button styling.
  - Form labels: Gold Standard `block text-xs font-bold ... uppercase tracking-wider`; inputs standard pattern.
- **Strengths:** Create camera form, camera list, delete, role guard.

---

## VI. Observability & Security

- **Logger:** Used in hook and service for refresh, CRUD, errors.
- **Audit:** No `recordAuditEntry` or equivalent for camera provisioning, evidence actions, or report issue.
- **XSS:** User-controlled content (camera name, location, evidence title, tags) rendered in UI; no `dangerouslySetInnerHTML` in reviewed paths. Sanitization not explicit.
- **Hardware attribution:** No `device_id` or source in types or APIs.

---

## VII. Remediation & Execution Plan

### Priority 1 — Blocking

1. **Backend stubs for recordings, evidence, analytics, settings:** Add GET (and PUT for settings) under `/security-operations` returning empty/default data so frontend does not 404. Enables “Data as of” and saves without breaking.
2. **Offline guard for toggle recording/motion:** If `camera.status === 'offline'`, disable toggle and show message (mirror Access Control “Hardware Disconnected”).
3. **Rollback on toggle failure:** If `updateCamera` fails after optimistic update, revert `isRecording` / `motionDetectionEnabled` and show error toast.
4. **GlobalRefresh + shortcut:** Register SOC with `GlobalRefreshContext`; refresh cameras, recordings, evidence, metrics, analytics. Add Ctrl+Shift+R in orchestrator. Add “Data as of … · Refreshed X ago” on Live View (and optionally other tabs).

### Priority 2 — UI & UX

5. **Page headers:** Add “title + subtitle” block (`flex justify-between items-end mb-8`) at top of each tab per Gold Standard.
6. **Metric cards (Live, Analytics):** Align with Patrol metric cards — `bg-slate-900/50 backdrop-blur-xl`, `border-white/5`, Integrated Glass Icon, `text-[9px]` labels, `text-3xl` values, `text-[10px]` subtext.
7. **CTAs:** Remove `shadow-blue-500/20` / `shadow-red-500/20` from filter, Save, Add Camera, etc. Use `variant="glass"` or outline + semantic hover.
8. **EvidenceDetailsModal:** Switch to global `Modal`; `z-[100]`; remove X close; use Cancel/Close in footer only.
9. **Recordings Download:** Wire Download to a handler (e.g. open stream URL or placeholder “Export” until backend supports download).

### Priority 3 — Backlog

10. **Evidence API:** Implement backend evidence CRUD + review/archive; persist `markEvidenceReviewed` / `archiveEvidence`.
11. **Report camera issue:** Persist via API (ticket/maintenance) or audit log.
12. **Hardware ingest:** Design ingest API for future camera/NVR and mobile agents; `device_id` / source in types and APIs.
13. **Optimistic locking:** Add `version` (or similar) for camera updates; 409 handling.

---

## VIII. Modularization

- **Current:** Single `useSecurityOperationsState` hook; logic grouped by domain (cameras, recordings, evidence, etc.). Tabs and service are split.
- **Recommendation:** No immediate split. If the hook grows, consider extracting `useCameraActions`, `useEvidenceActions`, `useSettings` consumed by `useSecurityOperationsState`.

---

## IX. Build & Finalize

- `npm run build` (frontend): **PASSED**
- Backend security-operations routes import: **OK**
- **Status:** Priority 1–2 fixes applied. Ready for manual verification.

---

## X. Applied (This Pass)

1. **Backend stubs:** `GET /recordings`, `GET /evidence`, `GET /analytics`, `GET /settings`, `PUT /settings` added; return `{ data: [] }` or defaults so frontend no longer 404s.
2. **Offline guard:** Toggle recording/motion disabled when `camera.status === 'offline'`; clear error toast.
3. **Rollback on toggle failure:** Optimistic update reverted if `updateCamera` fails; `updateCamera` rethrows after toast.
4. **GlobalRefresh + shortcut:** SOC registers with `GlobalRefreshContext`; refreshes cameras, recordings, evidence, metrics, analytics, settings. Ctrl+Shift+R triggers global refresh.
5. **Live View “Data as of”:** Page header with “Data as of … · Refreshed X ago” using `lastRefreshedAt`.
6. **Page headers:** Every tab has “title + subtitle” block (`flex justify-between items-end mb-8`) per Gold Standard.
7. **Live View metric cards:** Aligned with Patrol (e.g. `bg-slate-900/50`, `border-white/5`, Integrated Glass Icon, `text-[9px]` labels, `text-3xl` values). Filter buttons: removed `shadow-blue-500/20`; use `variant="glass"` / outline.
8. **Empty state copy:** “No camera feeds” / “No cameras match the current filter…” (reduced jargon).
9. **EvidenceDetailsModal:** Switched to global `Modal`; `z-[100]`; no X close; footer Close only; flatter layout.
10. **Live View camera labels:** “Location Zone” → “Location”, “IP Signature” → “IP”, “Telemetry Sync” → “Status” (jargon reduced).
11. **Recordings Download:** Wired to `onClick`; shows toast “Export not yet available. Backend download coming soon.” and `stopPropagation` so card click is unaffected.

---

*Audit complete. Priority 1–2 remediation applied. Priority 3 backlog remains.*
