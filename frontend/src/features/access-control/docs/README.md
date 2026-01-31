# Access Control Module
**Version:** 2.9  
**Status:** ✅ Production Ready (100%)

---

## Overview

The Access Control module provides comprehensive access management for facilities, including access point management, user management, event tracking, emergency controls, and integration with mobile agent applications and hardware devices.

---

## Features

### Core Functionality
- ✅ **Access Point Management** - Create, update, delete, and monitor access points
- ✅ **User Management** - Manage users, permissions, and access levels
- ✅ **Event Tracking** - Real-time access event logging with filtering and pagination
- ✅ **Emergency Controls** - Emergency lockdown, unlock, and restore operations
- ✅ **Audit Trail** - Comprehensive audit logging for all operations

### Integration Capabilities
- ✅ **Mobile Agent Integration** - Submit events from mobile applications with review workflow
- ✅ **Hardware Device Integration** - Plug & Play device registration and heartbeat tracking
- ✅ **WebSocket Real-Time Updates** - 7 channels for real-time state synchronization
- ✅ **External Data Sources** - API endpoints for external system integration

### Production Features
- ✅ **Retry Logic** - Exponential backoff for all critical operations
- ✅ **Offline Queue** - Queue operations when network is unavailable
- ✅ **Heartbeat Tracking** - Automatic offline detection (15-minute threshold)
- ✅ **Telemetry** - Comprehensive observability (actions, performance, errors)
- ✅ **Error Handling** - Standardized error handling with ErrorHandlerService
- ✅ **State Management** - Optimistic updates with rollback
- ✅ **Race Condition Prevention** - Conflict resolution for concurrent operations

---

## Quick Start

### Installation

The module is part of the PROPER 2.9 application. No separate installation required.

### Basic Usage

```typescript
import { AccessControlModule } from '@/features/access-control';

function App() {
  return <AccessControlModule />;
}
```

### Accessing Context

```typescript
import { useAccessControlContext } from '@/features/access-control';

function MyComponent() {
  const {
    accessPoints,
    users,
    accessEvents,
    emergencyMode,
    refreshAccessPoints,
    handleEmergencyLockdown,
  } = useAccessControlContext();

  // Use context data and actions
}
```

---

## Architecture

### Module Structure

```
frontend/src/features/access-control/
├── AccessControlModuleOrchestrator.tsx  # Main orchestrator
├── context/
│   └── AccessControlContext.tsx        # Context provider
├── hooks/
│   ├── useAccessControlState.ts        # Core state management
│   ├── useAccessControlWebSocket.ts    # WebSocket integration
│   ├── useAccessControlTelemetry.ts   # Telemetry tracking
│   ├── useAccessControlHeartbeat.ts   # Heartbeat tracking
│   └── useAccessControlQueue.ts       # Offline queue
├── components/
│   ├── tabs/
│   │   ├── OverviewTab.tsx
│   │   ├── AccessPointsTab.tsx
│   │   ├── UsersTab.tsx
│   │   ├── EventsTab.tsx
│   │   ├── ConfigurationTab.tsx
│   │   ├── ReportsTab.tsx
│   │   └── LockdownFacilityTab.tsx
│   └── modals/
│       ├── CreateUserModal.tsx
│       ├── EditUserModal.tsx
│       └── ...
└── __tests__/                          # Unit tests
```

### Key Hooks

#### `useAccessControlState`
Central state management hook containing all business logic.

```typescript
const {
  accessPoints,
  users,
  accessEvents,
  metrics,
  emergencyMode,
  refreshAccessPoints,
  createAccessPoint,
  handleEmergencyLockdown,
} = useAccessControlState();
```

#### `useAccessControlWebSocket`
Real-time updates via WebSocket.

```typescript
useAccessControlWebSocket({
  onAccessPointUpdated: (point) => {
    // Handle point update
  },
  onEventCreated: (event) => {
    // Handle new event
  },
});
```

#### `useAccessControlTelemetry`
Observability tracking.

```typescript
const { trackAction, trackPerformance, trackError } = useAccessControlTelemetry();

trackAction('access_point_created', { pointId: 'point-123' });
```

---

## API Reference

### Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/access-control/points` | GET, POST | Access point management |
| `/api/access-control/points/{id}` | PUT, DELETE | Update/delete access point |
| `/api/access-control/points/health` | GET | Get health status |
| `/api/access-control/points/{id}/heartbeat` | POST | Record heartbeat |
| `/api/access-control/points/register` | POST | Register hardware device |
| `/api/access-control/users` | GET, POST | User management |
| `/api/access-control/users/{id}` | PUT, DELETE | Update/delete user |
| `/api/access-control/events` | GET | Get access events |
| `/api/access-control/events/agent` | POST | Submit agent event |
| `/api/access-control/events/{id}/review` | PUT | Review agent event |
| `/api/access-control/emergency/lockdown` | POST | Emergency lockdown |
| `/api/access-control/emergency/unlock` | POST | Emergency unlock |
| `/api/access-control/emergency/restore` | POST | Restore normal mode |

