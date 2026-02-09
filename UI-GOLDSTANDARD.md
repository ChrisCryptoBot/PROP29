# UI Gold Standard: Security Console Design System

This document defines the visual and interaction standards for the platform's high-contrast "Security Console" aesthetic. It is the **universal reference for auditing every module** in the application.

## Professional Flat Design (Current Standard)

The UI uses a **professional, flat, Windows-esque** design. **Do not use glassmorphism, glows, or decorative effects.**

**REMOVE everywhere:**
- All `backdrop-filter: blur()` and `saturate()` effects
- All box-shadow glow patterns (`0 0 Xpx rgba(...)`)
- All `linear-gradient()` backgrounds on buttons/cards (use solid colors)
- All hover `transform` effects (`translateY`, `scale`)
- Decorative `::before`/`::after` pseudo-elements with gradients
- Border-radius > 6px (use 4px or 6px max)
- Semi-transparent `rgba()` backgrounds where solid colors are appropriate

**USE instead:**
- Solid background colors (e.g. `#0f172a`, `#1e293b`, `#334155`)
- Simple `1px solid` borders with solid colors
- Minimal box-shadow: `0 1px 3px rgba(0,0,0,0.12)` or `none`
- Simple `:hover` background color changes only (no transforms)
- Border-radius **4px** maximum for cards/panels
- Standard focus: `outline: 2px solid #3b82f6; outline-offset: 1px;` (no glowing rings)

**Design tokens (flat):** `--glass-soft-bg` → `#1e293b`; `--glass-card-bg` → `#0f172a`; `--glass-strong-bg` → `#020617`; borders → `#334155` / `#475569`. No glow variables.

## Gold standard reference: Patrol Command Center

**Primary reference for the entire UI:** **Patrol Command Center** — `frontend/src/features/patrol-command-center`.

Use Patrol as the **single source of truth** for:
- **Module layout:** ModuleShell header + sticky tabs + main content.
- **Tab bar:** Flat sticky bar, left-aligned tabs, active = white text + 2px blue bottom border (no pill, no glow).
- **Tab content:** Page header (title + subtitle) → compact metrics bar → Cards/sections with **card header pattern** (icon + title).
- **Card headers:** Every card section uses an **icon box + title**: `w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5` + Font Awesome icon + `<span className="text-sm font-black uppercase tracking-widest">Section Title</span>`.
- **Cards:** `bg-slate-900/50 border border-white/5`; no backdrop-blur, no shadow-2xl, no gradients.
- **Metrics:** Compact metrics bar only at top of Overview/dashboard tabs (no KPI card grids).
- **Buttons:** Solid colors, no glow shadows, no hover transform.
- **Modals:** Plain, uniform design app-wide. **Reference:** Patrol Command Center modals (e.g. CreateOfficerModal, CreateTemplateModal). Flat content only — no section divider lines (no `border-b` on headings, no `border-l` on nested blocks). See **§4 Modal (Global Standard)**.

When auditing any module or tab, compare against **Patrol Command Center** (OverviewTab, PatrolManagementTab, DeploymentTab, etc.) and this document.

- **Page-level title:** One main title + subtitle per tab. Section content uses section headings in the same style — no stacked page-style titles.
- **Metrics bar (canonical):** **Reference:** Patrol Command Center Overview. **Container:** `flex flex-wrap items-center gap-6 py-3 border-b border-white/5 text-sm mb-6` (or `gap-x-4 gap-y-2`). **Items:** label (e.g. `text-slate-400 font-medium`) then `<strong className="text-white ml-1">{value}</strong>`; separate with spacing or ` · `.
- **Lists and tables:** Use **`<section>` + heading + filters + list/grid**. List items = **bordered divs** (`rounded-lg border p-4` or `rounded-md`), not cards, unless the item is a distinct focus block (see §16).
- **Cards:** Use cards **only when necessary** (see §16). Default to sections, metrics bars, and bordered blocks.

## Reference implementations (aligned modules)

The following modules are aligned to this document. **Overview and dashboard tops** use a compact metrics bar only (no KPI card grids at top).

- **Patrol Command Center** — `frontend/src/features/patrol-command-center` — **primary reference** for layout, tabs, card headers, metrics bar, and flat styling.
- **Access Control** — `frontend/src/features/access-control` — Overview: metrics bar; sections.
- **Security Operations Center** — `frontend/src/features/security-operations-center` — Live View: metrics bar; Card with filters; grid tiles.
- **Incident Log** — `frontend/src/features/incident-log` — Overview: metrics bar; sections.
- **Visitor Security** — `frontend/src/features/visitor-security` — Overview: metrics bar; sections.
- **Guest Safety** — `frontend/src/features/guest-safety` — Incidents tab: metrics bar; Incidents list Card.
- **Property Items** — `frontend/src/features/property-items` — Overview: metrics bar; section-based content.
- **Smart Lockers, Smart Parking, IoT Monitoring, Banned Individuals** — Overview: metrics bar; sections/Cards as applicable.

When in doubt, match **Patrol Command Center** and this document.

**Tab names and order:** Canonical tab labels and order for all modules are defined in `docs/MODULE_TABS_NAMES_AND_ORDER.md`. Use that document when auditing tab naming (e.g. Overview, Settings, Analytics) and tab order.

**Module audit order (sidebar, top to bottom):** When applying gold-standard and UI enhancements across the app, process modules in this order: 1) Patrol Command Center, 2) Access Control, 3) Security Operations Center, 4) Incident Log, 5) Visitor Security, 6) Guest Safety, 7) Property Items, 8) Smart Lockers, 9) Smart Parking, 10) Digital Handover, 11) Team Chat, 12) IoT Monitoring, 13) System Administration.

---

### Auditing a module for gold standard

When you prompt to audit a **specific module** (e.g. “audit Access Control for gold standard” or “ensure Incident Log is gold standard”), use:

1. **This document** — Sections 1–21 and the **Universal Module Audit Checklist** at the end. Work through each checklist section for that module; mark N/A only where **§32 When patterns apply (optionality)** says the pattern does not apply (e.g. WebSocket N/A for static config modules).
2. **§6A Tab Content Gold Standard** — For **each tab** in the module, compare against **Patrol Command Center** tabs (e.g. OverviewTab, PatrolManagementTab): page header → metrics bar → content (section/Card with icon+title header) → filters/controls → list/grid → empty state. Use the **Tab Audit Checklist (per tab)** in §6A.
3. **`docs/audits/CARD_GOLDSTANDARD_AUDIT.md`** — Look up that module’s tabs in the “By module — tab-by-tab” table. For each tab marked Overdesigned or Mixed: apply metrics bar where there are KPI card grids; use `<section>` + heading instead of Card section wrappers; use bordered divs for list items unless a card is justified (modals, distinct focus blocks, visual grid tiles).
4. **`docs/audits/FRONTEND_OVERDESIGN_INEFFICIENCY_AUDIT.md`** — Use the categories that apply to that module (metric card duplication, badge helpers, loading spinners, visual effects, confirm modals, etc.). Fix over-design and redundancy per the recommendations; tie card/metrics bar work to the card audit.

**Sleek minimalism:** Patrol Command Center is the reference for layout, tab structure, card headers, and content flow. Per module, ensure: one page title + subtitle per tab where appropriate; compact metrics bar instead of KPI card grids; card headers with icon + title (§3); sections with headings where cards are not needed; list/table items as bordered divs; cards only where necessary (§16). No backdrop-blur, glow shadows, or gradients; use flat borders and solid icon boxes.

### Common inconsistencies (audit against Patrol)

When comparing other modules to Patrol Command Center, check and fix:

| Area | Patrol gold standard | Avoid |
|------|------------------------|--------|
| **Card** | `bg-slate-900/50 border border-white/5` | `bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50`; mixed border tokens |
| **CardHeader** | `border-b border-white/5 pb-4 px-6 pt-6` | Bare `<CardHeader>`; `border-[color:var(--border-subtle)]/10`; `py-4` only (missing px/pt) |
| **Card/section title** | `card-title-text`; icon box `card-title-icon-box` or `w-10 h-10 bg-blue-600 rounded-md ... border border-white/5` | `text-xl` / `text-lg`; `font-bold`; `tracking-tight`; gradient/shadow/scale on icon box |
| **Page title** | `page-title` (tab content) | Inline `text-3xl font-black ...` or `text-white` instead of `var(--text-main)` |
| **Border radius** | `rounded-md` (4px) or `rounded-lg` for list blocks; max 6px per §1 | `rounded-xl`, `rounded-2xl` on cards/list items |
| **Effects** | Flat only; `transition-colors` | `backdrop-blur`; `shadow-lg` / `shadow-2xl`; `transition-all` with transform/scale |
| **List item blocks** | `rounded-md` or `rounded-lg`; `border border-white/5` | `rounded-2xl`; `border-[color:var(--border-subtle)]/30` |

---

## 1. Visual Identity & Design Tokens

### Color Palette (Semantic)
- **Background Main**: `var(--background)` (Deep Black)
- **Surface Card**: `var(--surface-card)` (Dark Surface)
- **Text Main**: `var(--text-main)` (High-Contrast White)
- **Text Sub**: `var(--text-sub)` (Muted Slate-500)
- **Accent Primary**: Blue-500/600 (solid, no glow)
- **Accent success**: Emerald-500 (solid)

### Borders & Effects (Flat)
- **Standard Border**: `border-white/5` or `border-[color:var(--glass-card-border)]` (1px solid)
- **Card**: `glass-card` or `bg-[color:var(--surface-card)]` with solid background; **no** `backdrop-blur`
- **Shadow**: `0 1px 3px rgba(0,0,0,0.12)` or `none`; **no** glow box-shadows
- **Sunk-In Surface**: `bg-[color:var(--glass-soft-bg)] border border-white/5`

## 2. Typography & Terminology

### Header Hierarchy (global classes)
- **Module Title** (shell header): use class **`module-header-title`** — defined in `frontend/src/styles/tokens.css` (gold standard: 3xl, font-black, uppercase, tracking-tighter, white).
- **Page/container title** (tab content): use class **`page-title`** — defined in `frontend/src/styles/tokens.css` (gold standard: 3xl, font-black, uppercase, tracking-tighter, `var(--text-main)`). Use on every tab’s main `<h2>`.
- **Technical Subtitles**: `text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400`
- **Navigation/Tab Label**: `font-black uppercase tracking-widest text-[10px]`

### Page Header Layout
- **Required on every tab**: title + subtitle block at top of the page.
- **Layout**: `flex justify-between items-end mb-8` with left-aligned title/subtitle and optional right-side actions.

