# Hotel Camera Onboarding Checklist

Use this when selling or deploying PROPER 2.9 to a hotel that already has cameras. It lists **what information to get from the hotel** and **how it maps to system configuration**.

---

## 1. Information to Collect From the Hotel

### 1.1 Overall Setup

| What to ask | Why you need it |
|-------------|------------------|
| **Do they use an NVR/VMS?** (e.g. Hikvision NVR, Milestone, Genetec, Hanwha, Axis Camera Station, etc.) | If yes, streams are often exposed *through* the NVR (one URL per channel). If no, you connect directly to each camera IP. |
| **How many cameras?** | For planning: add each as a camera in Security Operations Center. |
| **Same network as the server?** (Will PROPER run on a PC/server that can reach camera IPs or the NVR?) | The server must be able to reach stream URLs. If cameras are on a separate VLAN, you need routing/firewall rules or a gateway. |
| **Who has the camera/NVR admin password?** | You need credentials to build stream URLs and, if required, to create a low-privilege user for PROPER. |

### 1.2 Per Camera (or Per NVR Channel)

For **each camera** (or each channel if they have an NVR), get:

| Info | Example | Used in PROPER as |
|------|--------|--------------------|
| **Display name** | "Lobby Main", "Parking North" | Camera **name** |
| **Location** | "Lobby", "Building A / Floor 2" | Camera **location** (string or area/floor/building) |
| **IP address** (or hostname) | `192.168.1.101` or `nvr.hotel.local` | **ip_address** |
| **Stream URL** | See section 2 below | **stream_url** / **source_stream_url** |
| **Stream credentials** (if any) | Username + password | **credentials** (stored securely; not shown in UI) |
| **PTZ?** (pan/tilt/zoom) | Yes/No | Enables PTZ controls in Live View (backend sends commands; ONVIF/RTSP support may be needed for your setup) |

### 1.3 Stream URL Details (Critical)

You need the **exact URL** the system will use to pull the video. Ask the hotel or their installer:

| Question | Notes |
|----------|--------|
| **What protocol does each camera/NVR expose?** | **RTSP** is very common (e.g. `rtsp://192.168.1.101:554/stream1`). Some expose **HTTP/HTTPS** or **HLS** (`.m3u8`) directly. |
| **Full stream path per camera** | e.g. RTSP path like `/Streaming/Channels/101`, or HTTP path like `/live/channel1.m3u8`. Often found in NVR/camera web UI under "Live view" or "Streaming". |
| **Port** | RTSP often 554, 8554; HTTP varies. |
| **Substream vs main stream** | Many cameras have a "main" (high res) and "sub" (low res). For multiple viewers, substream often works better. Get both paths if possible; you can start with substream. |
| **Authentication** | None, Basic (username:password in URL or header), or Digest. PROPER stores credentials in the camera record and the HLS gateway uses them when converting RTSP → HLS. |

### 1.4 Network and Server

| Info | Why |
|------|-----|
| **Where will PROPER run?** (Same building? Same subnet as cameras/NVR?) | The machine that runs the PROPER backend (or the HLS gateway) must be able to open a connection to each camera/NVR stream URL. |
| **Firewall rules** | If PROPER server is in a different VLAN, firewall must allow it to reach camera/NVR IPs on the stream port (e.g. 554 for RTSP). |
| **Can you get a static IP or hostname for each camera/NVR?** | Prefer static so stream URLs don’t break after DHCP renewal. |

---

## 2. How Stream URLs Are Used (So You Can Ask for the Right Thing)

- **RTSP** (e.g. `rtsp://192.168.1.101:554/Streaming/Channels/101`):  
  Browsers don’t play RTSP. PROPER uses an **HLS gateway** (e.g. `HLS_GATEWAY_BASE_URL`) that converts RTSP → HLS. You configure the camera with this **RTSP URL**; the backend stores it as the “source” stream and gives the frontend an HLS URL (e.g. `http://gateway:9000/hls/{camera_id}/index.m3u8`). So you need:
  - The **exact RTSP URL** (with path) for each camera.
  - The **HLS gateway** running and reachable by the frontend (see section 4).

