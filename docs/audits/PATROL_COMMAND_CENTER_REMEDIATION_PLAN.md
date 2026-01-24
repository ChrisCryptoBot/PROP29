# Patrol Command Center — Full Remediation Plan (to 100% Ready)

**Goal:** Address all audit gaps until the module is production-ready.  
**Reference:** [PATROL_COMMAND_CENTER_FINAL_AUDIT.md](./PATROL_COMMAND_CENTER_FINAL_AUDIT.md)

---

## Quick reference

| # | Item | Phase | Notes |
|---|------|--------|--------|
| 1 | Wire `offlineMode` / `realTimeSync` to runtime | 1 | Banner copy, refresh intervals |
| 2 | Persist Patrol Management filters (search, priority, history) | 1 | `localStorage` |
| 3 | Critical checkpoint prominence (Routes & Checkpoints) | 1 | Red border/icon on rows |
| 4 | Check-in undo (queued only, 5s) | 1 | Remove from queue + revert local |
| 5 | UI Gold Standard sweep (CTA shadows, borders) | 1 | All Patrol tabs |
| 6 | Request_id deduplication (check-in) | 2 | In-memory cache, TTL |
| 7 | Heartbeat API + `last_heartbeat` / `connection_status` | 2 | In-memory or DB |
| 8 | Route “last used” when patrol completes | 2 | Backend updates route |
| 9 | Version/409 on patrol update | 3 | DB migration + service + frontend |
| 10 | Weather (optional), officer status from heartbeat | 4 | Configurable |
| 11 | Modularize `usePatrolState` | 5 | usePatrolActions, useRouteActions, etc. |
| 12 | Heartbeat threshold in Settings | 6 | `heartbeatOfflineThresholdMinutes` |

---

## Overview

| Phase | Scope | Backend | DB | Est. Effort |
|-------|--------|---------|-----|-------------|
| **1** | Settings behavior, filter persistence, critical checkpoint UX, check-in undo (queued), UI sweep | No | No | Small |
| **2** | Request_id dedup, heartbeat API + storage, “last used” on completion | Yes | Optional* | Medium |
| **3** | Version/409 optimistic locking | Yes | Yes | Medium |
| **4** | Weather (optional), wire officer status from heartbeat | Yes | No | Small |
| **5** | Modularize `usePatrolState` | No | No | Medium |
| **6** | Hardware heartbeat threshold in Settings, polish | Both | No | Small |

\* Heartbeat can use in-memory cache first; optionally persist via new table or user JSON.

---

## Phase 1 — Frontend-Only (No Backend/DB)

### 1.1 Wire settings toggles to runtime

**Gap:** `offlineMode`, `realTimeSync` etc. persist but do not change behavior.

**Tasks:**
- [ ] **Offline mode:** When `settings.offlineMode` is `true`, treat app as “offline-capable” (e.g. show a subtle “Offline mode enabled” note in the offline banner when `navigator.onLine` is false). When `false`, optionally hide or soft-disable queue-related UI (e.g. “Queued for sync” messaging) and show “Online only” in banner. **Note:** Real offline is still driven by `navigator.onLine`; this is purely UX.
- [ ] **Real-time sync:** When `settings.realTimeSync` is `true`, keep existing 15–30s refresh intervals. When `false`, increase interval (e.g. 60–120s) or disable auto-refresh; keep manual refresh always available.
- [ ] Ensure `usePatrolState` (or a small `usePatrolSettingsEffects` helper) reads `settings` from context and configures refresh intervals / banner copy accordingly.

**Files:** `usePatrolState.ts`, `PatrolCommandCenterOrchestrator.tsx` (banner), `DashboardTab` / `PatrolManagementTab` / `EventsTab` / `AccessPointsTab` (where `setInterval` refresh runs), `SettingsTab.tsx`.

---

### 1.2 Filter persistence (Patrol Management)

**Gap:** Filters reset on reload.

**Tasks:**
- [ ] Persist `patrolSearchQuery`, `patrolPriorityFilter`, `patrolHistoryFilter` to `localStorage` (e.g. `patrol-management.filters`).
- [ ] On mount, hydratate filters from `localStorage`; on change, debounce and write back.
- [ ] Optional: per-tab filter keys if other tabs add filters later.

**Files:** `PatrolManagementTab.tsx`.

---

### 1.3 Critical checkpoint prominence (Routes & Checkpoints)

**Gap:** Critical flag exists but could be more prominent.

**Tasks:**
- [ ] In **Route list** (view route): when listing checkpoints, give critical ones a distinct style (e.g. `border-red-500/30`, left accent, or icon).
- [ ] In **Checkpoint Management** list: enhance current Critical badge — e.g. red border on row, `bg-red-500/5`, or icon `fa-exclamation-triangle` next to name.
- [ ] Keep existing `Badge variant="destructive"`; add container-level styling for critical rows.

**Files:** `RoutesCheckpointsTab.tsx`, any “View route” / checkpoint list UI.

