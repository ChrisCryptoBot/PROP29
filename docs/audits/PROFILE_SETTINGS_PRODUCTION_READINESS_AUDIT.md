# Profile Settings Module — Production Readiness Audit

**Audit Date:** 2025-02-05  
**Module:** `frontend/src/features/profile-settings`  
**Context:** Manager/admin desktop (Windows downloadable); readiness for mobile agents, hardware, and external data sources.  
**Reference:** UI-GOLDSTANDARD.md, Patrol Command Center, Account Settings (post-remediation).

---

## I. Overall Production Readiness Score: **28%**

The Profile Settings module is **not production-ready**. It is a single monolithic component with no API layer, light-theme UI violating the Security Console Gold Standard, and multiple placeholder or no-op actions. Data is hardcoded; save operations are simulated. No observability, no error boundaries, and no integration points for mobile/hardware or external systems.

---

## II. Key Findings

### Critical (Must Fix Before Production)

1. **No API layer** — All data is local state; `handleSave` simulates an API with `setTimeout(1000)` and only updates in-memory state. No GET/PUT profile, change password, 2FA, or sessions endpoints are called or exist in the backend.
2. **Placeholder / no-op actions (buttons do not fulfill workflow):**
   - **Add Certification** — No `onClick`; button does nothing.
   - **Update Password** — No `onClick`; password inputs are uncontrolled (no state); no submission logic.
   - **Manage 2FA** — No `onClick`; no behavior.
   - **Disable** (2FA) — No `onClick`; no behavior.
   - **Revoke** (session) — No `onClick`; no behavior.
3. **Gold Standard violations (full light theme):**
   - Cards: `bg-white border-slate-200 shadow-sm` (should be `bg-slate-900/50 border border-white/10`).
   - Text: `text-slate-900`, `text-slate-600`, `text-slate-700`, `text-slate-500` (should use `var(--text-main)`, `var(--text-sub)`).
   - Inputs: `border-slate-300 rounded-lg` (should be console Standard Input: `bg-white/5 border border-white/10 rounded-md text-white`).
   - Avatar/icon: `bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg` (gradients and shadow prohibited; use flat icon box).
   - No page headers per tab (no `page-title` + subtitle per §6).
   - Card headers: no icon box + title pattern (§3); using `text-xl` and icon inline.
4. **ModuleShell missing `icon` prop** — Required by Gold Standard; not provided.
5. **Monolithic architecture** — Single ~855-line file; no types, service, context, hooks, or split tab components; difficult to maintain and test.
6. **No backend profile API** — Backend has no GET/PUT for current-user profile, change-password, 2FA, or sessions; module cannot persist or load real data.

### High (Should Fix)

7. **formData sync edge case** — After save, `setProfile({ ...formData })` is used; if a future API returns server-normalized data, `formData` should be set from the response so the next edit shows server state.
8. **No validation** — No required-field checks, email format, or password strength; no inline error display per §7.
9. **No loading per section** — Single `loading` flag; no per-resource or per-tab loading states.
10. **Certifications tab** — View-only list; no Edit, Remove, or Renew actions per certification; expired state is only visual (no workflow).
11. **Security tab** — 2FA status hardcoded as "Enabled"; sessions hardcoded (no fetch); no real session revocation or password change flow.
12. **Duplicate role/display logic** — `getRoleDisplayName` / `getRoleColor` and role type duplicated vs account-settings; should use shared types or a single source of truth.
13. **No ErrorBoundary** — Tab content not wrapped; a single render error can take down the whole module.
14. **No Global Refresh** — Module not registered with `useGlobalRefresh`; no Ctrl+Shift+R refresh of profile data.
15. **No telemetry** — No tracking of profile edits, password change attempts, 2FA or session actions.

### Medium (Improve Readiness)

16. **No retry logic** — Save operations have no retry on network failure.
17. **Error handling** — `showError` only sets local state and timeout; no `ErrorHandlerService`, no structured logging.
18. **Preferences display bug** — View mode shows hardcoded "English" and "America/New_York" instead of `profile.preferences.language` and `profile.preferences.timezone`.
19. **Accessibility** — Icon-only or icon-primary buttons (Edit, Add Certification, Revoke, etc.) lack `aria-label`.
20. **Empty state** — Certifications list has no `EmptyState` component when list is empty (per §13).
21. **Routing** — README says "Route: /profile"; app has both `/profile` and `/modules/profile-settings`. Cross-module links (e.g. from Account Settings "View" with `userId`) should resolve to a single canonical profile route (e.g. `/profile` with optional `?userId=` for view-other).

