# Incident Log — Phased Remediation Plan

This plan addresses every finding from **INCIDENT_LOG_PRODUCTION_READINESS_AUDIT.md** so the module is fully ready for deployment, real-world use, mobile agents, hardware plug-and-play, external data sources, and clean future development by third-party engineers.

**Remediation executed:** Phases 1–8 have been applied. See commit history and `frontend/src/features/incident-log/INTEGRATION.md` for integration points.

---

## Phase 1: Critical State & Type Fixes (Frontend Only)

**Goal:** Fix bugs that cause inconsistent state or wrong behavior without changing backend.

1. **Add `showAutoApprovalSettingsModal` to modals state and types**
   - In `useIncidentLogState.ts`: Add `showAutoApprovalSettingsModal: false` to the initial `modals` state object.
   - In `UseIncidentLogStateReturn` and `IncidentLogContextValue`: Add `showAutoApprovalSettingsModal: boolean` to the `modals` type and add `setShowAutoApprovalSettingsModal: (show: boolean) => void` to the context type (if not already present).
   - Ensure any Settings or other tab that opens AutoApprovalSettingsModal uses this state (or add the modal to the orchestrator and wire it).

2. **Wire bulk approve/reject in orchestrator**
   - In `IncidentLogModule.tsx`, in the `BulkOperationConfirmModal` `onConfirm` callback: when `modals.bulkOperation?.type === 'approve'`, call `bulkApprove(modals.bulkOperation.incidentIds, reason)` and return the result; when `type === 'reject'`, require `reason` and call `bulkReject(modals.bulkOperation.incidentIds, reason)` and return the result. Handle loading and closing the modal on success/error (match bulk delete behavior).

3. **Fix bulk reject offline return type**
   - In `useIncidentLogState.ts`, in `bulkReject`: in the offline return object, change `operation_type: 'approve'` to `operation_type: 'reject'`.

4. **Optional: Simplify operation lock release**
   - In `useIncidentLogState.ts`, for `createIncident`, `updateIncident`, `confirmDeleteIncident`: ensure lock is released only in a single place (e.g. one `finally` block per operation) and remove redundant `releaseLock` calls in inner branches to avoid double-release and clarify code.

**Exit criteria:** TypeScript builds, no new linter errors, bulk approve/reject confirmation works in UI, offline bulk reject returns correct operation_type.

---

## Phase 2: PredictionsTab and Cache (Frontend Only)

**Goal:** Either integrate Predictions tab and fix cache, or remove dead code.

5. **Decide PredictionsTab fate**
   - **Option A (recommended):** Add “Predictions” tab to `IncidentLogModule.tsx` (tab id `predictions`, label “Predictions”), render `<PredictionsTab />` when `currentTab === 'predictions'`, and export `PredictionsTab` from `components/index.ts`. In PredictionsTab, use `timeRange` state (e.g. `time_range: timeRange`) in the request passed to `getPatternRecognition` instead of hardcoded `'30d'`.
   - **Option B:** Remove PredictionsTab component and any imports; remove from feature if product does not need it.

6. **Fix pattern request time range in PredictionsTab**
   - If keeping PredictionsTab: ensure `getPatternRecognition({ time_range: timeRange, property_id: propertyId, analysis_types: [...] })` uses the tab’s `timeRange` state (e.g. `'7d' | '30d' | '90d'`).

7. **Cache write for incident-log**
   - When incidents are successfully refreshed (e.g. in `refreshIncidents` after `setIncidents(response.data)`), write to `localStorage` under key `incident-log-cache` a JSON object that includes at least `{ incidents: response.data, last_sync: new Date().toISOString() }` (or minimal summary plus last_sync). Optionally, when offline queue flushes and syncs, update `last_sync` in the same cache. Ensure `getCachedDataSummary()` in IncidentService reads this structure so `incidents_count` and `last_sync` are correct.

**Exit criteria:** PredictionsTab is either integrated and time range is correct or removed; cache is written on refresh (and optionally on queue sync); getCachedDataSummary returns meaningful data.