---

### 1.4 Check-in undo (queued only)

**Gap:** No undo window for check-ins.

**Tasks:**
- [ ] **Scope:** Undo only for **queued** check-ins (network failed → added to queue). Synced check-ins stay as-is (no backend revert in this phase).
- [ ] After queueing a check-in, show a toast with “Undo” (e.g. 5s window). On Undo: remove that entry from `useCheckInQueue` (by `id` or `request_id`) and revert the checkpoint to `pending` in `upcomingPatrols` (and clear `syncStatus`).
- [ ] Ensure queue `enqueue` returns an `id` (already does); pass it to toast logic. Add `removeQueuedCheckIn(id: string)` (or equivalent) to `useCheckInQueue` and call it on Undo.
- [ ] If implementing via `react-hot-toast`, use a custom toast with an Undo button that triggers removal + state revert.

**Files:** `useCheckInQueue.ts`, `usePatrolState.ts` (`handleCheckpointCheckIn`), toast usage.

---

### 1.5 UI Gold Standard sweep

**Gap:** Minor CTA shadows, border tokens.

**Tasks:**
- [ ] Audit all Patrol module tabs for `shadow-blue-500/20`, `shadow-red-500/30`, etc. on buttons; replace with glass/outline styling per UI-GOLDSTANDARD.
- [ ] Replace `border-[color:var(--border-subtle)]/50` or similar with `border-white/5` where applicable.
- [ ] Ensure metric values use `text-white`; mono for IDs, etc.

**Files:** `DashboardTab`, `PatrolManagementTab`, `DeploymentTab`, `RoutesCheckpointsTab`, `SettingsTab`, shared `PatrolModule` components (e.g. `OfficerMatchingPanel`, `RouteOptimizationPanel`).

---

## Phase 2 — Backend: Dedup, Heartbeat, “Last Used”

### 2.1 Request_id deduplication (check-in)

**Gap:** Backend does not dedupe by `(patrol_id, checkpoint_id, request_id)`.

**Tasks:**
- [ ] Add an in-memory cache (e.g. `dict` or `cachetools.TTLCache`) keyed by `(patrol_id, checkpoint_id, request_id)`. TTL e.g. 24h.
- [ ] In `check_in_checkpoint`: if `request_id` present and key exists, return existing patrol response (same as “already completed”) **without** updating DB or writing audit again.
- [ ] If no `request_id`, skip dedup (existing behavior).
- [ ] Document that server restart clears cache; acceptable for duplicate retries soon after.

**Files:** `backend/services/patrol_service.py`.

---

### 2.2 Heartbeat API + storage

**Gap:** No `/patrols/officers/{id}/heartbeat`; `last_heartbeat` / `connection_status` never updated.

**Tasks:**
- [ ] **Option A (no DB):** In-memory store `officer_id -> last_heartbeat_ts`. `POST /patrols/officers/{id}/heartbeat` updates it. `GET /patrols/officers` (or existing officer response) includes `last_heartbeat` and derived `connection_status` (e.g. &lt; 5 min → online, &gt; 15 min → offline). Reset on server restart.
- [ ] **Option B (with DB):** Add `officer_heartbeats` table (`officer_id`, `last_heartbeat`, `device_id`) or columns on `users` / guards. Heartbeat endpoint updates it; officer fetch joins or appends it.
- [ ] Add `last_heartbeat` and `connection_status` to API contract (schema) for officers.
- [ ] Frontend already supports these fields; ensure patrol officer mapping uses them when returned.

**Files:** `backend/api/patrol_endpoints.py`, `backend/services/patrol_service.py`, `backend/schemas.py`, optional migration.

---

### 2.3 “Last used” on route when patrol completes

**Gap:** Route `lastUsed` not driven by patrol completion.

**Tasks:**
- [ ] When a patrol is **completed**, backend updates the associated route’s `updated_at` (or a dedicated `last_used_at` if you add it). Association: `patrol.route` / `route_id` or equivalent.
- [ ] Frontend already maps `updated_at` → `lastUsed`; no change if you use `updated_at`. Otherwise map `last_used_at` → `lastUsed`.

**Files:** `backend/services/patrol_service.py` (e.g. in `complete_patrol` or equivalent), optionally `PatrolRoute` model.

---

## Phase 3 — Backend + DB: Version / 409

### 3.1 Optimistic locking (version/409)

**Gap:** Concurrent deploy still possible; no version check.

**Tasks:**
- [ ] Add `version` column to `patrols` (integer, default 0). Migration.
- [ ] Add `version` to `PatrolUpdate` schema and to patrol response.
- [ ] In `update_patrol`: if `version` sent, check `patrol.version === payload.version`. If not, return **409 Conflict** with message e.g. “Patrol was updated elsewhere; refresh and retry.”
- [ ] On successful update, increment `patrol.version` and return it.
- [ ] Frontend: include `version` in deploy/reassign/update requests when available. On 409, refresh patrol data, show toast “Conflict; please retry,” and optionally reopen deployment modal.