**Full API Documentation:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## WebSocket Channels

| Channel | Purpose |
|---------|---------|
| `access-control.point.updated` | Access point status changes |
| `access-control.point.offline` | Device offline detection |
| `access-control.event.created` | New access events |
| `access-control.user.updated` | User status changes |
| `access-control.emergency.activated` | Emergency mode changes |
| `access-control.agent-event.pending` | Pending agent events |
| `access-control.held-open-alarm` | Held-open door alarms |

**Full WebSocket Documentation:** [WEBSOCKET_DOCUMENTATION.md](./WEBSOCKET_DOCUMENTATION.md)

---

## Integration Guides

### Mobile Agent Integration

Submit access events from mobile applications:

```typescript
const response = await fetch('/api/access-control/events/agent', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    property_id: 'prop-123',
    access_point: 'main-entrance',
    access_method: 'mobile',
    event_type: 'access_attempt',
    timestamp: new Date().toISOString(),
    location: { lat: 40.7128, lng: -74.0060 },
    is_authorized: true,
    source_agent_id: 'agent-123',
    source_device_id: 'mobile-device-001',
    idempotency_key: crypto.randomUUID(),
  }),
});
```

**Full Guide:** [INTEGRATION_GUIDES.md](./INTEGRATION_GUIDES.md#mobile-agent-integration)

### Hardware Device Integration

Register and send heartbeat from hardware devices:

```python
device = HardwareDevice('AC-DEV-001', api_key, base_url)
device.register({
    'type': 'door',
    'firmware_version': '2.1.0',
    'location': 'Main Entrance',
})
device.start_heartbeat_loop()  # Sends heartbeat every 60s
```

**Full Guide:** [INTEGRATION_GUIDES.md](./INTEGRATION_GUIDES.md#hardware-device-integration)

---

## Configuration

### Environment Variables

```bash
# Hardware device authentication
HARDWARE_INGEST_KEY=your-secure-api-key-here

# API base URL
API_BASE_URL=http://localhost:8000
```

### Frontend Settings

- **Heartbeat Threshold:** 15 minutes (configurable)
- **Retry Attempts:** 5 (with exponential backoff)
- **Offline Queue Size:** 100 operations
- **Pagination:** 25 items per page (configurable)

---

## Testing

### Running Tests

```bash
# Unit tests
npm test -- access-control

# E2E tests
npx playwright test access-control.spec.ts
```

### Test Coverage

- ✅ Unit tests for hooks
- ✅ Integration tests for API
- ✅ E2E tests for critical paths
- ✅ Performance tests

**Current Coverage:** ~80%+

---

## Development

### Adding New Features

1. **Follow Gold Standard:** See `UI-GOLDSTANDARD.md`
2. **Use Hooks Pattern:** Business logic in hooks, not components
3. **Add Telemetry:** Track all user actions
4. **Add Retry Logic:** For all API operations
5. **Add Tests:** Unit and integration tests

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Functional components with hooks
- Error boundaries for isolation

---

## Troubleshooting

### Common Issues

1. **Events not appearing:** Check `review_status` (agent events require approval)
2. **Device showing offline:** Verify heartbeat is sent every 60 seconds
3. **WebSocket disconnects:** Check network and implement reconnection logic
4. **Duplicate events:** Always include `idempotency_key`

**Full Troubleshooting Guide:** [INTEGRATION_GUIDES.md](./INTEGRATION_GUIDES.md#troubleshooting)

---

## Production Readiness

### ✅ Completed Phases

- ✅ **Phase 1:** Critical Infrastructure (WebSocket, Telemetry, Retry)
- ✅ **Phase 2:** Hardware Integration (Heartbeat, Offline Queue)
- ✅ **Phase 3:** Gold Standard Compliance (UI/UX, State Management)
- ✅ **Phase 4:** Mobile & Hardware Integration (API Endpoints)
- ✅ **Phase 5:** Testing & Documentation

### Production Readiness Score: **100%** ✅

**Ready for:**
- ✅ Real-world use
- ✅ Mobile agent applications
- ✅ Hardware devices Plug & Play
- ✅ External data sources
- ✅ Third-party development

---

## Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [WebSocket Documentation](./WEBSOCKET_DOCUMENTATION.md) - Real-time updates
- [Integration Guides](./INTEGRATION_GUIDES.md) - Mobile & hardware integration
- [Production Readiness Audit](../../../../../docs/audits/ACCESS_CONTROL_PRODUCTION_READINESS_AUDIT.md) - Detailed audit report
- [Fixes Applied](../../../../../docs/audits/ACCESS_CONTROL_FIXES_APPLIED.md) - All fixes documentation

---

## Support

For issues or questions:
1. Check documentation above
2. Review troubleshooting guide
3. Check error logs (browser console F12, backend logs)
4. Review audit reports for known issues

---

## License

Part of PROPER 2.9 application.

---

**Last Updated:** January 26, 2026  
**Version:** 2.9  
**Status:** ✅ Production Ready
