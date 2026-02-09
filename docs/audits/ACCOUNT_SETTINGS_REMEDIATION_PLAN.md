# Account Settings Module — Phased Remediation Plan

This plan addresses every finding from the Production Readiness Audit so the module is **fully ready** for deployment, real-world use, mobile/hardware integration, external data sources, and clean future development. Execution order is phased; **approval is required before proceeding with all fixes.**

---

## Phase 1: Architecture & Data Layer (Foundation)

**Goal:** Decouple the monolithic component, introduce context/hooks/services/types, and wire to backend where APIs exist.

### 1.1 Folder structure and types

- **Create** `frontend/src/features/account-settings/types/account-settings.types.ts` with:
  - `TeamMember`, `TeamSettings`, `Integration` (move from component).
  - `AccountSettingsState`, `AccountSettingsActions`, API request/response types.
- **Create** `frontend/src/features/account-settings/types/index.ts` (re-export).

### 1.2 Service layer

- **Create** `frontend/src/features/account-settings/services/AccountSettingsService.ts` (or `accountSettingsService.ts`):
  - Methods: `getTeamMembers(propertyId?)`, `addTeamMember(data)`, `updateTeamMember(id, data)`, `removeTeamMember(id)`, `getTeamSettings(propertyId?)`, `updateTeamSettings(propertyId?, data)`, `getIntegrations(propertyId?)`, `testIntegration(id)`, `getRolePermissions()`, `updateRolePermissions(role, permissions)` (or equivalent).
  - Wire to existing backend where applicable: e.g. `system_admin` `/users` or `access_control` `/users` for team members; document or add `GET/PUT /api/account-settings/team-settings`, `GET /api/account-settings/integrations`, etc. if not present.
  - Use `ApiService`/existing API client; return typed responses; use `ErrorHandlerService` in catch.
- **Create** `frontend/src/features/account-settings/services/index.ts` if needed.

### 1.3 Context and hooks

- **Create** `frontend/src/features/account-settings/context/AccountSettingsContext.tsx`:
  - Provider holds: teamMembers, teamSettings, integrations, permissions (or rolePermissions), loading (per resource), error, actions (addMember, updateMember, removeMember, updateSettings, testIntegration, etc.), refresh function.
  - Use `useAuth()` for current user and property_id (or shared `getPropertyIdFromUser`).
- **Create** `frontend/src/features/account-settings/hooks/useAccountSettingsState.ts`:
  - Encapsulate fetch on mount, refresh, and all mutations; call service; update context state; handle loading/error; use ErrorHandlerService and optional retry for critical ops.
- **Create** `frontend/src/features/account-settings/hooks/index.ts` (re-export).

### 1.4 Orchestrator and tabs

- **Rename/refactor** `AccountSettingsModule.tsx` to **orchestrator**: thin wrapper that provides `AccountSettingsContext`, renders `ModuleShell`, and delegates tab content to separate tab components.
- **Create** tab components under `frontend/src/features/account-settings/components/tabs/`:
  - `TeamManagementTab.tsx`, `TeamSettingsTab.tsx`, `IntegrationsTab.tsx`, `PermissionsTab.tsx`.
- Move tab content from current file into these components; consume context via `useAccountSettingsContext()` (or equivalent). Pass only necessary props (e.g. setActiveTab for links).

**Result:** Clear separation of data (context + service), logic (hooks), and UI (orchestrator + tabs). Ready to plug in real API and property scoping.

---

## Phase 2: Gold Standard UI (Structure & Visual)

**Goal:** Align every tab with Patrol Command Center and UI-GOLDSTANDARD (page headers, metrics bar, console theme, card headers, Modal, no gradients/shadows).

### 2.1 Page headers (all tabs)

- **Each tab:** Add at top of content the standard block:
  - Container: `flex justify-between items-end mb-8`.
  - Left: `<h2 className="page-title">[Tab Title]</h2>` and `<p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">[subtitle]</p>`.
  - Right (optional): Last refreshed (when Phase 3 adds Global Refresh).
- Tab titles: e.g. "Team Management", "Team Settings", "Integrations", "Role Permissions".

### 2.2 Team Management tab

- **Replace** the four KPI cards with a **compact metrics bar** per §6A:
  - Container: `flex flex-wrap items-center gap-6 py-3 border-b border-white/5 text-sm mb-6`.
  - Items: "Total Members **N**", "Active **N**", "Pending **N**", "Departments **N**" (using `<strong className="text-white ml-1">` for values).
