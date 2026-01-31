# Production Readiness Audit: Visitor Security Module

**Context:** Manager/admin desktop interface (MSO downloadable software). System must be ready to ingest data from mobile agent applications (not yet built), hardware devices (not yet configured), and external data sources.

**Auditor Role:** Senior Systems Architect & QA Engineer  
**Reference:** UI-GOLDSTANDARD.md, Patrol Command Center, Access Control, Security Operations Center, Incident Log  
**Audit Date:** 2026

---

## I. Overall Production Readiness Score: **62%**

The module has solid architecture (context/hooks/services, WebSocket, offline queue, heartbeat, telemetry) and aligns with gold-standard patterns in many areas. It is **not production-ready** due to: incomplete conflict resolution, custom modals violating the gold standard, modal actions not using `footer`, inconsistent page headers and design tokens, offline banner z-index and placement, banned-individual UX (window.confirm), inconsistent error handling (logger vs ErrorHandlerService), and missing/wired Settings tab. Backend readiness for mobile/hardware endpoints is assumed partial (stubs or 404); frontend handles failures with defaults but ingestion contracts should be verified.

---

## II. Key Findings

### Incomplete or buggy components
- **Conflict resolution flow:** `ConflictResolutionModal` exists but is **commented out** in the orchestrator with a TODO. `conflictInfo`, `setConflictInfo`, `handleConflictResolution`, and `pendingUpdate` are in context but not wired to the modal. Update conflicts (e.g. 409) set `conflictInfo` in state; users have no UI to resolve.
- **VisitorDetailsModal & EventDetailsModal:** Implemented as **custom modal wrappers** (fixed overlay + custom container) instead of `components/UI/Modal`. They use an **“X” close button**; gold standard requires Cancel-only, no X. Z-index is `z-50`, below sticky tabs (`z-[70]`) and global Modal (`z-[100]`), so these modals can appear **behind** the tabs.
- **RegisterVisitorModal, CreateEventModal:** Action buttons are placed in **content** (`div` with `flex justify-end`) instead of the Modal **`footer`** prop. Gold standard: all modal actions in `footer`, Cancel first then primary.
- **Banned individual override:** Uses **`window.confirm`** for admin override when visitor matches banned list. Code comment: “TODO: Replace with proper modal (Phase 2.6)”. Not production-grade for MSO.
- **SettingsTab:** Component exists and is fully implemented but is **not in the tab list** in the orchestrator. Users cannot open System Configuration from the main tab bar. MODULE_TABS_NAMES_AND_ORDER lists “Mobile Config” last and does not show a separate “Settings” for Visitor Security; either add “Settings” as the last tab or merge Settings content into Mobile Config and remove/repurpose the standalone SettingsTab.

### Critical issues requiring immediate attention
1. **Conflict resolution:** Wire `ConflictResolutionModal` to context (`conflictInfo`, `handleConflictResolution`) and render it when `conflictInfo` is set; ensure update retry path uses resolution result.
2. **VisitorDetailsModal & EventDetailsModal:** Replace custom modals with `components/UI/Modal`; remove X button; use `footer` for Close/actions; rely on Modal’s z-[100].
3. **All modals with actions:** Move Cancel + primary/secondary buttons into Modal `footer`; use `variant="subtle"` for Cancel, `variant="primary"` or `variant="destructive"` for primary action.
4. **Offline banner:** Currently `fixed top-0 left-0 right-0 z-[100]`, which covers the entire viewport including the sticky tabs bar. Align with reference modules: render the offline banner **inside** ModuleShell children (first child), non-fixed, so it scrolls with content and does not cover tabs.
5. **Error handling consistency:** Replace all `logger.error(...)` in visitor-security with `ErrorHandlerService.logError(...)` (or equivalent) so a single path handles errors and gold standard is met.

---

## III. Workflow & Logic Gaps

- **Conflict resolution:** 409 and “stale updated_at” paths set `conflictInfo` and call `onConflict`, but no modal is shown; user cannot choose overwrite/merge/cancel.
- **getEvent(eventId):** Does not call the backend; only looks up from local `events` array. If the event was created in another tab/session, `getEvent` can return null until a full refresh. Backend may not expose GET /api/visitors/events/:id; if it does, use it; otherwise document and consider refresh-on-focus or periodic refresh.
- **Banned individual check:** Non-admin users are blocked with no modal; admin override uses `window.confirm`. No audit trail, no “reason for override” field, no proper modal with disclaimer.
- **assignSecurityRequest when offline:** Shows “Assign when online to sync” and does not queue the operation. Either queue for later (like create/update visitor) or clearly document as online-only by design.
- **Property ID when missing:** When `propertyId === 'default-property-id'`, auto-fetch in `useVisitorState` does not run (intentional). RegisterVisitorModal uses `user?.roles?.[0] || 'default-property-id'` for `property_id` instead of context `propertyId`; can be inconsistent if user has `property_id` or `assigned_property_ids` set. Prefer a single source (e.g. context `propertyId`) for all API calls.
- **VisitorMetrics.active_events:** Set to `events.length`; if “active” means “current/future” only, filter by `end_date >= now` (or equivalent).