### Low / Informational

22. **Property/tenant scoping** — Profile is current-user only; no `property_id` in profile payloads yet (acceptable for “my profile” until multi-property profile is required).
23. **Mobile/hardware** — No direct integration points in this module; readiness is “data shape and API ready” for future mobile/hardware to push or pull profile-related data once backend exists.

---

## III. Workflow & Logic Gaps

| Gap | Description |
|-----|-------------|
| **Save flow** | Save updates only local state; no API call, no persistence, no conflict handling. |
| **Password change** | No form state, no submit handler, no current-password check, no API. |
| **2FA** | Status hardcoded; Manage/Disable do nothing; no enable flow, no TOTP/backup codes. |
| **Sessions** | List is static; Revoke does nothing; no API to list or revoke sessions. |
| **Certifications** | Add does nothing; no Edit/Renew/Remove; no expiry reminders or workflow. |
| **Edit cancel** | Cancel reverts to `profile`; if profile were loaded from API after save, formData would still be stale until next load (currently N/A because no API). |
| **Validation** | No client-side validation on Personal/Work/Preferences; invalid data can be “saved” locally. |
| **Offline** | No offline detection; no queue for pending profile/password/2FA changes. |

---

## IV. Hardware & Fail-Safe Risks

| Risk | Notes |
|------|--------|
| **N/A today** | Module does not control hardware. Future: if profile drives device assignments or mobile-agent config, ensure profile API is idempotent and returns last-known-good state. |
| **State sync** | No server authority; “state” is client-only. When backend exists, need clear rules for conflict (e.g. last-write-wins or version field). |
| **Race conditions** | Single-threaded UI; no concurrent save from multiple tabs. When API exists, prevent double-submit (disable button, ignore duplicate clicks). |
| **Deterministic failure** | Simulated save always “succeeds”; no 4xx/5xx handling. Production must handle 401 (re-auth), 409 (conflict), 5xx (retry/backoff). |

---

## V. Tab-by-Tab Breakdown

### Tab: Personal Info

| Item | Status |
|------|--------|
| **Readiness Score** | 40% |
| **Status** | Needs Work |
| **Specific Issues** | Save is simulated only; no API; no validation; light-theme UI; no page header (page-title + subtitle); card/inputs/labels not console-themed; avatar uses gradient + shadow. |
| **Gold Standard Violations** | Card `bg-white border-slate-200`; text-slate-*; input styling; no icon box in card header; rounded-2xl and shadow on avatar. |
| **Buttons** | Edit Profile → sets editMode (ok). Cancel → reverts formData (ok). Save Changes → handleSave (simulated only). |

### Tab: Work Details

| Item | Status |
|------|--------|
| **Readiness Score** | 40% |
| **Status** | Needs Work |
| **Specific Issues** | Same as Personal: simulated save, no API, light theme, no page header, no card header icon box. |
| **Gold Standard Violations** | Same light-theme and structure violations. |
| **Buttons** | Edit → setEditMode('work'). Cancel/Save → same pattern as Personal. |

### Tab: Certifications

| Item | Status |
|------|--------|
| **Readiness Score** | 15% |
| **Status** | Blocked |
| **Specific Issues** | Add Certification has no handler; no Edit/Renew/Remove per cert; list is view-only; no empty state when 0 certifications; expired state is visual only. |
| **Gold Standard Violations** | Light theme; card header without icon box; list items not bordered divs per §16. |
| **Buttons** | Add Certification → no onClick (placeholder). |

### Tab: Preferences

| Item | Status |
|------|--------|
| **Readiness Score** | 35% |
| **Status** | Needs Work |
| **Specific Issues** | Save simulated; view mode shows hardcoded "English" and "America/New_York" instead of profile.preferences; light theme; no page header. |
| **Gold Standard Violations** | Same light-theme and card/header violations. |
| **Buttons** | Edit → setEditMode('preferences'). Cancel/Save → same as others. |

### Tab: Security

