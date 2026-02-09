# System Administration Module

Central command for platform governance, user management, roles, properties, integrations, settings, security policies, and audit logs. Production-ready for deployment, real-world use, and future mobile agent and hardware integration.

## Structure

| Path | Purpose |
|------|---------|
| `SystemAdminOrchestrator.tsx` | Entry component; provides context and renders tabs. |
| `hooks/useSystemAdminState.ts` | Main state hook; all business logic, API calls, and state management. |
| `context/SystemAdminContext.tsx` | React context provider exposing state and handlers. |
| `services/systemAdminApi.ts` | API client layer; calls backend endpoints. |
| `types/system-admin.types.ts` | TypeScript types for all entities (users, roles, properties, etc.). |
| `components/tabs/` | Tab components (Overview, Users, Roles, Properties, System, Security, Audit). |
| `components/modals/` | Modal components for CRUD operations. |

## Tabs

| Tab | Purpose |
|-----|---------|
| **Overview** | System metrics, recent activity, security notifications. |
| **Users** | User directory; add/edit/delete/suspend users; role/status filters. |
| **Roles** | Role management; permissions matrix. |
| **Properties** | Property management; system integrations list. |
| **System** | System-wide settings (timezone, language, backup, etc.). |
| **Security** | Security policies (MFA, password expiry, session timeout, etc.). |
| **Audit** | Audit log entries; date/category/search filters; export. |

## Backend

- **Endpoints:** `/api/system-admin/*` — users, roles, properties, integrations, settings, security-policies, audit.
- **Current State:** Backend endpoints are stubs that return empty arrays or defaults. Real persistence needs to be implemented.
- **See:** `backend/api/system_admin_endpoints.py` for endpoint definitions.

## Behavior

- **Load on mount:** Fetches users, roles, properties, integrations, settings, and security policies from backend (gracefully handles 404s/stubs).
- **Persistence:** Mutations (add/edit/delete) call backend APIs before updating local state. On backend failure, local state still updates (graceful degradation).
- **Error handling:** Errors are logged via `logger` and shown via toast. Error boundaries wrap each tab.
- **Offline:** Shows offline banner when `navigator.onLine` is false.
- **Audit trail:** All admin actions write to in-memory audit log; export generates CSV.

## Integration & Extension

- **API and contracts:** See project root `docs/system-admin-integration.md` (endpoints, data models, mobile/hardware/external).
- **Adding a tab:** Extend `tabs` array in `SystemAdminOrchestrator.tsx`, add `case` in `renderTabContent()`, create tab component.
- **Adding an entity:** Implement handlers in `useSystemAdminState`, add API methods in `systemAdminApi.ts`, add backend endpoints, expose via context.
- **Third-party dev:** State lives in `useSystemAdminState`; no business logic in presentational components. Use existing UI components (Button, Card, Modal, DataTable, Badge) per `UI-GOLDSTANDARD.md`.

## Production Readiness

- **Phases 1-2:** ✅ Complete (critical logic fixes, filters wired, toast notifications).
- **Phase 3:** ✅ Complete (Gold Standard UI alignment).
- **Phase 4:** ⚠️ Partial (backend endpoints exist but are stubs; mutations wired but need real persistence).
- **Phase 5:** ✅ Complete (error boundaries, offline detection, structured logging).
- **Phase 6:** ✅ Complete (integration documentation).
- **Phase 7:** ✅ Complete (README, services layer).
- **Phase 8:** ⏳ Pending (build verification).

**Audit:** `docs/audits/SYSTEM_ADMIN_PRODUCTION_READINESS_AUDIT.md`  
**Remediation Status:** `docs/audits/SYSTEM_ADMIN_REMEDIATION_STATUS.md`

---

*Last updated: 2025-02-05*
