# Production Readiness Audit: Account Settings Module

**Module:** `frontend/src/features/account-settings`  
**Context:** Manager/admin desktop interface (Windows downloadable software). Must be ready for mobile agent apps, hardware devices, and external data sources.  
**Audit Date:** 2025-02-05  
**Reference:** UI-GOLDSTANDARD.md, Patrol Command Center (`frontend/src/features/patrol-command-center`)

---

## I. Overall Production Readiness Score: **32%**

The module is a **single-file, UI-only prototype** with no API integration, no shared architecture (context/hooks/services), and no real workflows. All data is hardcoded; most actions are toast-only placeholders. Team Management, Team Settings, Integrations, and Permissions tabs mix light-theme styling with console tokens and violate Gold Standard structure (KPI card grid instead of metrics bar, no page headers, custom modal). The module is **not** deployment-ready and requires full remediation.

---

## II. Key Findings

### Critical (Must Fix Before Production)

1. **No API or data layer** — All state is initial `useState` with hardcoded arrays/objects. No fetch on mount, no service layer, no backend calls. `handleUpdateSettings` only simulates a 1s delay and shows success; `handleAddMember` only updates local state. Data is lost on refresh.
2. **Placeholder-only actions (no real workflow)**  
   - **Team Management:** "View" → `showSuccess('Viewing X profile')` (no navigation to profile or details). "Edit" → toast only (no edit modal or form). "Remove" → toast only (no delete confirmation or API).  
   - **Integrations:** "Test" / "Configure" / "Fix" → `showSuccess(...)` only; no real connectivity test, config UI, or remediation. "Add Integration" has no `onClick` handler.  
   - **Permissions:** "Edit Permissions" → toast only; permission checkboxes are disabled and not persisted.
3. **Add Member modal** — Implemented as custom `fixed inset-0` overlay + `Card`, not `components/UI/Modal`. Missing: draggable behavior, z-index above sticky tabs, footer action pattern (Cancel / primary), standard form labels/inputs per §5/§7. Director role missing from role dropdown.
4. **Gold Standard structure violations**  
   - **No page header on any tab:** Tabs lack the required `page-title` + subtitle and `flex justify-between items-end mb-8` block per §6/§6A.  
   - **KPI card grid:** Team Management uses four metric cards at top; Gold Standard requires a **compact metrics bar** (e.g. "Total Members **4** · Active **3** · Pending **1** · Departments **3**") per §16 and Patrol reference.  
   - **Light theme in Settings/Integrations/Permissions:** Cards use `bg-white border-[1.5px] border-slate-200`, `text-slate-900`, `text-slate-700` — must use console tokens (`bg-slate-900/50 border border-white/5`, `var(--text-main)`, `var(--text-sub)`).  
   - **Card header icon:** Team Settings / Integrations / Permissions use `text-xl` and `mr-3 text-slate-600` without the canonical icon box (`w-10 h-10 bg-blue-600 rounded-md ... border border-white/5`).  
   - **Avatar/gradient:** Member avatar uses `bg-gradient-to-br from-blue-600/80 to-slate-900` and `shadow-2xl` — §1 forbids gradients and heavy shadows.
5. **Monolithic architecture** — Single 933-line file. No `context/`, `hooks/`, `services/`, or `types/`; no separation of data, actions, or UI. Not maintainable or testable; blocks future mobile/hardware integration.
6. **No property/tenant awareness** — No `property_id` or user context; team/settings/integrations are not scoped to property or current user.
7. **Missing validation and edge cases** — Add Member: only checks name/email required; no email format validation, duplicate email check, or department required. Team Settings: no validation on break/overtime numeric inputs (e.g. negative or NaN). Integrations: no empty state when list is empty.

### High (Workflow & UX)

8. **No initial load or refresh** — No `useEffect` to load team/settings/integrations from API; no Global Refresh registration or Ctrl+Shift+R; no "Last refreshed" indicator.
9. **No error handling** — No `ErrorHandlerService`; `catch` blocks only call `showError(...)`. No retry logic, no offline handling, no structured logging.
10. **Team Settings Save** — Persists only in memory; no PUT to backend; user loses changes on reload.
11. **Integrations list** — Hardcoded; no GET from backend; "Add Integration" does nothing. No way to add/remove or persist integration config.
12. **Permissions tab** — Read-only display with hardcoded role-permission matrix; "Edit Permissions" is toast-only. No API to read/update role permissions.
13. **Accessibility** — Icon-only buttons (View, Edit, Remove, Test, Configure, Fix) lack `aria-label`. Add Member modal has no `role="dialog"` or `aria-labelledby`. Table has no `aria-label` or sortable header semantics.

### Medium (Consistency & Polish)

14. **Toast-only feedback** — Success/error shown only via inline banner and toast; no loading overlay for Add Member or Save beyond button disabled state.
15. **Director role** — Missing from Add Member role dropdown (only patrol_agent, manager, valet, front_desk).
16. **Empty states** — No `EmptyState` component when team members or integrations list is empty (only when filtered); table/cards show empty list with no message.
17. **Modal z-index** — Custom modal uses `z-50`; Gold Standard modals use `z-[100]` to sit above sticky tabs (`z-[70]`).

### Low / Observability

18. **No telemetry** — No action tracking (add member, save settings, test integration, edit permissions).
19. **No WebSocket** — Team or integration status changes (e.g. device offline) could be pushed; not implemented.
20. **No audit trail** — No logging of who added/removed members or changed settings for compliance.

---

## III. Workflow & Logic Gaps