- **Card:** Keep single Card for "Team Members" table; ensure Card uses `bg-slate-900/50 border border-white/5`; CardHeader with `border-b border-white/5` and **icon box + title** (`w-10 h-10 bg-blue-600 rounded-md ... border border-white/5` + `card-title-text` or equivalent).
- **Avatar:** Remove gradient and shadow; use solid `bg-slate-700` or `bg-blue-600/80` and `border border-white/5` (no shadow-2xl).
- **Table:** Keep table; ensure header cells use `text-[9px] font-black uppercase tracking-widest text-slate-500` (or var(--text-sub)); body uses console text tokens. Add `aria-label` to table if not present.
- **Empty state:** When `teamMembers.length === 0`, render `EmptyState` component (icon, title, description, optional "Add Member" action).

### 2.3 Team Settings tab

- **Console theme:** Replace all `bg-white`, `border-slate-200`, `text-slate-900`, `text-slate-700` with console tokens: e.g. `bg-slate-900/50 border border-white/5`, `text-[color:var(--text-main)]`, `text-[color:var(--text-sub)]`.
- **Card header:** Use icon box + title per §3 (e.g. `w-10 h-10 bg-blue-600 rounded-md ...` + "Team Settings").
- **Form labels/inputs:** Use Standard Input and Form Label per §5/§7 (e.g. `bg-white/5 border border-white/5 rounded-md text-white`, label `block text-xs font-bold text-white mb-2 uppercase tracking-wider`). Same for select and time inputs.
- **Break/Overtime blocks:** Use bordered blocks with console colors; no light-theme inner cards.

### 2.4 Integrations tab

- **Console theme:** Same as 2.3; card and list items use `bg-slate-900/50 border border-white/5`, text tokens.
- **Card header:** Icon box + "System Integrations".
- **Add Integration button:** Wire to handler (Phase 3 or 4: open Add Integration modal or navigate to config).
- **Empty state:** When `integrations.length === 0`, render `EmptyState` (e.g. "No integrations" + "Add an integration to connect hardware or services.").

### 2.5 Permissions tab

- **Console theme:** Same; replace light backgrounds and text with console tokens.
- **Card header:** Icon box + "Role Permissions".
- **Edit Permissions:** To be wired in Phase 3 to real flow (modal or inline edit with save).

### 2.6 Add Member modal → Global Modal

- **Replace** custom overlay + Card with `components/UI/Modal`.
  - Title: "Add Team Member".
  - Content: Same fields (Name, Email, Role, Department, Phone); add **Director** to role dropdown. Use standard form labels and inputs per §5/§7.
  - Footer: Cancel (`variant="subtle"`) + "Add Member" (`variant="primary"`). Use Modal's `footer` prop.
  - Ensure modal uses `z-[100]` (or Modal default) so it appears above sticky tabs.
