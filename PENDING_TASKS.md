# Pending Tasks - IndieGamerHub Production Launch

**Branch**: feat/production-readiness-fixes
**Status**: Ready for merge (pending 3 blockers)
**Priority Levels**: 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## 🔴 CRITICAL BLOCKERS (Must resolve before shipping)

### 1. Admin Panel Status Clarification
**Impact**: Determines if this is MVP or regression
**Status**: Unknown
**Action Items**:
- [ ] Check git history: was admin panel intentionally removed in commit 8b25413?
  ```bash
  git show 8b25413 -- client/src/pages/AdminPanel.jsx
  ```
- [ ] Ask team: "Was removing games/users tabs intentional?"
- [ ] Decision:
  - **If Intentional**: Document in commit, file backlog ticket for restoration
  - **If Accidental**: Restore tabs in same PR as bug fixes

**Why Blocking**: The council flagged this as *the actual decision gate*. Can't call it production-ready if you don't know if you broke it.

**Time to Resolve**: 15 minutes (one chat/meeting)

---

### 2. Steam API Legal Review
**Impact**: Core data source may violate ToS
**Status**: Not verified
**Action Items**:
- [ ] Read Steam's Terms of Service Section on API usage
  - Link: https://steamcommunity.com/dev/apiterms
- [ ] Confirm: Can you cache their catalog data?
- [ ] Confirm: Can you resell/republish their metadata?
- [ ] If NO: Pivot data strategy (RAWG.io only, or request permission)
- [ ] If YES: Document compliance in codebase

**Why Critical**: If Steam ToS prohibits caching, your entire featured games system violates it. Legal liability. Courts don't care if you didn't know.

**Time to Resolve**: 30-45 minutes (legal review)

---

### 3. Admin Panel Restoration (if accidental deletion)
**Impact**: Admins can't manage games/users
**Status**: Unknown
**Action Items**:
- [ ] Check commit 8b25413 for deleted files
- [ ] If deleted: `git restore <commit>~1 -- client/src/pages/AdminPanel.jsx`
- [ ] Restore games/users management tabs
- [ ] Test admin workflows
- [ ] Commit to this branch

**Why Critical**: Can't ship if core admin features are gone (unless intentional MVP cut).

**Time to Resolve**: 1-2 hours (restore + test)

---

## 🟠 HIGH PRIORITY (Do before merge)

### 4. Dependency Installation
**Impact**: Docker build & local dev won't work
**Status**: Not done
**Action Items**:
```bash
cd server && npm install
cd client && npm install
```
- [ ] Server dependencies installed
- [ ] Client dependencies installed
- [ ] No vulnerabilities: `npm audit`
- [ ] Lock files committed

**Why High**: All infrastructure depends on this. Can't test Docker without it.

**Time to Resolve**: 3-5 minutes (npm install)

---

### 5. Environment Configuration for Docker
**Impact**: docker-compose.yml won't start without .env
**Status**: Not configured
**Action Items**:
```bash
# Create server/.env from example
cp server/.env.example server/.env

# Edit with real values (or stubs for demo):
MONGO_URI=mongodb://admin:password@mongodb:27017/indiegamerhub
JWT_SECRET=$(openssl rand -base64 32)
CLIENT_URL=http://localhost:3000
RAWG_API_KEY=<register at rawg.io>
```
- [ ] server/.env created with valid values
- [ ] MONGO_URI points to MongoDB service
- [ ] JWT_SECRET is 32+ random characters
- [ ] All required vars set

**Why High**: Docker services won't connect without this. Every test depends on it.

**Time to Resolve**: 10 minutes

---

### 6. Docker Image Build & Test
**Impact**: Can't validate Docker works
**Status**: Not built
**Action Items**:
```bash
# Build
make docker-build

# Verify images created
docker images | grep indiegamerhub

# Test individual images
docker build -t test-server ./server
docker build -t test-client ./client
```
- [ ] Images build without errors
- [ ] File sizes reasonable (~200MB server, ~100MB client)
- [ ] No missing dependencies in final images
- [ ] Health checks pass when running

**Why High**: If Docker is broken, entire containerization strategy is broken.

**Time to Resolve**: 5-10 minutes

---

