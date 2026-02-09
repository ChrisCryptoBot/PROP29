# System Administration — Integration Guide

This document describes how to integrate with the System Administration module: API endpoints, data models, and extension points for mobile agents, hardware devices, and external data sources.

**Scope:** User management, roles, properties, integrations, settings, security policies, audit logs.  
**Reference:** Backend `api/system_admin_endpoints.py`; frontend `frontend/src/features/system-admin`.

---

## 1. API Endpoints

All system admin endpoints are under **`/api/system-admin`**. Auth: Bearer token; all endpoints require authentication.

| Method | Path | Purpose |
|--------|------|--------|
| `GET` | `/system-admin/users` | List admin-managed users. |
| `POST` | `/system-admin/users` | Create a new user. |
| `PUT` | `/system-admin/users/{user_id}` | Update a user. |
| `DELETE` | `/system-admin/users/{user_id}` | Delete a user. |
| `GET` | `/system-admin/roles` | List system roles. |
| `POST` | `/system-admin/roles` | Create a new role. |
| `PUT` | `/system-admin/roles/{role_id}` | Update a role. |
| `DELETE` | `/system-admin/roles/{role_id}` | Delete a role. |
| `GET` | `/system-admin/properties` | List properties. |
| `POST` | `/system-admin/properties` | Create a new property. |
| `PUT` | `/system-admin/properties/{property_id}` | Update a property. |
| `DELETE` | `/system-admin/properties/{property_id}` | Delete a property. |
| `GET` | `/system-admin/integrations` | List external integrations. |
| `GET` | `/system-admin/integrations/{integration_id}/health` | Health check for an integration. |
| `POST` | `/system-admin/integrations/{integration_id}/sync` | Trigger sync for an integration. |
| `GET` | `/system-admin/settings` | Get system-wide settings. |
| `PUT` | `/system-admin/settings` | Update system settings. |
| `GET` | `/system-admin/security-policies` | Get security policies. |
| `PUT` | `/system-admin/security-policies` | Update security policies. |
| `GET` | `/system-admin/audit` | Get audit log entries (query: `date_range`, `category`, `search`). |

**Note:** Currently, backend endpoints return stub data (empty arrays or defaults). Real persistence needs to be implemented in the backend.

---

## 2. Data Models

### AdminUser
- `id`: string (unique identifier)
- `name`: string
- `email`: string
- `role`: string (`admin`, `user`, `manager`)
- `department`: string
- `status`: string (`active`, `inactive`)
- `lastActive`: string (ISO timestamp)

### SystemRole
- `id`: string
- `icon`: string (FontAwesome icon class)
- `title`: string
- `description`: string
- `users`: number (count of users with this role)
- `permissions`: string
- `modules`: string (comma-separated module access)
- `badge`: string (display badge text)
- `badgeVariant`: `destructive` | `success` | `secondary` | `outline`

### SystemProperty
- `id`: string
- `icon`: string
- `title`: string
- `description`: string
- `rooms`: number
- `occupancy`: string (percentage or count)
- `revenue`: string (formatted currency)
- `status`: string (`Operational`, `Maintenance`, `Closed`)

### SystemIntegration
- `id`: string
- `name`: string
- `type`: string (e.g., `REST`, `WebSocket`, `MQTT`)
- `endpoint`: string (URL or connection string)
- `status`: string (`active`, `inactive`)
- `lastSync`: string (ISO timestamp)

### SystemSettings
- `systemName`: string
- `timezone`: string (e.g., `UTC`, `EST`, `PST`)
- `language`: string (e.g., `en`, `es`, `fr`)
- `dateFormat`: string (e.g., `MM/DD/YYYY`)
- `autoBackup`: boolean
- `maintenanceMode`: boolean
- `debugMode`: boolean
- `autoUpdates`: boolean
- `cacheTtl`: number (seconds)
- `maxConnections`: number
- `sessionTimeout`: number (minutes)

### SecurityPolicy
- `mfaEnabled`: boolean
- `passwordComplexity`: boolean
- `sessionTimeoutEnabled`: boolean
- `hardwareVerification`: boolean
- `ipWhitelisting`: boolean
- `vpnRequired`: boolean
- `dormantAccountSuspension`: boolean
- `ssoEnabled`: boolean
- `maxLoginAttempts`: number
- `passwordExpiryDays`: number
- `sessionTimeoutMinutes`: number

---

## 3. Mobile Agent Applications (Future)

- **User Management:** Mobile agents can be created as users via `POST /system-admin/users` with `role: 'mobile_agent'` or a custom role. Agents authenticate via standard auth endpoints.
- **Integration Registration:** Agents can register as integrations via `POST /system-admin/integrations` (when implemented) with `type: 'mobile_agent'` and endpoint pointing to agent's API.
- **Health Checks:** Agents can report health via `GET /system-admin/integrations/{integration_id}/health` or by implementing a health endpoint that System Admin can ping.

---

## 4. Hardware Devices (Plug & Play)

- **Integration Registration:** Hardware devices register as integrations via `POST /system-admin/integrations` with `type: 'hardware'` and device metadata in the endpoint or description field.
- **Health Monitoring:** System Admin can check device health via `GET /system-admin/integrations/{integration_id}/health`. Devices should implement a health endpoint that returns status.
- **Sync:** Devices can trigger sync via `POST /system-admin/integrations/{integration_id}/sync` to update last sync time and optionally pull configuration.

---

## 5. External Data Sources

- **Integration Registration:** External systems (BMS, PMS, third-party APIs) register as integrations via `POST /system-admin/integrations`.
- **Data Sync:** Use `POST /system-admin/integrations/{integration_id}/sync` to trigger data synchronization. Backend can implement sync jobs that pull/push data.
- **Webhooks:** External systems can send webhooks to System Admin endpoints (to be implemented) for real-time updates.

---

## 6. Frontend State & Extension Points

- **State Management:** `useSystemAdminState` + `SystemAdminContext`; all API calls and state updates in the hook.
- **Adding a Tab:** Add id/label in `SystemAdminOrchestrator.tsx`, add `case` in `renderTabContent()`, extend `TabId` type if needed.
- **Adding an Entity:** Implement CRUD handlers in `useSystemAdminState`, add API methods in `systemAdminApi.ts`, add backend endpoints, expose via context.
- **Error Handling:** Errors are logged via `logger` and shown via toast. Error boundaries wrap each tab for isolation.

---

## 7. Backend Implementation Notes

**Current State:** All endpoints are stubs that return empty arrays or default values. Real persistence requires:

1. **Database Models:** Add SQLAlchemy models for `AdminUser`, `SystemRole`, `SystemProperty`, `SystemIntegration`, `SystemSettings`, `SecurityPolicy`, `AuditLogEntry`.
2. **Service Layer:** Implement services (e.g., `SystemAdminService`) that handle CRUD operations and business logic.
3. **Persistence:** Wire endpoints to services; store data in database instead of returning stubs.
4. **Audit Trail:** Store audit entries in database; `GET /system-admin/audit` should query real audit logs.
5. **Validation:** Add Pydantic validation for request/response models; ensure data integrity.

---

*Last updated: 2025-02-05. Align with backend OpenAPI and frontend types when changing APIs.*