---

## IV. Hardware & Fail-Safe Risks

- **Heartbeat threshold:** `useVisitorHeartbeat` uses a default of 15 minutes; it does not read `enhancedSettings.mso_settings` or similar for a configurable threshold. Consider reading threshold from settings when available so MSO can tune without code change.
- **Hardware/mobile agent APIs:** Frontend calls `/visitors/mobile-agents`, `/visitors/hardware/devices`, `/visitors/system/connectivity`, `/visitors/settings/enhanced`, etc. If backend returns 404 or errors, the module uses defaults (e.g. empty arrays, default enhanced settings). That is safe but: ensure backend either implements these or returns stable stubs so the UI does not flash error toasts on every load; document which endpoints are required for “Plug & Play” hardware and mobile agents.
- **Offline queue:** Flush on `online` and on interval; retry with backoff; `retryFailed` exposed. Good. No race condition identified; single `loadQueue()`/`saveQueue()` per flush.
- **Last Known Good State:** When hardware/agent is offline, heartbeat marks status as offline; UI shows counts (e.g. “0/0 Agents”). No “last known good” snapshot of previous state in UI (e.g. “Last seen 2 min ago”); consider adding for clarity.
- **State sync after conflict:** After conflict resolution (overwrite/merge), state is updated from API response; no double-apply. Good.

---

## V. Tab-by-Tab Breakdown

| Tab | Readiness | Status | Specific Issues | Gold Standard Violations |
|-----|-----------|--------|-----------------|--------------------------|
| **Overview** | 78% | Needs Work | Page header uses `flex items-center justify-between` and subtitle `text-[11px]`; no `items-end mb-8`; optional “Visitor Security” label above title. | Subtitle should be `text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70`; layout `flex justify-between items-end mb-8`. |
| **Visitors** | 70% | Needs Work | Page title uses `text-2xl` instead of `text-3xl`; subtitle `text-[11px] text-slate-400` not design tokens/italic. | Same header/subtitle standard; ensure borders `border-white/5`. |
| **Events** | 72% | Needs Work | Same header pattern as above. | Same page header and subtitle. |
| **Security Requests** | 72% | Needs Work | Same header pattern. | Same. |
| **Banned Individuals** | 75% | Needs Work | Embedded sub-module; “Add Individual” uses `variant="destructive"` (red). Gold standard: primary action usually glass/primary; destructive for delete. | Consider primary/glass for “Add”; keep destructive for delete-only. |
| **Badges & Access** | 70% | Needs Work | Page header alignment. | Same header/subtitle. |
| **Mobile Config** | 72% | Needs Work | Page header alignment. | Same. |
| **Settings** | N/A | Blocked | **Not in navigation.** SettingsTab.tsx exists but is never rendered. | Either add “Settings” tab (e.g. last) or merge into Mobile Config and remove duplicate. |

**Cross-cutting modal violations (all tabs):**
- RegisterVisitorModal, CreateEventModal: actions in content, not `footer`; inner card wrappers in form (`p-4 bg-[color:var(--surface-card)]...`); borders `border-[color:var(--border-subtle)]/20` instead of `border-white/5`.
- VisitorDetailsModal, EventDetailsModal: custom modal wrapper; X close button; z-50; actions in content.
- ConflictResolutionModal: commented out; buttons in content not footer when used.
- EventDetailsModal: same custom wrapper + X.
- BadgePrintModal, QRCodeModal: not fully audited; ensure they use `components/UI/Modal` and `footer` if they have actions.

---

## VI. Observability & Security

