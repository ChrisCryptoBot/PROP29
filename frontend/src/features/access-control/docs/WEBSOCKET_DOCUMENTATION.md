# Access Control WebSocket Documentation
**Version:** 2.9  
**WebSocket URL:** `ws://<host>/ws`  
**Last Updated:** January 26, 2026

---

## Overview

The Access Control module uses WebSocket for real-time updates. All channels are prefixed with `access-control.`.

---

## Connection

### Connect to WebSocket
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onopen = () => {
  console.log('WebSocket connected');
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket disconnected');
};
```

### Authentication
WebSocket connections use the same JWT token as HTTP requests:

```javascript
const token = localStorage.getItem('access_token');
const ws = new WebSocket(`ws://localhost:8000/ws?token=${token}`);
```

---

## Channels

### 1. Access Point Updated
**Channel:** `access-control.point.updated`

**Subscribe:**
```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'access-control.point.updated'
}));
```

**Message Format:**
```json
{
  "type": "access-control.point.updated",
  "data": {
    "id": "point-123",
    "name": "Main Entrance",
    "location": "Building A - Lobby",
    "type": "door",
    "status": "active",
    "isOnline": true,
    "lastStatusChange": "2026-01-26T10:30:00Z"
  }
}
```

**When Triggered:**
- Access point status changes
- Access point configuration updates
- Access point created/deleted

---

### 2. Access Point Offline
**Channel:** `access-control.point.offline`

**Subscribe:**
```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'access-control.point.offline'
}));
```

**Message Format:**
```json
{
  "type": "access-control.point.offline",
  "data": {
    "accessPointId": "point-123",
    "isOnline": false,
    "lastHeartbeat": "2026-01-26T10:15:00Z",
    "reason": "heartbeat_timeout"
  }
}
```

**When Triggered:**
- Device heartbeat timeout (15 minutes)
- Manual offline status change
- Network disconnection detected

---

### 3. Event Created
**Channel:** `access-control.event.created`

**Subscribe:**
```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'access-control.event.created'
}));
```

**Message Format:**
```json
{
  "type": "access-control.event.created",
  "data": {
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
}
```

**When Triggered:**
- New access event created
- Agent event submitted
- Hardware device event recorded

---

### 4. User Updated
**Channel:** `access-control.user.updated`

**Subscribe:**
```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'access-control.user.updated'
}));
```

**Message Format:**
```json
{
  "type": "access-control.user.updated",
  "data": {
    "id": "user-456",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "active",
    "accessLevel": "standard",
    "lastAccess": "2026-01-26T10:30:00Z"
  }
}
```

**When Triggered:**
- User status changes
- User permissions updated
- User created/deleted

---

### 5. Emergency Activated
**Channel:** `access-control.emergency.activated`

**Subscribe:**
```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'access-control.emergency.activated'
}));
```

**Message Format:**
```json
{
  "type": "access-control.emergency.activated",
  "data": {
    "mode": "lockdown",
    "initiatedBy": "user-789",
    "timestamp": "2026-01-26T10:30:00Z",
    "reason": "Security threat detected",
    "timeout_minutes": 30,
    "expires_at": "2026-01-26T11:00:00Z"
  }
}
```

**Modes:** `lockdown`, `unlock`, `restore`

**When Triggered:**
- Emergency lockdown initiated
- Emergency unlock initiated
- Normal mode restored

---

### 6. Agent Event Pending
**Channel:** `access-control.agent-event.pending`

**Subscribe:**
```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'access-control.agent-event.pending'
}));
```

**Message Format:**
```json
{
  "type": "access-control.agent-event.pending",
  "data": {
    "event": {
      "id": "event-123",
      "source": "mobile_agent",
      "source_agent_id": "agent-789",
      "source_device_id": "mobile-device-001",
      "review_status": "pending",
      "timestamp": "2026-01-26T10:30:00Z"
    }
  }
}
```

**When Triggered:**
- Mobile agent submits new event
- Hardware device submits event requiring review

---

### 7. Held-Open Alarm
**Channel:** `access-control.held-open-alarm`

**Subscribe:**
```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'access-control.held-open-alarm'
}));
```

**Message Format:**
```json
{
  "type": "access-control.held-open-alarm",
  "data": {
    "accessPointId": "point-123",
    "accessPointName": "Main Entrance",
    "location": "Building A - Lobby",
    "duration": 300,
    "severity": "critical",
    "timestamp": "2026-01-26T10:30:00Z"
  }
}
```

**Severity Levels:**
- `warning`: 2-5 minutes
- `critical`: >5 minutes

**When Triggered:**
- Door held open for 2+ minutes
- Door held open for 5+ minutes (critical)

---

## Unsubscribing

To unsubscribe from a channel:

```javascript
ws.send(JSON.stringify({
  type: 'unsubscribe',
  channel: 'access-control.point.updated'
}));
```

---

## Reconnection Handling

### Automatic Reconnection
```javascript
let ws;
let reconnectInterval = 5000; // 5 seconds

