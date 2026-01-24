# PROPER 2.9 - COMPLETE MODULE AUDIT & OPTIMIZATION SYSTEM

## 🎯 EXECUTION STRATEGY (20 Modules)

**Per-Module Workflow:**
```
Module [X/20]: [Module Name]
├── Phase 0: Pre-Flight Assessment (5 min)
├── Phase 1: Security & Critical Audit (15 min)
├── Phase 2: Functionality & Flow Audit (20 min)
├── Phase 3: Architecture Refactor (if needed) (60 min)
├── Phase 4: Performance & Code Quality (15 min)
├── Phase 5: Testing Coverage (20 min)
└── Phase 6: Build & Deploy Verification (10 min)
```

---

## 📋 PHASE 0: PRE-FLIGHT ASSESSMENT

**Prompt:**
```
MODULE PRE-FLIGHT ASSESSMENT: [Module Name]

Before optimization, establish the baseline:

1. BUILD STATUS
   - Run `npm run build`
   - Document all TypeScript errors (file:line)
   - Document all build warnings
   - Note if build passes/fails

2. RUNTIME STATUS
   - Start dev server
   - Navigate through ALL tabs in this module
   - Document all console.errors in browser
   - Document all console.warnings in browser
   - Note any visual/UI breaks

3. MODULE INVENTORY
   - List all tabs/sections in this module
   - List all modals in this module
   - List all buttons and their current state:
     * ✅ Fully functional
     * ⚠️ Shows success message only (placeholder)
     * ❌ Non-functional/throws error
     * 🔜 Documented as future work
   - Identify which tabs are placeholder vs functional

4. DEPENDENCY MAP
   - List all context functions this module uses
   - List all API endpoints this module calls
   - List all shared components imported
   - Identify any circular dependencies

5. CURRENT FILE STRUCTURE
   - Document current architecture (monolithic vs modular)
   - List total number of files
   - Note if follows Gold Standard pattern

OUTPUT FORMAT:
Create `[MODULE_NAME]_PREFLIGHT_REPORT.md` with all findings organized by category. Include severity ratings (🔴 Critical, 🟡 High, 🟢 Low) for each issue.
```

---

## 🔒 PHASE 1: SECURITY & CRITICAL AUDIT

**Prompt:**
```
SECURITY & CRITICAL ISSUES AUDIT: [Module Name]

This is a BLOCKING phase. All critical and security issues must be fixed before proceeding.

AUDIT CRITERIA:

1. AUTHENTICATION & AUTHORIZATION
   - Verify all API calls include proper auth headers
   - Check role-based access control (RBAC) enforcement
   - Ensure protected routes have auth guards
   - Verify user permissions checked before sensitive operations
   - Check for authorization bypass vulnerabilities

2. INPUT VALIDATION
   - CLIENT-SIDE: Check all form inputs have validation
   - SERVER-SIDE: Verify backend validates all inputs (never trust client)
   - Check for SQL injection prevention (parameterized queries)
   - Check for XSS prevention (proper escaping/sanitization)
   - Verify file upload validation (type, size, content)

3. DATA SECURITY
   - Check for sensitive data in client-side code (API keys, secrets)
   - Verify no sensitive data in console.logs
   - Check for sensitive data in error messages shown to users
   - Verify proper HTTPS usage for API calls
   - Check for secure cookie flags (httpOnly, secure, sameSite)

4. CSRF PROTECTION
   - Verify CSRF tokens on state-changing operations
   - Check for proper SameSite cookie settings
   - Verify POST/PUT/DELETE endpoints protected

5. SECRET MANAGEMENT
   - Check all API keys use environment variables
   - Verify no hardcoded credentials
   - Check .env files not committed to git
   - Verify secrets not exposed in build artifacts

6. ERROR HANDLING SECURITY
   - Check error messages don't leak system information
   - Verify stack traces not shown in production
   - Check for proper error logging (server-side only)
   - Verify sensitive operations fail securely

7. DEPENDENCY SECURITY
   - List all third-party libraries used in this module
   - Flag any known vulnerable dependencies
   - Check for outdated security-critical packages

OUTPUT FORMAT:
Create `[MODULE_NAME]_SECURITY_AUDIT.md`:

## 🔴 CRITICAL ISSUES (Fix Immediately)
- [ ] Issue: [Description]
  - Location: `file.tsx:line`
  - Risk: [SQL Injection / XSS / Auth Bypass / etc]
  - Fix: [Specific remediation steps]
  - Effort: [1-5 hours]

## 🟡 HIGH PRIORITY SECURITY ISSUES
[Same format]

## 🟢 SECURITY IMPROVEMENTS (Non-blocking)
[Same format]

## ✅ SECURITY COMPLIANCE CHECKLIST
- [ ] All inputs validated (client + server)
- [ ] No sensitive data exposure
- [ ] Auth/authz properly enforced
- [ ] CSRF protection enabled
- [ ] No vulnerable dependencies
- [ ] Error handling secure

STOP: Do not proceed to Phase 2 until all 🔴 Critical Issues are resolved.
```

---

## ⚙️ PHASE 2: FUNCTIONALITY & FLOW AUDIT