### 7. Local Docker Compose Test
**Impact**: Can't verify end-to-end before production
**Status**: Not tested
**Action Items**:
```bash
# Start services
make docker-up

# Wait 30 seconds for startup
sleep 30

# Test API health
curl http://localhost:5000/api/health

# Test client
curl http://localhost:3000

# Check logs
make logs

# Stop
make docker-down
```
- [ ] All services start (server, client, mongodb)
- [ ] API health endpoint responds
- [ ] Client serves Nginx
- [ ] Database connection works
- [ ] Logs are readable
- [ ] No services crash during startup

**Why High**: This validates the entire production infrastructure works.

**Time to Resolve**: 10 minutes

---

## 🟡 MEDIUM PRIORITY (Do before next release)

### 8. Integration Tests for Bug Fixes
**Impact**: Falsy-zero fixes untested
**Status**: Not written
**Action Items**:
- [ ] Add test: Game with ID 0 renders correctly
- [ ] Add test: Game with 0 reviews shows "0 reviews"
- [ ] Add test: Missing thumbnail shows fallback image
- [ ] Add test: Malformed API response doesn't crash UI
- [ ] Run tests: `npm test`

**Why Medium**: Prevents regressions. But tests can be added after launch.

**Suggested Framework**: 
- **Client**: Vitest or Jest (already in Vite)
- **Server**: Jest + supertest

**Time to Resolve**: 1-2 hours (4-5 tests)

---

### 9. CSP Headers Validation
**Impact**: Security headers might be too permissive or broken
**Status**: Configured but not validated
**Action Items**:
```bash
# Test headers
curl -I http://localhost:5000/api/games

# Check for:
# Content-Security-Policy: ✅
# X-Frame-Options: SAMEORIGIN ✅
# X-Content-Type-Options: nosniff ✅
# Strict-Transport-Security: ✅
```
- [ ] All Helmet headers present
- [ ] CSP doesn't block legitimate requests
- [ ] Test in browser DevTools (Console for CSP violations)
- [ ] No mixed-content warnings (HTTP vs HTTPS)

**Why Medium**: Security is important but can be hardened post-launch.

**Time to Resolve**: 15 minutes

---

### 10. Rate Limiting Configuration
**Impact**: API vulnerable to brute force/DoS
**Status**: Not implemented
**Action Items**:
- [ ] Install: `npm install express-rate-limit`
- [ ] Add middleware in server.js
- [ ] Configure: 100 requests per 15 min per IP
- [ ] Test: `for i in {1..101}; do curl localhost:5000/api/health; done`
- [ ] Expect 429 on 101st request

**Why Medium**: Important for production but not critical for MVP.

**Time to Resolve**: 30 minutes

---

### 11. Database Indexing
**Impact**: Queries might be slow at scale
**Status**: Not optimized
**Action Items**:
- [ ] Create index on User.email (for login speed)
- [ ] Create index on Game.title (for search)
- [ ] Create index on Review.gameId (for game detail page)
- [ ] Test query performance: `db.games.find().explain("executionStats")`

**Why Medium**: Performance optimization. Can be done after launch metrics show need.

**Time to Resolve**: 30 minutes

---

## 🟢 LOW PRIORITY (Nice to have, post-launch)

### 12. Error Tracking Integration
**Status**: Not integrated
**Options**: Sentry, Rollbar, New Relic
**Action Items**:
- [ ] Choose error tracking service
- [ ] Install SDK: `npm install @sentry/node`
- [ ] Initialize in server.js
- [ ] Test: Manually trigger an error, verify in Sentry

**Time to Resolve**: 1 hour

---

### 13. Log Aggregation Setup
**Status**: Logs go to stdout only
**Options**: Datadog, ELK Stack, CloudWatch, Splunk
**Action Items**:
- [ ] Choose log platform
- [ ] Configure Pino transport for production
- [ ] Set up dashboards for common queries
- [ ] Test: Trigger log entry, verify in dashboard

**Time to Resolve**: 2-3 hours

---

### 14. Database Backup Strategy
**Status**: No backups configured
**Action Items**:
- [ ] Schedule MongoDB dumps: `mongodump --uri=...`
- [ ] Configure rotation (keep 14 days)
- [ ] Test restore: `mongorestore --uri=...`
- [ ] Document in runbook

