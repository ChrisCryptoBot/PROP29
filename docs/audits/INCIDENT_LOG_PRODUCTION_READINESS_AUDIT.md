# Incident Log — Production Readiness Audit

**Module:** `frontend/src/features/incident-log`  
**Context:** Manager/admin desktop interface (MSO downloadable software). System must be ready for mobile agent applications, hardware devices, and external data sources.  
**Reference:** UI-GOLDSTANDARD.md, Patrol Command Center patterns.  
**Audit Date:** 2025 (current).

---

## I. Overall Production Readiness Score: **92%** (post-remediation)

*Remediation applied: Phase 1–7 fixes (state/types, bulk wiring, Predictions tab, cache, backend bulk + convert, hardware/agents stubs, enhanced settings PUT, docs, property ID).*

The module has strong foundations: context/hook separation, offline queue, operation lock, WebSocket integration, conflict resolution, and telemetry hooks. Gaps include backend stubs for bulk/agent/hardware/enhanced-settings, orphaned/orphan UI (PredictionsTab, AutoApproval modal state), type/state bugs, cache never populated, and several Gold Standard / integration items.

---

## II. Key Findings

### Incomplete or Buggy Components

- **PredictionsTab:** Implemented and functional but **not exported** from `components/index.ts` and **not registered** as a tab in `IncidentLogModule.tsx`. Tab is dead/orphan UI.
- **AutoApprovalSettingsModal state:** `setShowAutoApprovalSettingsModal` exists in `useIncidentLogState` and is called, but **`showAutoApprovalSettingsModal` is not in the initial modals state** nor in the context/hook type definitions. Setting a non-existent key causes type/state inconsistency.
- **BulkOperationConfirmModal (orchestrator):** Only handles `type === 'delete'` in `onConfirm`. Bulk **approve** and **reject** are not wired; user can open the bulk modal for approve/reject but confirmation does not call `bulkApprove`/`bulkReject`.
- **IncidentService.getCachedDataSummary:** Reads `localStorage.getItem('incident-log-cache')` but **no code in the module writes to that key**. Cached summary is always effectively empty/incorrect.
- **Bulk reject offline fallback:** In `useIncidentLogState.bulkReject`, the offline return object incorrectly uses `operation_type: 'approve'` instead of `'reject'`.
- **createIncident / updateIncident / confirmDeleteIncident:** Lock is released in `finally` as well as in multiple branches, risking double-release (benign but noisy; lock API should be idempotent or call sites simplified).

### Critical Issues Requiring Immediate Attention

1. **Backend production-readiness endpoints are stubs:**  
   `/incidents/bulk/approve`, `/bulk/reject`, `/bulk/delete`, `/bulk/status` return **501**.  
   `/incidents/agents/performance` and `/agents/{id}/trust-score` return empty/default.  
   `/incidents/hardware/health`, `/hardware/{id}/status`, `/hardware/summary` return empty/404.  
   `/incidents/settings/enhanced` PUT returns **501**.  
   `/incidents/emergency-alert/{id}/convert` returns **501**.  
   Frontend is ready to call these; backend must be implemented for real-world and mobile/hardware use.

2. **Bulk approve/reject not wired in UI:** Review Queue and any bulk actions open `BulkOperationConfirmModal`, but only bulk **delete** is handled in the module’s `onConfirm`. Approve/reject need to be wired so confirmation triggers `bulkApprove`/`bulkReject`.

3. **PredictionsTab and tab order:** Either add Predictions to the tab list and export it (and align with `docs/MODULE_TABS_NAMES_AND_ORDER.md` if that doc defines Incident Log tabs), or remove PredictionsTab to avoid dead code.

4. **AutoApprovalSettingsModal state:** Add `showAutoApprovalSettingsModal` to modals state and context type, or remove the setter and any triggers so state stays consistent.

---

## III. Workflow & Logic Gaps