**Prompt:**
```
FUNCTIONALITY & USER FLOW AUDIT: [Module Name]

Audit each component for completeness, logical consistency, and user experience.

AUDIT CRITERIA:

1. COMPONENT COMPLETENESS
   - Review EACH tab for incomplete implementations
   - Identify partial workflows (started but not finished)
   - Check for TODO comments or placeholder functions
   - Verify all imported components are actually used
   - Check for dead code or unused functions

2. USER FLOW ANALYSIS
   For each workflow (Create, Edit, Delete, etc):
   - [ ] User can initiate action (button works)
   - [ ] Modal/form opens with correct data
   - [ ] Form validation works (client-side)
   - [ ] Submit calls correct API endpoint
   - [ ] Success state updates UI correctly
   - [ ] Success message shows appropriate feedback
   - [ ] Error state handled gracefully
   - [ ] User can recover from errors
   - [ ] Form resets/closes properly
   - [ ] No orphaned state after action

3. EDGE CASE HANDLING
   Test and verify handling of:
   - Null/undefined values in data
   - Empty arrays/objects
   - Empty states (no data to display)
   - Loading states (API calls in progress)
   - Very long text/names (text overflow)
   - Special characters in input
   - Concurrent operations (rapid clicks)
   - Network timeout/failure
   - Boundary conditions (min/max values)
   - Duplicate data submission
   - Permission denied scenarios

4. CRUD OPERATION VERIFICATION
   For each entity type in module:
   - [ ] CREATE: Full workflow functional
   - [ ] READ: Data displays correctly
   - [ ] UPDATE: Edit workflow functional
   - [ ] DELETE: Delete workflow with confirmation
   - [ ] LIST: Pagination/filtering works
   - [ ] SEARCH: Search functionality works

5. ERROR STATE QUALITY
   Check all error scenarios provide:
   - User-friendly error message (not technical jargon)
   - Actionable next steps ("Try again" / "Contact support")
   - No system in inconsistent state after error
   - Proper error logging (dev console)
   - Visual error indicators (red text, icons)

6. LOADING STATE QUALITY
   - Verify spinners/skeletons show during async operations
   - Check loading doesn't block entire UI unnecessarily
   - Verify optimistic updates where appropriate
   - Check for loading state memory leaks

7. ARCHITECTURAL CONSISTENCY
   - Same state management pattern across tabs?
   - Similar component structure throughout?
   - Uniform API interaction patterns?
   - Cohesive data flow?
   - Flag intentional vs unintentional deviations

8. LOGICAL HOLES
   - Check for race conditions in async operations
   - Verify data consistency (e.g., totals match details)
   - Check for off-by-one errors in pagination
   - Verify date/time handling (timezones)
   - Check calculation accuracy (totals, percentages)

OUTPUT FORMAT:
Create `[MODULE_NAME]_FUNCTIONALITY_AUDIT.md`:

## 🔴 CRITICAL FUNCTIONALITY ISSUES (Blocking)
- [ ] Issue: [Description]
  - Location: `file.tsx:line`
  - Impact: [User cannot complete X workflow]
  - Fix: [Specific steps]
  - Effort: [Hours]

## 🟡 HIGH PRIORITY (Core Functionality)
- Incomplete workflows
- Broken user flows
- Unhandled edge cases
- Missing error handling

## 🟠 MEDIUM PRIORITY (UX Issues)
- Incomplete loading states
- Poor error messages
- Missing empty states
- Minor flow issues

## 🟢 LOW PRIORITY (Polish)
- UI inconsistencies
- Missing optimizations
- Nice-to-have features

## 📊 WORKFLOW STATUS MATRIX
| Workflow | Initiated | Validation | API Call | Success State | Error State | Complete |
|----------|-----------|------------|----------|---------------|-------------|----------|
| Create X | ✅ | ✅ | ⚠️ | ✅ | ❌ | 60% |
| Edit X   | ✅ | ❌ | ❌ | ❌ | ❌ | 20% |
| Delete X | ✅ | ✅ | ✅ | ✅ | ✅ | 100% |

## 🎯 PRIORITY FIXES (Top 5)
1. [Issue] - [Why critical] - [Effort]
2. ...
```

---

## 🏗️ PHASE 3: ARCHITECTURE REFACTOR (Conditional)

