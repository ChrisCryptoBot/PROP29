# Camera Integration Technical Requirements

## 1. Backend Architecture
The backend must be extended to support persistent camera management and real-time status tracking.

### Data Models & Schemas
- **Camera Model**:
    *   `camera_id` (UUID)
    *   `name` (string)
    *   `location` (string/JSON for spatial data)
    *   `ip_address` (string)
    *   `stream_url` (string) - MUST be browser-compatible (HLS/Dash/WebRTC) or proxied.
    *   `credentials` (JSON/Encrypted) - For accessing the hardware.
    *   `status` (Enum: online, offline, maintenance)
    *   `hardware_status` (JSON) - CPU, storage, signal strength.
    *   `is_recording` (boolean)
    *   `motion_detection_enabled` (boolean)
- **CameraService**: Implement CRUD and health-check logic.
- **Endpoints**: `/api/security-operations/cameras` (CRUD), `/api/security-operations/metrics` (Aggregated stats).

---

## 2. Frontend Integration
### UI Components
- **Camera Manager**: New interface (Tab or Modal) to provision cameras.
- **Video Player**: Replace static thumbnails with a real player (e.g., `video.js` or `react-player`) supporting the chosen protocol.

### State Management
- **Polling/WebSockets**: Update `useSecurityOperationsState` to listen for status changes in real-time.
- **Optimistic Updates**: Ensure recording transitions feel instantaneous in the UI.

---

## 3. Critical Edge Cases to Address
- **Streaming Protocol mismatch**: Browsers don't support RTSP. Implementation must plan for a transcoding gateway (FFmpeg/GStreamer) or a WebRTC proxy.
- **Credential Masking**: `stream_url` often contains passwords. The backend must proxy the stream or provide temporary, authenticated tokens to the frontend.
- **Network Congestion**: Multiple concurrent 4K streams can saturate local property networks. Adaptive bitrate streaming is a requirement.
- **Health Check Frequency**: Polling hardware every second is expensive. Use a tiered approach (ping every 30s, check metrics every 5 mins).
- **Offline Fallback**: When a camera is offline, display the "Last Known Image" instead of a black screen to provide situational context.

---

## 4. Verification Plan
- **Mock Stream Test**: Use a public HLS stream to verify the frontend player logic before hardware is arrived.
- **Credential Leak Audit**: Check that raw hardware credentials never appear in the browser's Network tab or Redux/Context state.
- **RBAC Check**: Verify that "Viewer" roles cannot access the "Manage Cameras" (CRUD) endpoints.