- **Team lifecycle:** Add member exists in UI but only in memory; no invite flow, no email verification, no backend user create. View/Edit/Remove do not open profile, edit form, or delete confirmation — they only show toasts.
- **Team Settings lifecycle:** Edit form and Save update local state and simulate API; no persistence, no property scoping, no last-saved indicator.
- **Integrations lifecycle:** List is static. Add Integration has no handler. Test/Configure/Fix are placeholders; no real health check, config modal, or remediation flow. No "Last Known Good" or offline state for devices.
- **Permissions lifecycle:** Display only; no load from API, no save, no role-permission matrix backend. Edit Permissions is a no-op.
- **Data flow:** No connection to existing backend: e.g. `system_admin` has `/users` CRUD, `access_control` has `/users`; Account Settings does not call any of them. No shared property or auth context for current user/role.
- **Edge cases:** Empty team list; invalid break/overtime numbers; duplicate email on add; long list (no pagination or virtualization).

---

## IV. Hardware & Fail-Safe Risks

- **Integrations tab** lists camera, access_control, alarm, mobile — but there is no real hardware/API integration. When added:
  - **Race conditions:** Concurrent "Test" or "Configure" with no locking or loading state per integration.
  - **State sync:** No "Last Known Good" or offline detection; status is static. UI does not reflect device disconnect/reconnect.
  - **Error handling:** No retry, no timeout, no user-facing error message from a failed test.
- **Offline:** No offline banner, no queue for add-member or save-settings; no indication that data is local-only.
- **Deterministic failure:** Save/Add currently always "succeed" in UI; when wired to API, 4xx/5xx and network errors must be handled and reflected in UI.

---

## V. Tab-by-Tab Breakdown

| Tab | Readiness | Status | Specific Issues | Gold Standard Violations |
|-----|-----------|--------|-----------------|--------------------------|
| **Team Management** | 35% | Needs Work | KPI card grid; View/Edit/Remove toast-only; Add Member no API; no page header; no empty state; no refresh | KPI grid → metrics bar; page header required; avatar gradient/shadow; modal not global Modal |
| **Team Settings** | 30% | Needs Work | Save simulated only; no API; no property scope; light-theme cards/labels | Light theme (white/slate); card header without icon box; no page header; form inputs not Standard Input (§5) |
| **Integrations** | 25% | Blocked | Add Integration no handler; Test/Configure/Fix toast-only; static list; no API | Light theme; card header; no page header; no real workflow |
| **Permissions** | 25% | Blocked | Edit Permissions toast-only; checkboxes disabled; no load/save | Light theme; no page header; read-only with no explanation |

---

## VI. Observability & Security

- **Telemetry:** None. No tracking of add member, save settings, test/configure integration, or edit permissions.
- **Error handling:** No ErrorHandlerService; only inline `showError` in catch. No structured context or metadata.
- **Audit trail:** No logging of team or settings changes for compliance.
- **Injection:** Form inputs are controlled and not rendered as HTML; no raw HTML. Email/name not sanitized for display (low risk if backend escapes).
- **Authorization:** No check that current user can add/remove members or edit settings; no property_id scoping.

---

## VII. External Integration Readiness

| Integration | Readiness | Notes |
|-------------|-----------|--------|
| **Mobile agent data** | Not ready | No API or UI to manage mobile agents; Integrations lists "Mobile App Integration" as static item only. |
| **Hardware devices** | Not ready | Integrations list camera/access_control/alarm but no real device discovery, status, or config. No heartbeat or offline detection. |
| **API endpoints** | Not wired | Backend has system_admin `/users` and access_control `/users`; Account Settings does not call them. No dedicated team/settings/integrations/permissions API documented or used. |
| **WebSocket** | Not implemented | No real-time team or integration status updates. |
| **External data sources** | N/A | No generic adapter; would be backend concern. |

---

## VIII. Summary Table: Buttons & Actions

| Location | Action | Real behavior? | Notes |
|----------|--------|----------------|-------|
| Team Management | KPI cards (4) | Display only | Should be metrics bar |
| Team Management | Add Member | Partial | Adds to local state only; no API |
| Team Management | View (per row) | No | Toast only |
| Team Management | Edit (per row) | No | Toast only |
| Team Management | Remove (per row) | No | Toast only |
| Add Member modal | Cancel | Yes | Closes modal |
| Add Member modal | Add Member | Partial | Local state only |
| Team Settings | Edit Settings | Yes | Toggles form |
| Team Settings | Cancel | Yes | Exits edit |
| Team Settings | Save Changes | Partial | Simulated API; no persist |
| Integrations | Add Integration | No | No handler |
| Integrations | Test (per item) | No | Toast only |
| Integrations | Configure (per item) | No | Toast only |
| Integrations | Fix (per item, error state) | No | Toast only |
| Permissions | Edit Permissions (per role) | No | Toast only |

---

## IX. Duplicate / Redundant / Missing

- **Redundant:** Inline error/success banners duplicate toast feedback; can standardize on toast + optional inline for form errors.
- **Missing:** context, hooks, services, types folder; API integration; page headers; metrics bar; global Modal; Global Refresh; telemetry; ErrorHandlerService; property_id; validation; empty states; a11y labels; Director in role dropdown; real View/Edit/Remove/Test/Configure/Fix/Edit Permissions flows.
- **Over-design:** Four KPI cards where one metrics bar suffices; heavy avatar gradient and shadow.
- **Under-design:** No loading skeleton; no pagination; no filters or search on team table.

---

*End of Audit Report*
