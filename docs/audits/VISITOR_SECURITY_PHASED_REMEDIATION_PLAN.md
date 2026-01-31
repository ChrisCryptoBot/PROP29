# Visitor Security Module — Phased Remediation Plan

This plan addresses every finding from the Production Readiness Audit. Execute in order; each phase is gated on the previous. **Do not apply fixes until approval is given.**

---

## Phase 1: Critical — Conflict Resolution & Modal Compliance

### 1.1 Wire Conflict Resolution Modal
- **File:** `frontend/src/features/visitor-security/VisitorSecurityModuleOrchestrator.tsx`
- **Action:** Uncomment the `ConflictResolutionModal` block. Import `conflictInfo`, `setConflictInfo`, `handleConflictResolution`, and `pendingUpdate` from context (or derive from existing context). Render `<ConflictResolutionModal ... />` when `conflictInfo != null`; onClose set `conflictInfo` and `pendingUpdate` to null; onResolve call `handleConflictResolution(action)`.
- **Verification:** Trigger a 409 (e.g. two tabs updating same visitor); confirm modal appears and overwrite/merge/cancel work and state updates correctly.

### 1.2 Replace VisitorDetailsModal with UI/Modal
- **File:** `frontend/src/features/visitor-security/components/modals/VisitorDetailsModal.tsx`
- **Action:** Remove custom `fixed inset-0` overlay and inner div. Use `components/UI/Modal` with `isOpen`, `onClose`, `title` (e.g. visitor full name), `size="lg"`. Put all current content in `children`; move action buttons (Close, Check In, Check Out, etc.) into Modal `footer` prop. Remove the “X” close button; use a single “Close” button (variant="subtle") in footer. Ensure z-index is handled by Modal (z-[100]).
- **Verification:** Open visitor details from list; confirm modal uses shared Modal component, no X, actions in footer, and stacks above tabs.

### 1.3 Replace EventDetailsModal with UI/Modal
- **File:** `frontend/src/features/visitor-security/components/modals/EventDetailsModal.tsx`
- **Action:** Same as 1.2: use `components/UI/Modal`, remove custom overlay and X button, move actions into `footer` (e.g. Close, optional Edit if applicable). Use Modal title for event name.
- **Verification:** Open event details; confirm modal is shared Modal, no X, footer actions, above tabs.

### 1.4 RegisterVisitorModal — Use Modal footer
- **File:** `frontend/src/features/visitor-security/components/modals/RegisterVisitorModal.tsx`
- **Action:** Remove the inner `div` that contains “Cancel” and “Register” (the one with `flex justify-end space-x-3 pt-4 border-t...`). Add Modal `footer` prop with Cancel (variant="subtle") and primary “Register” (variant="primary"), both with `text-xs font-black uppercase tracking-widest`. Keep handleClose for dirty check; do not render buttons inside content.
- **Verification:** Open Register Visitor; confirm buttons are in footer and order is Cancel then Register.

### 1.5 CreateEventModal — Use Modal footer
- **File:** `frontend/src/features/visitor-security/components/modals/CreateEventModal.tsx`
- **Action:** Same as 1.4: move Cancel and Create/Submit buttons into Modal `footer` prop; remove from content.
- **Verification:** Open Create Event; confirm footer actions.

### 1.6 ConflictResolutionModal — Use Modal footer (when used)
- **File:** `frontend/src/features/visitor-security/components/modals/ConflictResolutionModal.tsx`
- **Action:** If it uses a custom wrapper, switch to `components/UI/Modal`. Ensure action buttons (Cancel, Overwrite, Merge) are in Modal `footer`; Cancel first, then Overwrite/Merge as primary.
- **Verification:** After 1.1 is done, trigger conflict and confirm footer layout.

