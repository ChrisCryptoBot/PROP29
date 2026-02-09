# Profile Settings Module — Phased Remediation Plan

This plan addresses **every** finding from the Production Readiness Audit so the module is fully ready for deployment, real-world use, cross-module integration, mobile/hardware readiness, external data, clean codebase, and **every button/action doing its real job**.  
**Do not apply fixes until approval is given.**

---

## Phase 1: Architecture & Data Layer

**Goal:** Decouple the monolithic component; introduce types, service, context, hooks, and tab components.

### 1.1 Types

- **Create** `frontend/src/features/profile-settings/types/profile-settings.types.ts`:
  - `UserProfile` (id, name, email, role, department, phone, employeeId, hireDate, avatar?, bio?, emergencyContact, preferences, certifications, workSchedule).
  - Role type aligned with account-settings (e.g. `TeamMemberRole` or local `ProfileRole`).
  - Request/response types: `UpdateProfileRequest`, `ChangePasswordRequest`, `AddCertificationRequest`, etc.
  - Re-use or import `getRoleDisplayName`, `getRoleColor` from a shared location (or define once here and export for account-settings if preferred).
- **Create** `types/index.ts` (re-export).

### 1.2 Service Layer

- **Create** `frontend/src/features/profile-settings/services/profileSettingsService.ts`:
  - `getProfile(): Promise<ApiResponse<UserProfile>>`
  - `updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserProfile>>`
  - `changePassword(data: ChangePasswordRequest): Promise<ApiResponse<void>>`
  - `get2FAStatus(): Promise<ApiResponse<{ enabled: boolean }>>`
  - `enable2FA()`, `disable2FA()`, `getSessions()`, `revokeSession(sessionId: string)`
  - `getCertifications()`, `addCertification(data)`, `updateCertification(id, data)`, `removeCertification(id)` (or profile includes certifications and update is via updateProfile — align with backend design).
  - Use `ApiService`; optional `property_id` if backend scopes profile by property.
- **Backend (new):**
  - `GET /api/profile` or `GET /api/me` — return current user profile (from auth + user table + profile extensions).
  - `PUT /api/profile` — update profile (allowed fields only).
  - `POST /api/profile/change-password` — body: current_password, new_password; verify current, update hash.
  - `GET /api/profile/2fa` — return { enabled: boolean }.
  - `POST /api/profile/2fa/enable`, `POST /api/profile/2fa/disable` (or similar).
  - `GET /api/profile/sessions` — list active sessions; `DELETE /api/profile/sessions/{id}` — revoke.
  - Certifications: either nested in GET/PUT profile or dedicated `GET/POST/PUT/DELETE /api/profile/certifications`; implement per backend design.

### 1.3 Context & Hooks

- **Create** `context/ProfileSettingsContext.tsx`: Provider that holds profile, loading (per resource), error, actions (updateProfile, changePassword, 2FA, sessions, certifications), refresh.
- **Create** `hooks/useProfileSettingsState.ts`: Load profile on mount; expose updateProfile, changePassword, 2FA actions, session revoke, certification CRUD; call service; use ErrorHandlerService and retry for critical ops; set loading/error.
- **Create** `hooks/index.ts` (re-export).

### 1.4 Tab Components & Orchestrator

- **Create** tab components under `components/tabs/`:
  - `PersonalInfoTab.tsx` — Personal info card(s) with edit mode; page header (page-title + subtitle); console theme; Save/Cancel call context.updateProfile.
  - `WorkDetailsTab.tsx` — Work details card; same pattern.
  - `CertificationsTab.tsx` — List of certifications (bordered divs or card); Add Certification opens modal; per-row Edit/Renew/Remove where applicable; EmptyState when 0.
  - `PreferencesTab.tsx` — Preferences card; edit mode; fix view mode to use profile.preferences.*.
  - `SecurityTab.tsx` — Change password form (controlled), Update Password → context.changePassword; 2FA block with Manage/Disable → real handlers; Sessions list from context, Revoke → context.revokeSession; Clear cache and sign out unchanged.
- **Create** `ProfileSettingsOrchestrator.tsx`: Wrap with ProfileSettingsProvider; ModuleShell with **icon** prop (e.g. `fa-user-cog`), title, subtitle, tabs; render tab by activeTab; modal state for Add/Edit Certification (and any confirm modals). Replace default export from feature with this orchestrator.
- **Keep** `ProfileSettingsModule.tsx` as legacy (or delete after cutover); feature `index.ts` exports orchestrator.

