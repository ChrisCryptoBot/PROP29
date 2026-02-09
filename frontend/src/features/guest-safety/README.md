# Guest Safety Module

Production-ready module for incident management, mass notification, evacuation comms, and guest messaging. Designed for deployment, real-world use, future mobile agent apps, plug-and-play hardware, and external data sources.

## Tabs

| Tab | Purpose |
|-----|--------|
| **Incidents** | Create, filter, assign team, resolve; source from manager, mobile agent, hardware, or guest panic |
| **Messages** | Guest–staff messaging; filter by incident, unread, type |
| **Mass Notification** | Broadcast to all/VIP/floor/room via in-app, SMS, email (admin only) |
| **Evacuation** | Start evacuation protocol, headcount, check-ins; **End Evacuation** (return to rooms) and **All Clear — False Alarm** (stand-down, no evacuation required) |
| **Analytics** | Safety metrics, response times, categories |
| **Settings** | Alert threshold, auto-escalation, notification channels, team assignment mode |

## Deployment

- **Backend**: All APIs under `/guest-safety`; property scoped via backend `_get_default_property_id`. No frontend env vars required for base paths if API is same origin.
- **Auth**: RBAC drives `canAssignTeam`, `canResolveIncident`, `canSendNotification`, `canManageSettings`. Ensure backend roles are configured.
- **Offline**: Module shows an offline banner and uses last-known state; actions may fail until connection is restored.

## Real-World Use

- **Comms**: Primary coordination often via walkie-talkie; this module supports logging, structured alerts, mass notification, and clear **All Clear** / stand-down for evacuations.
- **Evacuation**: Two actions when evacuation is active: **End Evacuation** (evacuation complete, return to rooms) and **All Clear — False Alarm** (no evacuation required; disregard previous message).

## Mobile Agent Applications (Future)

- **Ingest**: `POST /guest-safety/incidents/ingest/mobile-agent` with `agent_id`, `title`, `description`, `location`, `severity`, etc. Incidents appear with `source: 'MOBILE_AGENT'` and optional `source_metadata`.
- **Metrics**: `GET /guest-safety/mobile-agents/metrics`; WebSocket `mobile_agent_update` for live metrics.
- **State**: No business logic in UI; all in `useGuestSafetyState`. Add agent-specific actions in the hook and expose via context.

## Hardware Devices (Plug & Play)

- **Ingest**: `POST /guest-safety/incidents/ingest/hardware-device` with `device_id`, `title`, `description`, `location`, `severity`, etc. Incidents show `source: 'HARDWARE_DEVICE'` and device metadata.
- **Status**: `GET /guest-safety/hardware/devices`; WebSocket `hardware_device_status`. Settings tab shows last-known-good when offline.
- **Types**: Panic buttons, sensors, cameras, access control, alarms, environmental; extend backend/frontend types as needed.

## External Data Sources

- Use same incidents API: include `source` and `source_metadata` on create/update. Supported sources: `MANAGER`, `MOBILE_AGENT`, `HARDWARE_DEVICE`, `AUTO_CREATED`, `GUEST_PANIC_BUTTON`.
- **Guest panic**: `POST /guest-safety/incidents/ingest/guest-panic` with `guest_id`, `location`, etc.
- **Mass notification / evacuation**: Same endpoints; call from external systems with proper auth.

## Third-Party Development

- **Integration details**: See [INTEGRATION.md](./INTEGRATION.md) for API table, WebSocket channels, property context, and extension points.
- **State**: `useGuestSafetyState` + `GuestSafetyContext`; no business logic in components.
- **Services**: All API calls in `guestSafetyService.ts`.
- **Types**: `guest-safety.types.ts`; keep aligned with backend schemas.
- **Adding a tab**: Add id/label in `GuestSafetyOrchestrator.tsx`, add `case` in `renderTab()`, extend `TabId` in types.
- **Adding an action**: Implement in `useGuestSafetyState`, expose via context, call from UI; use `trackAction` from `useGuestSafetyTelemetry` and `ErrorHandlerService.logError` in catch blocks.