### 1.7 Offline banner placement and z-index
- **File:** `frontend/src/features/visitor-security/VisitorSecurityModuleOrchestrator.tsx`
- **Action:** Remove `fixed top-0 left-0 right-0 z-[100]` from the offline banner. Render the banner as the first child inside `ModuleShell` (same pattern as Patrol/Incident Log): a normal block `div` with `bg-amber-500/20 border-b border-amber-500/50 px-4 py-2` and the same text, so it scrolls with content and does not cover the sticky tabs. Do not use fixed positioning; do not use z-[100] for the banner (reserve z-[100] for modals).
- **Verification:** Go offline; confirm banner appears below header/tabs and does not cover tabs; modals still appear on top.

---

## Phase 2: Error Handling & Consistency

### 2.1 useVisitorState — Standardize error logging
- **Files:** `frontend/src/features/visitor-security/hooks/useVisitorState.ts`
- **Action:** Replace every `logger.error(...)` with `ErrorHandlerService.logError(error, 'operationName', { context: 'VisitorSecurity', ... })` (or equivalent signature used in the codebase). Affected: checkInVisitor, processAgentSubmission, getDeviceStatus, refreshEnhancedSettings (and any other logger.error in this file).
- **Verification:** Trigger a failing action; confirm errors go through ErrorHandlerService and no raw logger.error for user-facing paths.

### 2.2 useVisitorQueue — Use ErrorHandlerService
- **File:** `frontend/src/features/visitor-security/hooks/useVisitorQueue.ts`
- **Action:** In executeOperation catch block, call ErrorHandlerService (or project standard) instead of logger.error; keep rethrow.
- **Verification:** Queue an operation, disconnect backend; after reconnect, confirm failed execution is logged via ErrorHandlerService.

### 2.3 useVisitorTelemetry — trackError
- **File:** `frontend/src/features/visitor-security/hooks/useVisitorTelemetry.ts`
- **Action:** In trackError, optionally call ErrorHandlerService in addition to or instead of logger.error, so all errors flow through one pipeline; align with gold standard.
- **Verification:** Ensure telemetry + error pipeline are consistent.

---

## Phase 3: Gold Standard UI — Page Headers & Borders

### 3.1 Page header layout and typography (all tabs)
- **Files:**  
  `OverviewTab.tsx`, `VisitorsTab.tsx`, `EventsTab.tsx`, `SecurityRequestsTab.tsx`, `BadgesAccessTab.tsx`, `MobileAppConfigTab.tsx`, `SettingsTab.tsx` (if kept).
- **Action (each):** Ensure the page header container uses `flex justify-between items-end mb-8`. Title: `text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter`. Subtitle: `text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70`. Remove or adjust any extra label (e.g. “Visitor Security”) so it does not conflict; if kept, make it the subtitle or a small label above title per design. Fix VisitorsTab title from `text-2xl` to `text-3xl`.
- **Verification:** Every tab has consistent header layout and typography per UI-GOLDSTANDARD.

### 3.2 Modal content — Remove inner card wrappers and normalize borders
- **File:** `frontend/src/features/visitor-security/components/modals/RegisterVisitorModal.tsx`
- **Action:** Replace inner sections that use `p-4 bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/20 rounded-xl` with flat layout: use `space-y-4` or `space-y-6` and no per-section card; use `border-white/5` where borders are needed; labels: view `text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1`, form `block text-xs font-bold text-white mb-2 uppercase tracking-wider`. Inputs: standard input pattern from gold standard (bg-white/5 border border-white/5 rounded-md ...).
- **Verification:** Register modal has no inner card boxes; borders and labels match gold standard.

### 3.3 CreateEventModal — Same as 3.2
- **File:** `frontend/src/features/visitor-security/components/modals/CreateEventModal.tsx`
- **Action:** Remove inner card wrappers; use flat layout and border-white/5; standard form labels and inputs.
- **Verification:** Create Event modal matches gold standard layout and tokens.

### 3.4 VisitorDetailsModal / EventDetailsModal — After 1.2/1.3
- **Action:** In content, use view labels `text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1` and values per gold standard; ensure no `border-[color:var(--border-subtle)]/20`; use `border-white/5` where needed.
- **Verification:** Detail modals use design tokens consistently.