**Prompt:**
```
ARCHITECTURE REFACTOR TO GOLD STANDARD: [Module Name]

Follow this complete refactoring guide EXACTLY. All patterns and code examples are included below.

STEP 1: ASSESS NEED FOR REFACTOR
Does this module need refactoring? Check:
- [ ] File >1000 lines (monolithic)
- [ ] Business logic mixed with UI
- [ ] No separation of concerns
- [ ] Difficult to test
- [ ] Hard to maintain
- [ ] No context/hooks pattern
- [ ] Components not modularized

If YES to 2+, proceed with refactor. If NO, skip to Phase 4.

STEP 2: TARGET FILE STRUCTURE
After refactoring, the module should follow this structure:

frontend/src/features/[module-name]/
├── [ModuleName]Orchestrator.tsx          # Main orchestrator component
├── context/
│   └── [ModuleName]Context.tsx          # Context provider and hook
├── hooks/
│   └── use[ModuleName]State.ts           # Business logic hook
├── components/
│   ├── tabs/                             # Tab components (if applicable)
│   │   ├── [TabName]Tab.tsx
│   │   ├── [TabName]Tab.tsx
│   │   └── index.ts                      # Barrel exports
│   ├── modals/                           # Modal components
│   │   ├── [ModalName]Modal.tsx
│   │   ├── [ModalName]Modal.tsx
│   │   └── index.ts                      # Barrel exports
│   ├── filters/                          # Filter/search components
│   │   ├── [FilterName]Filter.tsx
│   │   └── index.ts
│   └── [OtherSharedComponents].tsx       # Shared UI components
├── routes/                               # Route definitions (if needed)
│   └── [ModuleName]Routes.tsx
├── __tests__/                            # Unit tests
│   ├── [ModuleName]Context.test.tsx
│   └── use[ModuleName]State.test.ts
├── index.ts                              # Feature barrel exports
└── [Documentation files].md

STEP 3: EXECUTE REFACTOR BY PHASE

REFACTORING_PHASE_1: Analysis & Planning

1. Audit the Current Module:
   - Read the monolithic file completely
   - Identify all tabs/sections (list them)
   - Identify all modals (list them)
   - Identify all business logic functions
   - Identify all state management
   - Identify all API calls
   - List all buttons and their current workflows
   - Document incomplete/placeholder functionality

2. Create Refactoring Plan:
   - List all components to extract
   - List all modals to create
   - List all hooks to create
   - Identify shared types
   - Plan context structure
   - Create TODO list with priorities
   - OUTPUT: `[MODULE_NAME]_REFACTOR_PLAN.md`

REFACTORING_PHASE_2: Setup Architecture Foundation

3. Create Folder Structure:
   frontend/src/features/[module-name]/
   ├── Create context/ folder
   ├── Create hooks/ folder
   ├── Create components/ folder
   ├── Create components/tabs/ folder (if tabs exist)
   ├── Create components/modals/ folder
   ├── Create components/filters/ folder (if filters exist)
   └── Create index.ts files for barrel exports

4. Create Context Provider:
   // context/[ModuleName]Context.tsx
   - Define ContextValue interface with:
     * Data (arrays, objects, metrics)
     * Loading states
     * Actions (CRUD operations, business logic)
   - Create Context using createContext
   - Create Provider component that uses the state hook
   - Export use[ModuleName]Context hook
   - Export types
   
   Pattern:
   ```typescript
   interface ContextValue {
     // Data
     items: Item[];
     loading: { items: boolean };
     
     // Actions
     createItem: (item: Partial<Item>) => Promise<Item>;
     updateItem: (id: string, updates: Partial<Item>) => Promise<Item>;
     deleteItem: (id: string) => Promise<void>;
     refreshItems: () => Promise<void>;
   }
   
   export const ModuleProvider: React.FC = ({ children }) => {
     const state = useModuleState();
     return (
       <ModuleContext.Provider value={state}>
         {children}
       </ModuleContext.Provider>
     );
   };
   ```

5. Create State Hook:
   // hooks/use[ModuleName]State.ts
   - Move ALL business logic from component to hook
   - Use useState for all local state
   - Use useCallback for all action functions
   - Use useEffect for data fetching and side effects
   - Handle API calls with proper error handling
   - Return object matching ContextValue interface
   - Add comprehensive JSDoc comments
   
   Pattern:
   ```typescript
   export function useModuleState(): ContextValue {
     const [items, setItems] = useState<Item[]>([]);
     const [loading, setLoading] = useState({ items: false });
     
     const createItem = useCallback(async (item: Partial<Item>): Promise<Item> => {
       setLoading(prev => ({ ...prev, items: true }));
       try {
         const response = await apiService.post<Item>('/items', item);
         const newItem = response.data;
         setItems(prev => [...prev, newItem]);
         return newItem;
       } catch (error) {
         throw error;
       } finally {
         setLoading(prev => ({ ...prev, items: false }));
       }
     }, []);
     
     return {
       items,
       loading,
       createItem,
       // ... other actions
     };
   }
   ```

6. Create Type Definitions (if not centralized):
   // shared/types/[module-name].types.ts
   - Move all type definitions here
   - Export interfaces and types
   - Ensure consistency across module
   
   OUTPUT: Context and hook files created, types centralized

REFACTORING_PHASE_3: Extract Tab Components

7. For Each Tab/Section:
   // components/tabs/[TabName]Tab.tsx
   
   Structure:
   - Import React, necessary hooks
   - Import UI components (Card, Button, etc.)
   - Import use[ModuleName]Context hook
   - Import ErrorBoundary
   - Import LoadingSpinner
   - Import EmptyState (if needed)
   
   Component Structure:
   - Main component function (TabComponent)
   - Extract data from context: const { data, actions } = use[ModuleName]Context()
   - Local UI state only (filters, search, modal visibility)
   - Memoize filtered/computed data with useMemo
   - Loading state check with early return
   - Render JSX with proper accessibility
   - Wrap in React.memo if heavy component
   
   Pattern:
   ```typescript
   const TabComponent: React.FC = React.memo(() => {
     const { items, loading, createItem } = useModuleContext();
     const [showModal, setShowModal] = useState(false);
     const [searchQuery, setSearchQuery] = useState('');
     
     const filteredItems = useMemo(() => {
       return items.filter(item => 
         item.name.toLowerCase().includes(searchQuery.toLowerCase())
       );
     }, [items, searchQuery]);
     
     if (loading.items && items.length === 0) {
       return <LoadingSpinner />;
     }
     
     return (
       <div>
         {/* UI */}
       </div>
     );
   });
   
   export const Tab: React.FC = () => (
     <ErrorBoundary moduleName="Tab">
       <TabComponent />
     </ErrorBoundary>
   );
   ```
   
   Export:
   - Export wrapped component with ErrorBoundary
   - Export default from index.ts

8. Tab Component Checklist:
   - ✅ Uses context hook (not direct state)
   - ✅ Wrapped in ErrorBoundary
   - ✅ React.memo applied (if heavy)
   - ✅ Accessibility (ARIA labels, keyboard nav)
   - ✅ Loading states handled
   - ✅ Empty states handled
   - ✅ Error handling
   - ✅ No business logic (only UI logic)
   
   OUTPUT: All tab components extracted and working

REFACTORING_PHASE_4: Extract Modal Components

9. For Each Modal:
   // components/modals/[ModalName]Modal.tsx
   
   Structure:
   - Import Modal, Button components
   - Define FormData interface
   - Define ModalProps interface
   - Component receives:
     * isOpen: boolean
     * onClose: () => void
     * onSubmit: () => void | Promise<void>
     * formData: FormData
     * onFormChange: (data: Partial<FormData>) => void
     * isFormDirty: boolean
     * setIsFormDirty: (dirty: boolean) => void
     * isEditMode?: boolean (if supports edit)
   
   Pattern:
   ```typescript
   interface ModalProps {
     isOpen: boolean;
     onClose: () => void;
     onSubmit: () => void | Promise<void>;
     formData: FormData;
     onFormChange: (data: Partial<FormData>) => void;
     isFormDirty: boolean;
     setIsFormDirty: (dirty: boolean) => void;
     isEditMode?: boolean;
   }
   
   export const Modal: React.FC<ModalProps> = ({
     isOpen,
     onClose,
     onSubmit,
     formData,
     onFormChange,
     isFormDirty,
     setIsFormDirty,
     isEditMode = false
   }) => {
     const handleClose = () => {
       if (isFormDirty && !window.confirm('Unsaved changes. Cancel?')) {
         return;
       }
       onClose();
     };
     
     return (
       <Modal
         isOpen={isOpen}
         onClose={handleClose}
         title={isEditMode ? "Edit" : "Create"}
         footer={/* buttons */}
       >
         {/* form fields */}
       </Modal>
     );
   };
   ```
   
   Features:
   - Dirty state tracking
   - Confirmation on close if dirty
   - Form validation
   - Proper labels and accessibility
   - Loading states during submit
   - Error handling
   
   Export:
   - Export component
   - Export FormData type
   - Export from index.ts
   
   OUTPUT: All modal components created

10. Modal Integration in Tabs:
    For EACH tab that uses modals:
    - Add state for modal visibility
    - Add state for form data
    - Add state for dirty tracking
    - Add state for editing item (if edit mode)
    - Open modal: setShowModal(true), setEditingItem(item)
    - Close modal: setShowModal(false), setEditingItem(null), reset form
    - Submit: Call context action, close modal, show success/error
    - OUTPUT: All modals integrated and functional

REFACTORING_PHASE_5: Extract Filter Components

11. For Each Filter/Search Component:
    // components/filters/[FilterName]Filter.tsx
    
    Structure:
    - Import SearchBar, Button, Badge
    - Define FilterProps interface
    - Component receives:
      * searchQuery: string
      * filters: FilterType
      * onSearchChange: (value: string) => void
      * onFilterChange: (filter: FilterType) => void
      * onClearAll: () => void
    
    Features:
    - Search input with debounce
    - Filter dropdowns with labels
    - Active filter badges
    - Clear all button
    - Proper alignment (labels match dropdowns - use same label styling: "block text-xs font-medium text-slate-700 mb-1")
    - Accessibility
    
    Export:
    - Export component
    - Export FilterProps type
    - Export from index.ts
    - OUTPUT: All filter components created and aligned

REFACTORING_PHASE_6: Create Orchestrator

12. Create Main Orchestrator:
    // [ModuleName]Orchestrator.tsx
    
    Structure:
    - Import Provider from context
    - Import all tab components
    - Import UI components (Tabs, TabList, TabPanel, etc.)
    - Use useState for activeTab
    - Wrap everything in Provider
    - Render tab navigation
    - Render tab panels conditionally
    - Handle tab switching
    
    Features:
    - Clean tab navigation
    - Proper routing (if needed)
    - Error boundaries
    - Loading states
    - Responsive design
    - Header with module title and icon
    - OUTPUT: Orchestrator created and functional

REFACTORING_PHASE_7: Integration & Testing

13. Update Main Module File:
    // pages/modules/[ModuleName]Module.tsx
    - Simply export from orchestrator:
      export { default } from '../../features/[module-name]/[ModuleName]Orchestrator';

14. Create Barrel Exports:
    // features/[module-name]/index.ts
    - Export orchestrator as default
    - Export Provider and context hook
    - Export all tab components
    - Export state hook (if needed externally)
    - Export types

15. Fix All Imports:
    - Update all import paths (use relative paths, check depth: ../../../../components/UI/Modal)
    - Fix relative path issues
    - Ensure barrel exports work
    - Fix default vs named exports (check actual exports in source files)
    - Fix TypeScript errors (type mismatches, missing types)
    - Fix linter errors
    - Ensure build passes
    - OUTPUT: All imports fixed, build passes

REFACTORING_PHASE_8: Button Workflow Audit

16. Audit All Buttons:
    For each tab:
    - List all buttons
    - Check if they call context functions
    - Check if they open modals
    - Check if they show only success messages (placeholders)
    - Document incomplete workflows
    - Prioritize fixes
    
    For each button, check:
    * Does it call a context function? ✅ Working
    * Does it open a modal? ✅ Working
    * Does it only show success message? ❌ Placeholder (document)
    * Does it throw error? ❌ Broken (fix)

17. Fix Critical Buttons:
    High Priority:
    - Buttons that can use existing context functions
    - Buttons that need existing modals
    - Buttons that are core functionality
    
    Medium Priority:
    - Buttons that need new modals
    - Buttons that need export functionality
    
    Low Priority:
    - Placeholder buttons for future features
    - OUTPUT: `[MODULE_NAME]_BUTTON_AUDIT.md` with status of all buttons

REFACTORING_PHASE_9: Polish & Optimization

18. Add Mock Data (for visualization):
    // In state hook, initialize with mock data:
    const [data, setData] = useState<DataType[]>(mockData);
    - This allows immediate visualization
    - Real API calls will replace mock data

19. Fix Type Errors:
    - Ensure all types match
    - Fix import/export issues
    - Fix default vs named exports
    - Add missing type definitions
    - Ensure all status values included in types (e.g., 'inactive' in status union)

20. Fix UI Issues:
    - Search bar alignment with filter dropdowns (use consistent label styling)
    - Missing icons (check icon classes, add text-lg if needed)
    - Inconsistent spacing
    - Missing badges/labels
    - Accessibility issues

21. Add Error Boundaries:
    - Wrap each tab in ErrorBoundary
    - Wrap modals in ErrorBoundary
    - Provide fallback UI
    - OUTPUT: UI polished, mock data added, types complete

STEP 4: COMMON ISSUES & SOLUTIONS

Issue: Import Path Errors
Solution: 
- Use relative paths: ../../../../components/UI/Modal
- Create barrel exports for clean imports
- Check default vs named exports

Issue: Type Mismatches
Solution:
- Centralize type definitions
- Ensure form types match entity types
- Use type assertions carefully
- Add 'inactive' or missing status values

Issue: Default vs Named Exports
Solution:
- Check actual export in source file
- Use `import LoadingSpinner from ...` for default
- Use `import { LoadingSpinner } from ...` for named
- Update barrel exports accordingly

Issue: Context Not Available
Solution:
- Ensure component is wrapped in Provider
- Check Provider is in orchestrator
- Verify hook is exported correctly
- Check for typos in context name

Issue: State Not Updating
Solution:
- Ensure state updates in hook use functional updates: `setItems(prev => [...prev, newItem])`
- Check useCallback dependencies
- Verify context value is being passed correctly

Issue: Modal Not Closing
Solution:
- Check onClose is called
- Verify state is resetting
- Check for dirty state blocking close
- Ensure form data is reset

STEP 5: VALIDATE REFACTOR
Checklist (ALL must pass):
- [ ] No monolithic files remain (file <500 lines)
- [ ] All business logic in hooks (zero logic in components)
- [ ] All components use context hook (no direct state access)
- [ ] No prop drilling (data flows through context)
- [ ] Types centralized (shared/types or feature types file)
- [ ] No TypeScript errors (run `npm run build`)
- [ ] No linter errors (check all files)
- [ ] Build passes successfully
- [ ] UI works correctly (test manually)
- [ ] All critical buttons functional
- [ ] Mock data displays correctly
- [ ] Error boundaries in place
- [ ] Loading states handled
- [ ] Empty states handled

STEP 6: CREATE STATUS DOCUMENT
Create `[MODULE_NAME]_REFACTOR_STATUS.md` with:
- Before/after file structure comparison
- Phase completion checklist (all phases ✅)
- Files created count (tabs, modals, filters, context, hooks)
- Remaining work documented (buttons needing modals, etc.)
- Known issues (if any)
- Button audit summary
- Next steps (if any)

STEP 7: CLEANUP
- Remove old monolithic file (after verification)
- Remove any backup files (if verified working)
- Remove any TODO comments that are complete
- Clean up any duplicate code
- Ensure all exports are clean (barrel exports working)

OUTPUT SUMMARY:
- ✅ Modular architecture complete
- ✅ All components extracted
- ✅ Context/hooks pattern implemented
- ✅ Button audit complete
- ✅ UI issues fixed
- ✅ Build passes
- ✅ Status document created

REFERENCE: Use Access Control module as reference:
- Structure: `frontend/src/features/access-control/`
- Pattern examples: Check AccessControlContext.tsx, useAccessControlState.ts, DashboardTab.tsx
- Modal example: CreateAccessPointModal.tsx (supports edit mode)
- Filter example: AccessPointsFilter.tsx (proper alignment)
```

