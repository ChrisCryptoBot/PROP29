# PROPER 2.9 AI-Enhanced Hotel Security Platform

## Overview

PROPER 2.9 is a comprehensive AI-powered hotel security management system that integrates physical security, cybersecurity, and guest safety into a unified platform. The system provides real-time monitoring, predictive analytics, and automated response capabilities for modern hospitality environments.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Features

### Core Security Modules
- **AI-Powered Dashboard**: Real-time command center with predictive analytics
- **Intelligent Patrol Management**: AI-optimized patrol routing and tracking
- **Incident Management**: Comprehensive incident recording and response
- **Access Control**: Unified access management with biometric authentication
- **Guest Safety**: Mobile panic button system with emergency response
- **Real-time Monitoring**: 24/7 monitoring with intelligent alerting

### Advanced Features
- **Predictive Analytics**: Machine learning models for incident forecasting
- **Cybersecurity Hub**: Network threat monitoring and prevention
- **IoT Environmental Monitoring**: Sensor-based environmental monitoring
- **Digital Handover**: AI-powered shift handover system
- **Advanced Reports**: Comprehensive reporting and analytics
- **Mobile Integration**: Staff and guest mobile applications

### AI/ML Capabilities
- Incident prediction and risk assessment
- Patrol route optimization
- Behavioral pattern analysis
- Anomaly detection
- Predictive maintenance
- Guest behavior analysis

## Architecture

### System Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WEB DASHBOARD │    │   MOBILE APPS   │    │   IOT SENSORS   │
│  (React + TS)   │    │ (Staff & Guest) │    │ (Fire/Security) │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
         ┌─────────────────────────┴─────────────────────────┐
         │         API GATEWAY + LOAD BALANCER              │
         └─────────────────────┬─────────────────────────────┘
                               │
    ┌──────────────────────────┼──────────────────────────┐
    │                          │                          │
┌───▼────┐              ┌─────▼─────┐              ┌─────▼─────┐
│SECURITY│              │AI/ML CORE │              │GUEST SAFETY│
│SERVICE │              │ SERVICES  │              │ SERVICE   │
│(Python)│              │(Python ML)│              │(Node.js)  │
└───┬────┘              └─────┬─────┘              └─────┬─────┘
    │                         │                          │
    └─────────────────────────┼──────────────────────────┘
                              │
         ┌────────────────────┴────────────────────┐
         │        EVENT BUS + MESSAGE QUEUE        │
         └─────────────────────────────────────────┘
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
┌───▼────┐              ┌─────▼─────┐              ┌───▼────┐
│POSTGRES│              │   REDIS   │              │   S3   │
│(Primary)│              │  (Cache)  │              │(Files) │
│TimescaleDB│            │(Sessions) │              │(Videos)│
└────────┘              └───────────┘              └────────┘
```

### Technology Stack
- **Frontend**: React 18+ with TypeScript, Tailwind CSS
- **Backend**: Python FastAPI, Node.js microservices
- **Database**: PostgreSQL 15+ with TimescaleDB
- **Cache**: Redis 7+
- **AI/ML**: TensorFlow, Scikit-learn, Apache Airflow
- **Real-time**: WebSocket, Event-driven architecture
- **Deployment**: Docker, Kubernetes, AWS

## Installation

### Prerequisites
- Node.js 16+ and npm 8+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker and Docker Compose

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/proper-security/proper29-platform.git
   cd proper29-platform
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Setup database**
   ```bash
   npm run setup:database
   ```

4. **Start development environment**
   ```bash
   npm run dev:full
   ```

5. **Access the application**
   - Web Dashboard: http://localhost:3000
   - API Documentation: http://localhost:8000/docs
   - Electron App: Will launch automatically

### Docker Deployment

1. **Build and start services**
   ```bash
   npm run docker:build
   npm run docker:up
   ```

2. **View logs**
   ```bash
   npm run docker:logs
   ```

3. **Stop services**
   ```bash
   npm run docker:down
   ```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Application
NODE_ENV=development
PORT=3000
API_URL=http://localhost:8000
WS_URL=ws://localhost:8000/ws

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/proper29
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# AI/ML Services
AI_SERVICE_URL=http://localhost:8002
ML_MODEL_PATH=/models

# External Services
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
S3_BUCKET=proper29-files

# Email/SMS
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-password

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

### Database Configuration

The system uses PostgreSQL with TimescaleDB extension for time-series data:

```sql
-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create hypertables for time-series data
SELECT create_hypertable('iot_environmental_data', 'timestamp');
SELECT create_hypertable('access_control_events', 'timestamp');
SELECT create_hypertable('user_activities', 'timestamp');
```

## Usage

### Dashboard Overview

The main dashboard provides:
- Real-time security metrics
- Active incidents and alerts
- Patrol status and efficiency
- AI risk assessment
- Quick action buttons

### Incident Management

1. **Report Incident**
   - Click "Report Incident" button
   - Fill in incident details
   - Select severity and type
   - Add evidence and witnesses

2. **Track Incident**
   - View incident status
   - Assign to security staff
   - Update resolution progress
   - Generate reports

### Patrol Management

1. **Create Patrol**
   - Define patrol route
   - Assign security guard
   - Set checkpoints
   - Configure AI optimization

2. **Monitor Patrol**
   - Real-time location tracking
   - Checkpoint completion
   - Efficiency metrics
   - Incident reporting

### Access Control

1. **Configure Access Points**
   - Define access zones
   - Set permissions
   - Configure biometric devices
   - Setup digital keys

2. **Monitor Access**
   - Real-time access events
   - Unauthorized access alerts
   - Guest access management
   - Audit trails

### Guest Safety

1. **Emergency Response**
   - Panic button activation
   - Medical emergency alerts
   - Automated response protocols
   - Guest communication

2. **Safety Monitoring**
   - Guest location tracking
   - Safety check scheduling
   - Incident prevention
   - Response time optimization

## API Reference

### Authentication

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@hotel.com",
  "password": "password"
}
```

