# Property Items — Integration Points

This module is ready for:

- **Deployment** and real-world use
- **Mobile agent applications** (when built): ingest via API and WebSocket
- **Hardware devices** (Plug & Play when configured): device status and package/lost-item source
- **External data sources**: same Lost & Found and Package APIs with optional `source` / `source_metadata`; unified export
- **Third-party development**: extension points and API contracts below

**Tabs**: Overview (unified), Lost & Found, Packages, Analytics, Settings.

**Offline**: Last Known Good State is saved after refresh and after mutations (create/update/delete). When back online, Sync replays queued actions against Lost & Found and Package APIs with retry. In-app confirmation modals are used for delete and unsaved-close (no `window.confirm`).

## API Endpoints (Backend)

The module uses two submodules; backend may expose under a single prefix or separate.

### Lost & Found

| Purpose | Method | Path | Notes |
|--------|--------|------|--------|
| List items | GET | `/lost-found/items` | Query: property_id?, status?, item_type?, date_from?, date_to? |
| Get item | GET | `/lost-found/items/{item_id}` | |
| Create item | POST | `/lost-found/items` | Body: property_id, description, category?, location?, found_date?, status?, value_estimate? (optional; focus is ownership/deliverability) |
| Update item | PUT | `/lost-found/items/{item_id}` | Body: partial item fields |
| Delete item | DELETE | `/lost-found/items/{item_id}` | |
| Claim item | POST | `/lost-found/items/{item_id}/claim` | Body: claim data (guest_id, claimed_at, etc.) |
| Notify guest | POST | `/lost-found/items/{item_id}/notify` | Body: guest_id? |
| Metrics | GET | `/lost-found/metrics` | Query: property_id?, date_from?, date_to? |
| Settings | GET / PUT | `/lost-found/settings` | Query: property_id? |
| Export report | GET | `/lost-found/reports/export` | Query: format=pdf|csv, start_date?, end_date?, property_id? |

### Packages

| Purpose | Method | Path | Notes |
|--------|--------|------|--------|
| List packages | GET | `/packages` | Query: property_id?, status? |
| Get package | GET | `/packages/{package_id}` | |
| Create package | POST | `/packages` | Body: property_id, tracking_number, sender_name, sender_contact?, description?, size?, weight?, location?, notes? |
| Update package | PUT | `/packages/{package_id}` | Body: partial package fields |
| Delete package | DELETE | `/packages/{package_id}` | Caller must show confirmation before calling |
| Notify guest | POST | `/packages/{package_id}/notify` | Query: guest_id? |
| Deliver | POST | `/packages/{package_id}/deliver` | Query: delivered_to? |
| Pickup | POST | `/packages/{package_id}/pickup` | |
| Settings | GET / PUT | `/packages/settings` | Query: property_id? |

### Unified Property Items

| Purpose | Method | Path | Notes |
|--------|--------|------|--------|
| Unified export | GET | `/property-items/export` | Query: format=csv|pdf, period?, start_date?, end_date?, property_id?, include_lost_found?, include_packages? |

## Offline Sync

When syncing the offline queue, 4xx errors (e.g. validation) are not treated as success: the action remains in the queue for retry or manual review. Only 5xx or network errors trigger retry; 4xx returns `false` from `onSyncAction` so the item is not removed.

## WebSocket Channels

Subscribe (e.g. via `usePropertyItemsWebSocket` or `useWebSocket`) to:

- `lost_found_item_created` — new Lost & Found item; payload: `{ item }`
- `lost_found_item_updated` — item updated; payload: `{ item }`
- `lost_found_item_deleted` — item deleted; payload: `{ item_id }`
- `package_created` — new package; payload: `{ package }`
- `package_updated` — package updated; payload: `{ package }`
- `package_deleted` — package deleted; payload: `{ package_id }`

**Payload contract:** Backend must send `item` (Lost & Found item object with `item_id` or `id`), `item_id` (string for delete), `package` (package object with `package_id` or `id`), and `package_id` (string for delete). Frontend handlers use these to refresh lists and track telemetry.

The Property Items WebSocket hook uses refs for callbacks so subscription is stable and does not re-subscribe on every render.

## Property Context

Property ID is derived from user (e.g. first role or default property). Frontend may send `property_id` in query params where the backend expects it. Ensure user/property association for multi-property deployments.

## Edge Cases and Behavior

- **Offline**: When `isOffline`, a top-of-content banner is shown. Refresh and Export are still available but may fail; Sync is disabled until online. Queued create/update/delete actions are replayed when the user clicks Sync after connection is restored. Last Known Good State is saved after refresh and after list changes (debounced) so offline load can show last cached data.
- **Delete confirmation**: Single and bulk delete in Packages do not confirm inside the hook; the UI must show an in-app confirmation modal before calling `deletePackage` or `bulkDelete`. PackageDetailsModal and RegisterPackageModal use in-app modals for delete and unsaved-close.
- **Concurrent updates**: WebSocket and refresh can update the same lists; no request deduplication. After a mutation, LKG is updated (debounced) so offline view stays in sync.
- **Error observability**: Orchestrator and Lost & Found / Package hooks use `ErrorHandlerService.logError` in catch blocks with context (e.g. `LostFound:createItem`, `Package:deletePackage`). Telemetry (trackAction, trackPerformance) is used in the orchestrator.
- **Circuit breaker**: Optional. `PropertyItemsCircuitBreaker` exists in services but is not wired into the orchestrator or submodule API calls. Can be integrated for fail-fast when backend is unhealthy.

## Third-Party Development

- **State**: Lost & Found uses `useLostFoundState` + `LostFoundContext`; Packages use `usePackageState` + `PackageContext`. The orchestrator composes both via `LostFoundProvider` and `PackageProvider`.
- **Services**: Lost & Found API calls go through `LostFoundService` (`frontend/src/features/lost-and-found/services/LostFoundService.ts`). Package API calls go through `PackageService` (`frontend/src/features/packages/services/PackageService.ts`). Unified export uses `PropertyItemsExportService` (`frontend/src/features/property-items/services/PropertyItemsExportService.ts`).
- **Offline**: `usePropertyItemsOffline` manages LKG cache and offline queue; it requires `onSyncAction` from the orchestrator to replay queued actions. Ensure `NetworkStatusProvider` wraps the app so `isOffline` is accurate.
- **Adding an action**: Implement in the relevant hook (`useLostFoundState` or `usePackageState`), expose via context, and call from UI; use `ErrorHandlerService.logError` in catch blocks and optional telemetry from `usePropertyItemsTelemetry` in the orchestrator.