### Module Layout & Sticky Tabs (global)
- **Structure**: Module **header** (title, subtitle, icon, actions) scrolls with the page. **Tabs** bar sits directly below the header. **Main** content below the tabs.
- **Sticky tabs**: On **scroll down**, the header scrolls up and can leave the viewport. The **tabs** bar must **stick** to the top of the viewport (`position: sticky; top: 0`) so they remain visible while content below continues to scroll. On **scroll up**, the tabs **release** and move back down with the page so the full header (title + tabs) can return. Use the shared `ModuleShell` layout; tabs are sticky, header is not.
- **Scroll container**: **No overflow on ancestors of the tabs bar.** Any ancestor with `overflow: hidden`, `overflow: auto`, `overflow-x-auto`, or `overflow-y-auto` breaks `position: sticky`. The app layout wrapper (e.g. `Layout` root) must not use these; keep vertical scroll on the viewport. Sticky is relative to the viewport (or the main scroll ancestor).
- **Z-index**: Tabs bar uses a lower z-index (e.g. `z-[70]`) than **modals** so modals always stack above.

### Modal Stacking (global)
- **Modals above chrome**: Modal overlay and container must use a **higher z-index** than the sticky tabs bar (e.g. `z-[100]` or above). Modals must **never** be overlapped or hidden by the tabs or header. Use the global `components/UI/Modal` only; it enforces the correct stacking.

### Data Typography
- **Primary Metrics**: `text-3xl font-black text-white` (Always white, never semantic)
- **All metric numbers**: Use `text-white` for KPI values, counts, percentages, and secondary metric text (e.g. "X active", "X online", "24h period"). Do not use semantic colors (blue, green, yellow, orange) for numeric metrics; reserve those for status badges and alerts only.
- **Technical Values (IDs, Plates, Currency)**: `font-mono text-white`
- **Metadata Labels**: `text-slate-500 uppercase font-black tracking-widest text-[9px]` (or `text-[10px]` for slightly larger labels)

### Patrol Command Center — Fonts for Containers & Controls (canonical)

Use these typography classes so every module matches Patrol. **Reference:** `frontend/src/features/patrol-command-center`.

| Element | Class (canonical) |
|--------|----------------------------------------|
| **Page title (tab)** | **`page-title`** (global class in `styles/tokens.css`) — 3xl, font-black, uppercase, tracking-tighter, `var(--text-main)` |
| **Page subtitle** | `text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70` |
| **Section / card title** (icon + title in header) | **`card-title-text`** (global class in `styles/tokens.css`); icon box: **`card-title-icon-box`** or `w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5` |
| **Metrics bar container** | `flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold uppercase tracking-widest text-[color:var(--text-sub)]` |
| **Metrics bar value** | `<strong className="font-black text-white">{value}</strong>` |
| **Filter pill / small button** | `text-[10px] font-black uppercase tracking-widest`; border `border-white/5` or `border-white/10` |
| **Primary button** | `variant="primary"` — solid `bg-blue-600`, no glow; text inherits |
| **Outline / secondary button** | `variant="outline"`; optional `border-white/10 text-slate-300 hover:bg-white/10 hover:text-white` |
| **FAB (Floating Action Button)** | Circular (`rounded-full`), solid `bg-blue-600` (primary) or `bg-red-600` (destructive); `border-0`; **no** hover scale or pulse |
| **Modal title** | `text-xl font-black uppercase tracking-tighter text-white mb-6` |
| **Modal section label** | `text-[9px] font-black uppercase tracking-widest text-slate-500 mb-4` (no border-b) |
| **Form label** | `block text-xs font-bold text-white mb-2 uppercase tracking-wider` (or `text-[10px] font-black ... tracking-widest` for compact) |
| **Table header cell** | `text-[9px] font-black uppercase tracking-widest text-slate-500` |
| **List/grid item title** | `font-black text-white` (or `text-[color:var(--text-main)]`) with `text-sm uppercase tracking-widest` where appropriate |
| **List/grid item description** | `text-sm text-[color:var(--text-sub)]` or `text-slate-500` |
| **Status badge** | `text-[10px] font-black uppercase tracking-widest`; border + semantic bg (e.g. `bg-emerald-500/10 text-emerald-400 border-emerald-500/20`) |
| **KPI label** | `text-[9px] font-black uppercase tracking-widest text-slate-500` |
| **KPI value** | `text-2xl font-black text-white` (or `text-3xl` for hero metrics) |

**Tab content spacing:** Use `pt-8` or `pt-12` on the top-level tab content wrapper when more space is needed between the tab bar and the page title (e.g. Analytics & Reports).

**Metrics-to-white audit (applied):** Property Items (L&F + Packages OverviewTab); Access Control OverviewTab (metrics bar); Incident Log (OverviewTab status pills, Agent/Hardware metric text, Trust Level Distribution, Top Performers %, Device Health numbers; PredictionsTab Confidence %); Patrol Command Center (RoutesCheckpointsTab + OverviewTab metrics); Security Operations Center (Live View + Analytics metrics bar); Visitor Security OverviewTab (metrics bar); Guest Safety IncidentsTab (metrics bar); Smart Lockers OverviewTab (metrics bar); Smart Parking OverviewTab (metrics bar); IoT Monitoring Overview (combined metrics bar); IoT Environmental OverviewTab (metric count hover); Banned Individuals OverviewTab (Expiring Bans count, days-until-expiration).

### Terminology "No-Jargon" Rule
> [!IMPORTANT]
> Avoid over-complex or forensic terminology. Use simple, technical, and actionable language.
- **Incorrect**: "Initialize Space Asset", "Execute Yield Audit", "Advanced Telemetry"
- **Correct**: "Add Space", "Revenue Report", "Performance Analytics"

## 3. High-Density Components (Patrol gold standard)

### Card Header Icon (canonical)
Every card section must use a **flat icon box + title**. **Reference:** Patrol Command Center (OverviewTab, PatrolManagementTab, DeploymentTab, etc.). For a full list of Patrol fonts (containers, buttons, modals), see the table **Patrol Command Center — Fonts for Containers & Controls** in §2 Typography.
- **Icon box**: `w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5`
- **Icon**: Font Awesome, e.g. `<i className="fas fa-[icon-name] text-white"></i>`. Use semantic solid colors for variety (e.g. `bg-indigo-600` for deployment, `bg-amber-600` for queue).
- **Title**: `<span className="text-sm font-black uppercase tracking-widest">Section Title</span>`
- **No gradients, no shadow, no scale on hover.** Solid background only.

### Cards (flat)
- **Card base**: `bg-slate-900/50 border border-white/5` — no `backdrop-blur`, no `shadow-2xl`, no gradients.
- **Card header**: `CardHeader` with `border-b border-white/5 pb-4 px-6 pt-6`; `CardTitle` with icon box + title (see above). Optional right-side actions (e.g. button) in same row.
- **Card content**: `CardContent` with `px-6 py-6` or `pt-6`.

### Status badges (flat)
- **Base**: `px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border` (or `rounded` for pills)
- **Success**: `bg-emerald-500/10 text-emerald-400 border-emerald-500/20` — **no** glow box-shadow
- **Warning/Critical**: `bg-amber-500/10 text-amber-400 border-amber-500/20` — **no** glow box-shadow
- **Info**: `bg-blue-500/10 text-blue-400 border-blue-500/20`

## 4. Interaction Patterns

### Secondary / glass-style buttons (flat)
- **Base**: `bg-white/5 border border-white/5 text-slate-500 font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-md transition-colors`
- **Hover**: `hover:bg-white/10 hover:text-white hover:border-white/20` — **no** shadow, **no** transform/scale
- **Semantic hints**: `hover:bg-{color}-500/10 hover:border-{color}-500/20 hover:text-{color}-400` for actions (e.g. Save, Delete). **No** colored drop shadows anywhere.

### Integrated Card Toggles
- **Pattern**: A standard `Toggle` component nested inside a `bg-white/5 border-white/5` rounded container.
- **Layout**: `flex items-center justify-between p-4 hover:bg-white/10 transition-colors`

### Modal (Global Standard) — Universal plain design

**This is the single, universal modal design for the entire application.** All modules must use it. **Canonical reference:** Patrol Command Center — `frontend/src/features/patrol-command-center/components/modals/` (e.g. CreateOfficerModal, CreateTemplateModal, AddCheckpointModal). Modals are **plain and uniform**: flat content, spacing-only grouping, no decorative dividing lines.

- **Use the global component**: `components/UI/Modal` only. No custom modal wrappers.
- **Overlay**: `fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4` — **z-index must exceed the sticky tabs bar** (e.g. `z-[70]`) so modals are never hidden by module chrome.
- **Container**: `bg-slate-900 rounded-md p-6 border border-white/5 max-h-[90vh] overflow-y-auto` — **no** backdrop-blur, **no** shadow-2xl; flat styling only.
- **Title**: `text-xl font-black uppercase tracking-tighter text-white mb-6`
- **Content — plain, no dividing lines:** Flat layout only. Use `space-y-4` or `space-y-6` for the main content wrapper. **No section divider lines:** Do **not** use `border-b` on section headings or `border-l` / `border-l-2` on nested sections; use **spacing only** (e.g. section label `text-[9px] font-black uppercase tracking-widest text-slate-500 mb-4` with no underline; optional `pl-6` for indented subsections **without** a vertical line). No inner card wrappers (no `p-4 bg-... rounded-xl` per field). Labels (view): `text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1`. Form labels: `block text-xs font-bold text-white mb-2 uppercase tracking-wider`. Values: `text-white font-bold` or `text-white font-mono text-sm` or `text-slate-300 text-sm`.
- **Inputs**: Use the **Standard Input** pattern from section 5. Same for `select`. Buttons: `text-xs font-black uppercase tracking-widest`.
- **Actions**: Use the Modal component's **`footer`** prop for all action buttons. Right-aligned row: **Cancel first** (`variant="subtle"`), then primary action (`variant="primary"` for Save/Create, `variant="destructive"` for Delete). Do not place action buttons inside modal content.
- **No close icon**: Do not render an “X” close button; Cancel is the only close control.
- **Draggable**: All modals (and the **Global Clock**) are **draggable** for repositioning. Use the same pattern as `components/UI/GlobalClock`: **drag handle** = title bar (modals) or time display (Global Clock); `cursor-move` on the handle; `mousedown` → `mousemove` / `mouseup` to update position; clamp to viewport. Custom modals (e.g. Camera Live) must also support drag via a header/handle. `Modal` supports `draggable` (default `true`); set `draggable={false}` only when needed.

### Empty State (Global Standard)
- **Use the global component**: `components/UI/EmptyState` for all empty blocks.
- **Consistent wording**: mirror schedule empty state style (e.g., “No schedule data available” + actionable description).
- **No custom empty cards**: avoid ad‑hoc icon blocks or bespoke empty layouts.

## 5. Module Structure & Layout