**Time to Resolve**: 1 hour

---

### 15. CI/CD Pipeline
**Status**: No GitHub Actions configured
**Action Items**:
- [ ] Create `.github/workflows/test.yml`
- [ ] Run linter: `npm run lint`
- [ ] Run tests: `npm test`
- [ ] Build Docker images
- [ ] Push to registry (optional)

**Time to Resolve**: 2-3 hours

---

### 16. Performance Monitoring
**Status**: No APM configured
**Options**: New Relic, Datadog APM, Prometheus
**Action Items**:
- [ ] Choose APM tool
- [ ] Install client
- [ ] Configure dashboard: response times, error rates, throughput
- [ ] Set up alerts

**Time to Resolve**: 2 hours

---

### 17. Load Testing
**Status**: Not done
**Tool Options**: k6, Apache JMeter, Artillery
**Action Items**:
```bash
# Example with k6
npm install -g k6
k6 run load-test.js
```
- [ ] Test API under load (100 concurrent users)
- [ ] Measure: response times, error rates, throughput
- [ ] Baseline: Document expected metrics

**Time to Resolve**: 1-2 hours

---

## 📊 Priority Matrix

| Task | Blocker? | Complexity | Time | Do Before Merge? |
|------|----------|-----------|------|-----------------|
| Admin panel clarity | ✅ YES | Low | 15 min | ✅ YES |
| Steam API legal | ✅ YES | Low | 45 min | ✅ YES |
| Admin panel restore | ✅ YES* | Medium | 1-2 hr | ✅ YES (if needed) |
| npm install | 🟠 High | Trivial | 5 min | ✅ YES |
| .env setup | 🟠 High | Trivial | 10 min | ✅ YES |
| Docker build | 🟠 High | Trivial | 10 min | ✅ YES |
| Docker test | 🟠 High | Trivial | 10 min | ✅ YES |
| Integration tests | 🟡 Medium | Medium | 1-2 hr | Later |
| CSP validation | 🟡 Medium | Trivial | 15 min | Later |
| Rate limiting | 🟡 Medium | Medium | 30 min | Later |
| DB indexing | 🟡 Medium | Medium | 30 min | Later |
| Error tracking | 🟢 Low | Medium | 1 hr | Post-launch |
| Log aggregation | 🟢 Low | Medium | 2-3 hr | Post-launch |
| Backups | 🟢 Low | Low | 1 hr | Post-launch |
| CI/CD | 🟢 Low | High | 2-3 hr | Post-launch |
| APM | 🟢 Low | Medium | 2 hr | Post-launch |
| Load testing | 🟢 Low | Medium | 1-2 hr | Post-launch |

---

## 🎯 Recommended Sequence

### Phase 1: Pre-Merge (45 minutes)
```bash
# 1. Resolve blockers (15 min - research/decision)
# 2. Install deps (5 min)
# 3. Create .env (10 min)
# 4. Build Docker (5 min)
# 5. Test Docker (10 min)
```

### Phase 2: Merge & Deploy (30 minutes)
```bash
git checkout main
git merge feat/production-readiness-fixes
git push origin main

# Deploy to staging
make docker-build && make docker-up
```

### Phase 3: Post-Launch (1-2 weeks)
```
Week 1:
- Integrate error tracking (Sentry)
- Wire log aggregation
- Set up monitoring dashboards

Week 2:
- Add integration tests
- Configure rate limiting
- Optimize database indexes
```

---

## ✅ How to Track Progress

Create a branch/PR, use GitHub checklist:

```markdown
## Pre-Merge
- [ ] Admin panel status clarified
- [ ] Steam API legal review passed
- [ ] npm dependencies installed
- [ ] .env configured for Docker
- [ ] Docker images build
- [ ] Docker Compose starts cleanly

## Post-Merge
- [ ] Integration tests added
- [ ] Error tracking live
- [ ] Log aggregation live
- [ ] Load testing baseline documented
```

---

**Last Updated**: September 6, 2026
**Status**: 🟠 Ready for merge after resolving 3 critical blockers
**Estimated Time to Launch**: 1-2 hours total