---

## Phase 2: Gold Standard UI

**Goal:** 100% alignment with UI-GOLDSTANDARD and Patrol Command Center.

### 2.1 Global (All Tabs)

- **ModuleShell:** Pass `icon={<i className="fas fa-user-cog" aria-hidden />}` (or agreed icon).
- **Page header (each tab):** Top of content: `flex justify-between items-end mb-8`; left: `<h2 className="page-title">[Tab Title]</h2>`, `<p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-85">[subtitle]</p>`.
- **Cards:** `bg-slate-900/50 border border-white/10`; CardHeader `border-b border-white/10 pb-4 px-6 pt-6`.
- **Card title:** Icon box + title: `w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/10` + Font Awesome icon + `<span className="text-sm font-black uppercase tracking-widest">Section Title</span>` (or use `card-title-text` / `card-title-icon-box` from tokens).
- **Remove:** All `bg-white`, `border-slate-200`, `text-slate-900`, `text-slate-600`, `text-slate-700`, `text-slate-500`; gradients; `shadow-lg`/`shadow-2xl`; `rounded-2xl` on avatar (use flat icon box).
- **Inputs / selects / textareas:** Standard Input and Form Label per §5/§7 (e.g. `bg-white/5 border border-white/10 rounded-md text-white`, label `block text-xs font-bold text-white mb-2 uppercase tracking-wider`).
- **Buttons:** Use `variant="subtle"` for Cancel, `variant="primary"` for Save; destructive for Remove/Disable where appropriate; ensure icon buttons have `aria-label`.

### 2.2 Personal Info Tab

- Profile header card: flat icon box (no gradient), console text tokens; Edit Profile → same behavior, styled per Gold Standard.
- Personal Information card: icon box + title; form in edit mode with console inputs; validation (required name, email; optional email format); inline error display.

### 2.3 Work Details Tab

- Same card and form rules; department select and shift select console-styled.

### 2.4 Certifications Tab

- Card with icon box + title; "Add Certification" button in header.
- List: bordered divs per item (`rounded-lg border border-white/10 p-4`); no inner light-theme cards.
- Empty state: use `EmptyState` component when certifications.length === 0.
- Add Certification: opens modal (global `Modal`); form (name, issuer, issue date, expiry date); Submit → context.addCertification (or updateProfile with new cert list); on success close and refresh.

### 2.5 Preferences Tab

- Fix view mode to display `profile.preferences.language`, `profile.preferences.timezone` (and dateFormat, theme) instead of hardcoded "English" / "America/New_York".
- Console theme for card and form.

### 2.6 Security Tab

- Change password: controlled inputs (current, new, confirm); Update Password → context.changePassword with validation (match new/confirm, strength if required); success/error toast or inline.
- 2FA block: fetch status from context; Manage 2FA → modal or dedicated flow (e.g. enable TOTP); Disable → confirm modal then context.disable2FA.
- Sessions: list from context (from API); Revoke → context.revokeSession(sessionId); loading/empty state.
- Clear cache and sign out: keep existing behavior; style button per Gold Standard (e.g. variant="warning" or outline).

---

## Phase 3: Real Workflows (Every Button Does Its Job)

**Goal:** No placeholder or toast-only actions.

### 3.1 Personal Info / Work / Preferences

- **Save Changes:** Call context.updateProfile (or updateProfile with section payload); on success: exit edit mode, show success toast, refresh profile; on error: show error (toast or inline), keep edit mode.
- **Cancel:** Revert form to current profile, exit edit mode.
- **Validation:** Required fields and format; show inline errors per §7.

### 3.2 Certifications

- **Add Certification:** Open Add Certification modal; form; Submit → context.addCertification (or updateProfile with appended cert); close and refresh on success.
- **Edit (per cert):** Open Edit Certification modal with prefilled data; Save → context.updateCertification (or updateProfile with updated cert list).
- **Remove (per cert):** Confirm modal "Remove [name]?"; Confirm → context.removeCertification(id); close and refresh.
- **Renew:** Can be Edit with new expiry or dedicated flow; ensure button exists and calls real update.

### 3.3 Security