---

## ⚡ PHASE 4: PERFORMANCE & CODE QUALITY

**Prompt:**
```
PERFORMANCE & CODE QUALITY AUDIT: [Module Name]

Optimize for speed, efficiency, and maintainability.

AUDIT CRITERIA:

1. REACT PERFORMANCE
   - Identify unnecessary re-renders (missing React.memo)
   - Check for missing useMemo on expensive computations
   - Check for missing useCallback on passed functions
   - Verify key props on lists are stable
   - Check for inline object/function creation in render
   - Identify components that should be lazy loaded

2. DATA HANDLING
   - Check for missing pagination on large datasets (>100 items)
   - Verify infinite scroll implemented where appropriate
   - Check for N+1 query patterns
   - Identify opportunities for data caching
   - Check for redundant API calls
   - Verify proper data normalization

3. DATABASE/API PERFORMANCE
   - List all API calls made by module
   - Check for missing indexes (note for backend team)
   - Identify slow queries (>500ms)
   - Check for unnecessary data fetching
   - Verify proper use of query parameters (filters, pagination)
   - Check for opportunities to batch requests

4. BUNDLE SIZE & LOADING
   - Check for large libraries imported unnecessarily
   - Verify code splitting at route level
   - Check for proper lazy loading of components
   - Identify unused imports
   - Check for duplicate dependencies

5. MEMORY LEAKS
   - Verify all useEffect cleanups
   - Check for unsubscribed event listeners
   - Check for uncancelled timers/intervals
   - Verify API calls cancelled on unmount
   - Check for large objects held in memory unnecessarily

6. CODE QUALITY
   - Flag functions >50 lines (complexity)
   - Check cyclomatic complexity (>10 = refactor)
   - Identify duplicate code across components
   - Check for inconsistent naming conventions
   - Flag magic numbers (use constants)
   - Check for missing error boundaries

7. TYPE SAFETY
   - Check for 'any' types (should be specific)
   - Verify proper type definitions
   - Check for missing return types
   - Verify no implicit any
   - Check for proper null/undefined handling

8. ACCESSIBILITY
   - Verify all buttons have aria-labels
   - Check for proper heading hierarchy (h1→h2→h3)
   - Verify keyboard navigation works
   - Check for proper focus management
   - Verify screen reader compatibility
   - Check color contrast ratios

9. CODE PATTERNS & BEST PRACTICES
   - Verify following React best practices
   - Check for SOLID principle violations
   - Verify DRY principle (Don't Repeat Yourself)
   - Check for proper separation of concerns
   - Verify consistent code style

OUTPUT FORMAT:
Create `[MODULE_NAME]_PERFORMANCE_AUDIT.md`:

## ⚡ PERFORMANCE ISSUES
### 🔴 Critical (User-Facing Impact)
- [ ] Issue: [Description]
  - Location: `file.tsx:line`
  - Impact: [Page takes 5s to load / UI freezes]
  - Fix: [Add pagination / memoization]
  - Effort: [Hours]

### 🟡 High Priority
- Unnecessary re-renders
- Missing pagination
- N+1 queries
- Memory leaks

### 🟢 Optimizations (Nice-to-Have)
- Bundle size reduction
- Code splitting opportunities
- Caching opportunities

## 🧹 CODE QUALITY ISSUES
### Complex Functions (>50 lines)
- `functionName` in `file.tsx` - 87 lines - Refactor into smaller functions

### Duplicate Code
- Pattern found in: `fileA.tsx:20` and `fileB.tsx:45` - Extract to shared utility

### Type Safety Issues
- 12 uses of 'any' type - Replace with specific types

### Accessibility Issues
- Missing aria-labels: [list components]
- Keyboard nav broken: [list areas]

## 📊 PERFORMANCE METRICS
- Bundle size contribution: [X kb]
- Number of re-renders (homepage): [count]
- API calls on mount: [count]
- Time to interactive: [ms]

## 🎯 QUICK WINS (Low Effort, High Impact)
1. [Optimization] - [Impact] - [1 hour]
2. ...
```