### ModuleShell Component (Required)
- **Use**: Always use `ModuleShell` from `components/Layout/ModuleShell` for all modules
- **Props Required**:
  - `icon`: React node (Font Awesome icon)
  - `title`: Module name (e.g., "Access Control", "Patrol Command Center")
  - `subtitle`: Optional technical subtitle
  - `tabs`: Array of tab objects with `id` and `label`
  - `activeTab`: Current active tab ID
  - `onTabChange`: Tab change handler
  - `actions`: Optional right-side actions (e.g., property selector, refresh button)

### Module Header Structure (flat)
- **Header container**: `glass-strong border-b border-white/10` — **no** shadow-2xl
- **Max width**: `max-w-[1800px] mx-auto px-8 py-8`
- **Icon container**: `w-16 h-16 rounded-md glass-card flex items-center justify-center` — **rounded-md** (4–6px), not rounded-2xl
- **Icon size**: `text-2xl text-white`
- **Title**: use class **`module-header-title`** (see §2 Header Hierarchy)
- **Subtitle**: `text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400 mt-2`

### Tab Navigation Bar (gold standard — flat, sticky)
**Reference:** `components/Layout/ModuleShell.tsx`. Tabs bar is **sticky** (`sticky top-0 z-[70]`) so it stays visible when scrolling.
- **Bar container**: `sticky top-0 z-[70] shrink-0 border-b border-white/10 bg-[color:var(--console-dark)]` — **no** backdrop-blur, **no** shadow; same background as page.
- **Inner**: `max-w-[1800px] mx-auto px-6`; **nav**: `flex items-stretch gap-0 -mb-px` (left-aligned, no pill wrapper).
- **Tab button**: `px-5 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors duration-150`
- **Active tab**: `text-white border-blue-500` (2px blue bottom border = underline; no background fill, no glow).
- **Inactive tab**: `text-slate-400 border-transparent hover:text-white hover:bg-white/5 hover:border-white/10`
- **Focus**: `focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-[-2px]` — standard outline, no ring glow.
- **Accessibility**: `role="tablist"`, `role="tab"`, `aria-selected={isActive}` on each button.

### Main Content Container
- **Container**: `max-w-[1800px] mx-auto px-6 py-8`
- **Spacing**: Use `space-y-6` for vertical spacing between sections

## 6. Tab Page Headers (Required on Every Tab)

- **Page-level only:** The **big** title + subtitle format (below) is for the **page** (the tab) only. Do not stack multiple page-style titles (e.g. "Overview" then "Lost & Found" with another big title). When content is integrated (e.g. Overview with two sections), use **one** page title; sections use **section headings** in the same style as each other (e.g. "Lost & Found Items", "Packages and Deliveries").
- **Section headings:** Use `text-sm font-black uppercase tracking-widest text-white` (or `text-[color:var(--text-main)]`) with `mb-4` where needed. **Reference:** Patrol Command Center (e.g. "Patrol Routes", "Checkpoint Management", "Lost & Found Items"). No subtitle under section headings unless the design explicitly needs it.

### Standard Page Header Layout
- **Container**: `flex justify-between items-end mb-8`
- **Left Side**: Title and subtitle (page only)
- **Right Side**: Optional metadata (last refreshed time, status indicators)

### Page Title (design tokens)
- **Title**: use global class **`page-title`** (defined in `styles/tokens.css`) — 3xl, font-black, uppercase, tracking-tighter, `var(--text-main)`.
- **Subtitle**: `text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70` — use `var(--text-sub)` (not raw `text-slate-400`).
- **Example**:
  ```tsx
  <div className="flex justify-between items-end mb-8">
    <div>
      <h2 className="page-title">Dashboard</h2>
      <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
        Live system overview and emergency status
      </p>
    </div>
    {/* Optional right-side content */}
  </div>
  ```

### Last Refreshed Indicator (Optional)
- **Container**: `text-[10px] font-mono text-slate-500 uppercase tracking-widest`
- **Format**: "Data as of [time] · Refreshed [relative time]"
- **Accessibility**: Include `aria-live="polite"` for screen readers

---

## 6A. Patrol Command Center — Tab Content Gold Standard

> **Purpose**: Use **Patrol Command Center** (`frontend/src/features/patrol-command-center`) as the **canonical reference when auditing each tab in each module**. Compare tab layout, structure, and patterns against Patrol tabs (e.g. OverviewTab, PatrolManagementTab, DeploymentTab).

### Tab Structure (Top to Bottom)

1. **Page header** — `flex justify-between items-end mb-8`
   - **Title**: class **`page-title`** (global)
   - **Subtitle**: `text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70`
   - **Right side (optional)**: Last refreshed indicator — `text-[10px] font-mono text-slate-500 uppercase tracking-widest`

2. **Compact metrics bar** — No KPI cards. Inline stats only.
   - **Container**: `flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold uppercase tracking-widest text-[color:var(--text-sub)]` with `role="group"` and `aria-label`
   - **Items**: label + space + `<strong className="font-black text-white">{value}</strong>`
   - **Separators**: `<span className="text-white/30" aria-hidden="true">|</span>` between items

3. **Content area** — Either `<section>` + heading + list/grid **or** `Card` when justified (see §16)
   - **When Card**: Use for distinct focus blocks (e.g. visual grid of camera tiles, single table/list container)
   - **Card structure**: `CardHeader` (border-b, icon + title + optional action) → `CardContent` (filters, controls, grid/list)

4. **Filter / control row**
   - **Filter pills**: `flex flex-wrap gap-2`; each button `font-black uppercase tracking-widest text-[10px] px-6 h-9`
   - **Active**: `bg-white/10 border-white/20 text-white`
   - **Inactive**: `border-white/5 text-slate-400 hover:bg-white/5 hover:text-white`
   - **Layout controls**: Label `text-[10px] font-black uppercase tracking-widest text-slate-500`; controls inline

5. **Grid or list**
   - **Grid tiles**: `rounded border border-white/5 p-4` or similar; status badges `px-1.5 py-0.5 text-[9px] font-black rounded uppercase tracking-widest` with semantic colors
   - **Empty state**: Use `EmptyState` component (no custom empty blocks)

6. **Pagination / footer** (when applicable)
   - Simple text: `Showing X–Y of Z [items]` — `text-[10px] font-bold text-slate-500 uppercase tracking-widest`

### Tab Audit Checklist (per tab)

When auditing a tab against the Patrol Command Center gold standard:

- [ ] Page header present (title + subtitle)
- [ ] Metrics bar (no KPI card grid at top)
- [ ] Section or Card content structure correct per §16
- [ ] Filter/control styling matches (pills, labels, buttons)
- [ ] List/grid items use bordered divs unless Card justified
- [ ] Empty state uses EmptyState component
- [ ] Loading uses standard spinner pattern (§17)
- [ ] Typography and colors use design tokens

---

## 7. Technical Form Standards

### Standard Input Field
- **Base**: `w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500`
- **Error State**: `border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50`
- **Disabled State**: `disabled:bg-slate-100 disabled:cursor-not-allowed`

### Form Label
- **View Labels**: `text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1`
- **Form Labels**: `block text-xs font-bold text-white mb-2 uppercase tracking-wider`
- **Required Indicator**: Add `<span className="text-red-500">*</span>` after label text

### Textarea
- **Base**: Same as input, add `rows={3}` or `rows={4}` as needed
- **Resize**: `resize-y` (vertical only) or `resize-none`

### Select/Dropdown
- **Base**: `w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/10 rounded-lg text-sm font-bold text-[color:var(--text-main)] outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 appearance-none cursor-pointer transition-all hover:bg-white/5`
- **Options**: `[&>option]:bg-[color:var(--console-dark)] [&>option]:text-[color:var(--text-main)]`
- **Custom Arrow**: Use Font Awesome chevron-down icon positioned absolutely
- **Error State**: `border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50`

### Form Validation & Error Display
- **Error Message**: `text-[10px] text-red-400 font-black uppercase tracking-tight ml-1`
- **Error Timing**: Show errors on blur or after first submit attempt
- **Clear Errors**: Clear error when field value changes
- **Validation Pattern**:
  ```typescript
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  ```

### Helper Text
- **Helper Text**: `text-[10px] text-[color:var(--text-sub)] font-medium italic opacity-50 ml-1`
- **Show When**: No error present, provide additional context

### Form Layout Patterns
- **Single Column**: `space-y-4` or `space-y-6`
- **Two Column Grid**: `grid grid-cols-2 gap-4`
- **Form Sections**: Use `Card` component with `CardHeader` and `CardContent` for grouped fields

### Form Submission States
- **Loading**: Disable submit button, show spinner icon
- **Success**: Close modal, show success toast, reset form
- **Error**: Show error toast, keep modal open, highlight error fields

## 8. Search & Filter Components

### SearchBar Component (Standard)
- **Use**: `components/UI/SearchBar` component
- **Props**: `value`, `onChange`, `placeholder`, `debounceMs` (default 300ms), `variant` ('default' | 'dark')
- **Default Variant**: `w-full pl-10 pr-10 py-2 border border-white/20 rounded-lg bg-white/5 text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60`
- **Dark Variant**: `w-full pl-10 pr-10 py-3 border border-white/20 rounded-lg bg-white/10 text-white placeholder-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50` — **no** glow shadow
- **Search Icon**: `fas fa-search absolute left-3 top-1/2 -translate-y-1/2`
- **Clear Button**: Show when `value.length > 0`, `aria-label="Clear search"`

### Filter Integration
- **Filter State**: Manage filters in component state, not context
- **Filter UI**: Use `Select` components or custom filter components
- **Active Filters**: Display as chips/badges when filters are active
- **Clear Filters**: Provide "Clear All" button when filters are active

### Advanced Filters Modal
- **Trigger**: Button with filter icon, show count badge when filters active
- **Modal**: Use standard `Modal` component
- **Layout**: Group related filters, use `space-y-4` or `space-y-6`
- **Actions**: "Apply Filters" (primary) and "Clear All" (subtle) buttons

## 9. Select/Dropdown Components

### Select Component (Standard)
- **Use**: `components/UI/Select` component
- **Props**: `label`, `error`, `helperText`, `containerClassName`, standard select props
- **Label**: `block text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest ml-1`
- **Select Base**: `w-full h-10 px-4 bg-[color:var(--console-dark)] border border-white/10 rounded-lg text-sm font-bold text-[color:var(--text-main)] outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 appearance-none cursor-pointer transition-all hover:bg-white/5`
- **Custom Arrow**: `fas fa-chevron-down text-[10px]` positioned absolutely in right side
- **Error State**: `border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50`
- **Error Message**: `text-[10px] text-red-400 font-black uppercase tracking-tight ml-1`
- **Helper Text**: `text-[10px] text-[color:var(--text-sub)] font-medium italic opacity-50 ml-1`

