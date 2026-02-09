# Proper29 Backend

> **Advanced Property Security & Management System**
> Phase 1 verified and production-ready.

## 🚀 Overview

Proper29 is a comprehensive backend system designed for modern property security and management. It features real-time chat, advanced sound monitoring with AI alerts, multi-channel notifications, and robust system administration tools.

Built with **FastAPI**, **SQLAlchemy**, and **PostgreSQL**, designed for high performance and scalability.

---

## ✨ Key Features

### 🔊 Sound Monitoring & AI Alerts
- **Real-time Audio Analysis**: Detects glass breaks, gunshots, screams, and aggressive behavior.
- **Smart Notifications**: Automatically alerts security staff via SMS/Push for high-confidence events (≥75%).
- **Zone Management**: Configure monitoring zones per property.
- **Alert Lifecycle**: Verify or dismiss alerts with full audit trails.

### 💬 Secure Team Chat
- **Real-Time Communication**: WebSocket-based chat for security teams.
- **Channel Management**: Create property-specific channels.
- **Persistence**: Full message history with read receipts and attachment metadata.
- **Role-Based Access**: Secure channels restricted by property access.

### 📨 Notification Engine
- **Multi-Channel Delivery**: Unified API for Email (SendGrid), SMS (Twilio), and Push (FCM).
- **User Preferences**: Respects user opt-ins and quiet hours.
- **Priority Handling**: Critical alerts bypass standard delivery rules.

### 🛡️ System Administration
- **Multi-Tenancy**: Built-in tenant isolation via `property_id`.
- **RBAC**: Granular Role-Based Access Control for admins, managers, and staff.
- **Audit Logging**: Comprehensive system and access logs for compliance.

---

## 🛠️ Tech Stack

- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL (Production) / SQLite (Dev)
- **ORM**: SQLAlchemy 2.0 + Alembic Migrations
- **Real-Time**: WebSockets
- **Integrations**: SendGrid, Twilio, Firebase

---

## 🚦 Current Status (Phase 1 verified)

✅ **Core Backend**: 92% Complete
- [x] Database Schema & Migrations (100%)
- [x] REST API (150+ endpoints)
- [x] WebSocket Chat Infrastructure
- [x] Sound Monitoring Pipeline
- [x] Notification Service (Email/SMS)

⚠️ **Pending**:
- [ ] Staging Deployment (Phase 1e)
- [ ] Notification REST API endpoints

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL (optional, defaults to SQLite)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ChrisCryptoBot/PROP29.git
   cd PROP29
   ```

2. **Set up Virtual Environment**
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r backend/requirements.txt
   ```

4. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=sqlite:///./proper29.db
   SECRET_KEY=your_secret_key
   
   # Optional Integrations
   SENDGRID_API_KEY=
   TWILIO_ACCOUNT_SID=
   TWILIO_AUTH_TOKEN=
   TWILIO_PHONE_NUMBER=
   ```

5. **Run Migrations**
   ```bash
   cd backend
   alembic upgrade head
   ```

6. **Start Server**
   ```bash
   uvicorn main:app --reload
   ```
   API Docs available at: http://localhost:8000/docs

---

## 🧪 Testing

Run the test suite to verify installation:

```bash
cd backend
pytest tests/
```

---

## 📄 License

Proprietary Software. All rights reserved.