- **Telemetry:** `useVisitorTelemetry` provides `trackAction`, `trackPerformance`, `trackError`. Used in orchestrator (global_refresh, tab change) and in WebSocket callbacks. Not every user action (e.g. every button in every modal) is explicitly tracked; consider adding trackAction for create/update/delete/check-in/check-out and for modal open/close where relevant.
- **Error logging:** Most of `useVisitorState` and `VisitorService` use `ErrorHandlerService.logError`. Exceptions: `useVisitorState` uses `logger.error` in `checkInVisitor`, `processAgentSubmission`, `getDeviceStatus`, and `refreshEnhancedSettings`. `useVisitorQueue` uses `logger.error` for execution failure. `useVisitorTelemetry` uses `logger.error` in `trackError`. Standardize on ErrorHandlerService (or a single logging path) per gold standard.
- **Unverified code injections:** No user-supplied HTML or unsafe eval identified. API responses are typed and used in state; ensure backend never returns scriptable content in visitor/event/request fields.
- **Audit trail:** Backend is responsible for audit logs. Frontend does not send an explicit “reason” for sensitive actions (e.g. banned override); when replacing window.confirm with a modal, add a required “Reason for override” field and send it to the backend if the API supports it.

---

## VII. External Integration Readiness

- **Mobile agent data ingestion:** Frontend is ready: WebSocket `visitor-security.mobile-agent.submission`, `refreshSecurityRequests` on submission, `processAgentSubmission`, `refreshMobileAgents`, `syncMobileAgent`. API calls: GET/POST `/visitors/mobile-agents`, `/visitors/mobile-agents/submissions`, process, sync. Backend must implement or stub these so the UI does not break; document expected payloads for future mobile app.
- **Hardware device integration:** Frontend: WebSocket `visitor-security.hardware.device.status`, `refreshHardwareDevices`, heartbeat-based offline detection, `printVisitorBadge`, `getDeviceStatus`. API: GET `/visitors/hardware/devices`, device status, POST print-badge. Same as above: backend readiness required for Plug & Play; frontend handles empty/error with defaults.
- **API endpoint readiness:** Core visitors/events/security-requests are implemented in backend (visitor_endpoints, visitors_service). Mobile agents, hardware, system/connectivity, enhanced settings may be stubbed or missing; list required routes and document in integration guide.
- **WebSocket/real-time:** useVisitorWebSocket subscribes to visitor/event/mobile-agent/hardware channels; orchestrator refreshes data on events. Backend must emit these channels for real-time sync; document channel names and payload shapes.

---

## VIII. Gold Standard Compliance Summary

| Area | Status | Notes |
|------|--------|------|
| ModuleShell | OK | Used with icon, title, subtitle, tabs, activeTab, onTabChange. |
| Tab order/labels | OK | Matches MODULE_TABS (Overview, Visitors, Events, Security Requests, Banned Individuals, Badges & Access, Mobile Config). |
| Page header (every tab) | Needs Work | Layout should be `flex justify-between items-end mb-8`; title `text-3xl font-black text-[color:var(--text-main)]`; subtitle `text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70`. Several tabs use different layout or subtitle size. |
| Modals | Needs Work | Use `components/UI/Modal` only; no custom wrappers; use `footer` for actions; Cancel first, then primary; no X close. VisitorDetailsModal and EventDetailsModal are custom and have X. RegisterVisitorModal/CreateEventModal have actions in content and inner card wrappers. |
| Borders | Needs Work | Prefer `border-white/5`; some modals use `border-[color:var(--border-subtle)]/20`. |
| Empty states | OK | EmptyState component used. |
| Loading spinners | OK | Standard pattern `border-blue-500/20 border-t-blue-500`; message format consistent. |
| Buttons | OK | Button component; variant glass for header actions. FAB outline; acceptable. |
| Offline banner | Needs Work | Should not be fixed over entire viewport; use in-flow banner inside ModuleShell like reference modules; z-index should not compete with modals. |
| WebSocket / telemetry / refresh / queue / heartbeat | OK | Implemented and used. |
| Error handling | Needs Work | Standardize on ErrorHandlerService; remove ad-hoc logger.error in this module. |

---

## IX. Remediation Phases (High Level)

- **Phase 1 – Critical:** Wire ConflictResolutionModal; replace VisitorDetailsModal and EventDetailsModal with UI/Modal and footer; move all modal actions into Modal `footer`; fix offline banner placement and z-index; standardize error logging to ErrorHandlerService.
- **Phase 2 – Gold Standard UI:** Align all tab page headers with layout and typography above; normalize borders to `border-white/5`; remove inner card wrappers in modals; replace window.confirm for banned override with a proper modal (with reason field if API supports).
- **Phase 3 – Settings & navigation:** Decide and implement either a dedicated “Settings” tab (last) or merge Settings into Mobile Config; remove or repurpose SettingsTab accordingly.
- **Phase 4 – Workflow & integration:** getEvent from API if available; optional “last seen” for devices/agents; assignSecurityRequest offline queue or document online-only; propertyId consistency (e.g. RegisterVisitorModal from context); active_events definition; document backend contract for mobile/hardware and integration guide.

---

*End of audit. Phased execution plan follows in separate section; fixes will be applied only after approval.*