## 10. Badge & Status Indicator System

### Badge Component (Standard)
- **Use**: `components/UI/Badge` component
- **Variants**: `default`, `secondary`, `destructive`, `outline`, `success`, `warning`, `info`
- **Sizes**: `sm`, `md`, `lg`
- **Base Classes**: `inline-flex items-center rounded-full border font-semibold transition-colors`

### Badge Variants (flat — no glow)
- **Default**: `border-transparent text-blue-300 bg-white/5` or `border-blue-500/20 bg-blue-500/10`
- **Secondary**: `border-transparent text-slate-300 bg-white/5`
- **Destructive**: `border-transparent text-red-300 bg-red-500/10 border-red-500/20`
- **Outline**: `text-slate-200 border-white/20 bg-white/5`
- **Success**: `border-transparent text-green-300 bg-green-500/10 border-green-500/20`
- **Warning**: `border-transparent text-amber-300 bg-amber-500/10 border-amber-500/20`
- **Info**: `border-transparent text-cyan-300 bg-cyan-500/10 border-cyan-500/20`
- **No** `shadow-[0_0_...]` on any badge.

### Badge Sizes
- **sm**: `px-2 py-0.5 text-xs`
- **md**: `px-2.5 py-0.5 text-xs`
- **lg**: `px-3 py-1 text-sm`

### Status Capsules (Metric Cards)
- **Container**: `px-2 py-0.5 text-[9px] font-black tracking-widest rounded uppercase`
- **Position**: Absolute top-right of metric card
- **Colors**: Use semantic colors (blue, emerald, amber, indigo, purple)

### Status Badges (Emergency/Critical) — flat
- **Base**: `px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border`
- **Success**: `bg-emerald-500/10 text-emerald-400 border-emerald-500/20` — no glow
- **Critical/Warning**: `bg-amber-500/10 text-amber-400 border-amber-500/20` — no glow

## 11. Toast/Notification System

### Toast Positioning
- **Position**: `top-right` (standard)
- **Duration**: 
  - Success: 3000ms
  - Error: 5000ms
  - Warning: 4000ms
  - Info: 3000ms
  - Loading: Until dismissed or operation completes

### Toast Usage
- **Use**: `utils/toast` helper functions
- **Success**: `showSuccess('Operation completed successfully')`
- **Error**: `showError('Operation failed')`
- **Warning**: `showWarning('Please review your input')`
- **Info**: `showInfo('Information message')`
- **Loading**: `showLoading('Processing...')` then `dismissLoadingAndShowSuccess()` or `dismissLoadingAndShowError()`

### Toast Styling
- **Container**: Managed by `react-hot-toast`
- **Accessibility**: Include `aria-live` regions for screen readers

## 12. Error Handling & Display

### Inline Error Messages
- **Container**: `text-[10px] text-red-400 font-black uppercase tracking-tight ml-1`
- **Position**: Below input field, left-aligned
- **Show When**: Field has error and has been touched/blurred

### Global Error Display
- **Error Boundary**: Use `components/UI/ErrorBoundary` to wrap tab content
- **Error Message**: Display in card with error icon
- **Recovery**: Provide "Retry" or "Go to Dashboard" button

### Network Error Patterns
- **Offline Banner**: `bg-amber-500/20 border-b border-amber-500/50 px-4 py-2`
- **Message**: `text-amber-400 text-xs font-black uppercase tracking-wider`
- **Show When**: `isOffline` state is true

### Validation Error Patterns
- **Field-Level**: Show inline error below field
- **Form-Level**: Show error summary at top of form if needed
- **Error Recovery**: Clear errors when field value changes

## 13. Empty State (Detailed Standard)

### EmptyState Component (Required)
- **Use**: `components/UI/EmptyState` for all empty states
- **Props**: `icon`, `title`, `description`, `action`, `className`
- **No Custom Empty Cards**: Always use the standard component

### Empty State Patterns

#### No Data (Initial State)
- **Icon**: Context-appropriate (e.g., `fas fa-users-slash` for no users)
- **Title**: "No [Resource Name]" (e.g., "No Users")
- **Description**: "Add your first [resource] to begin."
- **Action**: Primary action button (e.g., "ADD FIRST USER")

#### No Results (Filtered State)
- **Icon**: Search/filter icon (e.g., `fas fa-user-slash`)
- **Title**: "No [Resource Name] Found"
- **Description**: "No [resources] match your current filter."
- **Action**: "CLEAR FILTERS" button

#### Empty Table
- **Container**: `p-20` or appropriate padding
- **Use**: Same EmptyState component with table-appropriate messaging

### Empty State Styling (flat)
- **Container**: `text-center py-20 px-8 rounded-md border border-dashed border-[color:var(--border-subtle)]/30 bg-[color:var(--console-dark)]/30` — **no** backdrop-blur
- **Icon**: `text-5xl text-[color:var(--text-sub)] opacity-20 group-hover:opacity-40 transition-opacity` — **no** scale-110 or transform
- **Title**: `text-xl font-black text-white mb-2 uppercase tracking-tighter`
- **Description**: `text-sm text-[color:var(--text-sub)] max-w-xs mx-auto leading-relaxed mb-8 font-medium`
- **Action Button**: Use `variant="outline"` with standard button styling; **no** shadow-lg or glow

## 14. Data Tables & Lists

### Table Structure
- **Container**: Use `<section>` with a heading, or a single `Card` only when the table is a distinct focus block (see §16 When cards are necessary). Prefer section + table for most list/table content.
- **Table**: Standard HTML `<table>` with proper semantic structure
- **Header**: Section heading (`<h3>`) or `CardHeader` with `CardTitle` when a card is used

### Table Styling
- **Table Base**: `w-full` with proper border styling
- **Header Row**: `bg-white/5 border-b border-white/10`
- **Header Cell**: `px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-500`
- **Data Row**: `border-b border-white/5 hover:bg-white/5 transition-colors`
- **Data Cell**: `px-4 py-3 text-sm text-white`
- **Row Click**: Add `cursor-pointer` and `onClick` handler if rows are clickable

### Table Features
- **Sorting**: Clickable headers with sort indicators (up/down arrows)
- **Filtering**: Integrate with SearchBar and filter components
- **Pagination**: Use standard pagination controls (see Pagination section)
- **Empty State**: Show EmptyState component when `data.length === 0`

### List View (Alternative to Tables)
- **Container**: `<section>` + heading + filters + grid/list. Use `space-y-3` for vertical list or a grid for item tiles.
- **List Item**: Use **bordered div** (`rounded-lg border border-white/5 p-4`) for each item unless the item is a distinct focus block (e.g. camera tile, locker tile). Use `Card` only when §16 "When cards are necessary" applies.
- **Item Layout**: Flex or grid layout within the block
- **Empty State**: Same EmptyState component

## 14A. DataTable Component (Dark Console)

**Critical:** The shared `components/UI/DataTable.tsx` must use dark console colors only. Light-mode classes break the Security Console aesthetic.

### Required Color Mappings (DataTable)
- **Container**: `bg-white` → `bg-slate-900/50` or `bg-[color:var(--surface-card)]`; use `border border-white/5`
- **Skeleton / loading**: `bg-gray-200` → `bg-white/10`; avoid `bg-gray-50`
- **Header row**: `bg-gray-50` → `bg-white/5`; cell text `text-[9px] font-black text-slate-500 uppercase tracking-widest`
- **Body**: `bg-white` → transparent or `bg-white/[0.02]`; `divide-gray-200` → `divide-white/5`
- **Text**: `text-gray-900` → `text-white`; `text-gray-500` → `text-slate-400`; `text-gray-700` → `text-slate-300`
- **Borders**: `border-gray-200` → `border-white/5`; `border-gray-300` → `border-white/10`
- **Row hover**: `hover:bg-gray-50` → `hover:bg-white/5`; `hover:bg-gray-100` → `hover:bg-white/10`
- **Focus**: `focus:ring-blue-500` → `focus:ring-blue-500/60`
- **Pagination area**: `bg-gray-50 border-t` → `bg-white/5 border-t border-white/5`; page info `text-[10px] font-mono text-slate-500 uppercase tracking-widest` or `text-sm text-slate-300`

### DataTable Accessibility
- **Sortable headers**: Add `aria-sort={sortColumn === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}` to `<th>`.
- **Icon-only buttons**: Prev/Next pagination, filter icons, and any action icons must have `aria-label` (e.g. "Previous page", "Next page", "Filter by {column}") and `aria-hidden="true"` on the icon element.
- **Live regions**: Optional `aria-live="polite"` on the "Showing X–Y of Z" pagination text so updates are announced.

## 15. Button Variants (Complete System)

### Button Component (Standard)
- **Use**: `components/UI/Button` component
- **Variants**: `default`, `primary`, `outline`, `ghost`, `destructive`, `subtle`, `link`, `warning`, `glass`
- **Sizes**: `default`, `sm`, `lg`, `icon`

### Button Variants (flat — no glow, no transform)
- **Default**: `bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 hover:text-white hover:border-white/10`
- **Primary**: `bg-blue-600 text-white border border-blue-500/50 hover:bg-blue-500` — **no** shadow, **no** glow; solid color only
- **Outline**: `border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white`
- **Ghost**: `text-slate-400 hover:bg-white/5 hover:text-white`
- **Destructive**: `bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300`
- **Subtle**: `bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white`
- **Link**: `text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline`
- **Warning**: `bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 hover:text-amber-300`
- **Glass**: `bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white hover:border-white/20` — **no** backdrop-blur

### Button Sizes
- **default**: `h-10 py-2 px-4 text-sm`
- **sm**: `h-8 px-3 text-xs`
- **lg**: `h-12 px-8 text-base`
- **icon**: `h-10 w-10`

### Button Usage
- **Header Actions**: Use `variant="glass"` for primary header buttons
- **Modal Actions**: Use `variant="subtle"` for Cancel, `variant="primary"` for Save/Create
- **Destructive Actions**: Use `variant="destructive"` for delete/remove actions
- **Icon Buttons**: Use `size="icon"` with Font Awesome icon

## 16. Card Component Variations

> **Cards: use only when necessary.** We **can** keep cards when the design clearly benefits, but **only** then. Default to sections, metrics bars, and bordered blocks; add cards only when one of the cases below applies.

**Card rule audit:** Audit all modules against this section (§16). See **`docs/audits/CARD_GOLDSTANDARD_AUDIT.md`** for a tab-by-tab audit of every feature: which tabs are overdesigned (KPI card grids, section Cards, list items as Cards) vs applicable (modals, distinct focus blocks, visual grid tiles, single table/list container). Apply simplifications **only where applicable** — overview/dashboard KPIs and list wrappers should move to metrics bar + section + bordered divs; keep cards in modals, distinct panels, and visual grids.

