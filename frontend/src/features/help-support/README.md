# Help & Support

**Location:** `frontend/src/features/help-support`  
**Import:** `import HelpSupport from './features/help-support'` or `@/features/help-support`  
**Route:** `/help` (Sidebar: Help & Support)

Help and support: overview, help center, support tickets, contact support, resources (downloads, training videos).

## Structure

- **HelpSupportOrchestrator.tsx** — Module shell, tabs, ErrorBoundary per tab, modals.
- **hooks/useHelpSupportState.ts** — State, data loading (API + seed fallback), modal open/close, create/update ticket.
- **services/helpSupportService.ts** — API calls to `/help/articles`, `/help/tickets`, `/help/contact` with fallback to seed data.
- **types/** — `HelpArticle`, `SupportTicket`, `ContactInfo`, payloads.
- **constants/seedData.ts** — Seed articles, tickets, contacts when API is unavailable.
- **constants/resourceUrls.ts** — URLs for user manual, mobile app, API docs, videos, live chat (empty = “Coming soon”).
- **components/tabs/** — OverviewTab, HelpCenterTab, SupportTicketsTab, ContactSupportTab, ResourcesTab.
- **components/modals/** — NewTicketModal, TicketDetailModal, ArticleDetailModal (global `Modal`).
- **utils/helpSupportHelpers.ts** — Display names and badge variants for categories, status, priority.

## Backend

- **API prefix:** `/api/help` (e.g. `GET /api/help/articles`, `POST /api/help/tickets`).
- **Endpoints:** `GET/POST /help/tickets`, `GET /help/tickets/:id`, `PUT /help/tickets/:id`, `GET /help/articles`, `GET /help/articles/:id`, `GET /help/contact`.
- In-memory store by default; replace with DB when needed.

## Integration readiness

- **Mobile agent:** Tickets can be created via `POST /api/help/tickets` (same payload: title, description, priority, category). Future mobile app can submit tickets to this endpoint.
- **Hardware / external data:** No direct hardware dependency. Overview metrics (e.g. open tickets, agents) can later be fed from external systems by extending the backend or adding a small “integration status” section that reads from a shared config/API.
- **Cross-module navigation:** Help articles “How to Report an Incident” and “Managing Team Members” open Incident Log (`/modules/event-log`) and Access Control (`/modules/access-control`) from the article detail modal.

## Gold standard

- ModuleShell with **icon**; one **metrics bar** on Overview (no KPI card grid); cards use `bg-slate-900/50 border border-white/5`; card headers use icon box + `card-title-text`; page header per tab with `page-title`; global `Modal` for New Ticket, Ticket Detail, Article Detail; ErrorBoundary per tab.
