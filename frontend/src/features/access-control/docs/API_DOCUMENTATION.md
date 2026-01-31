# Access Control API Documentation
**Version:** 2.9  
**Base URL:** `/api/access-control`  
**Last Updated:** January 26, 2026

---

## Table of Contents

1. [Authentication](#authentication)
2. [Access Points](#access-points)
3. [Users](#users)
4. [Events](#events)
5. [Mobile Agent Integration](#mobile-agent-integration)
6. [Hardware Device Integration](#hardware-device-integration)
7. [Emergency Operations](#emergency-operations)
8. [Audit Logs](#audit-logs)
9. [Metrics & Reports](#metrics--reports)

---

## Authentication

### Standard Authentication
Most endpoints require JWT authentication via Bearer token:

```http
Authorization: Bearer <jwt_token>
```

### Hardware Device Authentication
Hardware device endpoints support X-API-Key authentication:

```http
X-API-Key: <hardware_ingest_key>
```

**Environment Variable:** `HARDWARE_INGEST_KEY`

---

## Access Points

### Get All Access Points
```http
GET /api/access-control/points?property_id=<optional>
```

**Response:**
```json
{
  "data": [
    {
      "id": "point-123",
      "name": "Main Entrance",
      "location": "Building A - Lobby",
      "type": "door",
      "status": "active",
      "isOnline": true,
      "lastStatusChange": "2026-01-26T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 50,
    "totalPages": 1
  }
}
```

### Create Access Point
```http
POST /api/access-control/points
Content-Type: application/json

{
  "name": "Side Entrance",
  "location": "Building A - Side",
  "type": "door",
  "status": "active"
}
```

### Update Access Point
```http
PUT /api/access-control/points/{point_id}
Content-Type: application/json

{
  "status": "maintenance",
  "name": "Updated Name"
}
```

### Delete Access Point
```http
DELETE /api/access-control/points/{point_id}
```

### Get Access Points Health
```http
GET /api/access-control/points/health?property_id=<optional>
```

**Response:**
```json
{
  "data": {
    "point-123": {
      "point_id": "point-123",
      "name": "Main Entrance",
      "last_heartbeat": "2026-01-26T10:30:00Z",
      "connection_status": "online",
      "isOnline": true,
      "device_id": "AC-DEV-001",
      "firmware_version": "2.1.0",
      "battery_level": 85
    }
  }
}
```

---

## Users

### Get All Users
```http
GET /api/access-control/users?property_id=<optional>
```

### Create User
```http
POST /api/access-control/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "employee",
  "department": "Security",
  "accessLevel": "standard"
}
```

### Update User
```http
PUT /api/access-control/users/{user_id}
Content-Type: application/json

{
  "status": "active",
  "accessLevel": "elevated"
}
```

### Delete User
```http
DELETE /api/access-control/users/{user_id}
```

---

## Events

### Get Access Events
```http
GET /api/access-control/events?property_id=<optional>&action=<optional>&userId=<optional>&accessPointId=<optional>&startDate=<optional>&endDate=<optional>
```

**Query Parameters:**
- `action`: Filter by action (`granted`, `denied`, `timeout`)
- `userId`: Filter by user ID
- `accessPointId`: Filter by access point ID
- `startDate`: ISO 8601 date string
- `endDate`: ISO 8601 date string

**Response:**
```json
{
  "data": [
    {
      "id": "event-123",
      "userId": "user-456",
      "userName": "John Doe",
      "accessPointId": "point-123",
      "accessPointName": "Main Entrance",
      "action": "granted",
      "timestamp": "2026-01-26T10:30:00Z",
      "location": "Building A - Lobby",
      "accessMethod": "card",
      "source": "web_admin",
      "review_status": "approved"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

### Sync Cached Events
```http
POST /api/access-control/events/sync
Content-Type: application/json

{
  "access_point_id": "point-123",
  "events": [
    {
      "userId": "user-456",
      "action": "granted",
      "timestamp": "2026-01-26T10:30:00Z"
    }
  ]
}
```

### Export Events
```http
GET /api/access-control/events/export?format=csv&property_id=<optional>
```

**Formats:** `csv`, `json`

---

## Mobile Agent Integration

### Submit Agent Event
```http
POST /api/access-control/events/agent
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "property_id": "prop-123",
  "user_id": "user-456",
  "access_point": "main-entrance",
  "access_method": "mobile",
  "event_type": "access_attempt",
  "timestamp": "2026-01-26T10:30:00Z",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  },
  "is_authorized": true,
  "source_agent_id": "agent-789",
  "source_device_id": "mobile-device-001",
  "source_metadata": {
    "app_version": "1.0.0",
    "gps_accuracy": 5.2
  },
  "idempotency_key": "550e8400-e29b-41d4-a716-446655440000",
  "description": "Access granted via mobile app"
}
```

**Response:**
```json
{
  "data": {
    "id": "event-123",
    "review_status": "pending",
    "timestamp": "2026-01-26T10:30:00Z"
  },
  "message": "Agent event submitted for review",
  "success": true
}
```

**Idempotency:**
- If `idempotency_key` matches an existing event, returns the existing event
- Prevents duplicate submissions from mobile agents

### Review Agent Event
```http
PUT /api/access-control/events/{event_id}/review?action=approve&reason=<optional>
Authorization: Bearer <jwt_token>
```

**Actions:** `approve`, `reject`

**Response:**
```json
{
  "data": {
    "id": "event-123",
    "review_status": "approved",
    "reviewed_by": "user-789",
    "reviewed_at": "2026-01-26T10:35:00Z"
  },
  "message": "Event approved",
  "success": true
}
```

---

## Hardware Device Integration

### Register Hardware Device (Plug & Play)
```http
POST /api/access-control/points/register
X-API-Key: <hardware_ingest_key>
Content-Type: application/json

{
  "device_id": "AC-DEV-001",
  "device_type": "door",
  "firmware_version": "2.1.0",
  "hardware_vendor": "SecureAccess Inc",
  "mac_address": "00:11:22:33:44:55",
  "ip_address": "192.168.1.100",
  "location": "Main Entrance - Building A",
  "capabilities": ["card", "biometric", "pin"]
}
```

**Response:**
```json
{
  "data": {
    "id": "point-123",
    "name": "Main Entrance - Building A",
    "device_id": "AC-DEV-001",
    "status": "active",
    "isOnline": true
  },
  "message": "Device registered successfully",
  "success": true
}
```

**Behavior:**
- If `device_id` already exists, updates the existing access point
- If new, creates a new access point automatically
- Sets initial heartbeat and online status

### Record Heartbeat
```http
POST /api/access-control/points/{point_id}/heartbeat
X-API-Key: <hardware_ingest_key>
Content-Type: application/json

{
  "device_id": "AC-DEV-001",
  "firmware_version": "2.1.0",
  "battery_level": 85,
  "sensor_status": "closed"
}
```

**Response:**
```json
{
  "ok": true,
  "point_id": "point-123",
  "data": {
    "last_heartbeat": "2026-01-26T10:30:00Z",
    "isOnline": true
  }
}
```

**Recommended Frequency:** Every 60 seconds

**Offline Detection:** Device marked offline if no heartbeat received for 15 minutes

---

## Emergency Operations

### Emergency Lockdown
```http
POST /api/access-control/emergency/lockdown
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "property_id": "prop-123",
  "reason": "Security threat detected",
  "timeout_minutes": 30
}
```

**Response:**
```json
{
  "mode": "lockdown",
  "initiated_by": "user-789",
  "initiated_at": "2026-01-26T10:30:00Z",
  "reason": "Security threat detected",
  "timeout_minutes": 30,
  "expires_at": "2026-01-26T11:00:00Z"
}
```

### Emergency Unlock
```http
POST /api/access-control/emergency/unlock
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "property_id": "prop-123",
  "reason": "Threat cleared",
  "timeout_minutes": 15
}
```

### Restore Normal Mode
```http
POST /api/access-control/emergency/restore
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "property_id": "prop-123",
  "reason": "Returning to normal operations"
}
```

---

## Audit Logs

### Get Audit Entries
```http
GET /api/access-control/audit?property_id=<optional>&limit=50&offset=0
```

**Response:**
```json
{
  "data": [
    {
      "audit_id": "audit-123",
      "timestamp": "2026-01-26T10:30:00Z",
      "actor": "user:789",
      "action": "emergency_lockdown",
      "status": "success",
      "target": "property:prop-123",
      "reason": "Security threat",
      "source": "web_admin"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

### Create Audit Entry
```http
POST /api/access-control/audit
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "property_id": "prop-123",
  "action": "access_point_updated",
  "status": "success",
  "target": "point-123",
  "reason": "Maintenance scheduled",
  "source": "web_admin"
}
```

---

## Metrics & Reports

### Get Access Metrics
```http
GET /api/access-control/metrics?property_id=<optional>
```

**Response:**
```json
{
  "data": {
    "totalAccessPoints": 50,
    "activeAccessPoints": 48,
    "totalUsers": 200,
    "activeUsers": 195,
    "todayAccessEvents": 1250,
    "deniedAccessEvents": 15,
    "securityScore": 92,
    "averageResponseTime": "45ms"
  }
}
```

### Export Report
```http
GET /api/access-control/reports/export?format=pdf&property_id=<optional>
```

**Formats:** `pdf`, `csv`

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "detail": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "detail": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Rate Limiting

- **Standard Endpoints:** 100 requests per minute per user
- **Hardware Endpoints:** 1000 requests per minute per device
- **Emergency Endpoints:** 10 requests per minute per user

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1643209200
```

---

## Best Practices

1. **Idempotency:** Always include `idempotency_key` for mobile agent event submissions
2. **Heartbeat Frequency:** Send heartbeat every 60 seconds for hardware devices
3. **Error Handling:** Implement retry logic with exponential backoff
4. **Authentication:** Use X-API-Key for hardware devices, JWT for web/mobile agents
5. **Pagination:** Use pagination for large datasets (events, users)
6. **Real-time Updates:** Subscribe to WebSocket channels for real-time updates

---

**For WebSocket documentation, see:** [WebSocket Documentation](./WEBSOCKET_DOCUMENTATION.md)  
**For integration guides, see:** [Integration Guides](./INTEGRATION_GUIDES.md)  
**For module overview, see:** [README](./README.md)