### When cards are necessary

Use a **Card** (or card-like bordered block) when:

1. **A distinct focus block** — One-off panels that must stand out (e.g. "Manager notified" in item details, approval status, a single critical alert). The block is a **single conceptual thing**, not one of many list rows.
2. **Modals and form grouping** — Grouping related fields inside a modal (e.g. "Contact details", "Legal compliance") where a card clearly improves scan-ability. Modal content can still be flat; use cards only for distinct subsections.
3. **Visual/layout grids** — Tiles in a **visual** grid where each tile is a distinct unit (e.g. camera wall tile, locker tile, handover card in a grid). Here the card is the layout primitive.
4. **Tables or list containers** — Wrapping a **single** table or list in a card when the whole block needs a clear boundary and optional header (e.g. "Access points" table). Prefer one card per logical block, not per row.

### When cards are not necessary

Do **not** use cards for:

- **KPI/metric grids** — Use a **compact metrics bar** (e.g. "Total **12** · Found **8** · Claimed **3**") instead of 4–6 KPI cards.
- **Section wrappers** — Use `<section>` + `<h3>` + content. No card around "Item Management", "Package list", etc.
- **List items in a grid** — Use **bordered divs** (`rounded-lg border p-4`) for each item unless the item is a distinct focus block (e.g. camera tile).
- **Every block on the page** — Avoid card-after-card; it dilutes emphasis and feels over-designed.

### Card Component (Standard) — flat
- **Use**: `components/UI/Card` with `CardHeader`, `CardTitle`, `CardContent` **only when one of "When cards are necessary" applies**.
- **Base**: `bg-slate-900/50 border border-white/5` — **no** backdrop-blur, **no** shadow-2xl. **Reference:** Patrol Command Center cards.

### Card with Header (canonical)
- **Header**: `CardHeader` with `border-b border-white/5 pb-4 px-6 pt-6`
- **Title**: `CardTitle` with **icon box + title** per §3 (e.g. `w-10 h-10 bg-blue-600 rounded-md ...` + `<span className="text-sm font-black uppercase tracking-widest">Section Title</span>`). Optional right-side actions in same row.
- **Content**: `CardContent` with `px-6 py-6` or `pt-6`
- **Prefer:** Metrics bar for overview/dashboard tops; use cards for distinct blocks (tables, lists, panels).

### KPI / stat block (when needed)
- **Container**: `p-4 rounded-md bg-slate-900/30 border border-white/5`
- **Label**: `text-[9px] font-black uppercase tracking-widest text-slate-500`
- **Value**: `text-2xl font-black text-white`
- **Prefer instead:** Metrics bar unless a specific KPI must stand out.
- **Use when:** Wrapping a single table, list, or form subsection that benefits from a clear bordered container and icon+title header.

## 17. Loading States & Spinners (Gold Standard)

> [!IMPORTANT]
> **Use consistent spinner styles across all modules.** Do not create custom spinner implementations. Standardize existing spinners to match these patterns.

### Standard Spinner Pattern

#### Initial Load Spinner (Full Page/Tab)
- **Container**: `flex flex-col items-center justify-center min-h-[400px] space-y-4`
- **Spinner**: `w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin`
  - **Size**: `w-12 h-12` (48px × 48px)
  - **Border**: `border-4` (4px width)
  - **Colors**: `border-blue-500/20` (static border), `border-t-blue-500` (animated top border)
  - **Shape**: `rounded-full` (circle)
  - **Animation**: `animate-spin` (Tailwind spin animation)
  - **No glow/shadow**: Do not add `shadow-[...]` or colored glows to standard spinners
- **Text**: `text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse`
- **Message Format**: "Loading [Resource Name]..." (e.g., "Loading Access Points...", "Loading Events...")
- **Accessibility**: Include `role="status"` and `aria-label="Loading [resource name]"`

#### Inline Loading Spinner (Within Content)
- **Spinner**: `w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin`
  - **Size**: `w-10 h-10` (40px × 40px) - smaller for inline use
  - **Border**: `border-2` (2px width) - thinner for inline
  - **Colors**: Same as initial load spinner
- **Text**: `text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] animate-pulse`
- **Container**: `flex flex-col items-center justify-center space-y-2` (minimal spacing)

#### Button Loading State
- **Icon Spinner**: Use Font Awesome spinner icon: `<i className="fas fa-spinner fa-spin mr-2" aria-hidden="true" />`
- **Alternative**: Small inline spinner: `w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin`
- **Disabled State**: Always disable button during operation
- **Text Change**: Optionally change button text (e.g., "Refreshing...", "Saving...", "Loading...")
- **Visual Feedback**: Show spinner icon + disabled state, maintain button text or show loading text

#### LoadingSpinner Component (Preferred)
- **Component**: Use `components/UI/LoadingSpinner` when available
- **Import**: `import LoadingSpinner from '../../../../components/UI/LoadingSpinner';`
- **Usage**: `<LoadingSpinner variant="spinner" size="medium" message="Loading..." />`
- **Variants**: `'spinner' | 'dots' | 'pulse' | 'skeleton'`
- **Sizes**: `'small' | 'medium' | 'large' | 'xlarge'`
- **When to Use**: Prefer component over inline styles when component is available

#### Per-Resource Loading States
- **State Management**: Track loading per resource type (e.g., `loading.incidents`, `loading.messages`, `loading.teams`)
- **Conditional Rendering**: Show spinner only when `loading.[resource] && [resource].length === 0`
- **Partial Loading**: When data exists, show data with disabled actions rather than spinner
- **Loading Object Pattern**:
  ```typescript
  const [loading, setLoading] = useState({
    incidents: false,
    messages: false,
    teams: false,
    // ... per resource
  });
  ```

#### Spinner Color Standards
- **Primary/Default**: `border-blue-500/20` (static) + `border-t-blue-500` (animated)
- **Text Color**: `text-blue-400` (matches spinner color)
- **No Semantic Colors**: Do not use red/green/amber for standard loading states
- **Exception**: Only use semantic colors for error/warning loading states if explicitly needed

#### Spinner Size Standards
- **Full Page/Tab**: `w-12 h-12 border-4` (48px, 4px border)
- **Inline Content**: `w-10 h-10 border-2` (40px, 2px border)
- **Button/Icon**: `w-4 h-4 border-2` (16px, 2px border) or Font Awesome `fa-spinner`
- **Table/Card**: `w-10 h-10 border-2` (40px, 2px border)

#### Prohibited Spinner Patterns
- ❌ **No colored glows**: Remove `shadow-[0_0_15px_rgba(59,130,246,0.5)]` or similar colored shadows
- ❌ **No mixed border opacities**: Use consistent `border-blue-500/20` pattern, not `border-white/5` or `border-white/10`
- ❌ **No custom animations**: Use Tailwind `animate-spin`, not custom CSS animations
- ❌ **No semantic colors for standard loading**: Don't use red/green/amber unless indicating error/warning state
- ❌ **No varying sizes**: Stick to standard sizes (12/10/4) based on context

#### Loading State Best Practices
- **Show immediately**: Display loading state as soon as operation starts
- **Maintain context**: Keep UI structure visible during loading (skeleton screens for complex layouts)
- **Error handling**: If loading fails, show error message, not infinite spinner
- **Timeout**: Consider timeout for long operations (show "Taking longer than expected..." after 10+ seconds)
- **Accessibility**: Always include `aria-label` or `role="status"` for screen readers

## 18. Accessibility Standards (a11y)

### ARIA Labels & Roles
- **Buttons**: Include `aria-label` for icon-only buttons
- **Modals**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to title
- **Tabs**: `role="tablist"`, `role="tab"`, `aria-selected` for active tab
- **Status**: `role="status"` for loading spinners, `aria-live="polite"` for dynamic updates
- **Alerts**: `role="alert"` for critical error messages

### Icon-Only Buttons (Required)
All icon-only buttons must be accessible. Apply everywhere: DataTable action buttons, modal close/cancel triggers, filter toggles, sidebar collapse, tab icons, card action icons.
- **Pattern**: `<button onClick={...} aria-label="Edit record"><i className="fas fa-edit" aria-hidden="true" /></button>`
- **Wrong**: `<button><i className="fas fa-edit" /></button>` (screen reader announces nothing useful)
- Use a short, action-oriented label (e.g. "Edit record", "Delete item", "Previous page", "Filter by status").

### Sortable Table Headers
For sortable columns in DataTable or any table, announce sort state to screen readers:
- **Attribute**: `aria-sort={sortColumn === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}` on `<th>`.
- Keep visible sort indicator (chevron) in addition to aria-sort.

### Semantic HTML
- **Use Proper Elements**: `<nav>`, `<main>`, `<section>`, `<article>`, `<header>`, `<footer>`
- **Headings**: Proper hierarchy (h1 → h2 → h3), no skipping levels
- **Lists**: Use `<ul>`, `<ol>`, `<li>` for lists, `role="list"` for dynamic lists

### Keyboard Navigation
- **Tab Order**: Logical tab order, all interactive elements focusable
- **Focus Indicators**: Visible focus rings (`focus:ring-2 focus:ring-blue-500/60`)
- **Focus Traps**: Modals trap focus, restore focus on close
- **Keyboard Shortcuts**: Document global shortcuts (e.g., Ctrl+Shift+R for refresh)

### Screen Reader Support
- **Live Regions**: Use `aria-live="polite"` for status updates, `aria-live="assertive"` for urgent
- **Descriptions**: Use `aria-describedby` for additional context
- **Hidden Text**: Use `sr-only` class for screen-reader-only text
- **Decorative Icons**: Use `aria-hidden="true"` for decorative Font Awesome icons

### Color Contrast
- **Text on Background**: Minimum 4.5:1 for normal text, 3:1 for large text (WCAG AA)
- **Interactive Elements**: Clear focus indicators, sufficient contrast for disabled states

### Reduced Motion
- **Respect Preference**: Use `@media (prefers-reduced-motion: reduce)` to disable animations
- **Pattern**: `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; } }`

## 19. Responsive Design & Breakpoints

### Breakpoint System
- **sm**: 640px (small tablets)
- **md**: 768px (tablets)
- **lg**: 1024px (desktops)
- **xl**: 1280px (large desktops)
- **2xl**: 1536px (extra large)