---

## Phase 3: Gold Standard UI Alignment (Frontend Only)

**Goal:** Align all tabs and modals with UI-GOLDSTANDARD.md.

8. **Page headers (all tabs)**
   - Ensure every tab has a page header with: `flex justify-between items-end mb-8`, title `text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter`, subtitle `text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70`. Add or fix last-refreshed indicator where appropriate using `var(--text-sub)` and `aria-live="polite"`.

9. **Borders and tokens**
   - Audit all cards in incident-log: use `border-white/5` (no `border-slate-800` or mixed border tokens). Ensure metric values use `text-white` (not semantic color) unless emphasis is intended per Gold Standard.

10. **Buttons and modals**
    - Header actions: `variant="glass"` where applicable. Modal Cancel: `variant="subtle"`, Save/Create: `variant="primary"`, Delete: `variant="destructive"`. No colored drop shadows on CTAs. All modals use shared `Modal` component, z-index above tabs, draggable per standard.

11. **Empty states**
    - Replace any custom empty blocks with global `EmptyState` component; use standard wording (“No [Resource]”, “No [Resource] Found” + “Clear filters” or “Add first” as appropriate).

12. **Loading spinners**
    - Use standard pattern: `border-blue-500/20 border-t-blue-500`, sizes per §17 (full page 12/4, inline 10/2, button 4/2 or fa-spinner). Use `LoadingSpinner` component where available. No colored glows on spinners.

13. **Terminology**
    - Remove any forensic or overly complex jargon; use simple, technical, actionable language per §2.

**Exit criteria:** Full pass of Universal Module Audit Checklist (UI-GOLDSTANDARD.md) for incident-log; all critical items marked pass.

---

## Phase 4: Backend — Bulk and Emergency Conversion

**Goal:** Replace stubs with real implementations so bulk operations and emergency-alert conversion work.

14. **Bulk approve**
    - Implement `POST /incidents/bulk/approve`: accept `incident_ids`, optional `reason`, optional `property_id`; validate user and property; update incidents (e.g. status to approved or per business rule); return a structure matching frontend `BulkOperationResult` (total, successful, failed, errors, execution_time_ms, executed_by, executed_at).

15. **Bulk reject**
    - Implement `POST /incidents/bulk/reject`: accept `incident_ids`, `reason`, optional `property_id`; validate and update incidents; store rejection reason (e.g. in `source_metadata` or dedicated field); return `BulkOperationResult`.

16. **Bulk delete**
    - Implement `POST /incidents/bulk/delete`: accept `incident_ids`, optional `property_id`; validate and delete; return `BulkOperationResult`. Reuse existing delete permission (e.g. admin).

17. **Bulk status change**
    - Implement `POST /incidents/bulk/status`: accept `incident_ids`, `status`, optional `reason`, optional `property_id`; validate and update status; return `BulkOperationResult`.

18. **Convert emergency alert to incident**
    - Implement `POST /incidents/emergency-alert/{alert_id}/convert`: load alert, create incident from alert + overrides, optionally mark alert as converted; return created incident. Ensure property and permission checks align with existing incident create.

**Exit criteria:** Frontend bulk approve/reject/delete/status and convert-alert flows succeed against backend; errors and partial failures reported in BulkOperationResult.

---

## Phase 5: Backend — Agents and Hardware

**Goal:** Implement agent performance and hardware health endpoints so mobile agents and devices are visible.

19. **Agent performance**
    - Implement `GET /incidents/agents/performance`: optional `agent_id`, `property_id`; return list of `AgentPerformanceMetrics` (or equivalent) from stored data. If no mobile agent system yet, return empty array but keep contract stable.
    - Implement `GET /incidents/agents/{agent_id}/trust-score`: return `{ trust_score, level }` from stored or computed metrics; default only when no data.

