# Help & Support Module — Phased Remediation Plan

This plan addresses every finding from the Production Readiness Audit. Execute in order; later phases depend on earlier ones.

---

## Phase 1: Foundation — Structure, Types, and Gold Standard Shell

**Goal:** Decouple monolithic file; add types, shell with icon, and per-tab page headers in line with UI-GOLDSTANDARD and Patrol reference.

### 1.1 File structure
- Add `frontend/src/features/help-support/types/` with `help-support.types.ts` (and optional `index.ts`) exporting:
  - `HelpArticle`, `SupportTicket`, `ContactInfo` (move from module).
  - `HelpCategory`, `TicketStatus`, `TicketPriority`, `TicketCategory` (union types).
  - Any display/color helper types if needed.
- Add `frontend/src/features/help-support/components/tabs/` with:
  - `OverviewTab.tsx`, `HelpCenterTab.tsx`, `SupportTicketsTab.tsx`, `ContactSupportTab.tsx`, `ResourcesTab.tsx`.
  - `components/tabs/index.ts` re-exporting all tabs.
- Add `frontend/src/features/help-support/hooks/` (e.g. `useHelpSupportState.ts`) for:
  - Local state: `activeTab`, `searchQuery`, `selectedCategory`, `helpArticles`, `supportTickets`, `contactInfo`, `newTicket` form, `showNewTicketModal`, `loading`, `error`, `success`.
  - Handlers: `setActiveTab`, `showError`, `showSuccess`, `setSearchQuery`, `setSelectedCategory`, open/close new ticket modal, **addTicket** (append to `supportTickets` with generated id, createdAt, updatedAt, status `'open'`), reset new ticket form.
- Add `frontend/src/features/help-support/context/HelpSupportContext.tsx` (optional): provide the above state and handlers so tabs and orchestrator consume from one place (or keep state in hook and pass via props from orchestrator).
- Orchestrator: `HelpSupportOrchestrator.tsx` (or rename existing `HelpSupportModule.tsx`):
  - Use ModuleShell with **icon** prop (e.g. `<i className="fas fa-question-circle text-2xl text-white" />`).
  - Use `tabs` and `activeTab` / `onTabChange`; render tab content via switch; wrap each tab in `ErrorBoundary`.
  - Render error/success banners; render New Ticket modal (Phase 2 will replace with global Modal).
  - No direct duplication of tab UI; delegate to tab components.

### 1.2 Gold standard shell and tab layout
- ModuleShell: pass `icon`, `title`, `subtitle`; tabs with id and label (icon + text per tab).
- Each tab component: top-level structure = page header (title + subtitle) then content.
  - **Page header:** `<div className="flex justify-between items-end mb-8">` with `<h2 className="page-title">…</h2>` and `<p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">…</p>`.
- Overview tab: replace 4-card KPI grid with **one compact metrics bar** (e.g. `flex flex-wrap items-center gap-6 py-3 border-b border-white/5 text-sm mb-6`) showing: Help Articles count, Open Tickets count, Support Agents count, Avg Response (can remain placeholder text until API). Remove gradient cards.
- All cards: use `Card` with `className="bg-slate-900/50 border border-white/5"`; CardHeader with `border-b border-white/5 pb-4 px-6 pt-6`; CardTitle with Patrol pattern: `<CardTitle className="flex items-center justify-between"><span className="flex items-center text-white"><div className="w-10 h-10 bg-blue-600 rounded-md ... mr-3 border border-white/5"><i className="fas fa-... text-white" /></div><span className="card-title-text">Section Title</span></span> … </CardTitle>`. No gradients, no shadow-lg, no rounded-xl.
- Tables and list items: use dark console styling (`text-[9px] font-black uppercase tracking-widest text-slate-500` for headers, `border-white/5`, `bg-white/[0.02]` or similar). Use EmptyState component for empty ticket list and empty article list where appropriate.
- Remove reliance on `profile-console-skin` for this module; use tokens and gold-standard classes directly.

**Deliverables:** Types file; 5 tab components with page headers and gold-standard structure; hook (and optional context); orchestrator with icon and ErrorBoundary; metrics bar on Overview; all cards and lists styled per gold standard.

---

## Phase 2: Real Workflows — Buttons and Modals

**Goal:** Every button performs a real, deterministic action (no toast-only placeholders).

