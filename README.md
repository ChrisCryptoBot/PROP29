# 🏨 PROPER 2.9 - AI-Enhanced Hotel Security Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

## 🎯 Overview

Proper 2.9 — an intelligent hotel loss-prevention and incident-management platform designed to streamline security operations, automate reporting, and centralize communication between management, staff, and law enforcement. Built for safety, efficiency, and accountability.

PROPER 2.9 is a comprehensive AI-enhanced hotel security platform that revolutionizes hospitality security management through predictive analytics, real-time monitoring, and intelligent automation. Built with modern technologies and enterprise-grade architecture, it provides a unified solution for hotel security operations.

### ✨ Key Features

- 🤖 **AI-Powered Security Analytics** - Predictive incident forecasting and risk assessment
- 🚨 **Real-Time Incident Management** - Instant alerting and automated response workflows
- 🛡️ **Intelligent Patrol Optimization** - AI-driven route planning and guard management
- 📱 **Guest Safety Integration** - Mobile panic buttons and emergency response systems
- 🔐 **Advanced Access Control** - Biometric authentication and digital key management
- 📊 **Comprehensive Analytics** - Real-time dashboards and performance metrics
- 🔒 **Cybersecurity Hub** - Network threat monitoring and protection
- 🌐 **IoT Environmental Monitoring** - Smart sensors and environmental controls

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  FastAPI Backend│    │  PostgreSQL DB  │
│   (TypeScript)  │◄──►│   (Python 3.11) │◄──►│   (Primary)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   Redis Cache   │              │
         │              │   (Session/ML)  │              │
         │              └─────────────────┘              │
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   Celery Tasks  │              │
         │              │  (Background)   │              │
         │              └─────────────────┘              │
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   AI/ML Models  │              │
         │              │  (TensorFlow)   │              │
         │              └─────────────────┘              │
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   Monitoring    │              │
         │              │ (Prometheus/ELK)│              │
         │              └─────────────────┘              │
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   Nginx Proxy   │              │
         │              │   (Production)  │              │
         │              └─────────────────┘              │
```

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (Recommended)
- **Python 3.11+** (for local development)
- **Node.js 18+** (for frontend development)
- **PostgreSQL 15+** (for production)
- **Redis 7+** (for caching)

### Option 1: Docker Deployment (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/proper29.git
   cd proper29
   ```

2. **Set up environment variables**
   ```bash
   cp backend/env.example backend/.env
   # Edit backend/.env with your configuration
   ```

3. **Start the platform**
   ```bash
   # Development mode
   docker-compose up -d
   
   # Production mode
   ENVIRONMENT=production docker-compose up -d
   ```

4. **Access the application**
   - **Frontend**: http://localhost:3000
   - **API Documentation**: http://localhost:8000/docs
   - **Admin Dashboard**: http://localhost:3000/admin
   - **Monitoring**: http://localhost:3001 (Grafana)

### Option 2: Local Development

1. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   # Set up environment
   cp env.example .env
   # Edit .env with your configuration
   
   # Initialize database
   python setup_database.py
   
   # Start the server
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Set up environment
   cp .env.example .env
   # Edit .env with your configuration
   
   # Start the development server
   npm start
   ```

## 📋 Documentation

The project includes comprehensive documentation in 12 detailed files:

1. **01_PROJECT_REVIEW_SUMMARY.txt** - Project overview and business context
2. **02_PROJECT_REQ.txt** - Technical requirements and specifications
3. **03_SYSTEM_ARCHITECHURE.txt** - System architecture and design
4. **04_CODEBASE_STRCUTURE.txt** - Codebase organization and structure
5. **05_DEVELOPMENT_STANDARDS.txt** - Coding standards and best practices
6. **06_ENV_CONFIG.txt** - Environment configuration guide
7. **07_COMPLETE_WALKTHROUGH.txt** - Complete system walkthrough
8. **08_INTERGRATION_GUIDES.txt** - Third-party integration guides
9. **09_SaaS_Complete.txt** - SaaS implementation details
10. **10_IMPLIMENTATION_SEQUENCE.txt** - Implementation roadmap
11. **11_INTERFACE_INTERGRATION.txt** - UI/UX integration guide
12. **12_SERVICE_DEPLOYMENT.txt** - Production deployment guide

## 🔧 Configuration

### Environment Variables

Key environment variables for configuration:

```bash
# Application
ENVIRONMENT=development|production
DEBUG=true|false
PORT=8000

