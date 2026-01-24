# UI Gold Standard: Security Console Design System

This document defines the visual and interaction standards for the platform's high-contrast "Security Console" aesthetic.

## 1. Visual Identity & Design Tokens

### Color Palette (Semantic)
- **Background Main**: `var(--background)` (Deep Black)
- **Surface Card**: `var(--surface-card)` (Dark Surface)
- **Text Main**: `var(--text-main)` (High-Contrast White)
- **Text Sub**: `var(--text-sub)` (Muted Slate-500)
- **Accent Primary**: Blue-500/600 (Glow)
- **Accent success**: Emerald-500 (Glow)

### Borders & Effects
- **Standard Border**: `border-white/5` (The "Precision Edge" standard for all cards and containers)
- **Glass Card**: `glass-card`, `backdrop-blur-xl`, `bg-slate-900/50`
- **Inner Rim Glow**: `shadow-[0_0_20px_rgba(255,255,255,0.02)]`
- **Sunk-In Surface**: `bg-white/[0.03] border border-white/5`

## 2. Typography & Terminology

### Header Hierarchy
- **Module Title**: `text-3xl font-black uppercase tracking-tighter text-white`
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
- **Technical Values (IDs, Plates, Currency)**: `font-mono text-white`
- **Metadata Labels**: `text-slate-500 uppercase font-black tracking-widest text-[9px]`

### Terminology "No-Jargon" Rule
> [!IMPORTANT]
> Avoid over-complex or forensic terminology. Use simple, technical, and actionable language.
- **Incorrect**: "Initialize Space Asset", "Execute Yield Audit", "Advanced Telemetry"
- **Correct**: "Add Space", "Revenue Report", "Performance Analytics"

## 3. High-Density Components

### Integrated Glass Icons
- **Container**: `w-12 h-12 bg-gradient-to-br from-{color}-600/80 to-slate-900 border border-white/5 rounded-xl shadow-2xl flex items-center justify-center`
- **Animation**: `group-hover:scale-110 transition-transform duration-300`
- **No colored drop shadows**: avoid `shadow-blue-500/20`, `shadow-red-500/20` on icon containers.

### Patrol Command Center Metric Cards (Canonical)
- **Card Base**: `bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl group`
- **Icon Tile**: use Integrated Glass Icons (section above), `text-lg` icon size.
- **Status Capsule (optional)**: `px-2 py-0.5 text-[9px] font-black tracking-widest rounded uppercase` + semantic color class
- **Label**: `text-[9px] font-black uppercase tracking-widest text-slate-500`
- **Metric Value**: `text-3xl font-black text-white`
- **Subtext**: `text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400`

### Patrol Command Center KPI Cards (Canonical)
- **KPI Container**: `p-4 rounded-xl bg-slate-900/30 border border-white/5`
- **KPI Label**: `text-[9px] font-black uppercase tracking-widest text-slate-500`
- **KPI Value**: `text-2xl font-black text-white` (use semantic color only for emphasis)

### Glowing Status Badges
- **Base**: `px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-500`
- **Success**: `bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]`
- **Critical/Warning**: `bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]`

## 4. Interaction Patterns

### Muted Glass Buttons (Premium Standard)
- **Base (Default)**: `bg-white/5 border border-white/5 text-slate-500 font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-md transition-all active:scale-[0.98]`
- **Hover**: `bg-white/10 text-white border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]`
- **Semantic Hints**: Use `hover:bg-{color}-500/10 hover:border-{color}-500/20 hover:text-{color}-400` for specific actions (e.g. Save, Delete).
- **No colored CTA shadows**: remove `shadow-blue-500/20` or `shadow-red-500/30` on header CTAs to match Smart Parking.

### Integrated Card Toggles
- **Pattern**: A standard `Toggle` component nested inside a `bg-white/5 border-white/5` rounded container.
- **Layout**: `flex items-center justify-between p-4 hover:bg-white/10 transition-colors`