function connect() {
  ws = new WebSocket('ws://localhost:8000/ws?token=' + token);
  
  ws.onopen = () => {
    console.log('Connected');
    // Resubscribe to all channels
    subscribeToChannels();
    reconnectInterval = 5000; // Reset interval
  };
  
  ws.onclose = () => {
    console.log('Disconnected, reconnecting...');
    setTimeout(connect, reconnectInterval);
    reconnectInterval = Math.min(reconnectInterval * 2, 30000); // Exponential backoff, max 30s
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

function subscribeToChannels() {
  const channels = [
    'access-control.point.updated',
    'access-control.point.offline',
    'access-control.event.created',
    'access-control.user.updated',
    'access-control.emergency.activated',
    'access-control.agent-event.pending',
    'access-control.held-open-alarm'
  ];
  
  channels.forEach(channel => {
    ws.send(JSON.stringify({
      type: 'subscribe',
      channel: channel
    }));
  });
}

connect();
```

---

## Error Handling

### Connection Errors
```javascript
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  // Implement fallback (polling, etc.)
};
```

### Message Parsing Errors
```javascript
ws.onmessage = (event) => {
  try {
    const message = JSON.parse(event.data);
    handleMessage(message);
  } catch (error) {
    console.error('Failed to parse message:', error);
  }
};
```

### Invalid Channel Errors
If you subscribe to an invalid channel, you'll receive:

```json
{
  "type": "error",
  "channel": "invalid.channel",
  "message": "Channel not found"
}
```

---

## Best Practices

1. **Subscribe on Connect:** Always resubscribe to channels after reconnection
2. **Handle Errors:** Implement error handling and fallback mechanisms
3. **Reconnection:** Use exponential backoff for reconnection attempts
4. **Message Validation:** Validate message structure before processing
5. **Unsubscribe on Disconnect:** Clean up subscriptions when disconnecting
6. **Heartbeat:** Implement client-side heartbeat to detect stale connections

---

## Example: Complete Integration

```javascript
class AccessControlWebSocket {
  constructor(url, token) {
    this.url = url;
    this.token = token;
    this.ws = null;
    this.reconnectInterval = 5000;
    this.channels = new Set();
    this.handlers = new Map();
  }
  
  connect() {
    this.ws = new WebSocket(`${this.url}?token=${this.token}`);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectInterval = 5000;
      // Resubscribe to all channels
      this.channels.forEach(channel => this.subscribe(channel));
    };
    
    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...');
      setTimeout(() => this.connect(), this.reconnectInterval);
      this.reconnectInterval = Math.min(this.reconnectInterval * 2, 30000);
    };
  }
  
  subscribe(channel) {
    this.channels.add(channel);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        channel: channel
      }));
    }
  }
  
  unsubscribe(channel) {
    this.channels.delete(channel);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        channel: channel
      }));
    }
  }
  
  on(channel, handler) {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, []);
    }
    this.handlers.get(channel).push(handler);
  }
  
  handleMessage(message) {
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message.data));
    }
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Usage
const ws = new AccessControlWebSocket('ws://localhost:8000/ws', token);

ws.on('access-control.event.created', (data) => {
  console.log('New event:', data);
  // Update UI
});

ws.on('access-control.emergency.activated', (data) => {
  console.log('Emergency activated:', data.mode);
  // Show emergency alert
});

ws.subscribe('access-control.event.created');
ws.subscribe('access-control.emergency.activated');
ws.connect();
```

---

**For API documentation, see:** [API Documentation](./API_DOCUMENTATION.md)  
**For integration guides, see:** [Integration Guides](./INTEGRATION_GUIDES.md)  
**For module overview, see:** [README](./README.md)
