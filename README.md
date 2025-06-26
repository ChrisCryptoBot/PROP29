# PROPER 2.9 - AI-Enhanced Hotel Security Platform

A comprehensive hotel security management system with AI-powered analytics, real-time monitoring, and predictive insights.

## 🚀 Features

### Core Security Management
- **Real-time Security Dashboard** - Live metrics and status monitoring
- **Incident Management** - Complete incident lifecycle tracking
- **Patrol Management** - AI-optimized patrol routes and scheduling
- **Access Control** - Biometric and digital key management
- **Emergency Response** - Rapid alert system and lockdown procedures

### AI & Analytics
- **Predictive Analytics** - Incident forecasting and risk assessment
- **Behavioral Analysis** - Suspicious activity detection
- **Patrol Optimization** - AI-generated efficient routes
- **Pattern Recognition** - Historical data analysis and trends

### Guest Safety
- **Mobile Panic Button** - Emergency response system
- **Guest Communication** - Safety alerts and notifications
- **Medical Emergency Response** - Quick medical assistance
- **Personal Safety Escorts** - On-demand security services

### System Integration
- **IoT Sensor Monitoring** - Environmental and security sensors
- **CCTV Integration** - Video analytics and monitoring
- **Biometric Systems** - Fingerprint, facial recognition, iris scanning
- **Cybersecurity** - Network threat monitoring and prevention

## 🛠️ Technology Stack

### Backend
- **Python FastAPI** - High-performance API framework
- **SQLAlchemy** - Database ORM
- **PostgreSQL/SQLite** - Database (SQLite for local, PostgreSQL for production)
- **Redis** - Caching and real-time features
- **Celery** - Background task processing

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Query** - Data fetching and caching
- **Recharts** - Data visualization

### Desktop Application
- **Electron** - Cross-platform desktop app
- **Node.js** - Runtime environment

### AI/ML
- **TensorFlow/PyTorch** - Machine learning models
- **Scikit-learn** - Data analysis and modeling
- **OpenCV** - Computer vision processing

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd proper-2.9
2. Install Dependencies
bash
Copy
Edit
# Install Node.js dependencies
npm run install:all

# Or install manually:
npm install
cd frontend && npm install
cd ../backend && pip install -r requirements.txt
3. Setup Database
bash
Copy
Edit
# Initialize database with sample data
npm run setup:database
4. Start the Application
bash
Copy
Edit
# Start all services (backend, frontend, electron)
npm start

# Or start individually:
npm run dev:backend  # Backend API on http://localhost:8000
npm run dev:frontend # Frontend on http://localhost:3000
npm run dev:electron # Desktop app
5. Access the Application
Web Interface: http://localhost:3000

Desktop App: Will open automatically

API Documentation: http://localhost:8000/docs

🔐 Default Login Credentials
After running the setup, you can log in with:

Role	Email	Password
System Administrator	admin@proper29.com	admin123
Security Manager	security@grandplaza.com	security123
Security Guard	guard1@grandplaza.com	guard123
Resort Manager	manager@sunsetresort.com	manager123

📁 Project Structure
lua
Copy
Edit
proper-2.9/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── services/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── contexts/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── tailwind.config.js
├── electron/
│   ├── main.js
│   └── preload.js
├── assets/
├── package.json
└── README.md
🔧 Configuration
Create a .env file in the backend folder:

env
Copy
Edit
DATABASE_URL=sqlite:///./proper29.db
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
REDIS_URL=redis://localhost:6379
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
📊 API Overview
Use http://localhost:8000/docs for full API documentation.
Includes endpoints for:

Authentication

Incident management

Patrol operations

Analytics

Emergency response

🧪 Development Tools
Run tests: pytest or npm test

Format code: black .

Lint frontend: eslint . or tslint

📦 Deployment Options
Production build: npm run build

Dockerized app: docker build -t proper29 .

Cloud: Works with AWS, GCP, Azure, DigitalOcean

🧠 Future Roadmap
Mobile app for security guards

Advanced analytics dashboard

IoT device integrations

Blockchain-based access logs

🆘 Support
📧 support@proper29.com

📚 docs.proper29.com

💬 Discord Community

PROPER 2.9 — Security. Smarter. Safer.

