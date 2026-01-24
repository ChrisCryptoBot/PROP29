# Access Control Module - Phase 4 Refactor Plan

## Gold Standard Checklist Applied

✅ **Orchestrator**: Only handles high-level layout and routing
✅ **Logic Extraction**: Zero business logic in components; 100% moved to `useAccessControlState` hook
✅ **UI Isolation**: Sub-components must not import from each other; only from `UI/` or feature's own `components/`
✅ **Error Isolation**: Wrap each major tab in its own `ErrorBoundary`
✅ **Performance**: Use `React.memo` for heavy table/chart components once extracted

## Structure

```
features/access-control/
├── context/
│   └── AccessControlContext.tsx ✅ Created
├── hooks/
│   └── useAccessControlState.ts ✅ Created
├── components/
│   └── tabs/
│       ├── DashboardTab.tsx (to be created)
│       ├── AccessPointsTab.tsx (to be created)
│       ├── UsersTab.tsx (to be created)
│       ├── EventsTab.tsx (to be created)
│       ├── AIAnalyticsTab.tsx (to be created)
│       ├── ReportsTab.tsx (to be created)
│       └── ConfigurationTab.tsx (to be created)
├── routes/
│   └── AccessControlRoutes.tsx (nested routes)
└── AccessControlModule.tsx (orchestrator, ~300 lines)

## Nested Routes Strategy

**Current**: Local state tabs (`activeTab` state)
**New**: Nested routes with React Router

- `/modules/access-control` → Dashboard (default)
- `/modules/access-control/access-points` → Access Points Tab
- `/modules/access-control/users` → Users Tab
- `/modules/access-control/events` → Events Tab
- `/modules/access-control/ai-analytics` → AI Analytics Tab
- `/modules/access-control/reports` → Reports Tab
- `/modules/access-control/configuration` → Configuration Tab

**Benefits**:
- Back button works correctly
- Deep-linking to specific tabs
- Easier code-splitting (lazy loading)
- Better browser history

## Next Steps

1. ✅ Create context and hooks (DONE)
2. ⏳ Create DashboardTab component (in progress)
3. ⏳ Create nested routes structure
4. ⏳ Extract remaining 6 tab components
5. ⏳ Create orchestrator component
6. ⏳ Add ErrorBoundary to each tab
7. ⏳ Add React.memo to heavy components
8. ⏳ Ensure a11y compliance