### Mobile-First Approach
- **Base Styles**: Mobile styles first, then add `md:`, `lg:`, etc. for larger screens
- **Grid Patterns**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:grid-cols-4`
- **Spacing**: Adjust padding/margins for mobile (`px-4 md:px-6 lg:px-8`)

### Component Responsive Behavior
- **Cards**: Stack on mobile, grid on desktop
- **Tables**: Horizontal scroll on mobile, or convert to card list
- **Modals**: Full width on mobile, constrained on desktop
- **Navigation**: Hamburger menu on mobile, sidebar on desktop

### Touch Target Sizes
- **Minimum**: 44x44px for all interactive elements
- **Button Padding**: Ensure sufficient padding for touch targets
- **Spacing**: Adequate spacing between touch targets (minimum 8px)

## 20. Animation & Transitions

### Transition Durations
- **Fast**: 200ms (hover states, quick interactions)
- **Standard**: 300ms (most transitions)
- **Slow**: 500ms (page transitions, complex animations)

### Easing Functions
- **Default**: Tailwind default easing (ease-in-out)
- **Hover**: `transition-all duration-200`
- **Scale**: `transition-transform duration-300`

### Hover Transitions (flat — no transform)
- **Buttons**: `transition-colors` only; **no** active:scale or translateY
- **Cards**: **no** group-hover:scale-110; use `transition-colors` or `hover:bg-white/5` only if needed
- **Icons**: `group-hover:opacity-100 transition-opacity` is fine; **no** scale on hover

### Reduced Motion Support
- **Respect**: Always respect `prefers-reduced-motion`
- **Pattern**: Disable animations when user prefers reduced motion

## 21. Z-Index Layering System

### Z-Index Hierarchy
- **Base Content**: `z-0` (default)
- **Sticky Elements**: `z-[70]` (tabs bar)
- **Dropdowns**: `z-[80]` (dropdowns, popovers)
- **Modals**: `z-[100]` (modals, dialogs)
- **Tooltips**: `z-[90]` (tooltips, if used)
- **Notifications**: `z-[110]` (toast notifications, if needed)

### Rules
- **Modals Always Above**: Modals must exceed tabs bar z-index
- **No Conflicts**: Use standard values, avoid arbitrary high z-index values
- **Stacking Context**: Be aware of stacking contexts created by transforms, opacity, etc.

## 22. Icon System

### Icon Library
- **Library**: Font Awesome (Free version)
- **Usage**: `<i className="fas fa-[icon-name]"></i>`
- **Sizes**: Use Tailwind text size classes (`text-sm`, `text-lg`, `text-xl`, `text-2xl`)

### Icon Sizes
- **xs**: `text-xs` (12px)
- **sm**: `text-sm` (14px)
- **md**: `text-base` (16px) - default
- **lg**: `text-lg` (18px)
- **xl**: `text-xl` (20px)
- **2xl**: `text-2xl` (24px)

### Icon Colors
- **Default**: Inherit text color
- **Neutral**: `text-slate-400` or `text-slate-500`
- **Semantic**: Use semantic colors (blue, emerald, red, amber) for status
- **White**: `text-white` for icons on dark backgrounds

### Icon Accessibility
- **Decorative**: Use `aria-hidden="true"` for decorative icons
- **Semantic**: Include `aria-label` if icon conveys meaning without text
- **Spacing**: Use `mr-2` or `ml-2` for spacing between icon and text

### Common Icons
- **Add/Create**: `fas fa-plus`
- **Edit**: `fas fa-edit` or `fas fa-pencil-alt`
- **Delete**: `fas fa-trash`
- **Search**: `fas fa-search`
- **Close**: `fas fa-times`
- **Check**: `fas fa-check`
- **Loading**: `fas fa-spinner fa-spin`

## 23. Pagination Patterns

### Pagination Controls (Dark Console)
- **Container**: `flex items-center justify-between px-4 py-3 border-t border-white/5 bg-white/5`
- **Page Info**: `text-[10px] font-mono text-slate-500 uppercase tracking-widest` or `text-sm text-slate-300` (e.g., "Showing 1–10 of 50")
- **Navigation Buttons**: Use Button component `variant="outline"` and `size="sm"`; icon-only prev/next must have `aria-label="Previous page"` / `aria-label="Next page"`
- **Page Numbers**: Show current page, ellipsis for ranges; active page: primary (e.g. `bg-blue-600 text-white` or design-system primary)
- **Disabled**: `disabled:opacity-50 disabled:cursor-not-allowed`; avoid light gray backgrounds

### Page Size Selector
- **Select**: Use Select component
- **Options**: 10, 25, 50, 100
- **Position**: Right side of pagination controls

## 24. State Management Architecture

### Module Structure Pattern
- **Orchestrator**: High-level layout, routing, ModuleShell wrapper
- **Context**: State provider with typed interface
- **Hooks**: Business logic separated into focused hooks:
  - `use[Module]State` - Data fetching and state management
  - `use[Module]Actions` - Action handlers (create, update, delete)
  - `use[Module]WebSocket` - Real-time updates
  - `use[Module]Telemetry` - Observability tracking
- **Services**: API layer abstraction (e.g., `PatrolEndpoint`, `GuestSafetyService`)
- **Types**: TypeScript type definitions in `types.ts`

### Context Pattern
```typescript
// Context provides typed interface
interface ModuleContextValue {
  // State
  items: Item[];
  loading: { items: boolean; item: boolean };
  // Actions
  createItem: (data: CreateItemRequest) => Promise<void>;
  updateItem: (id: string, data: UpdateItemRequest) => Promise<void>;
  // Refresh
  refreshData: () => Promise<void>;
}

// Hook returns context value
export function useModuleState(): ModuleContextValue {
  // Implementation
}

// Context provider wraps orchestrator
<ModuleContext.Provider value={moduleState}>
  <ModuleOrchestrator />
</ModuleContext.Provider>
```

### Service Layer Pattern
- **API Abstraction**: All API calls go through service layer
- **Error Handling**: Service layer handles errors, returns typed responses
- **Retry Logic**: Use `retryWithBackoff` utility for critical operations
- **Type Safety**: Service methods return typed `ApiResponse<T>`

## 25. WebSocket Integration Pattern

### WebSocket Hook Structure
```typescript
// hooks/use[Module]WebSocket.ts
export interface Use[Module]WebSocketOptions {
  onItemCreated?: (item: Item) => void;
  onItemUpdated?: (item: Item) => void;
  onItemDeleted?: (itemId: string) => void;
  // Module-specific events
}

export function use[Module]WebSocket(options: Use[Module]WebSocketOptions = {}) {
  const { isConnected, subscribe } = useWebSocket();

  useEffect(() => {
    if (!isConnected) {
      logger.debug('WebSocket not connected', { module: '[Module]WebSocket' });
      return;
    }

    // Subscribe to events
    const unsubscribeCreated = subscribe('item.created', (data: any) => {
      if (data?.item && options.onItemCreated) {
        logger.info('Item created via WebSocket', { module: '[Module]WebSocket' });
        options.onItemCreated(data.item);
      }
    });

    // ... more subscriptions

    return () => {
      unsubscribeCreated();
      // ... cleanup all subscriptions
    };
  }, [isConnected, subscribe, options]);
}
```

### Integration in Orchestrator
```typescript
// In orchestrator component
use[Module]WebSocket({
  onItemCreated: (item) => {
    setItems(prev => [item, ...prev]);
    trackAction('item_created', 'item', { itemId: item.id });
  },
  onItemUpdated: (item) => {
    setItems(prev => prev.map(i => i.id === item.id ? item : i));
    trackAction('item_updated', 'item', { itemId: item.id });
  },
  // ... other handlers
});
```

### WebSocket Channel Naming
- **Format**: `[module].[action]` (e.g., `patrol.updated`, `checkpoint.checkin`)
- **Consistency**: Use lowercase with dots for separation
- **Documentation**: Document all channels in module README

## 26. Telemetry & Observability Pattern

### Telemetry Hook Structure
```typescript
// hooks/use[Module]Telemetry.ts
export function use[Module]Telemetry() {
  const { user } = useAuth();

  const trackAction = useCallback((
    action: string,
    entity: string,
    metadata?: Record<string, unknown>
  ) => {
    telemetry.trackUserAction(action, entity, {
      ...metadata,
      userId: user?.user_id,
      propertyId: user?.roles?.[0] || undefined
    });
  }, [user]);

  const trackPerformance = useCallback((
    operation: string,
    duration: number,
    metadata?: Record<string, unknown>
  ) => {
    telemetry.trackPerformance(operation, duration, {
      ...metadata,
      userId: user?.user_id
    });
  }, [user]);

  const trackError = useCallback((
    error: Error,
    context: Record<string, unknown>
  ) => {
    telemetry.trackError(error, {
      ...context,
      userId: user?.user_id
    });
  }, [user]);

  return { trackAction, trackPerformance, trackError };
}
```

### When to Track
- **User Actions**: All create, update, delete, view operations
- **Performance**: Long-running operations (>500ms)
- **Errors**: All caught errors with context
- **Critical Events**: Emergency alerts, system state changes

### Integration Pattern
```typescript
// In action handlers
const handleCreate = async (data: CreateRequest) => {
  const startTime = Date.now();
  try {
    await createItem(data);
    trackAction('item_created', 'item', { itemId: data.id });
    trackPerformance('create_item', Date.now() - startTime);
  } catch (error) {
    trackError(error as Error, { action: 'create_item', data });
    throw error;
  }
};
```

## 27. Global Refresh Pattern

### Global Refresh Integration
```typescript
// In orchestrator
const ModuleGlobalRefresh: React.FC = () => {
  const { register, unregister } = useGlobalRefresh();
  const { refreshData } = useModuleContext();

  useEffect(() => {
    const handler = async () => {
      await refreshData();
    };
    register('module-name', handler);
    return () => unregister('module-name');
  }, [register, unregister, refreshData]);

  return null;
};

// In main orchestrator
<ModuleProvider>
  <ModuleGlobalRefresh />
  <ModuleShell>...</ModuleShell>
</ModuleProvider>
```

### Keyboard Shortcut
- **Standard**: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac) triggers global refresh
- **Implementation**: Add keyboard listener in orchestrator
- **Feedback**: Show toast notification on refresh

### Last Refreshed Indicator
```typescript
// In tab components
const { lastRefreshedAt } = useGlobalRefresh();

{lastRefreshedAt && (
  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest" aria-live="polite">
    Data as of {lastRefreshedAt.toLocaleTimeString()} · Refreshed {formatRefreshedAgo(lastRefreshedAt)}
  </p>
)}
```

## 28. Retry Logic Pattern

### Retry Utility Usage
```typescript
import { retryWithBackoff } from '../../../utils/retryWithBackoff';