- **Validation:** Required name and email; optional email format and duplicate-email check (client-side or API); show inline errors per §7.
- **Loading:** Disable primary button and show spinner during submit.
- **Accessibility:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby`; icon-only buttons in table get `aria-label` (View, Edit, Remove).

**Result:** All tabs and modal align with Gold Standard structure and console theme; no light theme or decorative gradients/shadows.

---

## Phase 3: Real Workflows (Every Button Does Its Job)

**Goal:** Replace every toast-only or no-op with real behavior: navigation, modals, API calls, confirmation, error handling.

### 3.1 Team Management

- **View (per row):** Navigate to `/profile` with query or state for that user (e.g. `?userId=...`) or open a read-only "Member Details" modal with profile info. Prefer navigation if profile page supports it.
- **Edit (per row):** Open "Edit Member" modal (or inline form) with current member data; on Save call `updateTeamMember(id, data)` from context; close on success; show toast; on API error show error message and keep modal open.
- **Remove (per row):** Show confirmation modal ("Remove [name] from team? This cannot be undone." or similar). On Confirm call `removeTeamMember(id)`; remove from list and close modal; toast success or error.
- **Add Member (modal):** On submit call `addTeamMember(payload)` from context (with property_id from auth); on success close modal, refresh list, toast; on error (e.g. duplicate email) show inline error and keep modal open.
- **Add Member – Director:** Add "Security Director" to role dropdown in modal.

### 3.2 Team Settings

- **Save Changes:** Call `updateTeamSettings(propertyId, teamSettings)` from context (service → PUT backend). On success: exit edit mode, toast, optionally show "Last saved" time. On error: show error toast and keep edit mode.
- **Cancel:** Exit edit mode and revert to last saved state (from context).
- **Validation:** Validate break duration/frequency and overtime max hours (positive numbers, sane ranges); show inline errors. Use `parseInt` with fallback to avoid NaN.

### 3.3 Integrations

- **Add Integration:** Open "Add Integration" modal (new): type (camera, access_control, alarm, mobile, reporting), name, endpoint; on Save call service to create (backend endpoint to be added if not present); refresh list.
- **Test:** Call `testIntegration(id)` from service (backend to implement if missing: e.g. GET /integrations/:id/test). Show loading on button; on success show toast "Connection successful" or similar; on failure show error toast and optionally set integration status to error in UI.
- **Configure:** Open "Configure Integration" modal or navigate to config page with integration id; load current config; save via API. If backend not ready, show info toast "Configuration will be available when backend supports it" and leave button wired.
- **Fix:** Same as Test or a dedicated "retry/remediate" endpoint; show loading and toast result. If no backend, show info toast.

### 3.4 Permissions

- **Edit Permissions (per role):** Open modal (or inline expand) with list of permissions for that role; checkboxes bound to state; Save calls `updateRolePermissions(role, permissions)` (backend to be added if not present). If backend does not exist yet, implement modal and local state and document API contract; button can show "Saved locally" or "API coming soon" until backend exists.
- Ensure permission list and role list are loaded from context (and ultimately API).

**Result:** Every button either performs a real action (API + UI update) or shows a clear, honest message (e.g. "API not yet available") with no misleading success toasts.

---

## Phase 4: Backend & Integration Readiness

**Goal:** Ensure backend supports team, settings, integrations, and permissions where expected; add endpoints if missing; property scoping and auth.

### 4.1 Backend API (if not present)

- **Team members:** Use existing `system_admin` `/users` or `access_control` `/users` with property scoping, or add `GET/POST/PUT/DELETE /api/account-settings/team` (or equivalent) with `property_id` query/body. Align with product (one source of truth for "users").
- **Team settings:** Add `GET /api/account-settings/team-settings?property_id=`, `PUT /api/account-settings/team-settings` with body (teamName, hotelName, timezone, workingHours, breakPolicy, overtimePolicy, notificationSettings). Store per property.
- **Integrations:** Add `GET /api/account-settings/integrations?property_id=`, `POST /api/account-settings/integrations`, `GET /api/account-settings/integrations/:id/test`, optional `PUT .../integrations/:id` for config. Return list with status and lastSync.
- **Permissions:** Add `GET /api/account-settings/role-permissions`, `PUT /api/account-settings/role-permissions` with role + permissions array, or document that permissions are managed elsewhere (e.g. system_admin) and wire to that.

### 4.2 Property and auth

- **Property ID:** In context/hooks, get `property_id` from `useAuth()` (e.g. `user?.property_id ?? user?.assigned_property_ids?.[0] ?? ...`) or shared `getPropertyIdFromUser(currentUser)` and pass to all GET/PUT that need it.
- **Authorization:** Backend should enforce that only allowed roles can update team/settings/permissions; frontend can hide or disable actions based on role if desired.

### 4.3 Mobile / hardware ingestion (preparation)

- **Document** where mobile agent list or hardware device list would be consumed (e.g. Integrations tab could later pull from IoT/hardware APIs). No code change required until those systems exist; ensure Integrations type and UI can accept dynamic list from API.
- **Last Known Good / offline:** When integrations have real status, show "Last synced" and, if status is error, "Last known good: [time]"; consider offline banner when network is down (use existing network status context if available).

**Result:** Backend supports all Account Settings flows; frontend uses property-scoped APIs and is ready for future mobile/hardware data.

---

## Phase 5: Observability, Refresh, and Resilience

**Goal:** Global Refresh, telemetry, ErrorHandlerService, retry for critical ops, optional WebSocket.

### 5.1 Global Refresh

- In orchestrator (or a small inner component), register with `useGlobalRefresh()` a handler that calls context `refreshData()` (or refresh team, settings, integrations).
- Ensure Ctrl+Shift+R triggers refresh.
- Optional: show "Last refreshed" in Team Management (and optionally other tabs) using `lastRefreshedAt` and `formatRefreshedAgo` (same pattern as Patrol Overview).

### 5.2 Error handling and retry

- Replace all `catch` that only call `showError` with `ErrorHandlerService.handle(error, 'operationName', { context: 'account-settings', ... })` then show user-facing toast.
- For critical operations (add member, update settings, remove member), wrap service call in `retryWithBackoff` (e.g. max 3, 5xx retry only); after final failure, show error and leave UI in consistent state.

### 5.3 Telemetry

- Add optional `useAccountSettingsTelemetry` or inline `trackAction`: track "member_added", "member_updated", "member_removed", "settings_updated", "integration_tested", "permissions_updated" (and tab changes if desired). Use existing app telemetry if present.
- **Optional:** Track performance for slow operations (e.g. refresh > 2s).

### 5.4 WebSocket (optional)

- If product requires real-time team or integration status updates, add `useAccountSettingsWebSocket` subscribing to channels like `account-settings.team.updated`, `account-settings.integration.status` and update context state. Otherwise document as future work.

**Result:** Refresh, errors, and key actions are observable and resilient; ready for production ops.

---

## Phase 6: Accessibility, Empty States, and Polish

**Goal:** A11y, empty states everywhere, loading states, and cross-module links if applicable.

### 6.1 Accessibility

- All icon-only buttons: add `aria-label` (e.g. "View profile", "Edit member", "Remove member", "Test connection", "Configure", "Fix", "Previous page", "Next page").
- Add Member and all other modals: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to title.
- Table: `aria-label="Team members"` (or similar); if sortable later, add `aria-sort` on headers.
- Ensure focus trap in modals and focus restore on close (Modal component should handle if standard).

### 6.2 Empty states

- Team members: when `teamMembers.length === 0`, show `EmptyState` ("No team members", "Add your first team member to get started.", action: "Add Member").
- Integrations: when `integrations.length === 0`, show `EmptyState` ("No integrations", "Add an integration to connect cameras, access control, or other systems.", action: "Add Integration").
- Permissions: no empty list; if no roles, show simple message or hide tab.

### 6.3 Loading states

- Initial load: show full-tab or section spinner (standard `border-blue-500/20 border-t-blue-500`) while team/settings/integrations load. Per-resource loading: show spinner only when that resource is loading and list is empty; otherwise show data with disabled actions.
- Add Member / Edit Member / Save Settings: disable primary button and show spinner in button during request.

### 6.4 Cross-module navigation (if applicable)

- From Access Control or System Admin: if there is a "Manage team" or "Account settings" link, ensure it routes to `/settings` (or correct path) and optionally to Account Settings with the right tab (e.g. `?tab=team`). Document in routing.
- Profile Settings: ensure link from sidebar "Account Settings" goes to this module (already `/settings` per current setup).

### 6.5 Minor fixes

- Add Member modal: ensure Director is in role dropdown.
- Team table: optional pagination or "Show more" if list is large (e.g. > 20); document as enhancement if not in scope.
- Break/overtime inputs: prevent negative or NaN; clamp or validate to sensible ranges.

**Result:** Module is accessible, handles empty and loading states, and fits into app navigation.

---

## Execution Order and Approval

1. **Phase 1** — Architecture & data layer (types, service, context, hooks, split orchestrator + tabs).  
2. **Phase 2** — Gold Standard UI (page headers, metrics bar, console theme, card headers, Modal, remove gradients/shadows).  
3. **Phase 3** — Real workflows (View/Edit/Remove/Add Member, Save Settings, Integrations Test/Configure/Fix/Add, Permissions Edit).  
4. **Phase 4** — Backend & integration (endpoints, property_id, auth; mobile/hardware prep).  
5. **Phase 5** — Observability (Global Refresh, ErrorHandlerService, retry, telemetry, optional WebSocket).  
6. **Phase 6** — A11y, empty states, loading, cross-module links, polish.

**Build & verify after all phases:**  
- Run `npm run build`.  
- Run `npx tsc --noEmit`.  
- Restart dev environment.  
- Notify for manual verification (each tab, each button, modal, error/empty/loading states).

---

**Approval:** Proceed with all phases only after your approval. If you prefer to approve phase-by-phase, say which phase(s) to execute first.