**Files:** Migration, `models.py`, `schemas.py`, `patrol_service.py`, `patrol_endpoints.py`, `usePatrolState.ts`, `PatrolEndpoint.ts`.

---

## Phase 4 — Optional Integrations & Wiring

### 4.1 Weather (optional)

**Gap:** Dashboard weather is placeholder.

**Tasks:**
- [ ] Add a minimal weather service (e.g. Open-Meteo or configurable env) that returns `temperature`, `condition`, `patrolRecommendation`.
- [ ] Call it from `usePatrolState` or Dashboard, map to `weather` in context. Handle loading/error (keep placeholder on failure).
- [ ] Make it **optional** via env (e.g. `PATROL_WEATHER_ENABLED=false`); when disabled, keep current placeholder.

**Files:** New `backend/services/weather_service.py` or similar, `patrol_service` or endpoint, frontend `usePatrolState` / `DashboardTab`.

---

### 4.2 Officer device status from heartbeat

**Gap:** Dashboard shows online/offline only when `connection_status` set; backend doesn’t populate it.

**Tasks:**
- [ ] Once heartbeat API exists, ensure officer list and metrics include `last_heartbeat` / `connection_status`.
- [ ] Frontend Dashboard “Officer devices” block already consumes these; no change if API returns them.

**Files:** Backend officer fetch; frontend already ready.

---

## Phase 5 — Modularize `usePatrolState`

**Gap:** Hook is large; hard to maintain.

**Tasks:**
- [ ] Extract **`usePatrolActions`**: deploy, complete, reassign, cancel, emergency alert. Takes `officers`, `upcomingPatrols`, etc., returns handlers.
- [ ] Extract **`useRouteActions`**: route CRUD, delete route, delete checkpoint, optimization. Uses route mutation guards.
- [ ] Extract **`useTemplateActions`**: template CRUD, delete template.
- [ ] Extract **`useCheckpointActions`**: check-in (plus queue interaction), undo-queued. `useCheckInQueue` stays separate.
- [ ] Keep **`usePatrolState`** as orchestrator: data fetching, state, and calling these hooks. Context value aggregates all.
- [ ] Ensure no duplicate fetch or subscription logic; single source of truth for patrol/officer/route/template state.

**Files:** New `usePatrolActions.ts`, `useRouteActions.ts`, `useTemplateActions.ts`, `useCheckpointActions.ts`; refactor `usePatrolState.ts`, `PatrolContext` if needed.

---

## Phase 6 — Settings & Polish

### 6.1 Hardware heartbeat threshold (Settings)

**Gap:** “Mark offline after X min” not configurable.

**Tasks:**
- [ ] Add `heartbeatOfflineThresholdMinutes` (e.g. 5–30) to `PatrolSettings` and Settings UI.
- [ ] Persist via existing settings API.
- [ ] Backend: when deriving `connection_status`, use this threshold (or default) instead of hardcoded 5/15 min. Frontend can pass it if logic lives in API, or use it client-side if status is computed there.

**Files:** `types.ts`, `SettingsTab`, backend settings schema/service, heartbeat/status logic.

---

### 6.2 Final checks

- [ ] Run `npm run build`; fix any regressions.
- [ ] Re-run final audit checklist; update **PATROL_COMMAND_CENTER_FINAL_AUDIT.md** with new scores and “Remediation complete” items.
- [ ] Update this plan with “Done” dates and any deviation notes.

---

## Execution Order (Recommended)

1. **Phase 1** (all) — Quick frontend wins, no backend.
2. **Phase 2.1** — Request_id dedup (backend only).
3. **Phase 2.2** — Heartbeat API (in-memory first).
4. **Phase 2.3** — “Last used” on completion.
5. **Phase 3** — Version/409 (add migration, then service + frontend).
6. **Phase 4** — Optional weather; wire officer status from heartbeat.
7. **Phase 5** — Modularize hooks.
8. **Phase 6** — Heartbeat threshold + final audit and build.

---

## Done Criteria (100% Ready)

- [ ] Settings toggles affect runtime (offline UX, refresh interval).
- [ ] Patrol Management filters persist across reloads.
- [ ] Critical checkpoints clearly highlighted in Routes & Checkpoints.
- [ ] Queued check-ins support 5s Undo (remove from queue + revert local state).
- [ ] UI Gold Standard sweep complete (no inappropriate CTA shadows, `border-white/5`).
- [ ] Check-in request_id dedup in backend.
- [ ] Heartbeat API live; officer `last_heartbeat` / `connection_status` used.
- [ ] Route “last used” updated when patrol completes.
- [ ] Version/409 on patrol update; frontend handles 409.
- [ ] (Optional) Weather configurable; officer status from heartbeat.
- [ ] `usePatrolState` split into focused hooks.
- [ ] Heartbeat threshold configurable in Settings.
- [ ] `npm run build` passes; final audit updated and score ≥ 95%.

---

*End of Remediation Plan*