---

## 🧪 PHASE 5: TESTING COVERAGE

**Prompt:**
```
TESTING COVERAGE AUDIT & IMPLEMENTATION: [Module Name]

Identify gaps and create tests for critical workflows.

AUDIT CRITERIA:

1. EXISTING TEST INVENTORY
   - List all test files for this module
   - Calculate current coverage % (if available)
   - Identify what IS tested currently
   - Identify what is NOT tested

2. CRITICAL PATH IDENTIFICATION
   High priority testing needs:
   - User authentication/authorization flows
   - Data creation/modification (CRUD)
   - Payment/transaction flows
   - Data export/import
   - User permission changes
   - Critical business logic

3. TEST GAP ANALYSIS
   For each critical workflow, check:
   - [ ] Unit tests for business logic (hooks)
   - [ ] Integration tests for user flows
   - [ ] Edge case tests
   - [ ] Error scenario tests
   - [ ] Performance tests (if needed)

4. CREATE MISSING TESTS
   Use existing test patterns as template.
   
   For each gap, create tests that verify:
   
   UNIT TESTS (Hooks):
   - State initialization
   - Action functions work correctly
   - Error handling in actions
   - Loading states managed properly
   - Edge cases handled
   
   INTEGRATION TESTS (Components):
   - Component renders without crashing
   - User can complete workflow end-to-end
   - Form validation works
   - Error messages display correctly
   - Success states update UI
   
   EDGE CASE TESTS:
   - Null/undefined data
   - Empty arrays
   - Network failures
   - Concurrent operations
   - Permission denied
   
   ERROR SCENARIO TESTS:
   - API returns 400/401/403/404/500
   - Network timeout
   - Invalid data submitted
   - Concurrent modification
   - System state conflicts

5. TEST QUALITY CHECKLIST
   All tests should:
   - [ ] Have descriptive names (what is being tested)
   - [ ] Test one thing per test
   - [ ] Be independent (no shared state)
   - [ ] Use proper mocking (API calls, timers)
   - [ ] Have assertions that verify behavior
   - [ ] Clean up after themselves

OUTPUT FORMAT:
Create `[MODULE_NAME]_TESTING_REPORT.md`:

## 📊 CURRENT TEST COVERAGE
- Total test files: [count]
- Coverage %: [number]
- Lines covered: [number] / [total]

## 🔴 CRITICAL GAPS (Must Test)
- [ ] Workflow: [Name]
  - Missing: [Unit / Integration / Edge Cases]
  - Priority: CRITICAL
  - Effort: [Hours]

## 🟡 HIGH PRIORITY GAPS
[List workflows needing tests]

## ✅ WELL TESTED AREAS
[List what has good coverage]

## 🧪 TEST IMPLEMENTATION PLAN
### Phase 1: Critical Workflows (Week 1)
- [ ] Test: User can create X
  - Files: `useModuleState.test.ts`, `CreateXModal.test.tsx`
  - Scenarios: Happy path, validation errors, API errors
  
### Phase 2: Edge Cases (Week 2)
[List tests to create]

### Phase 3: Integration Tests (Week 3)
[List tests to create]

## 📝 SAMPLE TEST CODE
```typescript
// Example test structure to follow
describe('useModuleState', () => {
  it('should create item successfully', async () => {
    // Test implementation
  });
  
  it('should handle creation error', async () => {
    // Test implementation
  });
});
```

Create actual test files following this pattern.
```