- **Update Password:** Collect current, new, confirm; validate (current non-empty, new/confirm match, strength if policy); call context.changePassword; success toast and clear form; error toast or inline.
- **Manage 2FA:** If disabled → flow to enable (e.g. TOTP setup); if enabled → show backup codes or “manage” options; wire to backend 2FA endpoints.
- **Disable 2FA:** Confirm modal; on confirm call context.disable2FA; refresh 2FA status.
- **Revoke (session):** Call context.revokeSession(sessionId); remove from list or refresh sessions.
- **Clear cache and sign out:** Unchanged (already real).

---

## Phase 4: Backend & Integration

**Goal:** Persist profile and security actions; prepare for mobile/hardware.

### 4.1 Backend Endpoints

- Implement in `backend/api/profile_endpoints.py` (or under auth): GET/PUT profile, change-password, 2FA status/enable/disable, sessions list/revoke, certifications (if separate).
- Use existing auth (get_current_user); ensure profile and user table stay in sync where needed.
- Return consistent shape (e.g. UserProfile DTO) for GET profile; accept PATCH for partial update.

### 4.2 Frontend Service & Context

- profileSettingsService calls new endpoints; handle 401 (re-auth), 409 (conflict), 5xx (retry/backoff).
- Context loads profile on mount; all mutations go through service; set profile from API response after save so formData can be synced when opening edit again.

### 4.3 Property / Tenant

- If profile is property-scoped later, add optional property_id to GET/PUT and service; frontend can pass from useAuth or route.

---

## Phase 5: Observability & Resilience

**Goal:** Error boundaries, refresh, logging, optional telemetry.

### 5.1 ErrorBoundary

- Wrap each tab content in `ErrorBoundary` (e.g. `moduleName="ProfileSettingsPersonalInfoTab"`).

### 5.2 Global Refresh

- Register with `useGlobalRefresh` (e.g. key `profile-settings`); handler calls context.refreshProfile (or refreshData).
- Optional: Ctrl+Shift+R note in README.

### 5.3 Error Handling & Retry

- Use ErrorHandlerService for all catch blocks; no raw console.error.
- Retry for updateProfile and changePassword (e.g. retryWithBackoff with maxRetries 2).

### 5.4 Telemetry (Optional)

- Track profile_updated, password_changed, 2fa_enabled/disabled, session_revoked, certification_added/removed.

---

## Phase 6: Polish & Cross-Module

**Goal:** A11y, empty/loading states, routing, shared types.

### 6.1 Accessibility

- All icon-only or icon-primary buttons: `aria-label`.
- Modals: role="dialog", aria-modal="true", aria-labelledby.
- Form labels and required indicators per §7.

### 6.2 Loading & Empty States

- Per-tab or per-resource loading: show spinner when loading and no data; otherwise show data with disabled actions if saving.
- Certifications: EmptyState when list is empty; Security: empty state for sessions if none.

### 6.3 Routing & Cross-Module

- Canonical route: `/profile` (and optionally `/modules/profile-settings` redirects to `/profile` or vice versa). Document in README.
- If Account Settings “View” navigates to profile with userId, ensure route supports `?userId=` or state and orchestrator loads that user’s profile when permitted (or show read-only view). If not in scope, keep current-user only and link to `/profile`.

### 6.4 Shared Types

- Align role type and getRoleDisplayName/getRoleColor with account-settings (shared module or profile-settings as source of truth and account-settings imports).

---

## Phase 7: Build & Finalize

1. Run `npm run build` and `npx tsc --noEmit`; fix any errors.
2. Stop any background test processes if running.
3. Restart dev environment.
4. Notify for manual verification: each tab, each button, modals, validation, API success/error, loading and empty states.

---

## Execution Order

1. **Phase 1** — Types, backend stubs or full profile API, service, context, hooks, tab components, orchestrator.
2. **Phase 2** — Apply Gold Standard UI to all tabs and modals.
3. **Phase 3** — Wire every button to real workflow (API + validation + feedback).
4. **Phase 4** — Complete backend endpoints and frontend integration; property_id if needed.
5. **Phase 5** — ErrorBoundary, Global Refresh, ErrorHandlerService, retry, optional telemetry.
6. **Phase 6** — A11y, empty/loading, routing, shared types.
7. **Phase 7** — Build, tsc, restart, handover for QA.

**Approval gate:** Proceed with implementation only after explicit approval. Apply all phases until the module is fully production-ready as defined above.
