# PROPER 2.9 CYBERSECURITY HUB - IT INTEGRATION GUIDE

**Version:** 2.9  
**Last Updated:** October 2025  
**Estimated Setup Time:** 2-4 hours  
**Difficulty Level:** Intermediate  

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Network Requirements](#network-requirements)
4. [Supported Equipment](#supported-equipment)
5. [Installation Steps](#installation-steps)
6. [Configuration](#configuration)
7. [Testing & Verification](#testing--verification)
8. [Troubleshooting](#troubleshooting)
9. [Support](#support)

---

## 🎯 OVERVIEW

The PROPER 2.9 Cybersecurity Hub provides real-time network security monitoring and threat detection for your hotel. This guide will help you integrate it with your existing network infrastructure.

### What This System Does:
- ✅ Monitors network traffic for threats
- ✅ Detects malware, phishing, DDoS attacks
- ✅ Tracks security incidents
- ✅ Provides real-time alerts
- ✅ Integrates with existing firewalls/SIEM

### What You'll Be Installing:
- A monitoring agent (small VM or dedicated PC)
- API connections to your firewall
- Optional: Integration with existing SIEM/IDS

**NO CODE CHANGES REQUIRED** - Everything is configuration-driven!

---

## ✅ PREREQUISITES

### Before You Start, Make Sure You Have:

#### **Network Access:**
- [ ] Admin access to network switches
- [ ] Firewall admin credentials
- [ ] Ability to configure SPAN/mirror port
- [ ] VPN or secure tunnel capability (for cloud connection)

#### **Hardware (Choose One):**
- [ ] **Option A:** Spare server/workstation (8GB RAM, 100GB storage)
- [ ] **Option B:** Virtual machine (VMware/Hyper-V/Proxmox)
- [ ] **Option C:** Small form factor PC (Intel NUC or similar)

#### **Software Licenses:**
- [ ] Your hotel's PROPER 2.9 license key (provided by vendor)
- [ ] Firewall API access (if applicable)
- [ ] SIEM credentials (if you have existing SIEM)

#### **Information to Gather:**
- [ ] Hotel name and location
- [ ] Network IP range (e.g., 192.168.0.0/24)
- [ ] Firewall brand and model
- [ ] Firewall management IP address
- [ ] Guest WiFi SSID
- [ ] Staff network subnet
- [ ] Emergency contact email/phone

---

## 🌐 NETWORK REQUIREMENTS

### Minimum Requirements:

| Component | Requirement |
|-----------|-------------|
| **Internet Speed** | 10 Mbps upload (for cloud sync) |
| **Local Network** | 1 Gbps switch recommended |
| **Monitoring Port** | SPAN/mirror port on core switch |
| **Firewall** | API access or syslog forwarding |
| **Protocols** | HTTPS (443), SSH (22), Syslog (514) |

### Network Diagram:
```
Internet
    │
    ├─── Firewall (existing) ──┐
    │                          │
    ├─── Core Switch           │
    │      │                   │
    │      ├─ SPAN Port ───> Monitoring Agent
    │      │                   │
    │      ├─ Guest WiFi       │
    │      ├─ Staff Network    │
    │      └─ IoT Devices      │
    │                          │
    └──────────────────────────┴──> PROPER 2.9 Cloud
```

### Ports to Open (Cloud Connection):

| Port | Protocol | Purpose | Direction |
|------|----------|---------|-----------|
| 443 | HTTPS | API Communication | Outbound |
| 8883 | MQTT/TLS | Real-time alerts | Outbound |
| 22 | SSH | Remote management | Inbound (optional) |

---

## 🔧 SUPPORTED EQUIPMENT

### Firewalls (API Integration):
✅ **Cisco**
- Cisco ASA 5500/5500-X Series
- Cisco Firepower
- API: REST API v1.0+

✅ **Palo Alto Networks**
- PA-Series (all models)
- API: PAN-OS REST API 9.0+

✅ **Fortinet**
- FortiGate (all models)
- API: FortiOS REST API 6.0+

✅ **Check Point**
- Security Gateway R77+
- API: Check Point Management API

✅ **SonicWall**
- TZ/NSA Series
- API: SonicOS API 6.5+

✅ **pfSense / OPNsense**
- Open-source firewalls
- API: REST API

✅ **Generic (Syslog Only)**
- Any firewall with syslog support
- Limited features

### SIEM Systems (Optional Integration):
✅ Splunk (6.0+)
✅ IBM QRadar (7.3+)
✅ ELK Stack (Elasticsearch/Logstash/Kibana)
✅ Azure Sentinel
✅ LogRhythm
✅ AlienVault OSSIM

### IDS/IPS (Optional):
✅ Snort
✅ Suricata
✅ Zeek (formerly Bro)

---

## 📦 INSTALLATION STEPS

### Step 1: Prepare Monitoring Server

#### Option A: Physical Server/PC
1. Install Ubuntu Server 22.04 LTS or CentOS 8+
2. Update system:
   ```bash
   sudo apt update && sudo apt upgrade -y
   # OR for CentOS:
   sudo yum update -y
   ```

#### Option B: Virtual Machine
1. Create VM with these specs:
   - **CPU:** 4 cores
   - **RAM:** 8 GB
   - **Storage:** 100 GB
   - **Network:** Bridged mode
2. Install Ubuntu Server 22.04 LTS

### Step 2: Download Installation Package

Contact PROPER 2.9 support for your hotel-specific installation package, or download from the provided link:

```bash
# Example download (link provided by vendor):
wget https://downloads.proper29.com/security-agent-v2.9.tar.gz
tar -xzf security-agent-v2.9.tar.gz
cd proper29-security-agent
```

### Step 3: Run Interactive Installation

```bash
sudo ./install.sh
```

The installer will ask you:

1. **Hotel Information:**
   - Hotel name: `[Your Hotel Name]`
   - Location: `[City, State]`
   - License key: `[Provided by PROPER 2.9]`

2. **Network Configuration:**
   - IP range to monitor: `192.168.0.0/16`
   - Guest WiFi SSID: `GuestWiFi`
   - Staff network: `192.168.10.0/24`

3. **Firewall Integration:**
   - Firewall brand: `[Cisco/Palo Alto/Fortinet/etc.]`
   - Management IP: `10.0.1.1`
   - API username: `admin`
   - API password: `[your firewall admin password]`

4. **Cloud Connection:**
   - SaaS URL: `https://api.proper29.com`
   - Hotel API key: `[Provided by PROPER 2.9]`

5. **Alert Settings:**
   - Email: `security@yourhotel.com`
   - SMS (optional): `+1-555-0100`

### Step 4: Configure Network SPAN Port

**On Your Core Network Switch:**

#### Cisco Switch Example:
```cisco
configure terminal
monitor session 1 source interface GigabitEthernet1/0/1 - 24
monitor session 1 destination interface GigabitEthernet1/0/48
end
write memory
```

#### Generic Steps:
1. Identify your uplink port (usually port 1)
2. Identify all ports to monitor (guest WiFi, staff network)
3. Designate one port for the monitoring agent
4. Configure port mirroring/SPAN to send all traffic to monitoring port
5. Connect monitoring agent to that port

### Step 5: Test Connectivity

```bash
# Test connection to PROPER 2.9 cloud:
sudo proper29-agent test-connection

# Test firewall API access:
sudo proper29-agent test-firewall

# View status:
sudo proper29-agent status
```

Expected output:
```
✅ Cloud connection: OK
✅ Firewall API: Connected (Cisco ASA)
✅ Network monitoring: Active
✅ Threat detection: Running
⚠️  SIEM integration: Not configured (optional)
```

---

## ⚙️ CONFIGURATION

### Configuration File Location:
```
/etc/proper29/config.yaml
```

### Basic Configuration Template:

```yaml
# /etc/proper29/config.yaml

hotel:
  name: "Downtown Chicago Hotel"
  location: "Chicago, IL"
  timezone: "America/Chicago"
  license_key: "YOUR-LICENSE-KEY-HERE"

network:
  monitoring_interface: "eth1"  # SPAN port interface
  ip_range: "192.168.0.0/16"
  guest_wifi:
    ssid: "GuestWiFi"
    vlan: 100
  staff_network: "192.168.10.0/24"

firewall:
  enabled: true
  type: "cisco_asa"  # Options: cisco_asa, palo_alto, fortinet, checkpoint, sonicwall, generic
  host: "10.0.1.1"
  port: 443
  username: "api_user"
  password: "ENCRYPTED_PASSWORD"
  ssl_verify: true

cloud:
  api_url: "https://api.proper29.com"
  hotel_id: "chicago-downtown-001"
  api_key: "YOUR-API-KEY-HERE"
  sync_interval: 30  # seconds
  
monitoring:
  threat_detection: true
  network_analysis: true
  anomaly_detection: true
  
  # What to monitor:
  protocols:
    - "HTTP"
    - "HTTPS"
    - "SSH"
    - "FTP"
    - "SMTP"
    - "DNS"
  
  # Sensitivity (low/medium/high):
  sensitivity: "high"
  
  # Auto-block threats:
  auto_block:
    enabled: false  # Recommend false until tested
    severity: "critical"  # Only auto-block critical threats

alerts:
  email:
    enabled: true
    smtp_server: "smtp.gmail.com"
    smtp_port: 587
    username: "alerts@yourhotel.com"
    password: "ENCRYPTED_PASSWORD"
    recipients:
      - "security@yourhotel.com"
      - "it@yourhotel.com"
  
  sms:
    enabled: false  # Optional
    provider: "twilio"
    phone_numbers:
      - "+1-555-0100"
  
  slack:
    enabled: false  # Optional
    webhook_url: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
  
  # Alert thresholds:
  severity_filter: "medium"  # Alerts for medium severity and above

security:
  ip_whitelist:
    - "192.168.1.0/24"  # Management network
    - "10.0.0.0/8"      # Corporate VPN
  
  geo_blocking:
    enabled: false
    blocked_countries: []
  
  rate_limiting:
    enabled: true
    max_connections_per_ip: 100
    time_window: 60  # seconds

logging:
  level: "INFO"  # DEBUG, INFO, WARNING, ERROR
  retention_days: 90
  syslog:
    enabled: false
    server: "syslog.yourhotel.com"
    port: 514

# Optional SIEM Integration:
siem:
  enabled: false
  type: "splunk"  # Options: splunk, qradar, elk, azure_sentinel
  host: "splunk.yourhotel.com"
  port: 8089
  api_token: "YOUR-SIEM-TOKEN"
```

### Encrypt Sensitive Information:

```bash
# Encrypt passwords in config file:
sudo proper29-agent encrypt-password

# It will prompt for password and update config.yaml automatically
```

---

## ✅ TESTING & VERIFICATION

### Step 1: Verify Agent Status

```bash
sudo systemctl status proper29-agent

# Should show:
# ● proper29-agent.service - PROPER 2.9 Security Monitoring Agent
#    Loaded: loaded
#    Active: active (running)
```

### Step 2: Check Dashboard

1. Log into PROPER 2.9 web dashboard
2. Navigate to: **Cybersecurity Hub** module
3. Verify you see:
   - ✅ Hotel name displayed correctly
   - ✅ Network traffic being monitored
   - ✅ Firewall status: "Connected"
   - ✅ Real-time threat count (should be 0-5 normally)

### Step 3: Test Threat Detection

**⚠️ WARNING: Only do this on a TEST device, not production systems!**

```bash
# Generate harmless test alert:
sudo proper29-agent test-alert

# This simulates a threat to verify detection works
```

You should see the test alert appear in the dashboard within 30 seconds.

### Step 4: Test Firewall Integration

```bash
# Test blocking an IP (use a test IP, not a real one):
sudo proper29-agent test-block-ip 192.0.2.1

# Verify the IP was added to firewall block list
# Then remove it:
sudo proper29-agent test-unblock-ip 192.0.2.1
```

### Step 5: Verify Logging

```bash
# Check recent logs:
sudo proper29-agent logs

# Check for errors:
sudo proper29-agent logs --level ERROR
```

---

## 🔍 TROUBLESHOOTING

### Issue: "Cannot connect to PROPER 2.9 cloud"

**Symptoms:**
- Dashboard shows "Disconnected"
- Agent status shows cloud connection failed

**Solutions:**
1. Check internet connectivity:
   ```bash
   ping api.proper29.com
   ```
2. Verify firewall allows outbound HTTPS (port 443)
3. Check API key is correct in `/etc/proper29/config.yaml`
4. Test connection:
   ```bash
   curl -H "Authorization: Bearer YOUR-API-KEY" https://api.proper29.com/health
   ```

---

### Issue: "Firewall API authentication failed"

**Symptoms:**
- Dashboard shows "Firewall: Disconnected"
- Logs show "401 Unauthorized" errors

**Solutions:**
1. Verify firewall credentials:
   ```bash
   sudo proper29-agent test-firewall --verbose
   ```
2. Check firewall has API enabled
3. Verify user has API access permissions
4. For Cisco ASA, ensure REST API is enabled:
   ```cisco
   rest-api image disk0:/asa-restapi.bin
   rest-api agent
   ```

---

### Issue: "No network traffic detected"

**Symptoms:**
- Dashboard shows 0 Mbps
- No threats detected (even test alerts fail)

**Solutions:**
1. Verify SPAN port is configured correctly
2. Check monitoring agent is connected to SPAN port
3. Verify network interface is up:
   ```bash
   ip link show
   sudo proper29-agent test-network-capture
   ```
4. Check switch SPAN configuration

---

### Issue: "High CPU usage"

**Symptoms:**
- Agent uses >80% CPU constantly
- Server becomes slow

**Solutions:**
1. Reduce monitoring scope in config:
   ```yaml
   monitoring:
     protocols:  # Only monitor essential protocols
       - "HTTPS"
       - "SSH"
   ```
2. Lower sensitivity:
   ```yaml
   monitoring:
     sensitivity: "medium"  # Instead of "high"
   ```
3. Increase hardware resources (add CPU/RAM)

---

### Issue: "Too many false positive alerts"

**Symptoms:**
- 50+ alerts per day
- Most are harmless

**Solutions:**
1. Add trusted IPs to whitelist:
   ```yaml
   security:
     ip_whitelist:
       - "192.168.1.0/24"  # Add your management network
       - "10.0.0.0/8"      # Add corporate VPN
   ```
2. Adjust sensitivity:
   ```yaml
   monitoring:
     sensitivity: "medium"  # Instead of "high"
   ```
3. Increase alert threshold:
   ```yaml
   alerts:
     severity_filter: "high"  # Only alert on high/critical
   ```

---

### Common Error Messages:

| Error | Cause | Solution |
|-------|-------|----------|
| `Connection refused` | Firewall blocking connection | Open port 443 outbound |
| `Invalid API key` | Wrong or expired key | Contact PROPER 2.9 support |
| `Network interface not found` | Wrong interface name | Check `ip addr` and update config |
| `Permission denied` | Agent not run as root | Use `sudo` |
| `Certificate verification failed` | SSL/TLS issue | Set `ssl_verify: false` (temporary) |

---

## 📞 SUPPORT

### Getting Help:

**Email Support:**
- General: support@proper29.com
- Technical: techsupport@proper29.com
- Emergency: emergency@proper29.com

**Phone Support:**
- US/Canada: 1-800-PROPER-9 (1-800-776-7379)
- International: +1-555-0199
- Available: 24/7 for emergencies

**Documentation:**
- Full docs: https://docs.proper29.com
- Video tutorials: https://proper29.com/tutorials
- Community forum: https://community.proper29.com

### Information to Provide When Contacting Support:

1. Hotel name and license key
2. Error message (exact text)
3. Log file:
   ```bash
   sudo proper29-agent logs --last 100 > support-log.txt
   ```
4. System info:
   ```bash
   sudo proper29-agent system-info > system-info.txt
   ```
5. Configuration (passwords removed):
   ```bash
   sudo cat /etc/proper29/config.yaml | grep -v password
   ```

---

## 📚 ADDITIONAL RESOURCES

### Recommended Reading:
- [PROPER 2.9 Admin Guide](https://docs.proper29.com/admin)
- [Network Security Best Practices](https://docs.proper29.com/security)
- [Firewall Integration Guides](https://docs.proper29.com/firewalls)

### Training Videos:
- Installation walkthrough (20 min)
- Dashboard tour (15 min)
- Responding to alerts (10 min)
- Advanced configuration (30 min)

**Access:** https://proper29.com/training

---

## ✅ POST-INSTALLATION CHECKLIST

After installation is complete, verify:

- [ ] Agent shows "Running" status
- [ ] Cloud connection shows "Connected" in dashboard
- [ ] Firewall integration working
- [ ] Hotel name appears correctly in dashboard
- [ ] Test alert successfully detected
- [ ] Email alerts working (if enabled)
- [ ] Network traffic stats updating in real-time
- [ ] No error messages in logs
- [ ] Monitoring interface capturing packets
- [ ] All configuration backed up

### Backup Configuration:

```bash
# Backup config file:
sudo cp /etc/proper29/config.yaml /etc/proper29/config.yaml.backup

# Or use built-in backup:
sudo proper29-agent backup-config
```

---

## 🎓 QUICK START SUMMARY

**For Experienced IT Professionals:**

```bash
# 1. Install Ubuntu Server 22.04
# 2. Download and run installer:
wget [link-from-vendor]
tar -xzf proper29-security-agent.tar.gz
sudo ./install.sh

# 3. Configure SPAN port on switch
# 4. Edit config file:
sudo nano /etc/proper29/config.yaml

# 5. Start agent:
sudo systemctl enable proper29-agent
sudo systemctl start proper29-agent

# 6. Verify:
sudo proper29-agent status
```

**Total time: 2-4 hours** ⏱️

---

## 📝 NOTES

- This system is **passive monitoring** by default - it won't block anything unless you enable auto-blocking
- All data is encrypted in transit (TLS 1.3)
- Agent auto-updates are available (can be disabled)
- No sensitive data (passwords, credit cards) is ever sent to the cloud
- Full audit logs are kept for 90 days by default
- You can run the agent in "test mode" for 30 days before committing

---

**Document Version:** 2.9.0  
**Last Updated:** October 24, 2025  
**Questions?** Contact support@proper29.com

---

*Thank you for choosing PROPER 2.9 for your hotel's security needs!*