---

## 🚀 PHASE 6: BUILD & DEPLOY VERIFICATION

**Prompt:**
```
FINAL BUILD & DEPLOYMENT VERIFICATION: [Module Name]

Ensure module is production-ready.

VERIFICATION STEPS:

1. STOP ALL DEV PROCESSES
   ```bash
   # Stop any running dev servers
   ```

2. RUN FULL BUILD
   ```bash
   npm run build
   ```
   
   VERIFY:
   - [ ] Build completes without errors
   - [ ] No TypeScript errors
   - [ ] No linting errors
   - [ ] No warnings (or document acceptable warnings)
   - [ ] Bundle size reasonable

3. TEST PRODUCTION BUILD LOCALLY
   ```bash
   # Serve production build
   npm run preview  # or equivalent
   ```
   
   MANUAL QA CHECKLIST:
   - [ ] Module loads without console errors
   - [ ] All tabs render correctly
   - [ ] All buttons work as expected
   - [ ] All modals open/close correctly
   - [ ] Forms submit successfully
   - [ ] Error states display properly
   - [ ] Loading states work correctly
   - [ ] Navigation works
   - [ ] Responsive design works (mobile/tablet/desktop)

4. CROSS-BROWSER TESTING
   Test in:
   - [ ] Chrome (latest)
   - [ ] Firefox (latest)
   - [ ] Safari (latest)
   - [ ] Edge (latest)
   
   Document any browser-specific issues.

5. PERFORMANCE CHECK
   Run Lighthouse audit:
   - [ ] Performance score >80
   - [ ] Accessibility score >90
   - [ ] Best Practices score >90
   - [ ] SEO score >80
   
   Document any failing metrics.

6. DEPLOYMENT (If Build Passes)
   ```bash
   # Push to production
   git add .
   git commit -m "✅ [Module Name] - Complete optimization"
   git push origin main
   ```

7. POST-DEPLOYMENT VERIFICATION
   Once deployed:
   - [ ] Production site loads
   - [ ] Module accessible
   - [ ] Quick smoke test (main workflows)
   - [ ] No console errors in production
   - [ ] Monitor for runtime errors (check logs)

8. RESTART DEV ENVIRONMENT
   ```bash
   npm run dev
   ```
   
   Verify dev environment still works.

OUTPUT FORMAT:
Create `[MODULE_NAME]_DEPLOYMENT_REPORT.md`:

## ✅ BUILD STATUS
- Build: [PASS / FAIL]
- TypeScript Errors: [0]
- Linting Errors: [0]
- Bundle Size: [X MB]
- Build Time: [X seconds]

## 🧪 QA RESULTS
- All tabs working: [YES / NO]
- All modals working: [YES / NO]
- All forms working: [YES / NO]
- Responsive design: [YES / NO]

## 🌐 CROSS-BROWSER COMPATIBILITY
| Browser | Status | Notes |
|---------|--------|-------|
| Chrome  | ✅ | - |
| Firefox | ✅ | - |
| Safari  | ⚠️ | Minor CSS issue in modal |
| Edge    | ✅ | - |

## 📊 LIGHTHOUSE SCORES
- Performance: [85/100]
- Accessibility: [92/100]
- Best Practices: [95/100]
- SEO: [88/100]

## 🚀 DEPLOYMENT
- Deployed: [YES / NO]
- Deployment Time: [timestamp]
- Production URL: [url]
- Post-Deploy Status: [HEALTHY / ISSUES]

## 🐛 KNOWN ISSUES (To Address Later)
- [Issue description] - Priority: [Low/Medium/High]

## ✅ MODULE COMPLETE
[Module Name] optimization is complete and deployed to production.
```

