# Account Settings

**Location:** `frontend/src/features/account-settings`  
**Import:** `import AccountSettings from './features/account-settings'` or `@/features/account-settings`  
**Route:** Rendered at `/settings` (Sidebar: Account Settings)

Team and account configuration: team management, team settings, integrations, role permissions.

## Structure

- **AccountSettingsOrchestrator** — Default export. Wraps content in `AccountSettingsProvider`, renders `ModuleShell` with icon and tabs, owns modal state, registers with Global Refresh.
- **context/AccountSettingsContext** — Provider and `useAccountSettingsContext()`; state and actions from `useAccountSettingsState`.
- **hooks/useAccountSettingsState** — Loads team, settings, integrations, permissions; exposes CRUD and `refreshData`; uses `ErrorHandlerService` and retry for mutations; scopes by `property_id` from user.
- **services/accountSettingsService** — API client for `/account-settings/*` (team-members, team-settings, integrations, role-permissions).
- **components/tabs** — TeamManagementTab, TeamSettingsTab, IntegrationsTab, PermissionsTab (each wrapped in ErrorBoundary by orchestrator).
- **components/modals** — AddMemberModal, EditMemberModal, ConfirmRemoveModal, AddIntegrationModal (use shared `Modal`).

## Global Refresh

The module registers with `GlobalRefreshContext` under the key `account-settings`. On global refresh (e.g. **Ctrl+Shift+R** or focus-after-stale), `refreshData()` is called (team, settings, integrations).

## Usage

Mount the feature where the app renders the settings route (e.g. `App.tsx` or a route component). No props required; context provides user and property scoping.