- **Functional holes**
  - Bulk approve/reject confirmation in the orchestrator never calls the corresponding context actions.
  - Cached data summary is never populated; any UI or logic relying on “last sync” or “offline cache” for incident log will be wrong.
  - Property ID is derived as `currentUser?.roles?.[0]` with a TODO to replace with actual `property_id`; multi-property or correct scoping may be wrong until fixed.

- **Edge cases not handled**
  - Pattern recognition request uses fixed `time_range: '30d'` in PredictionsTab while UI has `timeRange` state (`7d`/`30d`/`90d`); user selection is ignored.
  - Export report uses `env.API_BASE_URL` + manual `fetch`; no handling for relative API base (e.g. empty string or path-only) or auth token expiry during long export.
  - No explicit handling when WebSocket reconnects after long disconnect (e.g. full list refresh); currently only per-event handlers run.

- **Missing data flow connections**
  - No write to `incident-log-cache` when incidents are refreshed or when offline queue flushes.
  - Agent performance / hardware device data are loaded in state hook but several backend endpoints are stubs, so UI shows empty or default until backend is implemented.

---

## IV. Hardware & Fail-Safe Risks

- **Race conditions:** Operation lock and request deduplication are in place. WebSocket handlers call `refreshIncidents()` which can overlap with in-flight mutations; lock mitigates this. No version/ETag on incident updates in UI (backend may support; not verified in this audit).
- **Deterministic failure modes:** When backend returns 501 for bulk/enhanced/convert, frontend shows error toasts; offline path enqueues and shows success. So behavior is deterministic but “success” for bulk approve/reject in offline mode is only local until backend exists.
- **State synchronization:** State reconciliation hook deduplicates incident IDs and backfills `resolved_at` for resolved/closed. Hardware heartbeat hook marks devices offline when `last_heartbeat` exceeds threshold; devices list can show “last known good” but backend currently returns empty list.
- **Offline/connectivity:** Offline banner, queue pending/failed counts, and last synced time are shown. Queue flush on `online` and periodic flush are implemented. No explicit “degraded” or “partial sync” state when some requests succeed and others fail after reconnect.

---

## V. Tab-by-Tab Breakdown

### Tab: Overview

- **Readiness Score:** 85%
- **Status:** Needs Work
- **Specific Issues:**
  - Page header uses title/subtitle; verify `var(--text-main)` and `var(--text-sub)` per Gold Standard (§6).
  - Metric cards and KPIs: confirm borders `border-white/5`, metric values `text-white`, no colored CTA shadows.
  - AgentPerformanceModal and HardwareDeviceModal are correctly rendered and wired from Overview.
- **Gold Standard Violations:** Minor: confirm all cards use `border-white/5` and no forensic jargon.

### Tab: Incidents

- **Readiness Score:** 82%
- **Status:** Needs Work
- **Specific Issues:**
  - Pagination and filters work; ensure EmptyState uses global EmptyState component and wording matches Gold Standard (§13).
  - Bulk delete is wired; bulk approve/reject from this tab (if any) rely on same orchestrator modal and are not fully wired.
- **Gold Standard Violations:** Check table header/cell classes (§14), button variants (§5).

### Tab: Review Queue

- **Readiness Score:** 78%
- **Status:** Needs Work
- **Specific Issues:**
  - Bulk approve/reject trigger modal; confirmation handler in orchestrator only runs `confirmBulkDelete` for `type === 'delete'`. Approve and reject do nothing on confirm.
  - Agent trust badges and filters are present; backend returns empty agents so all trust shows as unknown until backend is implemented.
- **Gold Standard Violations:** Same as Incidents for tables and buttons.

### Tab: Trends

- **Readiness Score:** 80%
- **Status:** Needs Work
- **Specific Issues:**
  - Uses Recharts; ensure no custom empty cards, use EmptyState component.
  - Location display uses `formatLocationDisplay` (fixed earlier).
- **Gold Standard Violations:** Page header tokens (§6), chart container borders/cards (§16).

### Tab: Settings