### 2.1 New Ticket modal
- Replace custom overlay with global `components/UI/Modal`: use `isOpen`, `onClose`, `title`, `footer` (Cancel + Create Ticket). Body: title input, description textarea, priority select, category select. On Submit: validate (title and description required); call **addTicket** with new ticket (id, title, description, priority, category, status `'open'`, createdAt, updatedAt); close modal; reset form; show success toast. Ensure modal uses `z-[100]` (global Modal already does).
- Orchestrator or hook holds `supportTickets` and `setSupportTickets` (or functional update); `addTicket` appends one ticket.

### 2.2 Ticket detail and edit
- Add state: `selectedTicketId` (or `selectedTicket`) and `showTicketDetailModal`.
- "View" on a ticket (Overview and Support Tickets tab): set `selectedTicketId`, open ticket detail modal. Modal: global Modal, title = ticket title, body = description, status, priority, category, dates, assignedTo; footer = Close + optional "Edit" (switch to edit mode in same modal or separate edit modal).
- "Edit" on a ticket: open same detail modal in edit mode (or separate Edit Ticket modal): prefill title, description, priority, category; Save updates the ticket in state (and later API); close modal. For now, state-only update is sufficient.
- Ticket detail modal: use global Modal; no custom overlay.

### 2.3 Help articles
- "Read More": open an article detail view (modal or inline expand). Use global Modal: title = article title, body = full content (and metadata: category, lastUpdated, views, helpful); footer = Close. Optional: "Was this helpful?" with thumbs up/down that updates local state (e.g. `helpful` count) for session.
- Optional: deep link to related module (e.g. "How to Report an Incident" → link to `/modules/event-log` or incident creation) as a button in modal footer.

### 2.4 Contact support
- Email button: use `<a href={`mailto:${contact.email}`}>` or Button that opens `window.location.href = \`mailto:${contact.email}\``.
- Call button: use `<a href={`tel:${contact.phone}`}>` or Button with `tel:` link (normalize phone to digits/plus for tel:).
- Emergency "Call Now": use `tel:` link for the emergency number (e.g. `+15559117777` or placeholder number from config).

### 2.5 Resources
- User Manual: provide a URL (e.g. `/docs/user-manual.pdf` or external URL); Download button = `<a href={url} download>` or `window.open(url)`.
- Mobile App: link to app store (e.g. config or constant: iOS URL, Android URL); button opens in new tab.
- API Documentation: link to internal route or external URL (e.g. `/api-docs` or backend Swagger); "View Docs" opens link.
- Training videos: each "Watch" opens a URL (internal or YouTube/Vimeo) in new tab or embed key in modal; at minimum, open external link.

Use constants or a small config object for these URLs so they can be changed for environment or future backend.

### 2.6 Live Chat
- Option A: Implement a minimal "live chat" UI (e.g. a panel or modal with message list + input; backend can be stub that stores messages in memory and echoes). Option B: If not in scope, replace button with "Live chat coming soon" and disable, or link to external chat URL. Do not leave as fake "Opening live chat" toast only.

**Deliverables:** Create Ticket persists to state; ticket detail modal (view); ticket edit (state update); article detail modal (Read More); contact Email/Call use mailto/tel; Emergency Call uses tel; resource buttons use real URLs/links; Live Chat either implemented or explicitly "coming soon" with no fake success.

---

## Phase 3: Backend and Data Layer (Optional but Recommended)

**Goal:** Prepare for persistence and future mobile/hardware integration.

### 3.1 Backend (if approved)
- Add `backend/api/help_support_endpoints.py` (or similar): 
  - `GET /help/articles` — return list of help articles (from DB or file).
  - `GET /help/articles/{id}` — return one article.
  - `GET /help/tickets` — return tickets for current user (or all for admin).
  - `POST /help/tickets` — create ticket (body: title, description, priority, category); return created ticket.
  - `GET /help/tickets/{id}` — return one ticket.
  - `PUT /help/tickets/{id}` — update ticket (e.g. status, description).
  - `GET /help/contact` — return contact list (or static JSON).
- Wire in `main.py` under a prefix (e.g. `/help` or `/support`). Use `get_current_user` for tickets.

