# Access Control Integration Guides
**Version:** 2.9  
**Last Updated:** January 26, 2026

---

## Table of Contents

1. [Lockdown vs Access Control Emergency](#lockdown-vs-access-control-emergency)
2. [Mobile Agent Integration](#mobile-agent-integration)
3. [Hardware Device Integration](#hardware-device-integration)
4. [External Data Sources](#external-data-sources)
5. [Troubleshooting](#troubleshooting)

---

## Lockdown vs Access Control Emergency

Two separate systems control locking behavior:

- **Access Control Emergency (Overview tab)** — Uses `/access-control/emergency/*` (lockdown, unlock, restore). Affects **access points only** (lock/unlock doors managed by this module). Use for access-point-level emergency control.
- **Lockdown Facility (Lockdown Facility tab)** — Uses `/lockdown/*` (status, hardware, history, initiate, cancel, test). Facility-wide lockdown state and hardware; separate from access-control emergency. Use for building-wide or zone-wide lockdown when integrated with hardware.

---

## Mobile Agent Integration

### Overview

Mobile agent applications can submit access events that require manager review. Events are created with `review_status='pending'` and appear in the Events tab for approval/rejection.

### Prerequisites

- JWT authentication token
- Agent ID and Device ID
- API base URL

### Setup

1. **Obtain Authentication Token**
   ```typescript
   // Login to get JWT token
   const response = await fetch('/api/auth/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       username: 'agent@example.com',
       password: 'securepassword'
     })
   });
   const { access_token } = await response.json();
   ```

2. **Store Token Securely**
   ```typescript
   // Store in secure storage (not localStorage for production)
   localStorage.setItem('access_token', access_token);
   ```

### Submitting Events

#### Basic Event Submission

```typescript
async function submitAccessEvent(eventData: {
  property_id: string;
  access_point: string;
  user_id?: string;
  access_method: string;
  event_type: string;
  timestamp: string;
  location: { lat: number; lng: number };
  is_authorized: boolean;
  description?: string;
}) {
  const token = localStorage.getItem('access_token');
  const idempotency_key = crypto.randomUUID(); // Generate unique ID
  
  const response = await fetch('/api/access-control/events/agent', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...eventData,
      source_agent_id: 'agent-123', // Your agent ID
      source_device_id: 'mobile-device-001', // Your device ID
      source_metadata: {
        app_version: '1.0.0',
        gps_accuracy: 5.2,
        battery_level: 85
      },
      idempotency_key: idempotency_key
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to submit event');
  }
  
  return await response.json();
}
```

#### Idempotency Best Practices

**Always include `idempotency_key`** to prevent duplicate submissions:

```typescript
// Generate idempotency key from event data
function generateIdempotencyKey(eventData: {
  access_point: string;
  user_id: string;
  timestamp: string;
}): string {
  const data = `${eventData.access_point}-${eventData.user_id}-${eventData.timestamp}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Or use UUID
const idempotency_key = crypto.randomUUID();
```

**Handle Duplicate Responses:**
```typescript
const result = await submitAccessEvent(eventData);

if (result.duplicate) {
  console.log('Event already submitted:', result.data);
  // Use existing event data
} else {
  console.log('New event created:', result.data);
}
```

### Offline Support

#### Queue Events When Offline

```typescript
class EventQueue {
  private queue: Array<{ event: any; idempotency_key: string }> = [];
  
  async submitEvent(eventData: any) {
    const idempotency_key = crypto.randomUUID();
    const event = { ...eventData, idempotency_key };
    
    if (navigator.onLine) {
      try {
        return await this.sendEvent(event);
      } catch (error) {
        // Network error - queue for retry
        this.queue.push({ event, idempotency_key });
        this.saveQueue();
        throw error;
      }
    } else {
      // Offline - queue immediately
      this.queue.push({ event, idempotency_key });
      this.saveQueue();
    }
  }
  
  async flushQueue() {
    if (!navigator.onLine) return;
    
    const failed: typeof this.queue = [];
    
    for (const { event } of this.queue) {
      try {
        await this.sendEvent(event);
      } catch (error) {
        failed.push({ event, idempotency_key: event.idempotency_key });
      }
    }
    
    this.queue = failed;
    this.saveQueue();
  }
  
  private async sendEvent(event: any) {
    const token = localStorage.getItem('access_token');
    const response = await fetch('/api/access-control/events/agent', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  }
  
  private saveQueue() {
    localStorage.setItem('event_queue', JSON.stringify(this.queue));
  }
  
  loadQueue() {
    const stored = localStorage.getItem('event_queue');
    if (stored) {
      this.queue = JSON.parse(stored);
    }
  }
}

// Usage
const eventQueue = new EventQueue();
eventQueue.loadQueue();

// Listen for online event
window.addEventListener('online', () => {
  eventQueue.flushQueue();
});

// Submit event (handles offline automatically)
await eventQueue.submitEvent(eventData);
```

### Error Handling

```typescript
async function submitEventWithRetry(eventData: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await submitAccessEvent(eventData);
    } catch (error) {
      if (attempt === maxRetries) {
        throw error; // Final attempt failed
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### Complete Example

```typescript
import { EventQueue } from './EventQueue';

class MobileAgentClient {
  private eventQueue: EventQueue;
  private agentId: string;
  private deviceId: string;
  
  constructor(agentId: string, deviceId: string) {
    this.agentId = agentId;
    this.deviceId = deviceId;
    this.eventQueue = new EventQueue();
    this.setupOfflineHandling();
  }
  
  async recordAccessAttempt(params: {
    property_id: string;
    access_point: string;
    user_id?: string;
    location: { lat: number; lng: number };
    is_authorized: boolean;
    access_method: 'mobile' | 'card' | 'biometric';
  }) {
    const event = {
      property_id: params.property_id,
      access_point: params.access_point,
      user_id: params.user_id,
      access_method: params.access_method,
      event_type: 'access_attempt',
      timestamp: new Date().toISOString(),
      location: params.location,
      is_authorized: params.is_authorized,
      source_agent_id: this.agentId,
      source_device_id: this.deviceId,
      source_metadata: {
        app_version: '1.0.0',
        gps_accuracy: await this.getGPSAccuracy(),
        battery_level: await this.getBatteryLevel()
      },
      description: `Access ${params.is_authorized ? 'granted' : 'denied'} via mobile app`
    };
    
    return await this.eventQueue.submitEvent(event);
  }
  
  private setupOfflineHandling() {
    window.addEventListener('online', () => {
      this.eventQueue.flushQueue();
    });
    
    // Periodic flush attempt
    setInterval(() => {
      this.eventQueue.flushQueue();
    }, 60000); // Every minute
  }
  
  private async getGPSAccuracy(): Promise<number> {
    // Get GPS accuracy from device
    return 5.0; // Example
  }
  
  private async getBatteryLevel(): Promise<number> {
    // Get battery level from device
    return 85; // Example
  }
}

// Usage
const client = new MobileAgentClient('agent-123', 'mobile-device-001');

await client.recordAccessAttempt({
  property_id: 'prop-123',
  access_point: 'main-entrance',
  user_id: 'user-456',
  location: { lat: 40.7128, lng: -74.0060 },
  is_authorized: true,
  access_method: 'mobile'
});
```

---

## Hardware Device Integration

### Overview

Hardware devices (door controllers, access readers, etc.) can register automatically (Plug & Play) and send heartbeat signals to maintain connection status.

### Prerequisites

- Hardware device with network connectivity
- X-API-Key for authentication
- Device ID (unique identifier)

### Setup

1. **Obtain Hardware API Key**
   ```bash
   # Set in environment or device configuration
   export HARDWARE_INGEST_KEY="your-secure-api-key-here"
   ```

2. **Device Registration (First Boot)**

```python
import requests
import time
import uuid

class HardwareDevice:
    def __init__(self, device_id: str, api_key: str, base_url: str):
        self.device_id = device_id
        self.api_key = api_key
        self.base_url = base_url
        self.point_id = None
        
    def register(self, device_info: dict):
        """Register device on first boot"""
        url = f"{self.base_url}/api/access-control/points/register"
        headers = {
            "X-API-Key": self.api_key,
            "Content-Type": "application/json"
        }
        
        payload = {
            "device_id": self.device_id,
            "device_type": device_info.get("type", "door"),
            "firmware_version": device_info.get("firmware_version", "1.0.0"),
            "hardware_vendor": device_info.get("vendor", "Unknown"),
            "mac_address": device_info.get("mac_address"),
            "ip_address": device_info.get("ip_address"),
            "location": device_info.get("location", "Unknown"),
            "capabilities": device_info.get("capabilities", [])
        }
        
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        self.point_id = data["data"]["id"]
        print(f"Device registered as access point: {self.point_id}")
        return data
    
    def send_heartbeat(self):
        """Send heartbeat every 60 seconds"""
        if not self.point_id:
            raise ValueError("Device not registered. Call register() first.")
        
        url = f"{self.base_url}/api/access-control/points/{self.point_id}/heartbeat"
        headers = {
            "X-API-Key": self.api_key,
            "Content-Type": "application/json"
        }
        
        payload = {
            "device_id": self.device_id,
            "firmware_version": self.get_firmware_version(),
            "battery_level": self.get_battery_level(),
            "sensor_status": self.get_sensor_status()
        }
        
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    
    def start_heartbeat_loop(self, interval=60):
        """Start continuous heartbeat loop"""
        while True:
            try:
                self.send_heartbeat()
                time.sleep(interval)
            except Exception as e:
                print(f"Heartbeat error: {e}")
                time.sleep(interval)  # Retry after interval
    
    def get_firmware_version(self) -> str:
        """Get device firmware version"""
        return "2.1.0"  # Implement device-specific logic
    
    def get_battery_level(self) -> int:
        """Get battery level (0-100)"""
        return 85  # Implement device-specific logic
    
    def get_sensor_status(self) -> str:
        """Get sensor status (closed, open, forced, held-open)"""
        return "closed"  # Implement device-specific logic

# Usage
device = HardwareDevice(
    device_id="AC-DEV-001",
    api_key=os.getenv("HARDWARE_INGEST_KEY"),
    base_url="http://api.example.com"
)

# Register on first boot
device.register({
    "type": "door",
    "firmware_version": "2.1.0",
    "vendor": "SecureAccess Inc",
    "mac_address": "00:11:22:33:44:55",
    "ip_address": "192.168.1.100",
    "location": "Main Entrance - Building A",
    "capabilities": ["card", "biometric", "pin"]
})

# Start heartbeat loop
device.start_heartbeat_loop()
```

### Node.js Example

```javascript
const axios = require('axios');
const os = require('os');

class HardwareDevice {
  constructor(deviceId, apiKey, baseUrl) {
    this.deviceId = deviceId;
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.pointId = null;
  }
  
  async register(deviceInfo) {
    const response = await axios.post(
      `${this.baseUrl}/api/access-control/points/register`,
      {
        device_id: this.deviceId,
        device_type: deviceInfo.type || 'door',
        firmware_version: deviceInfo.firmwareVersion || '1.0.0',
        hardware_vendor: deviceInfo.vendor || 'Unknown',
        mac_address: deviceInfo.macAddress || this.getMacAddress(),
        ip_address: deviceInfo.ipAddress || this.getIpAddress(),
        location: deviceInfo.location || 'Unknown',
        capabilities: deviceInfo.capabilities || []
      },
      {
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    this.pointId = response.data.data.id;
    console.log(`Device registered as access point: ${this.pointId}`);
    return response.data;
  }
  
  async sendHeartbeat() {
    if (!this.pointId) {
      throw new Error('Device not registered. Call register() first.');
    }
    
    const response = await axios.post(
      `${this.baseUrl}/api/access-control/points/${this.pointId}/heartbeat`,
      {
        device_id: this.deviceId,
        firmware_version: this.getFirmwareVersion(),
        battery_level: this.getBatteryLevel(),
        sensor_status: this.getSensorStatus()
      },
      {
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  }
  
  startHeartbeatLoop(interval = 60000) {
    setInterval(async () => {
      try {
        await this.sendHeartbeat();
      } catch (error) {
        console.error('Heartbeat error:', error.message);
      }
    }, interval);
  }
  
  getFirmwareVersion() {
    return '2.1.0'; // Implement device-specific logic
  }
  
  getBatteryLevel() {
    return 85; // Implement device-specific logic
  }
  
  getSensorStatus() {
    return 'closed'; // Implement device-specific logic
  }
  
  getMacAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (!iface.internal && iface.mac !== '00:00:00:00:00:00') {
          return iface.mac;
        }
      }
    }
    return '00:00:00:00:00:00';
  }
  
  getIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (!iface.internal && iface.family === 'IPv4') {
          return iface.address;
        }
      }
    }
    return '127.0.0.1';
  }
}

// Usage
const device = new HardwareDevice(
  'AC-DEV-001',
  process.env.HARDWARE_INGEST_KEY,
  'http://api.example.com'
);

// Register on first boot
await device.register({
  type: 'door',
  firmwareVersion: '2.1.0',
  vendor: 'SecureAccess Inc',
  location: 'Main Entrance - Building A',
  capabilities: ['card', 'biometric', 'pin']
});

// Start heartbeat loop
device.startHeartbeatLoop();
```

### Offline Detection

Devices are automatically marked offline if no heartbeat is received for **15 minutes**. The system will:

1. Mark device as `isOnline: false`
2. Broadcast WebSocket event: `access-control.point.offline`
3. Update UI to show offline status

**Safe state:** When a device is offline, the UI shows last known state and **disables access point control** (e.g. toggle enable/disable). Reconnection updates status via WebSocket/heartbeat.

**To change threshold:** Configure `heartbeatOfflineThresholdMinutes` in frontend settings (default: 15 minutes).

### Error Handling & Retry

```python
import time
from functools import wraps

def retry_with_backoff(max_retries=5, base_delay=1):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise
                    delay = min(base_delay * (2 ** attempt), 30)
                    time.sleep(delay)
            return None
        return wrapper
    return decorator

class HardwareDevice:
    @retry_with_backoff(max_retries=5)
    def send_heartbeat(self):
        # Implementation with automatic retry
        pass
```

---

## External Data Sources

### WebSocket Integration

For real-time updates from external systems:

```javascript
const ws = new WebSocket('ws://api.example.com/ws?token=' + token);

ws.onopen = () => {
  // Subscribe to access control channels
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'access-control.event.created'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'access-control.event.created') {
    // Handle new event
    console.log('New event:', message.data);
  }
};
```

See [WebSocket Documentation](./WEBSOCKET_DOCUMENTATION.md) for complete details.

### API Integration

For batch data imports or scheduled syncs:

```python
import requests

def sync_access_events(events: list):
    """Sync cached events from external system"""
    url = "http://api.example.com/api/access-control/events/sync"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    for event_batch in chunk_events(events, 100):
        payload = {
            "access_point_id": event_batch[0]["access_point_id"],
            "events": event_batch
        }
        
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
```

---

## Troubleshooting

### Common Issues

#### 1. "Authentication required" Error

**Problem:** Missing or invalid authentication token.

**Solution:**
- Verify token is included in request headers
- Check token expiration
- Re-authenticate if token expired

```typescript
// Check token validity
const token = localStorage.getItem('access_token');
if (!token) {
  // Re-authenticate
  await login();
}
```

#### 2. "Invalid hardware ingest key" Error

**Problem:** X-API-Key is missing or incorrect.

**Solution:**
- Verify `HARDWARE_INGEST_KEY` environment variable is set
- Check key matches server configuration
- Ensure key is included in `X-API-Key` header

#### 3. Device Not Appearing Online

**Problem:** Device registered but showing as offline.

**Solution:**
- Verify heartbeat is being sent every 60 seconds
- Check network connectivity
- Verify heartbeat endpoint is accessible
- Check heartbeat threshold (default: 15 minutes)

```python
# Debug heartbeat
device.send_heartbeat()
# Check response
response = device.send_heartbeat()
print(f"Last heartbeat: {response['data']['last_heartbeat']}")
```

#### 4. Duplicate Event Submissions

**Problem:** Same event submitted multiple times.

**Solution:**
- Always include `idempotency_key` in requests
- Use same key for retry attempts
- Check response for `duplicate: true` flag

```typescript
// Use consistent idempotency key
const idempotency_key = generateIdempotencyKey(eventData);

// Retry with same key
const result = await submitEvent({ ...eventData, idempotency_key });
if (result.duplicate) {
  console.log('Event already exists');
}
```

#### 5. Events Not Appearing in UI

**Problem:** Events submitted but not visible.

**Solution:**
- Check `review_status` - agent events require approval
- Verify WebSocket connection is active
- Check event filters in UI
- Verify source filter includes your source type

#### 6. Network Timeout Errors

**Problem:** Requests timing out.

**Solution:**
- Implement retry logic with exponential backoff
- Queue events when offline
- Increase timeout values if needed
- Check network connectivity

### Debug Mode

Enable debug logging:

```typescript
// Frontend
localStorage.setItem('debug', 'access-control:*');

// Backend (Python)
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Support

For additional support:
- Check API documentation: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- Check WebSocket documentation: [WEBSOCKET_DOCUMENTATION.md](./WEBSOCKET_DOCUMENTATION.md)
- Review error logs in browser console (F12)
- Check backend logs for detailed error messages

---

**For API reference, see:** [API Documentation](./API_DOCUMENTATION.md)  
**For WebSocket reference, see:** [WebSocket Documentation](./WEBSOCKET_DOCUMENTATION.md)  
**For module overview, see:** [README](./README.md)