### Modal (Global Standard) — Patrol-style canonical
- **Use the global component**: `components/UI/Modal` only. No custom modal wrappers.
- **Overlay**: `fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4` — **z-index must exceed the sticky tabs bar** (e.g. `z-[70]`) so modals are never hidden by module chrome.
- **Container**: `bg-slate-900/70 rounded-lg p-6 border border-white/5 shadow-2xl backdrop-blur-xl max-h-[90vh] overflow-y-auto`
- **Title**: `text-xl font-black uppercase tracking-tighter text-white mb-6`
- **Content**: Flat layout only. Use `space-y-4` or `space-y-6`. No inner card wrappers (no `p-4 bg-... rounded-xl` per field). Labels (view): `text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1`. Form labels: `block text-xs font-bold text-white mb-2 uppercase tracking-wider`. Values: `text-white font-bold` or `text-white font-mono text-sm` or `text-slate-300 text-sm`.
- **Inputs**: use the **Standard Input** pattern from section 5. Same for `select`. Buttons: `text-xs font-black uppercase tracking-widest`.
- **Actions**: right-aligned row with `variant="subtle"` for Cancel and `variant="primary"` for Save/Create.
- **No close icon**: Do not render an “X” close button; Cancel is the only close control.
- **Draggable**: All modals (and the **Global Clock**) are **draggable** for repositioning. Use the same pattern as `components/UI/GlobalClock`: **drag handle** = title bar (modals) or time display (Global Clock); `cursor-move` on the handle; `mousedown` → `mousemove` / `mouseup` to update position; clamp to viewport. Custom modals (e.g. Camera Live) must also support drag via a header/handle. `Modal` supports `draggable` (default `true`); set `draggable={false}` only when needed.

### Empty State (Global Standard)
- **Use the global component**: `components/UI/EmptyState` for all empty blocks.
- **Consistent wording**: mirror schedule empty state style (e.g., “No schedule data available” + actionable description).
- **No custom empty cards**: avoid ad‑hoc icon blocks or bespoke empty layouts.

## 5. Technical Form Standards
- **Standard Input**: `bg-white/5 border border-white/10 rounded-md text-sm text-white focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono`
- **Unit Prefixes**: Group `absolute left-3 text-slate-500` icons/symbols ($, %, #) inside the input container.

## 6. CRITICAL AUDIT CHECKPOINTS
- [ ] **BORDERS**: Are all cards using `border-white/5`? (Check for `border-slate-800`)
- [ ] **METRIC COLOR**: Are metric numeric values `text-white`? (Check for semantic text colors)
- [ ] **TYPE MONO**: Do license plates/prices use `font-mono`?
- [ ] **TERMINOLOGY**: Is there any forensic jargon? (e.g. "Asset Location Matrix")
- [ ] **GLASS CTAs**: Do all primary header buttons use `variant="glass"`?
- [ ] **ICON GLASS**: Do icon tiles use the Integrated Glass Icon pattern with no colored drop shadows?
- [ ] **CTA SHADOWS**: Are CTA buttons free of colored drop shadows (Smart Parking standard)?

## 7. Access Control UI To‑Do (Gold Standard Alignment)
Reference: `frontend/src/features/smart-parking` and `frontend/src/features/patrol-command-center`

### Dashboard Tab
- Replace colored icon shadows with the Integrated Glass Icon pattern (alert banner, status card, metric tiles).
- Remove colored CTA shadows on alert actions (Dispatch/Acknowledge) to match Smart Parking.
- Normalize card borders to `border-white/5` where `border-[color:var(--border-subtle)]/50` is used.

### Access Points Tab
- Remove colored CTA shadows on header buttons (Add Access Point).
- Replace card glow `shadow-[0_0_30px_rgba(...)]` with neutral shadow (`shadow-2xl`) + `border-white/5`.
- Align any icon tiles inside cards (location/device/info) to Integrated Glass Icon standard.

### Users Tab
- Remove colored CTA shadows on header buttons (Add User, Bulk Actions).
- Update Visitor Management card icons to Integrated Glass Icon pattern.
- Replace primary button glow (`shadow-blue-500/20`) with gold-standard glass/outline styling.### Events Tab
- Remove colored CTA shadows on Export Logs button.
- Align event list icons to Integrated Glass Icon pattern (no colored drop shadows).

### AI Analytics Tab
- Update icon tiles inside `BehaviorAnalysisPanel` to Integrated Glass Icon pattern (no colored drop shadows).
- Ensure CTA buttons inside AI panel follow glass/outline styling (no colored shadows).

### Reports Tab
- Remove colored CTA shadows on Export buttons.
- Update report card header icons to Integrated Glass Icon pattern (no colored drop shadows).

### Configuration Tab
- Replace icon tile shadows/rings (`shadow-blue-500/20`, `ring-1`) with Integrated Glass Icon pattern.
- Remove colored CTA shadows on Save Changes.
- Normalize card borders to `border-white/5` (avoid mixed border tokens).### Lockdown Facility Tab
- Replace icon tile shadows/rings on Lockdown + Hardware cards with Integrated Glass Icon pattern.
- Remove colored CTA shadows on Lockdown actions (Initiate/Cancel/Test).