# IndieGamerHub Infrastructure Guide

## Overview

This document covers the production-ready infrastructure setup for IndieGamerHub, including Docker containerization, logging, security hardening, and deployment configurations.

## 🐳 Docker Setup

### Building Images

```bash
# Build all services
make docker-build

# Or manually:
docker-compose build
```

### Running Services

```bash
# Start all services
make docker-up

# Stop services
make docker-down

# View logs
make logs
```

### Services

1. **Server** (Node.js/Express)
   - Port: 5000
   - Dockerfile: `server/Dockerfile`
   - Multi-stage build for optimization
   - Health check: `GET /api/health`

2. **Client** (React/Vite)
   - Port: 3000
   - Dockerfile: `client/Dockerfile`
   - Nginx reverse proxy with CSP headers
   - Proxy configuration for API requests

3. **MongoDB**
   - Port: 27017
   - Persistent volume: `mongodb_data`
   - Authentication enabled
   - Health check configured

## 📝 Logging

### Server Logging

The server uses **Pino** for structured logging with the following features:

- **Development**: Pretty-printed, colorized logs via `pino-pretty`
- **Production**: Structured JSON logs for ingestion into log aggregation services
- **Log Levels**: debug, info, warn, error
- **HTTP Logging**: Automatic request/response logging via `pino-http`

### Log Level Configuration

Set via `LOG_LEVEL` environment variable:

```bash
# In .env or docker-compose
LOG_LEVEL=info  # default
LOG_LEVEL=debug # verbose
LOG_LEVEL=warn  # warnings and errors only
```

### Viewing Logs

```bash
# In development
npm run dev-server

# In Docker
make logs
docker-compose logs -f server
docker-compose logs -f client
```

## 🔒 Security Hardening

### Helmet Headers

Security headers are configured via Helmet middleware:

- **Content-Security-Policy**: Restricts resource loading
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Disables MIME sniffing
- **Strict-Transport-Security**: Forces HTTPS (31536000s = 1 year)
- **Referrer-Policy**: Controls referrer information

### CORS Configuration

- **Origin**: Restricted to `CLIENT_URL` environment variable
- **Credentials**: Enabled for authenticated requests
- **Methods**: GET, POST, PUT, DELETE, PATCH

### JWT Authentication

- **Algorithm**: HS256 (HMAC with SHA-256)
- **Expiry**: 7 days (configurable via `JWT_EXPIRE`)
- **Storage**: HttpOnly cookies (recommended for production)
- **Current**: localStorage (web app only, no server-side cookies yet)

**TODO for production**: Implement refresh tokens with HttpOnly cookies for session revocation support.

### Input Validation

- Request body size limited to 10MB
- URL-encoded payloads limited to 10MB
- Schema validation on all models (Mongoose)

### Error Handling

- Duplicate key errors (email/username) caught and formatted
- Stack traces logged but not exposed to clients in production
- All async errors caught by `express-async-errors` middleware

## 📦 Environment Variables

### Required (Production)

```bash
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=<min 32 chars>
CLIENT_URL=https://yourdomain.com
```

### Optional but Recommended

```bash
LOG_LEVEL=info
STEAM_API_KEY=...          # For live Steam data
RAWG_API_KEY=...           # For game metadata fallback
CLOUDINARY_*=...           # For image uploads
```

### Complete List

See `server/.env.example` for all available variables with descriptions.

## 🚀 Deployment

### Local Development

```bash
make install
make dev          # Runs both client and server
```

### Docker Compose (Staging/Production)

```bash
# Create .env file from .env.example
cp server/.env.example server/.env
# Edit .env with production values

# Build and start
make docker-build
make docker-up
```

### Environment-Specific Configs

Create separate `.env` files:

```bash
.env.development    # Local development
.env.staging        # Staging environment
.env.production     # Production
```

Load via: `NODE_ENV=production make docker-up`

## 🧪 Health Checks

All services include health checks:

```bash
# API Health
curl http://localhost:5000/api/health

# Database Health (via Docker)
docker-compose logs mongodb | grep "waiting for connections"

# Client Health (via Nginx)
curl -I http://localhost:3000
```

## 📊 Monitoring

### Log Aggregation Setup

For production, integrate logs with:

- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Datadog**: Parse Pino JSON logs
- **CloudWatch**: AWS CloudWatch Logs
- **New Relic**: Structured logging
- **Splunk**: Log ingestion

Example: Send Pino logs to Datadog:

```javascript
// server/utils/logger.js
const ddTransport = require('pino-datadog')({
  apiKey: process.env.DD_API_KEY,
  service: 'indiegamerhub-api'
});
```

### Metrics & APM

Recommended services:

- **Prometheus** + **Grafana**: Metrics and dashboards
- **New Relic**: APM and monitoring
- **Datadog**: Unified monitoring

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build Docker images
        run: make docker-build
      - name: Push to registry
        run: docker push ${{ secrets.DOCKER_REGISTRY }}/indiegamerhub:latest
      - name: Deploy
        run: docker-compose up -d
```

## 🔐 Secrets Management

### Development

Store in `server/.env` (never commit):

```bash
git add server/.env.example  # ✅ Safe
git add server/.env          # ❌ Dangerous!
```

### Production

Use secret management:

- **AWS Secrets Manager**: Store and rotate secrets
- **GitHub Secrets**: For CI/CD pipelines
- **HashiCorp Vault**: Enterprise secret management
- **Docker Secrets**: For Swarm deployments

Example Docker Secrets:

```bash
echo "mongodb+srv://..." | docker secret create mongo_uri -
docker-compose -f docker-compose.prod.yml config
```

## 📋 Maintenance

### Database Backups

```bash
# Monthly automated backup
0 2 1 * * mongodump --uri="$MONGO_URI" --out=/backups/$(date +%Y%m%d)
```

### Log Rotation

Pino logs in production should be rotated:

```bash
# /etc/logrotate.d/indiegamerhub
/var/log/indiegamerhub/*.log {
  daily
  rotate 14
  compress
  delaycompress
  notifempty
}
```

### Security Updates

- Monitor Node.js LTS releases: https://nodejs.org/en/about/releases/
- Update dependencies: `npm audit fix`
- Review: `npm audit`

## 🐛 Troubleshooting

### Container Won't Start

```bash
docker-compose logs server
# Check environment variables, database connection
```

### Memory Issues

```bash
# Increase Node.js heap size
docker-compose exec server node --max-old-space-size=2048 server.js
```

### Database Connection Failures

```bash
# Test MongoDB connection
docker-compose exec mongodb mongosh -u admin -p
```

### CORS Errors

- Check `CLIENT_URL` environment variable
- Ensure credentials flag is enabled
- Verify preflight requests (OPTIONS)

## ✅ Production Checklist

- [ ] JWT_SECRET is 32+ characters and randomly generated
- [ ] MONGO_URI uses strong authentication
- [ ] LOG_LEVEL set to 'info' or 'warn' (not 'debug')
- [ ] NODE_ENV=production
- [ ] CLIENT_URL is HTTPS and matches your domain
- [ ] SSL certificates configured in Nginx
- [ ] Database backups automated
- [ ] Log aggregation configured
- [ ] Error tracking integrated (Sentry, Rollbar, etc.)
- [ ] Rate limiting configured
- [ ] CORS whitelist matches exact domains
- [ ] All environment variables documented
- [ ] Health checks monitored
- [ ] Scaling strategy tested

---

**Last Updated**: September 2026
**Maintainer**: DevOps Team