### Incidents

```http
GET /incidents
Authorization: Bearer <token>

POST /incidents
Authorization: Bearer <token>
Content-Type: application/json

{
  "incident_type": "theft",
  "severity": "medium",
  "title": "Suspicious activity",
  "description": "Guest reported suspicious person",
  "location": {
    "building": "main",
    "floor": "1",
    "area": "lobby"
  }
}
```

### Patrols

```http
GET /patrols
Authorization: Bearer <token>

POST /patrols
Authorization: Bearer <token>
Content-Type: application/json

{
  "property_id": "property-123",
  "guard_id": "guard-456",
  "patrol_type": "ai_optimized",
  "route": {
    "checkpoints": [...],
    "estimated_duration": 1800
  }
}
```

### WebSocket Events

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8000/ws/user-id');

// Listen for real-time events
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch(message.type) {
    case 'incident_alert':
      // Handle incident alert
      break;
    case 'patrol_update':
      // Handle patrol update
      break;
    case 'access_event':
      // Handle access event
      break;
  }
};
```

## Deployment

### Production Deployment

1. **Build production assets**
   ```bash
   npm run build:production
   ```

2. **Deploy to production**
   ```bash
   npm run deploy:production
   ```

### Docker Production

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d

# Monitor deployment
docker-compose -f docker-compose.prod.yml logs -f
```

### Kubernetes Deployment

```yaml
# proper29-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: proper29-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: proper29-frontend
  template:
    metadata:
      labels:
        app: proper29-frontend
    spec:
      containers:
      - name: frontend
        image: proper29/frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: API_URL
          value: "http://proper29-api:8000"
```

## Testing

### Unit Tests

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=Dashboard.test.tsx
```

### Integration Tests

```bash
# Run backend integration tests
cd backend
pytest tests/

# Run with coverage
pytest tests/ --cov=services --cov-report=html
```

### E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run in headed mode
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug
```

### Performance Tests

```bash
# Run performance tests
npm run test:performance

# Load testing
npm run test:load
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database status
   docker-compose ps postgres
   
   # View database logs
   docker-compose logs postgres
   
   # Reset database
   npm run setup:database
   ```

2. **WebSocket Connection Issues**
   ```bash
   # Check WebSocket service
   curl -I http://localhost:8000/ws/test
   
   # View WebSocket logs
   docker-compose logs backend
   ```

3. **Build Issues**
   ```bash
   # Clear cache
   npm run clean
   
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

### Logs and Monitoring

```bash
# View all logs
npm run docker:logs

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Monitor system resources
docker stats
```

### Performance Optimization

1. **Database Optimization**
   - Enable query caching
   - Optimize indexes
   - Use connection pooling

2. **Frontend Optimization**
   - Enable code splitting
   - Optimize bundle size
   - Use CDN for static assets

3. **Backend Optimization**
   - Enable response caching
   - Optimize database queries
   - Use async processing

## Contributing

### Development Setup

1. **Fork the repository**
2. **Create feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make changes and test**
4. **Commit changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
5. **Push to branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Create Pull Request**

### Code Standards

- Follow TypeScript best practices
- Use ESLint and Prettier
- Write comprehensive tests
- Document new features
- Follow Git commit conventions

### Testing Requirements

- Unit test coverage > 80%
- Integration tests for all APIs
- E2E tests for critical flows
- Performance tests for new features

## Support

### Documentation
- [API Documentation](http://localhost:8000/docs)
- [User Guide](./user-guide.md)
- [Admin Guide](./admin-guide.md)
- [Deployment Guide](./deployment-guide.md)

### Contact
- **Email**: support@proper-security.com
- **Phone**: +1 (555) 123-4567
- **Support Portal**: https://support.proper-security.com

### License
This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

---

**PROPER 2.9** - Revolutionizing Hotel Security with AI 