# Incident Log — Integration Points

This module is ready for:

- **Deployment** and real-world use
- **Mobile agent applications** (when built): ingest via API and WebSocket
- **Hardware devices** (Plug & Play when configured): device health and incident source
- **External data sources**: same incidents API with `source` and metadata; idempotency keys where applicable

## API Endpoints (Backend)

| Purpose | Method | Path | Notes |
|--------|--------|------|--------|
| Core CRUD | GET/POST/PUT/DELETE | `/incidents`, `/incidents/{id}` | Implemented |
| Emergency alert | POST | `/incidents/emergency-alert` | Implemented |
| Convert alert to incident | POST | `/incidents/emergency-alert/{alert_id}/convert` | Body: `{ overrides?: object }` |
| Bulk approve | POST | `/incidents/bulk/approve` | Body: `{ incident_ids, reason?, property_id? }` |
| Bulk reject | POST | `/incidents/bulk/reject` | Body: `{ incident_ids, reason, property_id? }` |
| Bulk delete | POST | `/incidents/bulk/delete` | Body: `{ incident_ids, property_id? }` |
| Bulk status | POST | `/incidents/bulk/status` | Body: `{ incident_ids, status, reason?, property_id? }` |
| Agent performance | GET | `/incidents/agents/performance` | Query: `agent_id?`, `property_id?` |
| Agent trust score | GET | `/incidents/agents/{agent_id}/trust-score` | |
| Hardware health | GET | `/incidents/hardware/health` | Query: `property_id?` |
| Hardware device status | GET | `/incidents/hardware/{device_id}/status` | Returns default when device not registered |
| Enhanced settings | GET/PUT | `/incidents/settings/enhanced` | Query: `property_id?` |

## WebSocket Channels

Subscribe (e.g. via `useIncidentLogWebSocket`) to:

- `incident.created`, `incident.updated`, `incident.deleted`
- `emergency.alert`
- `hardware.device.status`
- `agent.submission`

## Property Context

Incident scoping uses `propertyId`: from `user.property_id` when available, else `user.roles?.[0]`. Ensure auth/user provides the correct property for multi-property deployments.

## Third-Party Development

- **State**: `useIncidentLogState` + `IncidentLogContext`; no business logic in UI components.
- **Services**: All API calls go through `IncidentService`.
- **Types**: `frontend/src/features/incident-log/types/incident-log.types.ts`; aligned with backend schemas.