20. **Hardware health**
    - Implement `GET /incidents/hardware/health`: optional `property_id`; return list of device health status (from hardware control or incident source_metadata aggregation). If no devices yet, return [].
    - Implement `GET /incidents/hardware/{device_id}/status`: return single device health or 404. Prefer 200 with “unknown”/“offline” over 404 where appropriate for UX.
    - Implement `GET /incidents/hardware/summary`: return counts (total_incidents, by_device_type, by_status, critical_devices) for dashboard; can be derived from incidents and device list.

21. **WebSocket events**
    - Ensure backend emits `incident.created`, `incident.updated`, `incident.deleted`, `emergency.alert`, `hardware.device.status`, `agent.submission` when corresponding events occur so frontend real-time updates work.

**Exit criteria:** Frontend Overview and Review Queue show agent and device data when backend has data; hardware device modal and agent performance modal work with real endpoints.

---

## Phase 6: Backend — Enhanced Settings

**Goal:** Persist enhanced settings so Settings tab “Save” works.

22. **Enhanced settings storage**
    - Define or extend DB/model for enhanced incident settings (agent_settings, hardware_settings, emergency_alert_settings) per property. Map to frontend `EnhancedIncidentSettings` shape.

23. **GET /incidents/settings/enhanced**
    - Return stored settings for property; if none, return defaults (same shape as current stub).

24. **PUT /incidents/settings/enhanced**
    - Accept body matching `EnhancedIncidentSettings`; validate and save by property; return updated settings. Ensure property access and auth align with existing settings endpoints.

**Exit criteria:** Saving in Incident Log Settings tab persists and reloads correctly.

---

## Phase 7: Integration and Documentation

**Goal:** Ready for mobile agents, hardware plug-and-play, and third-party developers.

25. **API contract documentation**
    - Document all incident-log related endpoints (core + bulk + agents + hardware + settings + emergency convert). Include request/response shapes, auth, and which are required for mobile vs hardware vs MSO-only.

26. **Frontend integration points**
    - In code or docs, list: (1) Mobile agent data ingestion: `GET /incidents/agents/performance`, `GET /incidents/agents/{id}/trust-score`, WebSocket `agent.submission`; (2) Hardware: `GET /incidents/hardware/health`, `GET /incidents/hardware/{id}/status`, WebSocket `hardware.device.status`; (3) External data: same incidents API with `source`/metadata; idempotency keys where applicable.

27. **Property ID source**
    - Replace `propertyId = currentUser?.roles?.[0]` with the correct property field from auth/user (e.g. `currentUser?.property_id` or selected property from context) and remove the TODO.

28. **Export report robustness**
    - If API base can be relative: use same base as main API client (e.g. from ApiService) for export URL. Consider retry or user message if export fails (e.g. token expiry); optionally use same auth header as rest of app.

**Exit criteria:** Docs and code clearly describe how mobile and hardware integrate; property ID is correct; export works in all supported environments.

---

## Phase 8: Final Verification and Build

**Goal:** Production build and type-check pass; dev environment runs cleanly.

29. **Stop background test processes** (if any).

30. **Run `npm run build`** in frontend; fix any build errors.

31. **Run `npx tsc --noEmit`** in frontend; fix any type errors.

32. **Restart development environment** and smoke-test: login, open Incident Log, switch tabs, create/edit an incident, trigger bulk approve/reject/delete, open Settings and save, open Overview and check agent/hardware sections (with or without backend data).

33. **Notify** when ready for manual verification and sign-off.

---

## Execution Order Summary

| Phase | Scope        | Dependency        |
|-------|-------------|-------------------|
| 1     | Frontend    | None              |
| 2     | Frontend    | None              |
| 3     | Frontend    | None              |
| 4     | Backend     | None              |
| 5     | Backend     | None              |
| 6     | Backend     | None              |
| 7     | Both + docs | Phases 1–6 done   |
| 8     | Verification| All above         |

After **approval**, proceed with Phase 1 through Phase 8 in order. Report any scope or priority changes (e.g. defer PredictionsTab or hardware) so the plan can be updated.