| Item | Status |
|------|--------|
| **Readiness Score** | 25% |
| **Status** | Blocked |
| **Specific Issues** | Update Password: no state, no submit, no API. Manage 2FA / Disable: no handlers. Revoke session: no handler. 2FA status and sessions list are hardcoded. Only “Clear cache and sign out” is real. |
| **Gold Standard Violations** | Light theme; card/section styling; no page header. |
| **Buttons** | Update Password → no onClick. Manage 2FA → no onClick. Disable → no onClick. Revoke → no onClick. Clear cache and sign out → clearCacheAndLogout() (real). |

---

## VI. Observability & Security

| Area | Status |
|------|--------|
| **Telemetry** | Absent; no track of profile edit, password change, 2FA, or session actions. |
| **Error logging** | Only local error state and timeout; no ErrorHandlerService or structured logging. |
| **Audit trail** | No audit events for profile or security actions. |
| **Unverified injection** | No user-supplied HTML; no obvious injection risk. |
| **Sensitive data** | Password fields present; when wired to API, ensure no logging of passwords. |

---

## VII. External Integration Readiness

| Integration | Readiness | Notes |
|-------------|-----------|--------|
| **Mobile agent** | Not ready | No profile API for mobile to read/write; no WebSocket for profile updates. |
| **Hardware** | N/A | No direct hardware control in this module. |
| **API endpoints** | Missing | Backend has no GET/PUT profile, change-password, 2FA, or sessions; auth has login only. |
| **WebSocket / real-time** | Absent | No real-time profile or session updates. |

---

## VIII. Duplicate / Redundant / Missing / Over-Under Design

- **Duplicate:** Role display names and colors duplicated vs account-settings; should be shared (e.g. shared types or util).
- **Redundant:** Multiple inline rolePermission checks; could be one hook or helper.
- **Missing:** Types file, service layer, context, hooks, tab components, backend API, validation, ErrorBoundary, Global Refresh, telemetry, empty state for certifications.
- **Over-design:** None (module is under-designed relative to production).
- **Under-design:** Single file; no separation of data/UI; light theme; placeholder buttons; no real persistence or security flows.

---

## IX. Button & Action Summary (Real vs Placeholder)

| Location | Button/Action | Real? | Notes |
|----------|----------------|-------|--------|
| Personal | Edit Profile | Yes | Sets editMode. |
| Personal | Cancel | Yes | Reverts formData, clears editMode. |
| Personal | Save Changes | Partial | Updates local state only; no API. |
| Work | Edit | Yes | Sets editMode. |
| Work | Cancel / Save Changes | Same as Personal. | |
| Certifications | Add Certification | No | No onClick. |
| Certifications | (per cert) Edit/Renew/Remove | Missing | No buttons. |
| Preferences | Edit / Cancel / Save | Same pattern as Personal. | |
| Security | Update Password | No | No state, no onClick. |
| Security | Manage 2FA | No | No onClick. |
| Security | Disable 2FA | No | No onClick. |
| Security | Revoke (session) | No | No onClick. |
| Security | Clear cache and sign out | Yes | clearCacheAndLogout(). |

---

## X. Recommended Direction (Remediation)

1. **Architecture** — Introduce types, profileService (API client), ProfileSettingsContext, useProfileSettingsState, and split into tab components (PersonalInfoTab, WorkDetailsTab, CertificationsTab, PreferencesTab, SecurityTab); orchestrator with ModuleShell + icon and modal state.
2. **Backend** — Add profile endpoints (e.g. GET/PUT `/me` or `/profile`), change-password, 2FA status/manage/disable, sessions list/revoke; align with Auth and User model.
3. **Gold Standard** — Console theme for all tabs (page-title, metrics bar if needed, card icon+title, Standard Input/Select, Modal for add/edit cert and password/2FA flows); ModuleShell `icon` prop; no gradients/shadows.
4. **Real workflows** — Wire every button: Add/Edit/Remove certification (modal + API); Update Password (form state + API); Manage/Disable 2FA (API); Revoke session (API); Save Personal/Work/Preferences to API with validation and error handling.
5. **Observability** — ErrorBoundary per tab; Global Refresh registration; ErrorHandlerService for errors; optional telemetry for actions.
6. **Integration prep** — Profile API and payload shape ready for future mobile/hardware consumption; document expected fields and endpoints.

This audit is the basis for the phased remediation plan in `PROFILE_SETTINGS_REMEDIATION_PLAN.md`.
