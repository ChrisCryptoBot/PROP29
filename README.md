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
```

### 2. Install Dependencies
```bash
# Install Node.js dependencies
npm run install:all

# Or install manually:
npm install
cd frontend && npm install
cd ../backend && pip install -r requirements.txt
```

### 3. Setup Database
```bash
# Initialize database with sample data
npm run setup:database
```

### 4. Start the Application
```bash
# Start all services (backend, frontend, electron)
npm start

# Or start individually:
npm run dev:backend  # Backend API on http://localhost:8000
npm run dev:frontend # Frontend on http://localhost:3000
npm run dev:electron # Desktop app
```

### 5. Access the Application
- **Web Interface**: http://localhost:3000
- **Desktop App**: Will open automatically
- **API Documentation**: http://localhost:8000/docs

## 🔐 Default Login Credentials

After running the setup, you can log in with:

| Role | Email | Password |
|------|-------|----------|
| System Administrator | admin@proper29.com | admin123 |
| Security Manager | security@grandplaza.com | security123 |
| Security Guard | guard1@grandplaza.com | guard123 |
| Resort Manager | manager@sunsetresort.com | manager123 |

## 📁 Project Structure

```
proper-2.9/
├── backend/                 # Python FastAPI backend
│   ├── main.py             # FastAPI application entry point
│   ├── database.py         # Database configuration
│   ├── models.py           # SQLAlchemy models
│   ├── schemas.py          # Pydantic schemas
│   ├── services/           # Business logic services
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   ├── package.json       # Node.js dependencies
│   └── tailwind.config.js # Tailwind CSS configuration
├── electron/              # Desktop application
│   ├── main.js           # Electron main process
│   └── preload.js        # Preload script
├── assets/               # Application assets
├── package.json          # Root package.json
└── README.md            # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL=sqlite:///./proper29.db

# Security
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Redis (optional)
REDIS_URL=redis://localhost:6379

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Database Configuration

For production, update the `DATABASE_URL` in your `.env` file:

```env
# PostgreSQL (production)
DATABASE_URL=postgresql://username:password@localhost:5432/proper29

# SQLite (development)
DATABASE_URL=sqlite:///./proper29.db
```

## 🏗️ Development

### Backend Development

```bash
cd backend

# Run with auto-reload
uvicorn main:app --reload --port 8000

# Run tests
pytest

# Format code
black .

# Lint code
flake8
```

### Frontend Development

```bash
cd frontend

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

### Desktop App Development

```bash
# Start electron in development mode
npm run dev:electron
```

## 📊 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout

### Incidents
- `GET /incidents` - List incidents
- `POST /incidents` - Create incident
- `GET /incidents/{id}` - Get incident details
- `PUT /incidents/{id}` - Update incident
- `DELETE /incidents/{id}` - Delete incident

### Patrols
- `GET /patrols` - List patrols
- `POST /patrols` - Create patrol
- `GET /patrols/{id}` - Get patrol details
- `PUT /patrols/{id}` - Update patrol
- `POST /patrols/{id}/start` - Start patrol
- `POST /patrols/{id}/complete` - Complete patrol

### Analytics
- `GET /metrics/dashboard` - Dashboard metrics
- `GET /metrics/incidents` - Incident analytics
- `GET /metrics/patrols` - Patrol analytics
- `GET /ai/predictions` - AI predictions
- `POST /ai/analyze-incident` - Incident analysis

### Emergency
- `POST /emergency/alert` - Trigger emergency alert
- `POST /emergency/lockdown` - Trigger lockdown

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# The built application will be in the dist/ directory
```

### Docker Deployment

```bash
# Build Docker image
docker build -t proper29 .

# Run container
docker run -p 8000:8000 -p 3000:3000 proper29
```

### Cloud Deployment

The application is designed to be easily deployable to:
- **AWS** - Using ECS, Lambda, and RDS
- **Google Cloud** - Using GKE and Cloud SQL
- **Azure** - Using AKS and Azure SQL
- **DigitalOcean** - Using App Platform and Managed Databases

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-based Access Control** - Granular permissions system
- **Data Encryption** - At-rest and in-transit encryption
- **Audit Logging** - Complete activity tracking
- **Rate Limiting** - API protection against abuse
- **CORS Protection** - Cross-origin request security

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- **Documentation**: [docs.proper29.com](https://docs.proper29.com)
- **Email**: support@proper29.com
- **Discord**: [Proper 2.9 Community](https://discord.gg/proper29)

## 🗺️ Roadmap

### Version 1.1 (Q2 2024)
- [ ] Mobile app for guards
- [ ] Advanced AI models
- [ ] Integration with hotel PMS systems
- [ ] Multi-language support

### Version 1.2 (Q3 2024)
- [ ] Guest mobile app
- [ ] Advanced analytics dashboard
- [ ] IoT device management
- [ ] API marketplace

### Version 2.0 (Q4 2024)
- [ ] Multi-property management
- [ ] Advanced AI predictions
- [ ] Blockchain integration
- [ ] AR/VR security training

---

**PROPER 2.9** - Revolutionizing hotel security through intelligent technology. 