---

## 📊 MODULE COMPLETION SUMMARY

**Final Prompt (After All Phases):**
```
MODULE OPTIMIZATION COMPLETE: [Module Name]

Create final summary document: `[MODULE_NAME]_OPTIMIZATION_SUMMARY.md`

## 📈 OPTIMIZATION RESULTS

### Security
- Critical issues found: [count]
- Critical issues fixed: [count]
- Remaining security issues: [count]

### Functionality  
- Workflows audited: [count]
- Workflows completed: [count]
- Edge cases addressed: [count]
- Remaining functionality gaps: [count]

### Architecture
- Refactored: [YES / NO]
- Files before: [count]
- Files after: [count]
- Lines of code: [before] → [after]

### Performance
- Performance issues found: [count]
- Performance issues fixed: [count]
- Bundle size change: [before] → [after]
- Load time improvement: [X%]

### Testing
- Test coverage before: [X%]
- Test coverage after: [Y%]
- Tests added: [count]

### Build & Deploy
- Build status: [PASS]
- Deployed: [YES]
- Production status: [HEALTHY]

## 📋 ALL DELIVERABLES
- [ ] `[MODULE_NAME]_PREFLIGHT_REPORT.md`
- [ ] `[MODULE_NAME]_SECURITY_AUDIT.md`
- [ ] `[MODULE_NAME]_FUNCTIONALITY_AUDIT.md`
- [ ] `[MODULE_NAME]_REFACTOR_PLAN.md` (if refactoring - from Phase 3, Step 2)
- [ ] `[MODULE_NAME]_BUTTON_AUDIT.md` (if refactoring - from Phase 3, Step 2)
- [ ] `[MODULE_NAME]_REFACTOR_STATUS.md` (if refactoring - from Phase 3)
- [ ] `[MODULE_NAME]_PERFORMANCE_AUDIT.md`
- [ ] `[MODULE_NAME]_TESTING_REPORT.md`
- [ ] `[MODULE_NAME]_DEPLOYMENT_REPORT.md`
- [ ] `[MODULE_NAME]_OPTIMIZATION_SUMMARY.md`

### Phase 3 Additional Deliverables (If Refactoring):
- [ ] Folder structure created: `features/[module-name]/`
- [ ] Context provider: `context/[ModuleName]Context.tsx`
- [ ] State hook: `hooks/use[ModuleName]State.ts`
- [ ] Tab components: `components/tabs/[TabName]Tab.tsx` (all tabs)
- [ ] Modal components: `components/modals/[ModalName]Modal.tsx` (all modals)
- [ ] Filter components: `components/filters/[FilterName]Filter.tsx` (if applicable)
- [ ] Orchestrator: `[ModuleName]Orchestrator.tsx`
- [ ] Barrel exports: `index.ts` files
- [ ] Types centralized: `shared/types/[module-name].types.ts`
- [ ] Main module file updated: `pages/modules/[ModuleName]Module.tsx`

## 🎯 NEXT STEPS
- Address remaining [high/medium] priority issues in future sprint
- Monitor production for any runtime errors
- Gather user feedback on improvements

## ✅ SIGN-OFF
[Module Name] has been fully optimized and is production-ready.
Completed: [Date]
Next Module: [Module Name]
Progress: [X/20 modules complete]
```