// For critical operations
const result = await retryWithBackoff(
  () => apiService.createItem(data),
  {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    shouldRetry: (error) => {
      // Don't retry on 4xx errors
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        return axiosError.response?.status ? axiosError.response.status >= 500 : true;
      }
      return true; // Retry network errors
    }
  }
);
```

### When to Use Retry
- **Critical Operations**: Deployment, emergency alerts, data sync
- **Network Operations**: API calls that might fail due to connectivity
- **Not for**: User input validation errors (4xx), authentication errors

### Retry Best Practices
- **Max Retries**: 3 attempts for most operations
- **Backoff**: Exponential (1s, 2s, 4s)
- **User Feedback**: Show loading state during retries
- **Error Handling**: After all retries fail, show user-friendly error

## 29. Offline Queue Management Pattern

### Offline Queue Hook
```typescript
// hooks/use[Module]Queue.ts
export function use[Module]Queue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Queue operations when offline
  const queueOperation = useCallback((operation: QueueItem) => {
    if (!isOnline) {
      setQueue(prev => [...prev, operation]);
    }
  }, [isOnline]);

  // Sync queue when online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      syncQueue();
    }
  }, [isOnline, queue]);

  return { queue, queueOperation, syncQueue };
}
```

### Queue UI Indicators
- **Tab Badge**: Show pending count in tab label
- **Banner**: Show offline status banner when offline
- **Queue Manager**: Settings tab or dedicated section to view/retry failed items

### Queue Best Practices
- **Size Limit**: Implement queue size limit (e.g., 100 items)
- **Eviction**: Remove oldest items when limit reached
- **Retry Logic**: Automatic retry with exponential backoff
- **Failed Items**: Mark as failed after max retries, allow manual retry

## 30. Hardware Integration Pattern

### Heartbeat Tracking
```typescript
// Automatic offline detection based on heartbeat
useEffect(() => {
  if (!settings.heartbeatOfflineThresholdMinutes) return;
  
  const interval = setInterval(() => {
    const thresholdMs = settings.heartbeatOfflineThresholdMinutes * 60 * 1000;
    const now = Date.now();
    
    setDevices(prev => prev.map(device => {
      if (!device.last_heartbeat) return device;
      
      const lastHeartbeat = new Date(device.last_heartbeat).getTime();
      const elapsed = now - lastHeartbeat;
      const shouldBeOffline = elapsed > thresholdMs;
      
      return {
        ...device,
        connection_status: shouldBeOffline ? 'offline' : 'online'
      };
    }));
  }, 60000); // Check every minute
  
  return () => clearInterval(interval);
}, [settings.heartbeatOfflineThresholdMinutes, devices]);
```

### Device Status Display
- **Connection Status**: Show online/offline badge
- **Last Heartbeat**: Display last heartbeat timestamp
- **Health Monitoring**: Show device health metrics in UI
- **Reconnection Handling**: Auto-update status when device reconnects

### Hardware Fail-Safe Patterns
- **Last Known Good State**: Display last known state when offline
- **Safe State**: Default to safe/disabled state on disconnect
- **State Sync**: Reconcile state when connection restored
- **Race Condition Prevention**: Use version locking for concurrent updates

## 31. Error Handling Service Pattern

### ErrorHandlerService Usage
```typescript
import { ErrorHandlerService } from '../../../services/ErrorHandlerService';

// Replace console.error with:
ErrorHandlerService.handle(error, 'operationName', {
  context: 'moduleName',
  metadata: { itemId, userId }
});

