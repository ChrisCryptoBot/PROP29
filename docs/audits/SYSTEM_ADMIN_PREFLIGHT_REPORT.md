# MODULE PRE-FLIGHT ASSESSMENT: System Administration

Establishing the baseline for the System Administration module refactor.

## 1. BUILD STATUS
- **Status**: 🟢 Passes with warnings
- **TypeScript Errors**: None currently visible in file-level view, but high complexity might trigger linting/memory issues in some environments.
- **Warnings**: 
  - Several unused imports suspected in larger sections.
  - Large component size warning (>2000 lines).

## 2. RUNTIME STATUS
- **Console Errors**: None (Mock data driven).
- **Console Warnings**: Possible React `key` warnings if list IDs are duplicated in complex renders.
- **Visual/UI Breaks**: None observed; the layout follows the "Gold Standard" visual design but lacks mechanical modularity.

## 3. MODULE INVENTORY

### Tabs
| Tab ID | Label | Status |
|--|--|--|
| `dashboard` | Dashboard | 🟡 Partial (Mock metrics) |
| `users` | Users | 🟢 Functional (Mock state) |
| `roles` | Roles | 🟡 Read-only / Placeholder |
| `properties` | Properties | 🟡 Partial (Mock properties/integrations) |
| `system` | System | 🟢 Functional (Local state) |
| `security` | Security | 🟢 Functional (Local state) |
| `audit` | Audit Log | 🟡 Partial (Mock data / CSV Export) |

### Modals
1. `AddUserModal` (Lines 2192-2252)
2. `EditUserModal` (Lines 2255-2327)
3. `AddIntegrationModal` (Lines 2329-2382)

### Button Status Registry
| Action | State | Note |
|--|--|--|
| Add User | ✅ Functional | Updates local `users` state |
| Export Users | ⚠️ Placeholder | Shows alert |
| Bulk Actions | ⚠️ Placeholder | Shows alert |
| Edit User | ✅ Functional | Updates local `users` state |
| Manage Property | ⚠️ Placeholder | Shows alert |
| Add Integration | ✅ Functional | Updates local `integrations` state |
| Sync All | ⚠️ Placeholder | Shows alert |
| Restart Services | ⚠️ Placeholder | Shows alert |
| Save Settings | ✅ Functional | Simulates API call |
| Security Scan | ⚠️ Placeholder | Shows alert |
| Export Audit Log | ✅ Functional | Generates CSV Blob |

## 4. DEPENDENCY MAP
- **Contexts**: None (Monolithic state).
- **API Endpoints**: 
  - `GET /api/users` (Mocked)
  - `GET /api/integrations` (Mocked)
  - `POST /api/settings` (Simulated timeout)
- **Shared Components**:
  - `Card`, `CardContent`
  - `Button`
  - `Badge`
  - `cn` (utility)

## 6. REFACTOR ELIGIBILITY SCORE
- **Score**: 5/5 (Urgent Refactor Required)
- **Justification**: 
  - **Size**: 2,388 lines is 5x the recommended limit.
  - **Performance**: Zero usage of `useMemo` or `useCallback` leads to massive re-renders.
  - **Security**: No RBAC enforcement or real API authentication.
  - **Modularity**: Data, Logic, and UI are fully coupled.

## 7. RECOMMENDATIONS
1. **Critical**: extraction into Feature folder structure (`features/system-admin`).
2. **Critical**: Implement `SystemAdminContext` to decouple state from UI.
3. **Critical**: Extract all 7 tabs into separate components (`DashboardTab`, `UsersTab`, etc.).
4. **Critical**: Extract all 3 modals into separate components.
5. **High**: Transition from `alert()` and mock state to real `ApiService` calls once backend exists.
6. **High**: Integrate global search and proper pagination for Audit Logs.