---

## Phase 4: Banned Individual Override & Property ID

### 4.1 Banned individual override — Replace window.confirm with modal
- **File:** `frontend/src/features/visitor-security/hooks/useVisitorState.ts` (createVisitor)
- **Action:** Remove `window.confirm`. Add state (or context) for “banned override” modal: show when `bannedCheck.is_banned && bannedCheck.matches.length > 0` and user is admin; modal title e.g. “Banned Individual Match”, message with match count and reason, required “Reason for override” field, and actions “Cancel” (variant="subtle”) and “Proceed” (variant="primary" or "warning"). On Proceed, call API with reason if backend supports it; then continue createVisitor. Create a small modal component (using UI/Modal) or reuse a shared ConfirmModal with reason input.
- **Verification:** Register a visitor that matches banned list as admin; confirm modal appears, reason required, and create proceeds only after Proceed.

### 4.2 RegisterVisitorModal — Use context propertyId
- **File:** `frontend/src/features/visitor-security/components/modals/RegisterVisitorModal.tsx`
- **Action:** Get `propertyId` from `useVisitorContext()` (e.g. from a getter or from the same source as createVisitor in the hook) and use it for `property_id` when calling createVisitor, instead of `user?.roles?.[0] || 'default-property-id'`. Ensure createVisitor in context already uses propertyId; modal should pass the same scope.
- **Verification:** With a user that has property_id or assigned_property_ids, register visitor and confirm correct property_id is sent.

---

## Phase 5: Settings Tab & Navigation

### 5.1 Decide Settings placement
- **Decision:** Either (A) add “Settings” as the last tab in the orchestrator and render SettingsTab, or (B) merge Settings content into MobileAppConfigTab and remove/deprecate the standalone SettingsTab. MODULE_TABS does not list Settings for Visitor Security; if product wants a dedicated Settings tab, add it and update MODULE_TABS_NAMES_AND_ORDER if needed.
- **Action (if A):** In VisitorSecurityModuleOrchestrator, add `{ id: 'settings', label: 'Settings' }` to tabs array; in renderTabContent add case for 'settings' rendering SettingsTab.
- **Action (if B):** Move or copy Settings content into MobileAppConfigTab (e.g. a “System configuration” section or sub-tab); remove SettingsTab from exports and do not add a top-level Settings tab.
- **Verification:** User can access System Configuration (either via Settings tab or Mobile Config).

---

## Phase 6: Workflow & Data

### 6.1 getEvent — Use API if available
- **File:** `frontend/src/features/visitor-security/hooks/useVisitorState.ts` (getEvent)
- **Action:** If backend exposes GET /api/visitors/events/:id (or equivalent), call it in getEvent and set selectedEvent from response; otherwise keep current in-memory lookup and add a comment that event must be in refreshed list. If backend adds the endpoint later, switch to API call.
- **Verification:** Open event details from list; if API exists, single-event fetch works; otherwise list-based flow still works.

### 6.2 assignSecurityRequest — Offline behavior
- **File:** `frontend/src/features/visitor-security/hooks/useVisitorState.ts`
- **Action:** Either (A) when offline, queue assignSecurityRequest (add operation type to useVisitorQueue and implement in executeOperation), or (B) keep current “Assign when online” message and document in README that assignment is online-only. Recommend (A) for consistency with other mutations.
- **Verification:** If queued, go offline, assign request, go online and confirm sync; if not queued, message is clear.

### 6.3 VisitorMetrics.active_events
- **File:** `frontend/src/features/visitor-security/hooks/useVisitorState.ts` (metrics useMemo)
- **Action:** If “active_events” should mean “current or future” only, set `active_events: events.filter(e => new Date(e.end_date) >= new Date()).length`; otherwise keep `events.length` and document. Align with backend/metrics contract.
- **Verification:** Overview metrics show intended meaning of “active events”.

### 6.4 Heartbeat threshold from settings
- **File:** `frontend/src/features/visitor-security/VisitorSecurityModuleOrchestrator.tsx` (or where useVisitorHeartbeat is called)
- **Action:** Pass `heartbeatOfflineThresholdMinutes` from enhancedSettings (e.g. `enhancedSettings?.mso_settings?.hardware_timeout_seconds` or a dedicated field) into useVisitorHeartbeat; default to 15 minutes if not set.
- **Verification:** Change setting (when UI exists); confirm heartbeat uses new threshold.

---

## Phase 7: Remaining Modals & Polish

### 7.1 BadgePrintModal, QRCodeModal
- **Files:** `frontend/src/features/visitor-security/components/modals/BadgePrintModal.tsx`, `QRCodeModal.tsx`
- **Action:** Ensure both use `components/UI/Modal`; if they have action buttons, use Modal `footer`; no X close (use Cancel/Close in footer); borders border-white/5.
- **Verification:** Open badge print and QR modals; confirm Modal component and footer usage.

### 7.2 ConflictResolutionModal component
- **File:** `frontend/src/features/visitor-security/components/modals/ConflictResolutionModal.tsx`
- **Action:** If it uses custom overlay, replace with UI/Modal; ensure footer with Cancel, Overwrite, Merge (order: Cancel first, then primary actions).
- **Verification:** Conflict flow uses shared Modal and footer.

### 7.3 Banned Individuals tab — Add button variant
- **File:** `frontend/src/features/visitor-security/components/tabs/BannedIndividualsTab.tsx`
- **Action:** Consider changing “Add Individual” from variant="destructive" to variant="primary" or "glass" for consistency with “add” actions in other modules (destructive is typically for delete). Optional; confirm with product.
- **Verification:** Add button matches intended semantics.

---

## Phase 8: Documentation & Integration Readiness

### 8.1 README / Integration guide
- **File:** `frontend/src/features/visitor-security/README.md` (or docs)
- **Action:** Document: (1) Required backend endpoints for core, mobile agents, hardware, system, settings; (2) WebSocket channel names and payload shapes; (3) Offline queue operation types and sync behavior; (4) That conflict resolution requires backend to return 409 and latest entity when appropriate; (5) Optional: “last seen” for devices/agents, assignSecurityRequest offline behavior, active_events definition.
- **Verification:** A third-party or backend developer can integrate mobile/hardware from the doc.

### 8.2 Backend contract checklist (no code change in frontend)
- **Action:** With backend team, confirm or add: GET/POST visitors, events, security-requests; GET/POST mobile-agents, submissions, process, sync; GET hardware/devices, status, POST print-badge; GET system/connectivity, health; GET/PUT settings/enhanced. Document 404/stub behavior so frontend does not show noisy errors.
- **Verification:** Frontend works with current backend; doc lists what is required for full mobile/hardware Plug & Play.

---

## Execution Order Summary

1. Phase 1 (1.1–1.7): Conflict modal wiring, Visitor/Event detail modals → UI/Modal + footer, Register/Create modals → footer, offline banner.
2. Phase 2 (2.1–2.3): ErrorHandlerService consistency.
3. Phase 3 (3.1–3.4): Page headers and modal content/borders.
4. Phase 4 (4.1–4.2): Banned override modal, propertyId in Register modal.
5. Phase 5 (5.1): Settings tab or merge into Mobile Config.
6. Phase 6 (6.1–6.4): getEvent, assignSecurityRequest offline, metrics active_events, heartbeat from settings.
7. Phase 7 (7.1–7.3): Badge/QR modals, ConflictResolutionModal component, Banned Add button.
8. Phase 8 (8.1–8.2): Docs and backend contract.

After all phases: run `npm run build`, `npx tsc --noEmit`, restart dev environment, and perform manual smoke tests (visitor CRUD, events, security requests, conflict, offline banner, modals). Then push to production repo once approved.

---

*Plan complete. Awaiting approval to proceed with implementation.*
