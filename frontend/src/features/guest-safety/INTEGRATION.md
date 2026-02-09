# Guest Safety — Integration Points

This module is ready for:

- **Deployment** and real-world use
- **Mobile agent applications** (when built): ingest via API and WebSocket
- **Hardware devices** (Plug & Play when configured): device status and incident source
- **External data sources**: same incidents API with `source` and `source_metadata`; evacuation and mass notification endpoints
- **Third-party development**: see [README.md](./README.md) and extension points below

**Tabs**: Incidents, Messages, Mass Notification, Evacuation, Analytics, Settings. (Response Teams tab removed; teams API still used for assigning a team to an incident.)

**Evacuation**: Start protocol (mass notification); **End Evacuation** (all clear, return to rooms); **All Clear — False Alarm** (stand-down, no evacuation required — same mass notification endpoint, different message).

## API Endpoints (Backend)

All paths are under the `/guest-safety` prefix.

| Purpose | Method | Path | Notes |
|--------|--------|------|--------|
| Incidents list | GET | `/guest-safety/incidents` | Query: optional filters |
| Create incident | POST | `/guest-safety/incidents` | Body: title, description, location, severity, guest_involved?, room_number?, contact_info? |
| Update incident | PUT | `/guest-safety/incidents/{incident_id}` | Body: partial incident fields |
| Delete incident | DELETE | `/guest-safety/incidents/{incident_id}` | |
| Resolve incident | PUT | `/guest-safety/incidents/{incident_id}/resolve` | |
| Send message to guest | POST | `/guest-safety/incidents/{incident_id}/message` | Body: `{ message }` |
| Response teams (assign to incident) | GET | `/guest-safety/teams` | Used by Assign Team modal only |
| Settings | GET / PUT | `/guest-safety/settings` | PUT body: alertThreshold?, autoEscalation?, notificationChannels?, responseTeamAssignment? |
| Mass notification | POST | `/guest-safety/notifications` | Body: message, recipients, priority, channels (matches frontend MassNotificationData) |
| Evacuation headcount | GET | `/guest-safety/evacuation/headcount` | Returns totalGuests, safe, unaccounted, inProgress, lastUpdated |
| Evacuation check-ins | GET | `/guest-safety/evacuation/check-ins` | |
| Submit evacuation check-in | POST | `/guest-safety/evacuation/check-in` | Body: guestId, status, location?, notes? (guest app) |
| Ingest mobile agent | POST | `/guest-safety/incidents/ingest/mobile-agent` | Body: agent_id, title, description, location, severity, etc. |
| Ingest hardware device | POST | `/guest-safety/incidents/ingest/hardware-device` | Body: device_id, title, description, location, severity, etc. |
| Ingest guest panic | POST | `/guest-safety/incidents/ingest/guest-panic` | Body: guest_id, location, etc. |
| Guest messages | GET | `/guest-safety/messages` | Query: incident_id?, unread_only?, etc. |
| Mark message read | PUT | `/guest-safety/messages/{message_id}/read` | |
| Hardware devices | GET | `/guest-safety/hardware/devices` | Returns list; empty when none configured |
| Mobile agent metrics | GET | `/guest-safety/mobile-agents/metrics` | Returns totalAgents, activeAgents, submissionsToday, etc. |

Incident response includes: `id`, `title`, `description`, `location`, `severity`, `status`, `type` (evacuation, medical, security, maintenance, service, noise, other), `reported_at`, `guest_involved`, `room_number`, `assigned_team`, `source`, `source_metadata`.

## WebSocket Channels

Subscribe (e.g. via `useWebSocket`) to:

- `guest_safety_incident` — new incident created; payload: `{ incident }`
- `guest_safety_incident_update` — incident updated; payload: `{ incident }`
- `hardware_device_status` — hardware status change; payload: `{ devices }` (frontend may refetch `/guest-safety/hardware/devices`)
- `mobile_agent_update` — agent metrics update; payload: `{ metrics }` (frontend may refetch `/guest-safety/mobile-agents/metrics`)
- `guest_message` — new guest message; payload: `{ message }`

## Property Context

Guest safety scoping uses property from backend `_get_default_property_id(db, user_id)` (first user property or first role). Frontend does not send property_id on every request; backend derives it. For multi-property deployments, ensure user/property association is correct.

## Edge Cases and Behavior

- **Evacuation flow**: Start Evacuation creates an incident (title/description with "evacuation") so headcount and check-ins APIs have an active incident; then the mass notification is sent. End Evacuation and All Clear — False Alarm send the mass notification, then resolve that evacuation incident so state stays in sync.
- **Offline**: Evacuation (Start, End, Stand-down) and Mass Notification send are disabled when `isOffline`; banner at top of module explains. Other reads use last-known state.
- **Assign Team**: Teams are refreshed when the Assign Team modal opens so the list is current; if no teams are available, submit is disabled and a message is shown.
- **Concurrent updates**: If another user resolves an incident before this user confirms resolve, the resolve API may return an error; the hook shows a generic error and the list will refresh on next load or global refresh.
- **Stale data**: Global refresh (Ctrl+Shift+R) and per-tab refresh buttons refetch; during active evacuation, headcount/check-ins auto-refresh every 30s.

## Third-Party Development

- **State**: `useGuestSafetyState` + `GuestSafetyContext`; no business logic in UI components.
- **Services**: All API calls go through `guestSafetyService` (`frontend/src/features/guest-safety/services/guestSafetyService.ts`).
- **Types**: `frontend/src/features/guest-safety/types/guest-safety.types.ts`; aligned with backend schemas.
- **Adding a tab**: Add tab id/label to `tabs` in `GuestSafetyOrchestrator.tsx`, add `case 'tab-id': return <YourTab />` in `renderTab()`, and extend `TabId` in `guest-safety.types.ts`.
- **Adding an action**: Implement in `useGuestSafetyState`, expose via context, and call from UI; use `trackAction` from `useGuestSafetyTelemetry` for observability and `ErrorHandlerService.logError` in catch blocks.
