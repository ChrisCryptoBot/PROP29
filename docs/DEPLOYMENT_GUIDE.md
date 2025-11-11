# PROPER 2.9 Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Deployment Options](#deployment-options)
4. [Local Development](#local-development)
5. [Docker Deployment](#docker-deployment)
6. [Cloud Deployment](#cloud-deployment)
7. [Production Deployment](#production-deployment)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

## Overview

This guide covers the complete deployment process for the PROPER 2.9 AI-Enhanced Hotel Security Platform. The platform can be deployed in various environments from local development to enterprise production systems.

## Prerequisites

### System Requirements

**Minimum Requirements:**
- CPU: 4 cores
- RAM: 8GB
- Storage: 50GB SSD
- Network: 100Mbps

**Recommended Requirements:**
- CPU: 8+ cores
- RAM: 16GB+
- Storage: 200GB+ SSD
- Network: 1Gbps+

### Software Requirements

**Operating System:**
- Ubuntu 20.04+ / CentOS 8+ / RHEL 8+
- Windows Server 2019+
- macOS 12+ (development only)

**Required Software:**
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+

## Deployment Options

### 1. Local Development
- Single machine setup
- All services on localhost
- Development tools included

### 2. Docker Deployment
- Containerized services
- Easy scaling and management
- Production-ready configuration

### 3. Cloud Deployment
- AWS, Azure, or GCP
- Managed services
- Auto-scaling capabilities

### 4. On-Premises Deployment
- Enterprise infrastructure
- Custom security requirements
- Full control over data

## Local Development

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
   - Electron App: Auto-launches

### Development Configuration

Create a `.env.development` file:

```env
NODE_ENV=development
API_URL=http://localhost:8000
WS_URL=ws://localhost:8000/ws
DATABASE_URL=postgresql://postgres:password@localhost:5432/proper29_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-key
DEBUG_ENABLED=true
```

### Development Commands

```bash
# Start all services
npm run dev:full

# Start backend only
npm run dev:backend

# Start frontend only
npm start

# Start Electron app
npm run dev:electron

# Run tests
npm test
npm run test:e2e

# Build for production
npm run build:production
```

## Docker Deployment

### Single-Host Deployment

1. **Build and start services**
   ```bash
   # Build all images
   docker-compose build
   
   # Start services
   docker-compose up -d
   
   # View logs
   docker-compose logs -f
   ```

2. **Initialize database**
   ```bash
   docker-compose exec backend python setup_database.py
   ```

3. **Access the application**
   - Web Dashboard: http://localhost:3000
   - API: http://localhost:8000
   - Admin: http://localhost:8080

### Multi-Host Deployment

1. **Create Docker Swarm**
   ```bash
   # Initialize swarm
   docker swarm init
   
   # Deploy stack
   docker stack deploy -c docker-compose.prod.yml proper29
   ```

2. **Scale services**
   ```bash
   # Scale backend services
   docker service scale proper29_backend=3
   docker service scale proper29_frontend=2
   ```

### Docker Configuration

**docker-compose.yml (Development):**
```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - ./src:/app/src
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/proper29
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=proper29
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

**docker-compose.prod.yml (Production):**
```yaml
version: '3.8'

services:
  frontend:
    image: proper29/frontend:latest
    ports:
      - "80:80"
      - "443:443"
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure

  backend:
    image: proper29/backend:latest
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    deploy:
      replicas: 5
      resources:
        limits:
          cpus: '1'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
```

## Cloud Deployment

### AWS Deployment

1. **Setup AWS Infrastructure**
   ```bash
   # Install AWS CLI
   aws configure
   
   # Create ECS cluster
   aws ecs create-cluster --cluster-name proper29-cluster
   
   # Create ECR repositories
   aws ecr create-repository --repository-name proper29/frontend
   aws ecr create-repository --repository-name proper29/backend
   ```

2. **Deploy with ECS**
   ```bash
   # Build and push images
   docker build -t proper29/frontend .
   docker push proper29/frontend:latest
   
   # Deploy stack
   aws cloudformation deploy \
     --template-file cloudformation/proper29.yml \
     --stack-name proper29-stack \
     --capabilities CAPABILITY_IAM
   ```

3. **Setup RDS Database**
   ```bash
   # Create RDS instance
   aws rds create-db-instance \
     --db-instance-identifier proper29-db \
     --db-instance-class db.t3.large \
     --engine postgres \
     --master-username admin \
     --master-user-password secure-password \
     --allocated-storage 100
   ```

### Azure Deployment

1. **Setup Azure Infrastructure**
   ```bash
   # Login to Azure
   az login
   
   # Create resource group
   az group create --name proper29-rg --location eastus
   
   # Create AKS cluster
   az aks create \
     --resource-group proper29-rg \
     --name proper29-cluster \
     --node-count 3 \
     --enable-addons monitoring
   ```

2. **Deploy with Kubernetes**
   ```bash
   # Get credentials
   az aks get-credentials --resource-group proper29-rg --name proper29-cluster
   
   # Deploy application
   kubectl apply -f k8s/
   ```

### GCP Deployment

1. **Setup GCP Infrastructure**
   ```bash
   # Set project
   gcloud config set project your-project-id
   
   # Create GKE cluster
   gcloud container clusters create proper29-cluster \
     --num-nodes=3 \
     --zone=us-central1-a \
     --enable-autoscaling \
     --min-nodes=1 \
     --max-nodes=10
   ```

2. **Deploy with GKE**
   ```bash
   # Get credentials
   gcloud container clusters get-credentials proper29-cluster --zone=us-central1-a
   
   # Deploy application
   kubectl apply -f k8s/
   ```

## Production Deployment

### Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Firewall rules configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Security audit completed

### Production Configuration

1. **Environment Setup**
   ```bash
   # Copy production template
   cp env.production.template .env.production
   
   # Edit configuration
   nano .env.production
   ```

2. **Database Setup**
   ```bash
   # Create production database
   createdb proper29_prod
   
   # Run migrations
   python manage.py migrate
   
   # Load initial data
   python manage.py loaddata initial_data.json
   ```

3. **SSL Configuration**
   ```bash
   # Generate SSL certificates
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout private.key -out certificate.crt
   
   # Configure nginx
   cp nginx.ssl.conf /etc/nginx/sites-available/proper29
   ln -s /etc/nginx/sites-available/proper29 /etc/nginx/sites-enabled/
   ```

4. **Service Configuration**
   ```bash
   # Create systemd services
   sudo cp systemd/proper29-backend.service /etc/systemd/system/
   sudo cp systemd/proper29-frontend.service /etc/systemd/system/
   
   # Enable and start services
   sudo systemctl enable proper29-backend
   sudo systemctl enable proper29-frontend
   sudo systemctl start proper29-backend
   sudo systemctl start proper29-frontend
   ```

### Production Commands

```bash
# Deploy to production
npm run deploy:production

# Monitor deployment
npm run docker:logs

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=5

# Backup database
pg_dump proper29_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Update application
git pull origin main
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoring & Maintenance

### Health Checks

1. **Application Health**
   ```bash
   # Check API health
   curl http://localhost:8000/health
   
   # Check database connection
   curl http://localhost:8000/health/db
   
   # Check Redis connection
   curl http://localhost:8000/health/redis
   ```

2. **Service Monitoring**
   ```bash
   # Monitor Docker services
   docker stats
   
   # Monitor system resources
   htop
   
   # Monitor logs
   docker-compose logs -f
   ```

### Backup Strategy

1. **Database Backup**
   ```bash
   # Automated backup script
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   pg_dump proper29_prod > /backups/db_$DATE.sql
   gzip /backups/db_$DATE.sql
   
   # Keep only last 30 days
   find /backups -name "db_*.sql.gz" -mtime +30 -delete
   ```

2. **File Backup**
   ```bash
   # Backup uploads
   rsync -av /var/uploads/proper29/ /backups/uploads/
   
   # Backup configuration
   tar -czf /backups/config_$DATE.tar.gz /etc/proper29/
   ```

### Performance Optimization

1. **Database Optimization**
   ```sql
   -- Create indexes
   CREATE INDEX idx_incidents_property_date ON incidents(property_id, created_at);
   CREATE INDEX idx_patrols_status ON patrols(status, property_id);
   CREATE INDEX idx_access_events_timestamp ON access_control_events(timestamp);
   
   -- Analyze tables
   ANALYZE incidents;
   ANALYZE patrols;
   ANALYZE access_control_events;
   ```

2. **Caching Strategy**
   ```bash
   # Redis cache configuration
   maxmemory 2gb
   maxmemory-policy allkeys-lru
   save 900 1
   save 300 10
   save 60 10000
   ```

3. **Load Balancing**
   ```nginx
   # Nginx load balancer configuration
   upstream backend {
       server backend1:8000;
       server backend2:8000;
       server backend3:8000;
   }
   
   server {
       listen 80;
       server_name api.proper29.com;
       
       location / {
           proxy_pass http://backend;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database status
   sudo systemctl status postgresql
   
   # Check connection
   psql -h localhost -U postgres -d proper29
   
   # Reset database
   sudo systemctl restart postgresql
   ```

2. **WebSocket Connection Issues**
   ```bash
   # Check WebSocket service
   curl -I http://localhost:8000/ws/test
   
   # Check firewall
   sudo ufw status
   sudo ufw allow 8000
   ```

3. **Memory Issues**
   ```bash
   # Check memory usage
   free -h
   
   # Check swap
   swapon --show
   
   # Increase swap if needed
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

### Log Analysis

1. **Application Logs**
   ```bash
   # View application logs
   tail -f /var/log/proper29/app.log
   
   # Search for errors
   grep ERROR /var/log/proper29/app.log
   
   # Monitor real-time
   tail -f /var/log/proper29/app.log | grep -E "(ERROR|WARN)"
   ```

2. **System Logs**
   ```bash
   # View system logs
   journalctl -u proper29-backend -f
   journalctl -u proper29-frontend -f
   
   # Check for failures
   journalctl -u proper29-backend --since "1 hour ago" | grep -i fail
   ```

### Performance Issues

1. **Slow Queries**
   ```sql
   -- Enable query logging
   ALTER SYSTEM SET log_statement = 'all';
   SELECT pg_reload_conf();
   
   -- Analyze slow queries
   SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
   ```

2. **High CPU Usage**
   ```bash
   # Check CPU usage
   top
   htop
   
   # Check specific processes
   ps aux | grep proper29
   
   # Profile application
   python -m cProfile -o profile.stats app.py
   ```

### Recovery Procedures

1. **Service Recovery**
   ```bash
   # Restart services
   sudo systemctl restart proper29-backend
   sudo systemctl restart proper29-frontend
   
   # Check service status
   sudo systemctl status proper29-backend
   sudo systemctl status proper29-frontend
   ```

2. **Database Recovery**
   ```bash
   # Restore from backup
   psql proper29_prod < backup_20231201_120000.sql
   
   # Verify data integrity
   python manage.py check
   ```

3. **Full System Recovery**
   ```bash
   # Stop all services
   sudo systemctl stop proper29-*
   
   # Restore from backup
   tar -xzf backup_20231201_120000.tar.gz -C /
   
   # Restart services
   sudo systemctl start proper29-*
   ```

---

**For additional support, contact:**
- **Email**: support@proper-security.com
- **Phone**: +1 (555) 123-4567
- **Documentation**: https://docs.proper-security.com 