- **HTTP/HTTPS/HLS** (e.g. `http://nvr.hotel.local/live/cam1.m3u8`):  
  If the NVR or camera already exposes HLS or browser‑friendly HTTP, you can enter that URL directly. The backend may still proxy or sanitize it. No RTSP→HLS conversion needed for that camera.

- **Credentials**:  
  Stored in the camera’s `credentials` field (e.g. `{"username":"viewer","password":"..."}`). The gateway or backend uses them when connecting to RTSP/HTTP. Don’t put passwords in the URL in docs; use the credentials field.

---

## 3. Mapping Hotel Info → PROPER Configuration

For **each camera**, in **Security Operations Center → Provisioning (Add Camera)** (or via API), you set:

| Hotel gave you | PROPER field | Example |
|----------------|--------------|---------|
| Display name | **Name** | Lobby Main |
| Location text or area/floor | **Location** | Lobby |
| Camera/NVR IP or hostname | **IP address** | 192.168.1.101 |
| Full stream URL (RTSP or HTTP/HLS) | **Stream URL** | rtsp://192.168.1.101:554/Streaming/Channels/101 |
| Username/password for stream | **Credentials** | { "username": "viewer", "password": "***" } (in API/DB; UI may have a credentials option) |

If the hotel has an **NVR with many channels**, you still add **one camera per channel** in PROPER; each has its own stream URL (e.g. one RTSP URL per channel from the NVR).

---

## 4. What You Must Have on the Server / Network

1. **Reachability**  
   The PROPER backend (and HLS gateway if you use RTSP) must be able to open a connection to every camera/NVR stream URL (same subnet, or routed/firewall‑allowed).

2. **HLS gateway (for RTSP cameras)**  
   The app expects RTSP to be converted to HLS. Set **`HLS_GATEWAY_BASE_URL`** to the base URL of your HLS gateway (e.g. `http://localhost:9000` or `http://hls-gateway.hotel.local:9000`). The gateway must:
   - Accept requests for a stream by some ID (e.g. camera_id).
   - Pull from the camera’s RTSP URL (with credentials if needed) and serve HLS (e.g. `/hls/{camera_id}/index.m3u8`).  
   So you need either:
   - An existing product that does RTSP→HLS and that you can map camera_id → RTSP URL + credentials, or  
   - A small service that does this (e.g. based on rtsp-simple-proxy, or a custom bridge that reads camera list from DB or config).

3. **Credentials**  
   Stored in the camera record; ensure your deployment keeps the DB and config secure so credentials aren’t exposed.

---

## 5. Quick Reference: Minimum Per Camera

To add a camera you need at least:

- **Name** (e.g. "Lobby Main")
- **Location** (e.g. "Lobby")
- **IP address** (camera or NVR)
- **Stream URL** (full: `rtsp://ip:port/path` or `http(s)://.../path.m3u8`)
- **Credentials** (if the stream requires login)

Optional: PTZ (if the camera supports it and your backend/gateway can send PTZ commands).

---

## 6. One-Page Handout for the Hotel (or Their IT / Installer)

You can give them this:

**“To integrate your existing cameras with PROPER 2.9 we need, for each camera (or each NVR channel):**

1. **A friendly name** (e.g. Lobby Main, Parking North).  
2. **Location** (e.g. Lobby, Floor 2 Corridor).  
3. **The exact video stream URL**  
   - For **RTSP**: full URL, e.g. `rtsp://IP:554/path` (we’ll need the path from your NVR/camera manual or web interface).  
   - For **HTTP/HLS**: the URL that opens the live stream in a browser or VMS.  
4. **Login for the stream** (username + password), if the stream is protected.  
5. **Whether the server running PROPER can reach the camera/NVR** on the same network or via allowed firewall rules.  

**We do not need to install any software on your cameras or NVR; we only need network access to the stream URLs and, if applicable, the HLS conversion service we deploy.”**

---

Using this checklist, you can gather everything needed to hardwire the hotel’s current cameras into PROPER with minimal back-and-forth.