# Security
SECRET_KEY=your-super-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database
DATABASE_URL=postgresql://user:pass@host:port/db
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=30

# Redis
REDIS_URL=redis://localhost:6379

# AI/ML
OPENAI_API_KEY=your-openai-key
AI_MODEL_PATH=/path/to/models

# External Services
SMTP_HOST=smtp.gmail.com
TWILIO_ACCOUNT_SID=your-twilio-sid
AWS_ACCESS_KEY_ID=your-aws-key
```

### Database Setup

The platform uses PostgreSQL with the following extensions:
- **TimescaleDB** for time-series data
- **PostGIS** for location-based queries
- **pg_trgm** for text search

### AI Model Configuration

AI models are automatically downloaded and configured on first startup:
- **Incident Prediction** - Time series forecasting
- **Patrol Optimization** - Route planning algorithms
- **Threat Detection** - Computer vision models
- **Natural Language Processing** - Text analysis

## 🧪 Testing

### Backend Testing
```bash
cd backend
pytest tests/ -v --cov=app --cov-report=html
```

### Frontend Testing
```bash
cd frontend
npm test
npm run test:coverage
```

### Integration Testing
```bash
# Run full integration test suite
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📊 Monitoring & Observability

The platform includes comprehensive monitoring:

- **Prometheus** - Metrics collection
- **Grafana** - Visualization dashboards
- **Elasticsearch** - Log aggregation
- **Kibana** - Log visualization
- **Sentry** - Error tracking

### Access Monitoring Tools

- **Grafana**: http://localhost:3001 (admin/admin)
- **Kibana**: http://localhost:5601
- **Prometheus**: http://localhost:9090
- **Flower** (Celery): http://localhost:5555

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **Rate Limiting** on all endpoints
- **CORS Protection** with configurable origins
- **SQL Injection Prevention** with parameterized queries
- **XSS Protection** with content security policies
- **CSRF Protection** with token validation
- **Input Validation** with Pydantic schemas
- **Secure Headers** with middleware
- **Password Hashing** with bcrypt
- **Session Management** with Redis

## 🚀 Deployment

### Production Deployment

1. **Prepare Production Environment**
   ```bash
   export ENVIRONMENT=production
   export SECRET_KEY=$(openssl rand -hex 32)
   export DATABASE_URL=postgresql://user:pass@host:port/db
   ```

2. **Deploy with Docker**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Run Database Migrations**
   ```bash
   docker-compose exec api alembic upgrade head
   ```

4. **Initialize AI Models**
   ```bash
   docker-compose exec api python -c "from services.ai_service import AIService; AIService.initialize_models()"
   ```

### Cloud Deployment

The platform is designed for cloud deployment on:
- **AWS** - ECS/EKS with RDS and ElastiCache
- **Google Cloud** - GKE with Cloud SQL
- **Azure** - AKS with Azure Database
- **DigitalOcean** - App Platform with Managed Databases

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the coding standards in `05_DEVELOPMENT_STANDARDS.txt`
- Write tests for new features
- Update documentation as needed
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the 12 documentation files in the root directory
- **Issues**: [GitHub Issues](https://github.com/your-org/proper29/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/proper29/discussions)
- **Email**: support@proper29.com

## 🏆 Acknowledgments

- **FastAPI** for the excellent web framework
- **React** for the frontend framework
- **PostgreSQL** for the robust database
- **Redis** for caching and session management
- **Docker** for containerization
- **TensorFlow** for AI/ML capabilities

## 📈 Roadmap

- [ ] **Q1 2024**: Advanced AI model training
- [ ] **Q2 2024**: Mobile app development
- [ ] [ ] **Q3 2024**: IoT device integration
- [ ] **Q4 2024**: Multi-tenant architecture
- [ ] **Q1 2025**: International expansion
- [ ] **Q2 2025**: Advanced analytics dashboard

---

**PROPER 2.9** - Revolutionizing hotel security through intelligent automation and predictive analytics. 🏨🔒🤖

