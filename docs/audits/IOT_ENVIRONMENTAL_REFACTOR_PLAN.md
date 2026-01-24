# IOT_ENVIRONMENTAL_REFACTOR_PLAN

## ✅ Refactor Needed
- File is monolithic (>1500 lines)
- UI and business logic mixed
- No context/hooks separation

## Target Structure
`frontend/src/features/iot-environmental/`
- `IoTEnvironmentalOrchestrator.tsx`
- `context/IoTEnvironmentalContext.tsx`
- `hooks/useIoTEnvironmentalState.ts`
- `components/tabs/OverviewTab.tsx`
- `components/tabs/SensorsTab.tsx`
- `components/tabs/AlertsTab.tsx`
- `components/tabs/AnalyticsTab.tsx`
- `components/modals/AddSensorModal.tsx`
- `components/modals/EditSensorModal.tsx`
- `components/modals/ViewSensorModal.tsx`
- `components/modals/SettingsModal.tsx`
- `types/iot-environmental.types.ts`

## Tabs to Extract
- Overview
- Sensors
- Alerts
- Analytics

## Modals to Extract
- Add Sensor
- Edit Sensor
- View Sensor Details
- Settings

## Hook Responsibilities
- Load data + subscribe to WebSocket
- CRUD actions for sensors
- Alert acknowledge/resolve
- Export data
- Settings save/reset
- RBAC checks
- Validation (Zod)

## API Requirements
- `/iot/environmental` (GET/POST/PUT/DELETE)
- `/iot/environmental/alerts` (GET/POST/PUT)
- `/iot/environmental/analytics` (GET)
- `/iot/environmental/settings` (GET/PUT)

## Risks
- Backend endpoints missing
- No RBAC currently
- Placeholder workflows

## Next Step
Proceed to Architecture Refactor Phase 3 after Security Critical Issues are addressed.