---

## 📚 REFERENCE DOCUMENTS

Keep these available for Cursor AI to reference:

1. **Gold Standard Example**: `frontend/src/features/access-control/` - Reference implementation
   - Context: `context/AccessControlContext.tsx`
   - Hook: `hooks/useAccessControlState.ts`
   - Tab Example: `components/tabs/DashboardTab.tsx`
   - Modal Example: `components/modals/CreateAccessPointModal.tsx` (supports edit mode)
   - Filter Example: `components/filters/AccessPointsFilter.tsx` (proper alignment)
   - Orchestrator: `AccessControlModuleOrchestrator.tsx`
2. **Type Definitions**: `frontend/src/shared/types/access-control.types.ts` - Example of centralized types
3. **UI Components Library**: `frontend/src/components/UI/` - Available UI components

**Note**: All refactoring patterns, code examples, checklists, and common issues are now included directly in Phase 3 above. No need to reference a separate guide file.

---

## 🎯 USAGE INSTRUCTIONS FOR CURSOR AI

### Starting a Module Audit:
```
"Beginning optimization for [Module Name] module (Module X/20).
Execute Phase 0: Pre-Flight Assessment following the complete audit system."
```

### Moving Between Phases:
```
"Phase [X] complete for [Module Name]. 
Execute Phase [X+1]: [Phase Name]."
```

### If Cursor Gets Lost:
```
"Reference the complete audit system document. 
We are currently on Phase [X] for [Module Name].
Continue from where we left off."
```

### Skip Refactor If Not Needed:
```
"[Module Name] assessed - refactor not needed (follows Gold Standard).
Skip Phase 3, proceed to Phase 4: Performance & Code Quality."
```

### Starting Refactoring (Phase 3):
```
"Phase 2 complete for [Module Name]. Module needs refactoring.
Execute Phase 3: Architecture Refactor following MODULE_AUDIT.md Phase 3.
Reference the Access Control module at frontend/src/features/access-control/ as the Gold Standard example.
Start with REFACTORING_PHASE_1: Analysis & Planning."
```

### Moving Between Refactoring Phases:
```
"REFACTORING_PHASE_[X] complete for [Module Name].
Execute REFACTORING_PHASE_[X+1]: [Phase Name] following MODULE_AUDIT.md Phase 3.
Continue using Access Control module as reference pattern."
```

## 🆘 RESCUE PROTOCOLS

Use these when Cursor AI produces shallow work or goes off-track:

### If Cursor Produces Shallow Analysis:
```
"Stop. Re-read the audit criteria for Phase [X] in MODULE_AUDIT.md.
Provide file:line references for EVERY issue found.
Include specific fix recommendations, not general advice.
For each issue, specify:
- Exact file path and line number
- Current code snippet
- Recommended fix with code example
- Expected outcome"
```

### If Cursor Misses Obvious Issues:
```
"Audit missed critical areas. Re-run Phase [X] focusing specifically on:
- [Area 1 - e.g., All buttons in DashboardTab]
- [Area 2 - e.g., Form validation in CreateUserModal]
- [Area 3 - e.g., Error handling in API calls]
Compare findings to Phase 0 baseline report.
Review each area systematically and document ALL issues found."
```

### If Refactor Goes Off-Track:
```
"Stop refactoring. Compare current work against Gold Standard:
frontend/src/features/access-control/

List all deviations from the pattern:
1. Check file structure - does it match the target structure in Phase 3?
2. Check context pattern - does it match AccessControlContext.tsx?
3. Check hook pattern - does it match useAccessControlState.ts?
4. Check component structure - does it match DashboardTab.tsx?
5. Check modal pattern - does it match CreateAccessPointModal.tsx?

For each deviation, explain:
- What was done differently
- Why it deviates (if intentional)
- How to fix to match Gold Standard"
```

### If Code Patterns Don't Match:
```
"Code pattern doesn't match Gold Standard. Reference Phase 3 patterns:
1. For Context: Use the Context Pattern example in Phase 3, Step 4
2. For State Hook: Use the State Hook Pattern example in Phase 3, Step 5
3. For Tab Component: Use the Tab Component Pattern example in Phase 3, Step 7
4. For Modal: Use the Modal Pattern example in Phase 3, Step 9

Rewrite [component/hook] following the exact pattern shown.
Ensure props, structure, and exports match the example."
```

### If Build/Type Errors Persist:
```
"Stop. We have persistent [TypeScript/Linter] errors.
1. List ALL remaining errors with file:line
2. Check Phase 3, STEP 4: COMMON ISSUES & SOLUTIONS
3. For each error, identify which common issue it matches
4. Apply the solution from the guide
5. If error doesn't match common issues, document it for future reference"
```

### If Missing Deliverables:
```
"Phase [X] deliverables are missing or incomplete.
Check MODULE_AUDIT.md deliverables section.
Required outputs:
- [List specific deliverables for this phase]

For Phase 3, ensure you create:
- [MODULE_NAME]_REFACTOR_PLAN.md
- [MODULE_NAME]_BUTTON_AUDIT.md
- [MODULE_NAME]_REFACTOR_STATUS.md
- All code files matching Gold Standard structure"
```

---