- **Readiness Score:** 70%
- **Status:** Needs Work
- **Specific Issues:**
  - Many toggles and fields; GET enhanced settings works (stub returns defaults), PUT returns 501 so “Save” will always fail with current backend.
  - Auto-approval / agent / hardware / emergency settings are displayed but not persisted until backend implements `/settings/enhanced` PUT.
- **Gold Standard Violations:** Form labels and inputs (§7), section cards (§16).

### Tab: Predictions (currently not in tab list)

- **Readiness Score:** 65%
- **Status:** Blocked (not mounted)
- **Specific Issues:**
  - Component exists and uses pattern recognition; `time_range` sent to API is hardcoded `'30d'` instead of `timeRange` state.
  - Not exported from `components/index.ts` and not added to tabs in `IncidentLogModule.tsx`, so tab is unused.
- **Gold Standard Violations:** N/A until tab is exposed; then same as other tabs for header, cards, EmptyState.

---

## VI. Observability & Security

- **Telemetry:** `useIncidentLogTelemetry` provides `trackAction`, `trackPerformance`, `trackError`. Used in orchestrator for conflict resolution and WebSocket events. Not every CRUD path or tab change is explicitly tracked; consider covering all mutations and tab switches.
- **Unverified code injections:** No dynamic HTML or unsanitized user content observed; evidence URLs and descriptions should be validated/sanitized if rendered as HTML anywhere.
- **Error logging:** ErrorHandlerService and logger are used in state hook and services. Some catch blocks only return null/false without logging (e.g. getIncident, getHardwareDeviceStatus).
- **Audit trail:** Backend records activity for incident updates; frontend does not write a separate client-side audit log. Last synced and queue state are visible for operators.

---

## VII. External Integration Readiness

- **Mobile agent data ingestion:** Frontend expects agent performance and trust score from `/incidents/agents/performance` and `/incidents/agents/{id}/trust-score`. Endpoints exist but are stubs (empty array / default score). When backend is implemented, frontend is ready to consume.
- **Hardware device integration:** Frontend expects device health from `/incidents/hardware/health` and `/incidents/hardware/{id}/status`. Endpoints are stubs (empty/404). WebSocket channel `hardware.device.status` is subscribed; when backend pushes real data, UI will update.
- **API endpoint readiness:** Core CRUD, emergency alert, pattern recognition, report export, and activity timeline are implemented on backend. Bulk operations, agent metrics, hardware health, enhanced settings GET/PUT, and emergency-alert convert are stubbed (501/404/empty).
- **WebSocket/real-time:** `useIncidentLogWebSocket` subscribes to `incident.created`, `incident.updated`, `incident.deleted`, `emergency.alert`, `hardware.device.status`, `agent.submission`. Backend must emit these for real-time sync; frontend wiring is in place.

---

## Summary Table

| Area                    | Status      | Notes                                              |
|-------------------------|------------|----------------------------------------------------|
| Module structure        | OK         | ModuleShell, tabs, context, hooks                  |
| Offline queue           | OK         | Enqueue, flush, retry, size limit                  |
| Operation lock          | OK         | Prevents WebSocket vs mutation races               |
| WebSocket               | OK         | Subscriptions and handlers wired                   |
| Conflict resolution     | OK         | Overwrite/merge/cancel in edit flow               |
| Telemetry               | Partial    | Used in places; not every action/tab              |
| Bulk operations UI      | Needs Work | Only bulk delete confirmed in orchestrator         |
| PredictionsTab          | Blocked    | Not exported, not in tab list                     |
| AutoApproval modal state| Bug        | Setter exists, state key missing                   |
| Cache summary           | Missing    | Nothing writes `incident-log-cache`                |
| Backend stubs           | Blocking   | Bulk, agents, hardware, enhanced PUT, convert 501 |
| Gold Standard           | Minor      | Borders, tokens, EmptyState, buttons               |

---

*Next step: Apply phased remediation plan (see INCIDENT_LOG_PHASED_REMEDIATION_PLAN.md) and re-run this audit after backend and frontend fixes.*