// Never use:
// console.error('Error', error); // ❌
```

### Error Handling Best Practices
- **Structured Logging**: Always include context and metadata
- **User-Friendly Messages**: Show generic messages to users, detailed logs for debugging
- **Error Recovery**: Provide retry actions where appropriate
- **Error Boundaries**: Wrap tab content in ErrorBoundary

## 32. CRITICAL AUDIT CHECKPOINTS

### When patterns apply (optionality)
- **WebSocket**: Required only when the module has real-time data (e.g. live updates, events). N/A for static/reference modules (e.g. Settings-only tabs).
- **Telemetry**: Required for all modules that perform user actions (create, update, delete, tab change). N/A for read-only or config-only modules if no user actions are tracked.
- **Global refresh**: Required for all modules that display server-fetched data. Register with `useGlobalRefresh()` and implement Ctrl+Shift+R.
- **Offline queue**: Required only when the module allows create/update/delete while offline. N/A for read-only or online-only modules.
- **Hardware / heartbeat**: Required only when the module displays or controls hardware devices (cameras, access points, etc.). N/A otherwise.
- **ErrorHandlerService**: Required for all modules; never use `console.error` for user-facing or operational errors.

### Checklist
- [ ] **BORDERS**: Are all cards using `border-white/5`? (Check for `border-slate-800`)
- [ ] **METRIC COLOR**: Are metric numeric values `text-white`? (Check for semantic text colors)
- [ ] **TYPE MONO**: Do license plates/prices use `font-mono`?
- [ ] **TERMINOLOGY**: Is there any forensic jargon? (e.g. "Asset Location Matrix")
- [ ] **FLAT CTAs**: Do primary header buttons use flat styling (no glow/shadow)?
- [ ] **ICON TILES**: Do icon tiles use flat styling with no colored drop shadows or blur?
- [ ] **CTA SHADOWS**: Are CTA buttons free of colored drop shadows and glow?
- [ ] **SPINNER CONSISTENCY**: Are all spinners using the standard pattern (`border-blue-500/20 border-t-blue-500`)? (Check for colored glows, mixed opacities, custom sizes)
- [ ] **WEBSOCKET**: Is WebSocket integration implemented for real-time updates?
- [ ] **TELEMETRY**: Are telemetry hooks implemented and tracking user actions?
- [ ] **GLOBAL REFRESH**: Is global refresh integrated with keyboard shortcut?
- [ ] **RETRY LOGIC**: Are critical operations wrapped with retry logic?
- [ ] **OFFLINE QUEUE**: Is offline queue management implemented for critical operations?
- [ ] **ERROR HANDLING**: Are all errors handled via ErrorHandlerService (no console.error)?
- [ ] **HARDWARE SYNC**: Is automatic offline detection implemented for hardware devices?

## 8. Access Control UI To‑Do (Gold Standard Alignment)
Reference: `frontend/src/features/smart-parking` and `frontend/src/features/patrol-command-center`

### Dashboard Tab
- Card/section headers: flat icon box + title per §3 (no gradient, no shadow).
- Remove colored CTA shadows on alert actions (Dispatch/Acknowledge).
- Card borders: `border-white/5`.

### Access Points Tab
- Remove colored CTA shadows on header buttons (Add Access Point).
- Cards: flat only — `bg-slate-900/50 border border-white/5`; no glow, no shadow-2xl.
- Card section headers: use flat icon box + title per §3 (e.g. `w-10 h-10 bg-blue-600 rounded-md` + title).

### Users Tab
- Remove colored CTA shadows on header buttons (Add User, Bulk Actions).
- Card headers: icon box + title per §3 (flat, no gradient/shadow).

### Events Tab
- Remove colored CTA shadows on Export Logs button.
- Card/list headers: flat icon + title per §3.

### AI Analytics Tab
- Icon tiles: flat solid bg, rounded-md, no shadow/glow; match §3.
- CTA buttons: flat (no colored shadows).

### Reports Tab
- Remove colored CTA shadows on Export buttons.
- Report card headers: icon box + title per §3.

### Configuration Tab
- Icon tiles: flat (no shadow/ring); card headers per §3.
- Remove colored CTA shadows on Save Changes.
- Card borders: `border-white/5`.

### Lockdown Facility Tab
- Lockdown + Hardware card headers: flat icon box + title per §3.
- Remove colored CTA shadows on Lockdown actions.

---

## Universal Module Audit Checklist

> **Purpose**: Use this checklist to audit **every module** against the UI-GOLDSTANDARD. Check off each item as you verify it. Items marked with ⚠️ are critical and must pass. For optionality (WebSocket, offline queue, hardware, etc.), see **§32 When patterns apply (optionality)**.

### Module Information
- **Module Name**: _______________________
- **Audit Date**: _______________________
- **Auditor**: _______________________
- **Status**: ⬜ Pass ⬜ Fail ⬜ Needs Work

---

### 1. Module Structure & Layout ⚠️

#### ModuleShell Usage
- [ ] Module uses `ModuleShell` component from `components/Layout/ModuleShell`
- [ ] All required props provided: `icon`, `title`, `subtitle`, `tabs`, `activeTab`, `onTabChange`
- [ ] Module header has correct styling (`glass-strong border-b border-white/10`)
- [ ] Module icon is 16x16 (`w-16 h-16`) with proper styling
- [ ] Module title uses class **`module-header-title`** (global)
- [ ] Subtitle uses `text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400`

#### Tab Navigation
- [ ] Tabs bar is sticky (`sticky top-0 z-[70]`)
- [ ] Active tab: white text + 2px blue bottom border (no pill, no glow); see §5 Tab Navigation Bar
- [ ] Inactive tabs have hover states
- [ ] Tab buttons have focus indicators
- [ ] Tabs use `text-[10px] font-black uppercase tracking-widest`

#### Content Container
- [ ] Main content uses `max-w-[1800px] mx-auto px-6 py-8`
- [ ] Proper spacing between sections (`space-y-6`)

---

### 2. Tab Page Headers ⚠️

> **Per-tab audit:** For each tab in the module, compare against **§6A Patrol Command Center — Tab Content Gold Standard** (e.g. OverviewTab, PatrolManagementTab). Use the Tab Audit Checklist (per tab) in §6A.

#### Required Header Structure
- [ ] Every tab has a page header with title and subtitle
- [ ] Header uses `flex justify-between items-end mb-8` layout
- [ ] Page title uses class **`page-title`** (global)
- [ ] Page subtitle uses `text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70`
- [ ] Optional right-side metadata (last refreshed time) uses proper styling

---

### 3. Visual Identity & Design Tokens ⚠️

#### Borders
- [ ] All cards use `border-white/5` (check for `border-slate-800` or other variants)
- [ ] No mixed border tokens (e.g., `border-[color:var(--border-subtle)]/50`)

#### Colors
- [ ] Metric numeric values use `text-white` (never semantic colors for metrics)
- [ ] License plates, IDs, prices use `font-mono`
- [ ] Text colors follow hierarchy: `text-white` (main), `text-slate-500` (sub), `text-slate-400` (muted)

#### Flat Effects (no glassmorphism)
- [ ] Cards use solid backgrounds (e.g. `bg-slate-900/50` or `var(--glass-card-bg)`); **no** `backdrop-blur`
- [ ] No colored drop shadows or glow box-shadows on icon containers or CTAs
- [ ] Shadows are minimal: `0 1px 3px rgba(0,0,0,0.12)` or none

---

### 4. High-Density Components

#### Card header icon (flat) — §3
- [ ] Card section headers use icon box + title: `w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5` + title span
- [ ] No gradient, no shadow, no hover scale on icon boxes
- [ ] No colored drop shadows on any icons or buttons
- [ ] Icon size is `text-lg` inside container

#### Metric Cards (flat)
- [ ] Metric cards use: `bg-slate-900/50 border border-white/5` (no backdrop-blur, no heavy shadow)
- [ ] Status capsules (if used) positioned absolute top-right
- [ ] Labels use: `text-[9px] font-black uppercase tracking-widest text-slate-500`
- [ ] Metric values use: `text-3xl font-black text-white`
- [ ] Subtext uses: `text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400`

#### KPI Cards
- [ ] KPI containers use: `p-4 rounded-xl bg-slate-900/30 border border-white/5`
- [ ] KPI labels use: `text-[9px] font-black uppercase tracking-widest text-slate-500`
- [ ] KPI values use: `text-2xl font-black text-white` (semantic color only for emphasis)

---

### 5. Buttons ⚠️

#### Button Component Usage
- [ ] All buttons use `components/UI/Button` component
- [ ] Header action buttons use `variant="glass"`
- [ ] Modal Cancel buttons use `variant="subtle"`
- [ ] Modal Save/Create buttons use `variant="primary"`
- [ ] Destructive actions use `variant="destructive"`
- [ ] No colored drop shadows on buttons

#### Button Styling
- [ ] Buttons have proper hover states
- [ ] Buttons have focus indicators
- [ ] Icon buttons use `size="icon"`
- [ ] Button text uses proper typography

---

### 6. Modals ⚠️

#### Modal Component
- [ ] All modals use `components/UI/Modal` component
- [ ] No custom modal wrappers
- [ ] Modals are draggable (default behavior)
- [ ] Modal z-index is `z-[100]` or higher (above tabs)

#### Modal Structure
- [ ] Modal title uses: `text-xl font-black uppercase tracking-tighter text-white mb-6`
- [ ] Modal content uses flat layout (`space-y-4` or `space-y-6`)
- [ ] No inner card wrappers in modal content
- [ ] **No section divider lines:** no `border-b` on section headings, no `border-l` / `border-l-2` on nested sections (spacing only; match Patrol Command Center modals)
- [ ] Modal actions are right-aligned
- [ ] No close "X" button (Cancel button only)

#### Modal Forms
- [ ] Form inputs use standard input styling
- [ ] Form labels use: `block text-xs font-bold text-white mb-2 uppercase tracking-wider`
- [ ] Error messages use: `text-[10px] text-red-400 font-black uppercase tracking-tight ml-1`
- [ ] Helper text uses: `text-[10px] text-[color:var(--text-sub)] font-medium italic opacity-50 ml-1`

---

### 7. Forms & Validation ⚠️

#### Input Fields
- [ ] Inputs use: `bg-white/5 border border-white/5 rounded-md text-sm text-white focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono`
- [ ] Error state: `border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50`
- [ ] Disabled state: `disabled:bg-slate-100 disabled:cursor-not-allowed`
- [ ] Placeholder: `placeholder-slate-500`

#### Select/Dropdown
- [ ] Selects use `components/UI/Select` component
- [ ] Custom dropdown arrow (Font Awesome chevron-down)
- [ ] Error state properly styled
- [ ] Helper text displayed when no error

#### Validation
- [ ] Errors shown on blur or after submit
- [ ] Errors cleared when field value changes
- [ ] Required fields marked with asterisk (`<span className="text-red-500">*</span>`)
- [ ] Validation messages are clear and actionable

---

### 8. Search & Filter

#### SearchBar
- [ ] Uses `components/UI/SearchBar` component
- [ ] Debounce timing is 300ms (default)
- [ ] Clear button shown when value exists
- [ ] Search icon positioned left
- [ ] Proper focus states

#### Filters
- [ ] Filter state managed in component (not context)
- [ ] Active filters displayed as chips/badges
- [ ] "Clear All" button when filters active
- [ ] Advanced filters use Modal component

---

### 9. Loading States ⚠️

#### Spinner Patterns
- [ ] Full page spinner: `w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin`
- [ ] Inline spinner: `w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin`
- [ ] Button spinner: `w-4 h-4 border-2` or Font Awesome `fa-spinner`
- [ ] No colored glows on spinners
- [ ] No mixed border opacities
- [ ] Spinner text uses: `text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse`

#### Loading State Management
- [ ] Loading tracked per resource type
- [ ] Spinner shown only when `loading.[resource] && [resource].length === 0`
- [ ] Partial loading shows data with disabled actions
- [ ] Loading includes `role="status"` and `aria-label`

---

### 10. Empty States ⚠️

#### EmptyState Component
- [ ] Uses `components/UI/EmptyState` component (no custom empty cards)
- [ ] Empty state has appropriate icon
- [ ] Title is clear and descriptive
- [ ] Description provides context
- [ ] Action button included when appropriate

#### Empty State Patterns
- [ ] "No Data" state: "No [Resource]" with "Add your first [resource] to begin."
- [ ] "No Results" state: "No [Resource] Found" with "No [resources] match your current filter."
- [ ] Empty state styling matches standard

---

### 11. Badges & Status Indicators

#### Badge Component
- [ ] Uses `components/UI/Badge` component
- [ ] Correct variant used (default, success, warning, destructive, etc.)
- [ ] Correct size used (sm, md, lg)
- [ ] Badges have proper glow effects

#### Status Capsules
- [ ] Status capsules use: `px-2 py-0.5 text-[9px] font-black tracking-widest rounded uppercase`
- [ ] Positioned absolute top-right of metric cards
- [ ] Semantic colors used appropriately

---

### 12. Cards (use only when necessary)

#### Card Usage
- [ ] Cards used **only** when necessary (distinct focus block, modal/form grouping, visual grid tile, single table/list container). See §16 When cards are necessary.
- [ ] KPI/metric grids replaced with **compact metrics bar** where appropriate (Property Items pattern).
- [ ] Section content uses `<section>` + heading + list/grid; list items use bordered divs unless card is justified.

#### Card Component (when used)
- [ ] Uses `components/UI/Card` with `CardHeader`, `CardTitle`, `CardContent`
- [ ] Card base: `bg-slate-900/50 border border-white/5` (flat; no backdrop-blur, minimal or no shadow)
- [ ] Card headers have proper border: `border-b border-white/5`
- [ ] Card content has proper padding: `px-6 py-6`

#### Card Variations
- [ ] Metric/KPI cards used only when a specific metric must stand out; otherwise metrics bar.
- [ ] Interactive cards have hover states when used.

---

### 13. Data Tables & Lists

#### Table Structure
- [ ] Tables live in `<section>` with heading; **single** Card wrapper optional per §16 (when a clear boundary is needed).
- [ ] Table headers use: `text-[9px] font-black uppercase tracking-widest text-slate-500`
- [ ] Table cells use: `text-sm text-white`
- [ ] Rows have hover states: `hover:bg-white/5`
- [ ] Empty tables show EmptyState component

#### List View
- [ ] Lists use `space-y-3` (or grid) for spacing.
- [ ] List items use **bordered divs** (`rounded-lg border border-white/5 p-4`) unless a card is justified per §16 (e.g. visual grid tile).
- [ ] Empty lists show EmptyState component

---

### 14. Toast/Notifications

#### Toast Usage
- [ ] Uses `utils/toast` helper functions
- [ ] Success toasts: 3000ms duration
- [ ] Error toasts: 5000ms duration
- [ ] Loading toasts properly dismissed
- [ ] Toast positioning is top-right

---

### 15. Error Handling

#### Error Display
- [ ] Inline errors use: `text-[10px] text-red-400 font-black uppercase tracking-tight ml-1`
- [ ] Error boundaries wrap tab content
- [ ] Network errors show offline banner
- [ ] Error recovery actions provided

---

### 16. Accessibility (a11y) ⚠️

#### ARIA & Semantic HTML
- [ ] Buttons have `aria-label` when icon-only
- [ ] Modals have `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- [ ] Tabs have `role="tablist"`, `role="tab"`, `aria-selected`
- [ ] Loading spinners have `role="status"` and `aria-label`
- [ ] Proper semantic HTML used (`<nav>`, `<main>`, `<section>`, etc.)

#### Keyboard Navigation
- [ ] All interactive elements are focusable
- [ ] Focus indicators visible (`focus:ring-2 focus:ring-blue-500/60`)
- [ ] Modals trap focus
- [ ] Tab order is logical

#### Screen Reader Support
- [ ] Dynamic updates use `aria-live="polite"` or `aria-live="assertive"`
- [ ] Decorative icons have `aria-hidden="true"`
- [ ] Screen-reader-only text uses `sr-only` class

#### Color Contrast
- [ ] Text meets WCAG AA contrast requirements (4.5:1)
- [ ] Interactive elements have sufficient contrast

---

### 17. Responsive Design

#### Breakpoints
- [ ] Mobile-first approach used
- [ ] Grid patterns adapt: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- [ ] Spacing adjusts for mobile
- [ ] Tables handle mobile (scroll or card conversion)

#### Touch Targets
- [ ] All interactive elements are at least 44x44px
- [ ] Adequate spacing between touch targets

---

### 18. Animation & Transitions

#### Transitions
- [ ] Hover transitions use: `transition-all duration-200` or `duration-300`
- [ ] Scale animations use: `transition-transform duration-300`
- [ ] Reduced motion preference respected

---

### 19. Terminology

#### Language Standards
- [ ] No forensic jargon (e.g., "Initialize Space Asset")
- [ ] Simple, technical, actionable language
- [ ] Clear and concise labels

---

### 20. Z-Index

#### Layering
- [ ] Tabs bar: `z-[70]`
- [ ] Modals: `z-[100]` or higher
- [ ] No z-index conflicts
- [ ] Modals always above tabs

---

### 21. Icon System

#### Icon Usage
- [ ] Font Awesome icons used consistently
- [ ] Icon sizes appropriate (`text-sm`, `text-lg`, `text-xl`, `text-2xl`)
- [ ] Decorative icons have `aria-hidden="true"`
- [ ] Icon spacing: `mr-2` or `ml-2`

---

### Audit Summary

#### Critical Issues (Must Fix)
- [ ] ⚠️ Module structure issues
- [ ] ⚠️ Missing page headers
- [ ] ⚠️ Border inconsistencies
- [ ] ⚠️ Button variant issues
- [ ] ⚠️ Modal structure issues
- [ ] ⚠️ Form validation issues
- [ ] ⚠️ Loading state issues
- [ ] ⚠️ Empty state issues
- [ ] ⚠️ Accessibility issues

#### Notes
_Add any additional notes or observations here:_

---

#### Audit Result

- **Total Items Checked**: _____
- **Items Passed**: _____
- **Items Failed**: _____
- **Items Needs Work**: _____

**Overall Status**: ⬜ Pass ⬜ Fail ⬜ Needs Work

**Next Steps**: 
1. Fix all critical issues (⚠️)
2. Address failed items
3. Re-audit after fixes