# Visitor Security Module

Visitor registration, event coordination, security requests, banned-individual checks, and integration points for mobile agents and hardware devices.

## Readiness Summary

| Dimension | Ready | Notes |
|-----------|-------|------|
| **Deployment** | Yes | Build passes; backend `/api/visitors` (CRUD, events, security-requests, assign) required. |
| **Real-world use** | Yes | CRUD, check-in/out, QR, security requests, assign, conflict resolution, offline queue, banned check, Gold Standard UI. |
| **Mobile agents** | Contract-ready | Types, service methods, WebSocket channel, offline queue in place. Backend may expose `/api/visitors/mobile-agents/*` or use existing `/api/mobile-agents` with property scope. |
| **Hardware (plug & play)** | Contract-ready | Types, service methods, heartbeat, UI. Backend may expose visitor-scoped hardware routes when devices are configured. |
| **External data** | Yes | Property-scoped; `propertyId` from user when backend provides it; telemetry integration point documented. |
| **3rd-party development** | Yes | README, structure, API contract, UI-GOLDSTANDARD, telemetry and property notes. |

## Overview

- **Deployment:** Production-ready for MSO desktop (manager/admin). Requires backend `/visitors` API and optional WebSocket channels.
- **Real-world use:** Visitor CRUD, check-in/out, QR codes, security requests, conflict resolution, offline queue, banned-individual check on registration.
- **Mobile agents:** Types and API stubs for devices, submissions, sync; WebSocket hook subscribes to `visitor-security.*` when backend provides channels.
- **Hardware:** Types and API for devices, card readers, cameras, badge printers; heartbeat-based offline detection. Plug-and-play depends on backend configuration.
- **External data:** Property-scoped; `propertyId` from user (`property_id` / `assigned_property_ids` when provided by backend).

## Structure

- **`VisitorSecurityModuleOrchestrator.tsx`** — Entry; wraps content in `VisitorProvider`, renders `ModuleShell` and tabs.
- **`context/VisitorContext.tsx`** — Exposes `useVisitorState()` as `useVisitorContext()`.
- **`hooks/useVisitorState.ts`** — Core state, CRUD, filters, offline queue, conflict resolution, security request assign.
- **`hooks/useVisitorWebSocket.ts`** — Real-time: subscribes to `visitor-security.*` (visitor/event/security-request/mobile-agent/hardware).
- **`hooks/useVisitorQueue.ts`** — Offline queue (localStorage); flush on reconnect; retry failed.
- **`hooks/useVisitorTelemetry.ts`** — Actions, performance, errors; integrate with Sentry/Analytics API in `trackEvent()`.
- **`services/VisitorService.ts`** — All backend calls; static import for `ErrorHandlerService`.
- **`types/visitor-security.types.ts`** — Enums and interfaces aligned with backend schemas.

## Tabs

| Tab | Purpose |
|-----|--------|
| Overview | Dashboard: metrics, system status |
| Visitors | Registry, filters (all / registered / checked_in / checked_out / overdue / cancelled), check-in/out, QR |
| Events | Event list, create/delete, badge types |
| Security Requests | Requests + agent submissions; assign to current user via API |
| Banned Individuals | Wraps Banned Individuals feature (Overview, Records) |
| Badges & Access | Checked-in visitors, hardware status, badge print |
| Mobile Config | Mobile agents, registration, submissions, sync |

## API Contract

- **Base:** `GET/POST/PATCH/DELETE /visitors`, `/visitors/events`, `/visitors/security-requests`, `/visitors/security-requests/:id` (PATCH assign), `/visitors/mobile-agents/*`, `/visitors/hardware/*`, `/visitors/system/*`.
- **Auth:** Bearer token; property access enforced by backend.
- **Conflict:** `updateVisitor` returns 409 → `conflictInfo` set; `handleConflictResolution('overwrite'|'merge'|'cancel')` re-submits or clears.

## Telemetry & Audit

- **Telemetry:** `useVisitorTelemetry` — `trackAction`, `trackPerformance`, `trackError`. Wire to Sentry/Analytics in `VisitorTelemetry.trackEvent()` (see comment in `useVisitorTelemetry.ts`).
- **Audit:** Backend is responsible for audit logging; frontend does not call a dedicated audit endpoint.

## Offline & Real-Time

- **Offline:** When `!navigator.onLine`, create/update/delete/check-in/out/security-request/event operations are enqueued; toast "Queued for sync when online". `retryQueue()` and flush on reconnect refresh visitors, events, security requests.
- **Real-time:** `useVisitorWebSocket` subscribes to backend channels; callbacks update state (e.g. visitor created/updated). Requires backend WebSocket server and channel naming as in the hook.

## Third-Party Development

- Follow `UI-GOLDSTANDARD.md` for layout, spinners, page titles, modals, buttons.
- New tabs: add to `ModuleShell` `tabs` and render in orchestrator; use `useVisitorContext()` for data and actions.
- New API: add method in `VisitorService`, then expose via `useVisitorState` and context type.
- Property ID: prefer `user.property_id` or `user.assigned_property_ids[0]` when backend provides them; fallback remains `roles[0]` or `'default-property-id'`.