### 3.2 Frontend service and state
- Add `frontend/src/features/help-support/services/helpSupportService.ts`: `getArticles()`, `getArticle(id)`, `getTickets()`, `createTicket(body)`, `getTicket(id)`, `updateTicket(id, body)`, `getContactInfo()` (if backend provides). Call `apiService.get/put/post/delete` with correct paths.
- Hook or context: replace local static arrays with:
  - Initial load: fetch articles and tickets (and contact if from API); set loading/error; store in state.
  - addTicket: call `createTicket` then append to state or refetch; on failure set error and optionally keep modal open.
  - View/Edit ticket: optionally refetch single ticket; update ticket in state after edit via `updateTicket`.
- Keep fallback: if backend is not deployed, use in-memory seed data (as today) so module still works for demo.

**Deliverables:** API endpoints (if approved); frontend service; hook/context using API with fallback to seed data; Create Ticket and Edit Ticket calling API when available.

---

## Phase 4: Observability, Error Handling, and Polish

**Goal:** ErrorBoundary, telemetry, validation, and cross-module links.

### 4.1 ErrorBoundary
- In orchestrator, wrap each tab content in `<ErrorBoundary moduleName="HelpSupport{TabName}Tab">` (e.g. `HelpSupportOverviewTab`).

### 4.2 Telemetry (if app has telemetry)
- On tab change: track `help_support_tab_change` with tab id.
- On ticket create: track `help_support_ticket_create` with category/priority.
- On ticket view: track `help_support_ticket_view`.
- On article view (Read More): track `help_support_article_view` with article id.
- On contact action (email/call): track `help_support_contact` with type (email/call).

### 4.3 Validation
- New Ticket modal: require title and description (non-empty); show inline or toast error and do not submit until valid.

### 4.4 Cross-module navigation
- In help article content or modal (e.g. "How to Report an Incident"), add a link/button: "Open Incident Log" → `navigate('/modules/event-log')`. Same for other articles that map to modules (e.g. Access Control, Patrol).

### 4.5 Final UI pass
- Ensure no leftover light theme classes; ensure all interactive elements have focus styles and aria where needed (e.g. modal title, tab panels).
- Remove any unused state (e.g. `loading` if still never set until Phase 3).

**Deliverables:** ErrorBoundary per tab; telemetry events (if applicable); validation on Create Ticket; at least one cross-module link from an article; final a11y and style check.

---

## Phase 5: Integration Readiness and Documentation

**Goal:** Document integration points for mobile and hardware; optional stubs.

### 5.1 Documentation
- In `frontend/src/features/help-support/README.md`: describe module purpose; list tabs; document that ticket create/edit (and articles) can be wired to backend (Phase 3). Document where to add: mobile ticket submission (e.g. POST from mobile agent), hardware status in Overview (e.g. "Device status" metric from hardware service). No code required for "not yet built" mobile/hardware; just clear extension points.

### 5.2 Optional stubs
- If backend exists: add a small section in Overview or Settings for "Integration status" (e.g. "Tickets API: connected") for future use with mobile/hardware. Otherwise skip.

**Deliverables:** Updated README with integration notes; optional status stub.

---

## Phase 6: Build, TypeScript, and Verification

**Goal:** Production build and type check pass; ready for manual QA.

- Run `npm run build` (frontend).
- Run `npx tsc --noEmit`.
- Fix any new lint/type errors introduced by refactor.
- Confirm: no toast-only actions; Create Ticket adds ticket to list; View/Edit ticket open modals; contact uses mailto/tel; resources use links; UI matches gold standard (metrics bar, card pattern, page-title, global Modal, icon on shell).

---

## Execution Order Summary

| Phase | Focus |
|-------|--------|
| 1 | Structure (types, tabs, hook, orchestrator), gold standard shell and styling, metrics bar, card/table styling |
| 2 | Real workflows: New Ticket persists, ticket detail/edit modals, article detail, mailto/tel, resource URLs, Live Chat handling |
| 3 | Backend API (optional) + frontend service + hook using API with fallback |
| 4 | ErrorBoundary, telemetry, validation, cross-module links, polish |
| 5 | README and integration documentation |
| 6 | Build, tsc, final verification |

**Approval gate:** After your approval, execute Phases 1 → 2 → 4 → 5 → 6 (Phase 3 only if backend is approved). Then run build and tsc and notify for manual verification.
