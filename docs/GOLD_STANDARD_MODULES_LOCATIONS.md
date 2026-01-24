# Gold Standard Modules - Locations

**Date**: 2025-01-27  
**Status**: ✅ **Active Gold Standard Modules**  
**Modules**: Access Control & Incident Log  

---

## 📍 MODULE LOCATIONS

### 🎯 Incident Log Module

#### Main Feature Directory
**Location**: `frontend/src/features/incident-log/`

**Structure**:
```
features/incident-log/
├── components/          # UI Components
│   ├── tabs/           # Tab components (Dashboard, Incidents, Trends, Predictions, Settings)
│   ├── modals/         # Modal components (Create, Edit, Details, Escalation, Filters, Report)
│   └── filters/        # Filter components
├── context/            # React Context
│   └── IncidentLogContext.tsx
├── hooks/              # Custom Hooks
│   └── useIncidentLogState.ts
├── services/           # API Service Layer
│   └── IncidentService.ts
├── types/              # TypeScript Types
│   └── incident-log.types.ts
└── routes/             # Routing (if needed)
```

#### Route/Orchestrator
**Location**: `frontend/src/pages/modules/IncidentLogModule.tsx`

**Purpose**: 
- Entry point for the module (imported by `App.tsx`)
- Orchestrates the module layout and tab navigation
- Wraps components with `IncidentLogContext.Provider`

---

### 🔐 Access Control Module

#### Main Feature Directory
**Location**: `frontend/src/features/access-control/`

**Structure**:
```
features/access-control/
├── components/          # UI Components
│   ├── tabs/           # Tab components (Dashboard, AccessPoints, Users, Events, Reports, AIAnalytics, Configuration)
│   ├── modals/         # Modal components (CreateAccessPoint, CreateUser, EditUser, Config modals)
│   └── filters/        # Filter components
├── context/            # React Context
│   └── AccessControlContext.tsx
├── hooks/              # Custom Hooks
│   └── useAccessControlState.ts
├── services/           # API Service Layer (if separate)
├── types/              # TypeScript Types (shared types location)
├── routes/             # Routing
│   └── AccessControlRoutes.tsx
├── AccessControlModuleOrchestrator.tsx  # Main orchestrator component
└── __tests__/          # Tests
    ├── AccessControlContext.test.tsx
    └── useAccessControlState.test.ts
```

#### Route/Orchestrator
**Location**: `frontend/src/pages/modules/AccessControlModule.tsx`

**Purpose**: 
- Entry point for the module (imported by `App.tsx`)
- Slim wrapper that imports and exports `AccessControlModuleOrchestrator`
- The actual orchestrator is in `features/access-control/AccessControlModuleOrchestrator.tsx`

---

## 🏗️ GOLD STANDARD ARCHITECTURE

Both modules follow the **Gold Standard** architecture pattern:

### ✅ Key Characteristics

1. **Feature-Based Organization**
   - All module code is in `features/[module-name]/`
   - Self-contained and modular

2. **Separation of Concerns**
   - **Context**: Global state management (`context/`)
   - **Hooks**: Business logic (`hooks/`)
   - **Services**: API communication (`services/`)
   - **Components**: UI (`components/`)
   - **Types**: TypeScript definitions (`types/`)

3. **Component Decomposition**
   - **Tabs**: Main view components
   - **Modals**: Dialog components
   - **Filters**: Filter components

4. **State Management**
   - React Context API for global state
   - Custom hooks for business logic
   - Controlled components (no `document.getElementById`)

5. **API Integration**
   - Service layer abstraction (`IncidentService.ts`, etc.)
   - Centralized API calls
   - Type-safe requests/responses

---

## 🔗 ROUTING

### App.tsx Routes

Both modules are registered in `frontend/src/App.tsx`:

```typescript
// Incident Log
import IncidentLogModule from './pages/modules/IncidentLogModule';
<Route path="/modules/event-log" element={<IncidentLogModule />} />

// Access Control
import AccessControlModule from './pages/modules/AccessControlModule';
<Route path="/modules/access-control" element={<AccessControlModule />} />
```

---

## 📊 COMPARISON: Old vs New

### Before (Monolithic)
- ❌ Single large file (3,000+ lines)
- ❌ No separation of concerns
- ❌ Direct DOM manipulation
- ❌ Mock data/placeholders
- ❌ Mixed concerns (UI + logic + API)

### After (Gold Standard)
- ✅ Modular feature directory
- ✅ Clear separation (Context, Hooks, Services, Components)
- ✅ Controlled React components
- ✅ Real API integration
- ✅ Type-safe and maintainable

---

## 🎯 KEY FILES

### Incident Log

**Entry Point**: 
- `frontend/src/pages/modules/IncidentLogModule.tsx`

**Core Logic**:
- `frontend/src/features/incident-log/hooks/useIncidentLogState.ts` - All business logic
- `frontend/src/features/incident-log/context/IncidentLogContext.tsx` - Context provider
- `frontend/src/features/incident-log/services/IncidentService.ts` - API service

**Main Components**:
- `frontend/src/features/incident-log/components/tabs/DashboardTab.tsx`
- `frontend/src/features/incident-log/components/tabs/IncidentsTab.tsx`
- `frontend/src/features/incident-log/components/tabs/TrendsTab.tsx`
- `frontend/src/features/incident-log/components/tabs/PredictionsTab.tsx`
- `frontend/src/features/incident-log/components/tabs/SettingsTab.tsx`

### Access Control

**Entry Point**: 
- `frontend/src/pages/modules/AccessControlModule.tsx`

**Core Logic**:
- `frontend/src/features/access-control/hooks/useAccessControlState.ts` - All business logic
- `frontend/src/features/access-control/context/AccessControlContext.tsx` - Context provider
- `frontend/src/features/access-control/AccessControlModuleOrchestrator.tsx` - Main orchestrator

**Main Components**:
- `frontend/src/features/access-control/components/tabs/DashboardTab.tsx`
- `frontend/src/features/access-control/components/tabs/AccessPointsTab.tsx`
- `frontend/src/features/access-control/components/tabs/UsersTab.tsx`
- `frontend/src/features/access-control/components/tabs/EventsTab.tsx`
- `frontend/src/features/access-control/components/tabs/ReportsTab.tsx`
- `frontend/src/features/access-control/components/tabs/AIAnalyticsTab.tsx`
- `frontend/src/features/access-control/components/tabs/ConfigurationTab.tsx`

---

**Last Updated**: 2025-01-27  
**Status**: Active Gold Standard Modules ✅
